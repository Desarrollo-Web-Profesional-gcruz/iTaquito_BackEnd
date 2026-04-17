const nodemailer = require('nodemailer');

/**
 * Servicio para el envío de correos electrónicos.
 * Utiliza las credenciales configuradas en el archivo .env.
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true, // true para 465, false para otros puertos (como 587)
      requireTLS: true,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Ayuda en entornos locales
      }
    });
  }

  /**
   * Envía un correo electrónico.
   * @param {Object} options - Opciones del correo (to, subject, html, text, attachments)
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"iTaquito 🌮" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('--- DEBUG EMAIL ERROR ---');
      console.error('Code:', error.code);
      console.error('Response:', error.response);
      console.error('Message:', error.message);
      console.error('--------------------------');
      throw error;
    }
  }
}

module.exports = new EmailService();
