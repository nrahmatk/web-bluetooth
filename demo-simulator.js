/**
 * Demo Simulator untuk Thermal Printer
 * Mensimulasikan printing tanpa memerlukan printer fisik
 */

// Global variables
let escpos = null;
const printPreview = document.getElementById('printPreview');
let printBuffer = '';

// DOM Elements - same as main app
const logArea = document.getElementById('logArea');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const printTextBtn = document.getElementById('printTextBtn');
const printReceiptBtn = document.getElementById('printReceiptBtn');
const addItemBtn = document.getElementById('addItemBtn');
const itemsList = document.getElementById('itemsList');
const testBasicBtn = document.getElementById('testBasicBtn');
const testAlignBtn = document.getElementById('testAlignBtn');
const testSizeBtn = document.getElementById('testSizeBtn');
const testBarcodBtn = document.getElementById('testBarcodBtn');
const cutPaperBtn = document.getElementById('cutPaperBtn');
const clearLogBtn = document.getElementById('clearLogBtn');

/**
 * Initialize demo application
 */
document.addEventListener('DOMContentLoaded', function() {
    escpos = new ESCPOSCommands();
    setupEventListeners();
    log('Demo mode aktif - simulator thermal printer siap!', 'success');
    
    // Update total on load
    updateReceiptTotal();
});

/**
 * Setup event listeners (same as main app)
 */
function setupEventListeners() {
    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Text printing
    printTextBtn.addEventListener('click', simulatePrintText);
    
    // Receipt printing
    printReceiptBtn.addEventListener('click', simulatePrintReceipt);
    addItemBtn.addEventListener('click', addReceiptItem);
    
    // Test functions
    testBasicBtn.addEventListener('click', simulateTestBasic);
    testAlignBtn.addEventListener('click', simulateTestAlignment);
    testSizeBtn.addEventListener('click', simulateTestSizes);
    testBarcodBtn.addEventListener('click', simulateTestBarcode);
    cutPaperBtn.addEventListener('click', simulateCutPaper);
    
    // Log
    clearLogBtn.addEventListener('click', clearLog);
    
    // Remove item buttons
    itemsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove') || e.target.closest('.btn-remove')) {
            e.target.closest('.item-row').remove();
            updateReceiptTotal();
        }
    });
    
    // Update total when inputs change
    itemsList.addEventListener('input', updateReceiptTotal);
}

/**
 * Switch tabs (same as main app)
 */
function switchTab(tabName) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

/**
 * Simulate text printing
 */
function simulatePrintText() {
    const text = document.getElementById('textToPrint').value.trim();
    if (!text) {
        showMessage('Masukkan teks yang akan dicetak', 'error');
        return;
    }
    
    const align = document.getElementById('textAlign').value;
    const size = document.getElementById('textSize').value;
    
    showLoading(printTextBtn);
    
    setTimeout(() => {
        clearPreview();
        addToPreview('=== HASIL SIMULASI PRINT TEKS ===\n');
        addToPreview(`Alignment: ${align}, Size: ${size}\n`);
        addToPreview('================================\n\n');
        
        const lines = text.split('\n');
        lines.forEach(line => {
            addFormattedLine(line, align, size);
        });
        
        addToPreview('\n\n[KERTAS DIPOTONG]\n');
        addToPreview('================================');
        
        hideLoading(printTextBtn);
        showMessage('Simulasi print teks selesai!', 'success');
        log(`Simulasi print: ${text.substring(0, 50)}...`);
    }, 1000);
}

/**
 * Simulate receipt printing
 */
function simulatePrintReceipt() {
    const storeName = document.getElementById('storeName').value.trim();
    const storeAddress = document.getElementById('storeAddress').value.trim();
    const cashier = document.getElementById('cashier').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    
    const items = getReceiptItems();
    
    if (!storeName || items.length === 0) {
        showMessage('Lengkapi data toko dan minimal 1 item', 'error');
        return;
    }
    
    const total = calculateTotal(items);
    
    if (paymentAmount < total) {
        showMessage('Jumlah bayar tidak mencukupi', 'error');
        return;
    }
    
    showLoading(printReceiptBtn);
    
    setTimeout(() => {
        clearPreview();
        
        // Header
        addFormattedLine(storeName, 'center', 'tall');
        addFormattedLine(storeAddress, 'center', 'normal');
        addToPreview('================================\n');
        addToPreview(`Tanggal: ${escpos.formatDateTime()}\n`);
        addToPreview(`Kasir: ${cashier}\n`);
        addToPreview('--------------------------------\n');
        
        // Items
        items.forEach(item => {
            addToPreview(`${item.name}\n`);
            const qtyPrice = `${item.qty} x ${escpos.formatCurrency(item.price)}`;
            const subtotal = escpos.formatCurrency(item.qty * item.price);
            addTwoColumnLine(qtyPrice, subtotal);
        });
        
        // Footer
        addToPreview('--------------------------------\n');
        addTwoColumnLine('TOTAL:', escpos.formatCurrency(total));
        addTwoColumnLine(`${paymentMethod}:`, escpos.formatCurrency(paymentAmount));
        
        const change = paymentAmount - total;
        if (change > 0) {
            addTwoColumnLine('KEMBALIAN:', escpos.formatCurrency(change));
        }
        
        addToPreview('================================\n');
        addFormattedLine('TERIMA KASIH', 'center', 'normal');
        addFormattedLine('SELAMAT BERBELANJA', 'center', 'normal');
        addToPreview('\n\n[KERTAS DIPOTONG]\n');
        
        hideLoading(printReceiptBtn);
        showMessage('Simulasi print struk selesai!', 'success');
        log(`Simulasi struk - Total: ${escpos.formatCurrency(total)}`);
    }, 1500);
}

