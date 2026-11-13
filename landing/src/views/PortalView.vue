<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LogOut,
  CalendarClock,
  CreditCard,
  Search,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Infinity as InfinityIcon,
  Loader2,
  X,
  PartyPopper,
  Stethoscope,
  FlaskConical,
  Pill,
  Building2,
  Receipt,
  Activity,
  Crosshair,
} from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import { api, errorMessage, setToken } from '../services/api';
import { formatCardNumber, formatDate, formatMoney } from '../lib/format';

interface ServiceBalance {
  key: string;
  label: string;
  allowance: number;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
}

interface PortalSummary {
  customer: { name: string; email: string };
  plan: { id: string; name: string; perks: string[] } | null;
  subscription: {
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'ANNUAL';
    amount: number;
    startDate: string;
    periodStart: string;
    periodEnd: string;
    nextBillingDate: string;
  };
  paymentMethod: PaymentMethod;
  services: ServiceBalance[];
  recentUsage: { id: string; label: string; usedAt: string; locationName: string | null; notes: string | null }[];
  payments: { id: string; amount: number; status: string; reference: string; cardLast4: string; paidAt: string }[];
}

interface ServiceLocation {
  id: string;
  name: string;
  type: 'CLINIC' | 'LABORATORY' | 'PHARMACY' | 'HOSPITAL';
  address: string;
  city: string;
  phone: string | null;
  hours: string | null;
  lat: number;
  lng: number;
  services: string[];
  distanceKm: number | null;
}

const route = useRoute();
const router = useRouter();

const summary = ref<PortalSummary | null>(null);
const loading = ref(true);
const loadError = ref('');
const showWelcome = ref(route.query.bienvenida === '1');

const loadSummary = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const { data } = await api.get<PortalSummary>('/portal/summary');
    summary.value = data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 || status === 403) {
      logout();
      return;
    }
    loadError.value = errorMessage(err, 'No pudimos cargar tu información.');
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  setToken(null);
  router.push({ name: 'portal-login' });
};

const firstName = computed(() => summary.value?.customer.name.split(' ')[0] ?? '');

