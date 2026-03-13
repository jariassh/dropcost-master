import React, { useState } from 'react';
import { Search, Layout, Plus, Zap, Tag } from 'lucide-react';
import { categorizedMJMLComponents, categorizedVariables } from '../constants/emailTemplateConstants';

export const MJMLComponentList = ({ onSelect }: { onSelect: (component: any) => void }) => {
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
            className="dc-admin-dropdown dc-admin-mjml-list absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
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

export const VariableList = ({ onSelect }: { onSelect: (v: string) => void }) => {
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
            className="dc-admin-dropdown dc-admin-vars-list absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
        >
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
                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
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
