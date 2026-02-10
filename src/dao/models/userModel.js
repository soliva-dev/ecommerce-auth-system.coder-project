import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
    },
    age: {
        type: Number,
        required: true,
        min: 1,
        max: 120
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts'
    },
    role: {
        type: String,
        enum: ['user', 'premium', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Middleware para hashear la pass antes de guardar usando bcrypt.hashSync
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = bcrypt.hashSync(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

// Metodo para comparar contraseñas
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};

// Metodo para obtener el usuario sin la contraseña
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

export const userModel = mongoose.model(userCollection, userSchema);