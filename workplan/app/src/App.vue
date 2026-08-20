<script setup>
import { ref, computed } from 'vue'
import { Calendar, CheckCircle2, ChevronDown, Rocket, Smartphone, ShieldCheck, ArrowRight, Languages, Database, Server, Monitor, Globe } from 'lucide-vue-next'
import TimelineItem from './components/TimelineItem.vue'

const lang = ref('es')

const content = {
  es: {
    toggleLang: 'English',
    title: 'Medical Management System',
    subtitle: 'Timeline & Plan de Trabajo B2B',
    goalDate: 'Meta Final: 11 de Diciembre, 2026',
    scrollPrompt: 'Desliza para ver la línea de tiempo',
    clientReviewTitle: 'Hito del Cliente',
    keySections: 'Secciones Clave',
    utilityValue: 'Utilidad / Valor',
    ecosystemTitle: 'Mapa del Ecosistema',
    ecosystemSubtitle: 'Los 5 entornos principales que componen la plataforma.',
    cronogramaTitle: 'CRONOGRAMA DE ENTREGAS',
    cronogramaSubtitle: 'Calendario detallado de desarrollo en sprints de 2 semanas.',
    environments: [
      { id: 'env-1', name: 'Administrador Web', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500', bgGlow: 'bg-yellow-500', sections: 'CRUD de Usuarios, Cartera de Clientes B2B, Generador de Contratos, Módulo de Caja, Estadísticas', utility: 'Es el panel de control maestro. Permite al personal operar la clínica, facturar y ofrecer a las empresas métricas de salud.' },
      { id: 'env-2', name: 'Aplicación Móvil', colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400', bgGlow: 'bg-blue-500', sections: 'Formularios Clínicos, Buscador de Pacientes, Modo Offline', utility: 'La herramienta de los doctores. Permite registrar diagnósticos rápido (incluso sin internet) y sincronizarlos.' },
      { id: 'env-3', name: 'Backend & Base de Datos', colorClass: 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]', bgGlow: 'bg-[#34D399]', sections: 'API REST, BD, Motor PDF, Sync', utility: 'Es el "Cerebro Invisible". Garantiza la seguridad, conecta la app con el admin y genera los documentos.' },
      { id: 'env-4', name: 'Portal del Paciente', colorClass: 'bg-white/10 border-white/30 text-white', bgGlow: 'bg-white', sections: 'Expediente Personal, Pólizas (Seguros), Agenda de Citas', utility: 'Interfaz pública y privada para pacientes. Les da control de su salud y sirve como punto de venta B2C.' },
      { id: 'env-5', name: 'Sitio Promocional (Landing)', colorClass: 'bg-slate-400/10 border-slate-400/30 text-slate-300', bgGlow: 'bg-slate-400', sections: 'Beneficios B2B, Contacto, Testimonios', utility: 'Herramienta de Marketing. Sirve para captar nuevas empresas corporativas que quieran afiliarse al servicio.' },
    ],
    stages: [
      {
        title: 'Fase 0 y 1: Fundamentos y Backend Core',
        date: '21 de Agosto y 04 de Septiembre',
        progress: 15,
        clientReview: 'Aprobación del Look & Feel y validación de seguridad (Login).',
        departments: [
          { name: 'Base de Datos', icon: Database, tasks: ['Diseño de esquemas y arquitectura base', 'Modelos de Autenticación'] },
          { name: 'Backend', icon: Server, tasks: ['Infraestructura en la nube', 'API REST Core'] },
          { name: 'Landing Web', icon: Globe, tasks: ['Aprobación del Sistema de Diseño', 'Despliegue del sitio promocional'] },
        ]
      },
      {
        title: 'Fase 2 y 3: Operación B2B y Contratos',
        date: '18 de Septiembre y 02 de Octubre',
        progress: 0,
        clientReview: 'Momento Clave: Creación de empresa de prueba y generación automática de contrato PDF.',
        departments: [
          { name: 'Admin', icon: Monitor, tasks: ['CRUD de Usuarios Internos', 'Gestión de Cartera de Doctores', 'Módulo de Corporativos'] },
          { name: 'Backend', icon: Server, tasks: ['Lógica PDF de contratos', 'Endpoints B2B'] },
        ]
      },
      {
        title: 'Fase 4 y 5: Finanzas y Setup Móvil',
        date: '16 y 30 de Octubre',
        progress: 0,
        clientReview: 'Revisión del Dashboard financiero con datos semilla y primera instalación de la app nativa en teléfono.',
        departments: [
          { name: 'Admin', icon: Monitor, tasks: ['Módulo de Caja (Ingresos/Egresos)', 'Calendario de contratos'] },
          { name: 'App (Móvil)', icon: Smartphone, tasks: ['Kickoff del proyecto nativo', 'Navegación base', 'Login médico'] },
        ]
      },
      {
        title: 'Fase 6 y 7: Historia Clínica y Sincronización',
        date: '13 y 27 de Noviembre',
        progress: 0,
        clientReview: 'El cliente llenará una historia clínica en la app como doctor y la verá instantáneamente en el Panel Admin.',
        departments: [
          { name: 'App (Móvil)', icon: Smartphone, tasks: ['Formularios de Historia Clínica', 'Gestión offline y caché'] },
          { name: 'Backend', icon: Server, tasks: ['Endpoints de sincronización bidireccional'] },
          { name: 'Base de Datos', icon: Database, tasks: ['Estructuras de sync y resolución de conflictos'] },
        ]
      },
      {
        title: 'Fase 8 y 9: QA y Lanzamiento General',
        date: '11 de Diciembre',
        progress: 0,
        clientReview: 'Sign-off final. Prueba piloto en vivo con un Médico de Confianza. Búsqueda de bugs antes de operar.',
        departments: [
          { name: 'Calidad (QA)', icon: ShieldCheck, tasks: ['Prueba piloto con doctor real', 'Bug Bash integral'] },
          { name: 'Release', icon: Rocket, tasks: ['Pase a Producción total', 'Monitoreo de estabilidad'] },
        ]
      }
    ]
  },
  en: {
    toggleLang: 'Español',
    title: 'Medical Management System',
    subtitle: 'B2B Timeline & Workplan',
    goalDate: 'Final Goal: December 11th, 2026',
    scrollPrompt: 'Scroll to view timeline',
    clientReviewTitle: 'Client Milestone',
    keySections: 'Key Sections',
    utilityValue: 'Utility / Value',
    ecosystemTitle: 'Ecosystem Map',
    ecosystemSubtitle: 'The 5 main environments of the platform.',
    cronogramaTitle: 'DELIVERY SCHEDULE',
    cronogramaSubtitle: 'Detailed development calendar in 2-week sprints.',
    environments: [
      { id: 'env-1', name: 'Web Administrator', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500', bgGlow: 'bg-yellow-500', sections: 'Users CRUD, B2B Clients, Contract Generator, Finances, Statistics', utility: 'The master control panel. Allows internal staff to operate the clinic and offer health metrics to companies.' },
      { id: 'env-2', name: 'Mobile Application', colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400', bgGlow: 'bg-blue-500', sections: 'Clinical Forms, Patient Search, Offline Mode', utility: 'The doctors daily tool. Allows quick diagnosis registration (even offline) and syncs with headquarters.' },
      { id: 'env-3', name: 'Backend & Database', colorClass: 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]', bgGlow: 'bg-[#34D399]', sections: 'REST API, DB, PDF Engine, Sync', utility: 'The "Invisible Brain". Guarantees security, connects the app with the admin, and generates documents.' },
      { id: 'env-4', name: 'Patient Portal', colorClass: 'bg-white/10 border-white/30 text-white', bgGlow: 'bg-white', sections: 'Personal Record, Policies (Insurance), Appointments', utility: 'Public and private interface for patients. Gives control over their health and acts as a B2C sales point.' },
      { id: 'env-5', name: 'Promotional Site (Landing)', colorClass: 'bg-slate-400/10 border-slate-400/30 text-slate-300', bgGlow: 'bg-slate-400', sections: 'B2B Benefits, Contact, Testimonials', utility: 'Marketing tool. Serves to capture new corporate companies that want to join the service.' },
    ],
    stages: [
      {
        title: 'Phase 0 & 1: Foundations & Core Backend',
        date: 'August 21st & September 4th',
        progress: 15,
        clientReview: 'Look & Feel approval and security validation (Login).',
        departments: [
          { name: 'Database', icon: Database, tasks: ['Schema design and base architecture', 'Authentication Models'] },
          { name: 'Backend', icon: Server, tasks: ['Cloud infrastructure', 'Core REST API'] },
          { name: 'Landing Web', icon: Globe, tasks: ['Design System Approval', 'Promotional site deployment'] },
        ]
      },
      {
        title: 'Phase 2 & 3: B2B Operations & Contracts',
        date: 'September 18th & October 2nd',
        progress: 0,
        clientReview: 'Key Moment: Creation of a test company and automated PDF contract generation.',
        departments: [
          { name: 'Admin', icon: Monitor, tasks: ['Internal Users CRUD', 'Doctors Portfolio', 'Corporate Module'] },
          { name: 'Backend', icon: Server, tasks: ['PDF contract generation logic', 'B2B Endpoints'] },
        ]
      },
      {
        title: 'Phase 4 & 5: Finances & Mobile Setup',
        date: 'October 16th & 30th',
        progress: 0,
        clientReview: 'Financial Dashboard review with seed data and first native app installation on phone.',
        departments: [
          { name: 'Admin', icon: Monitor, tasks: ['Cash Flow Module', 'Contracts Calendar'] },
          { name: 'App (Mobile)', icon: Smartphone, tasks: ['Native project kickoff', 'Base navigation', 'Doctor Login'] },
        ]
      },
      {
        title: 'Phase 6 & 7: Clinical History & Sync',
        date: 'November 13th & 27th',
        progress: 0,
        clientReview: 'Client will fill out a clinical history in the app and see it instantly in the Admin Panel.',
        departments: [
          { name: 'App (Mobile)', icon: Smartphone, tasks: ['Clinical History Forms', 'Offline cache management'] },
          { name: 'Backend', icon: Server, tasks: ['Bidirectional sync endpoints'] },
          { name: 'Database', icon: Database, tasks: ['Sync structures and conflict resolution'] },
        ]
      },
      {
        title: 'Phase 8 & 9: QA & General Release',
        date: 'December 11th',
        progress: 0,
        clientReview: 'Final sign-off. Live pilot test with a Trusted Doctor. Bug hunt before operations.',
        departments: [
          { name: 'Quality (QA)', icon: ShieldCheck, tasks: ['Pilot test with real doctor', 'Integral Bug Bash'] },
          { name: 'Release', icon: Rocket, tasks: ['Full Production Deployment', 'Stability monitoring'] },
        ]
      }
    ]
  }
}

const t = computed(() => content[lang.value])

const toggleLang = () => {
  lang.value = lang.value === 'es' ? 'en' : 'es'
}
</script>

<template>
  <div class="min-h-screen bg-[#0A2540] text-slate-100 font-sans relative overflow-x-hidden selection:bg-[#34D399] selection:text-[#0A2540]">
    
    <!-- Floating Lang Toggle -->
    <button 
      @click="toggleLang" 
      class="fixed top-6 right-6 z-50 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all text-sm font-medium shadow-xl">
      <Languages class="w-4 h-4" />
      {{ t.toggleLang }}
    </button>

    <!-- Header / Cover -->
    <header class="h-screen w-full flex flex-col items-center justify-center relative p-6 bg-gradient-to-br from-[#0A2540] to-[#1A4D8F]">
      <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
      
      <div class="z-10 text-center animate-fade-in-up max-w-4xl mt-12">
        <div class="bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30 px-5 py-2 rounded-full inline-block mb-8 text-sm font-semibold tracking-widest uppercase shadow-lg shadow-[#34D399]/20 backdrop-blur-sm">
          {{ t.goalDate }}
        </div>
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 text-white drop-shadow-2xl leading-tight">
          {{ t.title }}
        </h1>
        <p class="text-2xl md:text-3xl font-light text-[#34D399] mb-12 opacity-90">
          {{ t.subtitle }}
        </p>
      </div>

      <div class="absolute bottom-12 flex flex-col items-center animate-bounce text-blue-300 opacity-80 cursor-default">
        <span class="text-xs uppercase tracking-widest mb-3 font-semibold">{{ t.scrollPrompt }}</span>
        <ChevronDown class="w-6 h-6" />
      </div>
    </header>

    <!-- Ecosystem Map Section -->
    <section class="relative max-w-7xl mx-auto px-6 py-24 border-b border-white/5">
      <div class="text-center mb-16 animate-fade-in-up">
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">{{ t.ecosystemTitle }}</h2>
        <p class="text-xl text-slate-400">{{ t.ecosystemSubtitle }}</p>
      </div>

      <div class="relative flex flex-col gap-12 md:gap-24 py-12 max-w-5xl mx-auto mt-10">
        <!-- Path connecting line -->
        <div class="absolute left-8 md:left-1/2 top-0 bottom-0 w-0 border-l-4 border-dashed border-white/10 md:-translate-x-1/2 z-0">
           <!-- Moving glowing dot representing data flow -->
           <div class="absolute left-[-6px] top-0 w-2 h-16 bg-[#34D399] rounded-full shadow-[0_0_15px_#34D399] animate-data-flow"></div>
        </div>

        <div v-for="(env, index) in t.environments" :key="env.id" 
             class="relative z-10 w-full md:w-5/12 group overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ml-16 md:ml-0"
             :class="[env.colorClass, index % 2 === 0 ? 'md:self-start' : 'md:self-end']">
          
          <!-- Connection dot to the main line -->
          <div class="hidden md:block absolute top-1/2 w-full h-0 border-t border-dashed border-white/20 -z-10" :class="index % 2 === 0 ? '-right-full' : '-left-full'"></div>
          
          <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full mix-blend-screen filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" :class="env.bgGlow"></div>
          
          <div class="flex items-center gap-4 mb-5">
             <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-black/30 border shadow-inner" :class="env.colorClass">{{ index + 1 }}</div>
             <h3 class="text-2xl font-bold">{{ env.name }}</h3>
          </div>
          
          <div class="mb-6 pl-14">
            <h4 class="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">{{ t.keySections }}</h4>
            <p class="text-sm font-medium leading-relaxed opacity-90">{{ env.sections }}</p>
          </div>
          
          <div class="pl-14">
            <h4 class="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">{{ t.utilityValue }}</h4>
            <p class="text-sm leading-relaxed opacity-90 italic">"{{ env.utility }}"</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <main class="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
      <!-- Cronograma Title -->
      <div class="text-center mb-24 animate-fade-in-up">
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight uppercase">{{ t.cronogramaTitle }}</h2>
        <p class="text-xl text-[#34D399] font-medium">{{ t.cronogramaSubtitle }}</p>
      </div>
      <!-- Central Line (Desktop only) -->
      <div class="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#0A2540] via-white/10 to-[#0A2540] z-0"></div>

      <!-- Timeline Items -->
      <TimelineItem 
        v-for="(stage, index) in t.stages" 
        :key="index"
        :index="index"
        :align="index % 2 === 0 ? 'left' : 'right'"
        :progress="stage.progress"
      >
        <!-- Card Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <p class="font-bold text-lg md:text-xl font-mono tracking-tight mb-1" :class="stage.progress === 0 ? 'text-slate-400' : 'text-yellow-400'">{{ stage.date }}</p>
            <h2 class="text-2xl md:text-3xl font-bold leading-tight" :class="stage.progress === 0 ? 'text-slate-300' : 'text-white'">{{ stage.title }}</h2>
          </div>
          <div class="flex flex-col items-end">
            <div v-if="stage.progress > 0" class="text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse mb-2 whitespace-nowrap">
               In progress
            </div>
            <div class="text-xl font-bold font-mono" :class="stage.progress === 0 ? 'text-slate-500' : 'text-yellow-400'">
               {{ stage.progress }}%
            </div>
          </div>
        </div>

        <!-- Departments Breakdown -->
        <div class="space-y-6 mb-8">
          <div v-for="(dept, dIdx) in stage.departments" :key="dIdx" class="flex items-start gap-4">
            <div class="p-2.5 bg-white/5 rounded-xl border mt-0.5 shadow-inner" :class="stage.progress === 0 ? 'border-white/10' : 'bg-yellow-500/10 border-yellow-500/20'">
              <component :is="dept.icon" class="w-5 h-5" :class="stage.progress === 0 ? 'text-slate-400' : 'text-yellow-500'" />
            </div>
            <div>
              <h4 class="font-semibold text-base mb-1.5 tracking-wide" :class="stage.progress === 0 ? 'text-slate-400' : 'text-white'">{{ dept.name }}</h4>
              <ul class="space-y-1">
                <li v-for="(task, tIdx) in dept.tasks" :key="tIdx" class="text-sm md:text-base flex items-start gap-2 leading-relaxed" :class="stage.progress === 0 ? 'text-slate-500' : 'text-slate-300'">
                  <span class="text-xs mt-1" :class="stage.progress === 0 ? 'text-slate-600' : 'text-white/30'">▹</span>
                  <span>{{ task }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Client Milestone Box -->
        <div class="mt-8 pt-6 border-t bg-black/20 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-2xl" :class="stage.progress === 0 ? 'border-white/5' : 'border-white/10'">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" :class="stage.progress === 0 ? 'text-slate-500' : 'text-yellow-500'">
            <CheckCircle2 class="w-4 h-4" />
            {{ t.clientReviewTitle }}
          </h3>
          <p class="text-base md:text-lg font-medium leading-relaxed italic" :class="stage.progress === 0 ? 'text-slate-500' : 'text-slate-200'">
            "{{ stage.clientReview }}"
          </p>
        </div>
      </TimelineItem>
    </main>

    <!-- Footer -->
    <footer class="py-12 text-center text-slate-500 text-sm border-t border-white/5 relative z-10 bg-[#0A2540]">
      Medical Management System B2B © 2026
    </footer>

  </div>
</template>

<style>
/* Base Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Scrollbar styling for a cleaner look */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0A2540; 
}
::-webkit-scrollbar-thumb {
  background: #1A4D8F; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #34D399; 
}

/* Data flow animation */
@keyframes dataFlow {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.animate-data-flow {
  animation: dataFlow 8s ease-in-out infinite;
}
</style>
