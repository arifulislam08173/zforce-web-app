require('dotenv').config();

const app = require('./app');
const config = require('./config/config');
const { connectDB, sequelize } = require('./config/database');
const { seedDefaults } = require('./seeders/default.seed');

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    await sequelize.sync({ alter: true });
    console.log('Tables synced');

    await seedDefaults();

    app.listen(config.server.port, () => {
      console.log(
        `🚀 Server running in ${config.server.env} mode on port ${config.server.port}`
      );
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();