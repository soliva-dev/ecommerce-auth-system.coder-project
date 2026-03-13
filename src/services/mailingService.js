import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailingService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
    }

    async sendPasswordResetEmail(userEmail, resetUrl, userName = '') {
        try {
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: userEmail,
                subject: 'Restablecer Contraseña - E-commerce Backend',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <h2 style="color: #333; text-align: center;">Restablecer Contraseña</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                            <p>Hola ${userName ? userName : 'Usuario'},</p>
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background-color: #007bff; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Restablecer Contraseña
                                </a>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Este enlace expirará en 1 hora por seguridad.
                            </p>
                            <p style="color: #666; font-size: 14px;">
                                Si no solicitaste este cambio, puedes ignorar este correo.
                            </p>
                        </div>
                        <footer style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
                            <p>E-commerce Backend - Sistema de Gestión</p>
                        </footer>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email de recuperación enviado:', result.messageId);
            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('Error enviando email:', error);
            throw new Error('Error enviando email de recuperación');
        }
    }

    async sendWelcomeEmail(userEmail, userName) {
        try {
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: userEmail,
                subject: 'Bienvenido a nuestro E-commerce',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <h2 style="color: #28a745; text-align: center;">¡Bienvenido!</h2>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                            <p>Hola ${userName},</p>
                            <p>¡Tu cuenta ha sido creada exitosamente en nuestro e-commerce!</p>
                            <p>Ya puedes comenzar a explorar nuestros productos y realizar compras.</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <p style="font-weight: bold; color: #28a745;">¡Disfruta tu experiencia de compra!</p>
                            </div>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email de bienvenida enviado:', result.messageId);
            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('Error enviando email de bienvenida:', error);
            // No arrojar error para bienvenida, es opcional
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new MailingService();