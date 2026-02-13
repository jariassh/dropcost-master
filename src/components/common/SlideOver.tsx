import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string;
    footer?: React.ReactNode;
}

export function SlideOver({
    isOpen,
    onClose,
    title,
    children,
    width = 'max-w-md',
    footer,
}: SlideOverProps) {
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                document.body.style.overflow = '';
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
                {/* Background overlay */}
                <div
                    className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                    aria-hidden="true"
                />

                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    {/* Slide-over panel */}
                    <div
                        className={`pointer-events-auto w-screen ${width} transform transition duration-300 ease-in-out sm:duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <div className="flex h-full flex-col overflow-y-scroll bg-[var(--card-bg)] shadow-xl border-l border-[var(--border-color)]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-6 sm:px-6 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                <h2 className="text-lg font-semibold leading-6 text-[var(--text-primary)]" id="slide-over-title">
                                    {title}
                                </h2>
                                <div className="ml-3 flex h-7 items-center">
                                    <button
                                        type="button"
                                        className="rounded-md bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close panel</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>

                            {/* Main content */}
                            <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                {children}
                            </div>

                            {/* Footer */}
                            {footer && (
                                <div className="border-t border-[var(--border-color)] px-4 py-4 sm:px-6 bg-[var(--bg-secondary)]">
                                    <div className="flex justify-end gap-3">
                                        {footer}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
