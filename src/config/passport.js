import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { userDBManager } from '../dao/userDBManager.js';

const UserService = new userDBManager();

// Extractor personalizado para cookies (siguiendo el patron usado en clases)
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['tokencookie'] || null;
    }
    return token;
};

// Estrategia para login con email/pass
passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await UserService.getUserByEmail(email);
        
        if (!user) {
            return done(null, false, { message: 'Usuario no encontrado' });
        }
        
        if (!user.comparePassword(password)) {
            return done(null, false, { message: 'Credenciales inválidas' });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Estrategia JWT estandar
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'mi_clave_super_secreta_para_jwt_en_desarrollo_cambiar_en_produccion'
}, async (payload, done) => {
    try {
        const user = await UserService.getUserById(payload.id);
        
        if (!user) {
            return done(null, false, { message: 'Token inválido o usuario no encontrado' });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));

// Estrategia current usando cookies (siguiendo el patron usado en clases)
passport.use('current', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
    secretOrKey: process.env.JWT_SECRET || 'mi_clave_super_secreta_para_jwt_en_desarrollo_cambiar_en_produccion'
}, async (payload, done) => {
    try {
        console.log('Current strategy - Payload recibido:', payload);
        
        const user = await UserService.getUserById(payload.id);
        console.log('Current strategy - Usuario encontrado:', user ? 'Sí' : 'No');
        
        if (!user) {
            return done(null, false, { message: 'Token inválido o usuario no encontrado' });
        }
        
        return done(null, user);
    } catch (error) {
        console.error('Current strategy - Error:', error);
        return done(error, false);
    }
}));

// Serializacion de usuario
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserService.getUserById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;