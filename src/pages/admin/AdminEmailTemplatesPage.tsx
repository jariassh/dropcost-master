import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast, Badge, Modal, Input, Spinner, ConfirmDialog, CodeEditor } from '@/components/common';
import { enviarPruebaPlantilla } from '@/utils/emailTrigger';
import {
    Mail,
    Save,
    Eye,
    Info,
    Code,
    Type,
    Layout,
    CheckCircle2,
    Tag,
    ChevronDown,
    Zap,
    Folder,
    Clock,
    List as ListIcon,
    MoreVertical,
    Filter,
    Plus,
    FileEdit,
    Search,
    ArrowLeft,
    MoreHorizontal,
    ChevronRight,
    Copy,
    Trash2,
    Archive,
    ExternalLink,
    MoveUp,
    FolderInput,
    Edit3,
    UserPlus,
    Send,
    User,
    X,
    Loader2,
    AlignLeft
} from 'lucide-react';
import { configService, GlobalConfig } from '@/services/configService';
import { userService } from '@/services/userService';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import * as mjmlModule from 'mjml-browser';
import { MJMLAttributeModal } from './components/MJMLAttributeModal';
const mjml2html = (mjmlModule as any).default || mjmlModule;

interface EmailItem {
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
}

const categorizedVariables = {
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
        { name: 'producto_utilidad_neta', label: 'Utilidad Neta Estimada' }
    ],
    'Referidos': [
        { name: 'lider_nombre', label: 'Nombre de su Líder' },
        { name: 'total_referidos', label: 'Total de Invitados' },
        { name: 'monto_comision', label: 'Monto de Comisión' },
        { name: 'fecha_pago', label: 'Fecha de Pago' },
        { name: 'banco_nombre', label: 'Banco de Destino' }
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
        { name: '{{app_url}}/reset-password?token={{reset_token}}', label: 'Link Reset Password' },
        { name: '{{app_url}}/verificar-email?code={{verification_code}}', label: 'Link Verificar Email' },
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

const categorizedMJMLComponents: Record<string, any[]> = {
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
        },
        {
            name: 'mj-class',
            label: 'Clase CSS (mj-class)',
            tagName: 'mj-class',
            defaultAttributes: { 'name': 'big', 'font-size': '20px' },
            allowedAttributes: [
                { name: 'name', label: 'Nombre Clase', type: 'text' },
                { name: 'color', label: 'Color', type: 'color' },
                { name: 'font-size', label: 'Tamaño Fuente', type: 'text' }
            ]
        }
    ]
};

