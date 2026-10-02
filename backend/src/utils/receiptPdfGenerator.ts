import PDFDocument from 'pdfkit';

export interface CompanyReceiptData {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DoctorReceiptData {
  name: string;
  licenseId?: string | null;
  specialty?: string | null;
}

export interface PaymentReceiptData {
  folio?: string;
  transactionId: string;
  date: Date;
  settledAt?: Date | null;
  amount: number;
  periodLabel: string;
  description: string;
  tariffLabel?: string | null;
  company: CompanyReceiptData;
  doctor?: DoctorReceiptData | null;
}

/**
 * Genera el documento PDF oficial del Recibo de Pago B2B con identidad corporativa MedSys.
 */
export const generateReceiptPdf = (data: PaymentReceiptData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER', // 612 x 792 pt
        margin: 40,
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      const primaryNavy = '#0f172a';
      const secondaryNavy = '#1e293b';
      const mintAccent = '#059669';
      const emeraldGreen = '#10b981';
      const borderGray = '#e2e8f0';
      const lightBg = '#f8fafc';
      const textMuted = '#64748b';

      const formatCurrency = (val: number): string =>
        `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

      const formatDate = (date: Date | string): string =>
        new Date(date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        });

      // ==========================================
      // ENCABEZADO Y BRANDING
      // ==========================================
      // Barra superior decorativa menta
      doc.rect(40, 40, 532, 6).fill(emeraldGreen);

      // Logotipo y nombre institucional
      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryNavy).text('MEDSYS B2B', 40, 60);
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(mintAccent)
        .text('SISTEMA INTEGRAL DE SALUD OCUPACIONAL & MEDICINA LABORAL', 40, 86);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(textMuted)
        .text('Servicios Médicos Empresariales S.A. de C.V. | RFC: SME240815MD1\nAv. Empresarial 1050, Piso 8, Ciudad de México | contacto@dmncrt.com', 40, 100);

      // Tarjeta de Estado en la esquina superior derecha
      doc.roundedRect(380, 58, 192, 70, 8).fillAndStroke(lightBg, borderGray);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(textMuted).text('COMPROBANTE OFICIAL DE PAGO', 390, 72, { width: 172, align: 'center' });

      // Badge de estado LIQUIDADO
      doc.roundedRect(415, 92, 122, 22, 11).fill(emeraldGreen);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#ffffff').text('PAGO LIQUIDADO', 415, 98, { width: 122, align: 'center' });

      // Línea divisoria
      doc.moveTo(40, 140).lineTo(572, 140).strokeColor(borderGray).lineWidth(1).stroke();

      // ==========================================
      // METADATOS: CLIENTE Y EMISIÓN
      // ==========================================
      // Bloque Cliente (Izquierda)
      doc.roundedRect(40, 155, 255, 115, 6).fillAndStroke(lightBg, borderGray);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mintAccent).text('DATOS DE LA EMPRESA CLIENTE', 52, 166);

      const clientName = data.company.legalName || data.company.name;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryNavy).text(clientName, 52, 182, { width: 231 });
      doc.fontSize(9).font('Helvetica').fillColor(textMuted);
      doc.text(`RFC: ${data.company.taxId || 'XAXX010101000 (Sin RFC registrado)'}`, 52, 202);
      doc.text(`Dirección: ${data.company.address || 'Domicilio corporativo registrado'}`, 52, 217, { width: 231 });
      if (data.company.email) {
        doc.text(`Contacto: ${data.company.email}`, 52, 245);
      }

      // Bloque Fechas y Auditoría (Derecha)
      doc.roundedRect(315, 155, 257, 115, 6).fillAndStroke(lightBg, borderGray);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mintAccent).text('DETALLES DE LA TRANSACCIÓN', 327, 166);

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(secondaryNavy).text('Fecha de Liquidación:', 327, 184);
      doc.font('Helvetica').fillColor(textMuted).text(formatDate(data.settledAt || data.date), 435, 184);

      doc.font('Helvetica-Bold').fillColor(secondaryNavy).text('Periodo Facturado:', 327, 201);
      doc.font('Helvetica').fillColor(textMuted).text(data.periodLabel, 435, 201);

      doc.font('Helvetica-Bold').fillColor(secondaryNavy).text('Médico Asignado:', 327, 218);
      let doctorText = 'Médico General de Planta';
      if (data.doctor?.name) {
        const cleanName = data.doctor.name.replace(/^(Dr\.?|Dra\.?)\s+/i, '').trim();
        doctorText = `Dr. ${cleanName}`;
      }
      doc.font('Helvetica').fillColor(textMuted).text(doctorText, 435, 218, { width: 130 });

      if (data.doctor?.licenseId) {
        doc.font('Helvetica-Bold').fillColor(secondaryNavy).text('Cédula Profesional:', 327, 245);
        doc.font('Helvetica').fillColor(textMuted).text(data.doctor.licenseId, 435, 245);
      }

      // ==========================================
      // TABLA DE CONCEPTOS FACTURADOS
      // ==========================================
      const tableTop = 290;
      // Header de tabla
      doc.rect(40, tableTop, 532, 24).fill(primaryNavy);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('CONCEPTO / DESCRIPCIÓN DEL SERVICIO', 52, tableTop + 7);
      doc.text('PERIODO', 370, tableTop + 7);
      doc.text('TOTAL', 500, tableTop + 7, { width: 62, align: 'right' });

      // Fila de concepto
      const rowTop = tableTop + 24;
      doc.rect(40, rowTop, 532, 55).fillAndStroke('#ffffff', borderGray);

      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryNavy);
      doc.text(data.description, 52, rowTop + 12, { width: 300 });

      doc.fontSize(8.5).font('Helvetica').fillColor(textMuted);
      const subdesc = data.tariffLabel
        ? `Modalidad: ${data.tariffLabel} | Cobertura médica ocupacional en planta y expedientes laborales.`
        : 'Servicio integral de medicina preventiva y atención ocupacional continua en sede corporativa.';
      doc.text(subdesc, 52, rowTop + 28, { width: 300 });

      doc.fontSize(9.5).font('Helvetica').fillColor(primaryNavy);
      doc.text(data.periodLabel, 370, rowTop + 16);

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primaryNavy);
      doc.text(formatCurrency(data.amount), 450, rowTop + 16, { width: 112, align: 'right' });

      // ==========================================
      // TOTAL LIQUIDADO
      // ==========================================
      const totalsTop = rowTop + 70;
      doc.roundedRect(340, totalsTop, 232, 48, 6).fillAndStroke(lightBg, borderGray);

      doc.fontSize(11).font('Helvetica-Bold').fillColor(emeraldGreen).text('Total Liquidado:', 355, totalsTop + 17);
      doc.text(formatCurrency(data.amount), 440, totalsTop + 17, { width: 120, align: 'right' });

      // ==========================================
      // SELLO DE CONFORMIDAD Y CERTIFICACIÓN
      // ==========================================
      const footerTop = totalsTop + 70;
      doc.roundedRect(40, footerTop, 532, 95, 6).fillAndStroke('#ffffff', borderGray);

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(mintAccent).text('CERTIFICACIÓN DE INGRESO LIQUIDADO', 52, footerTop + 12);

      const dateIso = new Date(data.date).toISOString();
      const verificationHash = Buffer.from(`${data.transactionId}|${data.amount}|${dateIso}`).toString('base64');

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(textMuted)
        .text(
          'Este documento constituye un recibo digital oficial emitido por MedSys B2B como comprobante de pago liquidado en firme por concepto de servicios médicos laborales. El importe amparado ha sido acreditado en las cuentas de la institución.',
          52,
          footerTop + 26,
          { width: 508 }
        );

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(secondaryNavy)
        .text(`CADENA DE VERIFICACIÓN / SELLO DIGITAL:`, 52, footerTop + 62);
      doc
        .fontSize(6.5)
        .font('Courier')
        .fillColor(textMuted)
        .text(verificationHash.padEnd(80, '0').slice(0, 80), 52, footerTop + 74, { width: 508 });

      // Pie de página
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(textMuted)
        .text('MedSys B2B Healthcare Systems © 2026 | Documento generado automáticamente por el Módulo Financiero', 40, 740, {
          width: 532,
          align: 'center',
        });

      doc.end();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido al generar PDF del recibo';
      reject(new Error(message));
    }
  });
};
