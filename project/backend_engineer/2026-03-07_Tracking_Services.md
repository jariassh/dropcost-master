# REPORTE BACKEND - Servicios de Código Personalizado
**Fecha:** 7 de marzo de 2026

## Servicios Implementados
1.  **customCodeService.ts**:
    - Abstracción de operaciones CRUD para fragmentos de código.
    - Manejo de persistencia local (inicialmente) preparado para migrar a Supabase Tables.
2.  **useCustomCode (Hook)**:
    - Centralización del estado de los fragmentos.
    - Lógica de activación/desactivación atómica.
    - Inyección dinámica de scripts en el DOM según la ubicación especificada (`head`, `body-start`, `body-end`).

## Seguridad & RLS
- Se ha diseñado el esquema considerando `tienda_id` y `usuario_id` para cumplir con las directrices de Multi-tenancy en la futura migración a DB.
- Los scripts inyectados se sanean mínimamente para evitar rupturas de layout, aunque el administrador tiene control total (uso experto).
