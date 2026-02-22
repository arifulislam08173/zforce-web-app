const router = require("express").Router();
const controller = require("../controllers/pdf.controller");
const { authorize } = require("../middlewares/auth.middleware");

router.get("/orders/:id/invoice.pdf", authorize("ADMIN", "MANAGER", "FIELD"), controller.invoicePdf);

module.exports = router;
