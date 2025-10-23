import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, Movement, MovementType, NewMovement, User } from '../types';
import { useAuth } from '../hooks/useAuth';

const Movements: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [movements, setMovements] = useState<(Movement & { item: Item; user: User })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<Partial<NewMovement>>({ tipo: MovementType.ENT, cantidad: 1 });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [itemsRes, movementsRes] = await Promise.all([
            supabaseService.data.getItems(),
            supabaseService.data.getMovements()
        ]);
        if (itemsRes.data) setItems(itemsRes.data);
        if (movementsRes.data) setMovements(movementsRes.data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: name === 'cantidad' || name === 'item_id' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formState.item_id || !formState.tipo || formState.cantidad === undefined) {
            setError('Por favor complete todos los campos requeridos.');
            return;
        }

        const cantidad = Number(formState.cantidad);

        if (cantidad === 0) {
            setError('La cantidad no puede ser cero.');
            return;
        }

        if ((formState.tipo === MovementType.ENT || formState.tipo === MovementType.SAL) && cantidad <= 0) {
            setError('Para Entradas y Salidas, la cantidad debe ser un número positivo.');
            return;
        }
        
        setIsSubmitting(true);

        const movementData: NewMovement = {
            item_id: formState.item_id,
            tipo: formState.tipo,
            cantidad: cantidad,
            observacion: formState.observacion,
        };
        
        const { error: submitError } = await supabaseService.data.addMovement(movementData, user!.id);
        
        if (submitError) {
            if (submitError.includes('Stock insuficiente')) {
                setError('Error: Stock insuficiente para realizar esta operación.');
            } else {
                setError(`Error al registrar: ${submitError}`);
            }
        } else {
            setSuccess('Movimiento registrado con éxito.');
            setFormState({ tipo: MovementType.ENT, cantidad: 1, item_id: undefined, observacion: '' });
            fetchData(); // Refresh data
        }
        setIsSubmitting(false);
    };

    if (loading) return <div>Cargando datos...</div>;

    const MovementTypeLabels: Record<MovementType, string> = {
        [MovementType.ENT]: 'Entrada',
        [MovementType.SAL]: 'Salida',
        [MovementType.AJU]: 'Ajuste',
    };
    
    const MovementTypeColors: Record<MovementType, string> = {
        [MovementType.ENT]: 'bg-green-100 text-green-800',
        [MovementType.SAL]: 'bg-red-100 text-red-800',
        [MovementType.AJU]: 'bg-blue-100 text-blue-800',
    };

    const inputStyle = "w-full mt-1 block px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-md">
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
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && <p className="text-sm text-green-500">{success}</p>}

                        <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                            {isSubmitting ? 'Registrando...' : 'Registrar'}
                        </button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3">Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id} className="border-b">
                                        <td className="px-4 py-2 text-gray-900">{new Date(m.fecha).toLocaleString()}</td>
                                        <td className="px-4 py-2 font-medium text-gray-900">{m.item.descripcion}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${MovementTypeColors[m.tipo]}`}>{MovementTypeLabels[m.tipo]}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-900">{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                                        <td className="px-4 py-2 text-gray-900">{m.user.nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Movements;