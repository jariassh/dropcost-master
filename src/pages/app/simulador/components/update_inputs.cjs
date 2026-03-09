const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, 'InputCards.tsx');
let txt = fs.readFileSync(f, 'utf-8');

const t = {
    dm: 'Porcentaje de ganancia que deseas obtener por venta. En COD un margen saludable oscila entre 20% y 30%.',
    pc: 'Costo que se paga al proveedor por cada unidad del producto.',
    sc: 'Promedio del flete cobrado por las transportadoras. En Colombia suele estar entre $18.000 y $25.000 COP.',
    cc: 'Porcentaje que las transportadoras cobran por recaudar dinero COD. En Colombia varía entre 1% y 3%.',
    rr: 'Porcentaje de devoluciones sobre pedidos enviados. En Colombia suele ser entre 15% y 20%.',
    oe: 'Gastos operacionales: comisiones de plataforma, empaques, seguros de envío, etc.',
    ac: 'Costo por Adquisición promedio en Meta Ads. En Colombia suele estar entre $15.000 y $25.000 COP.',
    cp: 'Porcentaje de pedidos que se cancelan antes del envío. En COD normalmente ronda el 20%.'
};

txt = txt.replace('import type { SimulatorInputs }', 'import { useState } from \"react\";\nimport type { SimulatorInputs }');
txt = txt.replace('inputs: SimulatorInputs;', 'inputs: SimulatorInputs; currency?: string; country?: string;');
txt = txt.replace('export function InputCards({ inputs, onChange }', 'export function InputCards({ inputs, onChange, currency = \"USD\", country = \"US\" }');

txt = txt.replace('label=\"Costo Unitario (USD)\"', 'label={`Costo Unitario (${currency})`} tooltip=\"' + t.pc + '\"');
txt = txt.replace('label=\"Margen Objetivo (%)\"', 'label=\"Margen Objetivo (%)\" tooltip=\"' + t.dm + '\"');
txt = txt.replace('label=\"CPA Esperado (USD)\"', 'label={`CPA Esperado (${currency})`} tooltip=\"' + t.ac + '\"');
txt = txt.replace('label=\"% de Cancelación\"', 'label=\"% de Cancelación\" tooltip=\"' + t.cp + '\"');
txt = txt.replace('label=\"Flete (USD)\"', 'label={`Flete (${currency})`} tooltip=\"' + t.sc + '\"');
txt = txt.replace('label=\"Recaudo (%)\"', 'label=\"Recaudo (%)\" tooltip=\"' + t.cc + '\"');
txt = txt.replace('label=\"% Devolución\"', 'label=\"% Devolución\" tooltip=\"' + t.rr + '\"');
txt = txt.replace('label=\"Otros (USD)\"', 'label={`Otros (${currency})`} tooltip=\"' + t.oe + '\"');

txt = txt.replace('function InputField({ label, value, onChange, hint, suffix }', 'function InputField({ label, value, onChange, hint, suffix, tooltip }');

// Regex to find and replace the label block
txt = txt.replace(/<label style=\{\{ fontSize: '11px', fontWeight: 800, color: 'var\(--text-secondary\)', textTransform: 'uppercase', letterSpacing: '0.02em' \}\}>\s*\{label\}\s*<\/label>/,
    `<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                    {label}
                </label>
                {tooltip && <InfoTooltip text={tooltip} />}
            </div>`);

const tooltipComp = `
function InfoTooltip({ text }: { text: string }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <span onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Info size={12} style={{ color: isHovered ? 'var(--color-primary)' : 'var(--text-tertiary)', cursor: 'help' }} />
            {isHovered && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)', backgroundColor: '#1E293B', color: 'white', padding: '10px 14px', borderRadius: '8px', width: '220px', fontSize: '12px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {text}
                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1E293B' }} />
                </div>
            )}
        </span>
    );
}`;

fs.writeFileSync(f, txt + tooltipComp, 'utf-8');
console.log('Done');
