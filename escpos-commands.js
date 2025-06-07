/**
 * ESC/POS Commands untuk thermal printer 58mm
 * Kompatibel dengan EPSON EP5821 dan printer ESC/POS lainnya
 */

class ESCPOSCommands {
  constructor() {
    // ESC/POS Control Characters
    this.ESC = 0x1b;
    this.GS = 0x1d;
    this.LF = 0x0a;
    this.CR = 0x0d;
    this.FF = 0x0c;
    this.FS = 0x1c;

    // Commands
    this.COMMANDS = {
      // Initialize printer
      INIT: [this.ESC, 0x40],

      // Text alignment
      ALIGN_LEFT: [this.ESC, 0x61, 0x00],
      ALIGN_CENTER: [this.ESC, 0x61, 0x01],
      ALIGN_RIGHT: [this.ESC, 0x61, 0x02],

      // Text size and style
      NORMAL_SIZE: [this.ESC, 0x21, 0x00],
      DOUBLE_HEIGHT: [this.ESC, 0x21, 0x10],
      DOUBLE_WIDTH: [this.ESC, 0x21, 0x20],
      DOUBLE_SIZE: [this.ESC, 0x21, 0x30],

      // Bold
      BOLD_ON: [this.ESC, 0x45, 0x01],
      BOLD_OFF: [this.ESC, 0x45, 0x00],

      // Underline
      UNDERLINE_ON: [this.ESC, 0x2d, 0x01],
      UNDERLINE_OFF: [this.ESC, 0x2d, 0x00],

      // Cut paper
      CUT_PAPER: [this.GS, 0x56, 0x00],
      CUT_PAPER_PARTIAL: [this.GS, 0x56, 0x01],

      // Feed lines
      FEED_LINE: [this.LF],
      FEED_LINES_2: [this.LF, this.LF],
      FEED_LINES_3: [this.LF, this.LF, this.LF],

      // Cash drawer
      OPEN_DRAWER: [this.ESC, 0x70, 0x00, 0x19, 0x19],

      // QR Code (if supported)
      QR_CODE_SIZE: [this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43],
      QR_CODE_CORRECTION: [this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30],

      // Character spacing
      CHAR_SPACING_0: [this.ESC, 0x20, 0x00],
      CHAR_SPACING_1: [this.ESC, 0x20, 0x01],

      // Line spacing
      LINE_SPACING_DEFAULT: [this.ESC, 0x32],
      LINE_SPACING_SET: [this.ESC, 0x33, 0x20],
    };
  }

  /**
   * Convert string to bytes array
   */
  stringToBytes(str) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Create command buffer
   */
  createCommand(...parts) {
    let buffer = [];
    for (const part of parts) {
      if (typeof part === "string") {
        buffer = buffer.concat(this.stringToBytes(part));
      } else if (Array.isArray(part)) {
        buffer = buffer.concat(part);
      } else {
        buffer.push(part);
      }
    }
    return new Uint8Array(buffer);
  }

  /**
   * Initialize printer
   */
  init() {
    return this.createCommand(this.COMMANDS.INIT);
  }

  /**
   * Print text with formatting
   */
  printText(text, options = {}) {
    let commands = [];

    // Apply alignment
    if (options.align === "center") {
      commands.push(this.COMMANDS.ALIGN_CENTER);
    } else if (options.align === "right") {
      commands.push(this.COMMANDS.ALIGN_RIGHT);
    } else {
      commands.push(this.COMMANDS.ALIGN_LEFT);
    }

    // Apply text size
    if (options.size === "double") {
      commands.push(this.COMMANDS.DOUBLE_SIZE);
    } else if (options.size === "wide") {
      commands.push(this.COMMANDS.DOUBLE_WIDTH);
    } else if (options.size === "tall") {
      commands.push(this.COMMANDS.DOUBLE_HEIGHT);
    } else {
      commands.push(this.COMMANDS.NORMAL_SIZE);
    }

    // Apply bold
    if (options.bold) {
      commands.push(this.COMMANDS.BOLD_ON);
    }

    // Apply underline
    if (options.underline) {
      commands.push(this.COMMANDS.UNDERLINE_ON);
    }

    // Add text
    commands.push(text);

    // Reset formatting
    commands.push(this.COMMANDS.BOLD_OFF);
    commands.push(this.COMMANDS.UNDERLINE_OFF);
    commands.push(this.COMMANDS.NORMAL_SIZE);

    // Add line feed
    commands.push(this.COMMANDS.FEED_LINE);

    return this.createCommand(...commands);
  }

  /**
   * Print line separator
   */
  printSeparator(char = "-", width = 32) {
    return this.printText(char.repeat(width), { align: "center" });
  }

