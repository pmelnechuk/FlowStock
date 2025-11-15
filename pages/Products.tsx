import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, ItemType } from '../types';
import { useAuth } from '../hooks/useAuth';

const ItemForm: React.FC<{ item: Partial<Item> | null; onSave: (item: Partial<Item>) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Item>>(() => {
        const defaults: Partial<Item> = {
            unidad_medida: 'un',
        };
        return { ...defaults, ...(item || {}) };
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'stock_minimo' || name === 'valor_unitario') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.codigo || !formData.descripcion || !formData.tipo || !formData.unidad_medida || formData.stock_minimo == null || formData.valor_unitario == null) {
            alert("Por favor, complete todos los campos obligatorios.");
            return;
        }
        onSave(formData);
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{item?.id ? 'Editar' : 'Nuevo'} Producto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium">Código</label>
                        <input type="text" name="codigo" id="codigo" value={formData.codigo || ''} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium">Descripción</label>
                        <input type="text" name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tipo" className="block text-sm font-medium">Tipo</label>
                            <select name="tipo" id="tipo" value={formData.tipo || ''} onChange={handleChange} required className={inputStyle}>
                                <option value="">Seleccione</option>
                                <option value={ItemType.MP}>Materia Prima (MP)</option>
                                <option value={ItemType.PT}>Producto Terminado (PT)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="unidad_medida" className="block text-sm font-medium">Unidad</label>
                            <input type="text" name="unidad_medida" id="unidad_medida" value={formData.unidad_medida || ''} onChange={handleChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="stock_minimo" className="block text-sm font-medium">Stock Mínimo</label>
                            <input type="number" name="stock_minimo" id="stock_minimo" value={formData.stock_minimo ?? ''} onChange={handleChange} min="0" step="0.001" required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="valor_unitario" className="block text-sm font-medium">Valor Unitario</label>
                            <input type="number" name="valor_unitario" id="valor_unitario" value={formData.valor_unitario ?? ''} onChange={handleChange} min="0" step="0.01" required className={inputStyle} />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Products: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        codigo: '',
        tipo: '',
        valorMin: '',
        valorMax: '',
        stockMin: '',
        stockMax: '',
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data } = await supabaseService.data.getItems();
        if (data) setItems(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    const handleSave = async (item: Partial<Item>) => {
        if (!user) {
            alert("Debe iniciar sesión para guardar un producto.");
            return;
        }

        const isNew = !item.id;

        const result = isNew
            ? await supabaseService.data.addItem(item as Omit<Item, 'id' | 'stock_actual'>, user.id)
            : await supabaseService.data.updateItem(item as Item);

        if (result.error) {
            console.error("Error al guardar el producto:", result.error);
            alert(`No se pudo guardar el producto: ${result.error.message}`);
        } else {
             // HACK: If a new PT was created, immediately delete any recipe that might have been auto-created by a backend trigger.
            // This enforces the user's requirement to create recipes manually.
            if (isNew && item.tipo === ItemType.PT && result.data && Array.isArray(result.data) && result.data.length > 0) {
                const newPTId = result.data[0].id;
                // This is a "fire and forget" cleanup. If it fails, the user will see the auto-created recipe, which is the current undesirable behavior.
                supabaseService.data.deleteRecipe(newPTId);
            }
            
            setEditingItem(null);
            fetchItems();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            const { error } = await supabaseService.data.deleteItem(id);
            if (error) {
                alert(`No se pudo eliminar el producto: ${error.message}`);
            } else {
                fetchItems();
            }
        }
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            codigo: '',
            tipo: '',
            valorMin: '',
            valorMax: '',
            stockMin: '',
            stockMax: '',
        });
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filters.codigo && !item.codigo.toLowerCase().includes(filters.codigo.toLowerCase())) return false;
            if (filters.tipo && item.tipo !== filters.tipo) return false;
            
            const valorMin = parseFloat(filters.valorMin);
            if (!isNaN(valorMin) && (item.valor_unitario ?? 0) < valorMin) return false;
            
            const valorMax = parseFloat(filters.valorMax);
            if (!isNaN(valorMax) && (item.valor_unitario ?? 0) > valorMax) return false;
            
            const stockMin = parseInt(filters.stockMin, 10);
            if (!isNaN(stockMin) && item.stock_actual < stockMin) return false;
            
            const stockMax = parseInt(filters.stockMax, 10);
            if (!isNaN(stockMax) && item.stock_actual > stockMax) return false;
            
            return true;
        });
    }, [items, filters]);
    
    const filterInputStyle = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
    const filterLabelStyle = "block text-sm font-medium text-gray-700 mb-1";


    if (loading) return <div>Cargando productos...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                 <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setIsFilterOpen(prev => !prev)}
                        className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    <button onClick={() => setEditingItem({})} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        + Nuevo Producto
                    </button>
                </div>
            </div>
            
            {editingItem && <ItemForm item={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}

            {isFilterOpen && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Filtrar Productos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="codigo" className={filterLabelStyle}>Código</label>
                            <input type="text" name="codigo" value={filters.codigo} onChange={handleFilterChange} className={filterInputStyle} placeholder="Buscar por código..." />
                        </div>
                        <div>
                            <label htmlFor="tipo" className={filterLabelStyle}>Tipo</label>
                            <select name="tipo" value={filters.tipo} onChange={handleFilterChange} className={filterInputStyle}>
                                <option value="">Todos</option>
                                <option value={ItemType.MP}>Materia Prima (MP)</option>
                                <option value={ItemType.PT}>Producto Terminado (PT)</option>
                            </select>
                        </div>
                        <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="valorMin" className={filterLabelStyle}>Valor Mín.</label>
                                <input type="number" name="valorMin" value={filters.valorMin} onChange={handleFilterChange} className={filterInputStyle} placeholder="0.00" min="0" step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="valorMax" className={filterLabelStyle}>Valor Máx.</label>
                                <input type="number" name="valorMax" value={filters.valorMax} onChange={handleFilterChange} className={filterInputStyle} placeholder="1000.00" min="0" step="0.01" />
                            </div>
                        </div>
                         <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="stockMin" className={filterLabelStyle}>Stock Mín.</label>
                                <input type="number" name="stockMin" value={filters.stockMin} onChange={handleFilterChange} className={filterInputStyle} placeholder="0" min="0" />
                            </div>
                            <div>
                                <label htmlFor="stockMax" className={filterLabelStyle}>Stock Máx.</label>
                                <input type="number" name="stockMax" value={filters.stockMax} onChange={handleFilterChange} className={filterInputStyle} placeholder="100" min="0" />
                            </div>
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
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Descripción</th>
                            <th className="px-6 py-3 text-center">Stock Actual</th>
                            <th className="px-6 py-3 text-center">Stock Mínimo</th>
                            <th className="px-6 py-3 text-right">Valor Unitario</th>
                            <th className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-500">
                                    No se encontraron productos con los filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} className={`border-b ${item.stock_actual < item.stock_minimo ? 'bg-red-50' : 'bg-white'}`}>
                                    <td className="px-6 py-4 text-2xl" title={item.tipo === ItemType.MP ? 'Materia Prima' : 'Producto Terminado'}>
                                        {item.tipo === ItemType.MP ? '🔩' : '📦'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.codigo}</td>
                                    <td className="px-6 py-4">{item.descripcion}</td>
                                    <td className={`px-6 py-4 text-center font-bold ${item.stock_actual < item.stock_minimo ? 'text-red-600' : ''}`}>{item.stock_actual}</td>
                                    <td className="px-6 py-4 text-center">{item.stock_minimo}</td>
                                    <td className="px-6 py-4 text-right font-mono">${(item.valor_unitario || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => setEditingItem(item)} className="font-medium text-primary-600 hover:underline">Editar</button>
                                        <button onClick={() => handleDelete(item.id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Products;