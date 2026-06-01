// ============================================
// KasirKu POS - All-in-One Google Apps Script
// ============================================
// Setup:
// 1. Buka sheets.new → kasih nama "KasirKu"
// 2. Extensions → Apps Script
// 3. Hapus semua kode, paste kode ini
// 4. Klik Save (💾)
// 5. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy URL → buka di HP/PC
// ============================================

// SERVE HTML
function doGet(e) {
  const page = e.parameter.page || 'pos';
  
  if (page === 'pos') {
    return HtmlService.createHtmlOutput(getHTML())
      .setTitle('KasirKu POS')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
  
  if (page === 'api') {
    const action = e.parameter.action;
    if (action === 'getMenu') return jsonResponse(getMenu());
    if (action === 'getOrders') return jsonResponse(getOrders(e.parameter.date));
    if (action === 'getReport') return jsonResponse(getReport(e.parameter.date));
    return jsonResponse({ status: 'ok' });
  }
  
  return HtmlService.createHtmlOutput(getHTML())
    .setTitle('KasirKu POS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addOrder') return jsonResponse(addOrder(data.order));
    if (data.action === 'updateStatus') return jsonResponse(updateOrderStatus(data.orderId, data.status));
    if (data.action === 'addMenu') return jsonResponse(addMenuItem(data.item));
    if (data.action === 'updateMenu') return jsonResponse(updateMenuItem(data.item));
    if (data.action === 'deleteMenu') return jsonResponse(deleteMenuItem(data.id));
    
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// MENU FUNCTIONS
// ============================================

function getMenu() {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    initDefaultMenu(sheet);
    return getMenu();
  }
  
  return data.slice(1).map(row => ({
    id: Number(row[0]),
    name: row[1],
    emoji: row[2],
    price: Number(row[3]),
    category: row[4],
    stock: Number(row[5]),
    active: row[6] === true || row[6] === 'TRUE'
  })).filter(item => item.active);
}

function initDefaultMenu(sheet) {
  const defaults = [
    [1, 'Nasi Goreng', '🍚', 15000, 'Makanan', 99, true],
    [2, 'Mie Ayam', '🍜', 13000, 'Makanan', 99, true],
    [3, 'Bakso', '🧆', 12000, 'Makanan', 99, true],
    [4, 'Soto Ayam', '🍲', 14000, 'Makanan', 99, true],
    [5, 'Nasi Campur', '🍱', 18000, 'Makanan', 99, true],
    [6, 'Ayam Geprek', '🍗', 16000, 'Makanan', 99, true],
    [7, 'Gado-gado', '🥗', 12000, 'Makanan', 99, true],
    [8, 'Sate Ayam', '🍢', 15000, 'Makanan', 99, true],
    [9, 'Es Teh', '🧊', 5000, 'Minuman', 99, true],
    [10, 'Es Jeruk', '🍊', 6000, 'Minuman', 99, true],
    [11, 'Kopi Hitam', '☕', 8000, 'Minuman', 99, true],
    [12, 'Kopi Susu', '🥛', 10000, 'Minuman', 99, true],
    [13, 'Air Mineral', '💧', 3000, 'Minuman', 99, true],
    [14, 'Jus Alpukat', '🥑', 12000, 'Minuman', 99, true],
    [15, 'Roti Bakar', '🍞', 8000, 'Snack', 99, true],
    [16, 'Pisang Goreng', '🍌', 5000, 'Snack', 99, true],
    [17, 'Martabak Mini', '🥞', 10000, 'Snack', 99, true],
    [18, 'Tahu Crispy', '🧈', 7000, 'Snack', 99, true],
  ];
  defaults.forEach(row => sheet.appendRow(row));
}

function addMenuItem(item) {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  const newId = data.length > 0 ? Math.max(...data.slice(1).map(r => Number(r[0]))) + 1 : 1;
  sheet.appendRow([newId, item.name, item.emoji, item.price, item.category, item.stock || 99, true]);
  return { success: true, id: newId };
}

function updateMenuItem(item) {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === item.id) {
      sheet.getRange(i + 1, 2).setValue(item.name);
      sheet.getRange(i + 1, 3).setValue(item.emoji);
      sheet.getRange(i + 1, 4).setValue(item.price);
      sheet.getRange(i + 1, 5).setValue(item.category);
      sheet.getRange(i + 1, 6).setValue(item.stock);
      return { success: true };
    }
  }
  return { success: false, error: 'Item not found' };
}

