// Simple Dependency Injection Container for Phase 1
import { SupabasePedidoRepository } from '../../infrastructure/supabase/pedidos.repository';
import { IInventarioPort } from '../../domains/pedidos/ports/pedido.repository.port';
import { Result } from '../result';

// Mock inventory port for phase 1 until implemented
class MockInventarioPort implements IInventarioPort {
    async verificarDisponibilidad() { return Result.ok(true); }
    async descontarIngredientes() { return Result.ok(undefined); }
}

export const container = {
    pedidoRepository: new SupabasePedidoRepository(),
    inventarioPort: new MockInventarioPort(),
};
