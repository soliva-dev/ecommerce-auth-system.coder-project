import { Router } from 'express';
import passport from '../config/passport.js';
import { userDBManager } from '../dao/userDBManager.js';

const router = Router();
const UserService = new userDBManager();

// Middleware de autenticacion con current
const authenticateCurrent = (req, res, next) => {
    passport.authenticate('current', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error de autenticación',
                error: err.message
            });
        }
        
        if (!user) {
            return res.status(401).send({
                status: 'error',
                message: info.message || 'Acceso denegado - Usuario no autenticado'
            });
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

// Middleware de autenticacion JWT
const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error de autenticación',
                error: err.message
            });
        }
        
        if (!user) {
            return res.status(401).send({
                status: 'error',
                message: info.message || 'Token inválido o expirado'
            });
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

// Middleware de autorizacion por roles
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({
                status: 'error',
                message: 'Acceso denegado. Usuario no autenticado.'
            });
        }
        
        // Si roles es un string, convertirlo a array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send({
                status: 'error',
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
            });
        }
        
        next();
    };
};

/**
 * GET /api/users
 * Obtener todos los usuarios (solo admin) - usando cookies
 */
router.get('/', authenticateCurrent, authorize(['admin']), async (req, res) => {
    try {
        const users = await UserService.getAllUsers();
        
        res.status(200).send({
            status: 'success',
            message: 'Usuarios obtenidos exitosamente',
            payload: users,
            count: users.length
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/users/:id
 * Obtener un usuario por ID (propietario o admin)
 */
router.get('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el usuario es el propietario o admin
        if (req.user._id.toString() !== id && req.user.role !== 'admin') {
            return res.status(403).send({
                status: 'error',
                message: 'Acceso denegado. No puedes ver este perfil.'
            });
        }
        
        const user = await UserService.getUserById(id);
        
        if (!user) {
            return res.status(404).send({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }
        
        res.status(200).send({
            status: 'success',
            message: 'Usuario obtenido exitosamente',
            payload: user.toJSON()
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * PUT /api/users/:id  
 * Actualizar un usuario (propietario o admin)
 */
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, age, role } = req.body;
        
        // Verificar si el usuario es el propietario o admin
        if (req.user._id.toString() !== id && req.user.role !== 'admin') {
            return res.status(403).send({
                status: 'error',
                message: 'Acceso denegado. No puedes modificar este perfil.'
            });
        }
        
        // Solo admin puede cambiar roles
        if (role && req.user.role !== 'admin') {
            return res.status(403).send({
                status: 'error',
                message: 'Solo los administradores pueden cambiar roles'
            });
        }
        
        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (age) updateData.age = age;
        if (role && req.user.role === 'admin') updateData.role = role;
        
        const user = await UserService.updateUser(id, updateData);
        
        if (!user) {
            return res.status(404).send({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }
        
        res.status(200).send({
            status: 'success',
            message: 'Usuario actualizado exitosamente',
            payload: user.toJSON()
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * DELETE /api/users/:id
 * Eliminar un usuario (solo admin)  
 */
router.delete('/:id', authenticateJWT, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedUser = await UserService.deleteUser(id);
        
        if (!deletedUser) {
            return res.status(404).send({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }
        
        res.status(200).send({
            status: 'success',
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * PUT /api/users/:id/role
 * Cambiar rol de usuario (solo admin)
 */
router.put('/:id/role', authenticateJWT, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!role || !['user', 'premium', 'admin'].includes(role)) {
            return res.status(400).send({
                status: 'error',
                message: 'Rol inválido. Debe ser: user, premium o admin'
            });
        }
        
        const user = await UserService.changeUserRole(id, role);
        
        if (!user) {
            return res.status(404).send({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }
        
        res.status(200).send({
            status: 'success',
            message: 'Rol de usuario actualizado exitosamente',
            payload: user.toJSON()
        });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;