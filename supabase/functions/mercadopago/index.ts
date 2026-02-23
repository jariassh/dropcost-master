
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: disparar trigger de email (fire-and-forget)
async function dispararTrigger(supabaseUrl: string, serviceKey: string, codigo_evento: string, datos: Record<string, string>) {
    try {
        await fetch(`${supabaseUrl}/functions/v1/email-trigger-dispatcher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({ codigo_evento, datos }),
        });
    } catch (e) {
        console.error(`[email-trigger] Error disparando ${codigo_evento}:`, e);
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
        console.log("PAYMENT_ALREADY_PROCESSED: Skipping to avoid duplicate commissions for ID:", dataId);
        return { status: "already_processed", message: "Este pago ya fue registrado anteriormente." };
    }

    // Parse Metadata
    let metadata;
    try {
        metadata = typeof paymentData.external_reference === 'string' 
            ? JSON.parse(paymentData.external_reference) 
            : paymentData.external_reference;
    } catch (e) {
        console.error("Error parsing metadata:", e);
        // Fallback for empty metadata cases (should not happen if flow is correct)
        return { error: "Invalid metadata in payment" };
    }

    if (!metadata || !metadata.userId || !metadata.planId) {
        console.error("Missing metadata required fields:", metadata);
        return { error: "Missing metadata (userId/planId)" }; 
    }

    const { userId, planId, period } = metadata;

    // Calculate Expiration
    const months = period === 'monthly' ? 1 : 6;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // 1. Transaction: Record Payment
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
    await supabase.from("audit_logs").insert({
        usuario_id: userId,
        accion: 'PAYMENT_RECEIVED',
        detalles: { payment_id: dataId, amount: paymentData.transaction_amount, currency: paymentData.currency_id }
    }).catch(e => console.error("Audit Log Error:", e));

    // 2. Transaction: Update User Subscription
    const { error: userError } = await supabase.from("users").update({
        plan_id: planId,
        estado_suscripcion: 'activa',
        plan_expires_at: expiresAt.toISOString(),
        plan_precio_pagado: paymentData.transaction_amount, // Mantener el precio pagado para protección futura
        plan_periodo: period
    }).eq("id", userId);

    if (userError) {
        console.error("Error updating user:", userError);
        throw userError;
    }

    // AUDIT LOG: Plan Activated
    await supabase.from("audit_logs").insert({
        usuario_id: userId,
        accion: 'PLAN_ACTIVATED',
        detalles: { plan_id: planId, expires_at: expiresAt.toISOString() }
    }).catch(e => console.error("Audit Log Error:", e));

    // EMAIL TRIGGER: SUSCRIPCION_ACTIVADA
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const { data: userData2 } = await supabase.from('users').select('nombres, apellidos, email').eq('id', userId).maybeSingle();
    dispararTrigger(supabaseUrl, serviceKey, 'SUSCRIPCION_ACTIVADA', {
        usuario_id: userId,
        usuario_nombre: `${userData2?.nombres || ''} ${userData2?.apellidos || ''}`.trim(),
        usuario_email: userData2?.email || '',
        plan_nombre: planId,
        fecha_vencimiento: expiresAt.toISOString().split('T')[0],
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
                await supabase.from("audit_logs").insert({
                    usuario_id: leader.user_id,
                    accion: 'COMMISSION_EARNED',
                    detalles: { amount_usd: commissionAmountUSD, from_user: userId, payment_id: dataId }
                }).catch(e => console.error("Audit Log Error:", e));

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

    return { status: "processed" };
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
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      console.error("Missing MP_ACCESS_TOKEN");
      return new Response(JSON.stringify({ error: "Configuration Error: MP_ACCESS_TOKEN is missing." }), { status: 200, headers: corsHeaders });
    }

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

      if (!planId || !period || !userId || !returnUrl) {
        return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 200, headers: corsHeaders });
      }

      // Get Plan and User Details
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", planId)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ error: `Plan not found: ${planId}` }), { status: 200, headers: corsHeaders });
      }

      // Fetch user profile for Price Protection
      const { data: userProfile } = await supabase
        .from('users')
        .select('plan_id, plan_precio_pagado, plan_periodo')
        .eq('id', userId)
        .maybeSingle();

      let price = period === 'monthly' ? plan.price_monthly : plan.price_semiannual;

      // Price Protection Logic: Si el usuario ya está en este plan y periodo, usar su precio bloqueado
      if (userProfile && userProfile.plan_id === plan.slug && 
          Number(userProfile.plan_precio_pagado) > 0 && 
          userProfile.plan_periodo === period) {
          
          console.log(`[price-protection] Aplicando precio bloqueado para usuario ${userId}: ${userProfile.plan_precio_pagado}`);
          price = Number(userProfile.plan_precio_pagado);
      }

      // Dynamic Currency Conversion (USD -> COP)
      let finalPrice = Number(price);
      let exchangeRate = 1;
      
      try {
        console.log(`[currency-conversion] Fetching rates for USD...`);
        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateResponse.json();
        exchangeRate = rateData.rates.COP || 4000;
        
        // Convert to COP (Mercado Pago Colombia requires COP)
        finalPrice = Math.round(finalPrice * exchangeRate);
        console.log(`[currency-conversion] Converted USD ${price} to COP ${finalPrice} (Rate: ${exchangeRate})`);
      } catch (conversionError) {
        console.error("Error fetching exchange rates, using fallback 4000:", conversionError);
        finalPrice = Number(price) * 4000;
      }

      const title = `${plan.name} (${period === 'monthly' ? 'Mensual' : 'Semestral'})`;

      // Construct Preference
      const preferenceData = {
        items: [
          {
            id: planId,
            title: title,
            quantity: 1,
            currency_id: "COP",
            unit_price: finalPrice,
          },
        ],
        ...(email ? { payer: { email } } : {}),
        back_urls: {
          success: `${returnUrl}/payment/status?status=approved`,
          failure: `${returnUrl}/payment/status?status=rejected`,
          pending: `${returnUrl}/payment/status?status=pending`,
        },
        auto_return: (returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1')) ? undefined : "approved", 
        external_reference: JSON.stringify({ userId, planId, period }),
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
        console.error("MP Error payload:", JSON.stringify(mpData));
        const mpErrorMsg = mpData.message || (mpData.cause && mpData.cause[0] && mpData.cause[0].description) || "Unknown MP Error";
        return new Response(JSON.stringify({ error: `Mercado Pago Error: ${mpErrorMsg}`, details: mpData }), { status: 200, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ 
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
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
            const result = await processSuccessfulPayment(paymentData, supabase);
            return new Response(JSON.stringify({ status: "approved", result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else {
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
