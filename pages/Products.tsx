import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, ItemType } from '../types';

const ItemForm: React.FC<{ item: Partial<Item> | null; onSave: (item: Partial<Item>) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || {});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'stock_minimo' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                            <label htmlFor="unidad" className="block text-sm font-medium">Unidad</label>
                            <input type="text" name="unidad" id="unidad" value={formData.unidad || 'un'} onChange={handleChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="stock_minimo" className="block text-sm font-medium">Stock Mínimo</label>
                        <input type="number" name="stock_minimo" id="stock_minimo" value={formData.stock_minimo || 0} onChange={handleChange} min="0" required className={inputStyle} />
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
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);

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
        if (item.id) { // Update
            await supabaseService.data.updateItem(item as Item);
        } else { // Create
            await supabaseService.data.addItem(item as Omit<Item, 'id' | 'stock_actual'>);
        }
        setEditingItem(null);
        fetchItems();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            await supabaseService.data.deleteItem(id);
            fetchItems();
        }
    };

    if (loading) return <div>Cargando productos...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                <button onClick={() => setEditingItem({})} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    + Nuevo Producto
                </button>
            </div>
            
            {editingItem && <ItemForm item={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}

            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Descripción</th>
                            <th className="px-6 py-3 text-center">Stock Actual</th>
                            <th className="px-6 py-3 text-center">Stock Mínimo</th>
                            <th className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className={`border-b ${item.stock_actual < item.stock_minimo ? 'bg-yellow-50' : 'bg-white'}`}>
                                <td className="px-6 py-4 text-2xl" title={item.tipo === ItemType.MP ? 'Materia Prima' : 'Producto Terminado'}>
                                    {item.tipo === ItemType.MP ? '🔩' : '📦'}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{item.codigo}</td>
                                <td className="px-6 py-4">{item.descripcion}</td>
                                <td className={`px-6 py-4 text-center font-bold ${item.stock_actual < item.stock_minimo ? 'text-red-600' : ''}`}>{item.stock_actual}</td>
                                <td className="px-6 py-4 text-center">{item.stock_minimo}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => setEditingItem(item)} className="font-medium text-primary-600 hover:underline">Editar</button>
                                    <button onClick={() => handleDelete(item.id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Products;