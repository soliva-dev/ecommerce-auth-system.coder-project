import ResetTokenModel from './models/resetTokenModel.js';
import crypto from 'crypto';

export class resetTokenDBManager {
    
    // Crear un nuevo token de reset
    async createResetToken(userId) {
        try {
            // Invalidar tokens previos del usuario
            await ResetTokenModel.updateMany(
                { userId, used: false },
                { used: true }
            );

            // Generar token único
            const token = crypto.randomBytes(32).toString('hex');
            
            const resetToken = new ResetTokenModel({
                userId,
                token
            });

            const result = await resetToken.save();
            console.log('Token de reset creado:', result._id);
            
            return {
                _id: result._id,
                token: result.token,
                userId: result.userId,
                createdAt: result.createdAt,
                expiresAt: new Date(result.createdAt.getTime() + 3600000) // +1 hora
            };
        } catch (error) {
            console.error('Error creando token de reset:', error);
            throw new Error('Error creando token de recuperación');
        }
    }

    // Buscar token válido
    async findValidToken(token) {
        try {
            const resetToken = await ResetTokenModel.findOne({
                token,
                used: false,
                createdAt: { $gte: new Date(Date.now() - 3600000) } // No más viejo que 1 hora
            }).populate('userId');

            if (!resetToken) {
                throw new Error('Token inválido o expirado');
            }

            return resetToken;
        } catch (error) {
            console.error('Error buscando token:', error);
            throw error;
        }
    }

    // Marcar token como usado
    async markTokenAsUsed(token) {
        try {
            const result = await ResetTokenModel.updateOne(
                { token },
                { used: true }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Token no encontrado o ya usado');
            }

            console.log('Token marcado como usado:', token.substring(0, 8) + '...');
            return true;
        } catch (error) {
            console.error('Error marcando token como usado:', error);
            throw error;
        }
    }

    async cleanExpiredTokens() {
        try {
            const result = await ResetTokenModel.deleteMany({
                createdAt: { $lt: new Date(Date.now() - 7200000) } // Más viejos que 2 horas
            });

            console.log(`🧹 Tokens expirados eliminados: ${result.deletedCount}`);
            return result.deletedCount;
        } catch (error) {
            console.error('Error limpiando tokens expirados:', error);
            throw error;
        }
    }

    async getUserTokens(userId) {
        try {
            return await ResetTokenModel.find({ userId }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error obteniendo tokens del usuario:', error);
            throw error;
        }
    }
}