const { getOrderSummary } = require("../services/paymentSummary.service");

exports.orderSummary = async (req, res, next) => {
  try {
    const data = await getOrderSummary(req.params.id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
};
