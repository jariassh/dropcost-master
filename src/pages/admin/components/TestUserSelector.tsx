import React, { useState, useEffect, useRef } from 'react';
import { User, Search, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { userService } from '@/services/userService';

interface TestUserSelectorProps {
    onSelect: (user: any) => void;
    selectedUser: any;
}

export const TestUserSelector = ({ onSelect, selectedUser }: TestUserSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && search.length >= 0) {
            const fetchUsers = async () => {
                setLoading(true);
                try {
                    const { data } = await userService.fetchUsers(1, 10, { search });
                    setUsers(data || []);
                } catch (error) {
                    console.error("Error searching users", error);
                } finally {
                    setLoading(false);
                }
            };

            const timeoutId = setTimeout(fetchUsers, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, search]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-auto min-h-[56px] px-4 py-3 rounded-[12px] border-[1.5px] transition-all cursor-pointer group select-none flex items-center justify-between ${isOpen
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--bg-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--color-primary)]/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        }`}>
                        <User size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            {selectedUser ? `${selectedUser.nombres} ${selectedUser.apellidos}` : 'Seleccionar Usuario de Prueba'}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                            {selectedUser ? selectedUser.email : 'Buscar por nombre o email...'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
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
                                onClick={(e) => e.stopPropagation()}
                            />
                            {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-primary)]"><Loader2 size={14} /></div>}
                        </div>
                    </div>

                    <div className="overflow-y-auto scrollbar-custom" style={{ minHeight: '140px', maxHeight: '240px' }}>
                        {users.map((user) => {
                            const isSelected = selectedUser?.id === user.id;
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        onSelect(user);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        border: 'none',
                                        textAlign: 'left',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    className="group hover:bg-[var(--color-primary-light)] last:border-0"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{
                                            padding: '7px',
                                            backgroundColor: isSelected ? 'white' : 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }} className="group-hover:bg-white transition-colors">
                                            <User size={13} className={isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]'} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                                {user.nombres} {user.apellidos}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircle2 size={14} className="text-[var(--color-primary)]" />}
                                </button>
                            );
                        })}

                        {users.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)]" style={{ minHeight: '140px' }}>
                                <User size={32} className="mb-3 opacity-20" />
                                <span className="text-xs font-medium">No se encontraron usuarios</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
