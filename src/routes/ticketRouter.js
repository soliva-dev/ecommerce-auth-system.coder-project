import { Router } from 'express';
import { ticketDBManager } from '../dao/ticketDBManager.js';
import { productDBManager } from '../dao/productDBManager.js';
import { cartDBManager } from '../dao/cartDBManager.js';
import { TicketRepository } from '../repository/ticketRepository.js';
import { ProductRepository } from '../repository/productRepository.js';
import { CartRepository } from '../repository/cartRepository.js';
import { TicketDTO, PurchaseResponseDTO } from '../dto/ticketDTO.js';
import { authenticateCurrent, authorize, ensureOwnTickets } from '../middlewares/auth.js';

const router = Router();

// Instanciar DAOs
const TicketDAO = new ticketDBManager();
const ProductDAO = new productDBManager();
const CartDAO = new cartDBManager();

// Instanciar Repositories (Patrón Repository)
const ProductRepo = new ProductRepository(ProductDAO);
const TicketRepo = new TicketRepository(TicketDAO, ProductRepo);
const CartRepo = new CartRepository(CartDAO, ProductRepo);

/**
 * GET /api/tickets
 * Obtener tickets (admin: todos, usuario: solo suyos)
 */
router.get('/', authenticateCurrent, ensureOwnTickets, async (req, res) => {
    try {
        let tickets;
        
        if (req.user.role === 'admin') {
            // Admin ve todos los tickets
            tickets = await TicketRepo.getAllTickets(req.query);
        } else {
            // Usuario ve solo sus tickets
            tickets = await TicketRepo.getTicketsByPurchaser(req.user.email);
            
            // Formatear para ser consistente con la paginación
            tickets = {
                docs: tickets,
                totalDocs: tickets.length,
                limit: tickets.length,
                page: 1,
                totalPages: 1,
                hasPrevPage: false,
                hasNextPage: false
            };
        }
        
        // Convertir a DTOs
        const ticketsDTO = tickets.docs.map(ticket => new TicketDTO(ticket));
        
        res.status(200).send({
            status: 'success',
            message: 'Tickets obtenidos exitosamente',
            payload: {
                ...tickets,
                docs: ticketsDTO
            }
        });
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/tickets/:id
 * Obtener ticket específico
 */
router.get('/:id', authenticateCurrent, async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await TicketRepo.getTicketById(id);
        
        // Verificar permisos
        if (req.user.role !== 'admin' && ticket.purchaser !== req.user.email) {
            return res.status(403).send({
                status: 'error',
                message: 'No tienes permisos para ver este ticket'
            });
        }
        
        const ticketDTO = new TicketDTO(ticket);
        
        res.status(200).send({
            status: 'success',
            message: 'Ticket obtenido exitosamente',
            payload: ticketDTO
        });
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/tickets/:cid/purchase
 * LÓGICA DE COMPRA CRÍTICA - Procesar compra de carrito
 * CRITERIO: Verificar stock, generar ticket, manejar compras completas/incompletas
 */
router.post('/:cid/purchase', authenticateCurrent, async (req, res) => {
    try {
        const { cid } = req.params;
        
        // Verificar que el carrito pertenece al usuario (o es admin)
        if (req.user.role !== 'admin') {
            if (!req.user.cart || req.user.cart._id.toString() !== cid) {
                return res.status(403).send({
                    status: 'error',
                    message: 'No puedes procesar este carrito'
                });
            }
        }
        
        // Obtener carrito con productos
        const cart = await CartRepo.getCartById(cid);
        
        if (!cart.products || cart.products.length === 0) {
            return res.status(400).send({
                status: 'error',
                message: 'El carrito está vacío'
            });
        }
        
        // Validar carrito antes de procesar
        const validation = await CartRepo.validateCartForPurchase(cid);
        
        // Procesar compra (LÓGICA DE NEGOCIO CRÍTICA)
        const purchaseResult = await TicketRepo.processPurchase(
            cart.products, 
            req.user.email
        );
        
        // Si se procesaron productos, limpiar carrito
        if (purchaseResult.status !== 'failed') {
            // Remover solo los productos procesados del carrito
            for (const processedItem of purchaseResult.productsProcessed) {
                await CartRepo.removeProductFromCart(cid, processedItem.product);
            }
        }
        
        // Crear DTO de respuesta
        const responseDTO = new PurchaseResponseDTO(purchaseResult);
        
        // Determinar código de respuesta HTTP
        let statusCode = 200;
        if (purchaseResult.status === 'failed') {
            statusCode = 400;
        } else if (purchaseResult.status === 'partial') {
            statusCode = 206; // Partial Content
        }
        
        res.status(statusCode).send({
            status: 'success',
            message: purchaseResult.message,
            payload: responseDTO
        });
        
    } catch (error) {
        console.error('Error al procesar compra:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error al procesar la compra',
            error: error.message
        });
    }
});

/**
 * PUT /api/tickets/:id/status
 * Actualizar status de ticket (solo admin)
 */
router.put('/:id/status', authenticateCurrent, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).send({
                status: 'error',
                message: 'Status es requerido'
            });
        }
        
        const updatedTicket = await TicketRepo.updateTicketStatus(id, status);
        const ticketDTO = new TicketDTO(updatedTicket);
        
        res.status(200).send({
            status: 'success',
            message: 'Status del ticket actualizado exitosamente',
            payload: ticketDTO
        });
    } catch (error) {
        console.error('Error al actualizar status:', error);
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/tickets/:id/cancel
 * Cancelar ticket y restaurar stock (solo admin o propietario)
 */
router.post('/:id/cancel', authenticateCurrent, async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await TicketRepo.getTicketById(id);
        
        // Verificar permisos
        if (req.user.role !== 'admin' && ticket.purchaser !== req.user.email) {
            return res.status(403).send({
                status: 'error',
                message: 'No tienes permisos para cancelar este ticket'
            });
        }
        
        const cancelledTicket = await TicketRepo.cancelTicket(id);
        const ticketDTO = new TicketDTO(cancelledTicket);
        
        res.status(200).send({
            status: 'success',
            message: 'Ticket cancelado exitosamente y stock restaurado',
            payload: ticketDTO
        });
    } catch (error) {
        console.error('Error al cancelar ticket:', error);
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * DELETE /api/tickets/:id
 * Eliminar ticket (solo admin)
 */
router.delete('/:id', authenticateCurrent, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await TicketRepo.ticketDAO.deleteTicket(id);
        
        res.status(200).send({
            status: 'success',
            message: 'Ticket eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

export default router;