import { Router } from 'express';
import { productDBManager } from '../dao/productDBManager.js';
import { ProductRepository } from '../repository/productRepository.js';
import { uploader } from '../utils/multerUtil.js';
import { authenticateCurrent, adminOnlyProducts } from '../middlewares/auth.js';

const router = Router();
const ProductDAO = new productDBManager();
const ProductRepo = new ProductRepository(ProductDAO);

router.get('/', async (req, res) => {
    try {
        const result = await ProductRepo.getAllProducts(req.query);
        res.send({
            status: 'success',
            payload: result
        });
    } catch (error) {
        res.status(500).send({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/:pid', async (req, res) => {
    try {
        const result = await ProductRepo.getProductById(req.params.pid);
        res.send({
            status: 'success',
            payload: result
        });
    } catch (error) {
        res.status(404).send({
            status: 'error',
            message: error.message
        });
    }
});

router.post('/', authenticateCurrent, adminOnlyProducts, uploader.array('thumbnails', 3), async (req, res) => {
    if (req.files) {
        req.body.thumbnails = [];
        req.files.forEach((file) => {
            req.body.thumbnails.push(file.path);
        });
    }

    try {
        const result = await ProductRepo.createProduct(req.body);
        res.status(201).send({
            status: 'success',
            message: 'Producto creado exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.put('/:pid', authenticateCurrent, adminOnlyProducts, uploader.array('thumbnails', 3), async (req, res) => {
    if (req.files) {
        req.body.thumbnails = [];
        req.files.forEach((file) => {
            req.body.thumbnails.push(file.path);
        });
    }

    try {
        const result = await ProductRepo.updateProduct(req.params.pid, req.body);
        res.send({
            status: 'success',
            message: 'Producto actualizado exitosamente',
            payload: result
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

router.delete('/:pid', authenticateCurrent, adminOnlyProducts, async (req, res) => {
    try {
        await ProductRepo.deleteProduct(req.params.pid);
        res.send({
            status: 'success',
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        });
    }
});

export default router;