function deleteMenuItem(id) {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === id) {
      sheet.getRange(i + 1, 7).setValue(false); // Soft delete
      return { success: true };
    }
  }
  return { success: false, error: 'Item not found' };
}

// ============================================
// ORDER FUNCTIONS
// ============================================

function addOrder(order) {
  const sheet = getOrCreateSheet('Orders');
  const itemsStr = order.items.map(i => `${i.emoji}${i.name}x${i.qty}`).join(', ');
  
  sheet.appendRow([
    order.id,
    new Date(order.time),
    order.type,
    order.table || '-',
    order.note || '',
    itemsStr,
    order.total,
    order.paid,
    order.change,
    order.status || 'pending',
    new Date().toLocaleString('id-ID')
  ]);
  
  updateStock(order.items);
  return { success: true, orderId: order.id };
}

function getOrders(date) {
  const sheet = getOrCreateSheet('Orders');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const today = date || new Date().toISOString().split('T')[0];
  
  return data.slice(1)
    .filter(row => {
      try {
        const rowDate = new Date(row[1]).toISOString().split('T')[0];
        return rowDate === today;
      } catch(e) { return false; }
    })
    .map(row => ({
      id: row[0],
      time: new Date(row[1]).toISOString(),
      type: row[2],
      table: row[3],
      note: row[4],
      itemsStr: row[5],
      total: Number(row[6]),
      paid: Number(row[7]),
      change: Number(row[8]),
      status: row[9]
    }))
    .reverse();
}

function updateOrderStatus(orderId, status) {
  const sheet = getOrCreateSheet('Orders');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      sheet.getRange(i + 1, 10).setValue(status);
      return { success: true };
    }
  }
  return { success: false, error: 'Order not found' };
}

// ============================================
// REPORT FUNCTIONS
// ============================================

function getReport(date) {
  const orders = getOrders(date);
  const completed = orders.filter(o => o.status !== 'cancelled');
  
  const totalIncome = completed.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = completed.length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  
  return {
    date: date || new Date().toISOString().split('T')[0],
    totalIncome,
    totalOrders,
    cancelledOrders,
    avgOrder: totalOrders > 0 ? Math.round(totalIncome / totalOrders) : 0,
    orders: completed.slice(0, 20)
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Menu') {
      sheet.appendRow(['ID', 'Nama', 'Emoji', 'Harga', 'Kategori', 'Stok', 'Aktif']);
    }
    if (name === 'Orders') {
      sheet.appendRow(['Order ID', 'Waktu', 'Tipe', 'Meja', 'Catatan', 'Items', 'Total', 'Dibayar', 'Kembalian', 'Status', 'Waktu Input']);
    }
    formatHeader(sheet);
  }
  
  return sheet;
}

function formatHeader(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setFontWeight('bold');
  header.setBackground('#1e40af');
  header.setFontColor('white');
  sheet.setFrozenRows(1);
}

function updateStock(items) {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  
  items.forEach(item => {
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === item.id) {
        const currentStock = Number(data[i][5]);
        const newStock = Math.max(0, currentStock - item.qty);
        sheet.getRange(i + 1, 6).setValue(newStock);
        break;
      }
    }
  });
}

// ============================================
// HTML/CSS/JS - FRONTEND
// ============================================

