<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, FileText, LogOut, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile();
  }
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-navy-900 text-slate-100 relative p-6 flex flex-col items-center justify-center">
    <!-- Top-Right Bar (Header) cuando hay sesion activa -->
    <div
      v-if="authStore.token"
      class="absolute top-6 right-6 flex items-center gap-3 bg-slate-900/95 border border-slate-800 p-2.5 px-4 rounded-2xl shadow-2xl"
    >
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-mint-500 shrink-0" />
        <div class="text-left">
          <p class="text-[10px] text-slate-400 font-medium">Sesión Activa</p>
          <p class="text-xs font-bold text-slate-100">{{ authStore.user?.name || authStore.user?.email || 'Usuario' }}</p>
        </div>
        <span class="text-[9px] font-bold uppercase tracking-wider bg-mint-500/10 text-mint-400 px-1.5 py-0.5 rounded-md border border-mint-500/20 ml-1">
          {{ authStore.user?.role || 'ADMIN' }}
        </span>
      </div>

      <div class="h-6 w-px bg-slate-800 mx-1"></div>

      <Button
        variant="ghost"
        size="sm"
        class="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl px-2.5 cursor-pointer"
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4 mr-1" />
        Salir
      </Button>
    </div>

    <!-- Main Card -->
    <Card class="max-w-md w-full text-center shadow-2xl border border-slate-800 bg-white">
      <CardHeader>
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint-100 text-mint-600 mx-auto mb-2">
          <Building2 class="w-6 h-6" />
        </div>
        <CardTitle class="text-3xl font-extrabold text-navy-900">Medical System</CardTitle>
        <CardDescription class="text-base text-slate-500">
          Plataforma de Gestión Médica B2B & Consultas
        </CardDescription>
      </CardHeader>

      <CardContent class="pt-2">
        <template v-if="authStore.token">
          <div class="space-y-3">
            <router-link to="/companies" class="block">
              <Button variant="default" size="lg" class="w-full bg-mint-500 hover:bg-mint-600 font-semibold shadow-lg rounded-xl cursor-pointer flex items-center justify-center gap-2">
                <Building2 class="w-5 h-5" />
                Gestión de Empresas B2B
              </Button>
            </router-link>

            <router-link to="/contracts" class="block">
              <Button variant="secondary" size="lg" class="w-full bg-navy-900 hover:bg-navy-800 font-semibold shadow-lg rounded-xl cursor-pointer flex items-center justify-center gap-2">
                <FileText class="w-5 h-5 text-mint-400" />
                Convenios & Contratos B2B
              </Button>
            </router-link>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-slate-600 mb-4">Inicia sesión con tus credenciales corporativas para acceder al sistema.</p>
          <router-link to="/login">
            <Button variant="default" size="lg" class="w-full bg-mint-500 hover:bg-mint-600 font-semibold rounded-xl cursor-pointer">
              Iniciar Sesión
            </Button>
          </router-link>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