const daysToBilling = computed(() => {
  if (!summary.value) return 0;
  const diff = new Date(summary.value.subscription.nextBillingDate).getTime() - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

const totalUsed = computed(() => summary.value?.services.reduce((acc, s) => acc + s.used, 0) ?? 0);

const usagePercent = (s: ServiceBalance) => (s.unlimited ? 100 : s.allowance ? Math.min((s.used / s.allowance) * 100, 100) : 0);

const statusLabel: Record<string, { text: string; cls: string }> = {
  ACTIVE: { text: 'Activo', cls: 'bg-mint-100 text-mint-700' },
  PAST_DUE: { text: 'Pago pendiente', cls: 'bg-amber-100 text-amber-700' },
  CANCELLED: { text: 'Cancelado', cls: 'bg-slate-100 text-slate-600' },
};

// --- Método de pago ---
const showCardModal = ref(false);
const savingCard = ref(false);
const cardError = ref('');
const newCard = reactive({ number: '', expiry: '', cvc: '', holder: '' });

const openCardModal = () => {
  Object.assign(newCard, { number: '', expiry: '', cvc: '', holder: summary.value?.paymentMethod.holder ?? '' });
  cardError.value = '';
  showCardModal.value = true;
};

const onExpiryInput = (e: Event) => {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
  newCard.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const saveCard = async () => {
  cardError.value = '';
  const [mm, yy] = newCard.expiry.split('/');
  savingCard.value = true;
  try {
    const { data } = await api.put<{ paymentMethod: PaymentMethod }>('/portal/payment-method', {
      card: { number: newCard.number.replace(/\D/g, ''), expMonth: Number(mm), expYear: Number(yy), cvc: newCard.cvc, holder: newCard.holder },
    });
    if (summary.value) summary.value.paymentMethod = data.paymentMethod;
    showCardModal.value = false;
  } catch (err: unknown) {
    cardError.value = errorMessage(err, 'No pudimos actualizar tu tarjeta.');
  } finally {
    savingCard.value = false;
  }
};

// --- Buscador de servicios cercanos ---
const DEFAULT_ORIGIN = { lat: 19.4326, lng: -99.1332 }; // Centro de la Ciudad de México
const locations = ref<ServiceLocation[]>([]);
const searchQuery = ref('');
const searchType = ref('');
const searching = ref(false);
const origin = ref(DEFAULT_ORIGIN);
const usingMyLocation = ref(false);
const geoMessage = ref('');

const locationTypes = [
  { value: '', label: 'Todos', icon: MapPin },
  { value: 'CLINIC', label: 'Clínicas', icon: Stethoscope },
  { value: 'LABORATORY', label: 'Laboratorios', icon: FlaskConical },
  { value: 'PHARMACY', label: 'Farmacias', icon: Pill },
  { value: 'HOSPITAL', label: 'Hospitales', icon: Building2 },
];

const typeMeta: Record<ServiceLocation['type'], { label: string; cls: string }> = {
  CLINIC: { label: 'Clínica', cls: 'bg-mint-50 text-mint-700' },
  LABORATORY: { label: 'Laboratorio', cls: 'bg-sky-50 text-sky-700' },
  PHARMACY: { label: 'Farmacia', cls: 'bg-violet-50 text-violet-700' },
  HOSPITAL: { label: 'Hospital', cls: 'bg-rose-50 text-rose-700' },
};

const searchLocations = async () => {
  searching.value = true;
  try {
    const { data } = await api.get<{ locations: ServiceLocation[] }>('/portal/locations', {
      params: { q: searchQuery.value || undefined, type: searchType.value || undefined, lat: origin.value.lat, lng: origin.value.lng },
    });
    locations.value = data.locations;
  } catch {
    locations.value = [];
  } finally {
    searching.value = false;
  }
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchLocations, 300);
});
watch(searchType, searchLocations);

const useMyLocation = () => {
  geoMessage.value = '';
  if (!navigator.geolocation) {
    geoMessage.value = 'Tu navegador no permite obtener tu ubicación.';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      origin.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      usingMyLocation.value = true;
      searchLocations();
    },
    () => {
      geoMessage.value = 'No pudimos obtener tu ubicación. Mostramos distancias desde el centro de la CDMX.';
    },
    { timeout: 8000 }
  );
};

const directionsUrl = (l: ServiceLocation) => `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`;

onMounted(() => {
  loadSummary();
  searchLocations();
});
</script>

