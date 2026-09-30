import nodemailer from 'nodemailer';

export interface SendSetPasswordEmailOptions {
  to: string;
  name: string;
  token: string;
  roleOrEntity?: string;
}

/**
 * Crea el transporter de nodemailer.
 * Si las variables de entorno de SMTP están presentes (ej. Mailtrap), las utiliza.
 * De lo contrario, genera un transporter seguro para pruebas de desarrollo.
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 2525;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback para pruebas en desarrollo: simula transporte o salida en log
  return nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'dev_user_mock',
      pass: 'dev_pass_mock',
    },
    // En ausencia de credenciales reales activas, no arroja fallo no controlado
  });
};

/**
 * Genera la plantilla HTML ejecutiva con la identidad de marca del ecosistema (Azul Marino y Verde Menta).
 */
export const buildSetPasswordHtml = (name: string, setPasswordUrl: string, roleOrEntity: string): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a MedSys B2B</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .wrapper {
      max-width: 580px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #0a2540;
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header span {
      color: #10b981;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }
    .notice {
      background-color: #f1f5f9;
      border-left: 4px solid #10b981;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 24px;
    }
    .fallback-link {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>MedSys <span>Admin</span></h1>
    </div>
    <div class="content">
      <div class="badge">Nuevo Acceso al Sistema</div>
      <div class="greeting">¡Hola, ${name}!</div>
      <p class="text">
        Has sido registrado en la plataforma médica <strong>MedSys B2B</strong> con el perfil de <strong>${roleOrEntity}</strong>.
        Para acceder a tu cuenta, es necesario que configures tu contraseña personal.
      </p>

      <div class="btn-container">
        <a href="${setPasswordUrl}" class="btn" target="_blank">Establecer mi Contraseña</a>
      </div>

      <div class="notice">
        <strong>Importante:</strong> Por motivos de seguridad, este enlace tiene una vigencia de <strong>24 horas</strong>. Si no lo utilizas dentro de este periodo, deberás solicitar un nuevo enlace al administrador.
      </div>

      <p class="fallback-link">
        Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
        <a href="${setPasswordUrl}" style="color: #10b981;">${setPasswordUrl}</a>
      </p>
    </div>
    <div class="footer">
      © 2026 MedSys Platform. Todos los derechos reservados.<br>
      Este es un correo automático generado por el sistema institucional, por favor no respondas a este mensaje.
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Servicio centralizado para enviar el correo con enlace y token expirable para seteo de contraseña.
 */
export const sendSetPasswordEmail = async ({
  to,
  name,
  token,
  roleOrEntity = 'Usuario',
}: SendSetPasswordEmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const setPasswordUrl = `${frontendUrl}/set-password?token=${encodeURIComponent(token)}`;

  const html = buildSetPasswordHtml(name, setPasswordUrl, roleOrEntity);
  const subject = 'Bienvenido a MedSys - Configura tu contraseña de acceso';

  // Si no hay SMTP configurado en dev, registramos el envío y el enlace de prueba en consola
  if (!process.env.SMTP_HOST) {
    console.log(`\n📧 [EMAIL SERVICE - MOCK/DEV] Correo de activación emitido:`);
    console.log(`   Destinatario: ${to} (${name})`);
    console.log(`   Rol/Entidad: ${roleOrEntity}`);
    console.log(`   Enlace de activación: ${setPasswordUrl}`);
    console.log(`   Vigencia: 24 horas\n`);
    return { success: true, messageId: 'mock-dev-id', previewUrl: setPasswordUrl };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MedSys B2B" <no-reply@medicalsystem.com>',
      to,
      subject,
      html,
    });

    console.log(`📧 [EMAIL SERVICE] Correo enviado a ${to}: MessageId ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL SERVICE ERROR] Fallo al enviar correo a ${to}:`, error);
    // Devolvemos el error de forma controlada sin tumbar la creación del usuario
    return { success: false };
  }
};
