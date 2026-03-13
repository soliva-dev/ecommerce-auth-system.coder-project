/**
 * Repository para la lógica de negocio de productos
 * Encapsula el acceso a datos y proporciona una interfaz limpia
 */
export class ProductRepository {
    constructor(productDAO) {
        this.productDAO = productDAO;
    }
    
    // Obtener todos los productos con lógica de negocio
    async getAllProducts(params = {}) {
        try {
            return await this.productDAO.getAllProducts(params);
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener producto por ID con validaciones
    async getProductById(id) {
        try {
            const product = await this.productDAO.getProductByID(id);
            if (!product) {
                throw new Error(`Producto ${id} no encontrado`);
            }
            return product;
        } catch (error) {
            throw error;
        }
    }
    
    // Crear producto con validaciones de negocio
    async createProduct(productData) {
        try {
            // Validaciones de negocio
            const { title, description, code, price, stock, category } = productData;
            
            if (!title || !description || !code || price === undefined || stock === undefined || !category) {
                throw new Error('Todos los campos obligatorios deben estar presentes');
            }
            
            if (price < 0) {
                throw new Error('El precio no puede ser negativo');
            }
            
            if (stock < 0) {
                throw new Error('El stock no puede ser negativo');
            }
            
            // Verificar que el código del producto sea único
            try {
                const existingProduct = await this.productDAO.getAllProducts({});
                const codeExists = existingProduct.docs?.some(p => p.code === code);
                if (codeExists) {
                    throw new Error(`El código ${code} ya existe`);
                }
            } catch (error) {
                // Si hay error al verificar, continuar (podría ser base de datos vacía)
            }
            
            return await this.productDAO.createProduct(productData);
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar producto con validaciones
    async updateProduct(id, updateData) {
        try {
            // Verificar que el producto existe
            await this.getProductById(id);
            
            // Validaciones de negocio
            if (updateData.price !== undefined && updateData.price < 0) {
                throw new Error('El precio no puede ser negativo');
            }
            
            if (updateData.stock !== undefined && updateData.stock < 0) {
                throw new Error('El stock no puede ser negativo');
            }
            
            // Verificar unicidad del código si se está actualizando
            if (updateData.code) {
                const allProducts = await this.productDAO.getAllProducts({});
                const codeExists = allProducts.docs?.some(p => p.code === updateData.code && p._id.toString() !== id);
                if (codeExists) {
                    throw new Error(`El código ${updateData.code} ya existe`);
                }
            }
            
            const result = await this.productDAO.updateProduct(id, updateData);
            if (result.matchedCount === 0) {
                throw new Error(`Producto ${id} no encontrado`);
            }
            
            return await this.getProductById(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Eliminar producto
    async deleteProduct(id) {
        try {
            // Verificar que el producto existe
            await this.getProductById(id);
            
            return await this.productDAO.deleteProduct(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Reducir stock de producto (para compras)
    async reduceStock(id, quantity) {
        try {
            const product = await this.getProductById(id);
            
            if (product.stock < quantity) {
                throw new Error(`Stock insuficiente para el producto ${product.title}. Disponible: ${product.stock}, Solicitado: ${quantity}`);
            }
            
            const newStock = product.stock - quantity;
            await this.updateProduct(id, { stock: newStock });
            
            return await this.getProductById(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Verificar disponibilidad de stock
    async checkStock(id, quantity) {
        try {
            const product = await this.getProductById(id);
            return product.stock >= quantity;
        } catch (error) {
            return false;
        }
    }
    
    // Obtener productos con stock bajo (para alertas)
    async getLowStockProducts(threshold = 5) {
        try {
            const allProducts = await this.productDAO.getAllProducts({});
            return allProducts.docs?.filter(product => product.stock <= threshold) || [];
        } catch (error) {
            throw error;
        }
    }
}