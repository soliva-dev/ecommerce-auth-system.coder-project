/**
 * Repository para la lógica de negocio de tickets
 * Encapsula el acceso a datos y proporciona una interfaz limpia
 */
export class TicketRepository {
    constructor(ticketDAO, productRepository) {
        this.ticketDAO = ticketDAO;
        this.productRepository = productRepository;
    }

    async createTicket(ticketData) {
        try {
            // Validaciones básicas
            if (!ticketData.purchaser || !ticketData.products || ticketData.products.length === 0) {
                throw new Error('Purchaser y productos son requeridos');
            }
            
            // Validar email del comprador
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(ticketData.purchaser)) {
                throw new Error('Email del comprador inválido');
            }
            
            return await this.ticketDAO.createTicket(ticketData);
        } catch (error) {
            throw error;
        }
    }
    
    // Procesar compra completa (lógica de negocio crítica)
    async processPurchase(cartProducts, purchaserEmail) {
        try {
            const productsProcessed = [];
            const productsNotProcessed = [];
            let totalAmount = 0;
            
            // Verificar stock y separar productos
            for (const item of cartProducts) {
                try {
                    const product = await this.productRepository.getProductById(item.product);
                    
                    if (product.stock >= item.quantity) {
                        // Producto disponible - agregar a procesados
                        productsProcessed.push({
                            product: product._id,
                            title: product.title,
                            price: product.price,
                            quantity: item.quantity
                        });
                        totalAmount += product.price * item.quantity;
                    } else {
                        // Stock insuficiente - agregar a no procesados
                        productsNotProcessed.push({
                            product: product._id,
                            title: product.title,
                            requestedQuantity: item.quantity,
                            availableStock: product.stock,
                            reason: 'Stock insuficiente'
                        });
                    }
                } catch (error) {
                    // Producto no encontrado
                    productsNotProcessed.push({
                        product: item.product,
                        requestedQuantity: item.quantity,
                        reason: 'Producto no encontrado'
                    });
                }
            }
            
            let ticket = null;
            let status = 'failed';
            let message = '';
            
            // Si hay productos para procesar, crear ticket
            if (productsProcessed.length > 0) {
                // Reducir stock de productos procesados
                for (const item of productsProcessed) {
                    await this.productRepository.reduceStock(item.product, item.quantity);
                }
                
                const ticketData = {
                    purchaser: purchaserEmail,
                    amount: totalAmount,
                    products: productsProcessed
                };
                
                ticket = await this.createTicket(ticketData);
                
                // Determinar status de la compra
                if (productsNotProcessed.length === 0) {
                    status = 'completed';
                    message = 'Compra completada exitosamente';
                } else {
                    status = 'partial';
                    message = `Compra parcial: ${productsProcessed.length} productos procesados, ${productsNotProcessed.length} no disponibles`;
                }
            } else {
                status = 'failed';
                message = 'No se pudo procesar ningún producto de la compra';
            }
            
            return {
                ticket,
                productsProcessed,
                productsNotProcessed,
                totalAmount,
                status,
                message
            };
            
        } catch (error) {
            throw error;
        }
    }

    async getTicketById(id) {
        try {
            const ticket = await this.ticketDAO.getTicketById(id);
            if (!ticket) {
                throw new Error('Ticket no encontrado');
            }
            return ticket;
        } catch (error) {
            throw error;
        }
    }

    async getTicketsByPurchaser(email) {
        try {
            return await this.ticketDAO.getTicketsByPurchaser(email);
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener todos los tickets (admin)
    async getAllTickets(params = {}) {
        try {
            return await this.ticketDAO.getAllTickets(params);
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar status del ticket
    async updateTicketStatus(id, status) {
        try {
            const validStatuses = ['completed', 'partial', 'pending', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Status inválido: ${status}. Debe ser uno de: ${validStatuses.join(', ')}`);
            }
            
            const ticket = await this.getTicketById(id);
            if (!ticket) {
                throw new Error('Ticket no encontrado');
            }
            
            return await this.ticketDAO.updateTicketStatus(id, status);
        } catch (error) {
            throw error;
        }
    }
    
    // Cancelar ticket y restaurar stock
    async cancelTicket(id) {
        try {
            const ticket = await this.getTicketById(id);
            
            if (ticket.status === 'cancelled') {
                throw new Error('El ticket ya está cancelado');
            }
            
            // Restaurar stock de productos
            for (const item of ticket.products) {
                try {
                    const currentProduct = await this.productRepository.getProductById(item.product._id);
                    const newStock = currentProduct.stock + item.quantity;
                    await this.productRepository.updateProduct(item.product._id, { stock: newStock });
                } catch (error) {
                    console.warn(`No se pudo restaurar stock del producto ${item.product._id}: ${error.message}`);
                }
            }
            
            // Actualizar status del ticket
            return await this.updateTicketStatus(id, 'cancelled');
        } catch (error) {
            throw error;
        }
    }
}