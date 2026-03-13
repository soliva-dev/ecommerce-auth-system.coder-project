import passport from '../config/passport.js';

/**
 * Middleware de autenticación con current strategy
 */
export const authenticateCurrent = (req, res, next) => {
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

/**
 * Middleware de autenticación con JWT
 */
export const authenticateJWT = (req, res, next) => {
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

/**
 * Middleware de autorización por roles
 * CRITERIO: Solo el administrador puede crear, actualizar y eliminar productos
 * CRITERIO: Solo el usuario puede agregar productos a su carrito
 */
export const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send({
                status: 'error',
                message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`
            });
        }
        
        next();
    };
};

/**
 * Middleware específico: Solo admin puede gestionar productos
 * CRITERIO CRÍTICO: Solo el administrador puede crear, actualizar y eliminar productos
 */
export const adminOnlyProducts = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            status: 'error',
            message: 'Usuario no autenticado'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).send({
            status: 'error',
            message: 'Solo los administradores pueden gestionar productos'
        });
    }
    
    next();
};

/**
 * Middleware específico: Solo usuarios pueden agregar productos al carrito
 * CRITERIO CRÍTICO: Solo el usuario puede agregar productos a su carrito
 */
export const userOnlyCart = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            status: 'error',
            message: 'Usuario no autenticado'
        });
    }
    
    if (!['user', 'premium'].includes(req.user.role)) {
        return res.status(403).send({
            status: 'error',
            message: 'Solo los usuarios pueden agregar productos al carrito'
        });
    }
    
    next();
};

/**
 * Middleware para verificar que el usuario puede acceder a su propio carrito
 */
export const ensureOwnCart = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            status: 'error',
            message: 'Usuario no autenticado'
        });
    }
    
    const { cid } = req.params;
    
    // Admin puede acceder a cualquier carrito
    if (req.user.role === 'admin') {
        return next();
    }
    
    // Usuario solo puede acceder a su propio carrito
    if (req.user.cart && req.user.cart._id.toString() === cid) {
        return next();
    }
    
    return res.status(403).send({
        status: 'error',
        message: 'No puedes acceder a este carrito'
    });
};

/**
 * Middleware para verificar que el usuario puede ver/modificar su propio perfil
 */
export const ensureOwnProfile = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            status: 'error',
            message: 'Usuario no autenticado'
        });
    }
    
    const { id } = req.params;
    
    // Admin puede acceder a cualquier perfil
    if (req.user.role === 'admin') {
        return next();
    }
    
    // Usuario solo puede acceder a su propio perfil
    if (req.user._id.toString() === id) {
        return next();
    }
    
    return res.status(403).send({
        status: 'error',
        message: 'No puedes acceder a este perfil'
    });  
};

/**
 * Middleware para verificar que el comprador del ticket es el usuario autenticado
 */
export const ensureOwnTickets = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({
            status: 'error',
            message: 'Usuario no autenticado'
        });
    }
    
    // Admin puede ver todos los tickets
    if (req.user.role === 'admin') {
        return next();
    }
    
    // Para usuarios, agregar filtro por email
    req.purchaserFilter = req.user.email;
    next();
};