  /**
   * Print two-column text (untuk struk)
   */
  printTwoColumn(left, right, totalWidth = 32) {
    const leftWidth = Math.floor(totalWidth * 0.6);
    const rightWidth = totalWidth - leftWidth;

    let leftText = left.substring(0, leftWidth);
    let rightText = right.substring(0, rightWidth);

    // Pad left text
    leftText = leftText.padEnd(leftWidth);
    // Right align right text
    rightText = rightText.padStart(rightWidth);

    return this.printText(leftText + rightText, { align: "left" });
  }

  /**
   * Print three-column text
   */
  printThreeColumn(left, center, right, totalWidth = 32) {
    const colWidth = Math.floor(totalWidth / 3);

    let leftText = left.substring(0, colWidth).padEnd(colWidth);
    let centerText = center.substring(0, colWidth).padEnd(colWidth);
    let rightText = right.substring(0, colWidth).padStart(colWidth);

    return this.printText(leftText + centerText + rightText, { align: "left" });
  }

  /**
   * Feed lines
   */
  feedLines(count = 1) {
    let commands = [];
    for (let i = 0; i < count; i++) {
      commands.push(this.COMMANDS.FEED_LINE);
    }
    return this.createCommand(...commands);
  }

  /**
   * Cut paper
   */
  cutPaper(partial = false) {
    return this.createCommand(
      partial ? this.COMMANDS.CUT_PAPER_PARTIAL : this.COMMANDS.CUT_PAPER
    );
  }

  /**
   * Open cash drawer
   */
  openDrawer() {
    return this.createCommand(this.COMMANDS.OPEN_DRAWER);
  }

  /**
   * Print barcode (Code128)
   */
  printBarcode(data, height = 50) {
    const commands = [
      this.GS,
      0x68,
      height, // Set barcode height
      this.GS,
      0x77,
      0x02, // Set barcode width
      this.GS,
      0x48,
      0x02, // Print HRI below barcode
      this.GS,
      0x6b,
      0x49, // Code128 type
      data.length, // Data length
    ];

    return this.createCommand(...commands, data, this.COMMANDS.FEED_LINES_2);
  }

  /**
   * Print QR Code (jika didukung printer)
   */
  printQRCode(data, size = 3) {
    const dataLength = data.length + 3;
    const pL = dataLength % 256;
    const pH = Math.floor(dataLength / 256);

    const commands = [
      // Set QR code size
      this.GS,
      0x28,
      0x6b,
      0x03,
      0x00,
      0x31,
      0x43,
      size,
      // Set error correction level
      this.GS,
      0x28,
      0x6b,
      0x03,
      0x00,
      0x31,
      0x45,
      0x30,
      // Store data
      this.GS,
      0x28,
      0x6b,
      pL,
      pH,
      0x31,
      0x50,
      0x30,
      data,
      // Print QR code
      this.GS,
      0x28,
      0x6b,
      0x03,
      0x00,
      0x31,
      0x51,
      0x30,
    ];

    return this.createCommand(...commands, this.COMMANDS.FEED_LINES_2);
  }

  /**
   * Format rupiah currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date time
   */
  formatDateTime(date = new Date()) {
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /**
   * Generate receipt header
   */
  generateReceiptHeader(storeName, address, cashier) {
    let commands = [];

    // Store name (bold, center, double height)
    commands.push(
      this.printText(storeName, {
        align: "center",
        size: "tall",
        bold: true,
      })
    );

    // Address (center)
    commands.push(this.printText(address, { align: "center" }));

    // Separator
    commands.push(this.printSeparator("="));

    // Date and cashier
    const now = this.formatDateTime();
    commands.push(this.printTwoColumn("Tanggal:", now));
    commands.push(this.printTwoColumn("Kasir:", cashier));

    // Separator
    commands.push(this.printSeparator("-"));

    return this.createCommand(...commands);
  }

  /**
   * Generate receipt footer
   */
  generateReceiptFooter(total, payment, paymentMethod) {
    let commands = [];

    // Separator
    commands.push(this.printSeparator("-"));

    // Total
    commands.push(this.printTwoColumn("TOTAL:", this.formatCurrency(total)));
    commands.push(
      this.printTwoColumn(paymentMethod + ":", this.formatCurrency(payment))
    );

    const change = payment - total;
    if (change > 0) {
      commands.push(
        this.printTwoColumn("KEMBALIAN:", this.formatCurrency(change))
      );
    }

    // Separator
    commands.push(this.printSeparator("="));

    // Thank you message
    commands.push(
      this.printText("TERIMA KASIH", {
        align: "center",
        bold: true,
      })
    );
    commands.push(this.printText("SELAMAT BERBELANJA", { align: "center" }));

    // Feed and cut
    commands.push(this.feedLines(3));
    commands.push(this.cutPaper());

    return this.createCommand(...commands);
  }
}

// Export untuk digunakan di file lain
if (typeof module !== "undefined" && module.exports) {
  module.exports = ESCPOSCommands;
}
