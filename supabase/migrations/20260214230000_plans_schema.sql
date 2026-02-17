-- Create plans table safely
create table if not exists public.plans (
    id uuid not null default gen_random_uuid() primary key,
    slug text not null unique, -- Stable identifier
    name text not null,
    description text,
    price_monthly numeric not null default 0,
    price_semiannual numeric not null default 0,
    currency text not null default 'USD',
    features jsonb default '[]'::jsonb,
    limits jsonb default '{}'::jsonb,
    is_active boolean default true,
    is_public boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Ensure columns exist if table was created in previous run
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'price_semiannual') then
        alter table public.plans add column price_semiannual numeric not null default 0;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'is_public') then
        alter table public.plans add column is_public boolean default true;
    end if;
    
    -- Optional: Drop price_annual if it exists from previous version (to clean up)
    if exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'price_annual') then
        alter table public.plans drop column price_annual;
    end if;
end $$;

-- RLS Policies
alter table public.plans enable row level security;

-- Helper Function to avoid infinite recursion on users table policies
-- This function runs with the privileges of the creator (superuser)
create or replace function public.check_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.users 
        where id = auth.uid() 
        and rol in ('admin', 'superadmin')
    );
$$;

-- Drop existing policies to ensure clean update
drop policy if exists "Plans are viewable by everyone" on public.plans;
drop policy if exists "Admins can manage plans" on public.plans;

-- Everyone can view active/all plans (Filtered by app logic)
create policy "Plans are viewable by everyone" 
on public.plans for select 
using (true);

-- Only admins can insert/update/delete
create policy "Admins can manage plans" 
on public.plans for all 
using ( public.check_user_is_admin() );

-- Insert/Update Default Plans
insert into public.plans (slug, name, description, price_monthly, price_semiannual, features, limits, is_active, is_public)
values 
('plan_free', 'Plan Gratis', 'Para emprendedores que están iniciando en el dropshipping.', 0, 0, 
 '["Gestión de 1 tienda", "Simulador de costos básico", "Historial de actividad básico (7 días)", "Soporte por email"]',
 '{"stores": 1}', true, true),

('plan_pro', 'Plan Pro', 'Para negocios en crecimiento que necesitan escalar.', 29.99, 149.99, 
 '["Gestión de hasta 5 tiendas", "Simulador de costos avanzado", "Historial de actividad completo (30 días)", "Integración con Meta Ads", "Soporte prioritario"]',
 '{"stores": 5}', true, true),

('plan_enterprise', 'Plan Enterprise', 'Soluciones a medida para grandes volúmenes.', 99.99, 499.99, 
 '["Tiendas ilimitadas", "Simulador con IA predictiva", "Historial ilimitado", "API Access", "Gerente de cuenta dedicado"]',
 '{"stores": 9999}', true, true)
on conflict (slug) do update set
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_semiannual = EXCLUDED.price_semiannual,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    is_public = EXCLUDED.is_public;
