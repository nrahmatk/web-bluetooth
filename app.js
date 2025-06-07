/**
 * Main Application Script
 * Menghubungkan UI dengan Bluetooth Printer dan ESC/POS Commands
 */

// Global variables
let printer = null;
let escpos = null;

// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const connectDebugBtn = document.getElementById("connectDebugBtn");
const connectionStatus = document.getElementById("connectionStatus");
const logArea = document.getElementById("logArea");

// Tab elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Text printing elements
const printTextBtn = document.getElementById("printTextBtn");
const textToPrint = document.getElementById("textToPrint");
const textAlign = document.getElementById("textAlign");
const textSize = document.getElementById("textSize");

// Receipt elements
const printReceiptBtn = document.getElementById("printReceiptBtn");
const addItemBtn = document.getElementById("addItemBtn");
const itemsList = document.getElementById("itemsList");

// Test elements
const testBasicBtn = document.getElementById("testBasicBtn");
const testAlignBtn = document.getElementById("testAlignBtn");
const testSizeBtn = document.getElementById("testSizeBtn");
const testBarcodBtn = document.getElementById("testBarcodBtn");
const cutPaperBtn = document.getElementById("cutPaperBtn");

// Log elements
const clearLogBtn = document.getElementById("clearLogBtn");

/**
 * Initialize application
 */
document.addEventListener("DOMContentLoaded", function () {
  // Initialize printer and ESC/POS
  printer = new BluetoothPrinter();
  escpos = new ESCPOSCommands();

  // Setup event listeners
  setupEventListeners();

  // Setup printer callbacks
  setupPrinterCallbacks();

  // Update UI
  updateConnectionStatus(false);

  log(
    "Aplikasi siap digunakan. Pastikan Bluetooth aktif dan printer dalam mode pairing.",
    "info"
  );
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Connection
  connectBtn.addEventListener("click", toggleConnection);
  connectDebugBtn.addEventListener("click", debugConnection);

  // Tabs
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Text printing
  printTextBtn.addEventListener("click", printText);

  // Receipt printing
  printReceiptBtn.addEventListener("click", printReceipt);
  addItemBtn.addEventListener("click", addReceiptItem);

  // Test functions
  testBasicBtn.addEventListener("click", testBasicPrint);
  testAlignBtn.addEventListener("click", testAlignment);
  testSizeBtn.addEventListener("click", testTextSizes);
  testBarcodBtn.addEventListener("click", testBarcode);
  cutPaperBtn.addEventListener("click", cutPaper);

  // Log
  clearLogBtn.addEventListener("click", clearLog);

  // Remove item buttons (delegated event)
  itemsList.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-remove") ||
      e.target.closest(".btn-remove")
    ) {
      e.target.closest(".item-row").remove();
      updateReceiptTotal();
    }
  });

  // Update total when inputs change
  itemsList.addEventListener("input", updateReceiptTotal);
}

/**
 * Setup printer callbacks
 */
function setupPrinterCallbacks() {
  printer.onConnectionChange = (connected) => {
    updateConnectionStatus(connected);
  };

  printer.onError = (error) => {
    log(`Error: ${error.message}`, "error");
    showMessage(`Error: ${error.message}`, "error");
  };

  printer.onLog = (message, type) => {
    log(message, type);
  };
}

/**
 * Toggle connection
 */
async function toggleConnection() {
  if (printer.isConnected) {
    await printer.disconnect();
  } else {
    showLoading(connectBtn);
    const connected = await printer.connect();
    hideLoading(connectBtn);

    if (connected) {
      showMessage("Berhasil terhubung ke printer!", "success");
    } else {
      showMessage("Gagal terhubung ke printer", "error");
    }
  }
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected) {
  if (connected) {
    connectionStatus.textContent = "Terhubung";
    connectionStatus.className = "status connected";
    connectBtn.innerHTML = '<i class="fas fa-bluetooth"></i> Putuskan Koneksi';
    connectBtn.className = "btn btn-warning";
  } else {
    connectionStatus.textContent = "Tidak terhubung";
    connectionStatus.className = "status disconnected";
    connectBtn.innerHTML = '<i class="fas fa-bluetooth"></i> Hubungkan Printer';
    connectBtn.className = "btn btn-primary";
  }
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  // Remove active class from all tabs
  tabBtns.forEach((btn) => btn.classList.remove("active"));
  tabContents.forEach((content) => content.classList.remove("active"));

  // Add active class to selected tab
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`${tabName}-tab`).classList.add("active");
}

/**
 * Print text
 */
