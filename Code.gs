// ============================================
// KasirKu POS - Google Apps Script Backend
// ============================================
// Setup:
// 1. Buat Google Sheet baru → "KasirKu Data"
// 2. Extensions → Apps Script
// 3. Copy kode ini
// 4. Deploy → Web App (Execute as: Me, Who: Anyone)
// 5. Copy URL → paste ke index.html (API_URL)

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Handle GET request
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getMenu') {
    return jsonResponse(getMenu());
  }
  
  if (action === 'getOrders') {
    const date = e.parameter.date || new Date().toISOString().split('T')[0];
    return jsonResponse(getOrders(date));
  }
  
  if (action === 'getReport') {
    const date = e.parameter.date || new Date().toISOString().split('T')[0];
    return jsonResponse(getReport(date));
  }
  
  return jsonResponse({ status: 'ok', message: 'KasirKu POS API' });
}

// Handle POST request
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addOrder') {
      return jsonResponse(addOrder(data.order));
    }
    
    if (data.action === 'updateStatus') {
      return jsonResponse(updateOrderStatus(data.orderId, data.status));
    }
    
    if (data.action === 'addMenu') {
      return jsonResponse(addMenuItem(data.item));
    }
    
    if (data.action === 'updateMenu') {
      return jsonResponse(updateMenuItem(data.item));
    }
    
    return jsonResponse({ success: false, error: 'Unknown action' });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================
// MENU FUNCTIONS
// ============================================

function getMenu() {
  const sheet = getOrCreateSheet('Menu');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    // Initialize with default menu
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
    active: row[6] === 'TRUE'
  }));
}

function initDefaultMenu(sheet) {
  const defaults = [
    [1, 'Nasi Goreng', '🍚', 15000, 'Makanan', 99, true],
    [2, 'Mie Ayam', '🍜', 13000, 'Makanan', 99, true],
    [3, 'Bakso', '🧆', 12000, 'Makanan', 99, true],
    [4, 'Soto Ayam', '🍲', 14000, 'Makanan', 99, true],
    [5, 'Nasi Campur', '🍱', 18000, 'Makanan', 99, true],
    [6, 'Ayam Geprek', '🍗', 16000, 'Makanan', 99, true],
    [7, 'Es Teh', '🧊', 5000, 'Minuman', 99, true],
    [8, 'Es Jeruk', '🍊', 6000, 'Minuman', 99, true],
    [9, 'Kopi Hitam', '☕', 8000, 'Minuman', 99, true],
    [10, 'Kopi Susu', '🥛', 10000, 'Minuman', 99, true],
    [11, 'Air Mineral', '💧', 3000, 'Minuman', 99, true],
    [12, 'Roti Bakar', '🍞', 8000, 'Snack', 99, true],
    [13, 'Pisang Goreng', '🍌', 5000, 'Snack', 99, true],
    [14, 'Martabak Mini', '🥞', 10000, 'Snack', 99, true],
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

// ============================================
// ORDER FUNCTIONS
// ============================================

function addOrder(order) {
  const sheet = getOrCreateSheet('Orders');
  
  // Flatten items to string
  const itemsStr = order.items.map(i => `${i.emoji}${i.name}x${i.qty}`).join(', ');
  
  sheet.appendRow([
    order.id,
    new Date(order.time),
    order.type,
    order.table,
    order.note,
    itemsStr,
    order.total,
    order.paid,
    order.change,
    order.status,
    itemsStr // Duplicate for easy reading
  ]);
  
  // Update stock
  updateStock(order.items);
  
  return { success: true, orderId: order.id };
}

function getOrders(date) {
  const sheet = getOrCreateSheet('Orders');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  return data.slice(1)
    .filter(row => {
      const rowDate = new Date(row[1]).toISOString().split('T')[0];
      return rowDate === date;
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
    .reverse(); // Newest first
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
  
  // Count items
  const itemCounts = {};
  completed.forEach(o => {
    o.itemsStr.split(', ').forEach(item => {
      const match = item.match(/(.+)x(\d+)/);
      if (match) {
        const name = match[1];
        const qty = Number(match[2]);
        itemCounts[name] = (itemCounts[name] || 0) + qty;
      }
    });
  });
  
  // Top items
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));
  
  return {
    date,
    totalIncome,
    totalOrders,
    cancelledOrders,
    avgOrder: totalOrders > 0 ? Math.round(totalIncome / totalOrders) : 0,
    topItems,
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
      formatHeader(sheet);
    }
    
    if (name === 'Orders') {
      sheet.appendRow(['Order ID', 'Waktu', 'Tipe', 'Meja', 'Catatan', 'Items', 'Total', 'Dibayar', 'Kembalian', 'Status', 'Detail']);
      formatHeader(sheet);
    }
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

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