<template>
  <div class="min-h-screen bg-navy-50">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between">
        <BrandLogo />
        <div class="flex items-center gap-3">
          <div v-if="summary" class="hidden text-right sm:block">
            <p class="text-sm font-bold text-navy-800">{{ summary.customer.name }}</p>
            <p class="text-xs text-slate-500">{{ summary.customer.email }}</p>
          </div>
          <button class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" @click="logout">
            <LogOut class="h-4 w-4" /> <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>

    <main class="container-page py-8">
      <div v-if="loading" class="flex justify-center py-32"><Loader2 class="h-8 w-8 animate-spin text-mint-500" /></div>

      <div v-else-if="loadError" class="card mx-auto max-w-md p-8 text-center">
        <p class="font-semibold text-rose-600">{{ loadError }}</p>
        <button class="btn-secondary mt-4" @click="loadSummary">Reintentar</button>
      </div>

      <template v-else-if="summary">
        <!-- Bienvenida tras la compra -->
        <div v-if="showWelcome" class="mb-6 flex items-start gap-4 rounded-2xl border border-mint-500/30 bg-mint-50 p-5">
          <PartyPopper class="h-6 w-6 shrink-0 text-mint-600" />
          <div class="flex-1">
            <p class="font-bold text-navy-800">¡Bienvenido a MedSys, {{ firstName }}! Tu paquete ya está activo.</p>
            <p class="mt-1 text-sm text-slate-600">Ya puedes usar tus servicios en cualquier clínica de la red. Busca la más cercana aquí abajo.</p>
          </div>
          <button class="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Cerrar" @click="showWelcome = false"><X class="h-5 w-5" /></button>
        </div>

        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-navy-800 sm:text-3xl">Hola, {{ firstName }}</h1>
            <p class="mt-1 text-slate-500">Este es el resumen de tu paquete de salud.</p>
          </div>
        </div>

        <!-- Tarjetas principales -->
        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <!-- Plan -->
          <div class="relative overflow-hidden rounded-2xl bg-navy-800 p-6 text-white shadow-lg">
            <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint-500/25 blur-2xl"></div>
            <div class="relative flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-wider text-mint-500">Mi paquete</p>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="statusLabel[summary.subscription.status]?.cls">
                {{ statusLabel[summary.subscription.status]?.text }}
              </span>
            </div>
            <p class="relative mt-3 text-3xl font-extrabold">{{ summary.plan?.name }}</p>
            <p class="relative mt-1 text-sm text-slate-400">
              {{ summary.subscription.billingCycle === 'ANNUAL' ? 'Pago anual' : 'Pago mensual' }} · {{ formatMoney(summary.subscription.amount) }} MXN
            </p>
            <div class="relative mt-6 flex items-center gap-2 text-sm text-slate-300">
              <Activity class="h-4 w-4 text-mint-500" />
              <span><strong class="text-white">{{ totalUsed }}</strong> servicios usados desde {{ formatDate(summary.subscription.periodStart, false) }}</span>
            </div>
          </div>

          <!-- Próximo corte -->
          <div class="card p-6">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Próxima fecha de corte</p>
              <CalendarClock class="h-5 w-5 text-mint-600" />
            </div>
            <p class="mt-3 text-2xl font-extrabold text-navy-800">{{ formatDate(summary.subscription.nextBillingDate) }}</p>
            <p class="mt-1 text-sm text-slate-500">
              Se cargarán <strong class="text-navy-800">{{ formatMoney(summary.subscription.amount) }} MXN</strong> a tu tarjeta
            </p>
            <div class="mt-5 flex items-center gap-2">
              <span class="rounded-lg bg-mint-50 px-2.5 py-1 text-sm font-extrabold text-mint-700">
                {{ daysToBilling === 0 ? 'Hoy' : daysToBilling === 1 ? 'Mañana' : `En ${daysToBilling} días` }}
              </span>
              <span class="text-xs text-slate-400">Cargo automático</span>
            </div>
          </div>

          <!-- Método de pago -->
          <div class="card p-6">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Método de pago</p>
              <CreditCard class="h-5 w-5 text-mint-600" />
            </div>
            <div class="mt-3 rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 p-4 text-white">
              <div class="flex items-center justify-between">
                <span class="text-sm font-extrabold">{{ summary.paymentMethod.brand }}</span>
                <span class="h-6 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-80"></span>
              </div>
              <p class="mt-4 font-mono text-base tracking-widest">•••• •••• •••• {{ summary.paymentMethod.last4 }}</p>
              <div class="mt-2 flex justify-between text-[11px] text-slate-400">
                <span class="truncate uppercase">{{ summary.paymentMethod.holder }}</span>
                <span>{{ String(summary.paymentMethod.expMonth).padStart(2, '0') }}/{{ String(summary.paymentMethod.expYear).slice(-2) }}</span>
              </div>
            </div>
            <button class="mt-3 w-full cursor-pointer rounded-xl py-2 text-sm font-bold text-mint-600 hover:bg-mint-50" @click="openCardModal">Cambiar tarjeta</button>
          </div>
        </div>

        <!-- Uso de servicios -->
        <section class="card mt-6 p-6">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 class="text-lg font-extrabold text-navy-800">Mis servicios</h2>
              <p class="text-sm text-slate-500">
                Periodo del {{ formatDate(summary.subscription.periodStart, false) }} al {{ formatDate(summary.subscription.periodEnd) }}
              </p>
            </div>
          </div>
          <div class="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="s in summary.services" :key="s.key">
              <div class="flex items-start justify-between gap-3">
                <p class="text-sm font-semibold text-slate-700">{{ s.label }}</p>
                <p v-if="s.unlimited" class="flex shrink-0 items-center gap-1 text-sm font-extrabold text-mint-600">
                  <InfinityIcon class="h-4 w-4" /> Ilimitado
                </p>
                <p v-else class="shrink-0 text-sm font-extrabold text-navy-800">
                  {{ s.used }}<span class="font-semibold text-slate-400"> / {{ s.allowance }}</span>
                </p>
              </div>
              <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full transition-all"
                  :class="s.unlimited ? 'bg-mint-500/30' : s.remaining === 0 ? 'bg-amber-400' : 'bg-mint-500'"
                  :style="{ width: `${usagePercent(s)}%` }"
                ></div>
              </div>
              <p class="mt-1.5 text-xs text-slate-500">
                <template v-if="s.unlimited">{{ s.used }} usados en este periodo</template>
                <template v-else-if="s.remaining === 0">Ya usaste todos · tarifa preferencial disponible</template>
                <template v-else>Te quedan <strong class="text-navy-800">{{ s.remaining }}</strong></template>
              </p>
            </div>
          </div>
        </section>

        <!-- Buscador de servicios cercanos -->
        <section id="buscador" class="card mt-6 p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold text-navy-800">Servicios cerca de ti</h2>
              <p class="text-sm text-slate-500">
                {{ usingMyLocation ? 'Ordenados por distancia desde tu ubicación' : 'Distancias desde el centro de la CDMX' }}
              </p>
            </div>
            <button class="btn-secondary !py-2" @click="useMyLocation">
              <Crosshair class="h-4 w-4 text-mint-600" /> Usar mi ubicación
            </button>
          </div>
          <p v-if="geoMessage" class="mt-3 text-xs font-semibold text-amber-700">{{ geoMessage }}</p>

          <div class="relative mt-5">
            <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input v-model="searchQuery" class="input !rounded-2xl !py-3 !pl-11" placeholder="Busca por servicio, colonia o nombre: urgencias, laboratorio, Roma…" />
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="t in locationTypes"
              :key="t.value"
              class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition"
              :class="searchType === t.value ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
              @click="searchType = t.value"
            >
              <component :is="t.icon" class="h-3.5 w-3.5" /> {{ t.label }}
            </button>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-2">
            <div v-if="searching && !locations.length" class="col-span-full flex justify-center py-10"><Loader2 class="h-6 w-6 animate-spin text-mint-500" /></div>
            <p v-else-if="!locations.length" class="col-span-full py-10 text-center text-sm text-slate-500">No encontramos servicios con esa búsqueda.</p>
            <article v-for="l in locations" :key="l.id" class="rounded-xl border border-slate-200 p-4 transition hover:border-mint-500/50 hover:shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <span class="rounded-md px-2 py-0.5 text-[11px] font-bold" :class="typeMeta[l.type].cls">{{ typeMeta[l.type].label }}</span>
                  <h3 class="mt-2 font-bold text-navy-800">{{ l.name }}</h3>
                  <p class="mt-0.5 flex items-start gap-1.5 text-xs text-slate-500"><MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0" /> {{ l.address }}, {{ l.city }}</p>
                </div>
                <span v-if="l.distanceKm !== null" class="shrink-0 rounded-lg bg-navy-50 px-2 py-1 text-xs font-extrabold text-navy-800">{{ l.distanceKm }} km</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <span v-for="s in l.services" :key="s" class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{{ s }}</span>
              </div>
              <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span v-if="l.hours" class="flex items-center gap-1.5"><Clock class="h-3.5 w-3.5" /> {{ l.hours }}</span>
                <div class="flex items-center gap-1">
                  <a v-if="l.phone" :href="`tel:${l.phone.replace(/\s/g, '')}`" class="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-navy-800 hover:bg-slate-50">
                    <Phone class="h-3.5 w-3.5" /> Llamar
                  </a>
                  <a :href="directionsUrl(l)" target="_blank" rel="noopener" class="flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-mint-600 hover:bg-mint-50">
                    <Navigation class="h-3.5 w-3.5" /> Cómo llegar
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Actividad y pagos -->
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <section class="card p-6">
            <h2 class="text-lg font-extrabold text-navy-800">Actividad reciente</h2>
            <p v-if="!summary.recentUsage.length" class="mt-6 text-sm text-slate-500">Aún no has usado servicios. ¡Agenda tu primera consulta!</p>
            <ol v-else class="mt-5 space-y-4">
              <li v-for="u in summary.recentUsage" :key="u.id" class="flex gap-3">
                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-mint-500 ring-4 ring-mint-50"></span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p class="text-sm font-bold text-navy-800">{{ u.label }}</p>
                    <p class="text-xs text-slate-400">{{ formatDate(u.usedAt) }}</p>
                  </div>
                  <p class="text-xs text-slate-500">{{ [u.notes, u.locationName].filter(Boolean).join(' · ') || 'En línea' }}</p>
                </div>
              </li>
            </ol>
          </section>

          <section class="card p-6">
            <h2 class="text-lg font-extrabold text-navy-800">Historial de pagos</h2>
            <ul class="mt-5 divide-y divide-slate-100">
              <li v-for="p in summary.payments" :key="p.id" class="flex items-center justify-between gap-3 py-3">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-50 text-mint-600"><Receipt class="h-4 w-4" /></span>
                  <div>
                    <p class="text-sm font-bold text-navy-800">{{ formatDate(p.paidAt) }}</p>
                    <p class="text-xs text-slate-500">{{ p.reference }} · tarjeta •••• {{ p.cardLast4 }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-extrabold text-navy-800">{{ formatMoney(p.amount) }}</p>
                  <p class="text-xs font-semibold text-mint-600">Pagado</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </main>

    <!-- Modal: cambiar tarjeta -->
    <div v-if="showCardModal" class="fixed inset-0 z-50 flex items-center justify-center bg-navy-800/60 p-4 backdrop-blur-sm" @click.self="showCardModal = false">
      <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="saveCard">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-navy-800">Cambiar tarjeta</h3>
          <button type="button" class="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Cerrar" @click="showCardModal = false"><X class="h-5 w-5" /></button>
        </div>
        <p class="mt-1 text-sm text-slate-500">Tus próximos cargos se harán a esta tarjeta.</p>
        <div class="mt-5 space-y-4">
          <div>
            <label class="label" for="nc-number">Número de tarjeta</label>
            <input id="nc-number" :value="newCard.number" class="input font-mono" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" required @input="newCard.number = formatCardNumber(($event.target as HTMLInputElement).value)" />
          </div>
          <div>
            <label class="label" for="nc-holder">Nombre del titular</label>
            <input id="nc-holder" v-model="newCard.holder" class="input" autocomplete="cc-name" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="nc-exp">Vencimiento</label>
              <input id="nc-exp" :value="newCard.expiry" class="input font-mono" inputmode="numeric" placeholder="MM/AA" autocomplete="cc-exp" required @input="onExpiryInput" />
            </div>
            <div>
              <label class="label" for="nc-cvc">CVC</label>
              <input id="nc-cvc" v-model="newCard.cvc" class="input font-mono" inputmode="numeric" maxlength="4" autocomplete="cc-csc" required />
            </div>
          </div>
        </div>
        <p v-if="cardError" class="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{{ cardError }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showCardModal = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="savingCard"><Loader2 v-if="savingCard" class="h-4 w-4 animate-spin" /> Guardar tarjeta</button>
        </div>
      </form>
    </div>
  </div>
</template>
