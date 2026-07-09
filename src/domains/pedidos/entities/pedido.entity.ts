import { BaseEntity, TenantId, UserId } from '../../../shared/types/common.types';
import { EstadoPedido, TipoPedido } from '../value-objects/pedido.vo';

export interface ItemPedidoModificador {
  id: string;
  tenantId: TenantId;
  orderItemId: string;
  modifierId: string;
  priceAdjustment: number;
}

export interface ItemPedido {
  id: string;
  tenantId: TenantId;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers: ItemPedidoModificador[];
}

export interface Pedido extends BaseEntity {
  userId?: UserId;
  tableId?: string;
  status: EstadoPedido;
  orderType: TipoPedido;
  totalAmount: number;
  items: ItemPedido[];
}
