/**
 * Bluetooth Printer Connection Manager
 * Menggunakan Web Bluetooth API untuk koneksi ke thermal printer
 */

class BluetoothPrinter {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;

    // UUID untuk Serial Port Profile (SPP)
    this.serviceUUID = "00001101-0000-1000-8000-00805f9b34fb";
    this.characteristicUUID = "00001101-0000-1000-8000-00805f9b34fb";

    // Alternative UUIDs untuk berbagai printer
    this.alternativeServiceUUIDs = [
      "00001101-0000-1000-8000-00805f9b34fb", // SPP
      "0000ff00-0000-1000-8000-00805f9b34fb", // Custom
      "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Nordic UART
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART Service
    ];

    this.onConnectionChange = null;
    this.onError = null;
    this.onLog = null;
  }
  /**
   * Check if Web Bluetooth is supported
   */
  isBluetoothSupported() {
    if (!navigator.bluetooth) {
      this.log("Web Bluetooth API tidak didukung di browser ini", "error");
      return false;
    }
    
    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      this.log("Web Bluetooth membutuhkan HTTPS atau localhost", "error");
      return false;
    }
    
    return true;
  }

  /**
   * Log function
   */
  log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;

    console.log(logMessage);

    if (this.onLog) {
      this.onLog(logMessage, type);
    }
  }
  /**
   * Connect to printer
   */
  async connect() {
    try {
      if (!this.isBluetoothSupported()) {
        throw new Error("Web Bluetooth tidak didukung");
      }

      this.log("Mencari perangkat Bluetooth...");

      // Coba dengan filter spesifik terlebih dahulu
      let options = {
        filters: [
          { namePrefix: "RPP" }, // RPP series printers (termasuk RPP02)
          { namePrefix: "EP5821" }, // EPSON EP5821
          { namePrefix: "EPSON" }, // EPSON devices
          { namePrefix: "POS" }, // POS printers
          { namePrefix: "Thermal" }, // Thermal printers
          { namePrefix: "Printer" }, // Generic printers
          { namePrefix: "BT" }, // Bluetooth devices
          { namePrefix: "RP" }, // RP series printers
          { namePrefix: "MTP" }, // Mobile thermal printers
          { namePrefix: "58mm" }, // 58mm printers
          { namePrefix: "TM" }, // TM series (EPSON)
          { namePrefix: "RT" }, // Receipt thermal
          { namePrefix: "ZJ" }, // ZJ series printers
          { namePrefix: "Mini" }, // Mini printers
          { namePrefix: "Portable" }, // Portable printers
        ],
        optionalServices: this.alternativeServiceUUIDs,
      };

      try {
        this.device = await navigator.bluetooth.requestDevice(options);
      } catch (filterError) {
        this.log("Filter spesifik gagal, mencoba scan semua perangkat...");
        
        // Fallback: scan semua perangkat yang mengiklankan service
        options = {
          acceptAllDevices: true,
          optionalServices: this.alternativeServiceUUIDs,
        };
        
        this.device = await navigator.bluetooth.requestDevice(options);
      }

      this.log(`Perangkat ditemukan: ${this.device.name || "Unknown"} (ID: ${this.device.id})`);

      // Add disconnect event listener
      this.device.addEventListener("gattserverdisconnected", () => {
        this.handleDisconnection();
      });

      // Connect to GATT server
      this.log("Menghubungkan ke GATT server...");
      this.server = await this.device.gatt.connect();

      // Try to find the correct service
      await this.findAndConnectService();

      this.isConnected = true;
      this.log("Berhasil terhubung ke printer!", "success");

      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }

      return true;
    } catch (error) {
      this.log(`Error koneksi: ${error.message}`, "error");

      if (this.onError) {
        this.onError(error);
      }

      return false;
    }
  }

  /**
   * Find and connect to the correct service
   */
  async findAndConnectService() {
    let serviceFound = false;

    for (const serviceUUID of this.alternativeServiceUUIDs) {
      try {
        this.log(`Mencoba service UUID: ${serviceUUID}`);

        this.service = await this.server.getPrimaryService(serviceUUID);

        // Get characteristics
        const characteristics = await this.service.getCharacteristics();
        this.log(`Ditemukan ${characteristics.length} karakteristik`);

        // Find writable characteristic
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            this.log(`Menggunakan karakteristik: ${char.uuid}`);
            serviceFound = true;
            break;
          }
        }

        if (serviceFound) break;
      } catch (error) {
        this.log(`Service ${serviceUUID} tidak tersedia: ${error.message}`);
        continue;
      }
    }

    if (!serviceFound) {
      throw new Error("Tidak dapat menemukan service yang kompatibel");
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect() {
    try {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }

      this.handleDisconnection();
      this.log("Disconnected dari printer");
    } catch (error) {
      this.log(`Error disconnect: ${error.message}`, "error");
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection() {
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;

    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  /**
   * Send data to printer
   */
  async sendData(data) {
    try {
      if (!this.isConnected || !this.characteristic) {
        throw new Error("Printer tidak terhubung");
      }

      // Convert data to Uint8Array if needed
      let dataToSend;
      if (data instanceof Uint8Array) {
        dataToSend = data;
      } else if (typeof data === "string") {
        const encoder = new TextEncoder();
        dataToSend = encoder.encode(data);
      } else if (Array.isArray(data)) {
        dataToSend = new Uint8Array(data);
      } else {
        throw new Error("Format data tidak didukung");
      }

      // Send data in chunks (maksimal 20 bytes per transmission untuk kompatibilitas)
      const chunkSize = 20;
      for (let i = 0; i < dataToSend.length; i += chunkSize) {
        const chunk = dataToSend.slice(i, i + chunkSize);

        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }

        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      this.log(`Data terkirim: ${dataToSend.length} bytes`);
      return true;
    } catch (error) {
      this.log(`Error mengirim data: ${error.message}`, "error");

      if (this.onError) {
        this.onError(error);
      }

      return false;
    }
  }

  /**
   * Print text
   */
  async printText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + "\n");
    return await this.sendData(data);
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceName: this.device ? this.device.name : null,
      deviceId: this.device ? this.device.id : null,
    };
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      if (!this.isConnected) {
        throw new Error("Printer tidak terhubung");
      }

      // Send simple test command
      const testData = new Uint8Array([0x1b, 0x40]); // ESC @ (Initialize)
      await this.sendData(testData);

      this.log("Test koneksi berhasil", "success");
      return true;
    } catch (error) {
      this.log(`Test koneksi gagal: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Reconnect to last device
   */
  async reconnect() {
    if (this.device) {
      try {
        this.log("Mencoba reconnect...");

        if (this.device.gatt.connected) {
          await this.device.gatt.disconnect();
        }

        this.server = await this.device.gatt.connect();
        await this.findAndConnectService();

        this.isConnected = true;
        this.log("Reconnect berhasil!", "success");

        if (this.onConnectionChange) {
          this.onConnectionChange(true);
        }

        return true;
      } catch (error) {
        this.log(`Reconnect gagal: ${error.message}`, "error");
        return false;
      }
    } else {
      return await this.connect();
    }
  }

  /**
   * Get system and browser information for debugging
   */
  getSystemInfo() {
    const info = {
      userAgent: navigator.userAgent,
      protocol: location.protocol,
      hostname: location.hostname,
      bluetoothSupported: !!navigator.bluetooth,
      isSecureContext: window.isSecureContext,
      platform: navigator.platform || 'Unknown'
    };
    
    this.log(`System Info: ${JSON.stringify(info, null, 2)}`);
    return info;
  }

  /**
   * Advanced connect method with more debugging
   */
  async connectWithDebug() {
    try {
      // Log system information
      this.getSystemInfo();
      
      if (!this.isBluetoothSupported()) {
        throw new Error("Web Bluetooth tidak didukung atau tidak aman");
      }

      this.log("Mencari perangkat Bluetooth (dengan debug)...");

      // Coba dengan filter spesifik untuk RPP02
      let options = {
        filters: [
          { namePrefix: "RPP02" }, // Spesifik untuk RPP02
          { namePrefix: "RPP" }, // RPP series printers
          { name: "RPP02" }, // Exact name match
        ],
        optionalServices: this.alternativeServiceUUIDs,
      };

      try {
        this.log("Mencoba filter spesifik untuk RPP02...");
        this.device = await navigator.bluetooth.requestDevice(options);
      } catch (filterError) {
        this.log(`Filter RPP02 gagal: ${filterError.message}`);
        this.log("Mencoba filter umum untuk printer...");
        
        // Fallback ke filter umum
        options = {
          filters: [
            { namePrefix: "RPP" },
            { namePrefix: "POS" },
            { namePrefix: "Thermal" },
            { namePrefix: "Printer" },
            { namePrefix: "BT" },
          ],
          optionalServices: this.alternativeServiceUUIDs,
        };
        
        try {
          this.device = await navigator.bluetooth.requestDevice(options);
        } catch (generalError) {
          this.log(`Filter umum gagal: ${generalError.message}`);
          this.log("Mencoba scan semua perangkat...");
          
          // Last resort: scan all devices
          options = {
            acceptAllDevices: true,
            optionalServices: this.alternativeServiceUUIDs,
          };
          
          this.device = await navigator.bluetooth.requestDevice(options);
        }
      }

      this.log(`Perangkat ditemukan: ${this.device.name || "Unknown"} (ID: ${this.device.id})`);

      // Add disconnect event listener
      this.device.addEventListener("gattserverdisconnected", () => {
        this.handleDisconnection();
      });

      // Connect to GATT server
      this.log("Menghubungkan ke GATT server...");
      this.server = await this.device.gatt.connect();

      // Try to find the correct service
      await this.findAndConnectService();

      this.isConnected = true;
      this.log("Berhasil terhubung ke printer!", "success");

      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }

      return true;
    } catch (error) {
      this.log(`Error koneksi: ${error.message}`, "error");

      if (this.onError) {
        this.onError(error);
      }

      return false;
    }
  }
}

// Export untuk digunakan di file lain
if (typeof module !== "undefined" && module.exports) {
  module.exports = BluetoothPrinter;
}
