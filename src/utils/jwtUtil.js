import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_para_jwt_en_desarrollo_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class JWTUtils {
    // Generar token JWT
    static generateToken(user) {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        };
        
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }
    
    // Verificar token JWT
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Token inválido');
        }
    }
    
    // Extraer token del header Authorization
    static extractTokenFromHeader(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    
    // Decodificar token sin verificar
    static decodeToken(token) {
        return jwt.decode(token);
    }
}

// Exportar tambien funciones individuales para compatibilidad
export const generateToken = JWTUtils.generateToken;
export const verifyToken = JWTUtils.verifyToken;
export const extractTokenFromHeader = JWTUtils.extractTokenFromHeader;
export const decodeToken = JWTUtils.decodeToken;