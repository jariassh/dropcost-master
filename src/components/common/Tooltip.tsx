import React, { useState } from 'react';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    delay?: number;
    disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    position = 'right',
    delay = 200,
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

    if (disabled) return <>{children}</>;

    const showTooltip = () => {
        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimeoutId(id);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    const getPositionStyles = () => {
        switch (position) {
            case 'top':
                return { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' };
            case 'right':
                return { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' };
            case 'bottom':
                return { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' };
            case 'left':
                return { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)' };
            default:
                return { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' };
        }
    };

    return (
        <div
            style={{ position: 'relative', display: 'inline-block', width: '100%' }}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            {isVisible && (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        pointerEvents: 'none',
                        ...getPositionStyles(),
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '0',
                            height: '0',
                            borderStyle: 'solid',
                            ...(position === 'top' && {
                                bottom: '-4px',
                                left: '50%',
                                marginLeft: '-4px',
                                borderWidth: '4px 4px 0 4px',
                                borderColor: '#1F2937 transparent transparent transparent',
                            }),
                            ...(position === 'right' && {
                                left: '-4px',
                                top: '50%',
                                marginTop: '-4px',
                                borderWidth: '4px 4px 4px 0',
                                borderColor: 'transparent #1F2937 transparent transparent',
                            }),
                            ...(position === 'bottom' && {
                                top: '-4px',
                                left: '50%',
                                marginLeft: '-4px',
                                borderWidth: '0 4px 4px 4px',
                                borderColor: 'transparent transparent #1F2937 transparent',
                            }),
                            ...(position === 'left' && {
                                right: '-4px',
                                top: '50%',
                                marginTop: '-4px',
                                borderWidth: '4px 0 4px 4px',
                                borderColor: 'transparent transparent transparent #1F2937',
                            }),
                        }}
                    />
                </div>
            )}
        </div>
    );
};
