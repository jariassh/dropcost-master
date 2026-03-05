/**
 * StepIndicator - Indicador de progreso para wizard multi-paso.
 * Muestra steps con estado completado/activo/pendiente.
 */

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '16px 0',
            }}
        >
            {steps.map((stepLabel, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <div key={stepLabel} style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: isLast ? 'none' : 1,
                    }}>
                        {/* Step circle + label */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    transition: 'all 250ms ease',
                                    backgroundColor: isCompleted
                                        ? 'var(--color-success)'
                                        : isActive
                                            ? 'var(--color-primary)'
                                            : 'var(--bg-secondary)',
                                    color: isCompleted || isActive ? '#fff' : 'var(--text-tertiary)',
                                    border: isActive
                                        ? '2px solid var(--color-primary)'
                                        : isCompleted
                                            ? '2px solid var(--color-success)'
                                            : '2px solid var(--border-color)',
                                }}
                            >
                                {isCompleted ? '✓' : stepNumber}
                            </div>
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: isActive ? 900 : 500,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    textAlign: 'center',
                                    marginTop: '4px',
                                    lineHeight: '1',
                                    maxWidth: '60px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {stepLabel}
                            </span>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div
                                style={{
                                    flex: 1,
                                    height: '2px',
                                    backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--border-color)',
                                    margin: '0 4px',
                                    marginBottom: '16px',
                                    transition: 'background-color 250ms ease',
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
