const userService = require('../services/user.service');

// exports.dropdown = async (req, res, next) => {
//   try {
//     const users = await userService.getDropdown();
//     return res.status(200).json(users);
//   } catch (err) {
//     next(err);
//   }
// };

exports.dropdown = async (req, res, next) => {
  try {
    const users = await userService.getDropdown(req.query);
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};


exports.list = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json({ message: 'User created', data: user });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    return res.status(200).json({ message: 'User updated', data: user });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id);
    return res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
