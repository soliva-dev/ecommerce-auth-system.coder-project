import mongoose from 'mongoose';

// Schema para tokens de reset de contraseña
const resetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // El token expira en 1 hora (3600 segundos)
    },
    used: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'resetTokens'
});

resetTokenSchema.index({ token: 1 });
resetTokenSchema.index({ userId: 1 });

export default mongoose.model('ResetToken', resetTokenSchema);