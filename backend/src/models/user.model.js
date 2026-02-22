module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: DataTypes.ENUM('ADMIN', 'MANAGER', 'FIELD'),
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    
    faceEnrolled: { type: DataTypes.BOOLEAN, defaultValue: false },
    faceEmbedding: { type: DataTypes.TEXT, allowNull: true },
    faceEnrollAt: { type: DataTypes.DATE, allowNull: true },
  }, { paranoid: true });
};
