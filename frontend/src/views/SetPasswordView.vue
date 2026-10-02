<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import api from '../services/api';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// Estado de verificación del token
const tokenState = ref<'loading' | 'valid' | 'invalid'>('loading');
const tokenUser = ref<{ name: string; email: string } | null>(null);
const token = ref('');

// Estado del formulario
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isDone = ref(false);

// Verificar token al montar
onMounted(async () => {
  const rawToken = route.query.token as string;
  if (!rawToken) {
    tokenState.value = 'invalid';
    return;
  }
  token.value = rawToken;

  try {
    const res = await api.get(`/auth/verify-set-password-token?token=${encodeURIComponent(rawToken)}`);
    if (res.data.valid) {
      tokenUser.value = res.data.user;
      tokenState.value = 'valid';
    } else {
      tokenState.value = 'invalid';
    }
  } catch {
    tokenState.value = 'invalid';
  }
});

const handleSetPassword = async () => {
  errorMessage.value = '';

  if (!password.value || !confirmPassword.value) {
    errorMessage.value = 'Por favor completa ambos campos.';
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden. Verifica e intenta de nuevo.';
    return;
  }

  isSubmitting.value = true;
  try {
    await api.post('/auth/set-password', {
      token: token.value,
      password: password.value,
    });
    isDone.value = true;
    successMessage.value = '¡Contraseña configurada exitosamente! Redirigiendo al inicio de sesión...';
    setTimeout(() => router.push('/login'), 2500);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.message;
      errorMessage.value = typeof msg === 'string' ? msg : 'Ocurrió un error al establecer la contraseña. Intenta de nuevo.';
    } else if (err instanceof Error) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = 'Ocurrió un error al establecer la contraseña. Intenta de nuevo.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-navy-900 flex items-center justify-center p-4">

    <!-- Estado: Cargando token -->
    <div v-if="tokenState === 'loading'" class="flex flex-col items-center gap-4 text-white">
      <Loader2 class="w-10 h-10 animate-spin text-mint-400" />
      <p class="text-sm text-slate-400">Verificando enlace de activación...</p>
    </div>

    <!-- Estado: Token inválido o expirado -->
    <Card v-else-if="tokenState === 'invalid'" class="max-w-md w-full border border-slate-800 shadow-2xl">
      <CardHeader class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto mb-2">
          <AlertCircle class="w-6 h-6" />
        </div>
        <CardTitle class="text-2xl">Enlace no válido</CardTitle>
        <CardDescription>
          Este enlace de activación ha expirado o ya fue utilizado. Solicita al administrador que te envíe uno nuevo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="default" class="w-full" @click="router.push('/login')">
          Volver al Inicio de Sesión
        </Button>
      </CardContent>
    </Card>

    <!-- Estado: Token válido — mostrar formulario -->
    <Card v-else class="max-w-md w-full border border-slate-800 shadow-2xl">
      <CardHeader class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint-100 text-mint-600 mx-auto mb-2">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <CardTitle class="text-2xl">Configura tu Contraseña</CardTitle>
        <CardDescription v-if="tokenUser">
          Bienvenido, <strong>{{ tokenUser.name }}</strong>. Elige una contraseña segura para tu cuenta.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <!-- Éxito -->
        <div
          v-if="isDone"
          class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-3"
        >
          <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Formulario -->
        <form v-else class="space-y-5" @submit.prevent="handleSetPassword">
          <!-- Error -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Nueva contraseña -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nueva Contraseña</label>
            <div class="relative">
              <Input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                :disabled="isSubmitting"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Confirmar contraseña -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Contraseña</label>
            <div class="relative">
              <Input
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Repite la contraseña"
                :disabled="isSubmitting"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                @click="showConfirm = !showConfirm"
              >
                <Eye v-if="!showConfirm" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Indicador de coincidencia -->
          <p
            v-if="password && confirmPassword"
            class="text-xs font-semibold"
            :class="password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'"
          >
            {{ password === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden' }}
          </p>

          <Button type="submit" variant="default" class="w-full mt-2" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Guardando...
            </span>
            <span v-else>Establecer Contraseña</span>
          </Button>
        </form>
      </CardContent>
    </Card>

  </div>
</template>
