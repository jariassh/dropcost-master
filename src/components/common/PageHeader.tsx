import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    highlight?: string;
    description?: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
    isMobile?: boolean; // Permite forzar el estado si es necesario
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    highlight,
    description,
    icon: Icon,
    actions,
    isMobile: manualIsMobile
}) => {
    const [isMobile, setIsMobile] = useState(manualIsMobile ?? window.innerWidth <= 768);

    useEffect(() => {
        if (manualIsMobile !== undefined) {
            setIsMobile(manualIsMobile);
            return;
        }
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [manualIsMobile]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '20px' : '24px',
            marginBottom: '32px',
            width: '100%'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: isMobile ? '100%' : 'auto' }}>
                <div style={{
                    width: isMobile ? '40px' : '52px',
                    height: isMobile ? '40px' : '52px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)',
                    flexShrink: 0
                }}>
                    <Icon size={isMobile ? 20 : 26} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{
                        fontSize: isMobile ? '22px' : '32px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        margin: 0,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2
                    }}>
                        {title} {highlight && <span style={{ color: 'var(--color-primary)' }}>{highlight}</span>}
                    </h1>
                    {description && (
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: isMobile ? '13px' : '14px',
                            marginTop: '4px',
                            marginBottom: 0,
                            lineHeight: 1.5,
                            maxWidth: '600px'
                        }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    width: isMobile ? '100%' : 'auto',
                    flexWrap: 'wrap',
                    justifyContent: isMobile ? 'flex-start' : 'flex-end'
                }}>
                    {actions}
                </div>
            )}
        </div>
    );
};
