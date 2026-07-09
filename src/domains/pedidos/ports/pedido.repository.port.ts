import { Result } from '../../../shared/result';
import { Pedido, ItemPedido } from '../entities/pedido.entity';
import { TenantId } from '../../../shared/types/common.types';

export interface IPedidoRepository {
  crear(pedido: Omit<Pedido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Pedido>>;
  obtenerPorId(tenantId: TenantId, id: string): Promise<Result<Pedido>>;
  actualizarEstado(tenantId: TenantId, id: string, estado: string): Promise<Result<Pedido>>;
}

export interface IInventarioPort {
  verificarDisponibilidad(tenantId: TenantId, items: Pick<ItemPedido, 'productId' | 'quantity'>[]): Promise<Result<boolean>>;
  descontarIngredientes(tenantId: TenantId, items: Pick<ItemPedido, 'productId' | 'quantity'>[]): Promise<Result<void>>;
}
