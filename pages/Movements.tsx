import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, Movement, MovementType, User, NewMovement, Recipe, ItemType } from '../types';
import { useAuth } from '../hooks/useAuth';

type ConceptualMovementType = 'PRODUCCION_PT' | 'ENTRADA_MP' | 'SALIDA_PT' | 'AJUSTE';

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
        item_id: number;
        cantidad: number;
        observacion?: string;
    }) => Promise<boolean>; // Returns true on success
    onCancel: () => void;
}> = ({ items, recipes, onSave, onCancel }) => {
    
    const [conceptualType, setConceptualType] = useState<ConceptualMovementType>('PRODUCCION_PT');
    const [itemId, setItemId] = useState<string>('');
    const [cantidad, setCantidad] = useState<string>('1');
    const [observacion, setObservacion] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const productOptions = useMemo(() => {
        switch (conceptualType) {
            case 'ENTRADA_MP':
                return items.filter(i => i.tipo === ItemType.MP);
            case 'PRODUCCION_PT':
            case 'SALIDA_PT':
                return items.filter(i => i.tipo === ItemType.PT);
            case 'AJUSTE':
                return items;
            default:
                return [];
        }
    }, [conceptualType, items]);

    // Reset item selection when movement type changes
    useEffect(() => {
        setItemId('');
    }, [conceptualType]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const numCantidad = parseInt(cantidad, 10);

        if (!itemId || !conceptualType || !cantidad || isNaN(numCantidad) || numCantidad <= 0) {
            setError("Por favor, complete todos los campos requeridos con valores válidos.");
            return;
        }

        setSubmitting(true);
        const success = await onSave({
            conceptualType,
            item_id: Number(itemId),
            cantidad: numCantidad,
            observacion
        });
        setSubmitting(false);

        if (success) {
            onCancel(); // Close form on success
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
                            <option value="PRODUCCION_PT">Producción de Producto Terminado</option>
                            <option value="ENTRADA_MP">Entrada de Materia Prima</option>
                            <option value="SALIDA_PT">Salida de Producto Terminado</option>
                            <option value="AJUSTE">Ajuste</option>
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
                        <label htmlFor="cantidad" className="block text-sm font-medium">Cantidad</label>
                        <input
                            type="number"
                            name="cantidad"
                            id="cantidad"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            min="1"
                            step="1"
                            onKeyDown={(e) => {
                                // Prevent decimal points, 'e', and other non-integer keys
                                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            required
                            className={inputStyle}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="observacion" className="block text-sm font-medium">Observación (Opcional)</label>
                        <textarea name="observacion" id="observacion" value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} className={inputStyle}></textarea>
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
        
        if (movementsRes.data) setMovements(movementsRes.data as (Movement & { item: Item })[]);
        if (itemsRes.data) setItems(itemsRes.data);
        if (usersRes.data) setUsers(usersRes.data);
        if (recipesRes.data) {
            const groupedRecipes = new Map<number, Recipe>();
            recipesRes.data.forEach(r => {
                if (!groupedRecipes.has(r.producto_terminado_id)) {
                    groupedRecipes.set(r.producto_terminado_id, {
                        producto_terminado_id: r.producto_terminado_id,
                        componentes: []
                    });
                }
                groupedRecipes.get(r.producto_terminado_id)?.componentes.push({
                    materia_prima_id: r.materia_prima_id,
                    cantidad_necesaria: r.cantidad_necesaria
                });
            });
            setRecipes(Array.from(groupedRecipes.values()));
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSave = async (data: { conceptualType: ConceptualMovementType; item_id: number; cantidad: number; observacion?: string }): Promise<boolean> => {
        if (!currentUser) return false;

        const { conceptualType, item_id, cantidad, observacion } = data;
        const selectedItem = itemsMap.get(item_id);
        if (!selectedItem) {
            setToast({ message: "Error: Producto seleccionado no encontrado.", type: 'error' });
            return false;
        }

        // --- VALIDATION LOGIC ---
        if (conceptualType === 'SALIDA_PT') {
            if (selectedItem.stock_actual < cantidad) {
                setToast({ message: `Stock insuficiente para '${selectedItem.codigo}'.\nStock actual: ${selectedItem.stock_actual}, se intenta retirar: ${cantidad}.`, type: 'error' });
                return false;
            }
        }

        if (conceptualType === 'PRODUCCION_PT') {
            const recipe = recipesMap.get(item_id);
            if (!recipe) {
                setToast({ message: `No existe una receta para el producto '${selectedItem.codigo}'.`, type: 'error' });
                return false;
            }

            const insufficientMaterials: string[] = [];
            for (const component of recipe.componentes) {
                const mpItem = itemsMap.get(component.materia_prima_id);
                const requiredAmount = cantidad * component.cantidad_necesaria;
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
        }

        // --- MAP CONCEPTUAL TYPE TO DB TYPE ---
        let dbMovementType: MovementType;
        switch (conceptualType) {
            case 'PRODUCCION_PT':
            case 'ENTRADA_MP':
                dbMovementType = MovementType.ENT;
                break;
            case 'SALIDA_PT':
                dbMovementType = MovementType.SAL;
                break;
            case 'AJUSTE':
                dbMovementType = MovementType.AJU;
                break;
        }

        const newMovement: NewMovement = {
            item_id,
            tipo: dbMovementType,
            cantidad,
            observacion
        };

        const result = await supabaseService.data.addMovement(newMovement, currentUser.id);
        if (result.error) {
            setToast({ message: `Error al registrar: ${result.error}`, type: 'error' });
            return false;
        } else {
            setIsFormOpen(false);
            fetchAllData();
            return true;
        }
    };

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.nombre])), [users]);
    
    const getMovementBadge = (mov: Movement & { item: Item }): { text: string; className: string } => {
        if (mov.tipo === MovementType.SAL && mov.observacion?.startsWith('Salida automática por producción')) {
            return { text: 'Consumo MP', className: 'bg-yellow-100 text-yellow-800' };
        }
        switch (mov.tipo) {
            case MovementType.ENT:
                return mov.item.tipo === ItemType.PT
                    ? { text: 'Producción PT', className: 'bg-purple-100 text-purple-800' }
                    : { text: 'Entrada MP', className: 'bg-green-100 text-green-800' };
            case MovementType.SAL:
                return { text: 'Salida PT', className: 'bg-red-100 text-red-800' };
            case MovementType.AJU:
                return { text: 'Ajuste', className: 'bg-blue-100 text-blue-800' };
            default:
                return { text: mov.tipo, className: 'bg-gray-100 text-gray-800' };
        }
    };

    if (loading) return <div>Cargando movimientos...</div>;

    return (
        <div className="space-y-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Registro de Movimientos</h1>
                <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    + Nuevo Movimiento
                </button>
            </div>
            
            {isFormOpen && <MovementForm items={items} recipes={recipes} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-center">Tipo de Operación</th>
                            <th className="px-6 py-3 text-center">Cantidad</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Observación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(mov => {
                            const badge = getMovementBadge(mov);
                            return (
                                <tr key={mov.id} className="bg-white border-b">
                                    <td className="px-6 py-4">{new Date(mov.fecha).toLocaleString('es-ES')}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="font-bold">{mov.item.codigo}</div>
                                        <div className="text-xs text-gray-500">{mov.item.descripcion}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                                            {badge.text}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-center font-bold ${mov.tipo === 'SAL' || mov.tipo === 'AJU' && mov.cantidad < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {mov.tipo === 'SAL' ? '-' : ''}{mov.cantidad}
                                    </td>
                                    <td className="px-6 py-4">{usersMap.get(mov.usuario_id) || 'Desconocido'}</td>
                                    <td className="px-6 py-4 text-gray-600 italic">{mov.observacion}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Movements;