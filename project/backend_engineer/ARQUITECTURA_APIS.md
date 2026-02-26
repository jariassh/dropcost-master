# Arquitectura de APIs - Backend DropCost

## Integraciones Externas

### Shopify API
- **Versión:** 2024-01
- **Autenticación:** OAuth2 / Access Token
- **Endpoints:**
  - `GET /admin/api/2024-01/orders.json?status=any&updated_at_min={fecha}`
  - `GET /admin/api/2024-01/shop.json`

### Meta Ads API
- **Versión:** v19.0
- **Autenticación:** OAuth2 User Token (User Access Token)
- **Endpoints:**
  - `GET /v19.0/me/adaccounts?fields=id,name,currency`
  - `GET /v19.0/{adaccount_id}/insights?fields=spend,clicks,impressions,actions&date_preset=last_30d`

## Endpoints Internos (Edge Functions)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/integraciones/conectar-meta` | POST | Intercambia code por token de Meta Ads. |
| `/integraciones/conectar-shopify` | POST | Finaliza flujo OAuth de Shopify. |
| `/dashboard/metrics` | GET | Retorna métricas procesadas para el frontend. |
