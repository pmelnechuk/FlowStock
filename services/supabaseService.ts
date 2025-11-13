import { supabase } from '../lib/supabaseClient';
import { Item, Movement, NewMovement, Role, User, RecipeComponent } from '../types';

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
      // The join on `usuarios` is problematic because the FK from `movimientos` is to `auth.users`, not `public.usuarios`.
      // Supabase cannot automatically infer this join. We will fetch users separately and join on the client.
      return supabase
        .from('movimientos')
        .select('*, item:items(*)') // Fetches movements and their related item.
        .order('fecha', { ascending: false })
        .limit(100);
    },

    async addMovement(movement: NewMovement, userId: string) {
        // The database trigger `on_movement_created` will automatically handle
        // stock updates and validation after a new movement is inserted.
        const payload = {
            item_id: movement.item_id,
            tipo: movement.tipo,
            cantidad: movement.cantidad,
            usuario_id: userId,
            // Only include the observation field if it has a non-empty value.
            // This prevents sending empty strings, which might conflict with DB constraints
            // that expect NULL instead, thus avoiding potential 400 Bad Request errors.
            ...(movement.observacion && { observacion: movement.observacion })
        };
        const { error } = await supabase.from('movimientos').insert(payload);
        return { error: error ? error.message : null };
    },

    async addMovements(movements: Omit<Movement, 'id' | 'fecha'>[]) {
        const { error } = await supabase.from('movimientos').insert(movements);
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

    async getRecipes() {
        return supabase
            .from('recetas')
            .select(`
                producto_terminado_id,
                materia_prima_id,
                cantidad_necesaria,
                producto:producto_terminado_id (*),
                materia_prima:materia_prima_id (*)
            `)
            .order('producto_terminado_id');
    },

    async deleteRecipe(producto_terminado_id: number) {
        return supabase
            .from('recetas')
            .delete()
            .eq('producto_terminado_id', producto_terminado_id);
    },

    async upsertRecipe(producto_terminado_id: number, componentes: RecipeComponent[]) {
        // This is a "delete and replace" strategy, which is simple and effective for managing recipe components.
        // It's wrapped in a transaction via an RPC call for atomicity.
        const { error: deleteError } = await this.deleteRecipe(producto_terminado_id);
        if (deleteError) return { error: deleteError };

        if (componentes.length === 0) return { error: null };

        const recipeItems = componentes.map(comp => ({
            producto_terminado_id,
            materia_prima_id: comp.materia_prima_id,
            cantidad_necesaria: comp.cantidad_necesaria
        }));

        return supabase.from('recetas').insert(recipeItems);
    },
  }
};