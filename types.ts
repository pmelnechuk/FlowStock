export enum Role {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
  SUPERVISOR = 'SUPERVISOR',
}

export enum UserStatus {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export interface User {
  id: string; // This is now the auth.users.id
  email: string;
  nombre_completo: string;
  role: Role;
  status: UserStatus;
}

export enum ItemType {
  MP = 'MP', // Materia Prima
  PT = 'PT', // Producto Terminado
}

export interface Item {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: ItemType;
  unidad_medida: string;
  stock_minimo: number;
  stock_actual: number;
  valor_unitario: number;
}

export enum MovementType {
  PRODUCCION = 'PRODUCCION',
  ENTRADA_MP = 'ENTRADA_MP',
  SALIDA_PT = 'SALIDA_PT',
  AJUSTE = 'AJUSTE',
  CONSUMO_MP = 'CONSUMO_MP',
}

export interface Movement {
  id: string;
  created_at: string;
  tipo: MovementType;
  item_id: string;
  cantidad: number;
  usuario_id: string;
  observaciones?: string;
  stock_anterior: number;
  stock_nuevo: number;
  cantidad_producida?: number;
  componentes?: { mp_id: string; mp_codigo: string; cantidad_consumida: number }[];
}

export type NewMovement = Omit<Movement, 'id' | 'created_at' | 'usuario_id' | 'stock_anterior' | 'stock_nuevo'>;

export interface RecipeComponent {
  materia_prima_id: string;
  cantidad_requerida: number;
}

// High-level object representing a recipe for a PT, used in the app
export interface Recipe {
  // A "recipe" is now identified by the finished product it creates.
  producto_terminado_id: string; 
  // We can enrich this with the full item object after fetching
  producto_terminado?: Item; 
  // The list of raw materials and quantities needed
  componentes: (RecipeComponent & { materia_prima?: Item })[];
}