// const express = require('express');
// const bodyParser = require('body-parser');
// const config = require('./config/config');
// const { connectDB } = require('./config/database');
// const routes = require('./routes'); // Import your central routes
// const errorMiddleware = require('./middlewares/error.middleware');

// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Routes
// app.use('/api', routes);

// // Error Handler
// app.use(errorMiddleware);

// // Start Server
// const startServer = async () => {
//   await connectDB(); // Ensure DB connection before starting
//   app.listen(config.server.port, () => {
//     console.log(`🚀 Server running in ${config.server.env} mode on port ${config.server.port}`);
//   });
// };

// startServer();



// ***** Udated Code *****
require('dotenv').config();

const app = require('./app');
const config = require('./config/config');
const { connectDB, sequelize } = require('./config/database');

// Start Server
const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log('Tables synced');
  app.listen(config.server.port, () => {
    console.log(`🚀 Server running in ${config.server.env} mode on port ${config.server.port}`);
  });
};

startServer();
