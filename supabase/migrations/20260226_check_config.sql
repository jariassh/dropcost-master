DO $$
BEGIN
    RAISE NOTICE 'SITE_URL: %', (SELECT site_url FROM configuracion_global LIMIT 1);
    RAISE NOTICE 'SITIO_WEB: %', (SELECT sitio_web FROM configuracion_global LIMIT 1);
END $$;
