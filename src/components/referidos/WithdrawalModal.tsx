import React, { useState, useEffect } from 'react';
import { X, Landmark, CreditCard, User, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { walletService } from '@/services/walletService';
import { formatCurrency } from '@/lib/format';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availableBalanceUsd: number;
    exchangeRate: number;
    currency: string;
    existingBankInfo?: any;
    minimumWithdrawalUsd?: number;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    availableBalanceUsd,
    exchangeRate,
    currency,
    existingBankInfo,
    minimumWithdrawalUsd = 10
}) => {
    const [step, setStep] = useState(1);
    const [amountLocal, setAmountLocal] = useState<string>('');
    const [bankInfo, setBankInfo] = useState({
        banco_nombre: existingBankInfo?.banco_nombre || '',
        cuenta_numero: existingBankInfo?.cuenta_numero || '',
        cuenta_tipo: existingBankInfo?.cuenta_tipo || 'Ahorros',
        documento_id: existingBankInfo?.documento_id || '',
        titular_nombre: existingBankInfo?.titular_nombre || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const minWithdrawalUsd = minimumWithdrawalUsd;
    const maxWithdrawalUsd = availableBalanceUsd;
    const amountUsdValue = parseFloat(amountLocal) / exchangeRate || 0;

    // Cargo de gestión (3%)
    const feeUsd = amountUsdValue * 0.03;
    const totalDeductionUsd = amountUsdValue + feeUsd;

    const handleNext = () => {
        if (!amountLocal || parseFloat(amountLocal) <= 0) {
            setError('Ingresa un monto válido');
            return;
        }
        if (amountUsdValue < minWithdrawalUsd) {
            const rawMinLocal = minWithdrawalUsd * exchangeRate;
            const roundedMinLocal = currency === 'COP' ? Math.round(rawMinLocal / 100) * 100 : rawMinLocal;
            setError(`El monto mínimo de retiro es de ${formatCurrency(roundedMinLocal, currency)} (aproximadamente ${minWithdrawalUsd} USD)`);
            return;
        }
        if (totalDeductionUsd > maxWithdrawalUsd) {
            setError('Saldo insuficiente (incluyendo el 3% de cargo por gestión)');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleSubmit = async () => {
        // Validar info bancaria
        if (!bankInfo.banco_nombre || !bankInfo.cuenta_numero || !bankInfo.titular_nombre || !bankInfo.documento_id) {
            setError('Por favor completa todos los datos bancarios');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await walletService.requestWithdrawal({
                monto_usd: totalDeductionUsd,
                monto_local: parseFloat(amountLocal),
                moneda_destino: currency,
                tasa_cambio: exchangeRate,
                bank_info: bankInfo
            });

            // Opcional: Guardar info bancaria para la próxima vez si ha cambiado
            if (JSON.stringify(bankInfo) !== JSON.stringify(existingBankInfo)) {
                await walletService.saveDefaultBankInfo(bankInfo);
            }

            setStep(3); // Éxito
        } catch (err: any) {
            setError(err.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '100%', maxWidth: '480px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                animation: 'scaleUp 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Retirar Fondos</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '32px' }}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Saldo disponible para retiro</p>
                                <h3 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                    {formatCurrency(availableBalanceUsd * exchangeRate, currency)}
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>¿Cuánto deseas retirar?</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={amountLocal}
                                        onChange={(e) => setAmountLocal(e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            paddingRight: '60px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '2px solid var(--border-color)',
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                    <span style={{
                                        position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                                        fontSize: '14px', fontWeight: 700, color: 'var(--text-tertiary)'
                                    }}>
                                        {currency}
                                    </span>
                                </div>
                                {error && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                padding: '16px',
                                backgroundColor: 'rgba(0, 102, 255, 0.05)',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Monto a recibir:</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(amountLocal) || 0, currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Cargo gestión (3%):</span>
                                    <span style={{ color: 'var(--color-warning)' }}>{formatCurrency((parseFloat(amountLocal) || 0) * 0.03, currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                                    <span>Total a descontar:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {formatCurrency((parseFloat(amountLocal) || 0) * 1.03, currency)}
                                    </span>
                                </div>
                            </div>

                            <Button onClick={handleNext} className="w-full" size="lg">Siguiente</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <IconInput
                                    label="Banco" icon={Landmark} value={bankInfo.banco_nombre}
                                    onChange={(v) => setBankInfo({ ...bankInfo, banco_nombre: v })}
                                    placeholder="Ej: Bancolombia"
                                />
                                <IconInput
                                    label="Tipo de Cuenta" icon={CreditCard} value={bankInfo.cuenta_tipo}
                                    onChange={(v) => setBankInfo({ ...bankInfo, cuenta_tipo: v })}
                                    placeholder="Ahorros / Corriente"
                                />
                            </div>
                            <IconInput
                                label="Número de Cuenta" icon={CreditCard} value={bankInfo.cuenta_numero}
                                onChange={(v) => setBankInfo({ ...bankInfo, cuenta_numero: v })}
                                placeholder="000-000000-00"
                            />
                            <IconInput
                                label="Nombre del Titular" icon={User} value={bankInfo.titular_nombre}
                                onChange={(v) => setBankInfo({ ...bankInfo, titular_nombre: v })}
                                placeholder="Nombre completo"
                            />
                            <IconInput
                                label="Documento de Identidad (DNI/Cédula)" icon={FileText} value={bankInfo.documento_id}
                                onChange={(v) => setBankInfo({ ...bankInfo, documento_id: v })}
                                placeholder="80.000.000"
                            />

                            {error && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-error)', fontSize: '12px' }}>
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Atrás</Button>
                                <Button className="flex-1" onClick={handleSubmit} isLoading={loading}>Confirmar Retiro</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '80px', height: '80px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: 'var(--color-success)'
                            }}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>¡Solicitud Recibida!</h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                                Tu solicitud de retiro por <strong>{formatCurrency(parseFloat(amountLocal), currency)}</strong> ha sido enviada con éxito.
                                <br />Se procesará el próximo viernes.
                            </p>
                            <Button className="w-full" onClick={() => { onSuccess(); onClose(); }}>Entendido</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const IconInput: React.FC<{
    label: string;
    icon: any;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}> = ({ label, icon: Icon, value, onChange, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <Icon size={16} />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                }}
            />
        </div>
    </div>
);
