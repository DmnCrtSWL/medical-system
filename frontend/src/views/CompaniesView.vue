<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, Plus, Trash2, Pencil, ArrowLeft, AlertCircle, Phone, MapPin, FileText } from 'lucide-vue-next';
import { useCompanyStore, type Company } from '../stores/companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const companyStore = useCompanyStore();

const showModal = ref(false);
const editingCompanyId = ref<string | null>(null);
const name = ref('');
const taxId = ref('');
const address = ref('');
const phone = ref('');
const formError = ref('');
const isSubmitting = ref(false);

onMounted(() => {
  companyStore.fetchCompanies();
});

const openCreateModal = () => {
  editingCompanyId.value = null;
  name.value = '';
  taxId.value = '';
  address.value = '';
  phone.value = '';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (company: Company) => {
  editingCompanyId.value = company.id;
  name.value = company.name;
  taxId.value = company.taxId || '';
  address.value = company.address || '';
  phone.value = company.phone || '';
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingCompanyId.value = null;
};

const handleSaveCompany = async () => {
  const trimmedName = name.value.trim();
  const trimmedTaxId = taxId.value.trim().toUpperCase();
  const trimmedPhone = phone.value.trim().replace(/\D/g, '');

  if (!trimmedName) {
    formError.value = 'El nombre o razón social de la empresa es obligatorio.';
    return;
  }

  if (trimmedTaxId && (trimmedTaxId.length < 12 || trimmedTaxId.length > 13)) {
    formError.value = 'El RFC (Tax ID) debe tener entre 12 y 13 caracteres.';
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
      taxId: trimmedTaxId || undefined,
      address: address.value.trim() || undefined,
      phone: trimmedPhone || undefined,
    };

    if (editingCompanyId.value) {
      await companyStore.updateCompany(editingCompanyId.value, payload);
    } else {
      await companyStore.createCompany(payload);
    }
    closeModal();
  } catch (err) {
    if (err instanceof Error) {
      formError.value = err.message;
    } else {
      formError.value = 'Error al procesar la empresa.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string, companyName: string) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la empresa "${companyName}"?`)) {
    try {
      await companyStore.deleteCompany(id);
    } catch (err) {
      alert('Error al eliminar la empresa');
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
              <Building2 class="w-8 h-8 text-mint-500" />
              Clientes Corporativos B2B
            </h1>
            <p class="text-sm text-slate-500">Gestión de empresas, razones sociales y convenios</p>
          </div>
        </div>

        <Button variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold shadow-md rounded-xl cursor-pointer" @click="openCreateModal">
          <Plus class="w-5 h-5 mr-1.5" />
          Nueva Empresa
        </Button>
      </div>

      <!-- Main Content Card -->
      <Card class="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader class="border-b border-slate-100 pb-4">
          <CardTitle class="text-xl text-slate-800">Directorio de Empresas</CardTitle>
          <CardDescription class="text-slate-500">Listado de clientes corporativos registrados en el sistema</CardDescription>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Loading State -->
          <div v-if="companyStore.isLoading && companyStore.companies.length === 0" class="p-12 text-center text-slate-500">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
            <p>Cargando empresas corporativas...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="companyStore.companies.length === 0" class="p-12 text-center text-slate-500 space-y-3">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-mint-500">
              <Building2 class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800">No hay empresas registradas aún</h3>
            <p class="text-sm max-w-sm mx-auto">Comienza agregando la primera empresa cliente para asociar convenios y personal médico.</p>
            <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
              <Plus class="w-4 h-4 mr-1.5" />
              Agregar Empresa
            </Button>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4">Empresa / Razón Social</th>
                  <th class="px-6 py-4">RFC (Tax ID)</th>
                  <th class="px-6 py-4">Contacto & Dirección</th>
                  <th class="px-6 py-4">Fecha Alta</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="company in companyStore.companies" :key="company.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 font-semibold text-slate-800 flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-mint-100 text-mint-600 flex items-center justify-center font-bold">
                      {{ company.name.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ company.name }}</span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-mono">
                    <span v-if="company.taxId" class="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <FileText class="w-3.5 h-3.5 text-mint-500" />
                      {{ company.taxId }}
                    </span>
                    <span v-else class="text-slate-400 italic">No especificado</span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 space-y-1">
                    <div v-if="company.phone" class="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone class="w-3.5 h-3.5 text-slate-400" />
                      {{ company.phone }}
                    </div>
                    <div v-if="company.address" class="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin class="w-3.5 h-3.5 text-slate-400" />
                      {{ company.address }}
                    </div>
                    <span v-if="!company.phone && !company.address" class="text-slate-400 italic">Sin datos</span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-500">
                    {{ new Date(company.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </td>
                  <td class="px-6 py-4 text-right flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      class="text-mint-600 hover:text-mint-700 hover:bg-mint-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Editar Empresa"
                      @click="openEditModal(company)"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2 cursor-pointer transition-colors"
                      title="Eliminar Empresa"
                      @click="handleDelete(company.id, company.name)"
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

    <!-- Modal Form (Nueva / Editar Empresa) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 class="w-5 h-5 text-mint-500" />
            {{ editingCompanyId ? 'Editar Empresa B2B' : 'Registrar Empresa B2B' }}
          </h2>
          <button class="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveCompany">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nombre / Razón Social <span class="text-mint-500">*</span></label>
            <Input v-model="name" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. Corporativo Médico S.A. de C.V." :disabled="isSubmitting" required />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">RFC / Cédula Fiscal (12-13 caracteres)</label>
            <Input v-model="taxId" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. CME120304XYZ" maxlength="13" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono de Contacto (10 dígitos)</label>
            <Input v-model="phone" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. 5551234567" maxlength="10" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Dirección Fiscal / Corporativa</label>
            <Input v-model="address" class="bg-white border-slate-300 text-slate-800" placeholder="Ej. Av. Reforma 100, Col. Juárez, CDMX" :disabled="isSubmitting" />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" class="text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer" :disabled="isSubmitting" @click="closeModal">
              Cancelar
            </Button>
            <Button type="submit" variant="default" class="bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl shadow-md cursor-pointer" :disabled="isSubmitting">
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ editingCompanyId ? 'Guardar Cambios' : 'Guardar Empresa' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
