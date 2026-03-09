const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, 'ViabilityOutput.tsx');
let txt = fs.readFileSync(f, 'utf-8');

const newFormatCurrency = `    const formatCurrency = (val: number) => {
        const country = inputs.country || 'US';
        const locale = country === 'CO' ? 'es-CO' : country === 'MX' ? 'es-MX' : country === 'PE' ? 'es-PE' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: 2
        }).format(val);
    };`;

// Replace the old formatCurrency
txt = txt.replace(/const formatCurrency = \(val: number\)\s*=>\s*\{[\s\S]*?return new Intl.NumberFormat\([\s\S]*?\)\.format\(val\);\s*\};/, newFormatCurrency);

fs.writeFileSync(f, txt, 'utf-8');
console.log('ViabilityOutput currency fixed');
