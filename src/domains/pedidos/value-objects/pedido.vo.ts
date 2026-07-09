export enum EstadoPedido {
  PENDING = 'pending',
  IN_KITCHEN = 'in_kitchen',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TipoPedido {
  DINE_IN = 'dine_in',
  TAKEOUT = 'takeout',
  DELIVERY = 'delivery',
}
