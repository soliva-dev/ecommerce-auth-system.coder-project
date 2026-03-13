import { ticketModel } from './models/ticketModel.js';

export class ticketDBManager {
    constructor() {
        console.log("Working with tickets from database");
    }
    
    // Crear un nuevo ticket
    async createTicket(ticketData) {
        try {
            const newTicket = new ticketModel(ticketData);
            
            // Calcular monto automáticamente
            newTicket.calculateAmount();
            
            await newTicket.save();
            return await ticketModel.findById(newTicket._id).populate('products.product');
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener ticket por ID
    async getTicketById(id) {
        try {
            return await ticketModel.findById(id).populate('products.product');
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener ticket por código
    async getTicketByCode(code) {
        try {
            return await ticketModel.findOne({ code }).populate('products.product');
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener tickets por email del comprador
    async getTicketsByPurchaser(email) {
        try {
            return await ticketModel.find({ purchaser: email })
                .populate('products.product')
                .sort({ purchase_datetime: -1 });
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener todos los tickets (con paginación)
    async getAllTickets(params = {}) {
        try {
            const page = params.page ? parseInt(params.page) : 1;
            const limit = params.limit ? parseInt(params.limit) : 10;
            const skip = (page - 1) * limit;
            
            const tickets = await ticketModel.find()
                .populate('products.product')
                .sort({ purchase_datetime: -1 })
                .skip(skip)
                .limit(limit);
                
            const total = await ticketModel.countDocuments();
            
            return {
                docs: tickets,
                totalDocs: total,
                limit,
                page,
                totalPages: Math.ceil(total / limit),
                hasPrevPage: page > 1,
                hasNextPage: page < Math.ceil(total / limit)
            };
        } catch (error) {
            throw error;
        }
    }
    
    // Actualizar status del ticket
    async updateTicketStatus(id, status) {
        try {
            const validStatuses = ['completed', 'partial', 'pending', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Status inválido: ${status}`);
            }
            
            return await ticketModel.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            ).populate('products.product');
        } catch (error) {
            throw error;
        }
    }
    
    // Eliminar ticket (solo para admin)
    async deleteTicket(id) {
        try {
            const result = await ticketModel.findByIdAndDelete(id);
            if (!result) {
                throw new Error(`Ticket ${id} no encontrado`);
            }
            return result;
        } catch (error) {
            throw error;
        }
    }
}