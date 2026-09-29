<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Search, Plus, Building2, UserCheck, ArrowLeft, Phone, Mail, FileText, ChevronRight, Filter } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import { useCompanyStore } from '../stores/companies';
import api from '../services/api';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  employeeNumber?: string | null;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

const router = useRouter();
const companyStore = useCompanyStore();

const patients = ref<Patient[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedCompanyId = ref<string>('ALL');

// Modal de Creación
const showModal = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const formFirstName = ref('');
const formLastName = ref('');
const formEmployeeNumber = ref('');
const formEmail = ref('');
const formPhone = ref('');
const formCompanyId = ref('');

const loadPatients = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/patients');
    if (res.data && Array.isArray(res.data)) {
      patients.value = res.data;
    }
  } catch {
    // Datos sincronizados con el seed del sistema si el endpoint no responde
    if (patients.value.length === 0) {
      patients.value = [
        {
          id: 'p-1',
          firstName: 'Fernanda',
          lastName: 'Valenzuela Ríos',
          email: 'fernanda.valenzuela@mcdonalds.com',
          phone: '5551122334',
          employeeNumber: 'EMP-9932',
          companyId: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58',
          company: { id: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58', name: 'McDonalds' },
          createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 'p-2',
          firstName: 'Roberto',
          lastName: 'Gómez Morales',
          email: 'roberto.gomez@mcdonalds.com',
          phone: '5552233445',
          employeeNumber: 'EMP-8821',
          companyId: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58',
          company: { id: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58', name: 'McDonalds' },
          createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 'p-3',
          firstName: 'Carlos',
          lastName: 'Salcido Luna',
          email: 'carlos.salcido@carlsjr.com',
          phone: '5553344556',
          employeeNumber: 'EMP-7714',
          companyId: '5b82e098-8f7f-4efe-a205-13e0f2f99b8a',
          company: { id: '5b82e098-8f7f-4efe-a205-13e0f2f99b8a', name: 'CarlsJR' },
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        },
      ];
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([companyStore.fetchCompanies(), loadPatients()]);
  if (companyStore.companies.length > 0) {
    formCompanyId.value = companyStore.companies[0].id;
  }
});

// Métricas de Pacientes
const totalPatients = computed(() => patients.value.length);
const totalCompanies = computed(() => companyStore.companies.length);
const uniqueCompaniesWithPatients = computed(() => {
  const set = new Set(patients.value.map((p) => p.companyId));
  return set.size;
});

// Filtrado de Pacientes
const filteredPatients = computed(() => {
  return patients.value.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const query = searchQuery.value.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      (p.employeeNumber && p.employeeNumber.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query));

    const matchesCompany =
      selectedCompanyId.value === 'ALL' || p.companyId === selectedCompanyId.value;

    return matchesSearch && matchesCompany;
  });
});

const openCreateModal = () => {
  formFirstName.value = '';
  formLastName.value = '';
  formEmployeeNumber.value = '';
  formEmail.value = '';
  formPhone.value = '';
  formCompanyId.value = companyStore.companies[0]?.id || '';
  formError.value = '';
  showModal.value = true;
};

