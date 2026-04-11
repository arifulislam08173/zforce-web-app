module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: DataTypes.ENUM('ADMIN', 'MANAGER', 'FIELD'),
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    
    faceEmbeddings: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    faceEnrollMeta: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    faceEnrolled: { type: DataTypes.BOOLEAN, defaultValue: false },
    faceEnrollAt: { type: DataTypes.DATE, allowNull: true },
  }, { paranoid: true });
};
