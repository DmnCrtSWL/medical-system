<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Stethoscope, Plus, Trash2, Pencil, ArrowLeft, AlertCircle, Phone, Mail, Building2, Award } from 'lucide-vue-next';
import { useDoctorStore, type Doctor } from '../stores/doctors';
import { useCompanyStore } from '../stores/companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const doctorStore = useDoctorStore();
const companyStore = useCompanyStore();

const showModal = ref(false);
const editingDoctorId = ref<string | null>(null);

const name = ref('');
const email = ref('');
const specialty = ref('');
const licenseId = ref('');
const phone = ref('');
const companyId = ref('');
const formError = ref('');
const isSubmitting = ref(false);

onMounted(() => {
  doctorStore.fetchDoctors();
  companyStore.fetchCompanies();
});

const openCreateModal = () => {
  editingDoctorId.value = null;
  name.value = '';
  email.value = '';
  specialty.value = 'Medicina General';
  licenseId.value = '';
  phone.value = '';
  companyId.value = '';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (doctor: Doctor) => {
  editingDoctorId.value = doctor.id;
  name.value = doctor.user.name;
  email.value = doctor.user.email;
  specialty.value = doctor.specialty || 'Medicina General';
  licenseId.value = doctor.licenseId || '';
  phone.value = doctor.phone || '';
  companyId.value = doctor.companyId || '';
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingDoctorId.value = null;
};

const handleSaveDoctor = async () => {
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim().toLowerCase();
  const trimmedSpecialty = specialty.value.trim();
  const trimmedLicenseId = licenseId.value.trim().replace(/\D/g, '');
  const trimmedPhone = phone.value.trim().replace(/\D/g, '');

  if (!trimmedName) {
    formError.value = 'El nombre completo del doctor es obligatorio.';
    return;
  }

  if (!trimmedEmail) {
    formError.value = 'El correo electrónico es obligatorio.';
    return;
  }

  if (licenseId.value.trim() && (trimmedLicenseId.length < 7 || trimmedLicenseId.length > 8)) {
    formError.value = 'La cédula profesional debe tener entre 7 y 8 dígitos.';
    return;
  }

  if (phone.value.trim() && trimmedPhone.length !== 10) {
    formError.value = 'El teléfono o celular debe contener exactamente 10 dígitos.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  try {
    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      specialty: trimmedSpecialty || 'Medicina General',
      licenseId: trimmedLicenseId || undefined,
      phone: trimmedPhone || undefined,
      companyId: companyId.value || undefined,
    };

    if (editingDoctorId.value) {
      await doctorStore.updateDoctor(editingDoctorId.value, payload);
    } else {
      await doctorStore.createDoctor(payload);
    }
    closeModal();
  } catch (err) {
    if (err instanceof Error) {
      formError.value = err.message;
    } else {
      formError.value = 'Error al procesar la información del doctor.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string, doctorName: string) => {
  if (confirm(`¿Estás seguro de que deseas eliminar al doctor "${doctorName}" de la plantilla?`)) {
    try {
      await doctorStore.deleteDoctor(id);
    } catch (err) {
      alert('Error al eliminar al doctor');
    }
  }
};
</script>

<template>
  <div class="p-6 md:p-10">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Top Bar / Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button variant="ghost" class="text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer" @click="router.push('/')">
            <ArrowLeft class="w-5 h-5 mr-1" />
            Volver
          </Button>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-800">
              <Stethoscope class="w-8 h-8 text-mint-500" />
              Plantilla de Doctores In-House
            </h1>
            <p class="text-sm text-slate-500">Gestión de médicos y asignación a clientes corporativos B2B</p>
          </div>
        </div>

        <Button variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold shadow-md rounded-xl cursor-pointer" @click="openCreateModal">
          <Plus class="w-5 h-5 mr-1.5" />
          Nuevo Doctor
        </Button>
      </div>

      <!-- Main Content Card -->
      <Card class="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader class="border-b border-slate-100 pb-4">
          <CardTitle class="text-xl text-slate-800">Directorio de Médicos</CardTitle>
          <CardDescription class="text-slate-500">Plantilla de doctores registrados y asignaciones a plantas corporativas</CardDescription>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Loading State -->
          <div v-if="doctorStore.isLoading && doctorStore.doctors.length === 0" class="p-12 text-center text-slate-500">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
            <p>Cargando plantilla de doctores...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="doctorStore.doctors.length === 0" class="p-12 text-center text-slate-500 space-y-3">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-mint-500">
              <Stethoscope class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800">No hay doctores registrados aún</h3>
            <p class="text-sm max-w-sm mx-auto">Comienza agregando el primer médico a la plantilla para asignarlo a consultorios corporativos.</p>
            <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
              <Plus class="w-4 h-4 mr-1.5" />
              Agregar Doctor
            </Button>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4">Médico / Contacto</th>
                  <th class="px-6 py-4">Especialidad & Cédula</th>
                  <th class="px-6 py-4">Empresa B2B Asignada</th>
                  <th class="px-6 py-4">Fecha Registro</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="doctor in doctorStore.doctors" :key="doctor.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-mint-100 text-mint-600 flex items-center justify-center font-bold">
                        {{ doctor.user.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-800">{{ doctor.user.name }}</p>
                        <p class="text-xs text-slate-500 flex items-center gap-1">
                          <Mail class="w-3 h-3 text-slate-400" />
                          {{ doctor.user.email }}
                        </p>
                        <p v-if="doctor.phone" class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone class="w-3 h-3 text-slate-400" />
                          {{ doctor.phone }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600 space-y-1">
                    <span class="inline-flex items-center gap-1 bg-mint-50 text-mint-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-mint-200">
                      {{ doctor.specialty }}
                    </span>
                    <div v-if="doctor.licenseId" class="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Award class="w-3.5 h-3.5 text-slate-400" />
                      Céd. {{ doctor.licenseId }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="doctor.company" class="flex items-center gap-1.5 text-xs text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Building2 class="w-4 h-4 text-mint-500 shrink-0" />
                      <span class="font-medium">{{ doctor.company.name }}</span>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5 text-slate-300" />
                      Sin asignar (General)
                    </span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-500">
                    {{ new Date(doctor.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </td>
                  <td class="px-6 py-4 text-right flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      class="text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Editar Doctor"
                      @click="openEditModal(doctor)"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Eliminar Doctor"
                      @click="handleDelete(doctor.id, doctor.user.name)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal Form (Nuevo / Editar Doctor) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope class="w-5 h-5 text-mint-500" />
            {{ editingDoctorId ? 'Editar Doctor In-House' : 'Registrar Doctor In-House' }}
          </h2>
          <button class="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveDoctor">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nombre Completo <span class="text-mint-500">*</span></label>
            <Input v-model="name" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. Dr. Carlos Mendoza" :disabled="isSubmitting" required />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Correo Electrónico Corporativo <span class="text-mint-500">*</span></label>
            <Input v-model="email" type="email" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. carlos.mendoza@medical.com" :disabled="isSubmitting" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Especialidad Médica</label>
              <Input v-model="specialty" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. Cardiología" :disabled="isSubmitting" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Cédula Profesional (7-8 dígitos)</label>
              <Input v-model="licenseId" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. 12345678" maxlength="8" :disabled="isSubmitting" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono de Contacto (10 dígitos)</label>
            <Input v-model="phone" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. 5551234567" maxlength="10" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Asignar a Empresa Cliente B2B</label>
            <select
              v-model="companyId"
              class="w-full h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
              :disabled="isSubmitting"
            >
              <option value="">-- Sin Asignar (General) --</option>
              <option v-for="company in companyStore.companies" :key="company.id" :value="company.id">
                {{ company.name }} {{ company.taxId ? `(${company.taxId})` : '' }}
              </option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" class="text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer" :disabled="isSubmitting" @click="closeModal">
              Cancelar
            </Button>
            <Button type="submit" variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl shadow-md cursor-pointer" :disabled="isSubmitting">
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ editingDoctorId ? 'Guardar Cambios' : 'Guardar Doctor' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
