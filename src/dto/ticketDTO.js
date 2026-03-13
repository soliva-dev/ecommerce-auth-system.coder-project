/**
 * DTO para transferir datos del ticket de compra
 */
export class TicketDTO {
    constructor(ticket) {
        this.id = ticket._id;
        this.code = ticket.code;
        this.purchase_datetime = ticket.purchase_datetime;
        this.amount = ticket.amount;
        this.purchaser = ticket.purchaser;
        this.products = ticket.products || [];
        this.status = ticket.status || 'completed';
    }
}

/**
 * DTO para respuesta de compra (incluye productos no procesados)
 */
export class PurchaseResponseDTO {
    constructor(data) {
        this.ticket = data.ticket ? new TicketDTO(data.ticket) : null;
        this.productsNotProcessed = data.productsNotProcessed || [];
        this.productsProcessed = data.productsProcessed || [];
        this.totalAmount = data.totalAmount || 0;
        this.status = data.status; // 'completed', 'partial', 'failed'
        this.message = data.message;
    }
}