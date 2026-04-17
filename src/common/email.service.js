const { Resend } = require('resend');

/**
 * Servicio centralizado para el envío de correos electrónicos.
 * Revertido a Resend debido a bloqueos de puertos SMTP en el entorno de producción.
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    if (this.apiKey) {
      this.resend = new Resend(this.apiKey);
    } else {
      console.warn('⚠️  RESEND_API_KEY no encontrada en .env. El servicio de correos no estará disponible.');
      this.resend = null;
    }
  }

  /**
   * Envía un correo electrónico usando la API de Resend.
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.resend) {
      console.warn('Intento de enviar correo sin RESEND_API_KEY configurada.');
      return { success: false, message: 'Servicio de correo no configurado' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'iTaquito 🌮 <onboarding@resend.dev>', // Dominio gratuito de Resend (Sandbox)
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('❌ Error de Resend:', error.message);
        throw new Error(error.message);
      }

      console.log('📧 Correo enviado vía Resend:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('--- ❌ DEBUG EMAIL ERROR ---');
      console.error('Message:', error.message);
      console.error('--------------------------');
      throw error;
    }
  }
}

module.exports = new EmailService();