import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, ItemType, Recipe, RecipeComponent, Role } from '../types';
import { useAuth } from '../hooks/useAuth';

const RecipeForm: React.FC<{
    recipeToEdit: Partial<Recipe> | null;
    items: Item[];
    usedRecipePTIds: Set<string>;
    onSave: (producto_terminado_id: string, componentes: RecipeComponent[]) => void;
    onCancel: () => void;
}> = ({ recipeToEdit, items, usedRecipePTIds, onSave, onCancel }) => {
    
    const [productoTerminadoId, setProductoTerminadoId] = useState<string>(recipeToEdit?.producto_terminado_id || '');
    const [componentes, setComponentes] = useState<Partial<RecipeComponent>[]>(recipeToEdit?.componentes || []);

    const isEditing = !!recipeToEdit?.producto_terminado_id;

    const finishedProductsForDropdown = useMemo(() => {
        const allPTs = items.filter(i => i.tipo === ItemType.PT);
        if (isEditing) {
            // For editing, show all PTs, as the field will be disabled and pre-filled.
            return allPTs;
        }
        // For a new recipe, only show PTs that don't already have a recipe.
        return allPTs.filter(pt => !usedRecipePTIds.has(pt.id));
    }, [items, usedRecipePTIds, isEditing]);

    const rawMaterials = useMemo(() => items.filter(i => i.tipo === ItemType.MP), [items]);

    const handleAddComponent = () => {
        setComponentes([...componentes, { materia_prima_id: '', cantidad_requerida: 1 }]);
    };

    const handleComponentChange = (index: number, field: keyof RecipeComponent, value: any) => {
        const newComponentes = [...componentes];
        const numValue = field === 'cantidad_requerida' ? parseFloat(value) : value;
        newComponentes[index] = { ...newComponentes[index], [field]: numValue };
        setComponentes(newComponentes);
    };

    const handleRemoveComponent = (index: number) => {
        setComponentes(componentes.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validComponentes = componentes.filter(c => c.materia_prima_id && c.cantidad_requerida && c.cantidad_requerida > 0);

        if (!productoTerminadoId) {
            alert("Por favor, seleccione un producto terminado.");
            return;
        }
        if (validComponentes.length === 0) {
            alert("Por favor, añada al menos un componente válido a la receta.");
            return;
        }
        
        onSave(productoTerminadoId, validComponentes as RecipeComponent[]);
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 pt-16">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar' : 'Nueva'} Receta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="producto_terminado_id" className="block text-sm font-medium">Producto Terminado (PT)</label>
                        <select
                            id="producto_terminado_id"
                            value={productoTerminadoId || ''}
                            onChange={(e) => setProductoTerminadoId(e.target.value)}
                            required
                            disabled={isEditing}
                            className={inputStyle + " disabled:bg-gray-100 disabled:text-gray-500"}
                        >
                            <option value="">Seleccione un PT</option>
                            {finishedProductsForDropdown.map(item => (
                                <option key={item.id} value={item.id}>{item.codigo} - {item.descripcion}</option>
                            ))}
                        </select>
                         {isEditing && <p className="text-xs text-gray-500 mt-1">No se puede cambiar el producto de una receta existente.</p>}
                         {!isEditing && finishedProductsForDropdown.length === 0 && <p className="text-xs text-gray-500 mt-1">Todos los productos terminados ya tienen una receta.</p>}
                    </div>
                
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold">Componentes (MP)</h3>
                         <p className="text-sm text-gray-600 mb-2">Materias primas necesarias para producir <strong>1 unidad</strong> del producto terminado.</p>
                        <div className="space-y-3 mt-2">
                            {componentes.map((comp, index) => (
                                <div key={index} className="flex items-end gap-2 p-2 border rounded-md bg-gray-50">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-gray-600">Materia Prima</label>
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
                                    <div className="w-40">
                                        <label className="text-xs font-medium text-gray-600">Cantidad Requerida</label>
                                        <input
                                            type="number"
                                            value={comp.cantidad_requerida || ''}
                                            onChange={(e) => handleComponentChange(index, 'cantidad_requerida', e.target.value)}
                                            required
                                            min="0.0001"
                                            step="0.0001"
                                            className={inputStyle}
                                        />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveComponent(index)} className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 h-[42px]">-</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddComponent} className="mt-3 px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300">+ Añadir Componente</button>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
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
    const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
    
    const canEdit = user?.role === Role.ADMIN || user?.role === Role.SUPERVISOR;
    const itemsMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [itemsRes, recipesRes] = await Promise.all([
            supabaseService.data.getItems(),
            supabaseService.data.getRecipes()
        ]);

        const newItems = itemsRes.data || [];
        setItems(newItems as Item[]);
        const localItemsMap = new Map((newItems as Item[]).map(item => [item.id, item]));

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

    const handleSave = async (producto_terminado_id: string, componentes: RecipeComponent[]) => {
        if (!canEdit || !user) return;
        await supabaseService.data.upsertRecipe(producto_terminado_id, componentes, user.id);
        setEditingRecipe(null);
        fetchAllData();
    };

    const handleDelete = async (producto_terminado_id: string) => {
        if (!canEdit) return;
        if (window.confirm('¿Está seguro de que desea eliminar esta receta? Esta acción no se puede deshacer.')) {
            const { error } = await supabaseService.data.deleteRecipe(producto_terminado_id);
            if (error) {
                alert(`No se pudo eliminar la receta: ${error.message}`);
                console.error("Error deleting recipe:", error);
            } else {
                fetchAllData();
            }
        }
    };
    
    const usedRecipePTIds = useMemo(() => new Set(recipes.map(r => r.producto_terminado_id)), [recipes]);

    const availablePTsForNewRecipe = useMemo(() => {
        return items.filter(i => i.tipo === ItemType.PT && !usedRecipePTIds.has(i.id));
    }, [items, usedRecipePTIds]);

    if (loading) return <div>Cargando recetas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Recetas</h1>
                {canEdit && (
                    <button
                        onClick={() => setEditingRecipe({})}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        disabled={availablePTsForNewRecipe.length === 0}
                        title={availablePTsForNewRecipe.length === 0 ? "Todos los productos terminados ya tienen una receta" : "Crear una nueva receta"}
                    >
                        + Nueva Receta
                    </button>
                )}
            </div>
            
            {canEdit && editingRecipe !== null && <RecipeForm 
                recipeToEdit={editingRecipe} 
                items={items} 
                usedRecipePTIds={usedRecipePTIds}
                onSave={handleSave} 
                onCancel={() => setEditingRecipe(null)} 
            />}

            {recipes.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                    <p>No hay recetas creadas.</p>
                    {canEdit && <p>Crea una receta para automatizar el descuento de materias primas al producir un producto terminado.</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {recipes.map(recipe => {
                        const productoTerminado = recipe.producto_terminado || itemsMap.get(recipe.producto_terminado_id);
                        return (
                            <div key={recipe.producto_terminado_id} className="bg-white p-4 rounded-lg shadow-md">
                                <div className="flex justify-between items-start border-b pb-3 mb-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-primary-700">Receta para: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{productoTerminado?.codigo}</span></h2>
                                        <p className="text-sm text-gray-600">
                                           {productoTerminado?.descripcion}
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <div className="space-x-2 flex-shrink-0 ml-4">
                                            <button onClick={() => setEditingRecipe(recipe)} className="font-medium text-primary-600 hover:underline">Editar</button>
                                            <button onClick={() => handleDelete(recipe.producto_terminado_id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-semibold mb-2">Componentes (para producir 1 {productoTerminado?.unidad_medida || 'un.'}):</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {recipe.componentes.map(comp => {
                                        const materiaPrima = comp.materia_prima || itemsMap.get(comp.materia_prima_id);
                                        return (
                                        <li key={comp.materia_prima_id}>
                                            <span className="font-bold">{(comp.cantidad_requerida ?? 0).toLocaleString()}</span> {materiaPrima?.unidad_medida || 'un.'} de <span className="font-mono bg-gray-50 px-1 rounded">{materiaPrima?.codigo}</span> ({materiaPrima?.descripcion})
                                        </li>
                                    )})}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Recipes;