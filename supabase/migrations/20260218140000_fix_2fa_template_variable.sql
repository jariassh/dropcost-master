-- Fix 2FA Template Variable
-- The edge function expects {{codigo}} but the template used {{code}}

UPDATE public.email_templates
SET html_content = REPLACE(html_content, '{{code}}', '{{codigo}}')
WHERE slug = '2fa';
