import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    delay?: number;
    disabled?: boolean;
    offset?: number;
    show?: boolean; // Nueva prop para forzar visibilidad
}

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    position = 'right',
    delay = 200,
    disabled = false,
    offset = 6,
    show, // Control externo
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const isVisible = (show || isHovered) && !disabled;
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;

            // Ajuste de distancia
            const gap = offset;

            switch (position) {
                case 'top':
                    top = rect.top - gap; // Se ajustará con transform translateY(-100%)
                    left = rect.left + rect.width / 2;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - gap; // Se ajustará con transform translateX(-100%)
                    break;
            }

            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        if (disabled) return;
        updatePosition();
        timeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsHovered(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Actualizar posición al hacer scroll o resize si está visible
    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);


    return (
        <>
            <div
                ref={triggerRef}
                style={{ position: 'relative', display: 'inline-block', width: '100%' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        zIndex: 9999, // Elevación máxima para estar sobre todo
                        transform:
                            position === 'top' ? 'translate(-50%, -100%)' :
                                position === 'right' ? 'translateY(-50%)' :
                                    position === 'bottom' ? 'translate(-50%, 0)' :
                                        'translate(-100%, -50%)',
                        backgroundColor: 'var(--bg-secondary)', // Cambiado a variable de la app
                        color: 'var(--text-primary)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        lineHeight: '1.5',
                        width: 'max-content',
                        minWidth: '200px',
                        maxWidth: '320px',
                        whiteSpace: 'normal',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border-color)',
                        pointerEvents: 'none',
                        textAlign: 'left',
                        animation: 'fadeIn 150ms ease-out',
                    }}
                >
                    {content}

                    {/* Flecha (Arrow) - Usando bordes CSS */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '0',
                            height: '0',
                            borderStyle: 'solid',
                            ...(position === 'top' && {
                                bottom: '-5px', left: '50%', marginLeft: '-5px',
                                borderWidth: '5px 5px 0 5px',
                                borderColor: 'var(--bg-secondary) transparent transparent transparent',
                            }),
                            ...(position === 'right' && {
                                left: '-5px', top: '50%', marginTop: '-5px',
                                borderWidth: '5px 5px 5px 0',
                                borderColor: 'transparent var(--bg-secondary) transparent transparent',
                            }),
                            ...(position === 'bottom' && {
                                top: '-5px', left: '50%', marginLeft: '-5px',
                                borderWidth: '0 5px 5px 5px',
                                borderColor: 'transparent transparent var(--bg-secondary) transparent',
                            }),
                            ...(position === 'left' && {
                                right: '-5px', top: '50%', marginTop: '-5px',
                                borderWidth: '5px 0 5px 5px',
                                borderColor: 'transparent transparent transparent var(--bg-secondary)',
                            }),
                        }}
                    />
                </div>,
                document.body
            )}
        </>
    );
};
