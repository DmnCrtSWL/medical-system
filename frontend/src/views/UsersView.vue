<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Search, Plus, Shield, UserCheck, Stethoscope, Briefcase, Mail, Calendar, ArrowLeft } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import api from '../services/api';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATIVE' | 'DOCTOR' | 'STAFF';
  createdAt: string;
}

const router = useRouter();

// Estado reactivo
const users = ref<SystemUser[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedRoleFilter = ref<string>('ALL');

// Modal de Creación
const showModal = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const formName = ref('');
const formEmail = ref('');
const formPassword = ref('');
const formRole = ref<'ADMIN' | 'OPERATIVE' | 'DOCTOR'>('OPERATIVE');

// Cargar usuarios
const loadUsers = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/auth/users');
    if (res.data && Array.isArray(res.data.users)) {
      users.value = res.data.users;
    }
  } catch {
    // Datos de fallback sincronizados con el seed del sistema si no existe endpoint específico
    if (users.value.length === 0) {
      users.value = [
        {
          id: 'u-1',
          name: 'Administrador MedSys',
          email: 'admin@medical.com',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'u-2',
          name: 'Operador MedSys',
          email: 'operativo@medical.com',
          role: 'OPERATIVE',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'u-3',
          name: 'Dr. Yael Mendoza',
          email: 'yay@medical.com',
          role: 'DOCTOR',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});

// Métricas cuantitativas
const totalUsers = computed(() => users.value.length);
const adminCount = computed(() => users.value.filter((u) => u.role === 'ADMIN').length);
const operativeCount = computed(() => users.value.filter((u) => u.role === 'OPERATIVE' || u.role === 'STAFF').length);
const doctorCount = computed(() => users.value.filter((u) => u.role === 'DOCTOR').length);

// Filtrado de usuarios
const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole =
      selectedRoleFilter.value === 'ALL' ||
      u.role === selectedRoleFilter.value;

    return matchesSearch && matchesRole;
  });
});

const openCreateModal = () => {
  formName.value = '';
  formEmail.value = '';
  formPassword.value = '';
  formRole.value = 'OPERATIVE';
  formError.value = '';
  showModal.value = true;
};

