import React, { useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Importar lenguajes básicos
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-css';

// Estilo del tema Material
import '@/styles/prism-material.css';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: 'html' | 'javascript' | 'mjml' | 'css';
    placeholder?: string;
    minHeight?: string;
    className?: string;
}

export function CodeEditor({
    value,
    onChange,
    language = 'html',
    placeholder = '',
    minHeight = '300px',
    className = ''
}: CodeEditorProps) {

    // El resaltado de MJML es básicamente XML/HTML para Prism
    const prismLanguage = language === 'mjml' ? 'markup' : (language === 'javascript' ? 'javascript' : (language === 'css' ? 'css' : 'markup'));

    const highlight = (code: string) => {
        return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
    };

    return (
        <div className={`dc-code-editor-container ${className}`} style={{ minHeight }}>
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={highlight}
                padding={24}
                placeholder={placeholder}
                style={{
                    fontFamily: '"Fira Code", "Fira Mono", "Cascadia Code", "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace',
                    fontSize: 13,
                    minHeight: minHeight,
                    backgroundColor: '#0f172a', // Fondo muy oscuro tipo VS Code
                    borderRadius: '16px',
                    width: '100%',
                    outline: 'none',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                }}
                className="dc-code-editor shadow-inner focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                textareaClassName="dc-code-editor-textarea"
                preClassName="dc-code-editor-pre"
            />
        </div>
    );
}
