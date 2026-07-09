import { Result } from '../../../shared/result';
import { Pedido } from '../entities/pedido.entity';
import { IPedidoRepository, IInventarioPort } from '../ports/pedido.repository.port';
import { TenantId, UserId } from '../../../shared/types/common.types';
import { EstadoPedido, TipoPedido } from '../value-objects/pedido.vo';
import { InsufficientInventoryError } from '../../../shared/errors/domain.errors';

export interface CrearPedidoCommand {
  tenantId: TenantId;
  userId?: UserId;
  tableId?: string;
  orderType: TipoPedido;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    modifiers: {
      modifierId: string;
      priceAdjustment: number;
    }[];
  }[];
}

export class CrearPedidoUseCase {
  constructor(
    private readonly pedidoRepo: IPedidoRepository,
    private readonly inventarioPort: IInventarioPort
  ) {}

  async ejecutar(comando: CrearPedidoCommand): Promise<Result<Pedido>> {
    // 1. Calculate totals
    let totalAmount = 0;
    const items = comando.items.map(item => {
      let itemTotal = item.unitPrice * item.quantity;
      let modifiersTotal = item.modifiers.reduce((acc, mod) => acc + mod.priceAdjustment, 0);
      itemTotal += (modifiersTotal * item.quantity);
      totalAmount += itemTotal;

      return {
        ...item,
        id: '', // Will be set by DB
        orderId: '', // Will be set by DB
        tenantId: comando.tenantId,
        totalPrice: itemTotal
      };
    });

    // 2. Check inventory availability
    const inventoryCheck = await this.inventarioPort.verificarDisponibilidad(comando.tenantId, items);
    
    if (inventoryCheck.isFailure) {
      return Result.fail(inventoryCheck.error);
    }
    
    if (!inventoryCheck.value) {
      return Result.fail(new InsufficientInventoryError('No hay suficiente inventario para uno o más productos'));
    }

    // 3. Create the order
    const orderToCreate = {
      tenantId: comando.tenantId,
      userId: comando.userId,
      tableId: comando.tableId,
      status: EstadoPedido.PENDING,
      orderType: comando.orderType,
      totalAmount,
      items: items.map(item => ({
        ...item,
        modifiers: item.modifiers.map(mod => ({
          ...mod,
          id: '',
          orderItemId: '',
          tenantId: comando.tenantId
        }))
      }))
    };

    const pedidoResult = await this.pedidoRepo.crear(orderToCreate);

    if (pedidoResult.isFailure) {
      return Result.fail(pedidoResult.error);
    }

    // 4. Deduct inventory (Fire and forget, or awaited depending on consistency requirements)
    // For ACID, this should ideally be in the same DB transaction as crear(), 
    // handled by the Adapter implementation of `crear`, but we model it here explicitly 
    // or assume the adapter handles the transaction if they share a unit of work.
    const deductResult = await this.inventarioPort.descontarIngredientes(comando.tenantId, items);
    
    if (deductResult.isFailure) {
       // Ideally trigger compensation logic here if not using a DB transaction
       console.error("Failed to deduct inventory", deductResult.error);
    }

    return Result.ok(pedidoResult.value);
  }
}
