import dotenv from 'dotenv';
import mailingService from './src/services/mailingService.js';

// Cargar variables de entorno
dotenv.config();

console.log('🧪 TESTING CONFIGURACIÓN DE GMAIL\n');

async function testGmailConfig() {
    try {
        // Verificar variables de entorno
        console.log('📧 Email configurado:', process.env.GMAIL_USER);
        console.log('🔑 Password configurado:', process.env.GMAIL_PASS ? '✅ Configurado' : '❌ No configurado');
        
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            console.log('\n❌ ERROR: Variables de entorno no configuradas correctamente');
            console.log('Verifica que .env contenga GMAIL_USER y GMAIL_PASS');
            return;
        }

        console.log('\n📤 Enviando email de prueba...');
        
        // Enviar email de prueba
        const testUrl = 'http://localhost:8080/api/sessions/reset-password?token=TEST_TOKEN_123';
        
        const result = await mailingService.sendPasswordResetEmail(
            process.env.GMAIL_USER, // Enviarse a sí mismo
            testUrl,
            'Usuario de Prueba'
        );

        if (result.success) {
            console.log('✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
            console.log('📧 Message ID:', result.messageId);
            console.log('\n🎉 CONFIGURACIÓN GMAIL FUNCIONA CORRECTAMENTE');
            console.log('📬 Revisa tu bandeja de entrada:', process.env.GMAIL_USER);
            console.log('📁 Si no lo ves, revisa la carpeta de spam');
        } else {
            console.log('❌ Error enviando email:', result.error);
        }

    } catch (error) {
        console.error('❌ ERROR DE CONFIGURACIÓN:');
        console.error(error.message);
        
        if (error.message.includes('Invalid login')) {
            console.log('\n💡 SOLUCIONES:');
            console.log('1. Verifica que la App Password sea correcta');
            console.log('2. Asegúrate de que 2-Step Verification esté activa');
            console.log('3. Regenera la App Password si es necesario');
        }
    }
}

testGmailConfig();