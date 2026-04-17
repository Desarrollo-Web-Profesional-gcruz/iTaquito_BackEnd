const axios = require('axios');

/**
 * Servicio para envío de mensajes automáticos por WhatsApp usando la API de UltraMsg.
 */
class WhatsAppService {
  constructor() {
    this.instanceId = process.env.WHATSAPP_INSTANCE_ID;
    this.token = process.env.WHATSAPP_TOKEN;
    this.baseUrl = `https://api.ultramsg.com/${this.instanceId}/messages/chat`;
  }

  /**
   * Envía un mensaje de texto a un número específico.
   * @param {string} to - Número de teléfono (con código de país, ej: 521...).
   * @param {string} body - Contenido del mensaje.
   */
  async sendMessage(to, body) {
    if (!this.instanceId || !this.token) {
      console.warn('⚠️  WhatsApp API no configurada (InstanceID o Token faltante)');
      return { success: false, message: 'Servicio no configurado' };
    }

    // Asegurar que el número no tenga el '+' (UltraMsg lo prefiere sin él o con formato específico)
    const cleanTo = to.replace('+', '').trim();

    try {
      const response = await axios.post(this.baseUrl, {
        token: this.token,
        to: cleanTo,
        body: body,
        priority: 1,
        referenceId: ''
      });

      if (response.data && response.data.sent === 'true') {
        console.log('✅ Mensaje de WhatsApp enviado a:', cleanTo);
        return { success: true, data: response.data };
      } else {
        console.error('❌ Error de WhatsApp API:', response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('--- ❌ ERROR WHATSAPP API ---');
      console.error('Mensaje:', error.message);
      if (error.response) console.error('Data:', error.response.data);
      console.error('-----------------------------');
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
