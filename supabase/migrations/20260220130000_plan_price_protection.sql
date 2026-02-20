-- Migration: Add Fields for Price Protection and Downgrade Control
-- Description: Adds plan_precio_pagado and plan_periodo to the users table.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_precio_pagado NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_periodo TEXT CHECK (plan_periodo IN ('monthly', 'semiannual'));

-- Update existing users with a default if they have a plan (optional, but good for data integrity)
-- If we assume existing plans were at current prices:
UPDATE public.users 
SET plan_precio_pagado = p.price_monthly, plan_periodo = 'monthly'
FROM public.plans p
WHERE users.plan_id = p.slug AND users.plan_precio_pagado = 0 AND users.plan_id != 'plan_free';

COMMENT ON COLUMN public.users.plan_precio_pagado IS 'The price the user originally paid for their current plan, used for price protection.';
COMMENT ON COLUMN public.users.plan_periodo IS 'The billing period associated with the locked price.';
