require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middlewares/error.middleware');
const { authenticate } = require('./middlewares/auth.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const visitRoutes = require('./routes/visit.routes');
const collectionRoutes = require('./routes/collection.routes');
const expenseRoutes = require('./routes/expense.routes');
const routeRoutes = require("./routes/route.routes");
// const searchRoutes = require("./routes/search.routes");
const userRoutes = require("./routes/user.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const dashboardRoutes = require('./routes/dashboard.routes');

const companyRoutes = require("./routes/company.routes");
const userCompanyRoutes = require("./routes/userCompany.routes");
const userCustomerRoleRoutes = require("./routes/userCustomerRole.routes");
const reportRoutes = require("./routes/report.routes");
const paymentRoutes = require("./routes/payment.routes");
const pdfRoutes = require("./routes/pdf.routes");
const face = require("./routes/face.routes") ;

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/visits', authenticate, visitRoutes);
app.use('/api/collections', authenticate, collectionRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use("/api/route", authenticate, routeRoutes);
// app.use("/api/search", authenticate, searchRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.use("/api/companies", authenticate, companyRoutes);
app.use("/api/user-companies", authenticate, userCompanyRoutes);
app.use("/api/user-customer-roles", authenticate, userCustomerRoleRoutes);

app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/payments", authenticate, paymentRoutes);
app.use("/api/pdf", authenticate, pdfRoutes);



app.use("/api/face", face);

const path = require("path");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


// Global Error Handler (last middleware)
app.use(errorHandler);

module.exports = app;
