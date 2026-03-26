const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /api/users (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuarios.', error: error.message });
  }
};

// GET /api/users/me (usuario autenticado)
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuario.', error: error.message });
  }
};

// POST /api/users (solo admin)
const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol, iMesaId } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = rol || 'cliente';
    
    const user = await User.create({ nombre, email, password: hashedPassword, rol: userRole, iMesaId });
    
    // Retornamos el usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear usuario.', error: error.message });
  }
};

// PUT /api/users/:id (solo admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, password, iMesaId } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    
    // Verificar si se cambia el email y si este ya existe en otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'El email ya está en uso.' });
      }
      user.email = email;
    }
    
    if (nombre) user.nombre = nombre;
    if (rol) user.rol = rol;
    if (iMesaId !== undefined) user.iMesaId = iMesaId;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    
    await user.save();
    
    const { password: _, ...updatedUser } = user.toJSON();
    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar usuario.', error: error.message });
  }
};

// DELETE /api/users/:id (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    
    await user.destroy();
    return res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar usuario.', error: error.message });
  }
};

module.exports = { getAllUsers, getMe, createUser, updateUser, deleteUser };
