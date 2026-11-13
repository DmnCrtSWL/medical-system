<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  Check,
  ShieldCheck,
  Video,
  FlaskConical,
  HeartPulse,
  MapPin,
  CreditCard,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Smartphone,
  CalendarCheck,
  Lock,
} from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import { api } from '../services/api';
import { allowanceLabel, annualSavings, formatMoney, type BillingCycle, type MedicalPlan } from '../lib/format';

const plans = ref<MedicalPlan[]>([]);
const loadError = ref(false);
const cycle = ref<BillingCycle>('ANNUAL');
const openFaq = ref<number | null>(0);

onMounted(async () => {
  try {
    const { data } = await api.get<{ plans: MedicalPlan[] }>('/public/plans');
    plans.value = data.plans;
  } catch {
    loadError.value = true;
  }
});

// Filas de la tabla comparativa: todos los servicios que aparecen en algún paquete
const comparisonRows = computed(() => {
  const rows = new Map<string, string>();
  plans.value.forEach((p) => p.services.forEach((s) => rows.set(s.key, s.label)));
  return Array.from(rows, ([key, label]) => ({
    key,
    label,
    values: plans.value.map((p) => p.services.find((s) => s.key === key)?.allowance ?? 0),
  }));
});

const priceFor = (plan: MedicalPlan) => (cycle.value === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice);

const benefits = [
  { icon: HeartPulse, title: 'Médicos certificados', text: 'Atención con médicos generales y especialistas verificados con cédula profesional.' },
  { icon: Video, title: 'Telemedicina 24/7', text: 'Consulta por videollamada a cualquier hora, sin salir de casa y sin costo extra.' },
  { icon: FlaskConical, title: 'Laboratorio incluido', text: 'Estudios clínicos de rutina incluidos en tu paquete, con resultados digitales.' },
  { icon: MapPin, title: 'Red cerca de ti', text: 'Clínicas, laboratorios, farmacias y hospitales en convenio para atenderte cerca.' },
];

const steps = [
  { icon: Sparkles, title: 'Elige tu paquete', text: 'Compara los tres niveles y decide si pagas cada mes o una sola vez al año.' },
  { icon: CreditCard, title: 'Paga con tarjeta', text: 'Pago seguro con tarjeta de crédito o débito. Tu cobertura se activa al instante.' },
  { icon: Smartphone, title: 'Usa tu portal', text: 'Consulta qué servicios te quedan, tu próxima fecha de corte y encuentra clínicas cercanas.' },
];

