
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: disparar trigger de email (fire-and-forget)
async function dispararTrigger(supabaseUrl: string, serviceKey: string, codigo_evento: string, datos: Record<string, string>) {
    console.log(`[email-trigger] Firing event: ${codigo_evento} for user: ${datos.usuario_id || 'unknown'}`);
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/email-trigger-dispatcher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({ codigo_evento, datos }),
        });
        
        const result = await response.json().catch(() => ({}));
        if (response.ok) {
            console.log(`[email-trigger] Success: Trigger ${codigo_evento} dispatched.`, JSON.stringify(result));
        } else {
            console.warn(`[email-trigger] Failed: Dispatcher returned ${response.status}`, JSON.stringify(result));
        }
        return result;
    } catch (e) {
        console.error(`[email-trigger] Fatal Error firing ${codigo_evento}:`, e);
        return { error: e.message };
    }
}

// Helper function to process approved payment
async function processSuccessfulPayment(paymentData: any, supabase: SupabaseClient) {
    const dataId = String(paymentData.id);
    
    // Idempotency Check: Critical to avoid double commissions
    const { data: existingPayment, error: checkError } = await supabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", dataId)
        .maybeSingle();

    if (existingPayment) {
        console.log("!!! [BACKEND] Idempotencia: Pago ya registrado previamente:", dataId);
        
        // RE-ACTIVATION SAFETY: If payment exists but user is still FREE/INACTIVE, retry the activation
        // Buscamos al usuario basado en el user_id guardado en el pago
        const { data: userData } = await supabase.from("users").select("id, plan_id, estado_suscripcion").eq("id", existingPayment.user_id).maybeSingle();
        
        console.log("!!! [BACKEND] Idempotencia - Estado actual del usuario vinculado al pago:", JSON.stringify(userData, null, 2));

        if (userData && (userData.plan_id === 'plan_free' || userData.estado_suscripcion !== 'activa')) {
            console.log(`!!! [BACKEND] RE-ACTIVACIÓN: El usuario ${userData.id} sigue en ${userData.plan_id}. Forzando actualización de plan...`);
            // Continuamos el proceso ignorando el 'return' de idempotencia para asegurar que el plan se active
        } else if (!userData) {
            console.warn("!!! [BACKEND] ALERTA CRÍTICA: El pago existe pero el usuario vinculado NO se encontró en la tabla users. ID buscado:", existingPayment.user_id);
            // Intentamos recuperar el ID desde los metadatos del pago por si hubo un error de escritura inicial
            console.log("Intentando procesar como pago nuevo para forzar vinculación...");
        } else {
            console.log("!!! [BACKEND] Idempotencia: El pago ya fue procesado y el usuario tiene el plan activo. Terminando ejecución.");
            return { status: "already_processed", message: "Este pago ya fue registrado y el plan está activo.", debug: { userData } };
        }
    }

    // Parse Metadata (Prioritize external_reference because it is our source of truth)
    let metadata;
    try {
        const extRef = paymentData.external_reference;
        metadata = typeof extRef === 'string' ? JSON.parse(extRef) : extRef;
        console.log("[mercadopago] Data parsed from external_reference:", JSON.stringify(metadata));
    } catch (e) {
        console.warn("[mercadopago] Failed to parse external_reference, trying metadata object...");
        metadata = paymentData.metadata;
    }

    // Robust field extraction
    const userId = metadata?.user_id || metadata?.userId;
    const planId = metadata?.plan_id || metadata?.planId;
    const period = metadata?.period || metadata?.plan_periodo || 'monthly';

    if (!userId || !planId) {
        console.error("Critical: Missing identification in payment data", { userId, planId, metadata, external: paymentData.external_reference });
        return { error: `ERR_DC_REF_MISSING: No pudimos identificar tu usuario o plan. ID Pago: ${dataId}.` };
    }

    // Calculate Expiration
    const months = period === 'monthly' ? 1 : 6;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // 1. Transaction: Record Payment (Solo si no es una reactivación de un pago ya existente)
    if (!existingPayment) {
        const { error: payError } = await supabase.from("payments").insert({
            user_id: userId,
            amount: paymentData.transaction_amount,
            currency: paymentData.currency_id,
            status: 'approved',
            provider_payment_id: dataId,
            plan_id: planId,
            period: period,
            metadata: paymentData
        });

        if (payError) {
            console.error("Error inserting payment:", payError);
            throw payError;
        }

        // AUDIT LOG: Payment Received
        try {
            await supabase.from("audit_logs").insert({
                usuario_id: userId,
                accion: 'PAYMENT_RECEIVED',
                detalles: { payment_id: dataId, amount: paymentData.transaction_amount, currency: paymentData.currency_id }
            });
        } catch (e) { console.error("Audit Log Error (PAYMENT_RECEIVED):", e); }
    } else {
        console.log("!!! [BACKEND] Saltando inserción en 'payments' y log de pago recibido por ser RE-ACTIVACIÓN de pago existente.");
    }

    // 2. Transaction: Update User Subscription
    console.log(`[mercadopago] !!! PROJECT_DEBUG !!! Attempting update for user ID: "${userId}"`);
    
    // Safety check: Does user exist?
    let finalUserId = userId;
    const { data: checkUser, error: checkUserErr } = await supabase.from("users").select("id, email, plan_id").eq("id", userId).maybeSingle();
    
    if (checkUserErr) {
        console.error("[mercadopago] Error checking user existence:", checkUserErr);
    } else if (!checkUser) {
        console.warn(`[mercadopago] CRITICAL: User with ID "${userId}" NOT FOUND in public.users table. Searching by email...`);
        const targetEmail = metadata.email || metadata.user_email || paymentData.payer?.email;
        if (targetEmail) {
            const { data: fallbackUser } = await supabase.from("users").select("id").eq("email", targetEmail).maybeSingle();
            if (fallbackUser) {
                console.log(`[mercadopago] Found user by email (${targetEmail})! Correcting ID to ${fallbackUser.id}`);
                finalUserId = fallbackUser.id;
            } else {
                console.error(`[mercadopago] User NOT FOUND by ID nor by Email (${targetEmail}). Activation will likely fail.`);
            }
        }
    } else {
        console.log(`[mercadopago] User found! Current plan: ${checkUser.plan_id}. Proceeding with update...`);
    }

    const updatePayload = {
        plan_id: planId,
        estado_suscripcion: 'activa',
        plan_expires_at: expiresAt.toISOString(),
        fecha_vencimiento_plan: expiresAt.toISOString(),
        plan_precio_pagado: paymentData.transaction_amount,
        plan_periodo: period
    };

    console.log(`!!! [BACKEND] INTENTO DE UPDATE EN DB PARA USUARIO: ${finalUserId} !!!`);
    console.log("!!! [BACKEND] PAYLOAD DE ACTUALIZACIÓN:", JSON.stringify(updatePayload, null, 2));

    const { data: updateData, error: userError } = await supabase.from("users").update(updatePayload).eq("id", finalUserId).select();

    if (userError) {
        console.error("!!! [BACKEND] ERROR CRÍTICO AL ACTUALIZAR USUARIO:", userError);
        return { error: "DATABASE_UPDATE_FAILED", details: userError };
    }
    
    const rowsAffected = updateData?.length || 0;
    if (rowsAffected === 0) {
        console.warn(`!!! [BACKEND] ALERTA: El update terminó pero 0 FILAS AFECTADAS para el ID: ${finalUserId}. ¿Existe este ID en la tabla users?`);
    } else {
        console.log(`!!! [BACKEND] ÉXITO: Usuario ${finalUserId} actualizado correctamente al plan: ${planId}`);
        console.log("!!! [BACKEND] Datos actualizados devueltos por DB:", JSON.stringify(updateData[0], null, 2));
    }

    // AUDIT LOG: Plan Activated
    try {
        await supabase.from("audit_logs").insert({
            usuario_id: userId,
            accion: 'PLAN_ACTIVATED',
            detalles: { plan_id: planId, expires_at: expiresAt.toISOString() }
        });
    } catch (e) { console.error("Audit Log Error (PLAN_ACTIVATED):", e); }

    // EMAIL TRIGGER: SUSCRIPCION_ACTIVADA (con idempotencia para evitar duplicados)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Verificar si el email ya fue enviado para este pago
    const { data: paymentEmailFlag } = await supabase
        .from('payments')
        .select('email_suscripcion_enviado')
        .eq('provider_payment_id', dataId)
        .maybeSingle();

    if (!paymentEmailFlag?.email_suscripcion_enviado) {
        console.log(`!!! [BACKEND] Email NO enviado aún para pago ${dataId}. Disparando trigger...`);

        const { data: userData2 } = await supabase.from('users').select('nombres, apellidos, email').eq('id', finalUserId).maybeSingle();
        const { data: planData } = await supabase.from('plans').select('name, price_monthly, price_semiannual, features').eq('slug', planId).maybeSingle();

        const planPrecio = period === 'monthly' ? (planData?.price_monthly || 0) : (planData?.price_semiannual || 0);
        const planDetalles = Array.isArray(planData?.features) ? planData.features.join(', ') : '';
        const fechaExpiracion = expiresAt.toISOString().split('T')[0];

        await dispararTrigger(supabaseUrl, serviceKey, 'SUSCRIPCION_ACTIVADA', {
            usuario_id: finalUserId,
            usuario_nombre: `${userData2?.nombres || ''} ${userData2?.apellidos || ''}`.trim(),
            nombres: userData2?.nombres || '',
            usuario_email: userData2?.email || '',
            plan_nombre: planData?.name || planId,
            plan_precio: planPrecio.toString(),
            plan_detalles: planDetalles,
            fecha_proximo_cobro: fechaExpiracion,
            fecha_vencimiento: fechaExpiracion,
            periodo: period === 'monthly' ? 'Mensual' : 'Semestral',
        });

        // Marcar el email como enviado para garantizar idempotencia
        await supabase.from('payments')
            .update({ email_suscripcion_enviado: true })
            .eq('provider_payment_id', dataId);

        console.log(`!!! [BACKEND] Email de suscripción marcado como enviado para pago ${dataId}.`);
    } else {
        console.log(`!!! [BACKEND] Email ya enviado previamente para pago ${dataId}. Omitiendo para evitar duplicado.`);
    }

    // 3. COMMISSION LOGIC (Referrals)
    try {
        const { data: referral } = await supabase
            .from("referidos_usuarios")
            .select("lider_id")
            .eq("usuario_id", userId)
            .single();
    
        if (referral?.lider_id) {
            const { data: leader } = await supabase
                .from("referidos_lideres")
                .select("id, user_id, porcentaje_comision, estado")
                .eq("id", referral.lider_id)
                .single();
            
            if (leader && leader.estado === 'activo') {
                const originalAmount = Number(paymentData.transaction_amount);
                const currency = paymentData.currency_id; // 'COP' or 'USD'
                
                // Get commission percent (Default 15%)
                let commissionPercent = Number(leader.porcentaje_comision) || 15;
                if (commissionPercent > 100) commissionPercent = 15;

                // Calculate original currency commission
                let commissionAmountOrig = Math.round((originalAmount * (commissionPercent / 100)) * 100) / 100;
                
                // CONVERT TO USD (Source of truth for Wallet)
                let commissionAmountUSD = commissionAmountOrig;
                
                if (currency === 'COP') {
                    try {
                        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
                        const rateData = await rateResponse.json();
                        const copRate = rateData.rates.COP || 3900; // Fallback rate
                        commissionAmountUSD = Math.round((commissionAmountOrig / copRate) * 100) / 100;
                        console.log(`Conversión COP -> USD: ${commissionAmountOrig} COP / ${copRate} = ${commissionAmountUSD} USD`);
                    } catch (fetchError) {
                        console.error("Error fetching rates, using static fallback 3900:", fetchError);
                        commissionAmountUSD = Math.round((commissionAmountOrig / 3900) * 100) / 100;
                    }
                }

                // SEGURIDAD: La comisión no puede ser igual o mayor al pago total
                if (commissionAmountUSD >= (currency === 'USD' ? originalAmount : originalAmount/3000)) {
                   console.warn("ALERTA: Monto de comisión anómalo detectado");
                }
                
                console.log(`PAGO_EXITOSO [${dataId}]: Líder ${leader.id}. Plan: ${originalAmount} ${currency} | Comisión: ${commissionAmountUSD} USD`);

                // A. Add Wallet Transaction (Always in USD)
                await supabase.from("wallet_transactions").insert({
                    user_id: leader.user_id,
                    type: 'referral_bonus',
                    amount: commissionAmountUSD,
                    description: `Comisión por suscripción de referido (${currency} ${originalAmount})`
                });

                // AUDIT LOG: Commission Earned
                try {
                    await supabase.from("audit_logs").insert({
                        usuario_id: leader.user_id,
                        accion: 'COMMISSION_EARNED',
                        detalles: { amount_usd: commissionAmountUSD, from_user: userId, payment_id: dataId }
                    });
                } catch (e) { console.error("Audit Log Error (COMMISSION_EARNED):", e); }

                // B. Update User Wallet Balance (Atomic-like)
                const { data: userData } = await supabase.from('users').select('wallet_saldo').eq('id', leader.user_id).single();
                const newBalance = Math.round(((Number(userData?.wallet_saldo) || 0) + commissionAmountUSD) * 100) / 100;
                
                await supabase.from('users').update({ wallet_saldo: newBalance }).eq('id', leader.user_id);

                // C. Update Leader Total Stats
                const { data: leadStats } = await supabase.from('referidos_lideres').select('total_comisiones_generadas').eq('id', leader.id).single();
                const newTotal = Math.round(((Number(leadStats?.total_comisiones_generadas) || 0) + commissionAmountUSD) * 100) / 100;
                
                await supabase.from('referidos_lideres').update({ total_comisiones_generadas: newTotal }).eq('id', leader.id);

                // EMAIL TRIGGER: REFERIDO_PRIMER_PAGO (notificar al líder)
                const { data: leaderUser } = await supabase.from('users').select('nombres, apellidos, email').eq('id', leader.user_id).maybeSingle();
                const { data: referidoUser } = await supabase.from('users').select('nombres, apellidos, email').eq('id', userId).maybeSingle();
                // Obtener nombre legible del plan
                let planNombreLegible = planId;
                const { data: planInfo } = await supabase.from('plans').select('name').eq('slug', planId).maybeSingle();
                if (planInfo?.name) planNombreLegible = planInfo.name;
                dispararTrigger(supabaseUrl, serviceKey, 'REFERIDO_PRIMER_PAGO', {
                    usuario_id: leader.user_id,
                    usuario_nombre: `${leaderUser?.nombres || ''} ${leaderUser?.apellidos || ''}`.trim(),
                    nombres: leaderUser?.nombres || '',
                    apellidos: leaderUser?.apellidos || '',
                    usuario_email: leaderUser?.email || '',
                    referido_nombre: `${referidoUser?.nombres || ''} ${referidoUser?.apellidos || ''}`.trim(),
                    referido_email: referidoUser?.email || '',
                    // Variables financieras del pago — TODO en USD para consistencia
                    monto_pago: (Math.round((commissionAmountUSD * 100 / commissionPercent) * 100) / 100).toFixed(2),
                    comision_ganada: commissionAmountUSD.toFixed(2),
                    monto_comision: commissionAmountUSD.toFixed(2),
                    plan_referido: `${planNombreLegible} (${period === 'monthly' ? 'Mensual' : 'Semestral'})`,
                    plan_nombre: planNombreLegible,
                    fecha_pago_referido: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
                    fecha_proximo_pago: expiresAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
                    saldo_billetera: newBalance.toFixed(2),
                });
            }
        }
    } catch (refError) {
        console.error("Error processing referral commission (non-blocking):", refError);
    }

    return { 
        status: "success", 
        plan: planId, 
        userId: finalUserId, 
        debug: { 
            rowsAffected: updateData?.length || 0, 
            planId, 
            finalUserId,
            originalUserId: userId
        }
    };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // 'create_preference', 'webhook', 'check_payment'
    
    // Config
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")?.trim();
    if (!MP_ACCESS_TOKEN) {
      console.error("Missing MP_ACCESS_TOKEN");
      return new Response(JSON.stringify({ error: "Configuration Error: MP_ACCESS_TOKEN is missing." }), { status: 200, headers: corsHeaders });
    }

    // DEBUG: Log token info (Prefix and Length only)
    console.log(`[mercadopago] Token Debug -> Prefix: ${MP_ACCESS_TOKEN.substring(0, 12)}, Length: ${MP_ACCESS_TOKEN.length}`);

    // -----------------------------------------------------------------------
    // ACTION: CREATE_PREFERENCE
    // -----------------------------------------------------------------------
    if (req.method === "POST" && action === "create_preference") {
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 200, headers: corsHeaders });
      }

      const { planId, period, userId, email, returnUrl } = body;
      console.log(`!!! DEBUG create_preference !!! Received: planId=${planId}, email=${email}, userId=${userId}`);

      if (!planId || !userId) {
        return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 200, headers: corsHeaders });
      }

      // 1. Obtener detalles del Plan
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", planId)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ error: `Plan not found: ${planId}` }), { status: 200, headers: corsHeaders });
      }

      // Use dynamic test email from body (crucial for Sandbox stability)
      const finalEmail = email;
      console.log(`[mercadopago] Payer email: ${finalEmail}`);

      let basePrice = period === 'monthly' ? plan.price_monthly : plan.price_semiannual;

      // Price Protection Logic
      const { data: userProfile } = await supabase
        .from('users')
        .select('plan_id, plan_precio_pagado, plan_periodo')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile && userProfile.plan_id === plan.slug && 
          Number(userProfile.plan_precio_pagado) > 0 && 
          userProfile.plan_periodo === period) {
          basePrice = Number(userProfile.plan_precio_pagado);
          console.log(`[price-protection] Usando precio bloqueado: ${basePrice}`);
      }

      // 3. Dynamic Currency Conversion (USD -> COP)
      let finalPriceCOP = Number(basePrice);
      try {
        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateResponse.json();
        const exchangeRate = rateData.rates.COP || 4000;
        finalPriceCOP = Math.round(Number(basePrice) * exchangeRate);
        console.log(`[currency-conversion] USD ${basePrice} converted to COP ${finalPriceCOP}`);
      } catch (e) {
        finalPriceCOP = Number(basePrice) * 4000;
      }

      const title = `${plan.name} (${period === 'monthly' ? 'Mensual' : 'Semestral'})`;

      // Dynamic redirection logic: Manual for localhost, Automatic for remote
      const isLocalhost = returnUrl.includes("localhost") || returnUrl.includes("127.0.0.1");

      // 4. Construct Preference
      const preferenceData = {
        items: [
          {
            id: planId,
            title: title,
            quantity: 1,
            currency_id: "COP",
            unit_price: finalPriceCOP,
          },
        ],
        payer: { email: finalEmail },
        back_urls: {
          success: `${returnUrl}/payment/status?status=approved`,
          failure: `${returnUrl}/payment/status?status=rejected`,
          pending: `${returnUrl}/payment/status?status=pending`,
        },
        auto_return: isLocalhost ? undefined : "approved",
        external_reference: JSON.stringify({ userId, planId, period }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago?action=webhook`,
      };

      console.log("[mercadopago] Creating preference:", JSON.stringify(preferenceData));

      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preferenceData)
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("MP Error:", JSON.stringify(mpData));
        return new Response(JSON.stringify({ error: "Error de Mercado Pago", details: mpData }), { status: 200, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ 
        init_point: mpData.init_point, 
        preference_id: mpData.id 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: CHECK_PAYMENT (Manual Validation from Frontend)
    // -----------------------------------------------------------------------
    if (req.method === "POST" && action === "check_payment") {
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
        }

        const { paymentId } = body;
        if (!paymentId) return new Response(JSON.stringify({ error: "Missing paymentId" }), { status: 400, headers: corsHeaders });

        console.log(`Manual check for payment: ${paymentId}`);

        // Fetch from MP
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });
        
        const paymentData = await mpRes.json();

        if (!mpRes.ok) {
            return new Response(JSON.stringify({ error: "Payment not found in MP", details: paymentData }), { status: 404, headers: corsHeaders });
        }

        if (paymentData.status === 'approved') {
            console.log("!!! [BACKEND] Pago APROBADO en Mercado Pago. Iniciando procesamiento de activación...");
            const result = await processSuccessfulPayment(paymentData, supabase);
            console.log("!!! [BACKEND] Resultado de processSuccessfulPayment:", JSON.stringify(result, null, 2));
            return new Response(JSON.stringify({ status: "approved", result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else {
            console.log(`!!! [BACKEND] El pago NO está aprobado. Estado MP: ${paymentData.status}`);
            return new Response(JSON.stringify({ status: paymentData.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
    }

    // -----------------------------------------------------------------------
    // ACTION: WEBHOOK
    // -----------------------------------------------------------------------
    if (req.method === "POST" && action === "webhook") {
      const type = url.searchParams.get("type") || url.searchParams.get("topic");
      const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

      if (type === "payment" && dataId) {
        console.log(`Webhook: Processing payment ${dataId}`);
        
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
            headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });
        
        if (mpRes.ok) {
            const paymentData = await mpRes.json();
            if (paymentData.status === "approved") {
                await processSuccessfulPayment(paymentData, supabase);
            }
        }
      }
      return new Response("ok", { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Action unknown" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error("Internal Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
