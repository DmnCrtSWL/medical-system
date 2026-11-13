<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Check, Lock, CreditCard, ArrowLeft, Loader2, ShieldCheck } from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import { api, errorMessage, setToken } from '../services/api';
import { allowanceLabel, annualSavings, formatCardNumber, formatMoney, type BillingCycle, type MedicalPlan } from '../lib/format';

const route = useRoute();
const router = useRouter();

const plans = ref<MedicalPlan[]>([]);
const planId = ref(String(route.query.plan || 'integral'));
const cycle = ref<BillingCycle>(route.query.ciclo === 'mensual' ? 'MONTHLY' : 'ANNUAL');
const submitting = ref(false);
const error = ref('');

const form = reactive({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
const card = reactive({ number: '', expiry: '', cvc: '', holder: '' });
const acceptTerms = ref(false);
const formRef = ref<HTMLFormElement | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.get<{ plans: MedicalPlan[] }>('/public/plans');
    plans.value = data.plans;
    if (!data.plans.some((p) => p.id === planId.value)) planId.value = data.plans[0]?.id ?? '';
  } catch {
    error.value = 'No pudimos cargar los paquetes. Recarga la página.';
  }
});

const plan = computed(() => plans.value.find((p) => p.id === planId.value));
const total = computed(() => (plan.value ? (cycle.value === 'ANNUAL' ? plan.value.annualPrice : plan.value.monthlyPrice) : 0));

const cardBrand = computed(() => {
  const d = card.number.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return '';
});

