export interface WhatsAppOrder {
  customerName: string;
  deliveryType: 'shipping' | 'pickup';
  address?: string | null;
  total: number;
}
export interface WhatsAppItem {
  qty: number;
  productName: string;
  variantValue?: string | null;
}

export function makeWhatsappMessage(order: WhatsAppOrder, items: WhatsAppItem[]): string {
  const delivery = order.deliveryType === 'pickup'
    ? 'Retiro'
    : `Envío${order.address ? ` — ${order.address}` : ''}`;
  const amount = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(order.total);
  return [
    'Nombre:', order.customerName, '',
    'Entrega:', delivery, '',
    'Pedido:',
    ...items.map(item => `${item.qty}x ${item.productName}${item.variantValue ? ` — ${item.variantValue}` : ''}`),
    '', 'Total:', amount,
  ].join('\n');
}
