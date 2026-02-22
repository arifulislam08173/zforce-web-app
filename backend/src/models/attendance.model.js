module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Attendance', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: DataTypes.UUID,
    date: DataTypes.DATEONLY,
    punchIn: DataTypes.DATE,
    punchOut: DataTypes.DATE,
    lat: DataTypes.DECIMAL,
    lng: DataTypes.DECIMAL,
    outLat: DataTypes.DECIMAL,
    outLng: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    punchInPhoto: DataTypes.STRING,
    punchOutPhoto: DataTypes.STRING,

  }, {
    indexes: [{ fields: ['userId', 'date'] }]
  });
};