const onCardInput = (e: Event) => {
  card.number = formatCardNumber((e.target as HTMLInputElement).value);
};
const onExpiryInput = (e: Event) => {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
  card.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const submit = async () => {
  error.value = '';
  if (form.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }
  if (form.password !== form.confirmPassword) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }
  const [mm, yy] = card.expiry.split('/');
  if (!mm || !yy) {
    error.value = 'Ingresa la fecha de vencimiento como MM/AA.';
    return;
  }

  submitting.value = true;
  try {
    const { data } = await api.post<{ token: string }>('/public/checkout', {
      planId: planId.value,
      billingCycle: cycle.value,
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      card: {
        number: card.number.replace(/\D/g, ''),
        expMonth: Number(mm),
        expYear: Number(yy),
        cvc: card.cvc,
        holder: card.holder,
      },
    });
    setToken(data.token);
    router.push({ name: 'portal', query: { bienvenida: '1' } });
  } catch (err: unknown) {
    error.value = errorMessage(err, 'No fue posible completar tu compra.');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-navy-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="container-page flex h-16 items-center justify-between">
        <BrandLogo />
        <span class="flex items-center gap-2 text-xs font-semibold text-slate-500"><Lock class="h-3.5 w-3.5 text-mint-600" /> Pago seguro</span>
      </div>
    </header>

    <main class="container-page py-10">
      <RouterLink to="/#paquetes" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-800">
        <ArrowLeft class="h-4 w-4" /> Volver a paquetes
      </RouterLink>
      <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-navy-800">Contrata tu paquete</h1>
      <p class="mt-1 text-slate-500">Crea tu cuenta y activa tu cobertura en un solo paso.</p>

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form ref="formRef" class="space-y-6" @submit.prevent="submit">
          <!-- Paquete -->
          <section class="card p-6">
            <h2 class="font-bold text-navy-800">1. Paquete y forma de cobro</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                v-for="p in plans"
                :key="p.id"
                type="button"
                class="cursor-pointer rounded-xl border-2 p-4 text-left transition"
                :class="planId === p.id ? 'border-mint-500 bg-mint-50' : 'border-slate-200 hover:border-slate-300'"
                @click="planId = p.id"
              >
                <p class="font-bold text-navy-800">{{ p.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ formatMoney(p.monthlyPrice) }}/mes</p>
              </button>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                class="cursor-pointer rounded-xl border-2 p-4 text-left transition"
                :class="cycle === 'MONTHLY' ? 'border-mint-500 bg-mint-50' : 'border-slate-200 hover:border-slate-300'"
                @click="cycle = 'MONTHLY'"
              >
                <p class="font-bold text-navy-800">Cargo mensual</p>
                <p class="mt-1 text-xs text-slate-500">Se cobra automáticamente cada mes</p>
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-xl border-2 p-4 text-left transition"
                :class="cycle === 'ANNUAL' ? 'border-mint-500 bg-mint-50' : 'border-slate-200 hover:border-slate-300'"
                @click="cycle = 'ANNUAL'"
              >
                <p class="flex items-center gap-2 font-bold text-navy-800">
                  Pago anual <span class="rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-extrabold text-white">Ahorra</span>
                </p>
                <p class="mt-1 text-xs text-slate-500">Un solo cargo al año, 2 meses gratis</p>
              </button>
            </div>
          </section>

          <!-- Cuenta -->
          <section class="card p-6">
            <h2 class="font-bold text-navy-800">2. Tus datos de acceso</h2>
            <p class="mt-1 text-xs text-slate-500">Con este correo y contraseña entrarás a tu portal de cliente.</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="label" for="name">Nombre completo</label>
                <input id="name" v-model="form.name" class="input" required autocomplete="name" placeholder="Como aparece en tu identificación" />
              </div>
              <div>
                <label class="label" for="email">Correo electrónico</label>
                <input id="email" v-model="form.email" type="email" class="input" required autocomplete="email" placeholder="tucorreo@ejemplo.com" />
              </div>
              <div>
                <label class="label" for="phone">Teléfono celular</label>
                <input id="phone" v-model="form.phone" type="tel" class="input" autocomplete="tel" placeholder="55 1234 5678" />
              </div>
              <div>
                <label class="label" for="password">Contraseña</label>
                <input id="password" v-model="form.password" type="password" class="input" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label class="label" for="confirm">Confirmar contraseña</label>
                <input id="confirm" v-model="form.confirmPassword" type="password" class="input" required autocomplete="new-password" />
              </div>
            </div>
          </section>

          <!-- Pago -->
          <section class="card p-6">
            <div class="flex items-center justify-between">
              <h2 class="font-bold text-navy-800">3. Pago con tarjeta</h2>
              <span class="text-xs font-semibold text-slate-400">Visa · Mastercard · Amex</span>
            </div>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="label" for="card-number">Número de tarjeta</label>
                <div class="relative">
                  <CreditCard class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="card-number"
                    :value="card.number"
                    class="input !pl-10 font-mono tracking-wider"
                    inputmode="numeric"
                    autocomplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    required
                    @input="onCardInput"
                  />
                  <span v-if="cardBrand" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-navy-800">{{ cardBrand }}</span>
                </div>
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="holder">Nombre del titular</label>
                <input id="holder" v-model="card.holder" class="input" autocomplete="cc-name" required />
              </div>
              <div>
                <label class="label" for="expiry">Vencimiento</label>
                <input id="expiry" :value="card.expiry" class="input font-mono" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" required @input="onExpiryInput" />
              </div>
              <div>
                <label class="label" for="cvc">Código de seguridad</label>
                <input id="cvc" v-model="card.cvc" class="input font-mono" inputmode="numeric" maxlength="4" autocomplete="cc-csc" placeholder="CVC" required />
              </div>
            </div>
            <p class="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
              No guardamos el número completo de tu tarjeta ni tu código de seguridad.
            </p>
          </section>

          <label class="flex items-start gap-3 text-sm text-slate-600">
            <input v-model="acceptTerms" type="checkbox" class="mt-0.5 h-4 w-4 accent-mint-500" required />
            Acepto los términos del servicio y autorizo el cargo {{ cycle === 'ANNUAL' ? 'anual' : 'mensual recurrente' }} a mi tarjeta.
          </label>

          <p v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{{ error }}</p>

          <button type="submit" class="btn-primary w-full !py-4 text-base lg:hidden" :disabled="submitting || !plan">
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            Pagar {{ formatMoney(total) }} MXN
          </button>
        </form>

        <!-- Resumen -->
        <aside class="lg:sticky lg:top-6 lg:self-start">
          <div v-if="plan" class="overflow-hidden rounded-2xl bg-navy-800 text-white shadow-xl">
            <div class="p-6">
              <p class="text-xs font-bold uppercase tracking-wider text-mint-500">Resumen</p>
              <h3 class="mt-2 text-2xl font-extrabold">Paquete {{ plan.name }}</h3>
              <p class="mt-1 text-sm text-slate-400">{{ cycle === 'ANNUAL' ? 'Pago anual' : 'Pago mensual' }}</p>
              <ul class="mt-6 space-y-2.5 text-sm">
                <li v-for="s in plan.services" :key="s.key" class="flex items-start gap-2.5 text-slate-300">
                  <Check class="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
                  <span><strong class="text-white">{{ allowanceLabel(s.allowance) }}</strong> · {{ s.label }}</span>
                </li>
              </ul>
            </div>
            <div class="border-t border-white/10 bg-white/5 p-6">
              <div v-if="cycle === 'ANNUAL'" class="mb-2 flex justify-between text-sm text-slate-400">
                <span>Ahorro vs. mensual</span><span class="font-semibold text-mint-500">−{{ formatMoney(annualSavings(plan)) }}</span>
              </div>
              <div class="flex items-end justify-between">
                <span class="text-sm text-slate-300">Total hoy</span>
                <span class="text-3xl font-extrabold">{{ formatMoney(total) }} <span class="text-sm font-semibold text-slate-400">MXN</span></span>
              </div>
              <button type="button" class="btn-primary mt-6 hidden w-full !py-4 text-base lg:flex" :disabled="submitting" @click="formRef?.requestSubmit()">
                <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                Pagar y activar
              </button>
              <p class="mt-3 text-center text-xs text-slate-400">
                {{ cycle === 'ANNUAL' ? 'Se renueva cada año.' : 'Se renueva cada mes.' }} Cancela cuando quieras.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
