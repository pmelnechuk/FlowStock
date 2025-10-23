export enum Role {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
  SUPERVISOR = 'SUPERVISOR',
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  usuario: string;
  rol: Role;
  activo: boolean;
}

export enum ItemType {
  MP = 'MP', // Materia Prima
  PT = 'PT', // Producto Terminado
}

export interface Item {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: ItemType;
  unidad: string;
  stock_minimo: number;
  stock_actual: number;
  valor: number;
}

export enum MovementType {
  ENT = 'ENT', // Entrada
  SAL = 'SAL', // Salida
  AJU = 'AJU', // Ajuste
}

export interface Movement {
  id: number;
  fecha: string;
  tipo: MovementType;
  item_id: number;
  cantidad: number;
  usuario_id: string;
  observacion?: string;
}

// For creating new movements, some fields are omitted
export type NewMovement = Omit<Movement, 'id' | 'fecha' | 'usuario_id'>;

export interface RecipeComponent {
  id?: number;
  materia_prima_id: number;
  cantidad_necesaria: number;
}

export interface Recipe {
  producto_terminado_id: number;
  producto_terminado?: Item;
  componentes: (RecipeComponent & { materia_prima?: Item })[];
}
