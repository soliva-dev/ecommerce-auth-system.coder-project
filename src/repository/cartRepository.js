/**
 * Repository para la lógica de negocio de carritos
 * Encapsula el acceso a datos y proporciona una interfaz limpia
 */
export class CartRepository {
    constructor(cartDAO, productRepository) {
        this.cartDAO = cartDAO;
        this.productRepository = productRepository;
    }

    async getAllCarts() {
        try {
            return await this.cartDAO.getAllCarts();
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener carrito por ID
    async getCartById(id) {
        try {
            const cart = await this.cartDAO.getProductsFromCartByID(id);
            if (!cart) {
                throw new Error(`Carrito ${id} no encontrado`);
            }
            return cart;
        } catch (error) {
            throw error;
        }
    }
    
    // Crear carrito
    async createCart() {
        try {
            return await this.cartDAO.createCart();
        } catch (error) {
            throw error;
        }
    }
    
    // Agregar producto al carrito con validaciones de negocio
    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            // Validaciones básicas
            if (quantity <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }
            
            // Verificar que el carrito existe
            const cart = await this.getCartById(cartId);
            
            // Verificar que el producto existe y tiene stock
            const product = await this.productRepository.getProductById(productId);
            
            if (product.stock < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
            }
            
            // Verificar si el producto ya está en el carrito
            const existingItem = cart.products.find(item => 
                item.product._id.toString() === productId
            );
            
            if (existingItem) {
                // Producto ya existe, verificar stock total
                const totalQuantity = existingItem.quantity + quantity;
                if (product.stock < totalQuantity) {
                    throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Total solicitado: ${totalQuantity}`);
                }
                
                // Actualizar cantidad
                return await this.cartDAO.updateProductQuantityInCart(cartId, productId, totalQuantity);
            } else {
                // Agregar nuevo producto
                return await this.cartDAO.addProductToCart(cartId, productId, quantity);
            }
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar cantidad de producto en carrito
    async updateProductQuantity(cartId, productId, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }
            
            // Verificar que el carrito existe
            await this.getCartById(cartId);
            
            // Verificar stock disponible
            const product = await this.productRepository.getProductById(productId);
            if (product.stock < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
            }
            
            return await this.cartDAO.updateProductQuantityInCart(cartId, productId, quantity);
        } catch (error) {
            throw error;
        }
    }
    
    // Remover producto del carrito
    async removeProductFromCart(cartId, productId) {
        try {
            // Verificar que el carrito existe
            await this.getCartById(cartId);
            
            return await this.cartDAO.removeProductFromCart(cartId, productId);
        } catch (error) {
            throw error;
        }
    }
    
    // Vaciar carrito
    async clearCart(cartId) {
        try {
            // Verificar que el carrito existe
            await this.getCartById(cartId);
            
            return await this.cartDAO.clearCart(cartId);
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar todos los productos del carrito
    async updateCartProducts(cartId, products) {
        try {
            // Verificar que el carrito existe
            await this.getCartById(cartId);
            
            // Validar estructura de productos
            if (!Array.isArray(products)) {
                throw new Error('Products debe ser un array');
            }
            
            // Validar cada producto
            for (const item of products) {
                if (!item.product || !item.quantity || item.quantity <= 0) {
                    throw new Error('Cada producto debe tener product ID y quantity > 0');
                }
                
                // Verificar que el producto existe y tiene stock
                const product = await this.productRepository.getProductById(item.product);
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.title}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                }
            }
            
            return await this.cartDAO.updateCartProducts(cartId, products);
        } catch (error) {
            throw error;
        }
    }

    // Calcular total del carrito
    async calculateCartTotal(cartId) {
        try {
            const cart = await this.getCartById(cartId);
            
            let total = 0;
            let totalItems = 0;
            
            for (const item of cart.products) {
                if (item.product) {
                    total += item.product.price * item.quantity;
                    totalItems += item.quantity;
                }
            }
            
            return {
                total,
                totalItems,
                products: cart.products.length
            };
        } catch (error) {
            throw error;
        }
    }
    
    // Validar carrito antes de compra
    async validateCartForPurchase(cartId) {
        try {
            const cart = await this.getCartById(cartId);
            
            if (!cart.products || cart.products.length === 0) {
                throw new Error('El carrito está vacío');
            }
            
            const validationResults = {
                valid: true,
                errors: [],
                warnings: []
            };
            
            // Validar cada producto
            for (const item of cart.products) {
                try {
                    const product = await this.productRepository.getProductById(item.product._id);
                    
                    // Verificar stock
                    if (product.stock < item.quantity) {
                        validationResults.valid = false;
                        validationResults.errors.push({
                            product: product.title,
                            error: `Stock insuficiente: disponible ${product.stock}, solicitado ${item.quantity}`
                        });
                    } else if (product.stock < item.quantity * 2) {
                        // Advertencia de stock bajo
                        validationResults.warnings.push({
                            product: product.title,
                            warning: `Stock bajo: disponible ${product.stock}`
                        });
                    }
                } catch (error) {
                    validationResults.valid = false;
                    validationResults.errors.push({
                        product: item.product._id,
                        error: 'Producto no encontrado'
                    });
                }
            }
            
            return validationResults;
        } catch (error) {
            throw error;
        }
    }
    
    // Eliminar carrito
    async deleteCart(cartId) {
        try {
            // Verificar que el carrito existe
            await this.getCartById(cartId);
            
            return await this.cartDAO.deleteCart(cartId);
        } catch (error) {
            throw error;
        }
    }
}