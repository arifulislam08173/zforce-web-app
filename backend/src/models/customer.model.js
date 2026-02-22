module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // assignedTo: {
      //   type: DataTypes.UUID,
      //   allowNull: true,
      // },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
      },
    },
    {
      paranoid: true,
      // indexes: [{ fields: ['assignedTo'] }, { fields: ['status'] }],
      indexes: [{ fields: ["status"] }],
    }
  );

  // Customer.associate = (models) => {
  //   Customer.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'fieldUser' });
  // };

  return Customer;
};
