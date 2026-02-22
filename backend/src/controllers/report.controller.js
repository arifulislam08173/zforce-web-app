const ReportService = require("../services/report.service");
const { Company } = require("../models");
const { createSalesReportPdf, createPerformanceReportPdf } = require("../utils/pdf.util");

const pickCompany = async (query) => {
  const companyId = query.companyId || null;
  if (!companyId) return null;
  return Company.findByPk(companyId);
};

exports.orders = async (req, res, next) => {
  try {
    res.json(await ReportService.orders(req.user, req.query));
  } catch (e) {
    next(e);
  }
};

exports.summary = async (req, res, next) => {
  try {
    res.json(await ReportService.summary(req.user, req.query));
  } catch (e) {
    next(e);
  }
};

exports.performance = async (req, res, next) => {
  try {
    res.json(await ReportService.performance(req.user, req.query));
  } catch (e) {
    next(e);
  }
};

exports.totals = async (req, res, next) => {
  try {
    res.json(await ReportService.totals(req.user, req.query));
  } catch (e) {
    next(e);
  }
};

// PDF exports
exports.ordersPdf = async (req, res, next) => {
  try {
    const query = { ...req.query, page: 1, limit: Math.min(Number(req.query.limit || 5000), 5000) };
    const [list, totals, company] = await Promise.all([
      ReportService.orders(req.user, query),
      ReportService.totals(req.user, req.query),
      pickCompany(req.query),
    ]);

    const doc = createSalesReportPdf({
      rows: list.data || [],
      totals: totals.data || {},
      company,
      filters: req.query,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sales-report.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (e) {
    next(e);
  }
};

exports.performancePdf = async (req, res, next) => {
  try {
    const [perf, company] = await Promise.all([
      ReportService.performance(req.user, req.query),
      pickCompany(req.query),
    ]);

    const doc = createPerformanceReportPdf({
      rows: perf.data || [],
      company,
      filters: req.query,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="performance-report.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (e) {
    next(e);
  }
};
