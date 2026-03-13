import { userModel } from './models/userModel.js';
import { cartModel } from './models/cartModel.js';

export class userDBManager {
    constructor() {
        console.log("Working with users from database");
    }
    
    async createUser(userData) {
        try {
            const existingUser = await userModel.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('El usuario ya existe con ese email');
            }
            
            const newCart = new cartModel({
                products: []
            });
            await newCart.save();
            
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
    
    async getUserByEmail(email) {
        try {
            return await userModel.findOne({ email }).populate('cart');
        } catch (error) {
            throw error;
        }
    }
    
    async getUserById(id) {
        try {
            return await userModel.findById(id).populate('cart');
        } catch (error) {
            throw error;
        }
    }
    
    async getAllUsers() {
        try {
            return await userModel.find().populate('cart').select('-password');
        } catch (error) {
            throw error;
        }
    }
    
    async updateUser(id, updateData) {
        try {
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
    
    async deleteUser(id) {
        try {
            const user = await userModel.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            if (user.cart) {
                await cartModel.findByIdAndDelete(user.cart);
            }
            
            return await userModel.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
    
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

    async updateUserPassword(id, hashedPassword) {
        try {
            const result = await userModel.findByIdAndUpdate(
                id,
                { password: hashedPassword },
                { new: true }
            );
            
            if (!result) {
                throw new Error('Usuario no encontrado');
            }
            
            console.log('✅ Contraseña actualizada para usuario:', result.email);
            return result;
        } catch (error) {
            console.error('❌ Error actualizando contraseña:', error);
            throw error;
        }
    }
}