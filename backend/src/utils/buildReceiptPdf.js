const PDFDocument = require("pdfkit");

const money = (n) => Number(n || 0).toFixed(2);

function buildReceiptPdf({ collection, order, customer, company, user }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  doc.fontSize(18).text(company?.name || "Receipt", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#555").text(`Receipt ID: ${collection.id}`, { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1);

  // Header info
  doc.fontSize(12).text("Customer");
  doc.fontSize(10).text(`${customer?.name || "-"}`);
  if (customer?.phone) doc.text(`Phone: ${customer.phone}`);
  doc.moveDown(0.5);

  doc.fontSize(12).text("Order");
  doc.fontSize(10).text(`Order Number: ${order?.orderNumber || "-"}`);
  doc.text(`Order ID: ${order?.id || "-"}`);
  doc.text(`Order Total: ${money(order?.totalAmount)}`);
  doc.moveDown(0.5);

  doc.fontSize(12).text("Collection");
  doc.fontSize(10).text(`Collected Amount: ${money(collection.amount)}`);
  doc.text(`Payment Type: ${collection.paymentType || "-"}`);
  doc.text(`Status: ${collection.status || "-"}`);
  doc.text(
    `Collected At: ${
      collection.collectedAt ? new Date(collection.collectedAt).toLocaleString() : "-"
    }`,
  );
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor("#555");
  doc.text(`Collected By: ${user?.name || collection.userId || "-"}`);
  doc.fillColor("#000");

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#999").text("This is a system generated receipt.", { align: "center" });
  doc.fillColor("#000");

  return doc;
}

module.exports = { buildReceiptPdf };
