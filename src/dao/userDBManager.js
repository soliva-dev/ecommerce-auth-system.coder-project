import { userModel } from './models/userModel.js';
import { cartModel } from './models/cartModel.js';

export class userDBManager {
    constructor() {
        console.log("Working with users from database");
    }
    
    // Crear un nuevo usuario
    async createUser(userData) {
        try {
            // Verificar si el usuario ya existe
            const existingUser = await userModel.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('El usuario ya existe con ese email');
            }
            
            // Crear carrito para el nuevo usuario
            const newCart = new cartModel({
                products: []
            });
            await newCart.save();
            
            // Crear nuevo usuario con referencia al carrito
            const newUser = new userModel({
                ...userData,
                cart: newCart._id
            });
            
            await newUser.save();
            
            const populatedUser = await userModel.findById(newUser._id).populate('cart');
            return populatedUser;
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener usuario por email
    async getUserByEmail(email) {
        try {
            return await userModel.findOne({ email }).populate('cart');
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener usuario por ID
    async getUserById(id) {
        try {
            return await userModel.findById(id).populate('cart');
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener todos los usuarios
    async getAllUsers() {
        try {
            return await userModel.find().populate('cart').select('-password');
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar usuario
    async updateUser(id, updateData) {
        try {
            // No permitir actualizar la contraseña directamente (requiere hash)
            if (updateData.password) {
                delete updateData.password;
            }
            
            return await userModel.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            ).populate('cart');
        } catch (error) {
            throw error;
        }
    }
    
    // Eliminar usuario
    async deleteUser(id) {
        try {
            const user = await userModel.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Eliminar el carrito asociado
            if (user.cart) {
                await cartModel.findByIdAndDelete(user.cart);
            }
            
            // Eliminar el usuario
            return await userModel.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Cambiar rol del usuario
    async changeUserRole(id, newRole) {
        try {
            return await userModel.findByIdAndUpdate(
                id,
                { role: newRole },
                { new: true }
            ).populate('cart');
        } catch (error) {
            throw error;
        }
    }
}