async function printText() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  const text = textToPrint.value.trim();
  if (!text) {
    showMessage("Masukkan teks yang akan dicetak", "error");
    return;
  }

  showLoading(printTextBtn);

  try {
    const options = {
      align: textAlign.value,
      size: textSize.value,
    };

    // Send initialize command
    await printer.sendData(escpos.init());

    // Send text with formatting
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        await printer.sendData(escpos.printText(line, options));
      } else {
        await printer.sendData(escpos.feedLines(1));
      }
    }

    // Feed extra lines and cut
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());

    showMessage("Teks berhasil dicetak!", "success");
    log(`Teks dicetak: ${text.substring(0, 50)}...`);
  } catch (error) {
    log(`Error print text: ${error.message}`, "error");
    showMessage(`Error: ${error.message}`, "error");
  }

  hideLoading(printTextBtn);
}

/**
 * Print receipt
 */
async function printReceipt() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  const storeName = document.getElementById("storeName").value.trim();
  const storeAddress = document.getElementById("storeAddress").value.trim();
  const cashier = document.getElementById("cashier").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const paymentAmount =
    parseFloat(document.getElementById("paymentAmount").value) || 0;

  const items = getReceiptItems();

  if (!storeName || items.length === 0) {
    showMessage("Lengkapi data toko dan minimal 1 item", "error");
    return;
  }

  const total = calculateTotal(items);

  if (paymentAmount < total) {
    showMessage("Jumlah bayar tidak mencukupi", "error");
    return;
  }

  showLoading(printReceiptBtn);

  try {
    // Initialize
    await printer.sendData(escpos.init());

    // Header
    await printer.sendData(
      escpos.generateReceiptHeader(storeName, storeAddress, cashier)
    );

    // Items
    for (const item of items) {
      const itemLine = `${item.name}`;
      const qtyPrice = `${item.qty} x ${escpos.formatCurrency(item.price)}`;
      const subtotal = escpos.formatCurrency(item.qty * item.price);

      await printer.sendData(escpos.printText(itemLine, { align: "left" }));
      await printer.sendData(escpos.printTwoColumn(qtyPrice, subtotal));
    }

    // Footer
    await printer.sendData(
      escpos.generateReceiptFooter(total, paymentAmount, paymentMethod)
    );

    showMessage("Struk berhasil dicetak!", "success");
    log(`Struk dicetak - Total: ${escpos.formatCurrency(total)}`);
  } catch (error) {
    log(`Error print receipt: ${error.message}`, "error");
    showMessage(`Error: ${error.message}`, "error");
  }

  hideLoading(printReceiptBtn);
}

/**
 * Get receipt items from form
 */
function getReceiptItems() {
  const items = [];
  const itemRows = itemsList.querySelectorAll(".item-row");

  itemRows.forEach((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = parseInt(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;

    if (name && qty > 0 && price > 0) {
      items.push({ name, qty, price });
    }
  });

  return items;
}

/**
 * Calculate total
 */
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.qty * item.price, 0);
}

/**
 * Update receipt total display
 */
function updateReceiptTotal() {
  const items = getReceiptItems();
  const total = calculateTotal(items);

  // Update payment amount placeholder
  const paymentAmountInput = document.getElementById("paymentAmount");
  paymentAmountInput.placeholder = escpos.formatCurrency(total);

  if (!paymentAmountInput.value) {
    paymentAmountInput.value = total;
  }
}

/**
 * Add receipt item
 */
function addReceiptItem() {
  const itemRow = document.createElement("div");
  itemRow.className = "item-row";
  itemRow.innerHTML = `
        <input type="text" class="item-name" placeholder="Nama item">
        <input type="number" class="item-qty" placeholder="Qty" value="1" min="1">
        <input type="number" class="item-price" placeholder="Harga" value="0" min="0">
        <button class="btn-remove"><i class="fas fa-trash"></i></button>
    `;

  itemsList.appendChild(itemRow);
  itemRow.querySelector(".item-name").focus();
}

/**
 * Test basic print
 */
async function testBasicPrint() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  try {
    await printer.sendData(escpos.init());
    await printer.sendData(
      escpos.printText("TEST BASIC PRINT", { align: "center", bold: true })
    );
    await printer.sendData(escpos.printText("Printer: EPSON EP5821"));
    await printer.sendData(escpos.printText("Lebar: 58mm"));
    await printer.sendData(
      escpos.printText(`Tanggal: ${escpos.formatDateTime()}`)
    );
    await printer.sendData(escpos.printSeparator("="));
    await printer.sendData(
      escpos.printText("Test berhasil!", { align: "center" })
    );
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());

    showMessage("Test basic print berhasil!", "success");
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

/**
 * Test alignment
 */
