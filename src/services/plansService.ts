import { supabase } from '@/lib/supabase';
import { Plan, PlanInput } from '@/types/plans.types';

export const plansService = {
    async getPlans(activeOnly = false, publicOnly = false): Promise<Plan[]> {
        let query = supabase
            .from('plans')
            .select('*')
            .order('price_monthly', { ascending: true }); // Order by price

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        if (publicOnly) {
            query = query.eq('is_public', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching plans:', error);
            throw error;
        }

        return data as unknown as Plan[];
    },

    async getPlanById(id: string): Promise<Plan | null> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching plan:', error);
            return null;
        }

        return data as unknown as Plan;
    },

    async getPlanBySlug(slug: string): Promise<Plan | null> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            // It's common to not find a plan by slug (e.g. legacy user with old plan)
            return null;
        }

        return data as unknown as Plan;
    },

    async createPlan(plan: PlanInput): Promise<Plan> {
        const { data, error } = await supabase
            .from('plans')
            .insert([plan])
            .select()
            .single();

        if (error) {
            console.error('Error creating plan:', error);
            throw error;
        }

        return data as unknown as Plan;
    },

    async updatePlan(id: string, updates: Partial<PlanInput>): Promise<Plan> {
        const { data, error } = await supabase
            .from('plans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating plan:', error);
            throw error;
        }

        return data as unknown as Plan;
    },

    async deletePlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    },

    async assignPlanToUser(userId: string, planId: string): Promise<void> {
        // 1. Get Plan details (to ensure it exists and get slug if needed)
        // Actually we just need to update user table.

        // 2. Update User
        const { error } = await supabase
            .from('users')
            .update({
                plan_id: planId,
                estado_suscripcion: 'activa',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error assigning plan:', error);
            throw error;
        }
    }
};
