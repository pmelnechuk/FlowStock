import React, { useState, useEffect, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Item, ItemType, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
// FIX: Removed unused import from react-router-dom.

const DashboardCard: React.FC<{ title: string; value: string | number; borderColor: string, textColor: string }> = ({ title, value, borderColor, textColor }) => (
  <div className={`p-6 rounded-lg shadow-md bg-white border-l-4 ${borderColor}`}>
    <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
    <p className={`text-4xl font-bold ${textColor} mt-2`}>{value}</p>
  </div>
);

const LowStockToast: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
    <div className="fixed top-20 right-6 w-full max-w-sm p-4 bg-yellow-400 border-l-4 border-yellow-700 text-yellow-800 rounded-lg shadow-lg flex justify-between items-center z-50">
        <div>
            <p className="font-bold">Alerta de Stock Bajo</p>
            <p>{count} ítem(s) están por debajo del stock mínimo.</p>
        </div>
        <button onClick={onClose} className="text-xl font-bold">&times;</button>
    </div>
);


const Dashboard: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data } = await supabaseService.data.getItems();
      if (data) setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalMP = items.filter(i => i.tipo === ItemType.MP).length;
    const totalPT = items.filter(i => i.tipo === ItemType.PT).length;
    const lowStockItems = items.filter(i => i.stock_actual < i.stock_minimo);
    return { totalItems, totalMP, totalPT, lowStockItems };
  }, [items]);
  
  useEffect(() => {
    if (stats.lowStockItems.length > 0) {
      setShowToast(true);
    }
  }, [stats.lowStockItems.length]);

  if (loading) return <div className="text-center p-10">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      {showToast && stats.lowStockItems.length > 0 && (
          <LowStockToast count={stats.lowStockItems.length} onClose={() => setShowToast(false)} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Productos" value={stats.totalItems} borderColor="border-blue-500" textColor="text-blue-600" />
        <DashboardCard title="Materias Primas (MP)" value={stats.totalMP} borderColor="border-blue-500" textColor="text-blue-600" />
        <DashboardCard title="Productos Terminados (PT)" value={stats.totalPT} borderColor="border-blue-500" textColor="text-blue-600" />
        <DashboardCard title="Items con Stock Bajo" value={stats.lowStockItems.length} borderColor="border-red-500" textColor="text-red-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Items con Stock Bajo</h2>
        {stats.lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-center">Stock Actual</th>
                  <th className="px-4 py-3 text-center">Stock Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.codigo}</td>
                    <td className="px-4 py-2 text-gray-900">{item.descripcion}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{item.stock_actual}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{item.stock_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">¡Buen trabajo! No hay items con stock bajo.</p>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
