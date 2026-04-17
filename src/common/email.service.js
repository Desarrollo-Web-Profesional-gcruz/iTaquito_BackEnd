const nodemailer = require('nodemailer');

/**
 * Servicio centralizado para el envío de correos electrónicos.
 * Migrado de Resend a Nodemailer (Gmail SMTP) para evitar limitaciones de sandbox en producción.
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 465, // Usamos 465 para SSL (más estable en producción que 587)
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // No fallar si el certificado es auto-firmado (común en algunos entornos de red)
        rejectUnauthorized: false
      }
    });

    // Verificar conexión al iniciar para facilitar debugging
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error en configuración SMTP:', error.message);
      } else {
        console.log('✅ Servidor de correos (SMTP) listo para enviar.');
      }
    });
  }

  /**
   * Envía un correo electrónico.
   * @param {Object} options - Opciones de envío.
   * @param {string} options.to - Destinatario.
   * @param {string} options.subject - Asunto.
   * @param {string} options.html - Contenido HTML.
   * @param {string} [options.text] - Contenido texto plano.
   * @param {Array} [options.attachments] - Archivos adjuntos.
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Credenciales de EMAIL no configuradas en .env. No se puede enviar correo.');
      return { success: false, message: 'Servicio de correo no configurado' };
    }

    try {
      const mailOptions = {
        from: `"iTaquito 🌮" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || 'Se adjunta la información solicitada de iTaquito.',
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Correo enviado exitosamente:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('--- ❌ ERROR SMTP ---');
      console.error('Mensaje:', error.message);
      console.error('Código:', error.code);
      console.error('----------------------');
      throw error;
    }
  }
}

module.exports = new EmailService();