import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User, Role } from '../types';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data } = await supabaseService.data.getUsers();
        if (data) setUsers(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (user: User, newRole: Role) => {
        const updatedUser = { ...user, rol: newRole };
        await supabaseService.data.updateUser(updatedUser);
        fetchUsers();
    };

    const handleStatusChange = async (user: User, newStatus: boolean) => {
        const updatedUser = { ...user, activo: newStatus };
        await supabaseService.data.updateUser(updatedUser);
        fetchUsers();
    };

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.nombre}</td>
                                <td className="px-6 py-4">{user.usuario}</td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={user.rol}
                                        onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                                    >
                                        <option value={Role.ADMIN}>Admin</option>
                                        <option value={Role.OPERARIO}>Operario</option>
                                        <option value={Role.SUPERVISOR}>Supervisor</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={user.activo} 
                                            onChange={(e) => handleStatusChange(user, e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        <span className="ml-3 text-sm font-medium">{user.activo ? 'Activo' : 'Inactivo'}</span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;