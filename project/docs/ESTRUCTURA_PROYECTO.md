# ESTRUCTURA ACTUAL DEL PROYECTO: DropCost Master
**Fecha de captura:** 26 de febrero de 2026

A continuación se presenta la jerarquía completa de archivos y carpetas del proyecto:

```text
C:\USERS\USER\DESKTOP\DROPSHIPPING\DEV\DROPCOST MASTER
|   .env
|   .gitignore
|   dropcost_staging_clone.sql
|   eslint.config.js
|   index.html
|   master_sync_triggers.sql
|   package-lock.json
|   package.json
|   README.md
|   tsconfig.app.json
|   tsconfig.json
|   tsconfig.node.json
|   vite.config.ts
|   
+---.vscode
|       extensions.json
|       settings.json
|       
+---docs
|   |   ARQUITECTURA_TECNICA.md
|   |   DISEÑO_UIUX.md
|   |   DOCUMENTO_MAESTRO_INTEGRAL.md
|   |   DropCost_Master_Especificacion_Requerimientos.md
|   |   ESPECIFICACION_REQUERIMIENTOS_ACORTADOR_ENLACES.md
|   |   ESPECIFICACION_REQUERIMIENTOS_ANALYTICS_TRAFICO.md
|   |   ESPECIFICACION_REQUERIMIENTOS_CENTRO_CAPACITACION.md
|   |   ESPECIFICACION_REQUERIMIENTOS_CONFIGURACION_GLOBAL.md
|   |   ESPECIFICACION_REQUERIMIENTOS_INTEGRACION_META_ADS.md
|   |   ESPECIFICACION_REQUERIMIENTOS_OFERTAS.md
|   |   ESPECIFICACION_REQUERIMIENTOS_REFERIDOS.md
|   |   ESPECIFICACION_REQUERIMIENTOS_REFERIDOS_V3.1.md
|   |   ESPECIFICACION_REQUERIMIENTOS_REFERIDOS_V3.md
|   |   ESPECIFICACION_REQUERIMIENTOS_SISTEMA_PAISES_GLOBAL.md
|   |   ESPECIFICACION_ROBOTS_SITEMAP_DINAMICO.md
|   |   ESPECIFICACION_TECNICA_DASHBOARD_OPERACIONAL_COMPLETA.md
|   |   ESPECIFICACION_TRIGGERS_EMAIL_FINAL.md
|   |   ESPECIFICACION_UIUX_OFERTAS.md
|   |   ESPECIFICACION_UIUX_REFERIDOS.md
|   |   INTEGRACION_SISTEMA_REFERIDOS.md
|   |   PLAN_IMPLEMENTACION.md
|   |   PROTOCOLO_CALCULO_MOTOR_FINANCIERO_COD.md
|   |   RESUMEN_INTEGRACION_OFERTAS.md
|   |   RF_LANDING_PAGE_DROPCOST_COMPLETA.md
|   |   RF_MIS_COSTEOS_CONTROL_CUOTA.md
|   |   
|   +---architecture
|   |       database_schema.svg
|   |       
|   \---designs
|           admin_panel_mockup.png
|           auth_flow_diagram.png
|           dashboard_kpi_layout.png
|           referral_level_structure.png
|           simulador_full_view.png
|           ... (otros archivos de diseño)
|           
+---node_modules (Omitidos por brevedad)
|           
+---projects
|       Estructura_actual_projecto.md
|           
+---public
|       favicon.svg
|       robots.txt
|       sitemap.xml
|       
+---src
|   |   App.tsx
|   |   main.tsx
|   |   vite-env.d.ts
|   |   
|   +---assets
|   |       react.svg
|   |       
|   +---components
|   |   +---admin
|   |   |   |   AdminSidebar.tsx
|   |   |   |   MJMLAttributeModal.tsx
|   |   |   |   
|   |   |   \---shared
|   |   |           AdminHeader.tsx
|   |   |           
|   |   +---common
|   |   |       Alert.tsx
|   |   |       Badge.tsx
|   |   |       Button.tsx
|   |   |       Card.tsx
|   |   |       ConfirmDialog.tsx
|   |   |       CountrySelect.tsx
|   |   |       CurrencyInput.tsx
|   |   |       EmptyState.tsx
|   |   |       FormattedInput.tsx
|   |   |       Input.tsx
|   |   |       Modal.tsx
|   |   |       PremiumFeatureGuard.tsx
|   |   |       index.ts
|   |   |       
|   |   +---layout
|   |   |       AppLayout.tsx
|   |   |       Header.tsx
|   |   |       Sidebar.tsx
|   |   |       
|   |   +---plans
|   |   |       PlanCard.tsx
|   |   |       
|   |   \---referidos
|   |           ReferralLinkCard.tsx
|   |           
|   +---hooks
|   |       useAuth.ts
|   |       useSessionEnforcer.ts
|   |       
|   +---lib
|   |       errorTranslations.ts
|   |       supabase.ts
|   |       
|   +---pages
|   |   |   LandingPage.tsx
|   |   |   PricingPage.tsx
|   |   |   UserAuditLogsPage.tsx
|   |   |   
|   |   +---admin
|   |   |       AdminAuditLogsPage.tsx
|   |   |       AdminDashboard.tsx
|   |   |       AdminEmailTemplatesPage.tsx
|   |   |       AdminEmailTriggersPage.tsx
|   |   |       AdminPlansPage.tsx
|   |   |       AdminReferralPage.tsx
|   |   |       AdminSettingsPage.tsx
|   |   |       AdminUsersPage.tsx
|   |   |       AdminWithdrawalsPage.tsx
|   |   |       
|   |   +---app
|   |   |   |   ConfiguracionPage.tsx
|   |   |   |   DashboardPage.tsx
|   |   |   |   PaymentStatusPage.tsx
|   |   |   |   ReferidosPage.tsx
|   |   |   |   WalletPage.tsx
|   |   |   |   
|   |   |   +---ofertas
|   |   |   |   |   ofertasCalculations.ts
|   |   |   |   |   OfertasDashboard.tsx
|   |   |   |   |   OfertasEducation.tsx
|   |   |   |   |   OfertasPage.tsx
|   |   |   |   |   OfertaWizard.tsx
|   |   |   |   |   WizardStep1Strategy.tsx
|   |   |   |   |   WizardStep2Costeo.tsx
|   |   |   |   |   WizardStep3Builder.tsx
|   |   |   |   |   WizardStep4Preview.tsx
|   |   |   |   |   
|   |   |   |   \---components
|   |   |   |           OfertaDetailPanel.tsx
|   |   |   |           
|   |   |   \---simulador
|   |   |           MisCosteos.tsx
|   |   |           SimuladorForm.tsx
|   |   |           SimuladorPage.tsx
|   |   |           SimuladorResults.tsx
|   |   |           simulatorCalculations.ts
|   |   |           VolumeStrategyTab.tsx
|   |   |           
|   |   +---auth
|   |   |       LoginPage.tsx
|   |   |       PasswordResetPage.tsx
|   |   |       RegisterPage.tsx
|   |   |       TwoFactorPage.tsx
|   |   |       UpdatePasswordPage.tsx
|   |   |       VerifyEmailPage.tsx
|   |   |       
|   |   \---legal
|   |           CookiesPage.tsx
|   |           PrivacidadPage.tsx
|   |           TerminosPage.tsx
|   |           
|   +---router
|   |       AppRouter.tsx
|   |       
|   +---services
|   |       adminService.ts
|   |       affiliateService.ts
|   |       auditService.ts
|   |       authService.ts
|   |       configService.ts
|   |       cookieService.ts
|   |       costeoService.ts
|   |       notificationService.ts
|   |       ofertaService.ts
|   |       paisesService.ts
|   |       paymentService.ts
|   |       plansService.ts
|   |       referralService.ts
|   |       storageService.ts
|   |       storeService.ts
|   |       userService.ts
|   |       walletService.ts
|   |       
|   +---store
|   |       authStore.ts
|   |       notificationStore.ts
|   |       themeStore.ts
|   |       useStoreStore.ts
|   |       
|   +---styles
|   |       prism-material.css
|   |       tokens.ts
|   |       
|   +---types
|   |       audit.types.ts
|   |       auth.types.ts
|   |       common.types.ts
|   |       notifications.ts
|   |       ofertas.ts
|   |       plans.types.ts
|   |       referral.types.ts
|   |       simulator.ts
|   |       store.types.ts
|   |       supabase.ts
|   |       user.types.ts
|   |       
|   \---utils
|           currencyUtils.ts
|           emailTrigger.ts
|           
\---supabase
    |   config.toml
    |   
    +---functions
    |   +---auth-2fa
    |   |       index.ts
    |   |       
    |   +---auth-mailer
    |   |       index.ts
    |   |       
    |   +---auth-password-reset
    |   |       index.ts
    |   |       
    |   +---auth-register
    |   |       index.ts
    |   |       
    |   +---debug-historial
    |   |       index.ts
    |   |       
    |   +---email-cron-jobs
    |   |       index.ts
    |   |       
    |   +---email-service
    |   |       index.ts
    |   |       
    |   +---email-trigger-dispatcher
    |   |       index.ts
    |   |       
    |   +---mercadopago
    |   |       index.ts
    |   |       
    |   +---robots
    |   |       index.ts
    |   |       
    |   +---sitemap
    |   |       index.ts
    |   |       
    |   \---subscription-reminder-cron
    |           index.ts
    |           
    \---migrations
            20260213_master_schema.sql
            ... (82 archivos de migración SQL)
```
