/**
 * Tabs - Componente de pestañas horizontal con indicador activo animado.
 * Soporta íconos opcionales y dark mode via CSS vars.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface TabItem {
    key: string;
    label: string;
    icon?: ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    activeKey: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const activeIndex = tabs.findIndex((t) => t.key === activeKey);
        const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[data-tab-btn]');
        const activeBtn = buttons[activeIndex];

        if (activeBtn) {
            setIndicatorStyle({
                left: activeBtn.offsetLeft,
                width: activeBtn.offsetWidth,
            });
        }
    }, [activeKey, tabs]);

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                gap: '4px',
                borderBottom: '2px solid var(--border-color)',
                position: 'relative',
                overflowX: 'auto',
            }}
        >
            {tabs.map((tab) => {
                const isActive = tab.key === activeKey;

                return (
                    <button
                        key={tab.key}
                        data-tab-btn
                        onClick={() => onChange(tab.key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'color 150ms ease',
                            position: 'relative',
                        }}
                    >
                        {tab.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{tab.icon}</span>}
                        {tab.label}
                    </button>
                );
            })}

            {/* Indicador animado */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    height: '2px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'left 250ms ease, width 250ms ease',
                }}
            />
        </div>
    );
}
