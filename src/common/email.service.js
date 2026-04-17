const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'iTaquito 🌮 <onboarding@resend.dev>', // dominio gratuito de Resend
        to,
        subject,
        html,
        text,
      });

      if (error) throw new Error(error.message);

      console.log('Correo enviado:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('--- DEBUG EMAIL ERROR ---');
      console.error('Message:', error.message);
      console.error('--------------------------');
      throw error;
    }
  }
}

module.exports = new EmailService();