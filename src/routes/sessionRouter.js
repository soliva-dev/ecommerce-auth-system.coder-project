import { Router } from 'express';
import passport from '../config/passport.js';
import { userDBManager } from '../dao/userDBManager.js';
import { JWTUtils } from '../utils/jwtUtil.js';

const router = Router();
const UserService = new userDBManager();

/**
 * POST /api/sessions/register
 * Registrar un nuevo usuario
 */
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, age, password, role } = req.body;
        
        // Crear nuevo usuario
        const newUser = await UserService.createUser({
            first_name,
            last_name,
            email,
            age,
            password,
            role: role || 'user'
        });
        
        // Generar token JWT
        const token = JWTUtils.generateToken(newUser);
        
        // Guardar token en cookie HTTP-only
        res.cookie('tokencookie', token, { 
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.status(201).send({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            payload: newUser.toJSON()
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).send({
            status: 'error',
            message: error.message || 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/sessions/login
 * Login de usuario usando Passport Local Strategy  
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        try {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error interno del servidor',
                    error: err.message
                });
            }
            
            if (!user) {
                return res.status(401).send({
                    status: 'error',
                    message: info.message || 'Credenciales inválidas'
                });
            }
            
            // Generar token JWT
            const token = JWTUtils.generateToken(user);
            
            // Guardar token en cookie HTTP-only
            res.cookie('tokencookie', token, { 
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            
            res.status(200).send({
                status: 'success',
                message: 'Login exitoso',
                usuarioLogueado: user.toJSON()
            });
            
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).send({
                status: 'error',
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    })(req, res, next);
});

/**
 * GET /api/sessions/current  (CRITERIO CLAVE)
 * Validar usuario actual usando current
 */
router.get('/current', (req, res, next) => {
    passport.authenticate('current', (err, user, info) => {
        try {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error interno del servidor',
                    error: err.message
                });
            }
            
            if (!user) {
                return res.status(401).send({
                    status: 'error',
                    message: info.message || 'Token inválido o expirado'
                });
            }
            
            // Devolver datos del usuario asociado al JWT
            const userData = user.toJSON();
            
            res.status(200).send({
                status: 'success',
                message: 'Usuario autenticado',
                ...userData
            });
            
        } catch (error) {
            console.error('Error en current:', error);
            res.status(500).send({
                status: 'error',
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    })(req, res, next);
});

/**
 * POST /api/sessions/logout
 * Logout del usuario (limpiar cookie HTTP-only)
 */
router.post('/logout', (req, res) => {
    try {
        // Limpiar cookie 
        res.clearCookie('tokencookie');
        res.status(200).send({
            status: 'success',
            message: 'Logout exitoso'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/sessions/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', (req, res, next) => {
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
        
        res.status(200).send({
            status: 'success',
            message: 'Perfil del usuario',
            payload: user.toJSON()
        });
    })(req, res, next);
});

export default router;