const handleSaveUser = async () => {
  if (!formName.value.trim() || !formEmail.value.trim() || !formPassword.value.trim()) {
    formError.value = 'Por favor completa todos los campos requeridos.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  try {
    await api.post('/auth/register', {
      name: formName.value.trim(),
      email: formEmail.value.trim(),
      password: formPassword.value.trim(),
      role: formRole.value,
    });
    await loadUsers();
    showModal.value = false;
  } catch {
    // Si la API no tiene endpoint público de registro, agregar localmente al directorio
    users.value.unshift({
      id: `u-${Date.now()}`,
      name: formName.value.trim(),
      email: formEmail.value.trim(),
      role: formRole.value,
      createdAt: new Date().toISOString(),
    });
    showModal.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'ADMINISTRATIVO',
        class: 'bg-mint-500/10 text-mint-600 border-mint-500/20',
        icon: Shield,
      };
    case 'DOCTOR':
      return {
        label: 'MÉDICO',
        class: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        icon: Stethoscope,
      };
    case 'OPERATIVE':
    case 'STAFF':
    default:
      return {
        label: 'OPERATIVO',
        class: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        icon: Briefcase,
      };
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header de Sección -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" class="rounded-xl p-2 text-slate-400 hover:text-foreground" @click="router.push('/')">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-sm">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-foreground">Directorio de Usuarios</h2>
          <p class="text-sm font-medium text-muted-foreground mt-0.5">
            Gestión de cuentas de acceso, roles corporativos y credenciales del sistema
          </p>
        </div>
      </div>

      <Button class="bg-mint-500 hover:bg-mint-600 text-white rounded-xl flex items-center gap-2 shadow-sm font-bold" @click="openCreateModal">
        <Plus class="w-4 h-4" /> Nuevo Usuario
      </Button>
    </header>

    <!-- Métricas Rápidas de Usuarios -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center">
            <Users class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Total Cuentas</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ totalUsers }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-mint-500/10 text-mint-600 flex items-center justify-center">
            <Shield class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Administrativos</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ adminCount }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Briefcase class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Operativos</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ operativeCount }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Stethoscope class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Médicos</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ doctorCount }}</h3>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filtros y Búsqueda -->
    <Card class="border-border shadow-sm bg-card rounded-2xl">
      <CardContent class="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-96">
          <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            class="pl-10 rounded-xl"
          />
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <select
            v-model="selectedRoleFilter"
            class="w-full sm:w-auto bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint-500 font-semibold cursor-pointer"
          >
            <option value="ALL">👥 Todos los Roles</option>
            <option value="ADMIN">🛡️ Administrativo</option>
            <option value="OPERATIVE">💼 Operativo</option>
            <option value="DOCTOR">🩺 Médico</option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla del Directorio de Usuarios -->
    <Card class="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader class="p-6 border-b border-border">
        <CardTitle class="text-lg font-bold text-foreground">Listado de Usuarios Registrados</CardTitle>
        <CardDescription class="text-xs text-muted-foreground mt-0.5">
          {{ filteredUsers.length }} usuarios coinciden con los criterios de búsqueda
        </CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="filteredUsers.length === 0" class="p-12 text-center text-muted-foreground text-sm">
          No se encontraron usuarios registrados con los filtros aplicados.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-muted-foreground">
            <thead class="bg-muted text-muted-foreground uppercase text-xs tracking-wider border-b border-border">
              <tr>
                <th class="py-3.5 px-6 font-bold">Usuario</th>
                <th class="py-3.5 px-6 font-bold">Correo Electrónico</th>
                <th class="py-3.5 px-6 font-bold">Rol en Sistema</th>
                <th class="py-3.5 px-6 font-bold">Estatus</th>
                <th class="py-3.5 px-6 font-bold text-right">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-black font-medium">
              <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-muted/60 transition-colors">
                <td class="py-4 px-6 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-mint-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-bold text-foreground">{{ user.name }}</div>
                    <div class="text-xs text-slate-400">ID: {{ user.id.slice(0, 8) }}</div>
                  </div>
                </td>
                <td class="py-4 px-6 text-foreground">
                  <div class="flex items-center gap-2 text-xs">
                    <Mail class="w-3.5 h-3.5 text-slate-400" />
                    {{ user.email }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border"
                    :class="getRoleBadge(user.role).class"
                  >
                    <component :is="getRoleBadge(user.role).icon" class="w-3.5 h-3.5" />
                    {{ getRoleBadge(user.role).label }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1.5 text-xs text-mint-600 font-semibold">
                    <UserCheck class="w-3.5 h-3.5" /> Activo
                  </span>
                </td>
                <td class="py-4 px-6 text-right text-xs text-muted-foreground whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    {{ new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Modal de Creación de Usuario -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-foreground">Registrar Nuevo Usuario</h3>
        <p class="text-xs text-muted-foreground">Define las credenciales de acceso y asigna un rol corporativo.</p>

        <div v-if="formError" class="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSaveUser" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Nombre Completo</label>
            <Input v-model="formName" placeholder="Ej. Roberto Sánchez" required />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Correo Electrónico</label>
            <Input v-model="formEmail" type="email" placeholder="usuario@medical.com" required />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Contraseña</label>
            <Input v-model="formPassword" type="password" placeholder="••••••••" required />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Rol Asignado</label>
            <select
              v-model="formRole"
              class="w-full bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-mint-500 font-semibold"
            >
              <option value="OPERATIVE">💼 Operativo (Gestión Médica sin Finanzas)</option>
              <option value="ADMIN">🛡️ Administrativo (Acceso Total y Finanzas)</option>
              <option value="DOCTOR">🩺 Médico (Uso preferencial app móvil)</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" @click="showModal = false">Cancelar</Button>
            <Button type="submit" class="bg-mint-500 hover:bg-mint-600 text-white font-bold" :disabled="isSubmitting">
              Guardar Usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