const MJMLComponentList = ({ onSelect }: { onSelect: (component: any) => void }) => {
    const [search, setSearch] = useState('');

    const filteredCategories = Object.entries(categorizedMJMLComponents).reduce((acc, [category, comps]) => {
        const matches = comps.filter(c =>
            c.label.toLowerCase().includes(search.toLowerCase()) ||
            c.tagName.toLowerCase().includes(search.toLowerCase())
        );
        if (matches.length > 0) acc[category] = matches;
        return acc;
    }, {} as any);

    return (
        <div
            className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
        >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Buscar componente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                        className="focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                        autoFocus
                    />
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-custom">
                {Object.entries(filteredCategories).length > 0 ? (
                    Object.entries(filteredCategories).map(([category, comps]: [string, any]) => (
                        <div key={category} className="border-b border-[var(--border-color)] last:border-0">
                            <div style={{ padding: '10px 24px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', opacity: 0.8 }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
                            </div>
                            {comps.map((c: any) => (
                                <button
                                    key={c.name}
                                    onClick={() => onSelect(c)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        border: 'none',
                                        textAlign: 'left'
                                    }}
                                    className="group hover:bg-[var(--color-primary-light)]"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{ padding: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:bg-white transition-colors">
                                            <Layout size={13} className="text-[var(--color-primary)]" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                                {c.label}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                                {`control + space`}
                                            </span>
                                        </div>
                                    </div>
                                    <Plus size={12} className="opacity-0 group-hover:opacity-40 text-[var(--color-primary)] transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <div className="inline-flex p-3 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
                            <Search size={24} className="text-[var(--text-tertiary)]" />
                        </div>
                        <p className="text-sm text-[var(--text-tertiary)] font-medium">No encontramos componentes con "{search}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VariableList = ({ onSelect }: { onSelect: (v: string) => void }) => {
    const [search, setSearch] = useState('');

    const filteredCategories = Object.entries(categorizedVariables).reduce((acc, [category, vars]) => {
        const matches = vars.filter(v =>
            v.label.toLowerCase().includes(search.toLowerCase()) ||
            v.name.toLowerCase().includes(search.toLowerCase())
        );
        if (matches.length > 0) acc[category] = matches;
        return acc;
    }, {} as any);

    return (
        <div
            className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
        >
            {/* Buscador Dinámico */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Buscar campo (ej: nombre...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                        className="focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                        autoFocus
                    />
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-custom">
                {Object.entries(filteredCategories).length > 0 ? (
                    Object.entries(filteredCategories).map(([category, vars]: [string, any]) => (
                        <div key={category} className="border-b border-[var(--border-color)] last:border-0">
                            <div style={{ padding: '10px 24px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', opacity: 0.8 }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
                            </div>
                            {vars.map((v: any) => (
                                <button
                                    key={v.name}
                                    onClick={() => onSelect(v.name)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        border: 'none',
                                        textAlign: 'left'
                                    }}
                                    className="group hover:bg-[var(--color-primary-light)]"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{ padding: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:bg-white transition-colors">
                                            <Zap size={13} className="text-[var(--color-primary)]" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                                {v.label}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                {'{'}{v.name}{'}'}
                                            </span>
                                        </div>
                                    </div>
                                    <Tag size={12} className="opacity-0 group-hover:opacity-40 text-[var(--color-primary)] transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <div className="inline-flex p-3 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
                            <Search size={24} className="text-[var(--text-tertiary)]" />
                        </div>
                        <p className="text-sm text-[var(--text-tertiary)] font-medium">No encontramos campos con "{search}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddSenderModal = ({ isOpen, onClose, onSave, defaultName, domain }: any) => {
    const [name, setName] = useState(defaultName || '');
    const [prefix, setPrefix] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(defaultName || '');
            setPrefix('');
        }
    }, [isOpen, defaultName]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nuevo Remitente"
            size="sm"
        >
            <div className="flex flex-col gap-6">
                <Input
                    label="Nombre Visible"
                    placeholder="Ej: DropCost Soporte"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Dirección de Correo</label>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            overflow: 'hidden',
                            transition: 'all 200ms ease',
                        }}
                        className="focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[rgba(0,102,255,0.15)]"
                    >
                        <input
                            type="text"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                            placeholder="ej: ventas"
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                padding: '12px 16px',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                backgroundColor: 'transparent',
                                minWidth: 0
                            }}
                        />
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderLeft: '1px solid var(--border-color)',
                            color: 'var(--text-tertiary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            userSelect: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            @{domain || 'dropcost.com'}
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                        Solo se permiten letras minúsculas, números, puntos y guiones.
                    </p>
                </div>

                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <Button variant="secondary" onClick={onClose} style={{ borderColor: 'var(--border-color)' }}>Cancelar</Button>
                    <Button onClick={() => onSave(name, prefix)} disabled={!name || !prefix}>Guardar Remitente</Button>
                </div>
            </div>
        </Modal >
    );
};

const SenderSelector = ({ currentName, currentPrefix, domain, onSelect, templates, globalConfig, onRefresh }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [senderToEdit, setSenderToEdit] = useState<{ name: string; prefix: string; count: number } | null>(null);
    const [newName, setNewName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extraer remitentes únicos de todas las plantillas existentes y contar sus usos
    const uniqueSenders = React.useMemo(() => {
        const senders = new Map();
        templates.forEach((t: any) => {
            if (t.sender_prefix) {
                const key = `${t.sender_prefix}@${domain}`;
                if (!senders.has(key)) {
                    senders.set(key, {
                        name: t.sender_name || globalConfig?.nombre_empresa || 'Remitente',
                        prefix: t.sender_prefix,
                        count: 1
                    });
                } else {
                    const existing = senders.get(key);
                    existing.count += 1;
                }
            }
        });
        return Array.from(senders.values());
    }, [templates, domain, globalConfig]);

    const filteredSenders = uniqueSenders.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.prefix.toLowerCase().includes(search.toLowerCase())
    );

    const handleRenameSender = async () => {
        if (!senderToEdit || !newName.trim()) return;
        setIsRenaming(true);
        try {
            const { error } = await (supabase as any)
                .from('email_templates')
                .update({ sender_name: newName.trim() })
                .eq('sender_prefix', senderToEdit.prefix);

            if (error) throw error;

            toast.success('Actualizado', `Se ha actualizado el nombre del remitente en ${senderToEdit.count} plantillas.`);
            if (onRefresh) onRefresh();
            setShowEditNameModal(false);
        } catch (e) {
            toast.error('Error', 'No se pudo actualizar el nombre del remitente.');
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-auto min-h-[56px] px-4 py-3 rounded-[12px] border-[1.5px] transition-all cursor-pointer group select-none flex items-center justify-between ${isOpen
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--bg-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--color-primary)]/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        }`}>
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            {currentName || globalConfig?.nombre_empresa || 'Seleccionar Remitente'}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                            {currentPrefix ? `${currentPrefix}@${domain}` : 'Configurar dirección...'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Buscar remitente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                                className="focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto scrollbar-custom" style={{ minHeight: '140px', maxHeight: '240px' }}>
                        {filteredSenders.map((sender) => (
                            <button
                                key={sender.prefix}
                                onClick={() => {
                                    onSelect(sender.name, sender.prefix);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 200ms ease',
                                    border: 'none',
                                    textAlign: 'left',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                                className="group hover:bg-[var(--color-primary-light)] last:border-0"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                    <div style={{ padding: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:bg-white transition-colors">
                                        <Mail size={13} className="text-[var(--text-secondary)] group-hover:text-[var(--color-primary)]" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                            {sender.name}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {sender.prefix}@{domain}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div style={{
                                        padding: '2px 8px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: 'var(--text-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        minWidth: '24px',
                                        textAlign: 'center'
                                    }}>
                                        {sender.count}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSenderToEdit(sender);
                                            setNewName(sender.name);
                                            setShowEditNameModal(true);
                                        }}
                                        className="p-1.5 hover:bg-white rounded-md text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                    <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-40 text-[var(--color-primary)] transition-opacity" />
                                </div>
                            </button>
                        ))}

                        {filteredSenders.length === 0 && search && (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)]" style={{ minHeight: '140px' }}>
                                <Search size={32} className="mb-3 opacity-20" />
                                <span className="text-xs font-medium">No se encontraron resultados</span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAddModal(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1.5px dashed var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 200ms ease'
                            }}
                            className="hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                        >
                            <Plus size={14} /> Crear Nuevo Remitente
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showEditNameModal}
                onClose={() => setShowEditNameModal(false)}
                title="Editar Remitente"
                size="sm"
            >
                <div className="flex flex-col gap-6">
                    <Input
                        label="Nombre Visible"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej: DropCost Soporte"
                    />
                    <div className="space-y-1.5 opacity-70">
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Correo Electrónico (Solo Lectura)</label>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-color)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            color: 'var(--text-tertiary)',
                            cursor: 'not-allowed',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '48px'
                        }}>
                            {senderToEdit?.prefix}@{domain}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowEditNameModal(false)}>Cancelar</Button>
                        <Button onClick={handleRenameSender} isLoading={isRenaming}>Guardar Cambios</Button>
                    </div>
                </div>
            </Modal>

            <AddSenderModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={(name: string, prefix: string) => {
                    onSelect(name, prefix);
                    setShowAddModal(false);
                }}
                defaultName={globalConfig?.nombre_empresa}
                domain={domain}
            />
        </div>
    );
};

const TestUserSelector = ({ onSelect, selectedUser }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && search.length >= 0) {
            const fetchUsers = async () => {
                setLoading(true);
                try {
                    const { data } = await userService.fetchUsers(1, 10, { search });
                    setUsers(data || []);
                } catch (error) {
                    console.error("Error searching users", error);
                } finally {
                    setLoading(false);
                }
            };

            const timeoutId = setTimeout(fetchUsers, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, search]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-auto min-h-[56px] px-4 py-3 rounded-[12px] border-[1.5px] transition-all cursor-pointer group select-none flex items-center justify-between ${isOpen
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--bg-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--color-primary)]/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        }`}>
                        <User size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            {selectedUser ? `${selectedUser.nombres} ${selectedUser.apellidos}` : 'Seleccionar Usuario de Prueba'}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                            {selectedUser ? selectedUser.email : 'Buscar por nombre o email...'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                                className="focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-primary)]"><Loader2 size={14} /></div>}
                        </div>
                    </div>

                    <div className="overflow-y-auto scrollbar-custom" style={{ minHeight: '140px', maxHeight: '240px' }}>
                        {users.map((user) => {
                            const isSelected = selectedUser?.id === user.id;
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        onSelect(user);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        border: 'none',
                                        textAlign: 'left',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    className="group hover:bg-[var(--color-primary-light)] last:border-0"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{
                                            padding: '7px',
                                            backgroundColor: isSelected ? 'white' : 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }} className="group-hover:bg-white transition-colors">
                                            <User size={13} className={isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                                {user.nombres} {user.apellidos}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircle2 size={14} className="text-[var(--color-primary)]" />}
                                </button>
                            );
                        })}

                        {users.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)]" style={{ minHeight: '140px' }}>
                                <User size={32} className="mb-3 opacity-20" />
                                <span className="text-xs font-medium">No se encontraron usuarios</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export function AdminEmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    const [showVariablesSubject, setShowVariablesSubject] = useState(false);
    const [showVariablesBody, setShowVariablesBody] = useState(false);
    const [showMJMLComponents, setShowMJMLComponents] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState<'recent' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'activo' | 'archivado' | 'all'>('all');
    const [navigationPath, setNavigationPath] = useState<string[]>([]); // Array of IDs
    const [showFilters, setShowFilters] = useState(false);

    // Create States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
    const [isCreating, setIsCreating] = useState(false);
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
    const [availableTriggers, setAvailableTriggers] = useState<{ id: string; nombre_trigger: string; codigo_evento: string; categoria: string }[]>([]);

    useEffect(() => {
        const fetchTriggers = async () => {
            const { data } = await (supabase as any)
                .from('email_triggers')
                .select('id, nombre_trigger, codigo_evento, categoria')
                .eq('activo', true)
                .order('nombre_trigger');

            if (data) setAvailableTriggers(data);
        };
        fetchTriggers();
    }, []);

    // Actions State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [itemToManage, setItemToManage] = useState<EmailItem | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isConfirmMJMLOpen, setIsConfirmMJMLOpen] = useState(false);
    const [folderSearchQuery, setFolderSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [testUserSearch, setTestUserSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [selectedTestUser, setSelectedTestUser] = useState<any | null>(null);
    const [selectedUserPlan, setSelectedUserPlan] = useState<any | null>(null);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [mjmlModalComponent, setMjmlModalComponent] = useState<any | null>(null);

    const mjmlTips = [
        "Jerarquía MJML: <mjml> -> <mj-body> -> <mj-section> -> <mj-column> -> <mj-text>.",
        "Secciones: Usa <mj-section> para filas horizontales. Cada sección necesita al menos una <mj-column>.",
        "Responsividad: ¡MJML se encarga de que tu correo se vea perfecto en móviles automáticamente!",
        "Personalización: Usa {{nombres}} o {{link}} para inyectar datos reales del usuario.",
        "Estilos: Puedes usar <mj-style> dentro de <mj-head> para estilos globales de la plantilla.",
        "Previsualización: Haz clic en 'Guardar Cambios' para actualizar la vista previa en vivo."
    ];

    useEffect(() => {
        if (!selectedTestUser?.plan_id) {
            setSelectedUserPlan(null);
            return;
        }
        const fetchPlan = async () => {
            const planId = selectedTestUser.plan_id;
            // Intento 1: buscar por UUID (id)
            let { data: plan } = await (supabase as any)
                .from('plans')
                .select('*')
                .eq('id', planId)
                .maybeSingle();
            // Intento 2: si no encontró por ID, buscar por slug
            if (!plan) {
                const { data: planBySlug } = await (supabase as any)
                    .from('plans')
                    .select('*')
                    .eq('slug', planId)
                    .maybeSingle();
                plan = planBySlug;
            }
            console.log('[Preview] Plan resuelto:', plan?.name || 'NO ENCONTRADO', '| price_monthly:', plan?.price_monthly, '| planId era:', planId);
            setSelectedUserPlan(plan);
        };
        fetchPlan();
    }, [selectedTestUser]);

    useEffect(() => {
        if (!selectedTemplate) return;
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % mjmlTips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedTemplate]);

    const toast = useToast();

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_{2,}/g, "_")
            .replace(/^_|_$/g, "")
            .toUpperCase();
    };

    const insertContent = (field: 'subject' | 'html_content' | 'mjml_content', content: string, isVariable: boolean = true) => {
        if (!selectedTemplate) return;

        const elementId = field === 'subject' ? 'subject-input' : 'body-textarea';
        const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement;

        if (!element) return;

        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;
        const text = (selectedTemplate[field] as string) || '';
        // Check if content already starts with {{ to avoid double wrapping
        // Also allow mailto links to pass raw if intended as variables (though usually variables are placeholders)
        // If content has {{ already, we assume it's a pre-formatted variable/link
        const contentToInsert = (isVariable && !content.includes('{{') && !content.startsWith('mailto:')) ? `{{${content}}}` : content;

        const newText = text.substring(0, start) + contentToInsert + text.substring(end);

        setSelectedTemplate({
            ...selectedTemplate,
            [field]: newText
        });

        // Cerrar menús
        setShowVariablesSubject(false);
        setShowVariablesBody(false);
        setShowMJMLComponents(false);

        // Devolver foco y posicionar cursor
        setTimeout(() => {
            element.focus();
            const newPos = start + contentToInsert.length;
            element.setSelectionRange(newPos, newPos);
        }, 10);
    };



    async function handleSearchUsers(query: string) {
        setTestUserSearch(query);
        if (!query || query.length < 3) {
            setFoundUsers([]);
            return;
        }

        try {
            setIsSearchingUsers(true);
            const users = await userService.searchUsers(query);
            setFoundUsers(users);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearchingUsers(false);
        }
    }

    async function handleSendTestEmail() {
        if (!selectedTemplate || !selectedTestUser) return;

        try {
            setIsSendingTest(true);

            // Compilar MJML a HTML si aplica
            let htmlFinal = selectedTemplate.html_content || '';
            if (selectedTemplate.mjml_content) {
                try {
                    // Pre-reemplazar variables para que MJML no falle en su validación interna (especialmente colores)
                    const mjmlPreparado = renderPreview(selectedTemplate.mjml_content);
                    const result = mjml2html(mjmlPreparado, { validationLevel: 'skip' });
                    htmlFinal = result.html;
                } catch (mjError) {
                    console.error('MJML compile error en prueba:', mjError);
                    // Usar HTML previo si falla la compilación
                }
            }

            // Construir datos del usuario de prueba para reemplazo de variables
            const datosUsuario: Record<string, string> = {
                usuario_id: selectedTestUser.id || '',
                nombres: selectedTestUser.nombres || '',
                apellidos: selectedTestUser.apellidos || '',
                email: selectedTestUser.email || '',
                usuario_email: selectedTestUser.email || '', // Mantener por compatibilidad si algún trigger viejo lo usa
                telefono: selectedTestUser.telefono || '+57 321 000 0000',
                fecha_registro: selectedTestUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                fecha_actualizacion: new Date().toLocaleString('es-ES'),
                codigo_referido: selectedTestUser.codigo_referido_personal || 'CODIGO_PRUEBA',
                // Variables de prueba genéricas para triggers que las necesiten
                reset_link: `${window.location.origin}/actualizar-contrasena?token=PRUEBA`,
                login_url: `${window.location.origin}/login`,
                expira_en: '10 minutos',
                codigo_2fa: '123456',
                "2fa_code": '123456',
                codigo: '123456',
                plan_nombre: selectedUserPlan?.name || selectedTestUser.plan_id || 'Plan Pro',
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dias_restantes: '3',
                monto_comision: '25.00',
                fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                monto_pago: selectedUserPlan?.price_monthly != null ? String(selectedUserPlan.price_monthly) : '0.00',
                dias_restantes: (() => {
                    const fv = selectedTestUser?.fecha_vencimiento_plan || selectedTestUser?.plan_expires_at;
                    if (!fv) return '30';
                    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
                    const venc = new Date(fv); venc.setHours(0, 0, 0, 0);
                    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    return String(Math.max(0, diff));
                })(),
                banco_nombre: 'Banco de Prueba',
                numero_cuenta: '****1234',
                referencia_pago: 'REF-PRUEBA-001',
                total_referidos: '5',
                referidos_para_siguiente_hito: '5',
                siguiente_hito: '10',
                lider_nombre: `${selectedTestUser.nombres || ''} ${selectedTestUser.apellidos || ''}`.trim(),
                lider_email: selectedTestUser.email || '',
                referido_nombre: 'Usuario Referido (Prueba)',
                referido_email: 'referido@prueba.com',
                fecha_cancelacion: new Date().toISOString().split('T')[0],
                fecha_activacion: new Date().toISOString().split('T')[0],
                fecha_desactivacion: new Date().toISOString().split('T')[0],
                fecha_actualizacion: new Date().toISOString().split('T')[0],
                fecha_aprobacion: new Date().toISOString().split('T')[0],
                fecha_procesado: new Date().toISOString().split('T')[0],
                email_nuevo: selectedTestUser.email || '',
                email_anterior: 'anterior@ejemplo.com',
                fecha_cambio: new Date().toISOString().split('T')[0],
                fecha_pago: new Date().toISOString().split('T')[0],
                fecha_ascenso: new Date().toISOString().split('T')[0],
                fecha_proximo_cobro: (() => {
                    const fv = selectedTestUser?.fecha_vencimiento_plan;
                    if (fv) return new Date(fv).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    const pe = selectedTestUser?.plan_expires_at;
                    if (pe) return new Date(pe).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    const reg = selectedTestUser?.created_at || selectedTestUser?.fecha_registro;
                    if (reg) { const d = new Date(reg); d.setDate(d.getDate() + 30); return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }); }
                    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                })(),
                plan_detalles: selectedUserPlan?.features ? selectedUserPlan.features.map((f: string) => `• ${f}`).join('<br>') : '• Gestión de hasta 5 tiendas<br>• Simulador de costos avanzado<br>• Integración con Meta Ads<br>• Soporte prioritario',
                plan_precio: selectedUserPlan?.price_monthly != null ? String(selectedUserPlan.price_monthly) : '0.00',
                link_pago: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=PRUEBA',
                email_soporte: globalConfig?.email_contacto || 'soporte@dropcost.com',
                telefono_soporte: globalConfig?.telefono || '+57 321 000 0000',
                // Variables de marca (Simuladas con los valores del config actual o defaults)
                color_primary: globalConfig?.color_primary || '#0066FF',
                color_primary_dark: globalConfig?.color_primary_dark || '#0052cc',
                color_primary_light: globalConfig?.color_primary_light || '#e6f0ff',
                color_success: globalConfig?.color_success || '#10B981',
                color_warning: globalConfig?.color_warning || '#F59E0B',
                color_error: globalConfig?.color_error || '#EF4444',
                color_neutral: globalConfig?.color_neutral || '#6B7280',
                color_bg_primary: globalConfig?.color_bg_primary || '#FFFFFF',
                color_bg_secondary: globalConfig?.color_bg_secondary || '#F9FAFB',
                color_text_primary: globalConfig?.color_text_primary || '#1F2937',
                color_text_secondary: globalConfig?.color_text_secondary || '#6B7280',
                color_text_inverse: globalConfig?.color_text_inverse || '#FFFFFF',
                color_sidebar_bg: globalConfig?.color_sidebar_bg || '#FFFFFF',
            };

            const resultado = await enviarPruebaPlantilla({
                plantilla_id: selectedTemplate.id,
                email_destino: selectedTestUser.email,
                datos_usuario: datosUsuario,
            });

            if (resultado.success) {
                toast.success('¡Enviado!', `Correo de prueba enviado a ${selectedTestUser.email}`);
            } else {
                toast.error('Error al enviar', resultado.error || 'No se pudo enviar el correo de prueba.');
            }
        } catch (error) {
            console.error('Error en handleSendTestEmail:', error);
            toast.error('Error', 'No se pudo enviar el correo de prueba.');
        } finally {
            setIsSendingTest(false);
        }
    }

    useEffect(() => {
        loadTemplates();
        loadGlobalConfig();
        loadAvailableTriggers();
    }, []);

    async function loadGlobalConfig() {
        try {
            const config = await configService.getConfig();
            setGlobalConfig(config as any);
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    async function loadAvailableTriggers() {
        try {
            const { data } = await (supabase as any)
                .from('email_triggers')
                .select('id, nombre_trigger, codigo_evento, categoria')
                .eq('activo', true)
                .order('categoria')
                .order('nombre_trigger');
            setAvailableTriggers(data || []);
        } catch (e) {
            console.error('Error cargando triggers:', e);
        }
    }

    const deviceWidths = {
        mobile: '375px',
        tablet: '768px',
        pc: '1000px'
    };

    async function loadTemplates() {
        try {
            setIsLoading(true);
            const data = await configService.getEmailTemplates() as any;
            setTemplates(data);
        } catch (error) {
            toast.error('Error', 'No se pudieron cargar las plantillas de email.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!selectedTemplate) return;
        try {
            setIsSaving(true);

            // Si hay contenido MJML, compilamos a HTML antes de guardar
            let finalHtml = selectedTemplate.html_content;
            if (selectedTemplate.mjml_content) {
                try {
                    // Al guardar, usamos validationLevel 'skip' para permitir que las variables {{color}} 
                    // persistan en el HTML y puedan ser inyectadas dinámicamente por el dispatcher después.
                    const result = mjml2html(selectedTemplate.mjml_content, { validationLevel: 'skip' });
                    finalHtml = result.html;
                } catch (mjError) {
                    console.error('MJML Compilation Error:', mjError);
                    // No detenemos el guardado, pero usamos el HTML previo si falla catastróficamente
                }
            }

            const updatedData = {
                subject: selectedTemplate.subject,
                html_content: finalHtml,
                mjml_content: selectedTemplate.mjml_content,
                description: selectedTemplate.description,
                sender_prefix: selectedTemplate.sender_prefix ?? null,
                sender_name: selectedTemplate.sender_name ?? null
            };

            await configService.updateEmailTemplate(selectedTemplate.id, updatedData);

            const updatedTemplate = { ...selectedTemplate, ...updatedData } as EmailItem;
            setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
            setSelectedTemplate(updatedTemplate);
            toast.success('¡Guardado!', 'La plantilla se ha actualizado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo guardar la plantilla.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleCreateTemplate() {
        if (!newItem.slug) return toast.error('Error', 'El slug es obligatorio.');
        try {
            setIsCreating(true);
            const data = await configService.createEmailTemplate({
                ...newItem,
                html_content: '<html><body> Nueva Plantilla </body></html>',
                variables: [],
                is_folder: false,
                parent_id: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null
            }) as any;

            // Si se seleccionó un trigger, gestionar exclusividad y crear asociación
            if (newItem.trigger_event && data?.id) {
                const trigger = availableTriggers.find(t => t.codigo_evento === newItem.trigger_event);
                if (trigger) {
                    // 1. Limpiar asociaciones previas (Exclusividad)
                    await (supabase as any).from('email_plantillas_triggers').delete().eq('trigger_id', trigger.id);
                    await (supabase as any).from('email_templates').update({ trigger_event: null }).eq('trigger_event', newItem.trigger_event);

                    // 2. Crear nueva asociación
                    await (supabase as any).from('email_plantillas_triggers').insert({
                        plantilla_id: data.id,
                        trigger_id: trigger.id,
                        activo: true,
                    });

                    // 3. Update local state to remove trigger from others
                    setTemplates(prev => prev.map(t => t.trigger_event === newItem.trigger_event ? { ...t, trigger_event: '' } : t));
                }
            }

            setTemplates([...templates, data]);
            setIsCreateModalOpen(false);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
            toast.success('¡Creado!', 'La plantilla se ha creado correctamente.');
            setSelectedTemplate(data as any);
        } catch (error) {
            toast.error('Error', 'No se pudo crear la plantilla.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleCreateFolder() {
        if (!newItem.slug) return toast.error('Error', 'El nombre es obligatorio.');
        try {
            setIsCreating(true);
            const data = await configService.createEmailTemplate({
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                subject: 'Carpeta',
                html_content: '',
                variables: [],
                is_folder: true,
                parent_id: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null
            }) as any;
            setTemplates([...templates, data]);
            setIsFolderModalOpen(false);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
            toast.success('¡Creado!', 'La carpeta se ha creado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo crear la carpeta.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleClone(item: EmailItem) {
        try {
            const data = await configService.createEmailTemplate({
                slug: `${item.slug}_copy`,
                description: `Copia de ${item.description}`,
                subject: item.subject,
                html_content: item.html_content,
                variables: item.variables,
                is_folder: false,
                parent_id: item.parent_id
            }) as any;
            setTemplates([...templates, data]);
            toast.success('¡Clonado!', 'La plantilla se ha clonado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo clonar la plantilla.');
        }
    }

    async function handleArchive(item: EmailItem) {
        try {
            const newStatus = item.status === 'activo' ? 'archivado' : 'activo';
            await configService.updateEmailTemplate(item.id, { status: newStatus });
            setTemplates(templates.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
            toast.success(newStatus === 'archivado' ? 'Archivado' : 'Activado', `Plantilla ${newStatus === 'archivado' ? 'archivada' : 'activada'} correctamente.`);
        } catch (error) {
            toast.error('Error', 'No se pudo actualizar el estado.');
        }
    }

    async function handleDelete(item: EmailItem) {
        setItemToManage(item);
        setIsConfirmDeleteOpen(true);
        setActiveMenuId(null);
    }

    async function confirmDelete() {
        if (!itemToManage) return;
        try {
            setIsCreating(true);
            await configService.deleteEmailTemplate(itemToManage.id);
            setTemplates(templates.filter(t => t.id !== itemToManage.id));
            toast.success('Borrado', `${itemToManage.is_folder ? 'Carpeta' : 'Plantilla'} eliminada correctamente.`);
            setIsConfirmDeleteOpen(false);
            setItemToManage(null);
        } catch (error) {
            toast.error('Error', 'No se pudo borrar el elemento.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleRenameSubmit() {
        if (!itemToManage || !newItem.slug) return;
        try {
            setIsCreating(true);

            // Update the template itself with basic info first
            await configService.updateEmailTemplate(itemToManage.id, {
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                trigger_event: newItem.trigger_event
            });

            // Enforce Unique Trigger Association & Update DB
            if (newItem.trigger_event) {
                const trigger = availableTriggers.find(t => t.codigo_evento === newItem.trigger_event);
                if (trigger) {
                    // 1. Remove ANY existing association for this trigger (Enforce Single Template per Trigger)
                    await (supabase as any).from('email_plantillas_triggers').delete().eq('trigger_id', trigger.id);

                    // 2. Visually clear 'trigger_event' from any other email template in DB
                    await (supabase as any).from('email_templates')
                        .update({ trigger_event: null })
                        .eq('trigger_event', newItem.trigger_event)
                        .neq('id', itemToManage.id);

                    // 3. Create NEW association for this template
                    await (supabase as any).from('email_plantillas_triggers').insert({
                        plantilla_id: itemToManage.id,
                        trigger_id: trigger.id,
                        activo: true
                    });
                }
            }

            // Update the template itself (redundant if already done above, but keeping for consistency with provided snippet)
            await configService.updateEmailTemplate(itemToManage.id, {
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                trigger_event: newItem.trigger_event
            });

            setTemplates(prev => prev.map(t => {
                // Update current template
                if (t.id === itemToManage.id) {
                    return {
                        ...t,
                        name: newItem.name,
                        slug: newItem.slug,
                        description: newItem.description,
                        trigger_event: newItem.trigger_event
                    };
                }
                // Clear trigger from old holder if exists (local state sync)
                if (newItem.trigger_event && t.trigger_event === newItem.trigger_event) {
                    return { ...t, trigger_event: '' }; // Remove trigger visual
                }
                return t;
            }));
            setIsRenameModalOpen(false);
            setItemToManage(null);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
            toast.success('¡Actualizado!', 'Se ha actualizado la información correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo actualizar.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleMoveSubmit(targetParentId: string | null) {
        if (!itemToManage) return;
        try {
            setIsCreating(true);
            await configService.updateEmailTemplate(itemToManage.id, { parent_id: targetParentId });
            setTemplates(templates.map(t => t.id === itemToManage.id ? { ...t, parent_id: targetParentId } : t));
            setIsMoveModalOpen(false);
            setItemToManage(null);
            toast.success('Movido', 'Elemento movido correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo mover el elemento.');
        } finally {
            setIsCreating(false);
        }
    }

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        if (activeMenuId) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenuId]);

    const ActionMenu = ({ item }: { item: EmailItem }) => (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (activeMenuId === item.id) {
                        setActiveMenuId(null);
                        setMenuPosition(null);
                    } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const MENU_HEIGHT = 320; // altura estimada del dropdown
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const openUpward = spaceBelow < MENU_HEIGHT;
                        setMenuPosition(
                            openUpward
                                ? { bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right }
                                : { top: rect.bottom + 8, right: window.innerWidth - rect.right }
                        );
                        setActiveMenuId(item.id);
                    }
                }}
                style={{
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
            >
                <MoreVertical size={20} />
            </button>

            {activeMenuId === item.id && menuPosition && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        ...(menuPosition.top !== undefined ? { top: menuPosition.top } : { bottom: menuPosition.bottom }),
                        right: menuPosition.right,
                        width: '256px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        padding: '8px',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
                    }}
                >
                    {item.is_folder ? (
                        <>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setNewItem({ name: item.name || '', slug: item.slug, description: item.description || '', subject: '', trigger_event: '', mjml_content: item.mjml_content || '', sender_prefix: item.sender_prefix || 'support' });
                                    setIsRenameModalOpen(true);
                                    setActiveMenuId(null);
                                    setMenuPosition(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Edit3 size={18} /> Renombrar carpeta
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 8px' }} />
                            <button
                                onClick={() => {
                                    handleDelete(item);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Trash2 size={18} /> Borrar Carpeta
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setNewItem({ name: item.name || '', slug: item.slug, description: item.description || '', subject: item.subject, trigger_event: item.trigger_event || '', mjml_content: item.mjml_content || '', sender_prefix: item.sender_prefix || 'support' });
                                    setIsRenameModalOpen(true);
                                    setActiveMenuId(null);
                                    setMenuPosition(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Edit3 size={18} /> Editar Información
                            </button>
                            <button
                                onClick={() => {
                                    handleClone(item);
                                    setActiveMenuId(null);
                                    setMenuPosition(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Copy size={18} /> Clonar Plantilla
                            </button>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setIsMoveModalOpen(true);
                                    setActiveMenuId(null);
                                    setMenuPosition(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <FolderInput size={18} /> Mover a Carpeta
                            </button>
                            <button
                                onClick={() => {
                                    handleArchive(item);
                                    setActiveMenuId(null);
                                    setMenuPosition(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Archive size={18} /> {item.status === 'activo' ? 'Archivar Plantilla' : 'Reactivar Plantilla'}
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 8px' }} />
                            <button
                                onClick={() => {
                                    handleDelete(item);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Trash2 size={18} /> Eliminar Permanente
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // Renderizador de previsualización simple
    const renderPreview = (content: string) => {
        if (!selectedTemplate) return content;
        let rendered = content;

        // 1. Obtener todas las variables posibles para el mapeo
        const brandingVars: Record<string, string> = {
            color_primary: globalConfig?.color_primary || '#0066FF',
            color_primary_dark: globalConfig?.color_primary_dark || '#0052cc',
            color_primary_light: globalConfig?.color_primary_light || '#e6f0ff',
            color_success: globalConfig?.color_success || '#10B981',
            color_warning: globalConfig?.color_warning || '#F59E0B',
            color_error: globalConfig?.color_error || '#EF4444',
            color_neutral: globalConfig?.color_neutral || '#6B7280',
            color_bg_primary: globalConfig?.color_bg_primary || '#FFFFFF',
            color_bg_secondary: globalConfig?.color_bg_secondary || '#F9FAFB',
            color_text_primary: globalConfig?.color_text_primary || '#1F2937',
            color_text_secondary: globalConfig?.color_text_secondary || '#6B7280',
            color_text_inverse: globalConfig?.color_text_inverse || '#FFFFFF',
            color_sidebar_bg: globalConfig?.color_sidebar_bg || '#FFFFFF',
            app_url: window.location.origin,
            login_url: `${window.location.origin}/login`,
            telefono: globalConfig?.telefono || '{{telefono}}',
            "teléfono": globalConfig?.telefono || '{{telefono}}',
            fecha_actualizacion: new Date().toLocaleDateString(),
            plan_nombre: selectedUserPlan?.name || '{{plan_nombre}}',
            plan_precio: selectedUserPlan?.price_monthly != null ? String(selectedUserPlan.price_monthly) : '{{plan_precio}}',
            plan_detalles: selectedUserPlan?.features ? selectedUserPlan.features.map((f: string) => `• ${f}`).join('<br>') : '{{plan_detalles}}',
            // Calcular fecha próximo cobro desde múltiples fuentes
            fecha_proximo_cobro: (() => {
                // Prioridad 1: campo fecha_vencimiento_plan
                const fv = selectedTestUser?.fecha_vencimiento_plan;
                if (fv) return new Date(fv).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                // Prioridad 2: campo plan_expires_at
                const pe = selectedTestUser?.plan_expires_at;
                if (pe) return new Date(pe).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                // Prioridad 3: calcular 30 días después del created_at como estimación
                const reg = selectedTestUser?.created_at || selectedTestUser?.fecha_registro;
                if (reg) {
                    const d = new Date(reg);
                    d.setDate(d.getDate() + 30);
                    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                }
                return '{{fecha_proximo_cobro}}';
            })(),
            link_pago: selectedTestUser?.link_pago_manual || '{{link_pago}}',
            email_soporte: globalConfig?.email_contacto || '{{email_soporte}}',
            empresa: globalConfig?.nombre_empresa || '{{empresa}}'
        };

        const securityVars: Record<string, string> = {
            codigo_2fa: '{{codigo_2fa}}',
            "2fa_code": '{{2fa_code}}',
            expira_en: '{{expira_en}}',
            codigo: '{{codigo}}',
            email_anterior: '{{email_anterior}}',
            email_nuevo: '{{email_nuevo}}'
        };

        // 2. Reemplazar variables registradas en la plantilla
        if (selectedTemplate.variables && Array.isArray(selectedTemplate.variables)) {
            selectedTemplate.variables.forEach(v => {
                let mockValue = `[${v}]`;

                // Usuario
                if (selectedTestUser) {
                    if (v === 'nombres') mockValue = selectedTestUser.nombres;
                    else if (v === 'apellidos') mockValue = selectedTestUser.apellidos;
                    else if (v === 'email') mockValue = selectedTestUser.email;
                    else if (v === 'telefono') mockValue = selectedTestUser.telefono || '[Sin Teléfono]';
                    else if (v === 'fecha_actualizacion') mockValue = new Date().toLocaleDateString();
                    else if (v === 'id' || v === 'user_id') mockValue = selectedTestUser.id.toString();
                    else if (v === 'nombre_completo') mockValue = `${selectedTestUser.nombres} ${selectedTestUser.apellidos}`;
                }

                // Mapeo directo si existe en branding o security
                if (brandingVars[v]) mockValue = brandingVars[v];
                if (securityVars[v]) mockValue = securityVars[v];

                // Otros defaults
                if (v === 'empresa') mockValue = globalConfig?.nombre_empresa || 'DropCost';
                if (v === 'link') mockValue = '#';
                if (v === 'url') mockValue = brandingVars.app_url;

                rendered = rendered.replace(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'gi'), mockValue);
            });
        }

        // 3. Fallback de emergencia para variables no registradas pero usadas
        const fallbacks: Record<string, string> = { ...brandingVars, ...securityVars };

        if (selectedTestUser) {
            fallbacks['nombres'] = selectedTestUser.nombres || '';
            fallbacks['apellidos'] = selectedTestUser.apellidos || '';
            fallbacks['email'] = selectedTestUser.email || '';
            fallbacks['telefono'] = selectedTestUser.telefono || '{{telefono}}';
            fallbacks['teléfono'] = selectedTestUser.telefono || '{{telefono}}';
            fallbacks['fecha_actualizacion'] = new Date().toLocaleDateString();
            fallbacks['nombre_completo'] = `${selectedTestUser.nombres || ''} ${selectedTestUser.apellidos || ''}`.trim();
        }

        // Agregar explícitamente los datos del plan (sobreescribe cualquier valor anterior)
        if (selectedUserPlan) {
            // IMPORTANTE: price_monthly puede ser 0 (plan gratuito/admin), checar != null y no solo truthy
            fallbacks['plan_nombre'] = selectedUserPlan.name || '{{plan_nombre}}';
            fallbacks['plan_precio'] = selectedUserPlan.price_monthly != null
                ? String(selectedUserPlan.price_monthly)
                : '{{plan_precio}}';
            fallbacks['plan_detalles'] = Array.isArray(selectedUserPlan.features)
                ? selectedUserPlan.features.map((f: string) => `• ${f}`).join('<br>')
                : '{{plan_detalles}}';
        }

        // Calcular fecha próximo cobro desde múltiples fuentes
        const calcFechaProximoCobro = () => {
            const fv = selectedTestUser?.fecha_vencimiento_plan;
            if (fv) return new Date(fv).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            const pe = selectedTestUser?.plan_expires_at;
            if (pe) return new Date(pe).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            const reg = selectedTestUser?.created_at || selectedTestUser?.fecha_registro;
            if (reg) {
                const d = new Date(reg);
                d.setDate(d.getDate() + 30);
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            }
            return '{{fecha_proximo_cobro}}';
        };
        if (selectedTestUser) {
            fallbacks['fecha_proximo_cobro'] = calcFechaProximoCobro();
        }

        // Calcular dias_restantes dinámicamente
        const calcDiasRestantes = () => {
            const fv = selectedTestUser?.fecha_vencimiento_plan || selectedTestUser?.plan_expires_at;
            if (fv) {
                const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
                const venc = new Date(fv); venc.setHours(0, 0, 0, 0);
                const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                return String(Math.max(0, diff));
            }
            // Fallback: calcular desde created_at + 30 días
            const reg = selectedTestUser?.created_at || selectedTestUser?.fecha_registro;
            if (reg) {
                const venc = new Date(reg); venc.setDate(venc.getDate() + 30);
                const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
                const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                return String(Math.max(0, diff));
            }
            return '{{dias_restantes}}';
        };
        if (selectedTestUser) {
            fallbacks['dias_restantes'] = calcDiasRestantes();
            // fecha_vencimiento como alias
            const fvRaw = selectedTestUser?.fecha_vencimiento_plan || selectedTestUser?.plan_expires_at;
            if (fvRaw) {
                fallbacks['fecha_vencimiento'] = new Date(fvRaw).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            }
        }

        Object.entries(fallbacks).forEach(([key, val]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
            // NO reemplazar con string vacío: deja el placeholder visible
            if (val !== '') {
                rendered = rendered.replace(regex, val);
            }
        });

        return rendered;
    };

    /**
     * Formatea el código MJML con indentación simple
     */
    const formatMJML = () => {
        if (!selectedTemplate || selectedTemplate.mjml_content === undefined) return;

        try {
            const mjml = selectedTemplate.mjml_content;
            let formatted = '';
            let pad = 0;

            // Dividir por etiquetas, manteniendo el contenido de texto intacto lo mejor posible
            // Esta es una implementación simple. Para algo robusto se necesitaría un parser real.
            // Para fines de UX rápido, esto funciona para estructuras limpias.
            const lines = mjml
                .replace(/>\s*</g, '>\n<') // Romper líneas entre etiquetas
                .split('\n');

            lines.forEach(line => {
                let indent = 0;
                const trimmed = line.trim();

                if (!trimmed) return;

                // Disminuir indentación si es etiqueta de cierre
                if (trimmed.match(/^<\//)) {
                    pad = Math.max(0, pad - 1);
                }

                indent = pad;

                // Aumentar indentación si es etiqueta de apertura pero no autocierre
                if (trimmed.match(/^<[^/].*[^/]>/) && !trimmed.match(/\/>$/) && !trimmed.match(/^<.*>.*<\/.*>$/)) {
                    pad += 1;
                }

                formatted += '  '.repeat(indent) + trimmed + '\n';
            });

            setSelectedTemplate({
                ...selectedTemplate,
                mjml_content: formatted.trim()
            });

            toast.success('Formato aplicado', 'El código se ha reordenado correctamente.');
        } catch (error) {
            console.error('Error formatting MJML:', error);
            toast.error('Error', 'No se pudo formatear el código.');
        }
    };

    if (isLoading) return <div className="flex justify-center p-24"><Spinner size="lg" /></div>;

    const currentFolderId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null;

    // Filtrar items
    const filteredItems = templates.filter(item => {
        const itemStatus = item.status || 'activo';
        const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
        const matchesSearch =
            item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPath = (item.parent_id || null) === currentFolderId;

        if (viewMode === 'recent') return matchesStatus && matchesSearch;
        return matchesStatus && matchesSearch && matchesPath;
    }).sort((a, b) => {
        if (viewMode === 'recent') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        if (a.is_folder && !b.is_folder) return -1;
        if (!a.is_folder && b.is_folder) return 1;
        return (a.name || a.slug).localeCompare(b.name || b.slug);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Plantillas de correo electrónico
                    </h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cree y gestione plantillas para todos sus correos electrónicos transaccionales.
                    </p>
                </div>

                {selectedTemplate && (
                    <div className="flex gap-3 mt-4 sm:mt-0">
                        {selectedTemplate.mjml_content === undefined && (
                            <Button
                                variant="secondary"
                                onClick={() => setIsConfirmMJMLOpen(true)}
                                leftIcon={<Zap size={16} />}
                                style={{ borderRadius: '12px', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', height: '48px' }}
                            >
                                Convertir a MJML
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => setSelectedTemplate(null)}
                            style={{ borderRadius: '12px', height: '48px', padding: '0 24px' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            leftIcon={<Save size={16} />}
                            style={{ borderRadius: '12px', height: '48px', padding: '0 24px' }}
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                )}
            </div>

            {!selectedTemplate ? (
                <React.Fragment>
                    {/* Toolbar más espaciosa */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '24px',
                        flexWrap: 'wrap',
                        marginBottom: '8px'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '700px' }}>
                            <div style={{ position: 'relative', flex: 2 }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, asunto o descripción..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 48px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '14px',
                                        fontSize: '14px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                />
                            </div>

                            <select
                                style={{
                                    padding: '0 16px',
                                    height: '52px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '14px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    flex: 1,
                                    minWidth: '160px',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="activo">Activos</option>
                                <option value="archivado">Archivados</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="w-full sm:w-auto">
                            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => setViewMode('recent')}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        backgroundColor: viewMode === 'recent' ? 'var(--bg-primary)' : 'transparent',
                                        color: viewMode === 'recent' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        boxShadow: viewMode === 'recent' ? 'var(--shadow-sm)' : 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Clock size={16} /> RECIENTES
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        backgroundColor: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
                                        color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ListIcon size={16} /> LISTADO
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                                        setIsFolderModalOpen(true);
                                    }}
                                    leftIcon={<Folder size={18} />}
                                    style={{ height: '52px', borderRadius: '14px', padding: '0 24px' }}
                                >
                                    Carpeta
                                </Button>
                                <Button
                                    onClick={() => {
                                        setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                                        setIsCreateModalOpen(true);
                                    }}
                                    leftIcon={<Plus size={18} />}
                                    style={{ height: '52px', borderRadius: '14px', padding: '0 24px' }}
                                >
                                    Nuevo
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumbs con aire */}
                    {navigationPath.length > 0 && (
                        <div className="flex items-center gap-3 px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors" onClick={() => setNavigationPath([])}>DIRECTORIO RAÍZ</span>
                            {navigationPath.map((id, index) => {
                                const folder = templates.find(t => t.id === id);
                                return (
                                    <React.Fragment key={id}>
                                        <ChevronRight size={12} className="opacity-40" />
                                        <span
                                            className="hover:text-[var(--color-primary)] cursor-pointer transition-colors text-[var(--text-secondary)]"
                                            onClick={() => setNavigationPath(navigationPath.slice(0, index + 1))}
                                        >
                                            {folder?.name || folder?.slug || 'CARPETA'}
                                        </span>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* Tabla de Plantillas - Elevada y Espaciosa */}
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <Card noPadding style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-lg)',
                            backgroundColor: 'var(--card-bg)',
                            overflow: 'visible'
                        }}>
                            {/* Wrapper con scroll horizontal interno - no afecta el dropdown */}
                            <div style={{
                                borderRadius: '16px',
                                minHeight: '450px',
                                overflowX: 'auto',
                                overflowY: 'visible',
                                WebkitOverflowScrolling: 'touch'
                            } as React.CSSProperties}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '16px' }}>Identificación</th>
                                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Estado</th>
                                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Actividad</th>
                                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsable</th>
                                            <th style={{ padding: '16px 24px', width: '80px', borderTopRightRadius: '16px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '100px 24px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', opacity: 0.4 }}>
                                                        <Mail size={56} strokeWidth={1.5} color="var(--text-tertiary)" />
                                                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sin elementos en esta ubicación</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => {
                                                        const newItemData = {
                                                            name: item.name,
                                                            slug: item.slug,
                                                            description: item.description,
                                                            subject: item.subject || '',
                                                            trigger_event: item.trigger_event || '',
                                                            mjml_content: item.mjml_content || '',
                                                            sender_prefix: item.sender_prefix || 'support'
                                                        };
                                                        setNewItem(newItemData);
                                                        item.is_folder ? setNavigationPath([...navigationPath, item.id]) : setSelectedTemplate(item);
                                                    }}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.25s ease'
                                                    }}
                                                    className="group hover:bg-[var(--bg-tertiary)]"
                                                >
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                                            <div style={{
                                                                width: '46px',
                                                                height: '46px',
                                                                borderRadius: '12px',
                                                                background: item.is_folder ? 'linear-gradient(135deg, #FFB800, #FF8A00)' : 'linear-gradient(135deg, #0066FF, #0047BB)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                transition: 'transform 0.2s ease'
                                                            }} className="group-hover:scale-110">
                                                                {item.is_folder ? <Folder size={22} fill="white" /> : <FileEdit size={22} />}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                                    {item.name || item.slug}
                                                                </span>
                                                                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {item.description || (item.is_folder ? 'Carpeta organizada' : 'Sin descripción adicional')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                                {item.is_folder ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF8A00' }}>
                                                                        <Folder size={16} /> Directorio
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                                                                        <Zap size={16} /> Plantilla
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!item.is_folder && item.trigger_event && (
                                                                <div style={{
                                                                    fontSize: '10px',
                                                                    fontWeight: 900,
                                                                    color: 'var(--color-primary)',
                                                                    backgroundColor: 'var(--color-primary-light)',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    alignSelf: 'flex-start',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    Event: {item.trigger_event}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <Badge variant={(item.status || 'activo') === 'activo' ? 'modern-success' : 'pill-secondary'}>
                                                            {(item.status || 'activo') === 'activo' ? 'ACTIVA' : 'ARCHIVADA'}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                                {new Date(item.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                            </span>
                                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                                                {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '10px',
                                                                backgroundColor: 'var(--color-primary-light)',
                                                                border: '1.5px solid var(--color-primary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                color: 'var(--color-primary)',
                                                                boxShadow: '0 2px 4px rgba(0,102,255,0.1)'
                                                            }}>
                                                                {(item.updated_by_name || 'S').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                    {item.updated_by_name || 'SISTEMA'}
                                                                </span>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>Editor Admin</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                        <ActionMenu item={item} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    <Modal
                        isOpen={isRenameModalOpen}
                        onClose={() => setIsRenameModalOpen(false)}
                        title={itemToManage?.is_folder ? "Editar Carpeta" : "Editar Información"}
                    >
                        <div className="flex flex-col gap-6">
                            {itemToManage?.is_folder ? (
                                <>
                                    <Input
                                        label="Nombre de la Carpeta"
                                        value={newItem.slug}
                                        onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                                        placeholder="Ej: Marketing, Sistema..."
                                    />
                                    <Input
                                        label="Descripción (Opcional)"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="¿Para qué sirve esta carpeta?"
                                    />
                                </>
                            ) : (
                                <>
                                    <Input
                                        label="Nombre Visual"
                                        value={newItem.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewItem({ ...newItem, name: val, slug: generateSlug(val) });
                                        }}
                                        placeholder="Ej: Bienvenida"
                                    />

                                    <div className="space-y-1.5">
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Disparador (Trigger)</label>
                                        <select
                                            value={newItem.trigger_event}
                                            onChange={(e) => setNewItem({ ...newItem, trigger_event: e.target.value })}
                                            className="w-full h-11 px-4 rounded-[10px] bg-[var(--bg-primary)] border-[1.5px] border-[var(--border-color)] text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 16px center',
                                                backgroundSize: '16px',
                                                paddingLeft: '16px'
                                            }}
                                        >
                                            <option value="">Sin Disparador Automático</option>

                                            {/* Categoría: Usuario */}
                                            <optgroup label="Usuario">
                                                {availableTriggers.filter(t => t.categoria === 'usuario').map(t => (
                                                    <option key={t.id} value={t.codigo_evento}>{t.nombre_trigger}</option>
                                                ))}
                                            </optgroup>

                                            {/* Categoría: Referidos */}
                                            <optgroup label="Referidos">
                                                {availableTriggers.filter(t => t.categoria === 'referido').map(t => (
                                                    <option key={t.id} value={t.codigo_evento}>{t.nombre_trigger}</option>
                                                ))}
                                            </optgroup>

                                            {/* Categoría: Pago */}
                                            <optgroup label="Pagos">
                                                {availableTriggers.filter(t => t.categoria === 'pago').map(t => (
                                                    <option key={t.id} value={t.codigo_evento}>{t.nombre_trigger}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Slug (ID del Sistema)</label>
                                        <div className="bg-[var(--bg-secondary)] border-[1.5px] border-[var(--border-color)] border-dashed" style={{ padding: '12px 16px', borderRadius: '10px' }}>
                                            <code className="text-[11px] text-[var(--color-primary)] font-bold tracking-widest uppercase">{newItem.slug || '...'}</code>
                                        </div>
                                    </div>

                                    <Input
                                        label="Descripción"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Para qué sirve esta plantilla..."
                                    />
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setIsRenameModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleRenameSubmit} isLoading={isCreating}>Guardar Cambios</Button>
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={isMoveModalOpen}
                        onClose={() => {
                            setIsMoveModalOpen(false);
                            setFolderSearchQuery('');
                            setSelectedFolderId(null);
                        }}
                        title="Mover a Carpeta"
                        size="sm"
                    >
                        <div className="flex flex-col gap-6">
                            <div>
                                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mb-4 opacity-70">
                                    Destino para: {itemToManage?.name || itemToManage?.slug}
                                </p>
                                <Input
                                    placeholder="Buscar carpeta..."
                                    value={folderSearchQuery}
                                    onChange={(e) => setFolderSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar" style={{ minHeight: '180px' }}>
                                {/* Opción Raíz */}
                                {(!folderSearchQuery || 'inicio raíz'.includes(folderSearchQuery.toLowerCase())) && (
                                    <button
                                        onClick={() => setSelectedFolderId(null)}
                                        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left border-[1.5px] ${selectedFolderId === null ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent hover:bg-[var(--bg-secondary)]'}`}
                                    >
                                        <div className={`flex items-center justify-center rounded-lg`} style={{ width: '32px', height: '32px', minWidth: '32px', backgroundColor: selectedFolderId === null ? 'var(--color-primary)' : 'var(--bg-secondary)', color: selectedFolderId === null ? 'white' : 'var(--text-tertiary)' }}>
                                            <Layout size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${selectedFolderId === null ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>Raíz / Inicio</span>
                                        </div>
                                    </button>
                                )}

                                {templates
                                    .filter(t => t.is_folder && t.id !== itemToManage?.id && (t.name || t.slug).toLowerCase().includes(folderSearchQuery.toLowerCase()))
                                    .map(folder => {
                                        const isSelected = selectedFolderId === folder.id;
                                        return (
                                            <button
                                                key={folder.id}
                                                onClick={() => setSelectedFolderId(folder.id)}
                                                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left border-[1.5px] ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-transparent hover:bg-[var(--bg-secondary)]'}`}
                                            >
                                                <div className={`flex items-center justify-center rounded-lg`} style={{ width: '32px', height: '32px', minWidth: '32px', backgroundColor: isSelected ? 'var(--color-primary)' : 'rgba(245, 158, 11, 0.1)', color: isSelected ? 'white' : '#F59E0B' }}>
                                                    <Folder size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>{folder.name || folder.slug}</span>
                                                </div>
                                            </button>
                                        );
                                    })
                                }

                                {templates.filter(t => t.is_folder && t.id !== itemToManage?.id && (t.name || t.slug).toLowerCase().includes(folderSearchQuery.toLowerCase())).length === 0 && folderSearchQuery && (
                                    <div className="py-8 text-center text-[var(--text-tertiary)]">
                                        <p className="text-sm">No se encontraron carpetas</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" fullWidth onClick={() => {
                                    setIsMoveModalOpen(false);
                                    setFolderSearchQuery('');
                                    setSelectedFolderId(null);
                                }}>Cancelar</Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleMoveSubmit(selectedFolderId)}
                                    disabled={selectedFolderId === itemToManage?.parent_id}
                                    isLoading={isCreating}
                                >
                                    Mover Aquí
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </React.Fragment>
            ) : (
                /* Editor y Vista Previa en Vivo */
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg">
                                <Mail size={16} />
                            </div>
                            <span className="text-base font-bold text-[var(--text-primary)]">Editando Plantilla: <span className="text-[var(--color-primary)]">{selectedTemplate?.name}</span></span>
                        </div>
                    </div>

                    {/* Sección Superior: Editor de Código e Info Lateral */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                        {/* Editor Principal */}
                        <div className="xl:col-span-8">
                            <Card title="Editor de Plantilla">
                                <div className="flex flex-col gap-8">
                                    <div className="flex flex-col gap-3">
                                        <label htmlFor="subject-input" className="text-sm font-bold text-[var(--text-primary)]">
                                            Asunto del Correo
                                        </label>
                                        <Input
                                            id="subject-input"
                                            value={selectedTemplate?.subject || ''}
                                            onChange={(e) => selectedTemplate && setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                                            placeholder="Ej: Bienvenido a la plataforma"
                                            leftIcon={<Type size={16} />}
                                            rightElement={
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowVariablesSubject(!showVariablesSubject)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '10px 20px',
                                                            borderRadius: '10px',
                                                            transition: 'all 200ms ease',
                                                            backgroundColor: showVariablesSubject ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                                            color: showVariablesSubject ? 'white' : 'var(--text-tertiary)',
                                                            border: `1px solid ${showVariablesSubject ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!showVariablesSubject) e.currentTarget.style.color = 'var(--color-primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!showVariablesSubject) e.currentTarget.style.color = 'var(--text-tertiary)';
                                                        }}
                                                        title="Insertar variable"
                                                    >
                                                        <Tag size={14} />
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Variables</span>
                                                        <ChevronDown size={12} style={{ transform: showVariablesSubject ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                                                    </button>
                                                    {showVariablesSubject && (
                                                        <VariableList onSelect={(v) => insertContent('subject', v)} />
                                                    )}
                                                </div>
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 relative">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                <Layout size={16} className="text-[var(--color-primary)]" />
                                                {selectedTemplate?.mjml_content !== undefined ? 'Editor de Estructura (MJML)' : 'Cuerpo del Mensaje (HTML)'}
                                            </label>

                                            <div className="flex items-center gap-2 relative">
                                                {/* Botón de Auto-Formato */}
                                                {selectedTemplate?.mjml_content !== undefined && (
                                                    <button
                                                        onClick={formatMJML}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'var(--bg-primary)',
                                                            border: '1px solid var(--border-color)',
                                                            color: 'var(--text-tertiary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 200ms ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                            e.currentTarget.style.color = 'var(--color-primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                                            e.currentTarget.style.color = 'var(--text-tertiary)';
                                                        }}
                                                        title="Auto-formato (Prettier)"
                                                    >
                                                        <AlignLeft size={16} />
                                                    </button>
                                                )}
                                                {/* Biblioteca de Componentes MJML (Solo si es MJML) */}
                                                {selectedTemplate?.mjml_content !== undefined && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowMJMLComponents(!showMJMLComponents)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                padding: '10px 20px',
                                                                borderRadius: '10px',
                                                                transition: 'all 200ms ease',
                                                                backgroundColor: showMJMLComponents ? 'var(--color-primary)' : 'var(--bg-primary)',
                                                                color: showMJMLComponents ? 'white' : 'var(--text-tertiary)',
                                                                border: `1px solid ${showMJMLComponents ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                                cursor: 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!showMJMLComponents) e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                                if (!showMJMLComponents) e.currentTarget.style.color = 'var(--color-primary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!showMJMLComponents) e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                if (!showMJMLComponents) e.currentTarget.style.color = 'var(--text-tertiary)';
                                                            }}
                                                        >
                                                            <Layout size={14} />
                                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Biblioteca MJML</span>
                                                            <ChevronDown size={12} style={{ transform: showMJMLComponents ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                                                        </button>
                                                        {showMJMLComponents && (
                                                            <div className="absolute right-0 top-full z-[110]">
                                                                <MJMLComponentList onSelect={(component) => {
                                                                    setMjmlModalComponent(component);
                                                                    setShowMJMLComponents(false);
                                                                }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <MJMLAttributeModal
                                                    isOpen={!!mjmlModalComponent}
                                                    onClose={() => setMjmlModalComponent(null)}
                                                    component={mjmlModalComponent}
                                                    onInsert={(code) => {
                                                        insertContent('mjml_content', code, false);
                                                        setMjmlModalComponent(null);
                                                    }}
                                                />

                                                <button
                                                    onClick={() => setShowVariablesBody(!showVariablesBody)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 20px',
                                                        borderRadius: '10px',
                                                        transition: 'all 200ms ease',
                                                        backgroundColor: showVariablesBody ? 'var(--color-primary)' : 'var(--bg-primary)',
                                                        color: showVariablesBody ? 'white' : 'var(--text-tertiary)',
                                                        border: `1px solid ${showVariablesBody ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!showVariablesBody) e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                        if (!showVariablesBody) e.currentTarget.style.color = 'var(--color-primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!showVariablesBody) e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        if (!showVariablesBody) e.currentTarget.style.color = 'var(--text-tertiary)';
                                                    }}
                                                >
                                                    <Zap size={14} />
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Autocompletar Variable</span>
                                                    <ChevronDown size={12} style={{ transform: showVariablesBody ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                                                </button>
                                                {showVariablesBody && (
                                                    <div className="absolute right-0 top-full z-[110]">
                                                        <VariableList onSelect={(v) => insertContent(selectedTemplate?.mjml_content !== undefined ? 'mjml_content' : 'html_content', v)} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <CodeEditor
                                            value={selectedTemplate?.mjml_content ?? selectedTemplate?.html_content ?? ''}
                                            onChange={(val) => {
                                                if (!selectedTemplate) return;
                                                if (selectedTemplate.mjml_content !== undefined) {
                                                    setSelectedTemplate({ ...selectedTemplate, mjml_content: val });
                                                } else {
                                                    setSelectedTemplate({ ...selectedTemplate, html_content: val });
                                                }
                                            }}
                                            language={selectedTemplate?.mjml_content !== undefined ? 'mjml' : 'html'}
                                            minHeight="400px"
                                            maxHeight="600px"
                                            id="body-textarea"
                                        />
                                    </div>
                                </div>
                            </Card>

                        </div>

                        {/* Info y Variables Side */}
                        <div className="xl:col-span-4 flex flex-col gap-6">
                            <Card title="Herramientas de Desarrollador">
                                <div className="flex flex-col gap-8 p-2">
                                    {/* Configuración del Remitente */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                            <Mail size={16} className="text-[var(--text-tertiary)]" />
                                            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Remitente Transaccional</span>
                                        </div>

                                        <SenderSelector
                                            currentName={selectedTemplate?.sender_name}
                                            currentPrefix={selectedTemplate?.sender_prefix}
                                            domain={globalConfig?.site_url ? globalConfig.site_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'dropcost.com'}
                                            templates={templates}
                                            globalConfig={globalConfig}
                                            onRefresh={loadTemplates}
                                            onSelect={(name: string, prefix: string) => {
                                                if (selectedTemplate) {
                                                    const updated = {
                                                        ...selectedTemplate,
                                                        sender_name: name,
                                                        sender_prefix: prefix
                                                    };
                                                    setSelectedTemplate(updated);
                                                    setTemplates(templates.map(t => t.id === updated.id ? updated : t));
                                                }
                                            }}
                                        />

                                        <p className="text-[10px] text-[var(--text-tertiary)] italic">
                                            Define quién envía este correo. El dominio es fijo para asegurar entregabilidad (SPF/DKIM).
                                        </p>
                                    </div>

                                    {/* Envío de Prueba */}
                                    <div className="space-y-4 pt-6 border-t border-[var(--border-color)] border-dashed">
                                        <h5
                                            className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2"
                                            style={{ marginTop: '16px', marginBottom: '12px' }}
                                        >
                                            <Send size={14} /> Probar envío Real
                                        </h5>

                                        <div className="flex flex-col gap-4">
                                            <TestUserSelector
                                                selectedUser={selectedTestUser}
                                                onSelect={(user: any) => setSelectedTestUser(user)}
                                            />

                                            <Button
                                                size="sm"
                                                fullWidth
                                                onClick={handleSendTestEmail}
                                                isLoading={isSendingTest}
                                                leftIcon={<Send size={14} />}
                                                disabled={!selectedTestUser}
                                                className={!selectedTestUser ? "opacity-50 cursor-not-allowed" : ""}
                                            >
                                                Enviar Correo de Prueba
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Variables soportadas */}
                                    <div className="space-y-4 pt-6 border-t border-[var(--border-color)] border-dashed">
                                        <h5
                                            className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2"
                                            style={{ marginTop: '16px', marginBottom: '12px' }}
                                        >
                                            <Code size={14} /> Variables Soportadas
                                        </h5>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedTemplate?.variables.map(v => (
                                                <div
                                                    key={v}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 16px',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        borderRadius: '20px',
                                                        color: '#10B981',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        transition: 'all 200ms ease',
                                                        cursor: 'default',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <CheckCircle2 size={12} strokeWidth={3} />
                                                    <span style={{ lineHeight: '1' }}>{"{{"}{v}{"}}"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div
                                style={{
                                    padding: '20px 24px',
                                    backgroundColor: 'var(--color-primary-light)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 102, 255, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    minHeight: '100px',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                className="shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                                        <Info size={16} className="text-[var(--color-primary)]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Tip de Desarrollador</span>
                                </div>

                                <div className="relative h-12 flex items-center">
                                    {mjmlTips.map((tip, idx) => (
                                        <p
                                            key={idx}
                                            style={{
                                                color: 'var(--color-primary)',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                lineHeight: '1.5',
                                                margin: 0,
                                                position: 'absolute',
                                                left: 0,
                                                right: 0,
                                                transition: 'all 500ms ease',
                                                opacity: currentTipIndex === idx ? 1 : 0,
                                                transform: currentTipIndex === idx ? 'translateX(0)' : currentTipIndex > idx ? 'translateX(-20px)' : 'translateX(20px)',
                                                visibility: currentTipIndex === idx ? 'visible' : 'hidden'
                                            }}
                                        >
                                            {tip}
                                        </p>
                                    ))}
                                </div>

                                <div className="flex gap-1.5 mt-2">
                                    {mjmlTips.map((_, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentTipIndex(idx)}
                                            style={{
                                                width: currentTipIndex === idx ? '16px' : '6px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                backgroundColor: 'var(--color-primary)',
                                                opacity: currentTipIndex === idx ? 1 : 0.2,
                                                transition: 'all 300ms ease',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN VISTA PREVIA: Siempre visible y Responsiva */}
                    <Card
                        title="Vista Previa en Vivo"
                        icon={<Eye size={18} />}
                        headerAction={
                            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <button
                                    onClick={() => setPreviewDevice('mobile')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'mobile' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'mobile' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'mobile' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista Móvil (375px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="18" x="7" y="3" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('tablet')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'tablet' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'tablet' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'tablet' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista Tablet (768px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><line x1="12" x2="12" y1="18" y2="18" /></svg>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('pc')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'pc' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'pc' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'pc' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista PC (1000px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" ry="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                                </button>
                            </div>
                        }
                    >

                        {/* Canvas de Previsualización */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                backgroundColor: 'var(--bg-tertiary)',
                                padding: '40px 20px',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                minHeight: '500px',
                                overflow: 'hidden',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    maxWidth: deviceWidths[previewDevice],
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                    overflow: 'hidden',
                                    height: 'fit-content',
                                    transition: 'max-width 400ms cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* Mail Client Mock Header */}
                                <div style={{ backgroundColor: '#f8fafc', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                                    {/* Window Bar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nuevo Mensaje</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid #cbd5e1' }}></div>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid #cbd5e1' }}></div>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid #cbd5e1' }}></div>
                                        </div>
                                    </div>

                                    {/* Header Fields */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, minWidth: '60px' }}>De:</span>
                                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                                                {selectedTemplate.sender_name || globalConfig?.nombre_empresa || 'Remitente'}
                                                <code style={{ fontSize: '11px', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                                                    {selectedTemplate.sender_prefix || '...'}@{globalConfig?.email_domain || 'dropcost.com'}
                                                </code>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, minWidth: '60px' }}>Para:</span>
                                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                                                {selectedTestUser ? `${selectedTestUser.nombres} ${selectedTestUser.apellidos}` : 'Usuario de Prueba'}
                                                <code style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                                                    {selectedTestUser ? selectedTestUser.email : 'correo@ejemplo.com'}
                                                </code>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, minWidth: '60px' }}>Asunto:</span>
                                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 700 }}>{renderPreview(selectedTemplate.subject || '(Sin Asunto)')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Body */}
                                <div
                                    className="preview-iframe-mock"
                                    style={{
                                        padding: previewDevice === 'mobile' ? '20px' : '40px',
                                        backgroundColor: '#ffffff',
                                        overflowX: 'hidden'
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: (() => {
                                            if (!selectedTemplate) return '';

                                            let contentToRender = selectedTemplate.html_content;

                                            if (selectedTemplate.mjml_content) {
                                                try {
                                                    // Usamos renderPreview ANTES de compilar para que MJML reciba colores reales
                                                    // y no genere advertencias de validación en la consola.
                                                    const mjmlConVariables = renderPreview(selectedTemplate.mjml_content);
                                                    const { html, errors } = mjml2html(mjmlConVariables, { validationLevel: 'skip' });

                                                    if (errors && errors.length > 0) {
                                                        // Opcional: Solo loguear errores que no sean de variables si fuera necesario
                                                        // console.warn('MJML Errors:', errors);
                                                    }
                                                    contentToRender = html;
                                                } catch (error: any) {
                                                    // Si falla por falta de root tags, intentamos envolverlo para preview
                                                    if (error.message && error.message.includes('enclosed in <mjml> tags')) {
                                                        try {
                                                            const wrapped = `<mjml><mj-body>${selectedTemplate.mjml_content}</mj-body></mjml>`;
                                                            contentToRender = mjml2html(wrapped).html;
                                                        } catch (retryError) {
                                                            return `<div style="padding: 20px; text-align: center; color: #EF4444;">
                                                                <h3 style="margin-bottom: 8px;">Error de Estructura MJML</h3>
                                                                <p style="font-size: 12px; opacity: 0.8;">El código no es válido. Revisa las etiquetas de apertura/cierre.</p>
                                                            </div>`;
                                                        }
                                                    } else {
                                                        return `<div style="padding: 20px; text-align: center; color: #EF4444;">
                                                            <h3 style="margin-bottom: 8px;">Error de Renderizado</h3>
                                                            <p style="font-size: 12px; opacity: 0.8;">${error.message}</p>
                                                        </div>`;
                                                    }
                                                }
                                            }

                                            return renderPreview(contentToRender);
                                        })()
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modales de Creación */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                }}
                title="Crear Nueva Plantilla"
                size="sm"
            >
                <div className="flex flex-col gap-7">
                    <div className="flex flex-col gap-5">
                        <Input
                            label="Nombre Visual"
                            placeholder="Ej: Bienvenida Cliente Nuevo"
                            value={newItem.name}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewItem(prev => ({ ...prev, name: val, slug: generateSlug(val) }));
                            }}
                        />
                        <div className="flex flex-col gap-2.5">
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Slug Automático (ID del Sistema)</label>
                            <div className="bg-[var(--bg-secondary)] border-[1.5px] border-[var(--border-color)] border-dashed" style={{ padding: '14px 18px', borderRadius: '12px' }}>
                                <code className="text-[11px] text-[var(--color-primary)] font-bold tracking-widest uppercase">{newItem.slug || 'ESPERANDO NOMBRE...'}</code>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Disparador (Trigger)</label>
                            <select
                                value={newItem.trigger_event}
                                onChange={(e) => setNewItem(prev => ({ ...prev, trigger_event: e.target.value }))}
                                className="w-full h-12 px-4 rounded-[12px] bg-[var(--bg-primary)] border-[1.5px] border-[var(--border-color)] text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 16px center',
                                    backgroundSize: '16px',
                                    paddingLeft: '16px'
                                }}
                            >
                                <option value="">Sin Disparador Automático</option>
                                {availableTriggers.length === 0 ? (
                                    <option disabled>Cargando triggers...</option>
                                ) : (
                                    [
                                        { key: 'usuario', label: '👤 Usuario' },
                                        { key: 'referido', label: '🤝 Referidos' },
                                        { key: 'pago', label: '💳 Pagos' },
                                    ].map(({ key, label }) => {
                                        const group = availableTriggers.filter(t => t.categoria === key);
                                        if (group.length === 0) return null;
                                        return (
                                            <optgroup key={key} label={label}>
                                                {group.map(t => (
                                                    <option key={t.id} value={t.codigo_evento}>
                                                        {t.nombre_trigger}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        );
                                    })
                                )}
                            </select>
                            {newItem.trigger_event && (() => {
                                const selected = availableTriggers.find(t => t.codigo_evento === newItem.trigger_event);
                                return selected ? (
                                    <p className="text-[11px]" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                        ⚡ Código: <code style={{ fontFamily: 'monospace' }}>{selected.codigo_evento}</code>
                                    </p>
                                ) : null;
                            })()}
                            <p className="text-[10px] text-[var(--text-tertiary)] italic">El disparador automatiza el envío cuando sucede el evento.</p>
                        </div>

                        <Input
                            label="Descripción"
                            placeholder="¿Para qué sirve esta plantilla?"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => {
                            setIsCreateModalOpen(false);
                            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                        }}>Cancelar</Button>
                        <Button fullWidth onClick={handleCreateTemplate} isLoading={isCreating}>Crear Plantilla</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => {
                    setIsFolderModalOpen(false);
                    setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                }}
                title="Nueva Carpeta"
                size="sm"
            >
                <div className="flex flex-col gap-5">
                    <Input
                        label="Nombre de la Carpeta"
                        placeholder="ej: Marketing, Sistema..."
                        value={newItem.slug}
                        onChange={(e) => setNewItem(prev => ({ ...prev, slug: e.target.value }))}
                    />
                    <Input
                        label="Descripción (Opcional)"
                        placeholder="¿Para qué sirve esta carpeta?"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => {
                            setIsFolderModalOpen(false);
                            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '', mjml_content: '', sender_prefix: 'support' });
                        }}>Cancelar</Button>
                        <Button fullWidth onClick={handleCreateFolder} isLoading={isCreating}>Crear Carpeta</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={isConfirmDeleteOpen}
                title={itemToManage?.is_folder ? '¿Eliminar carpeta?' : '¿Eliminar plantilla?'}
                description={itemToManage?.is_folder
                    ? `Esta acción eliminará la carpeta "${itemToManage.slug}" y todo su contenido de forma permanente.`
                    : `¿Estás seguro de que deseas eliminar la plantilla "${itemToManage?.name || itemToManage?.slug}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsConfirmDeleteOpen(false);
                    setItemToManage(null);
                }}
                isLoading={isCreating}
            />

            <ConfirmDialog
                isOpen={isConfirmMJMLOpen}
                title="¿Convertir a MJML?"
                description="Esto reemplazará el código HTML actual con una estructura MJML base. Esta acción es ideal para hacer que tu correo sea 100% responsivo, pero el código HTML previo se perderá."
                confirmLabel="Convertir ahora"
                onConfirm={() => {
                    if (selectedTemplate) {
                        setSelectedTemplate({
                            ...selectedTemplate,
                            mjml_content: `<mjml>\n  <mj-body>\n    <mj-section backgroundColor="#ffffff">\n      <mj-column>\n        <mj-text font-size="20px" color="var(--color-primary)">${selectedTemplate.name}</mj-text>\n        <mj-divider border-color="var(--color-primary)"></mj-divider>\n        <mj-text line-height="24px">${selectedTemplate.html_content}</mj-text>\n      </mj-column>\n    </mj-section>\n  </mj-body>\n</mjml>`
                        });
                    }
                    setIsConfirmMJMLOpen(false);
                }}
                onCancel={() => setIsConfirmMJMLOpen(false)}
                variant="info"
            />
        </div>
    );
}
