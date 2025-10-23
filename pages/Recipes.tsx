import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, ItemType, Recipe, RecipeComponent, Role } from '../types';
import { useAuth } from '../hooks/useAuth';

const RecipeForm: React.FC<{
    recipe: Recipe | null;
    items: Item[];
    onSave: (recipe: Recipe) => void;
    onCancel: () => void;
}> = ({ recipe, items, onSave, onCancel }) => {
    const [productoTerminadoId, setProductoTerminadoId] = useState<number | undefined>(recipe?.producto_terminado_id);
    const [componentes, setComponentes] = useState<RecipeComponent[]>(recipe?.componentes || []);

    const finishedProducts = useMemo(() => items.filter(i => i.tipo === ItemType.PT), [items]);
    const rawMaterials = useMemo(() => items.filter(i => i.tipo === ItemType.MP), [items]);

    const handleAddComponent = () => {
        setComponentes([...componentes, { materia_prima_id: 0, cantidad_necesaria: 1 }]);
    };

    const handleComponentChange = (index: number, field: keyof RecipeComponent, value: any) => {
        const newComponentes = [...componentes];
        newComponentes[index] = { ...newComponentes[index], [field]: Number(value) };
        setComponentes(newComponentes);
    };

    const handleRemoveComponent = (index: number) => {
        setComponentes(componentes.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoTerminadoId || componentes.length === 0) {
            alert("Por favor, seleccione un producto terminado y añada al menos un componente.");
            return;
        }
        onSave({ producto_terminado_id: productoTerminadoId, componentes });
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 pt-16">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{recipe?.producto_terminado_id ? 'Editar' : 'Nueva'} Receta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="producto_terminado_id" className="block text-sm font-medium">Producto Terminado (PT)</label>
                        <select
                            id="producto_terminado_id"
                            value={productoTerminadoId || ''}
                            onChange={(e) => setProductoTerminadoId(Number(e.target.value))}
                            required
                            disabled={!!recipe?.producto_terminado_id}
                            className={inputStyle + " disabled:bg-gray-100"}
                        >
                            <option value="">Seleccione un PT</option>
                            {finishedProducts.map(item => (
                                <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold">Componentes (MP)</h3>
                        <div className="space-y-3 mt-2">
                            {componentes.map((comp, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                    <div className="flex-1">
                                        <label className="text-xs">Materia Prima</label>
                                        <select
                                            value={comp.materia_prima_id}
                                            onChange={(e) => handleComponentChange(index, 'materia_prima_id', e.target.value)}
                                            required
                                            className={inputStyle}
                                        >
                                            <option value="">Seleccione MP</option>
                                            {rawMaterials.map(item => (
                                                <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs">Cantidad</label>
                                        <input
                                            type="number"
                                            value={comp.cantidad_necesaria}
                                            onChange={(e) => handleComponentChange(index, 'cantidad_necesaria', e.target.value)}
                                            required
                                            min="0.0001"
                                            step="0.0001"
                                            className={inputStyle}
                                        />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveComponent(index)} className="mt-5 px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">X</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddComponent} className="mt-3 px-4 py-2 text-sm bg-gray-200 rounded-md">+ Añadir Componente</button>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Guardar Receta</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Recipes: React.FC = () => {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    
    const isAdmin = user?.rol === Role.ADMIN;

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [itemsRes, recipesRes] = await Promise.all([
            supabaseService.data.getItems(),
            supabaseService.data.getRecipes()
        ]);

        if (itemsRes.data) setItems(itemsRes.data);
        if (recipesRes.data) {
            const recipesMap = new Map<number, Recipe>();
            recipesRes.data.forEach(r => {
                if (!recipesMap.has(r.producto_terminado_id)) {
                    recipesMap.set(r.producto_terminado_id, {
                        producto_terminado_id: r.producto_terminado_id,
                        producto_terminado: r.producto as Item,
                        componentes: []
                    });
                }
                recipesMap.get(r.producto_terminado_id)?.componentes.push({
                    materia_prima_id: r.materia_prima_id,
                    cantidad_necesaria: r.cantidad_necesaria,
                    materia_prima: r.materia_prima as Item
                });
            });
            setRecipes(Array.from(recipesMap.values()));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSave = async (recipe: Recipe) => {
        if (!isAdmin) return;
        await supabaseService.data.upsertRecipe(recipe.producto_terminado_id, recipe.componentes);
        setEditingRecipe(null);
        fetchAllData();
    };

    const handleDelete = async (producto_terminado_id: number) => {
        if (!isAdmin) return;
        if (window.confirm('¿Está seguro de que desea eliminar esta receta? Esta acción no se puede deshacer.')) {
            await supabaseService.data.deleteRecipe(producto_terminado_id);
            fetchAllData();
        }
    };
    
    if (loading) return <div>Cargando recetas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Recetas</h1>
                {isAdmin && (
                    <button onClick={() => setEditingRecipe({ producto_terminado_id: 0, componentes: [] })} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        + Nueva Receta
                    </button>
                )}
            </div>
            
            {isAdmin && editingRecipe && <RecipeForm recipe={editingRecipe} items={items} onSave={handleSave} onCancel={() => setEditingRecipe(null)} />}

            {recipes.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                    <p>No hay recetas creadas.</p>
                    {isAdmin && <p>Crea una receta para automatizar el descuento de materias primas al producir un producto terminado.</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {recipes.map(recipe => (
                        <div key={recipe.producto_terminado_id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                <h2 className="text-lg font-bold text-primary-700">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{recipe.producto_terminado?.codigo}</span> - {recipe.producto_terminado?.descripcion}
                                </h2>
                                {isAdmin && (
                                    <div className="space-x-2">
                                        <button onClick={() => setEditingRecipe(recipe)} className="font-medium text-primary-600 hover:underline">Editar</button>
                                        <button onClick={() => handleDelete(recipe.producto_terminado_id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-semibold mb-2">Componentes necesarios para 1 unidad:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {recipe.componentes.map(comp => (
                                    <li key={comp.materia_prima_id}>
                                        <span className="font-bold">{comp.cantidad_necesaria}</span> de <span className="font-mono bg-gray-50 px-1 rounded">{comp.materia_prima?.codigo}</span> ({comp.materia_prima?.descripcion})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Recipes;