const { generateInvoicePdf } = require("../services/pdf.service");

exports.invoicePdf = async (req, res, next) => {
  try {
    const { doc, orderNumber } = await generateInvoicePdf(req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${orderNumber}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (e) {
    next(e);
  }
};
