
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

    // Parse Metadata (external_reference is our source of truth)
    let metadata;
    try {
        const extRef = paymentData.external_reference;
        metadata = typeof extRef === 'string' ? JSON.parse(extRef) : extRef;
        console.log("[mercadopago] external_reference parsed:", JSON.stringify(metadata));
    } catch (e) {
        console.warn("[mercadopago] external_reference parse failed, fallback to metadata object");
        metadata = paymentData.metadata;
    }

    const userId = metadata?.user_id || metadata?.userId;
    const planId = metadata?.plan_id || metadata?.planId;
    const period = metadata?.period || metadata?.plan_periodo || 'monthly';

    if (!userId || !planId) {
        console.error("Critical: Missing userId or planId", { userId, planId, metadata });
        return { error: `ERR_DC_REF_MISSING: No pudimos identificar tu usuario o plan. ID Pago: ${dataId}.` };
    }

    // Calculate Expiration
    const months = period === 'monthly' ? 1 : 6;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // ─────────────────────────────────────────────────────────────────────────
    // IDEMPOTENCIA ATÓMICA: Intentamos insertar el pago.
    // La restricción UNIQUE en provider_payment_id garantiza que si dos webhooks
    // llegan simultáneamente, solo UNO tendrá éxito. El otro retornará null.
    // ─────────────────────────────────────────────────────────────────────────
    const { data: insertedPayment, error: payError } = await supabase
        .from("payments")
        .upsert({
            user_id: userId,
            amount: paymentData.transaction_amount,
            currency: paymentData.currency_id,
            status: 'approved',
            provider_payment_id: dataId,
            plan_id: planId,
            period: period,
            metadata: paymentData
        }, { onConflict: 'provider_payment_id', ignoreDuplicates: true })
        .select("id")
        .maybeSingle();

    if (payError) {
        console.error("!!! [BACKEND] Error en upsert de pago:", payError);
        throw payError;
    }

    if (!insertedPayment) {
        // Este webhook llegó tarde — otro ya procesó este pago
        console.log(`!!! [BACKEND] IDEMPOTENCIA: Pago ${dataId} ya fue procesado por otra ejecución. Descartando duplicado.`);
        return { status: "already_processed", message: "Este pago ya fue registrado." };
    }

    console.log(`!!! [BACKEND] NUEVO PAGO registrado correctamente. ID interno: ${insertedPayment.id}. Procediendo con activación...`);

    // AUDIT LOG: Payment Received
    try {
        await supabase.from("audit_logs").insert({
            usuario_id: userId,
            accion: 'PAYMENT_RECEIVED',
            detalles: { payment_id: dataId, amount: paymentData.transaction_amount, currency: paymentData.currency_id }
        });
    } catch (e) { console.error("Audit Log Error (PAYMENT_RECEIVED):", e); }


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

    // EMAIL TRIGGER: SUSCRIPCION_ACTIVADA
    // La idempotencia atómica del upsert garantiza que solo llegamos aquí UNA vez por pago.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const { data: userData2 } = await supabase.from('users').select('nombres, apellidos, email').eq('id', finalUserId).maybeSingle();
    const { data: planData } = await supabase.from('plans').select('name, price_monthly, price_semiannual, features').eq('slug', planId).maybeSingle();

    const planPrecio = period === 'monthly' ? (Number(planData?.price_monthly) || 0) : (Number(planData?.price_semiannual) || 0);
    const planDetalles = Array.isArray(planData?.features) ? planData.features.join(', ') : '';
    const fechaExpiracion = expiresAt.toISOString().split('T')[0];

    console.log(`!!! [BACKEND] Disparando email SUSCRIPCION_ACTIVADA. Plan: ${planData?.name}, Precio: ${planPrecio}, Email: ${userData2?.email}`);

    await dispararTrigger(supabaseUrl, serviceKey, 'subscription_activated', {
        usuario_id: finalUserId,
        usuario_nombre: `${userData2?.nombres || ''} ${userData2?.apellidos || ''}`.trim(),
        nombres: userData2?.nombres || '',
        usuario_email: userData2?.email || '',
        plan_nombre: planData?.name || planId,
        plan_precio: String(planPrecio),
        plan_detalles: planDetalles,
        fecha_proximo_cobro: fechaExpiracion,
        fecha_vencimiento: fechaExpiracion,
        periodo: period === 'monthly' ? 'Mensual' : 'Semestral',
    });

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
                dispararTrigger(supabaseUrl, serviceKey, 'referral_first_payment', {
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

// Helper: Procesar carga de créditos
// IMPORTANTE: Los créditos IA se almacenan en 'user_credits', NO en 'wallet_saldo' (billetera de dinero real)
// Las transacciones de créditos van a 'credit_transactions', NO a 'wallet_transactions' (esa es solo para comisiones)
async function processCreditPurchase(userId: string, credits: number, amountUsd: number, amountCop: number, paymentId: string, supabase: SupabaseClient) {
    console.log(`[credits] Procesando recarga de ${credits} créditos para usuario ${userId}. USD: ${amountUsd}, COP: ${amountCop}`);
    
    // 1. Upsert en user_credits (tabla dedicada para créditos IA)
    const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('credits, total_spent_usd')
        .eq('usuario_id', userId)
        .maybeSingle();

    const currentCredits = existingCredits?.credits ?? 0;
    const currentSpent = Number(existingCredits?.total_spent_usd ?? 0);
    const newCredits = currentCredits + credits;
    const newSpent = Math.round((currentSpent + amountUsd) * 100) / 100;

    const { error: upsertError } = await supabase
        .from('user_credits')
        .upsert({
            usuario_id: userId,
            credits: newCredits,
            total_spent_usd: newSpent,
            updated_at: new Date().toISOString()
        }, { onConflict: 'usuario_id' });

    if (upsertError) {
        console.error('[credits] Error al actualizar user_credits:', upsertError);
        throw upsertError;
    }

    // 2. Registrar en credit_transactions (historial de créditos IA - tabla dedicada)
    // NO usar wallet_transactions (esa es exclusiva para comisiones de referidos)
    await supabase.from("credit_transactions").insert({
        usuario_id: userId,
        tipo: 'purchase',
        credits_amount: credits,
        cost_usd: amountUsd,
        mercado_pago_transaction_id: paymentId,
        notes: `Recarga: +${credits} CR ($${amountUsd} USD / ${amountCop} COP)`
    });

    // 3. Audit Log (con entidad para que aparezca en el historial de actividad del usuario)
    await supabase.from("audit_logs").insert({
        usuario_id: userId,
        accion: 'CREDITS_PURCHASED',
        entidad: 'CREDITS',
        detalles: { credits, amount_usd: amountUsd, amount_cop: amountCop, payment_id: paymentId, new_balance: newCredits }
    });

    console.log(`[credits] Recarga exitosa. Saldo anterior: ${currentCredits}, Nuevo: ${newCredits}`);
    return { status: "success", newBalance: newCredits };
}

async function processIncomingPayment(paymentData: any, supabase: SupabaseClient) {
    let metadata;
    try {
        const extRef = paymentData.external_reference;
        metadata = typeof extRef === 'string' ? JSON.parse(extRef) : extRef;
    } catch (e) {
        metadata = paymentData.metadata;
    }

    if (metadata?.type === 'credits') {
        const userId = metadata.userId || metadata.user_id;
        const credits = Number(metadata.credits);
        const amountUsd = Number(metadata.amount_usd || metadata.amount);
        const amountCop = Number(metadata.amount_cop || paymentData.transaction_amount || 0);
        return await processCreditPurchase(userId, credits, amountUsd, amountCop, String(paymentData.id), supabase);
    } else {
        return await processSuccessfulPayment(paymentData, supabase);
    }
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

      const { planId, period, userId, email, returnUrl, type, credits, amountUSD, amountCOP } = body;
      
      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId." }), { status: 200, headers: corsHeaders });
      }

      let finalPriceCOP = 0;
      let title = "";
      let extRefData: any = { userId };

      if (type === 'credits') {
          // Recarga de créditos
          title = `Recarga de ${credits} DropCredits`;
          const basePriceUSD = Number(amountUSD);
          
          if (amountCOP) {
              finalPriceCOP = Math.round(Number(amountCOP));
          } else {
              try {
                const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
                const rateData = await rateResponse.json();
                const exchangeRate = rateData.rates.COP || 4000;
                finalPriceCOP = Math.round(basePriceUSD * exchangeRate);
              } catch (e) {
                finalPriceCOP = basePriceUSD * 4000;
              }
          }

          extRefData = { ...extRefData, type: 'credits', credits, amount_usd: basePriceUSD, amount_cop: finalPriceCOP };
      } else {
          // Suscripción de plan (comportamiento original)
          if (!planId) return new Response(JSON.stringify({ error: "Missing planId." }), { status: 200, headers: corsHeaders });

          const { data: plan, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("slug", planId)
            .single();

          if (planError || !plan) {
            return new Response(JSON.stringify({ error: `Plan not found: ${planId}` }), { status: 200, headers: corsHeaders });
          }

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
          }

          try {
            const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
            const rateData = await rateResponse.json();
            const exchangeRate = rateData.rates.COP || 4000;
            finalPriceCOP = Math.round(Number(basePrice) * exchangeRate);
          } catch (e) {
            finalPriceCOP = Number(basePrice) * 4000;
          }

          title = `${plan.name} (${period === 'monthly' ? 'Mensual' : 'Semestral'})`;
          extRefData = { ...extRefData, planId, period };
      }

      // Dynamic redirection logic: Manual for localhost, Automatic for remote
      const isLocalhost = returnUrl.includes("localhost") || returnUrl.includes("127.0.0.1");

      const preferenceData = {
        items: [
          {
            id: type === 'credits' ? 'credits-recharge' : planId,
            title: title,
            quantity: 1,
            currency_id: "COP",
            unit_price: finalPriceCOP,
          },
        ],
        payer: { email },
        back_urls: {
          success: `${returnUrl}/payment/status?status=approved`,
          failure: `${returnUrl}/payment/status?status=rejected`,
          pending: `${returnUrl}/payment/status?status=pending`,
        },
        auto_return: isLocalhost ? undefined : "approved",
        external_reference: JSON.stringify(extRefData),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago?action=webhook`,
      };

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
    // ACTION: ADMIN_RECHARGE (Direct Credits Bypass)
    // -----------------------------------------------------------------------
    if (req.method === "POST" && action === "admin_recharge") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

      // Validar usuario mediante JWT
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

      // Verificar rol (SÓLO admin o superadmin)
      const { data: dbUser } = await supabase.from('users').select('rol').eq('id', user.id).single();
      if (!dbUser || (dbUser.rol !== 'admin' && dbUser.rol !== 'superadmin')) {
          return new Response("Forbidden: Only admins can perform direct recharges", { status: 403, headers: corsHeaders });
      }

      const { targetUserId, credits } = await req.json();
      if (!targetUserId || !credits) return new Response("Missing targetUserId or credits", { status: 400, headers: corsHeaders });

      const result = await processCreditPurchase(targetUserId, credits, 0, 0, "ADMIN_BYPASS_" + Date.now(), supabase);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
            const result = await processIncomingPayment(paymentData, supabase);
            console.log("!!! [BACKEND] Resultado de processIncomingPayment:", JSON.stringify(result, null, 2));
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
                await processIncomingPayment(paymentData, supabase);
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
