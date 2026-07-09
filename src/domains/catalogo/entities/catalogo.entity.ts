import { BaseEntity, TenantId } from '../../../shared/types/common.types';

export interface Categoria extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ModificadorProducto extends BaseEntity {
  productId: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
}

export interface Producto extends BaseEntity {
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  modifiers?: ModificadorProducto[];
}
