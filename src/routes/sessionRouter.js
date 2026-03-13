import { Router } from 'express';
import passport from '../config/passport.js';
import { userDBManager } from '../dao/userDBManager.js';
import { resetTokenDBManager } from '../dao/resetTokenDBManager.js';
import { JWTUtils } from '../utils/jwtUtil.js';
import { CurrentUserDTO } from '../dto/userDTO.js';
import mailingService from '../services/mailingService.js';
import bcrypt from 'bcrypt';

const router = Router();
const UserService = new userDBManager();
const ResetTokenService = new resetTokenDBManager();

router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, age, password, role } = req.body;
        
        const newUser = await UserService.createUser({
            first_name,
            last_name,
            email,
            age,
            password,
            role: role || 'user'
        });
        
        const token = JWTUtils.generateToken(newUser);
        
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
            
            const token = JWTUtils.generateToken(user);
            
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

router.get('/current', (req, res, next) => {
    // Debugging: log cookies
    console.log('Cookies recibidas:', req.cookies);
    
    passport.authenticate('current', (err, user, info) => {
        try {
            console.log('Current auth result - Error:', err, 'User:', !!user, 'Info:', info);
            
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
                    message: info?.message || 'Token inválido o expirado'
                });
            }
            
            const userDTO = new CurrentUserDTO(user);
            
            res.status(200).send({
                status: 'success',
                message: 'Usuario autenticado',
                ...userDTO
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

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({
                status: 'error',
                message: 'Email es requerido'
            });
        }

        // Buscar usuario por email
        const user = await UserService.getUserByEmail(email);
        if (!user) {
            return res.status(200).send({
                status: 'success',
                message: 'Si el email existe, se enviará un enlace de recuperación'
            });
        }

const resetToken = await ResetTokenService.createResetToken(user._id);

const resetUrl = `${req.protocol}://${req.get('host')}/api/sessions/reset-password?token=${resetToken.token}`;

        // Enviar email
        await mailingService.sendPasswordResetEmail(
            user.email, 
            resetUrl, 
            `${user.first_name} ${user.last_name}`
        );

        res.status(200).send({
            status: 'success',
            message: 'Si el email existe, se enviará un enlace de recuperación',
            ...(process.env.NODE_ENV === 'development' && {
                devInfo: {
                    token: resetToken.token,
                    resetUrl: resetUrl,
                    expiresAt: resetToken.expiresAt
                }
            })
        });

    } catch (error) {
        console.error('❌ Error en forgot-password:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).send({
                status: 'error',
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).send({
                status: 'error',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar token
        const resetToken = await ResetTokenService.findValidToken(token);
        const user = resetToken.userId;

        // Verificar que la nueva contraseña sea diferente a la actual
        const isSamePassword = bcrypt.compareSync(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).send({
                status: 'error',
                message: 'La nueva contraseña debe ser diferente a la actual'
            });
        }

const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

await UserService.updateUserPassword(user._id, hashedPassword);

await ResetTokenService.markTokenAsUsed(token);

        res.status(200).send({
            status: 'success',
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en reset-password:', error);
        
        if (error.message === 'Token inválido o expirado') {
            return res.status(400).send({
                status: 'error',
                message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.'
            });
        }

        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

export default router;