import PDFDocument from 'pdfkit';

export interface CompanyContractData {
  name: string;
  legalName?: string | null;
  representativeName?: string | null;
  representativeTitle?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface DoctorContractData {
  name: string;
  licenseId?: string | null;
  university?: string | null;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ContractPdfData {
  contractId: string;
  startDate: Date;
  endDate: Date;
  amount?: number | null;
  tariff?: string | null;
  duration?: string | null;
  status: string;
  company: CompanyContractData;
  doctor?: DoctorContractData | null;
}

export const generateContractPdf = (data: ContractPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER', // 612 x 792 pt
        margin: 36,
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      const companyDisplayName = (data.company.legalName || data.company.name || 'Empresa Contratante').trim();
      const repDisplayName = (data.company.representativeName || 'Representante Legal Autorizado').trim();
      const repTitle = (data.company.representativeTitle || 'Representante Legal').trim();
      const companyAddress = (data.company.address || 'Domicilio corporativo registrado en el expediente de la empresa').trim();

      const formatDocTitle = (name: string) => (/^dr\.?\s+/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`);
      const doctorDisplayName = data.doctor ? formatDocTitle(data.doctor.name) : 'Personal Médico Residente Asignado';
      const doctorCedula = data.doctor?.licenseId ? `Cédula Profesional No. ${data.doctor.licenseId}` : 'Cédula Profesional en trámite de validación oficial';
      const doctorUni = data.doctor?.university ? data.doctor.university : 'Facultad de Medicina Acreditada';
      const doctorSpecialty = data.doctor?.specialty || 'Medicina General y Salud Ocupacional';

      const tariffLabel = data.tariff === 'TARIFF_A' ? 'Tarifa A (Básica)' : data.tariff === 'TARIFF_B' ? 'Tarifa B (Intermedia)' : data.tariff === 'TARIFF_C' ? 'Tarifa C (Integral)' : 'Tarifa Acordada';
      const durationMonths = data.duration === 'MONTHS_6' ? '6' : data.duration === 'MONTHS_24' ? '24' : '12';
      const amountStr = data.amount ? `$${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '$30,000.00 MXN';

      const startDateStr = new Date(data.startDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const endDateStr = new Date(data.endDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const emissionDateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

      // -------------------------------------------------------------
      // 1. ENCABEZADO INSTITUCIONAL / MEMBRETE FORMAL
      // -------------------------------------------------------------
      doc.rect(36, 28, 540, 3).fill('#0A2540');

      doc.fillColor('#0A2540').fontSize(11).font('Helvetica-Bold').text('MEDICAL SYSTEM S.A. DE C.V.', 36, 38);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Servicios Especializados de Salud Ocupacional & Medicina Corporativa In-House', 36, 51);
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica').text('R.F.C. MSY-240101-ABC • Registro Sanitario Federal COFEPRIS No. 24-098-SS', 36, 61);

      doc.fillColor('#0A2540').fontSize(7.5).font('Helvetica-Bold').text(`FOLIO: ${data.contractId.slice(0, 16).toUpperCase()}`, 380, 38, { width: 196, align: 'right' });
      doc.fillColor('#475569').fontSize(7).font('Helvetica').text(`Emisión: ${emissionDateStr}`, 380, 49, { width: 196, align: 'right' });
      doc.fillColor('#059669').fontSize(7).font('Helvetica-Bold').text('ESTATUS: ACTIVO / VIGENTE', 380, 59, { width: 196, align: 'right' });

      doc.moveTo(36, 73).lineTo(576, 73).strokeColor('#0A2540').lineWidth(1).stroke();
      doc.moveTo(36, 75).lineTo(576, 75).strokeColor('#10B981').lineWidth(0.5).stroke();

      // -------------------------------------------------------------
      // 2. TÍTULO DEL CONTRATO
      // -------------------------------------------------------------
      doc.fillColor('#0A2540').fontSize(10).font('Helvetica-Bold').text('CONTRATO DE PRESTACIÓN DE SERVICIOS MÉDICOS OCUPACIONALES', 36, 83, {
        align: 'center',
        width: 540,
      });
      doc.fillColor('#475569').fontSize(7.2).font('Helvetica-Bold').text('MODALIDAD: ASIGNACIÓN DE PERSONAL MÉDICO RESIDENTE EN PLANTA', 36, 95, {
        align: 'center',
        width: 540,
      });

      // -------------------------------------------------------------
      // 3. PROEMIO LEGAL
      // -------------------------------------------------------------
      const proemioText = `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES DE SALUD QUE CELEBRAN, POR UNA PARTE, MEDICAL SYSTEM S.A. DE C.V. (EN LO SUCESIVO "EL PRESTADOR"), REPRESENTADA EN ESTE ACTO POR EL DR. RICARDO GARZA MORALES EN SU CARÁCTER DE DIRECTOR GENERAL, Y POR OTRA PARTE LA PERSONA MORAL ${companyDisplayName.toUpperCase()} (EN LO SUCESIVO "EL CLIENTE"), REPRESENTADA POR ${repDisplayName.toUpperCase()} EN SU CARÁCTER DE ${repTitle.toUpperCase()}, AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:`;

      doc.fillColor('#1E293B').fontSize(6.8).font('Helvetica').text(proemioText, 36, 110, {
        width: 540,
        align: 'justify',
        lineGap: 1.5,
      });

      // -------------------------------------------------------------
      // 4. DECLARACIONES
      // -------------------------------------------------------------
      let currentY = doc.y + 8;
      doc.fillColor('#0A2540').fontSize(8).font('Helvetica-Bold').text('DECLARACIONES', 36, currentY);

      currentY = doc.y + 4;
      const declPrestador = 'I. Declara "EL PRESTADOR": Estar legalmente constituida conforme a las leyes mercantiles mexicanas, contar con registros y autorizaciones sanitarias requeridas, y disponer del personal médico idóneo debidamente certificado para la óptima ejecución del servicio contratado.';
      const declCliente = `II. Declara "EL CLIENTE": Ser una sociedad legalmente constituida con facultades suficientes para obligarse en este acto, con domicilio corporativo en: ${companyAddress}, y tener interés en contratar personal médico calificado para sus instalaciones operativas.`;

      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(declPrestador, 36, currentY, {
        width: 540,
        align: 'justify',
        lineGap: 1.2,
      });
      currentY = doc.y + 3;
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(declCliente, 36, currentY, {
        width: 540,
        align: 'justify',
        lineGap: 1.2,
      });

      // -------------------------------------------------------------
      // 5. CLÁUSULAS CONTRACTUALES
      // -------------------------------------------------------------
      currentY = doc.y + 8;
      doc.fillColor('#0A2540').fontSize(8).font('Helvetica-Bold').text('CLÁUSULAS', 36, currentY, { align: 'center', width: 540 });
      doc.moveTo(230, currentY + 10).lineTo(382, currentY + 10).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

      currentY = currentY + 14;

      // CLÁUSULA PRIMERA
      doc.fillColor('#0A2540').fontSize(7.2).font('Helvetica-Bold').text('PRIMERA.- OBJETO Y ASIGNACIÓN DE PERSONAL MÉDICO:', 36, currentY);
      currentY = doc.y + 3;
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(
        '"EL PRESTADOR" se compromete a otorgar a favor de "EL CLIENTE" la provisión integral de servicios médicos de primer contacto, medicina preventiva ocupacional y llenado de expedientes clínicos en sus instalaciones, asignando formalmente para tales efectos al siguiente médico residente:',
        36,
        currentY,
        { width: 540, align: 'justify', lineGap: 1.2 }
      );
      currentY = doc.y + 5;

      // Tarjeta formal de asignación médica
      doc.rect(36, currentY, 540, 38).fillAndStroke('#F8FAFC', '#CBD5E1');

      doc.fillColor('#0A2540').fontSize(7.3).font('Helvetica-Bold').text('MÉDICO RESIDENTE DESIGNADO:', 46, currentY + 6);
      doc.fillColor('#0F172A').fontSize(7.3).font('Helvetica').text(doctorDisplayName, 175, currentY + 6, { width: 390, lineBreak: false, ellipsis: true });

      doc.fillColor('#475569').fontSize(6.8).font('Helvetica-Bold').text('Acreditación y Cédula:', 46, currentY + 17);
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(`${doctorCedula} • Institución: ${doctorUni}`, 175, currentY + 17, { width: 390, lineBreak: false, ellipsis: true });

      doc.fillColor('#475569').fontSize(6.8).font('Helvetica-Bold').text('Especialidad / Perfil:', 46, currentY + 27);
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(`${doctorSpecialty} (Atención médica in-house)`, 175, currentY + 27, { width: 390, lineBreak: false, ellipsis: true });

      currentY = currentY + 44;

      // CLÁUSULA SEGUNDA
      doc.fillColor('#0A2540').fontSize(7.2).font('Helvetica-Bold').text('SEGUNDA.- CONTRAPRESTACIÓN, TARIFA Y CONDICIONES DE PAGO:', 36, currentY);
      currentY = doc.y + 3;
      const clausulaSegunda = `Como retribución económica neta por la cobertura y prestación de los servicios convenidos, "EL CLIENTE" se obliga a pagar a "EL PRESTADOR" la cantidad mensual de ${amountStr} pactada bajo el esquema "${tariffLabel}". Dicho importe será liquidado mediante transferencia bancaria dentro de los primeros 5 (cinco) días hábiles de cada periodo mensual vencido previa expedición de la factura fiscal correspondiente.`;
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(clausulaSegunda, 36, currentY, { width: 540, align: 'justify', lineGap: 1.2 });

      currentY = doc.y + 5;

      // CLÁUSULA TERCERA
      doc.fillColor('#0A2540').fontSize(7.2).font('Helvetica-Bold').text('TERCERA.- VIGENCIA Y PLAZO DEL CONTRATO:', 36, currentY);
      currentY = doc.y + 3;
      const clausulaTercera = `El presente contrato tendrá una vigencia forzosa y acordada de ${durationMonths} meses, iniciando su vigencia formal el día ${startDateStr} y concluyendo indefectiblemente el día ${endDateStr}. A la terminación de este periodo, cualquier renovación o prórroga deberá convenirse por escrito mediante adenda formal signada por ambas partes.`;
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(clausulaTercera, 36, currentY, { width: 540, align: 'justify', lineGap: 1.2 });

      currentY = doc.y + 5;

      // CLÁUSULA CUARTA
      doc.fillColor('#0A2540').fontSize(7.2).font('Helvetica-Bold').text('CUARTA.- CONFIDENCIALIDAD, SECRETO PROFESIONAL Y EXPEDIENTE CLÍNICO (NOM-004):', 36, currentY);
      currentY = doc.y + 3;
      const clausulaCuarta = 'Toda información médica, historias clínicas, consultas y diagnósticos recabados durante la operatividad del consultorio in-house se encuentran resguardados bajo estricto secreto profesional y apego riguroso a la Norma Oficial Mexicana NOM-004-SSA3-2012 (Del expediente clínico), así como a las disposiciones aplicables en materia de Protección de Datos Personales en Posesión de los Particulares.';
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(clausulaCuarta, 36, currentY, { width: 540, align: 'justify', lineGap: 1.2 });

      currentY = doc.y + 5;

      // CLÁUSULA QUINTA
      doc.fillColor('#0A2540').fontSize(7.2).font('Helvetica-Bold').text('QUINTA.- JURISDICCIÓN Y COMPETENCIA:', 36, currentY);
      currentY = doc.y + 3;
      const clausulaQuinta = 'Para la validez, interpretación y debido cumplimiento del presente instrumento, las partes convienen someterse expresamente a las leyes aplicables y a la jurisdicción de los tribunales competentes de la Ciudad de Monterrey, Nuevo León, renunciando a cualquier fuero que por razón de sus domicilios presentes o futuros pudiera corresponderles.';
      doc.fillColor('#334155').fontSize(6.8).font('Helvetica').text(clausulaQuinta, 36, currentY, { width: 540, align: 'justify', lineGap: 1.2 });

      currentY = doc.y + 8;

      // -------------------------------------------------------------
      // 6. DECLARACIÓN DE CONFORMIDAD Y CIERRE
      // -------------------------------------------------------------
      doc.fillColor('#475569').fontSize(6.8).font('Helvetica-Oblique').text(
        'Leído íntegramente el presente instrumento y enteradas plenamente las partes de su alcance, valor, fuerza y efectos legales, lo ratifican y firman por duplicado de común acuerdo en la fecha consignada en el encabezado.',
        36,
        currentY,
        { width: 540, align: 'center', lineGap: 1.2 }
      );

      // -------------------------------------------------------------
      // 7. FIRMAS DE LAS PARTES
      // -------------------------------------------------------------
      const signatureLineY = 655;

      // Firma Cliente
      doc.moveTo(48, signatureLineY).lineTo(260, signatureLineY).strokeColor('#334155').lineWidth(0.8).stroke();
      doc.fillColor('#0A2540').fontSize(7.5).font('Helvetica-Bold').text('POR "EL CLIENTE"', 48, signatureLineY + 5, { width: 212, align: 'center' });
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold').text(repDisplayName, 48, signatureLineY + 16, { width: 212, align: 'center', lineBreak: false, ellipsis: true });
      doc.fillColor('#475569').fontSize(6.8).font('Helvetica').text(repTitle, 48, signatureLineY + 26, { width: 212, align: 'center', lineBreak: false, ellipsis: true });
      doc.fillColor('#64748B').fontSize(6.8).font('Helvetica').text(companyDisplayName, 48, signatureLineY + 36, { width: 212, align: 'center', lineBreak: false, ellipsis: true });

      // Firma Prestador
      doc.moveTo(352, signatureLineY).lineTo(564, signatureLineY).strokeColor('#334155').lineWidth(0.8).stroke();
      doc.fillColor('#0A2540').fontSize(7.5).font('Helvetica-Bold').text('POR "EL PRESTADOR"', 352, signatureLineY + 5, { width: 212, align: 'center' });
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold').text('DR. RICARDO GARZA MORALES', 352, signatureLineY + 16, { width: 212, align: 'center' });
      doc.fillColor('#475569').fontSize(6.8).font('Helvetica').text('Director General & Operaciones Médicas', 352, signatureLineY + 26, { width: 212, align: 'center' });
      doc.fillColor('#64748B').fontSize(6.8).font('Helvetica').text('MEDICAL SYSTEM S.A. DE C.V.', 352, signatureLineY + 36, { width: 212, align: 'center' });

      // -------------------------------------------------------------
      // 8. PIE DE PÁGINA DISCRETO Y FORMAL
      // -------------------------------------------------------------
      doc.moveTo(36, 742).lineTo(576, 742).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text(
        `Folio Único: ${data.contractId} • Medical System Corporate Platform • Documento Legal Certificado • Página 1 de 1`,
        36,
        747,
        { width: 540, align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
