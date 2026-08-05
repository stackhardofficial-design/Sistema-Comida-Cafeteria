import { fmtMoney } from './supabase';

/**
 * Inserta un iframe invisible en el DOM, escribe el contenido HTML proporcionado
 * y lanza el diálogo de impresión de forma programática.
 */
function printHtmlContent(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-1000px';
  iframe.style.bottom = '-1000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Esperar un momento a que renderice y luego imprimir
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Remover iframe despues de imprimir
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
}

  // Determinar ancho basado en configuración local
  const widthStr = localStorage.getItem('printer_width') || '58mm';
  
const TICKET_STYLES = `
  <style>
    @page { margin: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 10px;
      width: ${widthStr};
      color: #000;
      font-size: 12px;
      position: relative;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 32px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.08);
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .header p {
      margin: 2px 0;
      font-size: 11px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      align-items: flex-start;
    }
    .item-name {
      flex: 1;
      padding-right: 5px;
      font-weight: bold;
    }
    .item-qty {
      font-weight: bold;
      margin-right: 5px;
    }
    .item-notes {
      font-size: 10px;
      font-style: italic;
      margin-left: 15px;
      margin-bottom: 6px;
      display: block;
    }
    .totals {
      margin-top: 10px;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .totals-row.grand {
      font-size: 16px;
      font-weight: bold;
      margin-top: 5px;
      border-top: 1px dashed #000;
      padding-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 10px;
    }
    .ticket-type {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      padding: 4px;
      border: 1px solid #000;
      border-radius: 4px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
  </style>
`;

export function printKitchenTicket(orderData, items) {
  const isMesa = orderData.type === 'mesa';
  const isDelivery = orderData.type === 'delivery';
  
  let orderInfo = '';
  if (isMesa) {
    orderInfo = `<p>MESA: <strong>${orderData.tableName || 'N/A'}</strong></p>`;
  } else if (isDelivery) {
    orderInfo = `<p>DELIVERY: <strong>${orderData.customerName || 'N/A'}</strong></p>`;
  } else {
    orderInfo = `<p>MOSTRADOR: <strong>${orderData.customerName || 'Final'}</strong></p>`;
  }

  let itemsHtml = items.map(i => {
    let html = `
      <div class="item-row">
        <span class="item-qty">${i.qty}x</span>
        <span class="item-name">${i.product?.name || 'Producto'}</span>
      </div>
    `;
    if (i.notes) {
      html += `<span class="item-notes">NOTA: ${i.notes}</span>`;
    }
    return html;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${TICKET_STYLES}
      </head>
      <body>
        <div class="watermark">STACK HARD</div>
        <div class="header">
          <div class="ticket-type">COMANDA - COCINA</div>
          <h2>Pedido #${(orderData.orderId || '').toString().slice(-4).toUpperCase()}</h2>
          <p>Fecha: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
          ${orderInfo}
        </div>
        <div class="divider"></div>
        <div class="items">
          ${itemsHtml}
        </div>
        <div class="divider"></div>
        <div class="footer">
          <p>Preparar lo antes posible</p>
        </div>
      </body>
    </html>
  `;

  printHtmlContent(html);
}

export function printChargeTicket(orderData, items, totals, payments) {
  const isMesa = orderData.type === 'mesa';
  const isDelivery = orderData.type === 'delivery';
  
  let orderInfo = '';
  if (isMesa) {
    orderInfo = `<p>Mesa: ${orderData.tableName || 'N/A'}</p>`;
  } else if (isDelivery) {
    orderInfo = `<p>Delivery: ${orderData.customerName || 'N/A'}</p>`;
  } else {
    orderInfo = `<p>Cliente: ${orderData.customerName || 'Consumidor Final'}</p>`;
  }

  let itemsHtml = items.map(i => {
    const totalItem = (i.product?.price || 0) * i.qty;
    return `
      <div class="item-row">
        <span class="item-qty">${i.qty}x</span>
        <span class="item-name">${i.product?.name || 'Producto'}</span>
        <span>${fmtMoney(totalItem)}</span>
      </div>
    `;
  }).join('');

  let discountHtml = '';
  if (totals.discountAmount > 0) {
    discountHtml = `
      <div class="totals-row">
        <span>Descuento:</span>
        <span>-${fmtMoney(totals.discountAmount)}</span>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${TICKET_STYLES}
      </head>
      <body>
        <div class="watermark">STACK HARD</div>
        <div class="header">
          <h1>STACK HARD</h1>
          <p>Comprobante de Venta</p>
          <div class="divider"></div>
          <p>Pedido #${(orderData.orderId || '').toString().slice(-4).toUpperCase()}</p>
          <p>Fecha: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
          ${orderInfo}
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${fmtMoney(totals.subtotal)}</span>
          </div>
          ${discountHtml}
          <div class="totals-row grand">
            <span>TOTAL:</span>
            <span>${fmtMoney(totals.grandTotal)}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p style="font-size: 9px; margin-top: 10px; color: #555;">Software por Stack Hard</p>
        </div>
      </body>
    </html>
  `;

  printHtmlContent(html);
}

export function printTestTicket() {
  const widthStr = localStorage.getItem('printer_width') || '58mm';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 10px;
            width: ${widthStr};
            color: #000;
            font-size: 12px;
            position: relative;
            text-align: center;
          }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <h1 style="margin:0; font-size: 18px; text-transform: uppercase;">STACK HARD</h1>
        <p>TICKET DE PRUEBA</p>
        <div class="divider"></div>
        <p>Configuración actual:</p>
        <p><strong>Ancho:</strong> ${widthStr}</p>
        <p><strong>Impresión Auto:</strong> ${localStorage.getItem('printer_enabled') === 'true' ? 'Activada' : 'Desactivada'}</p>
        <div class="divider"></div>
        <p>Si este ticket se imprimió correctamente, tu impresora está lista para funcionar.</p>
        <p>Asegúrate de marcarla como "Predeterminada" en Windows.</p>
        <br/><br/>
      </body>
    </html>
  `;

  printHtmlContent(html);
}
