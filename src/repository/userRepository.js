/**
 * Repository para la lógica de negocio de usuarios
 * Encapsula el acceso a datos y proporciona una interfaz limpia
 */
export class UserRepository {
    constructor(userDAO) {
        this.userDAO = userDAO;
    }

    async createUser(userData) {
        try {
            // Validaciones de negocio
            if (!userData.email || !userData.password) {
                throw new Error('Email y password son requeridos');
            }
            
            // Verificar si el email ya existe
            const existingUser = await this.userDAO.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            return await this.userDAO.createUser(userData);
        } catch (error) {
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const user = await this.userDAO.getUserById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.userDAO.getUserByEmail(email);
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await this.userDAO.getAllUsers();
        } catch (error) {
            throw error;
        }
    }

    async updateUser(id, updateData) {
        try {
            // Verificar que el usuario existe
            const existingUser = await this.getUserById(id);
            if (!existingUser) {
                throw new Error('Usuario no encontrado');
            }
            
            // No permitir actualizar email a uno que ya existe
            if (updateData.email && updateData.email !== existingUser.email) {
                const emailExists = await this.userDAO.getUserByEmail(updateData.email);
                if (emailExists) {
                    throw new Error('El email ya está en uso por otro usuario');
                }
            }
            
            return await this.userDAO.updateUser(id, updateData);
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            const user = await this.getUserById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Lógica adicional: No permitir eliminar el último admin
            if (user.role === 'admin') {
                const allUsers = await this.getAllUsers();
                const adminCount = allUsers.filter(u => u.role === 'admin').length;
                if (adminCount <= 1) {
                    throw new Error('No se puede eliminar el último administrador');
                }
            }
            
            return await this.userDAO.deleteUser(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Cambiar rol con validaciones de negocio
    async changeUserRole(id, newRole) {
        try {
            const validRoles = ['user', 'premium', 'admin'];
            if (!validRoles.includes(newRole)) {
                throw new Error(`Rol inválido: ${newRole}`);
            }
            
            const user = await this.getUserById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // No permitir cambiar rol si es el último admin
            if (user.role === 'admin' && newRole !== 'admin') {
                const allUsers = await this.getAllUsers();
                const adminCount = allUsers.filter(u => u.role === 'admin').length;
                if (adminCount <= 1) {
                    throw new Error('No se puede cambiar el rol del único administrador');
                }
            }
            
            return await this.userDAO.changeUserRole(id, newRole);
        } catch (error) {
            throw error;
        }
    }
}