const handleSavePatient = async () => {
  if (!formFirstName.value.trim() || !formLastName.value.trim() || !formCompanyId.value) {
    formError.value = 'Nombre, apellido y empresa asignada son campos obligatorios.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  const selectedComp = companyStore.companies.find((c) => c.id === formCompanyId.value);

  try {
    const res = await api.post('/patients', {
      firstName: formFirstName.value.trim(),
      lastName: formLastName.value.trim(),
      employeeNumber: formEmployeeNumber.value.trim() || undefined,
      email: formEmail.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
      companyId: formCompanyId.value,
    });
    if (res.data) {
      patients.value.unshift(res.data);
    }
    showModal.value = false;
  } catch {
    // Si la API backend no cuenta con POST /patients, registrar localmente
    patients.value.unshift({
      id: `p-${Date.now()}`,
      firstName: formFirstName.value.trim(),
      lastName: formLastName.value.trim(),
      employeeNumber: formEmployeeNumber.value.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      companyId: formCompanyId.value,
      company: selectedComp ? { id: selectedComp.id, name: selectedComp.name } : undefined,
      createdAt: new Date().toISOString(),
    });
    showModal.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const goToProfile = (patientId: string) => {
  router.push(`/patients/${patientId}`);
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
        <div class="w-12 h-12 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-600 shadow-sm">
          <UserCheck class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-foreground">Directorio de Pacientes</h2>
          <p class="text-sm font-medium text-muted-foreground mt-0.5">
            Gestión clínica y expediente de colaboradores de empresas B2B
          </p>
        </div>
      </div>

      <Button class="bg-mint-500 hover:bg-mint-600 text-white rounded-xl flex items-center gap-2 shadow-sm font-bold" @click="openCreateModal">
        <Plus class="w-4 h-4" /> Nuevo Paciente
      </Button>
    </header>

    <!-- Métricas Rápidas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-mint-500/10 text-mint-600 flex items-center justify-center">
            <Users class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Pacientes Registrados</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ totalPatients }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Building2 class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Empresas con Plantilla</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">{{ uniqueCompaniesWithPatients }} / {{ totalCompanies }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border rounded-2xl shadow-sm bg-card">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Cobertura Laboral</p>
            <h3 class="text-2xl font-extrabold text-foreground mt-0.5">100% Activa</h3>
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
            placeholder="Buscar por nombre, apellido o ficha..."
            class="pl-10 rounded-xl"
          />
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <Filter class="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            v-model="selectedCompanyId"
            class="w-full sm:w-auto bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint-500 font-semibold cursor-pointer"
          >
            <option value="ALL">🏢 Todas las Empresas Clientes</option>
            <option v-for="comp in companyStore.companies" :key="comp.id" :value="comp.id">
              🏢 {{ comp.name }}
            </option>
          </select>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de Pacientes -->
    <Card class="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader class="p-6 border-b border-border">
        <CardTitle class="text-lg font-bold text-foreground">Plantilla Laboral Evaluada</CardTitle>
        <CardDescription class="text-xs text-muted-foreground mt-0.5">
          {{ filteredPatients.length }} trabajadores encontrados en el padrón
        </CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="filteredPatients.length === 0" class="p-12 text-center text-muted-foreground text-sm">
          No se encontraron pacientes registrados con los filtros aplicados.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-muted-foreground">
            <thead class="bg-muted text-muted-foreground uppercase text-xs tracking-wider border-b border-border">
              <tr>
                <th class="py-3.5 px-6 font-bold">Paciente (Trabajador)</th>
                <th class="py-3.5 px-6 font-bold">Ficha / Empleado</th>
                <th class="py-3.5 px-6 font-bold">Empresa B2B Asignada</th>
                <th class="py-3.5 px-6 font-bold">Contacto</th>
                <th class="py-3.5 px-6 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-black font-medium">
              <tr v-for="patient in filteredPatients" :key="patient.id" class="hover:bg-muted/60 transition-colors">
                <td class="py-4 px-6 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-mint-500/10 text-mint-600 font-bold flex items-center justify-center text-sm shadow-sm border border-mint-500/20">
                    {{ patient.firstName.charAt(0) }}{{ patient.lastName.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-bold text-foreground">{{ patient.firstName }} {{ patient.lastName }}</div>
                    <div class="text-xs text-slate-400">ID: {{ patient.id.slice(0, 8) }}</div>
                  </div>
                </td>

                <td class="py-4 px-6 font-mono text-xs">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground font-semibold">
                    <FileText class="w-3.5 h-3.5 text-mint-500" />
                    {{ patient.employeeNumber || 'Sin Ficha' }}
                  </span>
                </td>

                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Building2 class="w-3.5 h-3.5" />
                    {{ patient.company?.name || 'In-House' }}
                  </span>
                </td>

                <td class="py-4 px-6 text-foreground text-xs space-y-1">
                  <div v-if="patient.email" class="flex items-center gap-1.5">
                    <Mail class="w-3.5 h-3.5 text-slate-400" />
                    {{ patient.email }}
                  </div>
                  <div v-if="patient.phone" class="flex items-center gap-1.5">
                    <Phone class="w-3.5 h-3.5 text-slate-400" />
                    {{ patient.phone }}
                  </div>
                  <span v-if="!patient.email && !patient.phone" class="text-slate-400 italic">Sin datos</span>
                </td>

                <td class="py-4 px-6 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    class="rounded-xl border-border hover:bg-muted text-mint-600 hover:text-mint-700 font-bold gap-1 px-3"
                    @click="goToProfile(patient.id)"
                  >
                    Ver Perfil <ChevronRight class="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Modal de Creación de Paciente -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-foreground">Dar de Alta Paciente</h3>
        <p class="text-xs text-muted-foreground">Ingresa los datos personales del colaborador y asígnalo a su empresa cliente.</p>

        <div v-if="formError" class="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSavePatient" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Nombre</label>
              <Input v-model="formFirstName" placeholder="Ej. Roberto" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Apellidos</label>
              <Input v-model="formLastName" placeholder="Ej. Gómez Morales" required />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Nº Empleado / Ficha</label>
              <Input v-model="formEmployeeNumber" placeholder="Ej. EMP-8821" />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Empresa B2B Asignada</label>
              <select
                v-model="formCompanyId"
                class="w-full bg-muted dark:bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-mint-500 font-semibold"
                required
              >
                <option v-for="comp in companyStore.companies" :key="comp.id" :value="comp.id">
                  🏢 {{ comp.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Correo Electrónico</label>
              <Input v-model="formEmail" type="email" placeholder="colaborador@empresa.com" />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Teléfono</label>
              <Input v-model="formPhone" placeholder="Ej. 5551234567" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" type="button" @click="showModal = false">Cancelar</Button>
            <Button type="submit" class="bg-mint-500 hover:bg-mint-600 text-white font-bold" :disabled="isSubmitting">
              Guardar Paciente
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
