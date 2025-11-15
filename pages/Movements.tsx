import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, Movement, MovementType, User, NewMovement, Recipe, ItemType } from '../types';
import { useAuth } from '../hooks/useAuth';

type ConceptualMovementType = 'PRODUCCION' | 'ENTRADA_MP' | 'SALIDA_PT' | 'AJUSTE';

const Toast: React.FC<{ message: string; type: 'error' | 'success'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    return (
        <div className={`fixed top-20 right-6 w-full max-w-sm p-4 text-white rounded-lg shadow-lg flex justify-between items-start z-[100] animate-fade-in ${bgColor}`}>
            <div className="flex-1">
                <p className="font-bold">{type === 'error' ? 'Error de Validación' : 'Éxito'}</p>
                <p className="text-sm whitespace-pre-wrap mt-1">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-xl font-bold leading-none">&times;</button>
        </div>
    );
};


const MovementForm: React.FC<{
    items: Item[];
    recipes: Recipe[];
    onSave: (movementData: {
        conceptualType: ConceptualMovementType,
        item_id: string;
        cantidad: number;
        observaciones?: string;
    }) => Promise<boolean>; // Returns true on success
    onCancel: () => void;
}> = ({ items, recipes, onSave, onCancel }) => {
    
    const [conceptualType, setConceptualType] = useState<ConceptualMovementType>('PRODUCCION');
    const [itemId, setItemId] = useState<string>('');
    const [cantidad, setCantidad] = useState<string>('1');
    const [observaciones, setObservaciones] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const isAjuste = conceptualType === 'AJUSTE';

    const productOptions = useMemo(() => {
        switch (conceptualType) {
            case 'ENTRADA_MP':
                return items.filter(i => i.tipo === ItemType.MP);
            case 'PRODUCCION':
            case 'SALIDA_PT':
                return items.filter(i => i.tipo === ItemType.PT);
            case 'AJUSTE':
                return items;
            default:
                return [];
        }
    }, [conceptualType, items]);

    useEffect(() => {
        setItemId('');
    }, [conceptualType]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const numCantidad = parseFloat(cantidad);

        if (!itemId || !conceptualType || cantidad === '' || isNaN(numCantidad) || (!isAjuste && numCantidad <= 0)) {
            setError("Por favor, complete todos los campos requeridos con valores válidos.");
            return;
        }

        setSubmitting(true);
        const success = await onSave({
            conceptualType,
            item_id: itemId,
            cantidad: numCantidad,
            observaciones
        });
        setSubmitting(false);

        if (success) {
            onCancel();
        }
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Nuevo Movimiento de Inventario</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="conceptualType" className="block text-sm font-medium">Tipo de Movimiento</label>
                        <select
                            id="conceptualType"
                            value={conceptualType}
                            onChange={(e) => setConceptualType(e.target.value as ConceptualMovementType)}
                            required
                            className={inputStyle}
                        >
                            <option value="PRODUCCION">Producción de Producto Terminado</option>
                            <option value="ENTRADA_MP">Entrada de Materia Prima</option>
                            <option value="SALIDA_PT">Salida de Producto Terminado</option>
                            <option value="AJUSTE">Ajuste (Setear Stock)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="item_id" className="block text-sm font-medium">Producto</label>
                        <select name="item_id" id="item_id" value={itemId} onChange={(e) => setItemId(e.target.value)} required className={inputStyle} disabled={productOptions.length === 0}>
                            <option value="">{productOptions.length > 0 ? 'Seleccione un producto' : 'No hay productos para este tipo'}</option>
                            {productOptions.map(item => (
                                <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="cantidad" className="block text-sm font-medium">
                            {isAjuste ? 'Cantidad Final en Stock' : 'Cantidad'}
                        </label>
                        <input
                            type="number"
                            name="cantidad"
                            id="cantidad"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            min={isAjuste ? "0" : "0.001"}
                            step="0.001"
                            required
                            className={inputStyle}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="observaciones" className="block text-sm font-medium">Observación (Opcional)</label>
                        <textarea name="observaciones" id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className={inputStyle}></textarea>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                            {submitting ? 'Registrando...' : 'Registrar Movimiento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Movements: React.FC = () => {
    const [movements, setMovements] = useState<(Movement & { item: Item })[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { user: currentUser } = useAuth();
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        itemId: '',
        userId: '',
        movementType: '',
    });
    
    const itemsMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
    const recipesMap = useMemo(() => new Map(recipes.map(recipe => [recipe.producto_terminado_id, recipe])), [recipes]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [movementsRes, itemsRes, usersRes, recipesRes] = await Promise.all([
            supabaseService.data.getMovements(),
            supabaseService.data.getItems(),
            supabaseService.data.getUsers(),
            supabaseService.data.getRecipes()
        ]);
        
        if (movementsRes.data) {
            const validMovements = (movementsRes.data as any[]).filter(
                (m): m is Movement & { item: Item } => m.item && typeof m.item === 'object' && m.item.id
            );
            setMovements(validMovements);
        }
        
        const newItems = (itemsRes.data as Item[]) || [];
        setItems(newItems);
        const localItemsMap = new Map(newItems.map(item => [item.id, item]));

        if (usersRes.data) setUsers(usersRes.data as User[]);
        if (recipesRes.data) {
            const fetchedRecipes: Recipe[] = (recipesRes.data as any[]).map((r: any) => ({
                producto_terminado_id: r.producto_terminado_id,
                producto_terminado: localItemsMap.get(r.producto_terminado_id),
                componentes: r.componentes?.filter((c: any) => c && c.mp_id).map((c: any) => ({
                    materia_prima_id: c.mp_id,
                    cantidad_requerida: c.cantidad_requerida,
                    materia_prima: localItemsMap.get(c.mp_id)
                })) || []
            }));
            setRecipes(fetchedRecipes);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSave = async (data: { conceptualType: ConceptualMovementType; item_id: string; cantidad: number; observaciones?: string }): Promise<boolean> => {
        if (!currentUser?.id) return false;

        const { conceptualType, item_id, cantidad, observaciones } = data;
        const selectedItem = itemsMap.get(item_id);
        if (!selectedItem) {
            setToast({ message: "Error: Producto seleccionado no encontrado.", type: 'error' });
            return false;
        }

        if (conceptualType === 'PRODUCCION') {
            const recipe = recipesMap.get(item_id);
            if (!recipe || !recipe.componentes || recipe.componentes.length === 0) {
                setToast({ message: `No existe una receta para el producto '${selectedItem.codigo}'.`, type: 'error' });
                return false;
            }

            const insufficientMaterials: string[] = [];
            const consumedComponentsForLog: Movement['componentes'] = [];

            for (const component of recipe.componentes) {
                const mpItem = itemsMap.get(component.materia_prima_id);
                const requiredAmount = cantidad * component.cantidad_requerida;
                
                if (mpItem) {
                     consumedComponentsForLog.push({
                        mp_id: mpItem.id,
                        mp_codigo: mpItem.codigo,
                        cantidad_consumida: requiredAmount
                    });
                }
               
                if (!mpItem || mpItem.stock_actual < requiredAmount) {
                    const stock = mpItem ? mpItem.stock_actual : 0;
                    const itemName = mpItem ? `${mpItem.codigo} - ${mpItem.descripcion}` : `ID: ${component.materia_prima_id}`;
                    insufficientMaterials.push(`- '${itemName}': requiere ${requiredAmount}, tiene ${stock}`);
                }
            }
            if (insufficientMaterials.length > 0) {
                setToast({ message: `Materia prima insuficiente:\n${insufficientMaterials.join('\n')}`, type: 'error' });
                return false;
            }

            const movementsToInsert: NewMovement[] = [];
            movementsToInsert.push({
                item_id,
                tipo: MovementType.PRODUCCION,
                cantidad,
                cantidad_producida: cantidad,
                componentes: consumedComponentsForLog,
                ...(observaciones && { observaciones })
            });

            for (const component of recipe.componentes) {
                const consumptionObservation = `Consumo por producción de ${selectedItem.codigo}. ${observaciones || ''}`.trim();
                movementsToInsert.push({
                    item_id: component.materia_prima_id,
                    tipo: MovementType.CONSUMO_MP,
                    cantidad: -(cantidad * component.cantidad_requerida),
                    observaciones: consumptionObservation,
                });
            }

            const { error } = await supabaseService.data.addMovements(movementsToInsert, currentUser.id);
            if (error) {
                 setToast({ message: `Error al registrar la producción: ${error}`, type: 'error' });
                 return false;
            }
        } else if (conceptualType === 'AJUSTE') {
            const targetStock = cantidad;
            const currentStock = selectedItem.stock_actual;
            const adjustmentAmount = targetStock - currentStock;

            if (adjustmentAmount === 0) {
                setToast({ message: `El stock del producto '${selectedItem.codigo}' ya es de ${targetStock}. No se realizó ningún ajuste.`, type: 'success' });
                return true;
            }
            
            const finalObservation = `Ajuste de stock de ${currentStock} a ${targetStock}. ${observaciones || ''}`.trim();

            const newMovement: NewMovement = {
                item_id,
                tipo: MovementType.AJUSTE,
                cantidad: adjustmentAmount,
                observaciones: finalObservation
            };

            const result = await supabaseService.data.addMovement(newMovement, currentUser.id);
            if (result.error) {
                setToast({ message: `Error al registrar el ajuste: ${result.error}`, type: 'error' });
                return false;
            }
        } else {
            let dbMovementType: MovementType;
            let quantityModifier = 1;

            if (conceptualType === 'ENTRADA_MP') {
                dbMovementType = MovementType.ENTRADA_MP;
            } else if (conceptualType === 'SALIDA_PT') {
                if (selectedItem.stock_actual < cantidad) {
                    setToast({ message: `Stock insuficiente para '${selectedItem.codigo}'.\nStock actual: ${selectedItem.stock_actual}, se intenta retirar: ${cantidad}.`, type: 'error' });
                    return false;
                }
                dbMovementType = MovementType.SALIDA_PT;
                quantityModifier = -1;
            } else {
                setToast({ message: "Tipo de movimiento conceptual no válido.", type: 'error' });
                return false;
            }

            const newMovement: NewMovement = { item_id, tipo: dbMovementType, cantidad: cantidad * quantityModifier, observaciones };
            const result = await supabaseService.data.addMovement(newMovement, currentUser.id);
            if (result.error) {
                setToast({ message: `Error al registrar: ${result.error}`, type: 'error' });
                return false;
            }
        }
        
        fetchAllData();
        return true;
    };

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.nombre_completo])), [users]);
    
    const movementTypeConfig: Record<string, { text: string; className: string }> = {
        [MovementType.PRODUCCION]: { text: 'Producción', className: 'bg-purple-100 text-purple-800' },
        [MovementType.ENTRADA_MP]: { text: 'Entrada MP', className: 'bg-green-100 text-green-800' },
        [MovementType.SALIDA_PT]: { text: 'Salida PT', className: 'bg-red-100 text-red-800' },
        [MovementType.AJUSTE]: { text: 'Ajuste', className: 'bg-blue-100 text-blue-800' },
        [MovementType.CONSUMO_MP]: { text: 'Consumo MP', className: 'bg-yellow-100 text-yellow-800' },
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            itemId: '',
            userId: '',
            movementType: '',
        });
    };

    const filteredMovements = useMemo(() => {
        return movements.filter(mov => {
            if (filters.itemId && mov.item_id !== filters.itemId) return false;
            if (filters.userId && mov.usuario_id !== filters.userId) return false;
            
            const movDate = new Date(mov.created_at);
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                if (movDate < startDate) return false;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (movDate > endDate) return false;
            }

            if (filters.movementType && mov.tipo !== filters.movementType) return false;

            return true;
        });
    }, [movements, filters]);

    const filterInputStyle = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
    const filterLabelStyle = "block text-sm font-medium text-gray-700 mb-1";

    const getAmountDisplay = (mov: Movement): { text: string; className: string } => {
        const cantidad = mov.cantidad ?? 0;
        if (cantidad > 0) {
            return { text: `+${cantidad.toLocaleString()}`, className: 'text-green-600' };
        } else {
            return { text: `${cantidad.toLocaleString()}`, className: 'text-red-600' };
        }
    };

    if (loading) return <div>Cargando movimientos...</div>;

    return (
        <div className="space-y-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Registro de Movimientos</h1>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsFilterOpen(prev => !prev)}
                        className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        + Nuevo Movimiento
                    </button>
                </div>
            </div>
            
            {isFormOpen && <MovementForm items={items} recipes={recipes} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            {isFilterOpen && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Filtrar Movimientos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="startDate" className={filterLabelStyle}>Desde</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={filterInputStyle} />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={filterLabelStyle}>Hasta</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={filterInputStyle} />
                        </div>
                        <div>
                            <label htmlFor="itemId" className={filterLabelStyle}>Producto</label>
                            <select name="itemId" value={filters.itemId} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="movementType" className={filterLabelStyle}>Tipo de Operación</label>
                            <select name="movementType" value={filters.movementType} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                {Object.entries(movementTypeConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.text}</option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <label htmlFor="userId" className={filterLabelStyle}>Usuario</label>
                            <select name="userId" value={filters.userId} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                {users.map(user => <option key={user.id} value={user.id}>{user.nombre_completo}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">Limpiar Filtros</button>
                    </div>
                </div>
            )}


            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-center">Tipo de Operación</th>
                            <th className="px-6 py-3 text-center">Cantidad</th>
                            <th className="px-6 py-3 text-center">Stock Resultante</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Observación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovements.length === 0 ? (
                             <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-500">
                                    No se encontraron movimientos con los filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            filteredMovements.map(mov => {
                                const badge = movementTypeConfig[mov.tipo as MovementType];
                                const amountDisplay = getAmountDisplay(mov);
                                return (
                                    <tr key={mov.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{new Date(mov.created_at).toLocaleString('es-ES')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="font-bold">{mov.item.codigo}</div>
                                            <div className="text-xs text-gray-500">{mov.item.descripcion}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge?.className || ''}`}>
                                                {badge?.text || mov.tipo}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-bold ${amountDisplay.className}`}>
                                            {amountDisplay.text}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{mov.stock_nuevo}</td>
                                        <td className="px-6 py-4">{usersMap.get(mov.usuario_id) || 'Desconocido'}</td>
                                        <td className="px-6 py-4 text-gray-600 italic">{mov.observaciones}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Movements;