import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, Movement, MovementType, NewMovement, User } from '../types';
import { useAuth } from '../hooks/useAuth';

const Movements: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [movements, setMovements] = useState<(Movement & { item: Item; user?: User })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<Partial<NewMovement>>({ tipo: MovementType.ENT, cantidad: 1 });
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        codigo: '',
        tipo: '',
        usuarioId: '',
        fechaDesde: '',
        fechaHasta: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [itemsRes, movementsRes, usersRes] = await Promise.all([
                supabaseService.data.getItems(),
                supabaseService.data.getMovements(),
                supabaseService.data.getUsers(),
            ]);

            if (itemsRes.error || movementsRes.error || usersRes.error) {
                throw new Error(itemsRes.error?.message || movementsRes.error?.message || usersRes.error?.message || 'Error al cargar los datos.');
            }
            
            if (usersRes.data) setAllUsers(usersRes.data);
            const usersMap = new Map(usersRes.data?.map((u: User) => [u.id, u]) || []);

            const enrichedMovements = movementsRes.data?.map((m: Movement & { item: Item }) => ({
                ...m,
                user: usersMap.get(m.usuario_id),
            })) || [];

            if (itemsRes.data) setItems(itemsRes.data);
            setMovements(enrichedMovements);

        } catch (e: any) {
            setFetchError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            if (filters.codigo && !m.item?.codigo.toLowerCase().includes(filters.codigo.toLowerCase())) return false;
            if (filters.tipo && m.tipo !== filters.tipo) return false;
            if (filters.usuarioId && m.usuario_id !== filters.usuarioId) return false;
            
            const movementDate = new Date(m.fecha).getTime();
            if (filters.fechaDesde) {
                const fechaDesde = new Date(filters.fechaDesde).getTime();
                if (movementDate < fechaDesde) return false;
            }
            if (filters.fechaHasta) {
                // Add one day to include the end date
                const fechaHasta = new Date(filters.fechaHasta).getTime() + (24 * 60 * 60 * 1000);
                if (movementDate > fechaHasta) return false;
            }
            
            return true;
        });
    }, [movements, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ codigo: '', tipo: '', usuarioId: '', fechaDesde: '', fechaHasta: '' });
    };

    const handleOpenForm = () => {
        setFormError('');
        setSuccess('');
        setFormState({ tipo: MovementType.ENT, cantidad: 1 });
        setIsFormOpen(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: name === 'cantidad' || name === 'item_id' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSuccess('');

        if (!formState.item_id || !formState.tipo || formState.cantidad === undefined) {
            setFormError('Por favor complete todos los campos requeridos.');
            return;
        }

        const cantidad = Number(formState.cantidad);

        if (cantidad === 0) {
            setFormError('La cantidad no puede ser cero.');
            return;
        }

        if ((formState.tipo === MovementType.ENT || formState.tipo === MovementType.SAL) && cantidad <= 0) {
            setFormError('Para Entradas y Salidas, la cantidad debe ser un número positivo.');
            return;
        }
        
        setIsSubmitting(true);

        const movementData: NewMovement = {
            item_id: formState.item_id,
            tipo: formState.tipo,
            cantidad: cantidad,
            observacion: formState.observacion,
        };
        
        const { error: submitError } = await supabaseService.data.addMovement(movementData, currentUser!.id);
        
        if (submitError) {
            if (submitError.includes('Stock insuficiente')) {
                setFormError('Error: Stock insuficiente para realizar esta operación.');
            } else {
                setFormError(`Error al registrar: ${submitError}`);
            }
        } else {
            setSuccess('Movimiento registrado con éxito.');
            fetchData(); // Refresh data
            setTimeout(() => {
                setIsFormOpen(false);
            }, 500); // Close modal after a short delay
        }
        setIsSubmitting(false);
    };

    const MovementTypeLabels: Record<MovementType, string> = {
        [MovementType.ENT]: 'Entrada',
        [MovementType.SAL]: 'Salida',
        [MovementType.AJU]: 'Ajuste',
    };
    
    const MovementTypeColors: Record<MovementType, string> = {
        [MovementType.ENT]: 'bg-primary-100 text-primary-800',
        [MovementType.SAL]: 'bg-primary-100 text-primary-800',
        [MovementType.AJU]: 'bg-primary-100 text-primary-800',
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    const filterInputStyle = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
    const filterLabelStyle = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Movimientos</h1>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setIsFilterOpen(prev => !prev)}
                        className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    <button onClick={handleOpenForm} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        + Registrar Movimiento
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Registrar Movimiento</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="item_id" className="block text-sm font-medium">Producto</label>
                                <select name="item_id" id="item_id" value={formState.item_id || ''} onChange={handleInputChange} required className={inputStyle}>
                                    <option value="">Seleccione un producto</option>
                                    {items.map(item => <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium">Tipo de Movimiento</label>
                                <select name="tipo" id="tipo" value={formState.tipo || ''} onChange={handleInputChange} required className={inputStyle}>
                                    <option value={MovementType.ENT}>{MovementTypeLabels.ENT}</option>
                                    <option value={MovementType.SAL}>{MovementTypeLabels.SAL}</option>
                                    <option value={MovementType.AJU}>{MovementTypeLabels.AJU}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="cantidad" className="block text-sm font-medium">Cantidad</label>
                                <input type="number" name="cantidad" id="cantidad" value={formState.cantidad || ''} onChange={handleInputChange} required className={inputStyle} />
                                {formState.tipo === MovementType.AJU && <p className="text-xs text-gray-500 mt-1">Para ajustes, use un número negativo para restar stock.</p>}
                            </div>
                            <div>
                                <label htmlFor="observacion" className="block text-sm font-medium">Observación (Opcional)</label>
                                <textarea name="observacion" id="observacion" value={formState.observacion || ''} onChange={handleInputChange} rows={3} className={inputStyle} />
                            </div>
                            
                            {formError && <p className="text-sm text-red-500">{formError}</p>}
                            {success && <p className="text-sm text-green-500">{success}</p>}

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                                    {isSubmitting ? 'Registrando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {isFilterOpen &&
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Filtrar Movimientos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <label htmlFor="codigo" className={filterLabelStyle}>Código</label>
                            <input type="text" name="codigo" value={filters.codigo} onChange={handleFilterChange} className={filterInputStyle} placeholder="Buscar por código..." />
                        </div>
                        <div>
                            <label htmlFor="tipo" className={filterLabelStyle}>Tipo</label>
                            <select name="tipo" value={filters.tipo} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                <option value={MovementType.ENT}>{MovementTypeLabels.ENT}</option>
                                <option value={MovementType.SAL}>{MovementTypeLabels.SAL}</option>
                                <option value={MovementType.AJU}>{MovementTypeLabels.AJU}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="usuarioId" className={filterLabelStyle}>Usuario</label>
                            <select name="usuarioId" value={filters.usuarioId} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                {allUsers.map(user => <option key={user.id} value={user.id}>{user.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fechaDesde" className={filterLabelStyle}>Desde</label>
                            <input type="date" name="fechaDesde" value={filters.fechaDesde} onChange={handleFilterChange} className={filterInputStyle} />
                        </div>
                        <div>
                            <label htmlFor="fechaHasta" className={filterLabelStyle}>Hasta</label>
                            <input type="date" name="fechaHasta" value={filters.fechaHasta} onChange={handleFilterChange} className={filterInputStyle} />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">Limpiar Filtros</button>
                    </div>
                </div>
            }

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Historial de Movimientos</h2>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <p>Cargando movimientos...</p>
                    ) : fetchError ? (
                        <p className="text-red-500">Error al cargar movimientos: {fetchError}</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-gray-500">No se encontraron movimientos con los filtros aplicados.</td>
                                    </tr>
                                ) : (
                                    filteredMovements.map(m => (
                                        <tr key={m.id} className="border-b">
                                            <td className="px-4 py-2 text-gray-900">{new Date(m.fecha).toLocaleString()}</td>
                                            <td className="px-4 py-2 font-mono text-gray-900">{m.item?.codigo}</td>
                                            <td className="px-4 py-2 font-medium text-gray-900">{m.item?.descripcion || 'Producto no encontrado'}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${MovementTypeColors[m.tipo]}`}>{MovementTypeLabels[m.tipo]}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-900">{m.cantidad}</td>
                                            <td className="px-4 py-2 text-gray-900">{m.user?.nombre || 'Usuario Desconocido'}</td>
                                            <td className="px-4 py-2 text-gray-500 italic">{m.observacion || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Movements;