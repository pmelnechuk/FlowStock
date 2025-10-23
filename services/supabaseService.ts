
import { supabase } from '../lib/supabaseClient';
import { Item, NewMovement, Role, User } from '../types';

export const supabaseService = {
  auth: {
    async signIn(email: string, contrasena: string) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: contrasena,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
            return { error: 'Correo o contraseña incorrectos. Por favor, verifique sus datos.' };
        }
        return { error: error.message };
      }
      
      return { error: null };
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    async signUp(nombre: string, usuario: string, contrasena: string, email: string) {
      // We assume a database trigger is set up on auth.users to create a
      // corresponding public.usuarios profile using the metadata.
      const { error } = await supabase.auth.signUp({
        email: email,
        password: contrasena,
        options: {
          data: {
            nombre: nombre,
            usuario: usuario,
            rol: Role.OPERARIO, // New users are operarios by default
            activo: false,     // Admin must activate the account
          },
        },
      });
      return { error: error ? error.message : null };
    },

    async sendPasswordResetEmail(email: string) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // App uses HashRouter, so the path needs to be prefixed accordingly.
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      return { error: error ? error.message : null };
    },
  },
  data: {
    async getItems() {
      return supabase.from('items').select('*').order('descripcion', { ascending: true });
    },

    async addItem(item: Omit<Item, 'id' | 'stock_actual'>) {
      // New items start with 0 stock, which can be updated with an "Entrada" movement.
      return supabase.from('items').insert([{ ...item, stock_actual: 0 }]);
    },
    
    async updateItem(item: Partial<Item>) {
      const { id, ...itemData } = item;
      if (!id) return { data: null, error: { message: 'Item ID is required for update.' } as any };
      return supabase.from('items').update(itemData).eq('id', id);
    },

    async deleteItem(id: number) {
      return supabase.from('items').delete().eq('id', id);
    },

    async getMovements() {
      return supabase
        .from('movimientos')
        .select('*, item:items(*), user:usuarios(*)')
        .order('fecha', { ascending: false })
        .limit(100);
    },

    async addMovement(movement: NewMovement, userId: string) {
        // This logic should be handled by a database function (RPC) to ensure
        // data consistency (e.g., check stock before withdrawal) and avoid race conditions.
        // We assume an RPC function `registrar_movimiento` exists.
        const { error } = await supabase.rpc('registrar_movimiento', {
            p_item_id: movement.item_id,
            p_tipo_movimiento: movement.tipo,
            p_cantidad: movement.cantidad,
            p_usuario_id: userId,
            p_observacion: movement.observacion
        });
        return { error: error ? error.message : null };
    },

    async getUsers() {
      return supabase.from('usuarios').select('*').order('nombre', { ascending: true });
    },

    async updateUser(user: User) {
      const { id, nombre, usuario, rol, activo } = user;
      // We only update fields managed in the UI, avoiding changes to email/id.
      const updatePayload = {
        nombre,
        usuario,
        rol,
        activo
      };
      return supabase.from('usuarios').update(updatePayload).eq('id', id);
    },
  }
};