const faqs = [
  { q: '¿Cuál es la diferencia entre pago mensual y anual?', a: 'Con el pago mensual se hace un cargo automático cada mes a tu tarjeta. Con el pago anual pagas una sola vez y ahorras el equivalente a dos meses. Los servicios incluidos son los mismos.' },
  { q: '¿Cuándo puedo empezar a usar mis servicios?', a: 'Inmediatamente. En cuanto se confirma el pago se crea tu cuenta y puedes entrar a tu portal para agendar tu primera consulta.' },
  { q: '¿Qué pasa si se terminan los servicios de mi paquete?', a: 'Puedes seguir atendiéndote en la red con tarifa preferencial, o cambiar a un paquete de mayor nivel en cualquier momento.' },
  { q: '¿Puedo cambiar mi tarjeta de cobro?', a: 'Sí. Desde tu portal de cliente puedes actualizar tu método de pago cuando quieras.' },
  { q: '¿Mis datos de tarjeta están seguros?', a: 'Nunca guardamos el número completo de tu tarjeta ni el código de seguridad. Solo conservamos la marca y los últimos 4 dígitos para que identifiques tu método de pago.' },
];
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Navegación -->
    <header class="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between">
        <BrandLogo />
        <nav class="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a href="#beneficios" class="hover:text-navy-800">Beneficios</a>
          <a href="#paquetes" class="hover:text-navy-800">Paquetes</a>
          <a href="#como-funciona" class="hover:text-navy-800">Cómo funciona</a>
          <a href="#preguntas" class="hover:text-navy-800">Preguntas</a>
        </nav>
        <div class="flex items-center gap-2">
          <RouterLink to="/portal/login" class="hidden rounded-xl px-4 py-2 text-sm font-bold text-navy-800 hover:bg-slate-50 sm:inline-flex">
            Mi portal
          </RouterLink>
          <a href="#paquetes" class="btn-primary !py-2.5">Contratar</a>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-navy-800">
      <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-mint-500/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-mint-500/10 blur-3xl"></div>
      <div class="container-page relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-mint-500/30 bg-mint-500/10 px-3 py-1 text-xs font-bold text-mint-500">
            <ShieldCheck class="h-3.5 w-3.5" /> Salud preventiva sin complicaciones
          </span>
          <h1 class="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Tu médico de confianza,<br /><span class="text-mint-500">con un solo pago.</span>
          </h1>
          <p class="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
            Paquetes de servicios médicos con consultas, especialistas, laboratorio y telemedicina 24/7. Paga cada mes o una vez al año y úsalos cuando los necesites.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="#paquetes" class="btn-primary !px-6 !py-3.5 text-base">Ver paquetes <ArrowRight class="h-4 w-4" /></a>
            <RouterLink to="/portal/login" class="inline-flex items-center rounded-xl border border-white/15 px-6 py-3.5 text-base font-bold text-white hover:bg-white/5">
              Ya soy cliente
            </RouterLink>
          </div>
          <div class="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
            <span class="flex items-center gap-2"><Check class="h-4 w-4 text-mint-500" /> Activación inmediata</span>
            <span class="flex items-center gap-2"><Check class="h-4 w-4 text-mint-500" /> Sin preexistencias</span>
            <span class="flex items-center gap-2"><Check class="h-4 w-4 text-mint-500" /> Cancela cuando quieras</span>
          </div>
        </div>

        <!-- Vista previa del portal -->
        <div class="relative hidden lg:block">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur">
            <div class="rounded-2xl bg-white p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-slate-500">Paquete activo</p>
                  <p class="text-lg font-extrabold text-navy-800">Integral</p>
                </div>
                <span class="rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-mint-700">Activo</span>
              </div>
              <div class="mt-6 space-y-4">
                <div v-for="row in [{ l: 'Consultas generales', u: 3, t: 12 }, { l: 'Especialistas', u: 1, t: 4 }, { l: 'Laboratorio', u: 1, t: 2 }]" :key="row.l">
                  <div class="flex justify-between text-xs font-semibold">
                    <span class="text-slate-600">{{ row.l }}</span>
                    <span class="text-navy-800">{{ row.u }} de {{ row.t }}</span>
                  </div>
                  <div class="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div class="h-2 rounded-full bg-mint-500" :style="{ width: `${(row.u / row.t) * 100}%` }"></div>
                  </div>
                </div>
              </div>
              <div class="mt-6 flex items-center gap-3 rounded-xl bg-navy-50 p-3">
                <CalendarCheck class="h-5 w-5 text-mint-600" />
                <div class="text-xs">
                  <p class="font-semibold text-slate-500">Próximo cargo</p>
                  <p class="font-bold text-navy-800">15 de diciembre · $699</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Beneficios -->
    <section id="beneficios" class="py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-bold uppercase tracking-wider text-mint-600">Beneficios</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">Atención médica completa en un solo lugar</h2>
          <p class="mt-4 text-slate-500">Todo lo que necesitas para cuidar tu salud, con precios claros y sin sorpresas.</p>
        </div>
        <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="b in benefits" :key="b.title" class="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-600">
              <component :is="b.icon" class="h-5 w-5" />
            </span>
            <h3 class="mt-5 font-bold text-navy-800">{{ b.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">{{ b.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Paquetes -->
    <section id="paquetes" class="bg-navy-50 py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-bold uppercase tracking-wider text-mint-600">Paquetes</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">Elige el nivel de cuidado que necesitas</h2>
          <p class="mt-4 text-slate-500">Paga cada mes o una sola vez al año. Con el pago anual te regalamos dos meses.</p>
        </div>

        <!-- Selector mensual / anual -->
        <div class="mt-10 flex justify-center">
          <div class="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              class="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold transition"
              :class="cycle === 'MONTHLY' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'"
              @click="cycle = 'MONTHLY'"
            >
              Mensual
            </button>
            <button
              class="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition"
              :class="cycle === 'ANNUAL' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'"
              @click="cycle = 'ANNUAL'"
            >
              Anual
              <span class="rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-extrabold text-white">2 meses gratis</span>
            </button>
          </div>
        </div>

        <p v-if="loadError" class="mt-10 text-center text-sm text-rose-600">No pudimos cargar los paquetes. Recarga la página para intentarlo de nuevo.</p>

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="relative flex flex-col rounded-3xl border p-8 transition"
            :class="plan.highlighted ? 'border-navy-800 bg-navy-800 text-white shadow-2xl lg:-my-4 lg:py-12' : 'border-slate-200 bg-white shadow-sm'"
          >
            <span v-if="plan.highlighted" class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mint-500 px-4 py-1 text-xs font-extrabold text-white shadow">
              El más elegido
            </span>
            <h3 class="text-xl font-extrabold" :class="plan.highlighted ? 'text-white' : 'text-navy-800'">{{ plan.name }}</h3>
            <p class="mt-2 min-h-10 text-sm" :class="plan.highlighted ? 'text-slate-300' : 'text-slate-500'">{{ plan.tagline }}</p>

            <div class="mt-6 flex items-end gap-1">
              <span class="text-4xl font-extrabold tracking-tight">{{ formatMoney(priceFor(plan)) }}</span>
              <span class="mb-1 text-sm font-semibold" :class="plan.highlighted ? 'text-slate-400' : 'text-slate-500'">
                MXN / {{ cycle === 'ANNUAL' ? 'año' : 'mes' }}
              </span>
            </div>
            <p class="mt-1 h-5 text-xs font-semibold text-mint-500">
              <template v-if="cycle === 'ANNUAL'">Un solo pago · ahorras {{ formatMoney(annualSavings(plan)) }}</template>
              <template v-else>Cargo automático cada mes</template>
            </p>

            <RouterLink
              :to="{ name: 'checkout', query: { plan: plan.id, ciclo: cycle === 'ANNUAL' ? 'anual' : 'mensual' } }"
              class="mt-6 w-full"
              :class="plan.highlighted ? 'btn-primary' : 'btn-secondary'"
            >
              Contratar {{ plan.name }}
            </RouterLink>

            <ul class="mt-8 space-y-3 text-sm">
              <li v-for="s in plan.services" :key="s.key" class="flex items-start gap-3">
                <Check class="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
                <span :class="plan.highlighted ? 'text-slate-200' : 'text-slate-600'">
                  <strong :class="plan.highlighted ? 'text-white' : 'text-navy-800'">{{ allowanceLabel(s.allowance) }}</strong> · {{ s.label }}
                </span>
              </li>
              <li v-for="perk in plan.perks" :key="perk" class="flex items-start gap-3">
                <Check class="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
                <span :class="plan.highlighted ? 'text-slate-200' : 'text-slate-600'">{{ perk }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Comparativa -->
        <div v-if="plans.length" class="card mt-16 overflow-x-auto">
          <table class="w-full min-w-[560px] text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left">
                <th class="px-6 py-4 font-bold text-navy-800">Compara los servicios</th>
                <th v-for="p in plans" :key="p.id" class="px-4 py-4 text-center font-bold text-navy-800">{{ p.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparisonRows" :key="row.key" class="border-b border-slate-50 last:border-0">
                <td class="px-6 py-3.5 text-slate-600">{{ row.label }}</td>
                <td v-for="(v, i) in row.values" :key="i" class="px-4 py-3.5 text-center font-semibold">
                  <span v-if="v === -1" class="text-mint-600">Ilimitado</span>
                  <span v-else-if="v === 0" class="text-slate-300">—</span>
                  <span v-else class="text-navy-800">{{ v }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock class="h-3.5 w-3.5" /> Pago seguro con tarjeta de crédito o débito. Precios en pesos mexicanos con IVA incluido.
        </p>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section id="como-funciona" class="py-20">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-bold uppercase tracking-wider text-mint-600">Cómo funciona</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">Contrata en menos de 3 minutos</h2>
        </div>
        <div class="mt-14 grid gap-8 md:grid-cols-3">
          <div v-for="(s, i) in steps" :key="s.title" class="text-center">
            <div class="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-mint-500">
              <component :is="s.icon" class="h-6 w-6" />
              <span class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-xs font-extrabold text-white">{{ i + 1 }}</span>
            </div>
            <h3 class="mt-5 font-bold text-navy-800">{{ s.title }}</h3>
            <p class="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Preguntas frecuentes -->
    <section id="preguntas" class="bg-navy-50 py-20">
      <div class="container-page max-w-3xl">
        <h2 class="text-center text-3xl font-extrabold tracking-tight text-navy-800">Preguntas frecuentes</h2>
        <div class="mt-10 space-y-3">
          <div v-for="(f, i) in faqs" :key="f.q" class="card overflow-hidden">
            <button class="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-bold text-navy-800" @click="openFaq = openFaq === i ? null : i">
              {{ f.q }}
              <ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition" :class="openFaq === i ? 'rotate-180' : ''" />
            </button>
            <p v-if="openFaq === i" class="px-6 pb-5 text-sm leading-relaxed text-slate-500">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-20">
      <div class="container-page">
        <div class="relative overflow-hidden rounded-3xl bg-navy-800 px-8 py-14 text-center">
          <div class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-mint-500/20 blur-3xl"></div>
          <h2 class="relative text-3xl font-extrabold tracking-tight text-white">Empieza a cuidar tu salud hoy</h2>
          <p class="relative mx-auto mt-3 max-w-xl text-slate-300">Activa tu paquete en minutos y agenda tu primera consulta.</p>
          <a href="#paquetes" class="btn-primary relative mt-8 !px-8 !py-3.5 text-base">Elegir mi paquete</a>
        </div>
      </div>
    </section>

    <footer class="border-t border-slate-100 py-10">
      <div class="container-page flex flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
        <BrandLogo />
        <p>© {{ new Date().getFullYear() }} MedSys Healthcare Systems. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>
