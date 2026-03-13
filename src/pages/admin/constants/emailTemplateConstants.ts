export interface EmailItem {
    id: string;
    name: string;
    slug: string;
    subject: string;
    html_content: string;
    mjml_content?: string;
    description: string;
    variables: string[];
    sender_prefix?: string;
    sender_name?: string;
    updated_at: string;
    is_folder?: boolean;
    parent_id?: string | null;
    status: 'activo' | 'archivado';
    trigger_event?: string;
    updated_by_name?: string;
    updated_by_avatar?: string;
}

export const categorizedVariables = {
    'Usuario': [
        { name: 'nombres', label: 'Nombres del Usuario' },
        { name: 'apellidos', label: 'Apellidos del Usuario' },
        { name: 'email', label: 'Email Principal' },
        { name: 'telefono', label: 'Teléfono de Contacto' },
        { name: 'pais', label: 'País de Residencia' },
        { name: 'wallet_saldo', label: 'Saldo en Wallet' },
        { name: 'codigo_referido_personal', label: 'Su Código de Invitación' },
        { name: 'fecha_registro', label: 'Fecha de Registro' },
        { name: 'fecha_actualizacion', label: 'Fecha de Actualización' }
    ],
    'Suscripción': [
        { name: 'plan_nombre', label: 'Nombre del Plan Actual' },
        { name: 'plan_precio', label: 'Precio del Plan' },
        { name: 'plan_detalles', label: 'Lista de Características' },
        { name: 'fecha_proximo_cobro', label: 'Fecha Próximo Cobro / Vencimiento' },
        { name: 'dias_restantes', label: 'Días Restantes del Plan' },
        { name: 'fecha_vencimiento', label: 'Fecha de Vencimiento' },
        { name: 'link_pago', label: 'Link de Pago Manual' },
        { name: 'estado_suscripcion', label: 'Estado (Activa/Pendiente)' }
    ],
    'Tienda': [
        { name: 'tienda_nombre', label: 'Nombre de la Tienda' },
        { name: 'tienda_pais', label: 'País de la Tienda' },
        { name: 'tienda_moneda', label: 'Moneda (COP, USD, etc)' }
    ],
    'Financiero': [
        { name: 'producto_nombre', label: 'Nombre del Producto (Último)' },
        { name: 'producto_sku', label: 'SKU del Producto' },
        { name: 'producto_precio_sugerido', label: 'Precio Sugerido' },
        { name: 'producto_utilidad_neta', label: 'Utilidad Neta Estimada' },
        { name: 'monto_retiro', label: 'Monto a Retirar (USD)' },
        { name: 'saldo_restante', label: 'Saldo Restante en Billetera (USD)' },
        { name: 'fecha_aprobacion', label: 'Fecha de Aprobación del Retiro' },
        { name: 'fecha_estimada_llegada', label: 'Fecha Estimada de Llegada del Dinero' },
        { name: 'banco_destino', label: 'Banco Destino de la Transferencia' },
        { name: 'titular_cuenta', label: 'Titular de la Cuenta Bancaria' },
    ],
    'Referidos': [
        { name: 'lider_nombre', label: 'Nombre de su Líder' },
        { name: 'total_referidos', label: 'Total de Invitados' },
        { name: 'monto_comision', label: 'Monto de Comisión (USD)' },
        { name: 'comision_ganada', label: 'Comisión Ganada (USD) por Pago de Referido' },
        { name: 'monto_pago', label: 'Monto Pagado por el Referido (USD)' },
        { name: 'plan_referido', label: 'Plan que Compró el Referido' },
        { name: 'fecha_pago', label: 'Fecha de Pago (Retiros)' },
        { name: 'fecha_pago_referido', label: 'Fecha de Pago del Referido' },
        { name: 'fecha_proximo_pago', label: 'Próximo Pago del Referido' },
        { name: 'saldo_billetera', label: 'Saldo Actual en Billetera (USD)' },
        { name: 'banco_nombre', label: 'Banco de Destino' },
        { name: 'referido_nombre', label: 'Nombre del Nuevo Referido (quien se registró)' },
        { name: 'referido_email', label: 'Email del Nuevo Referido' },
        { name: 'comision_referido_nivel1', label: 'Porcentaje Comisión Nivel 1 (Config)' },
        { name: 'comision_referido_nivel2', label: 'Porcentaje Comisión Nivel 2 (Config)' },
        { name: 'vigencia_meses_comision', label: 'Meses de Vigencia Comisión (Config)' },
        { name: 'requisito_para_lider', label: 'Referidos Mínimos para ser Líder (Config)' },
        { name: 'referidos_cantidad', label: 'Cantidad Actual de Referidos del Líder' },
        { name: 'fecha_cancelacion_referido', label: 'Fecha Cancelación Suscripción del Referido' },
        { name: 'fecha_ultima_comision', label: 'Fecha Última Comisión Generada por Referido' },
        { name: 'dias_restantes_comision', label: 'Días Restantes de Comisión sobre Referido' },
        { name: 'comision_mensual', label: 'Comisión Mensual por Referido (USD)' },
        { name: 'fecha_inicio_comision', label: 'Fecha Inicio Período de Comisión' },
        { name: 'fecha_expiracion_comision', label: 'Fecha Expiración de Comisión sobre Referido' },
        { name: 'comision_total_ganada', label: 'Total Comisionado por Referido en el Período (USD)' },
        { name: 'referidos_actuales', label: 'Referidos Actuales del Usuario' },
        { name: 'referidos_faltantes', label: 'Referidos Faltantes para ser Líder' },
        { name: 'porcentaje_progreso', label: 'Porcentaje de Progreso hacia Líder (%)' },
        { name: 'requisito_lider', label: 'Requisito Total de Referidos para Líder (alias)' },
        { name: 'comision_nivel2', label: 'Porcentaje Comisión Nivel 2 (alias)' },
    ],
    'Sistema': [
        { name: 'app_url', label: 'Link a Inicio (Raíz)' },
        { name: '{{app_url}}/mis-costeos', label: 'Link al Simulador' },
        { name: '{{app_url}}/dashboard', label: 'Link al Dashboard' },
        { name: '{{app_url}}/referidos', label: 'Link a Referidos' },
        { name: '{{app_url}}/billetera', label: 'Link a Billetera' },
        { name: '{{app_url}}/planes', label: 'Link a Planes' },
        { name: '{{app_url}}/configuracion', label: 'Link a Configuración' }
    ],
    'Autenticación': [
        { name: 'reset_link', label: 'Link para Restablecer Contraseña' },
        { name: 'horas_validez', label: 'Horas de Validez del Link' },
        { name: 'verification_link', label: 'Link para Verificar Email' },
        { name: 'login_url', label: 'Link de Login' }
    ],
    'Legal': [
        { name: '{{app_url}}/privacidad', label: 'Política de Privacidad' },
        { name: '{{app_url}}/terminos', label: 'Términos y Condiciones' },
        { name: '{{app_url}}/contacto', label: 'Página de Contacto' }
    ],
    'Soporte': [
        { name: 'email_soporte', label: 'Email de Soporte (Config)' },
        { name: 'telefono_soporte', label: 'Teléfono de Soporte' },
        { name: '{{app_url}}/soporte', label: 'Centro de Ayuda' }
    ],
    'Seguridad': [
        { name: 'codigo_2fa', label: 'Código 2FA / OTP' },
        { name: 'expira_en', label: 'Tiempo de Expiración' },
        { name: 'email_anterior', label: 'Email Anterior' },
        { name: 'email_nuevo', label: 'Email Nuevo' }
    ],
    'Marca & Colores': [
        { name: 'nombre_empresa', label: 'Nombre de la Empresa' },
        { name: 'logo_url', label: 'URL del Logo Principal' },
        { name: 'color_primary', label: 'Color Primario' },
        { name: 'color_primary_dark', label: 'Color Primario Oscuro' },
        { name: 'color_primary_light', label: 'Color Primario Claro' },
        { name: 'color_success', label: 'Color Éxito' },
        { name: 'color_warning', label: 'Color Advertencia' },
        { name: 'color_error', label: 'Color Error' },
        { name: 'color_neutral', label: 'Color Neutral' },
        { name: 'color_bg_primary', label: 'Color Fondo Principal' },
        { name: 'color_bg_secondary', label: 'Color Fondo Secundario' },
        { name: 'color_text_primary', label: 'Color Texto Principal' },
        { name: 'color_text_secondary', label: 'Color Texto Secundario' },
        { name: 'color_text_inverse', label: 'Color Texto Inverso' },
        { name: 'color_sidebar_bg', label: 'Color Fondo Sidebar' }
    ]
};

