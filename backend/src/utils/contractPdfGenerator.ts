import PDFDocument from 'pdfkit';

export interface CompanyContractData {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface ContractPdfData {
  contractId: string;
  startDate: Date;
  endDate: Date;
  amount?: number | null;
  status: string;
  company: CompanyContractData;
}

export const generateContractPdf = (data: ContractPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 40,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Header Corporativo (Azul Marino / Menta)
      doc.rect(0, 0, 612, 100).fill('#0A2540');

      doc.fillColor('#34D399').fontSize(22).font('Helvetica-Bold').text('MEDICAL SYSTEM', 40, 30);
      doc.fillColor('#94A3B8').fontSize(10).font('Helvetica').text('Plataforma de Gestión Médica B2B & Consultorios In-House', 40, 58);

      // Distintivo de Documento Oficial
      doc.rect(440, 30, 132, 40).fill('#1E293B');
      doc.fillColor('#34D399').fontSize(9).font('Helvetica-Bold').text('DOCUMENTO OFICIAL', 450, 38);
      doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica').text('CONVENIO B2B', 450, 52);

      // Titulo del Contrato
      doc.fillColor('#0A2540').fontSize(14).font('Helvetica-Bold').text('CONTRATO DE PRESTACIÓN DE SERVICIOS MÉDICOS CORPORATIVOS', 40, 120, {
        align: 'center',
        width: 532,
      });

      doc.moveTo(40, 145).lineTo(572, 145).strokeColor('#CBD5E1').lineWidth(1).stroke();

      // Seccion 1: Datos del Cliente B2B
      doc.fillColor('#0A2540').fontSize(11).font('Helvetica-Bold').text('I. DECLARACIONES Y DATOS DEL CLIENTE B2B', 40, 160);

      doc.rect(40, 178, 532, 90).fillAndStroke('#F8FAFC', '#E2E8F0');

      const startY = 190;
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('Razón Social / Empresa:', 52, startY);
      doc.fillColor('#0F172A').font('Helvetica').text(data.company.name, 170, startY);

      doc.fillColor('#475569').font('Helvetica-Bold').text('RFC / Cédula Fiscal:', 52, startY + 18);
      doc.fillColor('#0F172A').font('Helvetica').text(data.company.taxId || 'No especificado', 170, startY + 18);

      doc.fillColor('#475569').font('Helvetica-Bold').text('Dirección Fiscal:', 52, startY + 36);
      doc.fillColor('#0F172A').font('Helvetica').text(data.company.address || 'No especificada', 170, startY + 36);

      doc.fillColor('#475569').font('Helvetica-Bold').text('Teléfono de Contacto:', 52, startY + 54);
      doc.fillColor('#0F172A').font('Helvetica').text(data.company.phone || 'No especificado', 170, startY + 54);

      // Seccion 2: Detalle del Convenio
      doc.fillColor('#0A2540').fontSize(11).font('Helvetica-Bold').text('II. CONDICIONES Y VIGENCIA DEL CONVENIO MÉDICO', 40, 288);

      doc.rect(40, 306, 532, 80).fillAndStroke('#F1F5F9', '#CBD5E1');

      const startY2 = 318;
      const startDateStr = new Date(data.startDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const endDateStr = new Date(data.endDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const amountStr = data.amount ? `$${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : 'Sin costo definido';

      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('Fecha de Inicio de Vigencia:', 52, startY2);
      doc.fillColor('#0F172A').font('Helvetica').text(startDateStr, 190, startY2);

      doc.fillColor('#334155').font('Helvetica-Bold').text('Fecha de Término de Vigencia:', 52, startY2 + 18);
      doc.fillColor('#0F172A').font('Helvetica').text(endDateStr, 190, startY2 + 18);

      doc.fillColor('#334155').font('Helvetica-Bold').text('Monto Acordado del Convenio:', 52, startY2 + 36);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(amountStr, 190, startY2 + 36);

      doc.fillColor('#334155').font('Helvetica-Bold').text('Estatus del Contrato:', 52, startY2 + 54);
      doc.fillColor(data.status === 'ACTIVE' ? '#059669' : '#DC2626').font('Helvetica-Bold').text(data.status, 190, startY2 + 54);

      // Seccion 3: Clausulas Operativas
      doc.fillColor('#0A2540').fontSize(11).font('Helvetica-Bold').text('III. CLÁUSULAS GENERALES DE SERVICIO IN-HOUSE', 40, 404);

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
        'PRIMERA.- OBJETO DEL CONTRATO: "MEDICAL SYSTEM" se compromete a proveer la asignación de médicos profesionales calificados para la atención clínica de primer nivel en las instalaciones corporativas de "EL CLIENTE B2B".\n\n' +
        'SEGUNDA.- CONFIDENCIALIDAD DE EXPEDIENTES: Ambas partes acuerdan la protección estricta de la información médica de los pacientes conforme a las regulaciones de protección de datos personales y normativa de salud aplicable.\n\n' +
        'TERCERA.- VIGENCIA Y RESCISIÓN: Este convenio surtirá efectos a partir de la fecha de inicio convenida y podrá rescindirse por mutuo acuerdo mediante notificación por escrito con 30 días de anticipación.',
        40,
        422,
        { align: 'justify', width: 532, lineGap: 3 }
      );

      // Seccion 4: Firmas
      doc.fillColor('#0A2540').fontSize(10).font('Helvetica-Bold').text('IV. FIRMAS DE CONFORMIDAD', 40, 540);

      // Cuadro Firma 1
      doc.moveTo(60, 630).lineTo(250, 630).strokeColor('#64748B').lineWidth(1).stroke();
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text(data.company.name, 60, 635, { width: 190, align: 'center' });
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Representante Legal B2B', 60, 647, { width: 190, align: 'center' });

      // Cuadro Firma 2
      doc.moveTo(360, 630).lineTo(550, 630).strokeColor('#64748B').lineWidth(1).stroke();
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('MEDICAL SYSTEM S.A. DE C.V.', 360, 635, { width: 190, align: 'center' });
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Dirección Operativa & Médica', 360, 647, { width: 190, align: 'center' });

      // Pie de pagina corporativo
      doc.rect(0, 750, 612, 42).fill('#0A2540');
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text('Medical System B2B Management Platform • Documento Generado Automáticamente • Folio: ' + data.contractId, 40, 765, {
        align: 'center',
        width: 532,
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