/**
 * Simulate test functions
 */
function simulateTestBasic() {
    clearPreview();
    addToPreview('=== TEST BASIC PRINT ===\n\n');
    addFormattedLine('TEST BASIC PRINT', 'center', 'normal');
    addToPreview('Printer: EPSON EP5821\n');
    addToPreview('Lebar: 58mm\n');
    addToPreview(`Tanggal: ${escpos.formatDateTime()}\n`);
    addToPreview('================================\n');
    addFormattedLine('Test berhasil!', 'center', 'normal');
    addToPreview('\n[KERTAS DIPOTONG]\n');
    showMessage('Test basic print berhasil!', 'success');
}

function simulateTestAlignment() {
    clearPreview();
    addToPreview('=== TEST ALIGNMENT ===\n\n');
    addFormattedLine('TEST ALIGNMENT', 'center', 'normal');
    addToPreview('--------------------------------\n');
    addFormattedLine('Kiri', 'left', 'normal');
    addFormattedLine('Tengah', 'center', 'normal');
    addFormattedLine('Kanan', 'right', 'normal');
    addToPreview('\n[KERTAS DIPOTONG]\n');
    showMessage('Test alignment berhasil!', 'success');
}

function simulateTestSizes() {
    clearPreview();
    addToPreview('=== TEST UKURAN TEKS ===\n\n');
    addFormattedLine('TEST UKURAN TEKS', 'center', 'normal');
    addToPreview('--------------------------------\n');
    addFormattedLine('Normal', 'left', 'normal');
    addFormattedLine('Double', 'left', 'double');
    addFormattedLine('Lebar', 'left', 'wide');
    addFormattedLine('Tinggi', 'left', 'tall');
    addToPreview('\n[KERTAS DIPOTONG]\n');
    showMessage('Test ukuran teks berhasil!', 'success');
}

function simulateTestBarcode() {
    clearPreview();
    addToPreview('=== TEST BARCODE ===\n\n');
    addFormattedLine('TEST BARCODE', 'center', 'normal');
    addToPreview('--------------------------------\n');
    addToPreview('   |||  || |||| ||| ||  |||\n');
    addToPreview('   |||  || |||| ||| ||  |||\n');
    addToPreview('   123456789012\n');
    addToPreview('\n[KERTAS DIPOTONG]\n');
    showMessage('Test barcode berhasil!', 'success');
}

function simulateCutPaper() {
    addToPreview('\n[KERTAS DIPOTONG]\n');
    showMessage('Simulasi potong kertas!', 'success');
}

/**
 * Helper functions for formatting
 */
function clearPreview() {
    printPreview.textContent = '';
}

function addToPreview(text) {
    printPreview.textContent += text;
    printPreview.scrollTop = printPreview.scrollHeight;
}

function addFormattedLine(text, align = 'left', size = 'normal') {
    const maxWidth = 32;
    let formattedText = text;
    
    // Apply size formatting
    if (size === 'double' || size === 'tall') {
        formattedText = `**${text}**`;
    } else if (size === 'wide') {
        formattedText = `*${text}*`;
    }
    
    // Apply alignment
    if (align === 'center') {
        const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
        formattedText = ' '.repeat(padding) + formattedText;
    } else if (align === 'right') {
        const padding = Math.max(0, maxWidth - text.length);
        formattedText = ' '.repeat(padding) + formattedText;
    }
    
    addToPreview(formattedText + '\n');
}

function addTwoColumnLine(left, right) {
    const maxWidth = 32;
    const leftWidth = Math.floor(maxWidth * 0.6);
    const rightWidth = maxWidth - leftWidth;
    
    let leftText = left.substring(0, leftWidth).padEnd(leftWidth);
    let rightText = right.substring(0, rightWidth).padStart(rightWidth);
    
    addToPreview(leftText + rightText + '\n');
}

/**
 * Receipt helper functions (same as main app)
 */
function getReceiptItems() {
    const items = [];
    const itemRows = itemsList.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const qty = parseInt(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        
        if (name && qty > 0 && price > 0) {
            items.push({ name, qty, price });
        }
    });
    
    return items;
}

function calculateTotal(items) {
    return items.reduce((total, item) => total + (item.qty * item.price), 0);
}

function updateReceiptTotal() {
    const items = getReceiptItems();
    const total = calculateTotal(items);
    
    const paymentAmountInput = document.getElementById('paymentAmount');
    paymentAmountInput.placeholder = escpos.formatCurrency(total);
    
    if (!paymentAmountInput.value) {
        paymentAmountInput.value = total;
    }
}

function addReceiptItem() {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <input type="text" class="item-name" placeholder="Nama item">
        <input type="number" class="item-qty" placeholder="Qty" value="1" min="1">
        <input type="number" class="item-price" placeholder="Harga" value="0" min="0">
        <button class="btn-remove"><i class="fas fa-trash"></i></button>
    `;
    
    itemsList.appendChild(itemRow);
    itemRow.querySelector('.item-name').focus();
}

/**
 * UI helper functions (same as main app)
 */
function showLoading(button) {
    button.disabled = true;
    button.classList.add('loading');
}

function hideLoading(button) {
    button.disabled = false;
    button.classList.remove('loading');
}

function showMessage(message, type = 'info') {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    const connectionSection = document.querySelector('.connection-section');
    connectionSection.insertAdjacentElement('afterend', messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    logArea.textContent += logMessage;
    logArea.scrollTop = logArea.scrollHeight;
}

function clearLog() {
    logArea.textContent = '';
    log('Log dibersihkan');
}
