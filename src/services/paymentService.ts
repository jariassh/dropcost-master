
import { supabase } from '@/lib/supabase';

export const paymentService = {
    /**
     * Creates a checkout preference in Mercado Pago via Edge Function
     */
    async createCheckoutSession(planId: string, period: 'monthly' | 'semiannual') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // NOT sending email to force manual input in MP (avoids auto-login conflicts in Sandbox)
        // Use a dynamic test email for SandBox stability (as seen in historical version 847daf3)
        // This avoids session conflicts and "buyer=seller" errors
        const testEmail = `test_user_dropcost_${Date.now()}@testuser.com`;

        const payload = { 
            planId, 
            period, 
            userId: user.id, 
            email: testEmail,
            returnUrl: window.location.origin 
        };

        console.log('!!! DEBUG !!! Creating Checkout with payload:', JSON.stringify(payload, null, 2));

        // Direct fetch to avoid 401 auth issues
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago?action=create_preference`;
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Function call failed:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('Payment Service Error:', data);
            throw new Error(data.error);
        }

        console.log('Payment Service Response:', data);

        if (!data.init_point) {
            console.error('Missing init_point in response:', data);
            throw new Error('No se recibió el link de pago de Mercado Pago.');
        }

        console.log('Redirecting to Checkout:', data.init_point);
        return data.init_point;
    },

    /**
     * Checks the status of a payment manually via Edge Function
     * This acts as a fallback if webhooks fail or are delayed.
     */
    async checkPaymentStatus(paymentId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        console.log('Checking payment status manually:', paymentId);

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago?action=check_payment`;
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ paymentId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Check Payment failed:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    }
};
