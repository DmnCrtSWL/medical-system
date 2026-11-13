<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2, Mail, Lock } from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import { api, errorMessage, setToken } from '../services/api';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const login = async () => {
  error.value = '';
  loading.value = true;
  try {
    const { data } = await api.post<{ token: string; user: { role: string } }>('/auth/login', {
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });
    if (data.user.role !== 'CLIENT') {
      error.value = 'Este acceso es para clientes con paquete. El personal debe usar el panel administrativo.';
      return;
    }
    setToken(data.token);
    router.push({ name: 'portal' });
  } catch (err: unknown) {
    const msg = errorMessage(err, 'No pudimos iniciar sesión.');
    error.value = msg === 'Invalid credentials' ? 'Correo o contraseña incorrectos.' : msg;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <div class="relative hidden overflow-hidden bg-navy-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-mint-500/20 blur-3xl"></div>
      <BrandLogo dark />
      <div class="relative">
        <h2 class="text-4xl font-extrabold leading-tight text-white">Tu salud,<br />bajo control.</h2>
        <p class="mt-4 max-w-md text-slate-300">Consulta cuántos servicios te quedan, tu próxima fecha de corte y encuentra la clínica más cercana.</p>
      </div>
      <p class="relative text-xs text-slate-500">© {{ new Date().getFullYear() }} MedSys Healthcare Systems</p>
    </div>

    <div class="flex items-center justify-center bg-navy-50 px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="mb-8 lg:hidden"><BrandLogo /></div>
        <h1 class="text-2xl font-extrabold text-navy-800">Entra a tu portal</h1>
        <p class="mt-1 text-sm text-slate-500">Usa el correo y la contraseña que registraste al contratar.</p>

        <form class="mt-8 space-y-4" @submit.prevent="login">
          <div>
            <label class="label" for="email">Correo electrónico</label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="email" v-model="email" type="email" class="input !pl-10" required autocomplete="email" />
            </div>
          </div>
          <div>
            <label class="label" for="password">Contraseña</label>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="password" v-model="password" type="password" class="input !pl-10" required autocomplete="current-password" />
            </div>
          </div>
          <p v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{{ error }}</p>
          <button type="submit" class="btn-primary w-full !py-3.5" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" /> Entrar
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-500">
          ¿Aún no tienes paquete?
          <RouterLink to="/#paquetes" class="font-bold text-mint-600 hover:text-mint-700">Conoce los paquetes</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
