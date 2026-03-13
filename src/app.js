import express from 'express';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';

import productRouter from './routes/productRouter.js';
import cartRouter from './routes/cartRouter.js';
import viewsRouter from './routes/viewsRouter.js';
import sessionRouter from './routes/sessionRouter.js';
import userRouter from './routes/userRouter.js';
import __dirname from './utils/constantsUtil.js';
import websocket from './websocket.js';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuracion de MongoDB
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/entrega-final';
mongoose.connect(uri);

mongoose.connection.on('connected', () => {
    console.log('✅ Conectado a MongoDB Atlas exitosamente');
});

mongoose.connection.on('error', (error) => {
    console.error('❌ Error en la conexión a MongoDB:', error);
});

app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/../views');
app.set('view engine', 'handlebars');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

// Configurar Passport
app.use(passport.initialize());

app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/users', userRouter);
app.use('/', viewsRouter);

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas - Conectada' : 'Desconectada',
        environment: process.env.NODE_ENV || 'development'
    });
});

const PORT = process.env.PORT || 8080;
const httpServer = app.listen(PORT, () => {
    console.log(`🚀 Start server in PORT ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API Sessions: http://localhost:${PORT}/api/sessions`);
    console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
});

const io = new Server(httpServer);

websocket(io);