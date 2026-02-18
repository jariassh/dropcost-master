import React from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { useState } from 'react';

interface CodePreviewProps {
    code: string;
    title?: string;
    onReset?: () => void;
    className?: string;
    style?: React.CSSProperties;
    copyable?: boolean;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
    code,
    title = "VISTA PREVIA CÓDIGO",
    onReset,
    className = "",
    style,
    copyable = true
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`bg-[#0f172a] rounded-xl p-4 border border-[#334155] flex flex-col ${className}`} style={style}>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#334155]" style={{ padding: '12px 16px' }}>
                <span className="text-xs font-bold text-[#94a3b8] uppercase">{title}</span>
                <div className="flex gap-2">
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] transition-colors"
                            title="Resetear a valores por defecto"
                        >
                            <RefreshCw size={12} />
                        </button>
                    )}
                    {copyable && (
                        <button
                            onClick={handleCopy}
                            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] transition-colors"
                            title="Copiar código"
                        >
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                    )}
                </div>
            </div>
            <pre
                className="text-[11px] font-mono text-[#34d399] whitespace-pre-wrap break-all flex-1 overflow-auto custom-scrollbar"
                style={{ padding: '20px' }}
            >
                {code}
            </pre>
        </div>
    );
};
