import { Router } from 'express';
import { productDBManager } from '../dao/productDBManager.js';
import { cartDBManager } from '../dao/cartDBManager.js';
import { ticketDBManager } from '../dao/ticketDBManager.js';
import { CartRepository } from '../repository/CartRepository.js';
import { TicketRepository } from '../repository/TicketRepository.js';
import { authenticateCurrent, userOnlyCart, ensureOwnCart } from '../middlewares/auth.js';

const router = Router();
const ProductDAO = new productDBManager();
const CartDAO = new cartDBManager(ProductDAO);
const TicketDAO = new ticketDBManager();

const CartRepo = new CartRepository(CartDAO);
const TicketRepo = new TicketRepository(TicketDAO, ProductDAO);

router.get('/:cid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await CartRepo.getCartById(req.params.cid);
        res.send({
            status: 'success',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.post('/', authenticateCurrent, userOnlyCart, async (req, res) => {
    try {
        const result = await CartRepo.createCart();
        res.status(201).send({
            status: 'success',
            message: 'Carrito creado exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.post('/:cid/product/:pid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await cartRepository.addProductToCart(req.params.cid, req.params.pid);
        res.send({
            status: 'success',
            message: 'Producto agregado al carrito',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.delete('/:cid/product/:pid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await cartRepository.removeProductFromCart(req.params.cid, req.params.pid);
        res.send({
            status: 'success',
            message: 'Producto eliminado del carrito',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.put('/:cid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await cartRepository.updateCartProducts(req.params.cid, req.body.products);
        res.send({
            status: 'success',
            message: 'Carrito actualizado exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.put('/:cid/product/:pid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await cartRepository.updateProductQuantity(req.params.cid, req.params.pid, req.body.quantity);
        res.send({
            status: 'success',
            message: 'Cantidad actualizada exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.delete('/:cid', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await cartRepository.clearCart(req.params.cid);
        res.send({
            status: 'success',
            message: 'Carrito vaciado exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.post('/:cid/purchase', authenticateCurrent, userOnlyCart, ensureOwnCart, async (req, res) => {
    try {
        const result = await TicketRepo.processPurchase(req.params.cid, req.user.email);
        res.send({
            status: 'success',
            message: 'Compra procesada exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

export default router;