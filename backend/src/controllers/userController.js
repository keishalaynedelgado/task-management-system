const { User, Tenant } = require('../models');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const { tenantId, role, search, page = 1, limit = 10 } = req.query;
    const where = {};

    // Non-super_admins are always scoped to their own tenant, regardless of query params
    if (req.user.role === 'super_admin') {
      if (tenantId) where.tenantId = tenantId;
    } else {
      where.tenantId = req.user.tenantId;
    }
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Tenant, as: 'tenant' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [{ model: Tenant, as: 'tenant' }]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role !== 'super_admin' && user.tenantId !== req.user.tenantId) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    // Non-super_admins may only create users within their own tenant
    if (req.user.role !== 'super_admin') {
      req.body.tenantId = req.user.tenantId;
    }

    // Check if tenant exists
    if (req.body.tenantId) {
      const tenant = await Tenant.findByPk(req.body.tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }
    }

    const user = await User.create(req.body);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role !== 'super_admin') {
      if (user.tenantId !== req.user.tenantId) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      // Non-super_admins may not move a user to a different tenant
      delete req.body.tenantId;
    }

    await user.update(req.body);
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role !== 'super_admin' && user.tenantId !== req.user.tenantId) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};