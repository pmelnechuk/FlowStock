import { supabase } from '../lib/supabaseClient';
import { Item, Movement, NewMovement, Role, User, Recipe, RecipeComponent } from '../types';

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

    async signUp(nombre_completo: string, email: string, contrasena: string) {
      // The sign-up process only creates the auth.users entry.
      // A database trigger (handle_new_user) is expected to create the corresponding public.usuarios profile.
      const { error } = await supabase.auth.signUp({
        email: email,
        password: contrasena,
        options: {
          data: {
            nombre_completo: nombre_completo,
          },
        },
      });
      return { error: error ? error.message : null };
    },

    async sendPasswordResetEmail(email: string) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      return { error: error ? error.message : null };
    },
  },
  data: {
    async getItems() {
      return supabase.from('items').select('*').order('descripcion', { ascending: true });
    },

    async addItem(item: Omit<Item, 'id' | 'stock_actual'>, authUserId: string) {
      return supabase.from('items').insert([{ ...item, stock_actual: 0, created_by: authUserId }]).select();
    },
    
    async updateItem(item: Partial<Item>) {
      const { id, ...itemData } = item;
      if (!id) return { data: null, error: { message: 'Item ID is required for update.' } as any };
      return supabase.from('items').update(itemData).eq('id', id);
    },

    async deleteItem(id: string) {
      return supabase.from('items').delete().eq('id', id);
    },

    async getMovements() {
      return supabase
        .from('movimientos')
        .select('*, item:items(*)')
        .order('created_at', { ascending: false })
        .limit(100);
    },

    async addMovement(movement: NewMovement, authUserId: string) {
        const { data: product, error: productError } = await supabase
            .from('items')
            .select('stock_actual')
            .eq('id', movement.item_id)
            .single();

        if (productError || !product) {
            return { error: 'Producto no encontrado para registrar el movimiento.' };
        }
        
        const stock_anterior = product.stock_actual;
        const stock_nuevo = stock_anterior + movement.cantidad;

        const movementPayload: Omit<Movement, 'id' | 'created_at'> = {
            ...movement,
            stock_anterior,
            stock_nuevo,
            usuario_id: authUserId,
        };

        const { error: insertError } = await supabase.from('movimientos').insert(movementPayload);
        if (insertError) {
            return { error: `No se pudo registrar el movimiento: ${insertError.message}` };
        }

        const { error: updateError } = await supabase
            .from('items')
            .update({ stock_actual: stock_nuevo })
            .eq('id', movement.item_id);

        if (updateError) {
            // This is a problematic state, the movement was created but stock not updated.
            // A transaction (RPC) would prevent this.
            console.error("CRITICAL: Movement created but stock update failed.", updateError);
            return { error: `Movimiento registrado, pero falló la actualización de stock: ${updateError.message}` };
        }

        return { error: null };
    },

    async addMovements(movements: NewMovement[], authUserId: string) {
        // This is not atomic without an RPC. It processes movements one by one.
        for (const mov of movements) {
            const { error } = await this.addMovement(mov, authUserId);
            if (error) {
                // If one movement fails, stop and report. Some might have succeeded already.
                return { error: `Error en lote de movimientos: ${error}` };
            }
        }
        return { error: null };
    },

    async getUsers() {
      return supabase.from('usuarios').select('*').order('nombre_completo', { ascending: true });
    },

    async updateUser(user: Partial<User>) {
        const { id, ...updateData } = user;
        if (!id) return { data: null, error: { message: 'User ID is required for update.' } as any };
        
        const allowedUpdates: (keyof typeof updateData)[] = ['nombre_completo', 'role', 'status'];
        const updatePayload: Partial<User> = {};
        for (const key of allowedUpdates) {
            if (key in updateData) {
                (updatePayload as any)[key] = updateData[key];
            }
        }

        return supabase.from('usuarios').update(updatePayload).eq('id', id);
    },

    async getRecipes() {
        // FIX: Only fetch recipes that have at least one component, preventing "phantom" recipes from appearing.
        return supabase.from('v_recetas_completas').select('*').gt('total_componentes', 0);
    },

    async deleteRecipe(producto_terminado_id: string) {
        return supabase.from('recetas').delete().eq('producto_terminado_id', producto_terminado_id);
    },

    async upsertRecipe(producto_terminado_id: string, componentes: RecipeComponent[], authUserId: string) {
        // This should be a transaction, but we simulate it:
        // 1. Delete all existing components for the recipe (identified by the finished product)
        const { error: deleteError } = await supabase.from('recetas').delete().eq('producto_terminado_id', producto_terminado_id);
        if (deleteError) {
            console.error("Error deleting old recipe components:", deleteError);
            return { error: deleteError };
        }

        // 2. Insert the new components if there are any
        if (componentes.length > 0) {
            const recipeItems = componentes.map(comp => ({
                producto_terminado_id: producto_terminado_id,
                materia_prima_id: comp.materia_prima_id,
                cantidad_requerida: comp.cantidad_requerida,
                created_by: authUserId
            }));
            const { error: insertItemsError } = await supabase.from('recetas').insert(recipeItems);
            if (insertItemsError) {
                console.error("Error inserting new recipe components:", insertItemsError);
                return { error: insertItemsError };
            }
        }

        return { error: null };
    },
  }
};