function getHTML() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>KasirKu POS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; color: #333; overflow-x: hidden; }
        
        /* Header */
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { font-size: 18px; display: flex; align-items: center; gap: 8px; }
        .header .info { font-size: 11px; opacity: 0.9; }
        .header .btn-report { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 14px; border-radius: 8px; font-size: 12px; cursor: pointer; font-weight: 500; }
        
        /* Tabs */
        .tabs { display: flex; background: white; border-bottom: 1px solid #e5e7eb; }
        .tab { flex: 1; padding: 12px; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; text-align: center; border-bottom: 2px solid transparent; }
        .tab.active { color: #1e40af; border-bottom-color: #1e40af; background: #f8fafc; }
        
        /* Order Type */
        .order-type { display: flex; gap: 8px; padding: 12px 15px; background: white; border-bottom: 1px solid #e5e7eb; }
        .type-btn { flex: 1; padding: 10px 8px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; font-size: 12px; cursor: pointer; background: white; transition: all 0.2s; }
        .type-btn.active { border-color: #1e40af; background: #eff6ff; color: #1e40af; font-weight: 600; }
        
        /* Main Layout */
        .main { display: flex; min-height: calc(100vh - 160px); }
        
        /* Menu Panel */
        .menu-panel { flex: 1; overflow-y: auto; padding: 10px; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
        .menu-item { background: white; border-radius: 12px; padding: 10px 8px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: all 0.2s; text-align: center; }
        .menu-item:active { transform: scale(0.95); }
        .menu-item .emoji { font-size: 28px; }
        .menu-item .name { font-size: 11px; font-weight: 600; margin-top: 4px; line-height: 1.2; }
        .menu-item .price { font-size: 11px; color: #1e40af; font-weight: bold; margin-top: 2px; }
        .menu-item .stock { font-size: 9px; color: #9ca3af; margin-top: 2px; }
        
        /* Category Filter */
        .category-filter { display: flex; gap: 6px; padding: 10px 15px; background: white; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
        .cat-btn { padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; cursor: pointer; white-space: nowrap; background: white; }
        .cat-btn.active { background: #1e40af; color: white; border-color: #1e40af; }
        
        /* Cart Panel */
        .cart-panel { width: 280px; background: white; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .cart-header { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .cart-header h3 { font-size: 14px; }
        .cart-header .clear { color: #ef4444; font-size: 12px; cursor: pointer; border: none; background: none; padding: 4px 8px; }
        .cart-items { flex: 1; overflow-y: auto; padding: 10px; max-height: 300px; }
        .cart-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .cart-item .info { flex: 1; }
        .cart-item .info .name { font-size: 12px; font-weight: 500; }
        .cart-item .info .price { font-size: 10px; color: #6b7280; }
        .cart-item .qty { display: flex; align-items: center; gap: 6px; }
        .cart-item .qty button { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #d1d5db; background: white; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .cart-item .qty span { font-size: 13px; font-weight: 600; min-width: 18px; text-align: center; }
        .cart-item .subtotal { font-size: 12px; font-weight: 600; color: #1e40af; min-width: 60px; text-align: right; }
        .cart-empty { text-align: center; padding: 30px 15px; color: #9ca3af; }
        .cart-empty .icon { font-size: 36px; }
        .cart-empty p { font-size: 12px; margin-top: 8px; }
        
        /* Cart Footer */
        .cart-footer { border-top: 1px solid #e5e7eb; padding: 12px 15px; background: #f9fafb; }
        .cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .cart-total .label { font-size: 13px; color: #6b7280; }
        .cart-total .amount { font-size: 20px; font-weight: bold; color: #1e40af; }
        .cart-total .items { font-size: 10px; color: #9ca3af; }
        .btn-pay { width: 100%; padding: 14px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(30,64,175,0.3); }
        .btn-pay:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; }
        
        /* Table & Notes */
        .order-info { padding: 10px 15px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; flex-wrap: wrap; }
        .order-info label { font-size: 11px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
        .order-info input { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; }
        .order-info input.table { width: 50px; text-align: center; }
        .order-info input.note { flex: 1; min-width: 100px; }
        
        /* Orders Panel */
        .orders-panel { display: none; flex: 1; overflow-y: auto; padding: 10px; }
        .orders-panel.show { display: block; }
        .order-card { background: white; border-radius: 12px; padding: 12px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .order-id { font-weight: 600; font-size: 13px; }
        .order-badge { padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .badge-pending { background: #fef3c7; color: #d97706; }
        .badge-ready { background: #dcfce7; color: #16a34a; }
        .badge-done { background: #e0e7ff; color: #4f46e5; }
        .order-info-text { font-size: 11px; color: #6b7280; }
        .order-items-text { font-size: 11px; margin: 4px 0; color: #374151; }
        .order-total-text { font-size: 14px; font-weight: bold; color: #1e40af; }
        .order-actions { display: flex; gap: 6px; margin-top: 8px; }
        .order-actions button { flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .btn-ready { background: #16a34a; color: white; }
        .btn-done { background: #4f46e5; color: white; }
        .btn-cancel { background: #ef4444; color: white; }
        
        /* Payment Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: flex-end; z-index: 200; }
        .modal-overlay.show { display: flex; }
        .modal { background: white; border-radius: 20px 20px 0 0; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .modal-header { padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { font-size: 16px; }
        .modal-header .close { background: #f3f4f6; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .modal-body { padding: 20px; }
        
        /* Payment */
        .pay-summary { background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
        .pay-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
        .pay-row.total { font-size: 20px; font-weight: bold; color: #1e40af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px; }
        .pay-input { margin: 15px 0; }
        .pay-input label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 6px; }
        .pay-input input { width: 100%; padding: 14px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 22px; font-weight: bold; text-align: right; }
        .pay-input input:focus { outline: none; border-color: #1e40af; }
        .pay-quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
        .pay-quick button { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; cursor: pointer; font-size: 12px; font-weight: 500; }
        .pay-quick button:active { background: #f3f4f6; }
        .pay-change { background: #f0fdf4; border-radius: 12px; padding: 15px; margin: 15px 0; text-align: center; }
        .pay-change .label { font-size: 12px; color: #16a34a; }
        .pay-change .amount { font-size: 28px; font-weight: bold; color: #16a34a; }
        .btn-confirm { width: 100%; padding: 16px; background: #16a34a; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .btn-confirm:active { background: #15803d; }
        
        /* Report Modal */
        .report-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .stat-card { background: #f9fafb; border-radius: 12px; padding: 15px; text-align: center; }
        .stat-card .label { font-size: 11px; color: #6b7280; }
        .stat-card .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
        .stat-card.income .value { color: #16a34a; }
        .stat-card.orders .value { color: #1e40af; }
        
        /* Toast */
        .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 12px 24px; border-radius: 12px; font-size: 13px; display: none; z-index: 300; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        
        /* Loading */
        .loading { text-align: center; padding: 40px; color: #9ca3af; }
        .loading .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1e40af; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Mobile */
        @media (max-width: 768px) {
            .main { flex-direction: column; }
            .cart-panel { width: 100%; border-left: none; border-top: 2px solid #1e40af; position: sticky; bottom: 0; max-height: 50vh; }
            .menu-grid { grid-template-columns: repeat(3, 1fr); }
            .menu-item { padding: 8px 6px; }
            .menu-item .emoji { font-size: 24px; }
            .menu-item .name { font-size: 10px; }
            .modal { border-radius: 20px 20px 0 0; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div>
            <h1>🏪 KasirKu</h1>
            <div class="info" id="headerInfo">Loading...</div>
        </div>
        <button class="btn-report" onclick="showReport()">📊 Laporan</button>
    </div>
    
    <!-- Tabs -->
    <div class="tabs">
        <div class="tab active" onclick="showPanel('menu')">🍽️ Menu</div>
        <div class="tab" onclick="showPanel('orders')">📋 Pesanan <span id="orderCount">0</span></div>
    </div>
    
    <!-- Order Type -->
    <div class="order-type">
        <div class="type-btn active" onclick="setOrderType('dine_in', this)">🪑 Dine In</div>
        <div class="type-btn" onclick="setOrderType('take_away', this)">📦 Take Away</div>
        <div class="type-btn" onclick="setOrderType('delivery', this)">🛵 Delivery</div>
    </div>
    
    <!-- Category Filter -->
    <div class="category-filter" id="categoryFilter"></div>
    
    <!-- Main Content -->
    <div class="main">
        <!-- Menu Panel -->
        <div class="menu-panel" id="menuPanel">
            <div class="menu-grid" id="menuGrid">
                <div class="loading"><div class="spinner"></div>Memuat menu...</div>
            </div>
        </div>
        
        <!-- Orders Panel -->
        <div class="orders-panel" id="ordersPanel"></div>
        
        <!-- Cart Panel -->
        <div class="cart-panel" id="cartPanel">
            <div class="cart-header">
                <h3>🛒 Keranjang</h3>
                <button class="clear" onclick="clearCart()">🗑️ Hapus</button>
            </div>
            
            <div class="order-info">
                <label>🪑 Meja:</label>
                <input type="number" class="table" id="tableNum" placeholder="-" min="1" max="99">
                <label>📝</label>
                <input type="text" class="note" id="orderNote" placeholder="Catatan (Pedas, Tanpa es)">
            </div>
            
            <div class="cart-items" id="cartItems">
                <div class="cart-empty">
                    <div class="icon">🛒</div>
                    <p>Keranjang kosong</p>
                </div>
            </div>
            
            <div class="cart-footer">
                <div class="cart-total">
                    <div>
                        <div class="label">Total</div>
                        <div class="items" id="itemCount">0 item</div>
                    </div>
                    <div class="amount" id="cartTotal">Rp 0</div>
                </div>
                <button class="btn-pay" id="btnPay" onclick="showPayment()" disabled>💰 Bayar</button>
            </div>
        </div>
    </div>
    
    <!-- Payment Modal -->
    <div class="modal-overlay" id="paymentModal">
        <div class="modal">
            <div class="modal-header">
                <h3>💰 Pembayaran</h3>
                <button class="close" onclick="closeModal('paymentModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="pay-summary" id="paySummary"></div>
                <div class="pay-input">
                    <label>💵 Uang Diterima</label>
                    <input type="number" id="payAmount" placeholder="0" oninput="calcChange()">
                </div>
                <div class="pay-quick">
                    <button onclick="setPay(10000)">10rb</button>
                    <button onclick="setPay(20000)">20rb</button>
                    <button onclick="setPay(50000)">50rb</button>
                    <button onclick="setPay(100000)">100rb</button>
                    <button onclick="setPay(150000)">150rb</button>
                    <button onclick="setPayExact()">Uang Pas</button>
                </div>
                <div class="pay-change" id="payChange" style="display:none">
                    <div class="label">Kembalian</div>
                    <div class="amount" id="changeAmount">Rp 0</div>
                </div>
                <button class="btn-confirm" onclick="confirmPay()">✅ Konfirmasi Bayar</button>
            </div>
        </div>
    </div>
    
    <!-- Report Modal -->
    <div class="modal-overlay" id="reportModal">
        <div class="modal">
            <div class="modal-header">
                <h3>📊 Laporan Hari Ini</h3>
                <button class="close" onclick="closeModal('reportModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-stats" id="reportStats"></div>
                <h4 style="font-size:14px;margin:15px 0 10px">📋 Transaksi</h4>
                <div id="reportOrders"></div>
            </div>
        </div>
    </div>
    
    <!-- Toast -->
    <div class="toast" id="toast"></div>
    
    <script>
        // State
        let menuData = [];
        let cart = [];
        let orders = [];
        let orderType = 'dine_in';
        let currentFilter = 'Semua';
        let orderCounter = 1;
        
        // Init
        document.addEventListener('DOMContentLoaded', () => {
            updateHeaderDate();
            loadMenu();
            loadOrders();
        });
        
        // Update header date
        function updateHeaderDate() {
            const now = new Date();
            document.getElementById('headerInfo').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        // Load menu from Google Sheets
        function loadMenu() {
            google.script.run
                .withSuccessHandler(function(data) {
                    menuData = data;
                    renderCategories();
                    renderMenu();
                })
                .withFailureHandler(function(err) {
                    document.getElementById('menuGrid').innerHTML = '<div class="loading">Gagal memuat menu</div>';
                })
                .getMenu();
        }
        
        // Render categories
        function renderCategories() {
            const categories = ['Semua', ...new Set(menuData.map(m => m.category))];
            const container = document.getElementById('categoryFilter');
            container.innerHTML = categories.map(cat => 
                '<div class="cat-btn ' + (currentFilter === cat ? 'active' : '') + '" onclick="filterMenu(\\'' + cat + '\\')">' + cat + '</div>'
            ).join('');
        }
        
        // Filter menu
        function filterMenu(category) {
            currentFilter = category;
            renderCategories();
            renderMenu();
        }
        
        // Render menu grid
        function renderMenu() {
            const filtered = currentFilter === 'Semua' ? menuData : menuData.filter(m => m.category === currentFilter);
            const grid = document.getElementById('menuGrid');
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="loading">Menu kosong</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(item => 
                '<div class="menu-item" onclick="addToCart(' + item.id + ')">' +
                '<div class="emoji">' + item.emoji + '</div>' +
                '<div class="name">' + item.name + '</div>' +
                '<div class="price">Rp ' + item.price.toLocaleString('id-ID') + '</div>' +
                '<div class="stock">Stok: ' + item.stock + '</div>' +
                '</div>'
            ).join('');
        }
        
        // Set order type
        function setOrderType(type, btn) {
            orderType = type;
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        
        // Add to cart
        function addToCart(itemId) {
            const item = menuData.find(m => m.id === itemId);
            if (!item || item.stock <= 0) {
                showToast('❌ Stok habis!');
                return;
            }
            
            const existing = cart.find(c => c.id === itemId);
            if (existing) {
                if (existing.qty >= item.stock) {
                    showToast('❌ Stok tidak cukup!');
                    return;
                }
                existing.qty++;
            } else {
                cart.push({ ...item, qty: 1 });
            }
            
            renderCart();
        }
        
        // Render cart
        function renderCart() {
            const container = document.getElementById('cartItems');
            
            if (cart.length === 0) {
                container.innerHTML = '<div class="cart-empty"><div class="icon">🛒</div><p>Keranjang kosong</p></div>';
                document.getElementById('cartTotal').textContent = 'Rp 0';
                document.getElementById('itemCount').textContent = '0 item';
                document.getElementById('btnPay').disabled = true;
                return;
            }
            
            container.innerHTML = cart.map(item => 
                '<div class="cart-item">' +
                '<div class="info"><div class="name">' + item.emoji + ' ' + item.name + '</div>' +
                '<div class="price">Rp ' + item.price.toLocaleString('id-ID') + '</div></div>' +
                '<div class="qty">' +
                '<button onclick="changeQty(' + item.id + ', -1)">−</button>' +
                '<span>' + item.qty + '</span>' +
                '<button onclick="changeQty(' + item.id + ', 1)">+</button>' +
                '</div>' +
                '<div class="subtotal">Rp ' + (item.price * item.qty).toLocaleString('id-ID') + '</div>' +
                '</div>'
            ).join('');
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
            
            document.getElementById('cartTotal').textContent = 'Rp ' + total.toLocaleString('id-ID');
            document.getElementById('itemCount').textContent = itemCount + ' item';
            document.getElementById('btnPay').disabled = false;
        }
        
        // Change quantity
        function changeQty(itemId, delta) {
            const item = cart.find(c => c.id === itemId);
            if (!item) return;
            
            const menuItem = menuData.find(m => m.id === itemId);
            item.qty += delta;
            
            if (item.qty <= 0) {
                cart = cart.filter(c => c.id !== itemId);
            } else if (item.qty > menuItem.stock) {
                item.qty = menuItem.stock;
                showToast('❌ Maksimal stok!');
            }
            
            renderCart();
        }
        
        // Clear cart
        function clearCart() {
            if (cart.length === 0) return;
            if (confirm('Hapus semua item?')) {
                cart = [];
                renderCart();
            }
        }
        
        // Show payment modal
        function showPayment() {
            if (cart.length === 0) return;
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
            
            document.getElementById('paySummary').innerHTML = 
                '<div class="pay-row"><span>' + itemCount + ' item</span><span>Rp ' + total.toLocaleString('id-ID') + '</span></div>' +
                '<div class="pay-row total"><span>TOTAL</span><span>Rp ' + total.toLocaleString('id-ID') + '</span></div>';
            
            document.getElementById('payAmount').value = '';
            document.getElementById('payChange').style.display = 'none';
            document.getElementById('paymentModal').classList.add('show');
            document.getElementById('payAmount').focus();
        }
        
        // Set payment amount
        function setPay(amount) {
            document.getElementById('payAmount').value = amount;
            calcChange();
        }
        
        // Set exact payment
        function setPayExact() {
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            document.getElementById('payAmount').value = total;
            calcChange();
        }
        
        // Calculate change
        function calcChange() {
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const paid = Number(document.getElementById('payAmount').value) || 0;
            const change = paid - total;
            
            if (change >= 0 && paid > 0) {
                document.getElementById('payChange').style.display = 'block';
                document.getElementById('changeAmount').textContent = 'Rp ' + change.toLocaleString('id-ID');
            } else {
                document.getElementById('payChange').style.display = 'none';
            }
        }
        
        // Confirm payment
        function confirmPay() {
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const paid = Number(document.getElementById('payAmount').value) || 0;
            
            if (paid < total) {
                showToast('❌ Uang kurang!');
                return;
            }
            
            const orderId = 'ORD-' + String(orderCounter++).padStart(4, '0');
            const order = {
                id: orderId,
                type: orderType,
                table: document.getElementById('tableNum').value || '-',
                note: document.getElementById('orderNote').value || '',
                items: [...cart],
                total: total,
                paid: paid,
                change: paid - total,
                status: 'pending',
                time: new Date().toISOString()
            };
            
            // Save to Google Sheets
            google.script.run
                .withSuccessHandler(function(result) {
                    if (result.success) {
                        orders.unshift(order);
                        saveOrdersLocal();
                        
                        cart = [];
                        renderCart();
                        closeModal('paymentModal');
                        document.getElementById('tableNum').value = '';
                        document.getElementById('orderNote').value = '';
                        
                        showToast('✅ Pesanan ' + orderId + ' berhasil!');
                        updateOrderCount();
                    } else {
                        showToast('❌ Gagal: ' + result.error);
                    }
                })
                .withFailureHandler(function(err) {
                    showToast('❌ Error: ' + err.message);
                })
                .addOrder(order);
        }
        
        // Show panel
        function showPanel(panel) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            document.getElementById('menuPanel').style.display = panel === 'menu' ? 'block' : 'none';
            document.getElementById('cartPanel').style.display = panel === 'menu' ? 'flex' : 'none';
            document.getElementById('ordersPanel').classList.toggle('show', panel === 'orders');
            
            if (panel === 'orders') {
                loadOrdersFromSheet();
            }
        }
        
        // Load orders from sheet
        function loadOrdersFromSheet() {
            document.getElementById('ordersPanel').innerHTML = '<div class="loading"><div class="spinner"></div>Memuat pesanan...</div>';
            
            google.script.run
                .withSuccessHandler(function(data) {
                    orders = data;
                    saveOrdersLocal();
                    renderOrders();
                    updateOrderCount();
                })
                .withFailureHandler(function(err) {
                    renderOrders();
                })
                .getOrders();
        }
        
        // Render orders
        function renderOrders() {
            const container = document.getElementById('ordersPanel');
            
            if (orders.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af"><div style="font-size:40px">📋</div><p>Belum ada pesanan</p></div>';
                return;
            }
            
            container.innerHTML = orders.map(order => {
                let actions = '';
                if (order.status === 'pending') {
                    actions = '<button class="btn-ready" onclick="updateStatus(\\'' + order.id + '\\', \\'ready\\')">✅ Siap</button>';
                }
                if (order.status === 'ready') {
                    actions = '<button class="btn-done" onclick="updateStatus(\\'' + order.id + '\\', \\'done\\')">📦 Selesai</button>';
                }
                if (order.status !== 'done' && order.status !== 'cancelled') {
                    actions += '<button class="btn-cancel" onclick="updateStatus(\\'' + order.id + '\\', \\'cancelled\\')">❌ Batal</button>';
                }
                
                const typeEmoji = { dine_in: '🪑', take_away: '📦', delivery: '🛵' }[order.type] || '📋';
                const typeText = { dine_in: 'Dine In', take_away: 'Take Away', delivery: 'Delivery' }[order.type] || order.type;
                const statusBadge = '<span class="order-badge badge-' + order.status + '">' + getStatusText(order.status) + '</span>';
                
                return '<div class="order-card">' +
                    '<div class="order-header"><span class="order-id">' + order.id + '</span>' + statusBadge + '</div>' +
                    '<div class="order-info-text">' + typeEmoji + ' ' + typeText + (order.table !== '-' ? ' • Meja ' + order.table : '') + (order.note ? ' • ' + order.note : '') + '</div>' +
                    '<div class="order-items-text">' + order.itemsStr + '</div>' +
                    '<div class="order-total-text">Rp ' + order.total.toLocaleString('id-ID') + '</div>' +
                    '<div class="order-actions">' + actions + '</div>' +
                    '</div>';
            }).join('');
        }
        
        // Update order status
        function updateStatus(orderId, status) {
            google.script.run
                .withSuccessHandler(function(result) {
                    if (result.success) {
                        const order = orders.find(o => o.id === orderId);
                        if (order) order.status = status;
                        saveOrdersLocal();
                        renderOrders();
                        updateOrderCount();
                        showToast('✅ ' + orderId + ' → ' + getStatusText(status));
                    }
                })
                .withFailureHandler(function(err) {
                    showToast('❌ Gagal update');
                })
                .updateOrderStatus(orderId, status);
        }
        
        // Show report
        function showReport() {
            document.getElementById('reportModal').classList.add('show');
            document.getElementById('reportStats').innerHTML = '<div class="loading"><div class="spinner"></div>Memuat...</div>';
            
            google.script.run
                .withSuccessHandler(function(report) {
                    document.getElementById('reportStats').innerHTML = 
                        '<div class="stat-card income"><div class="label">Omzet</div><div class="value">Rp ' + report.totalIncome.toLocaleString('id-ID') + '</div></div>' +
                        '<div class="stat-card orders"><div class="label">Pesanan</div><div class="value">' + report.totalOrders + '</div></div>' +
                        '<div class="stat-card"><div class="label">Batal</div><div class="value">' + report.cancelledOrders + '</div></div>' +
                        '<div class="stat-card"><div class="label">Rata-rata</div><div class="value">Rp ' + report.avgOrder.toLocaleString('id-ID') + '</div></div>';
                    
                    document.getElementById('reportOrders').innerHTML = report.orders.length > 0 
                        ? report.orders.map(o => 
                            '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:12px">' +
                            '<div><div style="font-weight:600">' + o.id + '</div><div style="color:#9ca3af;font-size:10px">' + new Date(o.time).toLocaleTimeString('id-ID') + '</div></div>' +
                            '<div style="font-weight:600;color:#1e40af">Rp ' + o.total.toLocaleString('id-ID') + '</div></div>'
                          ).join('')
                        : '<p style="color:#9ca3af;text-align:center">Belum ada transaksi</p>';
                })
                .withFailureHandler(function(err) {
                    document.getElementById('reportStats').innerHTML = '<div class="loading">Gagal memuat</div>';
                })
                .getReport();
        }
        
        // Close modal
        function closeModal(id) {
            document.getElementById(id).classList.remove('show');
        }
        
        // Helpers
        function getStatusText(status) {
            return { pending: '⏳ Pending', ready: '✅ Siap', done: '📦 Selesai', cancelled: '❌ Batal' }[status] || status;
        }
        
        function updateOrderCount() {
            const pending = orders.filter(o => o.status === 'pending' || o.status === 'ready').length;
            document.getElementById('orderCount').textContent = pending;
        }
        
        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        }
        
        // Local storage backup
        function saveOrdersLocal() {
            try { localStorage.setItem('kasirku_orders', JSON.stringify(orders)); } catch(e) {}
        }
        
        function loadOrders() {
            try {
                const saved = localStorage.getItem('kasirku_orders');
                if (saved) orders = JSON.parse(saved);
                const counter = localStorage.getItem('kasirku_counter');
                if (counter) orderCounter = Number(counter);
            } catch(e) {}
            updateOrderCount();
        }
    </script>
</body>
</html>`;
}
