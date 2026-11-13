export type QuestionType = 'text' | 'textarea' | 'choice' | 'multi';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  why?: string;
  placeholder?: string;
  options?: string[];
  allowOther?: boolean;
}

export interface QuestionSection {
  id: string;
  title: string;
  intro: string;
  questions: Question[];
}

/**
 * Cuestionario de descubrimiento para completar el contenido del sitio público.
 * Las preguntas de paquetes parten de la propuesta actual para que el cliente solo confirme o corrija.
 */
export const QUESTIONNAIRE: QuestionSection[] = [
  {
    id: 'negocio',
    title: 'Tu negocio',
    intro: 'Empecemos por lo esencial: quién eres y qué ofreces.',
    questions: [
      {
        id: 'nombre_comercial',
        type: 'text',
        title: '¿Cuál es el nombre comercial con el que quieres aparecer en el sitio?',
        why: 'Hoy usamos "MedSys" como nombre provisional.',
        placeholder: 'Ej. MedSys Salud',
      },
      {
        id: 'descripcion_corta',
        type: 'textarea',
        title: 'Si tuvieras que explicar tu servicio en una sola frase a alguien que no te conoce, ¿qué le dirías?',
        why: 'Será el titular principal de la página de inicio.',
        placeholder: 'Ej. Consultas médicas ilimitadas para ti y tu familia por una cuota fija mensual.',
      },
      {
        id: 'problema',
        type: 'textarea',
        title: '¿Qué problema le resuelves a tus clientes que hoy no resuelven bien en otro lado?',
        why: 'Nos ayuda a escribir los beneficios con tus palabras.',
      },
      {
        id: 'diferenciador',
        type: 'textarea',
        title: '¿Por qué alguien te elegiría a ti y no a un seguro de gastos médicos, una aseguradora o una clínica de farmacia?',
        why: 'Es el argumento de venta más importante del sitio.',
      },
      {
        id: 'trayectoria',
        type: 'textarea',
        title: '¿Cuántos años llevan operando, cuántos pacientes o empresas atienden, y algún dato que dé confianza?',
        why: 'Cifras como "más de 5,000 consultas" generan confianza en la landing.',
        placeholder: 'Ej. 8 años, 12 empresas, 3,000 empleados atendidos',
      },
    ],
  },
  {
    id: 'cliente',
    title: 'Tu cliente ideal',
    intro: 'Queremos hablarle a la persona correcta.',
    questions: [
      {
        id: 'publico',
        type: 'multi',
        title: '¿A quién le quieres vender los paquetes del sitio?',
        options: ['Personas individuales', 'Familias', 'Adultos mayores', 'Trabajadores independientes', 'Pequeñas empresas', 'Empresas grandes'],
        allowOther: true,
      },
      {
        id: 'zona',
        type: 'text',
        title: '¿En qué ciudades o zonas das servicio hoy?',
        why: 'Define dónde mostrar clínicas y qué decir sobre cobertura.',
        placeholder: 'Ej. CDMX y área metropolitana',
      },
      {
        id: 'edades',
        type: 'choice',
        title: '¿Hay límite de edad o condiciones para contratar un paquete?',
        options: ['No, cualquier persona puede contratar', 'Sí, hay límite de edad', 'Sí, no se aceptan algunas condiciones preexistentes'],
        allowOther: true,
      },
      {
        id: 'familia',
        type: 'choice',
        title: '¿Un paquete cubre solo al titular o puede incluir familiares?',
        why: 'Hoy los paquetes son individuales.',
        options: ['Solo al titular', 'Titular + familiares con costo extra', 'Hay paquetes familiares separados'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'servicios',
    title: 'Servicios médicos',
    intro: 'Lo que realmente incluyen tus paquetes.',
    questions: [
      {
        id: 'servicios_ofrecidos',
        type: 'multi',
        title: '¿Qué servicios ofreces hoy? Marca todos los que apliquen.',
        options: [
          'Medicina general',
          'Telemedicina / videoconsulta',
          'Especialistas',
          'Laboratorio clínico',
          'Estudios de imagen (rayos X, ultrasonido)',
          'Nutrición',
          'Psicología',
          'Odontología',
          'Urgencias',
          'Ambulancia',
          'Check-up anual',
          'Vacunación',
          'Descuentos en farmacia',
        ],
        allowOther: true,
      },
      {
        id: 'especialidades',
        type: 'textarea',
        title: '¿Qué especialidades médicas incluyes? ¿Hay alguna que no cubras?',
        placeholder: 'Ej. Cardiología, ginecología, pediatría… No incluye oncología.',
      },
      {
        id: 'laboratorio_detalle',
        type: 'textarea',
        title: '¿Qué estudios de laboratorio entran en un "estudio de laboratorio" del paquete?',
        why: 'Así evitamos prometer algo que no incluyes.',
        placeholder: 'Ej. Química sanguínea de 6 elementos, biometría hemática y examen general de orina',
      },
      {
        id: 'telemedicina',
        type: 'choice',
        title: '¿La telemedicina está disponible 24/7?',
        why: 'Hoy el sitio dice "Telemedicina 24/7".',
        options: ['Sí, 24/7', 'Solo en horario de consultorio', 'Todavía no ofrecemos telemedicina'],
        allowOther: true,
      },
      {
        id: 'como_agendar',
        type: 'choice',
        title: '¿Cómo agenda una cita el cliente?',
        options: ['Por WhatsApp', 'Por teléfono', 'En una app o página web', 'Llega sin cita'],
        allowOther: true,
      },
      {
        id: 'excedentes',
        type: 'textarea',
        title: 'Cuando un cliente ya usó todos los servicios de su paquete, ¿qué pasa?',
        why: 'Hoy el sitio dice que puede seguir con "tarifa preferencial".',
        placeholder: 'Ej. Paga $300 por consulta extra',
      },
    ],
  },
  {
    id: 'paquetes',
    title: 'Paquetes y tarifas',
    intro: 'Pusimos una propuesta inicial en el sitio. Confírmala o corrígela.',
    questions: [
      {
        id: 'num_paquetes',
        type: 'choice',
        title: 'Propusimos 3 paquetes: Esencial, Integral y Premium. ¿Te funciona?',
        options: ['Sí, 3 paquetes con esos nombres', 'Sí, 3 paquetes pero con otros nombres', 'Prefiero 2 paquetes', 'Prefiero 4 o más paquetes', 'Un solo paquete'],
        allowOther: true,
      },
      {
        id: 'paquete_basico',
        type: 'textarea',
        title: 'Paquete básico (hoy "Esencial", $349/mes o $3,490/año): ¿nombre, precio y qué incluye realmente?',
        why: 'Propuesta actual: 6 consultas generales al año, telemedicina ilimitada, 1 estudio de laboratorio y 10% en farmacias.',
        placeholder: 'Escribe "Está bien" o los cambios',
      },
      {
        id: 'paquete_medio',
        type: 'textarea',
        title: 'Paquete intermedio (hoy "Integral", $699/mes o $6,990/año): ¿nombre, precio y qué incluye?',
        why: 'Propuesta actual: 12 consultas generales, 4 con especialista, 2 de laboratorio, 2 de nutrición, 1 urgencia, telemedicina ilimitada y 15% en farmacias.',
        placeholder: 'Escribe "Está bien" o los cambios',
      },
      {
        id: 'paquete_premium',
        type: 'textarea',
        title: 'Paquete superior (hoy "Premium", $1,290/mes o $12,900/año): ¿nombre, precio y qué incluye?',
        why: 'Propuesta actual: consultas generales ilimitadas, 12 con especialista, 4 de laboratorio, 6 de nutrición, 3 urgencias, check-up anual, médico de cabecera y ambulancia en CDMX.',
        placeholder: 'Escribe "Está bien" o los cambios',
      },
      {
        id: 'cobro',
        type: 'choice',
        title: '¿Cómo quieres cobrar los paquetes?',
        options: ['Mensual y anual', 'Solo mensual', 'Solo anual'],
        allowOther: true,
      },
      {
        id: 'descuento_anual',
        type: 'choice',
        title: 'Para el pago anual propusimos "2 meses gratis" (unos 17% de descuento). ¿Lo mantenemos?',
        options: ['Sí, 2 meses gratis', 'Un descuento menor', 'Un descuento mayor', 'Sin descuento por pago anual'],
        allowOther: true,
      },
      {
        id: 'iva',
        type: 'choice',
        title: '¿Los precios que muestras deben incluir IVA?',
        options: ['Sí, precios con IVA incluido', 'No, se muestra precio + IVA', 'Los servicios médicos están exentos de IVA'],
        allowOther: true,
      },
      {
        id: 'plazo_forzoso',
        type: 'choice',
        title: '¿Hay plazo forzoso o el cliente puede cancelar cuando quiera?',
        why: 'Hoy el sitio dice "Cancela cuando quieras".',
        options: ['Cancela cuando quiera', 'Plazo mínimo de 6 meses', 'Plazo mínimo de 12 meses'],
        allowOther: true,
      },
      {
        id: 'periodo_espera',
        type: 'choice',
        title: '¿El cliente puede usar los servicios desde el primer día o hay un periodo de espera?',
        options: ['Desde el primer día', 'Hay periodo de espera para algunos servicios'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'red',
    title: 'Clínicas y red médica',
    intro: 'Para que el buscador del portal muestre lugares reales.',
    questions: [
      {
        id: 'sucursales',
        type: 'textarea',
        title: 'Escribe tus clínicas o consultorios propios: nombre, dirección, teléfono y horario.',
        why: 'Hoy el buscador muestra ubicaciones de ejemplo.',
        placeholder: 'Una por línea. Ej. Clínica Roma · Álvaro Obregón 120 · 55 1234 5678 · L-D 7 a 22',
      },
      {
        id: 'convenios',
        type: 'textarea',
        title: '¿Tienes convenio con laboratorios, farmacias u hospitales? ¿Cuáles?',
        placeholder: 'Ej. Laboratorios Chopo (10% de descuento), Hospital Ángeles para urgencias',
      },
      {
        id: 'medicos',
        type: 'textarea',
        title: '¿Quieres mostrar a tus médicos en el sitio? Si sí, ¿quiénes, con especialidad y cédula?',
        why: 'Mostrar médicos con cédula profesional aumenta la confianza.',
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y facturación',
    intro: 'Para conectar el cobro real con tarjeta.',
    questions: [
      {
        id: 'pasarela',
        type: 'choice',
        title: '¿Ya tienes cuenta con alguna pasarela de pagos?',
        why: 'Hoy el cobro del sitio es simulado; necesitamos conectar una real.',
        options: ['Stripe', 'Conekta', 'Openpay', 'Mercado Pago', 'Clip', 'No tengo ninguna'],
        allowOther: true,
      },
      {
        id: 'metodos_pago',
        type: 'multi',
        title: '¿Qué formas de pago quieres aceptar?',
        options: ['Tarjeta de crédito', 'Tarjeta de débito', 'Pago en OXXO', 'Transferencia SPEI', 'Meses sin intereses'],
        allowOther: true,
      },
      {
        id: 'factura',
        type: 'choice',
        title: '¿El cliente puede pedir factura (CFDI)?',
        options: ['Sí, siempre', 'Sí, solo si la solicita', 'No emitimos factura'],
        allowOther: true,
      },
      {
        id: 'razon_social',
        type: 'text',
        title: '¿Qué razón social y RFC aparecen en los cobros y recibos?',
        placeholder: 'Ej. Servicios Médicos XYZ S.A. de C.V. · RFC',
      },
      {
        id: 'cobro_fallido',
        type: 'choice',
        title: 'Si el cargo mensual a la tarjeta falla, ¿qué hacemos?',
        options: ['Reintentar varios días y luego suspender', 'Suspender de inmediato', 'Avisar y dar unos días de gracia'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal y confianza',
    intro: 'Lo que el sitio necesita para operar sin riesgos.',
    questions: [
      {
        id: 'documentos_legales',
        type: 'multi',
        title: '¿Qué documentos legales ya tienes listos?',
        options: ['Aviso de privacidad', 'Términos y condiciones', 'Contrato de adhesión', 'Política de cancelación y reembolsos', 'Ninguno todavía'],
      },
      {
        id: 'permisos',
        type: 'textarea',
        title: '¿Tienes registros o permisos que debamos mencionar (COFEPRIS, licencia sanitaria, registro ante PROFECO)?',
      },
      {
        id: 'reembolsos',
        type: 'textarea',
        title: '¿Cuál es tu política de cancelación y reembolso?',
        placeholder: 'Ej. Si cancela en los primeros 15 días se devuelve el 100% si no usó servicios',
      },
    ],
  },
  {
    id: 'marca',
    title: 'Marca y contenido',
    intro: 'Los últimos detalles para que el sitio se vea y suene como tú.',
    questions: [
      {
        id: 'tono',
        type: 'choice',
        title: '¿Cómo quieres que hable el sitio con tus clientes?',
        options: ['Cercano y cálido (de "tú")', 'Profesional y formal (de "usted")', 'Muy médico y técnico'],
        allowOther: true,
      },
      {
        id: 'logo',
        type: 'choice',
        title: '¿Tienes logotipo y colores de marca definidos?',
        why: 'Hoy usamos el verde y azul marino del panel administrativo.',
        options: ['Sí, te los envío', 'Usemos los colores actuales', 'No, necesito que me ayuden'],
        allowOther: true,
      },
      {
        id: 'testimonios',
        type: 'textarea',
        title: '¿Tienes testimonios de pacientes o empresas que podamos publicar (con su permiso)?',
      },
      {
        id: 'preguntas_frecuentes',
        type: 'textarea',
        title: '¿Cuáles son las 3 a 5 preguntas que más te hacen los clientes antes de contratar?',
        why: 'Las convertimos en la sección de preguntas frecuentes.',
      },
      {
        id: 'contacto',
        type: 'textarea',
        title: '¿Qué datos de contacto mostramos? (WhatsApp, teléfono, correo, redes sociales)',
      },
      {
        id: 'comentarios',
        type: 'textarea',
        title: '¿Algo más que debamos saber o que te gustaría ver en el sitio?',
      },
    ],
  },
];

export const ALL_QUESTIONS = QUESTIONNAIRE.flatMap((section) =>
  section.questions.map((question) => ({ ...question, sectionId: section.id, sectionTitle: section.title }))
);

export const UNKNOWN_ANSWER = 'Aún no lo sé';
