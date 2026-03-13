import mongoose from 'mongoose';

const ticketCollection = 'tickets';

const ticketSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    purchase_datetime: {
        type: Date,
        default: Date.now,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    purchaser: {
        type: String,
        required: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    status: {
        type: String,
        enum: ['completed', 'partial', 'pending', 'cancelled'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Generar código único antes de guardar
ticketSchema.pre('save', function(next) {
    if (!this.code) {
        this.code = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    next();
});


ticketSchema.methods.calculateAmount = function() {
    this.amount = this.products.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    return this.amount;
};

export const ticketModel = mongoose.model(ticketCollection, ticketSchema);