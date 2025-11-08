/* eslint-disable @typescript-eslint/no-require-imports */
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// Configuración
const BASE_URL = "https://foodhub-software.vercel.app/customer";
const OUTPUT_DIR = "./qr-codes";
const TABLES_COUNT = 20; // Número de mesas

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

async function generateQRCode(tableNumber) {
  const url = `${BASE_URL}?table=${tableNumber}`;
  const filename = path.join(OUTPUT_DIR, `mesa-${tableNumber}.png`);

  try {
    await QRCode.toFile(filename, url, {
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 300,
      margin: 2,
    });
    console.log(`✅ QR generado para Mesa ${tableNumber}: ${filename}`);
  } catch (err) {
    console.error(`❌ Error generando QR para Mesa ${tableNumber}:`, err);
  }
}

async function generateAllQRCodes() {
  console.log("🎯 Generando códigos QR para mesas...");

  for (let i = 1; i <= TABLES_COUNT; i++) {
    await generateQRCode(i);
  }

  console.log("🎉 Todos los códigos QR han sido generados!");
}

generateAllQRCodes();
