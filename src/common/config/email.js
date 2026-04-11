const nodemailer = require('nodemailer');

const emailUser = (process.env.EMAIL_USER || '').replace(/"/g, '');
const emailPass = (process.env.EMAIL_PASS || '').replace(/"/g, '');
const emailHost = (process.env.EMAIL_HOST || 'smtp-relay.brevo.com').replace(/"/g, '');
const emailPort = parseInt((process.env.EMAIL_PORT || '465').replace(/"/g, ''));

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Error al conectar con el servidor de correo:', error.message);
  } else {
    console.log('✅ Servidor de correo listo para enviar emails');
  }
});

const sendPasswordResetEmail = async (to, nombre, resetLink) => {
  if (!emailUser || !emailPass) {
    console.error('❌ EMAIL_USER o EMAIL_PASS no están configurados');
    throw new Error('Configuración de email faltante.');
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
    const info = await transporter.sendMail({
      from: '"iTaquito" <a7c57b001@smtp-brevo.com>',
      to,
      subject: '🔐 Recupera tu contraseña - iTaquito',
      html,
    });

    console.log(`✅ Correo enviado exitosamente a ${to} — ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error.message);
    throw new Error(`No se pudo enviar el correo de recuperación: ${error.message}`);
  }
};

module.exports = { sendPasswordResetEmail };