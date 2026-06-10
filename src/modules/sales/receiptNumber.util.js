const Sale = require('./sale.model');

async function generateReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const receiptNumber = `RX-${dateStr}-${suffix}`;
    const exists = await Sale.exists({ receiptNumber });
    if (!exists) return receiptNumber;
  }

  throw new Error('Failed to generate unique receipt number after 10 retries');
}

module.exports = { generateReceiptNumber };