export const categorizedMJMLComponents: Record<string, any[]> = {
    'Estructura (Root)': [
        {
            name: 'mjml',
            label: 'Raíz MJML',
            tagName: 'mjml',
            defaultAttributes: {},
            allowedAttributes: [],
            template: (_: any, content: string) => `<mjml>\n  <mj-head>\n    <mj-title>Nuevo Correo</mj-title>\n    <mj-attributes>\n      <mj-all font-family="Arial" />\n    </mj-attributes>\n  </mj-head>\n  <mj-body>\n    ${content || '<mj-section><mj-column><mj-text>Hola mundo</mj-text></mj-column></mj-section>'}\n  </mj-body>\n</mjml>`,
            defaultContent: ''
        },
        {
            name: 'mj-head',
            label: 'Cabecera (Head)',
            tagName: 'mj-head',
            defaultAttributes: {},
            allowedAttributes: [],
            defaultContent: '<mj-title>Asunto</mj-title>\n<mj-attributes>\n  <mj-all font-family="Helvetica" />\n</mj-attributes>'
        },
        {
            name: 'mj-body',
            label: 'Cuerpo (Body)',
            tagName: 'mj-body',
            defaultAttributes: { 'background-color': '#f0f0f0', width: '600px' },
            allowedAttributes: [
                { name: 'background-color', label: 'Color Fondo', type: 'color' },
                { name: 'width', label: 'Ancho Máximo', type: 'text', defaultValue: '600px' }
            ],
            defaultContent: ''
        }
    ],
    'Layout (Diseño)': [
        {
            name: 'mj-section',
            label: 'Sección',
            tagName: 'mj-section',
            defaultAttributes: { 'background-color': '#ffffff', 'padding': '20px' },
            allowedAttributes: [
                { name: 'background-color', label: 'Color Fondo', type: 'color' },
                { name: 'padding', label: 'Relleno (Padding)', type: 'text', defaultValue: '20px' },
                { name: 'border-radius', label: 'Bordes Redondeados', type: 'text' },
                { name: 'text-align', label: 'Alineación', type: 'select', options: ['left', 'center', 'right'] }
            ],
            defaultContent: '<mj-column>\n    <mj-text>Contenido de columna...</mj-text>\n  </mj-column>'
        },
        {
            name: 'mj-column',
            label: 'Columna',
            tagName: 'mj-column',
            defaultAttributes: { 'width': '', 'vertical-align': 'top' },
            allowedAttributes: [
                { name: 'width', label: 'Ancho (ej: 50%)', type: 'text' },
                { name: 'vertical-align', label: 'Alineación Vert.', type: 'select', options: ['top', 'middle', 'bottom'] },
                { name: 'background-color', label: 'Color Fondo', type: 'color' },
                { name: 'padding', label: 'Padding', type: 'text' }
            ],
            defaultContent: '<mj-text>Texto columna</mj-text>'
        },
        {
            name: 'mj-group',
            label: 'Grupo Columnas',
            tagName: 'mj-group',
            defaultAttributes: { 'width': '100%' },
            allowedAttributes: [
                { name: 'width', label: 'Ancho', type: 'text' },
                { name: 'background-color', label: 'Color Fondo', type: 'color' }
            ],
            defaultContent: '<mj-column><mj-text>Col 1</mj-text></mj-column><mj-column><mj-text>Col 2</mj-text></mj-column>'
        },
        {
            name: 'mj-hero',
            label: 'Hero Image',
            tagName: 'mj-hero',
            defaultAttributes: {
                'mode': 'fixed-height',
                'height': '400px',
                'background-width': '600px',
                'background-height': '400px',
                'background-url': 'https://cloud.githubusercontent.com/assets/1830348/15354890/1442159a-1cf0-11e6-92b1-b861dadf1750.jpg',
                'background-color': '#2a3448'
            },
            allowedAttributes: [
                { name: 'mode', label: 'Modo', type: 'select', options: ['fluid-height', 'fixed-height'] },
                { name: 'height', label: 'Altura', type: 'text' },
                { name: 'background-url', label: 'URL Imagen Fondo', type: 'url' },
                { name: 'background-color', label: 'Color Fondo', type: 'color' }
            ],
            defaultContent: '<mj-text color="#ffffff">TEXTO SOBRE IMAGEN</mj-text>'
        }
    ],
    'Contenido': [
        {
            name: 'mj-text',
            label: 'Texto / Párrafo',
            tagName: 'mj-text',
            defaultAttributes: { 'color': '#55575d', 'font-family': 'Arial', 'font-size': '13px', 'line-height': '22px' },
            allowedAttributes: [
                { name: 'color', label: 'Color Texto', type: 'color' },
                { name: 'font-size', label: 'Tamaño Fuente', type: 'text', defaultValue: '13px' },
                { name: 'font-weight', label: 'Peso Fuente', type: 'select', options: ['300', '400', '600', '700', '900'] },
                { name: 'align', label: 'Alineación', type: 'select', options: ['left', 'center', 'right', 'justify'] },
                { name: 'line-height', label: 'Altura Línea', type: 'text' },
                { name: 'font-family', label: 'Tipografía', type: 'text' }
            ],
            defaultContent: 'Escriba su texto aquí...'
        },
        {
            name: 'mj-button',
            label: 'Botón CTA',
            tagName: 'mj-button',
            defaultAttributes: { 'background-color': '#414141', 'color': '#ffffff', 'href': '#', 'border-radius': '3px' },
            allowedAttributes: [
                { name: 'background-color', label: 'Color Fondo', type: 'color' },
                { name: 'color', label: 'Color Texto', type: 'color' },
                { name: 'href', label: 'Enlace (URL)', type: 'url' },
                { name: 'border-radius', label: 'Radio Borde', type: 'text', defaultValue: '3px' },
                { name: 'width', label: 'Ancho (opcional)', type: 'text' },
                { name: 'font-size', label: 'Tamaño Fuente', type: 'text' }
            ],
            defaultContent: 'Haga clic aquí'
        },
        {
            name: 'mj-image',
            label: 'Imagen',
            tagName: 'mj-image',
            defaultAttributes: { 'src': 'https://placehold.co/600x400', 'width': '300px' },
            allowedAttributes: [
                { name: 'src', label: 'URL Imagen', type: 'url' },
                { name: 'href', label: 'Enlace al hacer click', type: 'url' },
                { name: 'width', label: 'Ancho', type: 'text' },
                { name: 'alt', label: 'Texto Alternativo', type: 'text' },
                { name: 'border-radius', label: 'Radio Borde', type: 'text' }
            ]
        },
        {
            name: 'mj-divider',
            label: 'Separador',
            tagName: 'mj-divider',
            defaultAttributes: { 'border-width': '1px', 'border-color': '#E0E0E0' },
            allowedAttributes: [
                { name: 'border-color', label: 'Color Línea', type: 'color' },
                { name: 'border-width', label: 'Grosor', type: 'text' },
                { name: 'padding', label: 'Espaciado', type: 'text' }
            ]
        },
        {
            name: 'mj-spacer',
            label: 'Espacio Vacío',
            tagName: 'mj-spacer',
            defaultAttributes: { 'height': '20px' },
            allowedAttributes: [
                { name: 'height', label: 'Altura', type: 'text', defaultValue: '20px' }
            ]
        },
        {
            name: 'mj-table',
            label: 'Tabla',
            tagName: 'mj-table',
            defaultAttributes: {},
            allowedAttributes: [
                { name: 'color', label: 'Color Texto', type: 'color' },
                { name: 'font-size', label: 'Tamaño Fuente', type: 'text' }
            ],
            defaultContent: '<tr>\n  <td style="padding: 0 15px 0 0;">Año 2024</td>\n  <td style="padding: 0 15px;">Ventas</td>\n  <td style="padding: 0 0 0 15px;">$500k</td>\n</tr>'
        }
    ],
    'Navegación y Social': [
        {
            name: 'mj-navbar',
            label: 'Menú Navegación',
            tagName: 'mj-navbar',
            defaultAttributes: { 'hamburger': 'hamburger', 'ico-color': '#444444' },
            allowedAttributes: [
                { name: 'hamburger', label: 'Botón Móvil', type: 'select', options: ['hamburger', 'none'] },
                { name: 'ico-color', label: 'Color Ícono', type: 'color' }
            ],
            defaultContent: '<mj-navbar-link href="/home">Inicio</mj-navbar-link>\n<mj-navbar-link href="/products">Productos</mj-navbar-link>\n<mj-navbar-link href="/contact">Contacto</mj-navbar-link>'
        },
        {
            name: 'mj-social',
            label: 'Redes Sociales',
            tagName: 'mj-social',
            defaultAttributes: { 'font-size': '15px', 'icon-size': '30px', 'mode': 'horizontal' },
            allowedAttributes: [
                { name: 'icon-size', label: 'Tamaño Ícono', type: 'text' },
                { name: 'mode', label: 'Modo', type: 'select', options: ['horizontal', 'vertical'] },
                { name: 'color', label: 'Color', type: 'color' }
            ],
            defaultContent: '<mj-social-element name="facebook" href="#" />\n<mj-social-element name="instagram" href="#" />\n<mj-social-element name="twitter" href="#" />'
        }
    ],
    'Avanzado / Meta': [
        {
            name: 'mj-raw',
            label: 'HTML Puro (Raw)',
            tagName: 'mj-raw',
            defaultAttributes: {},
            allowedAttributes: [],
            defaultContent: '<!-- HTML personalizado que no será procesado por MJML -->'
        },
        {
            name: 'mj-style',
            label: 'Estilos CSS',
            tagName: 'mj-style',
            defaultAttributes: { 'inline': 'inline' },
            allowedAttributes: [
                { name: 'inline', label: 'Inline', type: 'select', options: ['inline', ''] }
            ],
            defaultContent: '.clase-ejemplo { color: blue; }'
        }
    ]
};
