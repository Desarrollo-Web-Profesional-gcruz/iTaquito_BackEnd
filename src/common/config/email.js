const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar correo de recuperación
const sendPasswordResetEmail = async (to, nombre, resetLink) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no está configurado en las variables de entorno');
    throw new Error('Configuración de email faltante. Contacta al administrador.');
  }

  console.log(`📧 Intentando enviar correo de recuperación a: ${to}`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recupera tu contraseña - iTaquito</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f0e8; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #E83E8C, #FF6B35); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #E83E8C; color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; margin: 20px 0; font-weight: bold; }
        .footer { background: #f5f0e8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { color: #E83E8C; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌮 iTaquito</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Restaurante Mexicano</p>
        </div>
        <div class="content">
          <h2>Hola ${nombre}!</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
          </div>
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <div class="warning">
            ⚠️ Este enlace expirará en 1 hora.
          </div>
        </div>
        <div class="footer">
          <p>iTaquito - Los mejores tacos de la ciudad</p>
          <p>¿Necesitas ayuda? Contacta a tu administrador</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'iTaquito <onboarding@resend.dev>',
      to,
      subject: '🔐 Recupera tu contraseña - iTaquito',
      html,
    });

    if (error) {
      console.error('❌ Error de Resend:', error);
      throw new Error(error.message);
    }

    console.log(`✅ Correo enviado exitosamente a ${to} — ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error.message);
    throw new Error(`No se pudo enviar el correo de recuperación: ${error.message}`);
  }
};

module.exports = { sendPasswordResetEmail };