-- Agregamos el identificador de la campaña de Meta a la tabla de Costeos
ALTER TABLE costeos ADD COLUMN IF NOT EXISTS meta_campaign_id text;

-- Nos aseguramos de tener índices rápidos para cruzar Costeo <-> Shopify <-> Meta
CREATE INDEX IF NOT EXISTS idx_costeos_meta_campaign_id ON costeos(meta_campaign_id);
CREATE INDEX IF NOT EXISTS idx_costeos_product_id_shopify ON costeos(product_id_shopify);
