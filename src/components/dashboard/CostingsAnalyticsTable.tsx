import React, { useState, useMemo } from 'react';
import { Card, Input, Button } from '@/components/common';
import { ArrowUpRight, ArrowDownRight, Minus, Package, ChevronLeft, ChevronRight, Activity, Search, Filter } from 'lucide-react';
import { CosteoAnalytics } from '@/types/dashboard';

interface Props {
    data: CosteoAnalytics[];
    isLoading?: boolean;
}

export const CostingsAnalyticsTable: React.FC<Props> = ({ data, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filtrar solo costeos vinculados (con ID de campaña)
    const linkedData = useMemo(() => {
        return data.filter(item => item.meta_campaign_id && item.meta_campaign_id.trim() !== '');
    }, [data]);

    const filteredData = useMemo(() => {
        return linkedData.filter(item => {
            const search = searchTerm.toLowerCase();
            return (
                item.nombre_producto?.toLowerCase().includes(search) ||
                item.meta_campaign_id?.toLowerCase().includes(search)
            );
        });
    }, [linkedData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    if (isLoading) {
        return (
            <Card title="Analytics Comparativo de Costeos" icon={<Activity size={18} />}>
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Cargando analítica comparativa...
                </div>
            </Card>
        );
    }

    const HeaderControls = (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '260px' }}>
                <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
                />
                <input
                    type="text"
                    placeholder="Buscar producto o campaña..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        fontSize: '13px',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                />
            </div>
            <select
                value={pageSize}
                onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                }}
                style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                }}
            >
                <option value={10}>10 filas</option>
                <option value={20}>20 filas</option>
                <option value={50}>50 filas</option>
            </select>
        </div>
    );

    return (
        <Card
            title="Comparativa Real vs Costeo"
            icon={<Activity size={18} />}
            headerAction={HeaderControls}
            description="Vincula tus costeos con el ID de Campaña de Meta en 'Mis Costeos' para ver datos reales."
        >
            <div style={{ overflowX: 'auto', marginTop: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            <th style={headerStyle}>Producto / Campaña</th>
                            <th style={headerStyle}>Precio Venta</th>
                            <th style={headerStyle}>CPA Meta (vs Costeo)</th>
                            <th style={headerStyle}>Flete Costeado</th>
                            <th style={headerStyle}>Órdenes</th>
                            <th style={headerStyle}>ROAS Real</th>
                            <th style={headerStyle}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 200ms' }}>
                                    <td style={cellStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={16} color="var(--color-primary)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nombre_producto}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: {item.meta_campaign_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{ fontWeight: 700 }}>${item.target_price.toLocaleString()}</span>
                                    </td>
                                    <td style={cellStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700 }}>${item.real_cpa.toFixed(2)}</span>
                                            <MetricIndicator
                                                real={item.real_cpa}
                                                target={item.target_cpa}
                                                inverse // For CPA, lower is better
                                            />
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Obj: ${item.target_cpa}</span>
                                        </div>
                                    </td>
                                    <td style={cellStyle}>
                                        <span>${item.target_flete.toLocaleString()}</span>
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{ fontWeight: 600 }}>{item.real_orders}</span>
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: item.real_roas >= 3 ? 'var(--color-success)15' : 'var(--color-warning)15',
                                            color: item.real_roas >= 3 ? 'var(--color-success)' : 'var(--color-warning)',
                                            fontWeight: 700,
                                            fontSize: '12px'
                                        }}>
                                            {item.real_roas.toFixed(2)}x
                                        </span>
                                    </td>
                                    <td style={cellStyle}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            backgroundColor: item.real_spend > 0 ? 'var(--color-success)15' : 'var(--bg-secondary)',
                                            color: item.real_spend > 0 ? 'var(--color-success)' : 'var(--text-tertiary)',
                                            padding: '4px 10px',
                                            borderRadius: '20px'
                                        }}>
                                            {item.real_spend > 0 ? 'En Circulación' : 'Sin Gasto'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
                                        <Filter size={32} opacity={0.4} />
                                        <p style={{ fontWeight: 600, margin: 0 }}>No hay datos analíticos reales para mostrar</p>
                                        <p style={{ fontSize: '12px', maxWidth: '350px', lineHeight: 1.5 }}>
                                            {searchTerm
                                                ? 'No se encontraron resultados para tu búsqueda.'
                                                : "Vincula tus productos guardados en 'Mis Costeos' ingresando el 'ID de Campaña' correcto de Meta Ads para que podamos cruzar la información real."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Mostrando página {currentPage} de {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            leftIcon={<ChevronLeft size={16} />}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            rightIcon={<ChevronRight size={16} />}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

const MetricIndicator = ({ real, target, inverse = false }: { real: number; target: number; inverse?: boolean }) => {
    if (real === 0) return <Minus size={14} color="var(--text-tertiary)" />;

    const diff = real - target;
    const isGood = inverse ? diff <= 0 : diff >= 0;

    if (Math.abs(diff) < 0.01) return <Minus size={14} color="var(--text-tertiary)" />;

    return (
        <div title={`Diferencia: ${diff.toFixed(2)}`}>
            {isGood ? (
                <ArrowDownRight size={16} color="var(--color-success)" strokeWidth={3} />
            ) : (
                <ArrowUpRight size={16} color="var(--color-error)" strokeWidth={3} />
            )}
        </div>
    );
};

const headerStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '16px 12px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-tertiary)'
};

const cellStyle: React.CSSProperties = {
    padding: '16px 12px',
    fontSize: '14px',
    color: 'var(--text-primary)'
};
