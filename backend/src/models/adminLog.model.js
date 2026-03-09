module.exports = (sequelize, DataTypes) => {
  const AdminLog = sequelize.define(
    'AdminLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      actorName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actorEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actorRole: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      action: {
        type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      beforeData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      afterData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'admin_logs',
      timestamps: true,
      indexes: [
        { fields: ['createdAt'] },
        { fields: ['actorId'] },
        { fields: ['entityType'] },
        { fields: ['entityId'] },
        { fields: ['action'] },
      ],
    }
  );

  AdminLog.associate = (models) => {
    AdminLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
  };

  return AdminLog;
};
