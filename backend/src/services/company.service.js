const { Company } = require("../models");

exports.dropdown = async () =>
  Company.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]], limit: 500 });

exports.list = async () =>
  Company.findAll({ order: [["createdAt", "DESC"]] });

exports.getById = async (id) => Company.findByPk(id);

exports.create = async (data) =>
  Company.create({
    name: data.name,
    address: data.address || null,
    contactNo: data.contactNo || null,
    email: data.email || null,
    binNo: data.binNo || null,
    tiinNo: data.tiinNo || null,
  });

exports.update = async (id, data) => {
  const c = await Company.findByPk(id);
  if (!c) return null;

  await c.update({
    name: data.name ?? c.name,
    address: data.address ?? c.address,
    contactNo: data.contactNo ?? c.contactNo,
    email: data.email ?? c.email,
    binNo: data.binNo ?? c.binNo,
    tiinNo: data.tiinNo ?? c.tiinNo,
  });

  return c;
};

exports.remove = async (id) => {
  const c = await Company.findByPk(id);
  if (!c) return false;
  await c.destroy();
  return true;
};
