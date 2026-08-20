<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, AlertCircle } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor ingresa tu correo y contraseña.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await authStore.loginUser(email.value, password.value);
    router.push('/');
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'Error al conectar con el servidor. Revisa tu conexión.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-navy-900 flex items-center justify-center p-4">
    <Card class="max-w-md w-full border border-slate-800 shadow-2xl">
      <CardHeader class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint-100 text-mint-600 mx-auto mb-2">
          <Building2 class="w-6 h-6" />
        </div>
        <CardTitle class="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Accede con tus credenciales corporativas</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Alerta de Error -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
            <Input
              v-model="email"
              type="email"
              placeholder="doctor@ejemplo.com"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <Input
              v-model="password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            class="w-full mt-2"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando Sesión...
            </span>
            <span v-else>Entrar al Sistema</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
