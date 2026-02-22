const collectionService = require("../services/collection.service");
const { Collection, Order, Customer, User } = require("../models");
const { buildReceiptPdf } = require("../utils/buildReceiptPdf");

const normalizeError = (err) => err?.message || "Something went wrong";

/**
 * Create collection (FIELD)
 */
exports.createCollection = async (req, res, next) => {
  try {
    const result = await collectionService.createCollection(req.user.id, req.body);
    res.status(201).json({ message: "Collection recorded successfully", data: result });
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};

/**
 * Get my collections (FIELD)
 */
exports.getMyCollections = async (req, res, next) => {
  try {
    const result = await collectionService.getMyCollections(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};

/**
 * Update status (ADMIN/MANAGER)
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await collectionService.updateCollectionStatus(id, status);

    res.status(200).json({
      message: `Collection ${String(result.status).toLowerCase()} successfully`,
      data: result,
    });
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};

/**
 * Report (ADMIN/MANAGER)
 */
exports.getReport = async (req, res, next) => {
  try {
    const result = await collectionService.getCollectionReport(req.query);
    res.status(200).json(result);
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};


exports.downloadReceiptPdf = async (req, res) => {
  try {
    const id = req.params.id;

    const collection = await Collection.findByPk(id, {
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: Customer, as: "customer" }],
        },
        { model: User, as: "user" },
      ],
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const order = collection.order;
    const customer = order?.customer;

    // Optional: if you have company on orderRole/order, fetch it here
    const company = null;

    const doc = buildReceiptPdf({
      collection,
      order,
      customer,
      company,
      user: collection.user,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${collection.id}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
