
import { supabase } from '@/lib/supabase';

export const paymentService = {
    /**
     * Creates a checkout preference in Mercado Pago via Edge Function
     */
    async createCheckoutSession(planId: string, period: 'monthly' | 'semiannual') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Use real user email for production-ready checkout
        const payload = { 
            planId, 
            period, 
            userId: user.id, 
            email: user.email,
            returnUrl: window.location.origin 
        };

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
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.init_point) {
            throw new Error('No se recibió el link de pago de Mercado Pago.');
        }

        return data.init_point;
    },

    /**
     * Checks the status of a payment manually via Edge Function
     */
    async checkPaymentStatus(paymentId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

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
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    },

    /**
     * Creates a checkout preference for DropCredits
     */
    async createCreditRechargeSession(amountUSD: number, credits: number, amountCOP?: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const payload = { 
            type: 'credits',
            amountUSD,
            credits,
            amountCOP,
            userId: user.id, 
            email: user.email,
            returnUrl: window.location.origin 
        };

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
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (!data.init_point) throw new Error('No se recibió el link de pago.');

        return data.init_point;
    },

    /**
     * Direct credits recharge for admins
     */
    async adminDirectRecharge(targetUserId: string, credits: number) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session found');

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago?action=admin_recharge`;
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ targetUserId, credits })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
    }
};
