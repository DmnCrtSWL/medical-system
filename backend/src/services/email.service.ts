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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ [EMAIL SERVICE ERROR] Fallo al enviar correo a ${to}:`, message);
    return { success: false };
  }
};

/**
 * Plantilla HTML para el recordatorio mensual de fecha de corte (Sin datos bancarios, monto exacto dinámico).
 */
export const buildPaymentReminderHtml = (companyName: string, periodLabel: string, amount: number): string => {
  const formattedAmount = `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Aviso de Facturación Mensual - MedSys B2B</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; text-align: left; border-bottom: 4px solid #10b981;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MedSys <span style="color: #10b981;">B2B</span></h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Salud Ocupacional & Cobertura Médica Empresarial</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Aviso de Corte Mensual del Servicio Médico</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Estimado equipo de <strong>${companyName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Le notificamos cordialmente que ha llegado su fecha de corte correspondiente al periodo <strong>${periodLabel}</strong> por concepto de la iguala médica ocupacional de su sede corporativa.
              </p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Importe a Liquidar:</p>
                <p style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a;">${formattedAmount}</p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #15803d;">Periodo amparado: ${periodLabel}</p>
              </div>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Agradecemos programar su liquidación mensual conforme a los canales habituales convenidos con su ejecutivo de cuenta. Una vez aplicado el importe en contabilidad, recibirá en automático su comprobante oficial digital en formato PDF.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">MedSys B2B Healthcare Systems &copy; 2026. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Envía el correo de recordatorio mensual a la empresa en su fecha de corte.
 */
export const sendMonthlyPaymentReminderEmail = async (
  to: string,
  companyName: string,
  periodLabel: string,
  amount: number
): Promise<{ success: boolean; messageId?: string }> => {
  const html = buildPaymentReminderHtml(companyName, periodLabel, amount);
  const subject = `MedSys B2B - Recordatorio de Facturación Mensual (${periodLabel}) - ${companyName}`;

  if (!process.env.SMTP_HOST) {
    console.log(`\n📧 [EMAIL SERVICE - MOCK/DEV] Recordatorio mensual emitido a ${to} (${companyName}) por $${amount} [${periodLabel}]`);
    return { success: true, messageId: 'mock-reminder-id' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MedSys B2B" <no-reply@medicalsystem.com>',
      to,
      subject,
      html,
    });
    console.log(`📧 [EMAIL SERVICE] Recordatorio enviado a ${to}: MessageId ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ [EMAIL SERVICE ERROR] Fallo al enviar recordatorio a ${to}:`, message);
    return { success: false };
  }
};

/**
 * Plantilla HTML de confirmación de pago liquidado con recibo PDF adjunto.
 */
export const buildPaymentReceiptHtml = (
  companyName: string,
  periodLabel: string,
  folio: string,
  amount: number
): string => {
  const formattedAmount = `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pago Liquidado - MedSys B2B</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; text-align: left; border-bottom: 4px solid #10b981;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MedSys <span style="color: #10b981;">B2B</span></h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Salud Ocupacional & Cobertura Médica Empresarial</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <div style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
                ✓ PAGO LIQUIDADO EN FIRME
              </div>
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Comprobante Digital de Ingreso</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Estimado equipo de <strong>${companyName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Confirmamos la acreditación y liquidación exitosa de su pago correspondiente al periodo <strong>${periodLabel}</strong>.
              </p>
              <table style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Monto Liquidado:</td>
                  <td style="font-size: 15px; font-weight: 800; color: #059669; text-align: right; padding: 4px 0;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Periodo amparado:</td>
                  <td style="font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; padding: 4px 0;">${periodLabel}</td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                Adjunto a este correo encontrará su <strong>Recibo Oficial de Pago en formato PDF</strong> con sello digital para su respaldo contable y fiscal.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">MedSys B2B Healthcare Systems &copy; 2026. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Envía el comprobante oficial de pago con el recibo en PDF adjunto a la empresa.
 */
export const sendPaymentReceiptEmail = async (
  to: string,
  companyName: string,
  periodLabel: string,
  folio: string | undefined,
  amount: number,
  pdfBuffer: Buffer
): Promise<{ success: boolean; messageId?: string }> => {
  const html = buildPaymentReceiptHtml(companyName, periodLabel, folio || '', amount);
  const subject = `MedSys B2B - Comprobante de Pago Liquidado - ${companyName}`;

  if (!process.env.SMTP_HOST) {
    console.log(`\n📧 [EMAIL SERVICE - MOCK/DEV] Recibo emitido a ${to} (${companyName}) por $${amount} con PDF adjunto (${pdfBuffer.length} bytes)`);
    return { success: true, messageId: 'mock-receipt-id' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MedSys B2B" <no-reply@medicalsystem.com>',
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'Recibo_Pago.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log(`📧 [EMAIL SERVICE] Recibo enviado a ${to}: MessageId ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ [EMAIL SERVICE ERROR] Fallo al enviar recibo a ${to}:`, message);
    return { success: false };
  }
};

