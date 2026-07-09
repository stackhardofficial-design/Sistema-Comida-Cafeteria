import { IPedidoRepository } from '../../domains/pedidos/ports/pedido.repository.port';
import { Pedido } from '../../domains/pedidos/entities/pedido.entity';
import { TenantId } from '../../shared/types/common.types';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/errors/domain.errors';
import { supabase } from './client';

export class SupabasePedidoRepository implements IPedidoRepository {
  
  async crear(pedido: Omit<Pedido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Pedido>> {
    try {
      // Usamos el RPC de Supabase si queremos hacer esto en una transacción ACID,
      // o insertamos directamente si gestionamos los items en serie.
      // Aquí hacemos una inserción simple como ejemplo de adaptador.
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: pedido.tenantId,
          user_id: pedido.userId,
          table_id: pedido.tableId,
          status: pedido.status,
          order_type: pedido.orderType,
          total_amount: pedido.totalAmount
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // In a real production app, we would use a Postgres function (RPC) 
      // to insert the order and items atomically and deduct inventory.
      
      const orderItems = pedido.items.map((item: any) => ({
        tenant_id: pedido.tenantId,
        order_id: orderData.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      return Result.ok({
        ...pedido,
        id: orderData.id,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.updated_at)
      } as Pedido);

    } catch (error: any) {
      return Result.fail(new DomainError(`Error creando pedido: ${error.message}`, 'DB_ERROR'));
    }
  }

  async obtenerPorId(tenantId: TenantId, id: string): Promise<Result<Pedido>> {
    // Implementación...
    return Result.fail(new DomainError("Not implemented yet", "NOT_IMPLEMENTED"));
  }

  async actualizarEstado(tenantId: TenantId, id: string, estado: string): Promise<Result<Pedido>> {
     // Implementación...
     return Result.fail(new DomainError("Not implemented yet", "NOT_IMPLEMENTED"));
  }
}