async function testAlignment() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  try {
    await printer.sendData(escpos.init());
    await printer.sendData(
      escpos.printText("TEST ALIGNMENT", { align: "center", bold: true })
    );
    await printer.sendData(escpos.printSeparator("-"));
    await printer.sendData(escpos.printText("Kiri", { align: "left" }));
    await printer.sendData(escpos.printText("Tengah", { align: "center" }));
    await printer.sendData(escpos.printText("Kanan", { align: "right" }));
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());

    showMessage("Test alignment berhasil!", "success");
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

/**
 * Test text sizes
 */
async function testTextSizes() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  try {
    await printer.sendData(escpos.init());
    await printer.sendData(
      escpos.printText("TEST UKURAN TEKS", { align: "center", bold: true })
    );
    await printer.sendData(escpos.printSeparator("-"));
    await printer.sendData(escpos.printText("Normal", { size: "normal" }));
    await printer.sendData(escpos.printText("Double", { size: "double" }));
    await printer.sendData(escpos.printText("Lebar", { size: "wide" }));
    await printer.sendData(escpos.printText("Tinggi", { size: "tall" }));
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());

    showMessage("Test ukuran teks berhasil!", "success");
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

/**
 * Test barcode
 */
async function testBarcode() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  try {
    await printer.sendData(escpos.init());
    await printer.sendData(
      escpos.printText("TEST BARCODE", { align: "center", bold: true })
    );
    await printer.sendData(escpos.printSeparator("-"));
    await printer.sendData(escpos.printBarcode("123456789012"));
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());

    showMessage("Test barcode berhasil!", "success");
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

/**
 * Cut paper
 */
async function cutPaper() {
  if (!printer.isConnected) {
    showMessage("Printer tidak terhubung", "error");
    return;
  }

  try {
    await printer.sendData(escpos.feedLines(3));
    await printer.sendData(escpos.cutPaper());
    showMessage("Kertas dipotong!", "success");
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

/**
 * Show loading state
 */
function showLoading(button) {
  button.disabled = true;
  button.classList.add("loading");
  button.style.position = "relative";
}

/**
 * Hide loading state
 */
function hideLoading(button) {
  button.disabled = false;
  button.classList.remove("loading");
  button.style.position = "";
}

/**
 * Show message
 */
function showMessage(message, type = "info") {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".message");
  existingMessages.forEach((msg) => msg.remove());

  // Create message element
  const messageEl = document.createElement("div");
  messageEl.className = `message ${type}`;
  messageEl.textContent = message;

  // Insert after connection section
  const connectionSection = document.querySelector(".connection-section");
  connectionSection.insertAdjacentElement("afterend", messageEl);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.remove();
    }
  }, 5000);
}

/**
 * Log function
 */
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}\n`;

  logArea.textContent += logMessage;
  logArea.scrollTop = logArea.scrollHeight;

  console.log(logMessage.trim());
}

/**
 * Clear log
 */
function clearLog() {
  logArea.textContent = "";
  log("Log dibersihkan");
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

function initialize() {
  // Check if already initialized
  if (window.appInitialized) return;
  window.appInitialized = true;

  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  }

  log("Aplikasi thermal printer siap digunakan!");
}

/**
 * Debug connection specifically for RPP02 printer
 */
async function debugConnection() {
  if (printer.isConnected) {
    log("Printer sudah terhubung. Disconnect terlebih dahulu untuk debug.", "warning");
    return;
  }

  log("=== DEBUG CONNECTION START ===", "info");
  
  // Show system information
  log("Mengecek informasi sistem...", "info");
  const systemInfo = printer.getSystemInfo();
  
  // Check HTTPS requirement
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    log("⚠️ PERINGATAN: Web Bluetooth membutuhkan HTTPS atau localhost!", "error");
    log(`Protocol saat ini: ${location.protocol}`, "error");
    log("Solusi: Gunakan HTTPS atau buka dari localhost", "error");
  } else {
    log("✅ Protocol aman untuk Web Bluetooth", "success");
  }

  showLoading(connectDebugBtn);
  
  try {
    const connected = await printer.connectWithDebug();
    
    if (connected) {
      showMessage("Debug: Berhasil terhubung ke printer!", "success");
      log("=== DEBUG CONNECTION SUCCESS ===", "success");
    } else {
      showMessage("Debug: Gagal terhubung ke printer", "error");
      log("=== DEBUG CONNECTION FAILED ===", "error");
    }
  } catch (error) {
    log(`Debug Error: ${error.message}`, "error");
    showMessage(`Debug Error: ${error.message}`, "error");
    log("=== DEBUG CONNECTION ERROR ===", "error");
  }
  
  hideLoading(connectDebugBtn);
}
