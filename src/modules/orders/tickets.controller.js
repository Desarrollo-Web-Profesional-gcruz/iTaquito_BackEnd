'use strict';

const emailService = require('../../common/email.service');
const whatsappService = require('../../common/whatsapp.service');

/**
 * Controlador para manejar el envío de tickets digitales por email y WhatsApp.
 */
class TicketsController {
  
  /**
   * Envía el ticket visual por WhatsApp automáticamente.
   * POST /api/orders/send-ticket-whatsapp
   */
  async sendTicketWhatsApp(req, res) {
    try {
      const { phone, tableName, items, total } = req.body;

      if (!phone || !items || !total) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos para enviar el ticket por WhatsApp.'
        });
      }

      // Formatear el mensaje de texto para WhatsApp
      const header = `*iTaquito 🌮*\n¡Hola! Aquí tienes el detalle de tu consumo en la *Mesa ${tableName || 'N/A'}*:\n\n`;
      
      const itemsList = items.map(item => 
        `• ${item.nombre} x${item.qty} _($${(item.precio * item.qty).toFixed(2)})_`
      ).join('\n');
      
      const footer = `\n\n*Total a Pagar: $${total.toFixed(2)}*\n\n¡Muchas gracias por tu visita! 👋`;
      
      const fullMessage = header + itemsList + footer;

      // Envío automático vía API
      const result = await whatsappService.sendMessage(phone, fullMessage);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Ticket enviado por WhatsApp exitosamente.'
        });
      } else {
        throw new Error('Error al enviar mensaje vía API');
      }
    } catch (error) {
      console.error('Error al enviar ticket por WhatsApp:', error);
      return res.status(500).json({
        success: false,
        message: 'No se pudo enviar el mensaje de WhatsApp automático.'
      });
    }
  }

  /**
   * Envía el ticket visual por correo electrónico.
   * POST /api/orders/send-ticket-email
   */
  async sendTicketEmail(req, res) {
    try {
      const { email, tableName, items, total, sessionToken } = req.body;

      if (!email || !items || !total) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos para enviar el ticket.'
        });
      }

      // Generar el HTML del ticket visual estilizado
      const ticketHtml = this._generateTicketHtml(tableName, items, total);

      await emailService.sendEmail({
        to: email,
        subject: `🌮 Tu Ticket en iTaquito - Mesa ${tableName || '?'}`,
        html: ticketHtml,
        text: `¡Gracias por visitarnos! Tu total fue de $${total}.`
      });

      return res.status(200).json({
        success: true,
        message: 'Ticket enviado exitosamente.'
      });
    } catch (error) {
      console.error('Error al enviar ticket por email:', error);
      return res.status(500).json({
        success: false,
        message: 'No se pudo enviar el correo electrónico.'
      });
    }
  }

  _generateTicketHtml(tableName, items, total) {
    const pink = '#EC4899';
    const teal = '#14B8A6';
    const orange = '#F97316';
    const gray = '#6B7280';
    const lightGray = '#F3F4F6';

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px dashed ${lightGray};">
        <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #374151;">
          ${item.nombre} <br/>
          <small style="color: ${gray}; font-size: 11px;">${item.qty} x $${item.precio.toFixed(2)}</small>
        </td>
        <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-weight: 700; color: #111827;">
          $${(item.precio * item.qty).toFixed(2)}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket iTaquito</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Outfit', 'Helvetica', sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 400px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${pink}; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">iTaquito 🌮</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px; font-weight: 600;">Mesa: ${tableName || 'N/A'}</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <th align="left" style="color: ${teal}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px; border-bottom: 2px solid ${lightGray};">Descripción</th>
                  <th align="right" style="color: ${teal}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px; border-bottom: 2px solid ${lightGray};">Total</th>
                </tr>
                ${itemsHtml}
              </table>
              
              <!-- Total -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px; padding-top: 15px; border-top: 3px double ${lightGray};">
                <tr>
                  <td style="font-family: sans-serif; font-size: 16px; font-weight: 700; color: #374151;">Gran Total</td>
                  <td style="text-align: right; font-family: sans-serif; font-size: 24px; font-weight: 900; color: ${orange};">
                    $${total.toFixed(2)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #fafafa; border-top: 1px dashed #eee;">
              <p style="margin: 0; color: ${gray}; font-size: 12px;">¡Gracias por tu visita! Esperamos verte pronto.</p>
              <p style="margin: 5px 0 0; color: ${teal}; font-size: 11px; font-weight: 700;">iTaquito - Auténtica Sabor Mexicano</p>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 10px; margin-top: 20px;">
          Este es un comprobante digital generado automáticamente por iTaquito.
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new TicketsController();
