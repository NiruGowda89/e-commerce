const User = require('../models/User');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['userId', 'ASC']]
    });
    
    // Remove passwords before returning
    const sanitizedUsers = users.map(user => {
      const u = user.toJSON();
      delete u.password;
      return u;
    });

    return res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const active = req.query.active || req.body.active;

    if (active === undefined) {
      return res.status(400).json({ error: 'Active parameter is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.active = active === 'true' || active === true;
    await user.save();

    const u = user.toJSON();
    delete u.password;
    return res.status(200).json(u);
  } catch (error) {
    console.error('Admin toggle status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const role = req.query.role || req.body.role;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role.toUpperCase();
    await user.save();

    const u = user.toJSON();
    delete u.password;
    return res.status(200).json(u);
  } catch (error) {
    console.error('Admin update role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserRoleByEmail = async (req, res) => {
  try {
    const email = req.query.email || req.body.email;
    const role = req.query.role || req.body.role;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role.toUpperCase();
    await user.save();

    const u = user.toJSON();
    delete u.password;
    return res.status(200).json(u);
  } catch (error) {
    console.error('Admin update role by email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  updateUserRoleByEmail
};
