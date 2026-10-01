<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Building2,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  AlertCircle,
  Phone,
  MapPin,
  Mail,
  UserCheck,
  Briefcase,
  CheckCircle2,
} from 'lucide-vue-next';
import { useCompanyStore, type Company } from '../stores/companies';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const router = useRouter();
const companyStore = useCompanyStore();

const showModal = ref(false);
const editingCompanyId = ref<string | null>(null);

// Campos del formulario con tipado reactivo (6 campos Issue #102)
const legalName = ref('');
const representativeName = ref('');
const representativeTitle = ref('');
const email = ref('');
const phone = ref('');
const address = ref('');

const formError = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');

onMounted(() => {
  companyStore.fetchCompanies();
});

const openCreateModal = () => {
  editingCompanyId.value = null;
  legalName.value = '';
  representativeName.value = '';
  representativeTitle.value = '';
  email.value = '';
  phone.value = '';
  address.value = '';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (company: Company) => {
  editingCompanyId.value = company.id;
  legalName.value = company.legalName || company.name || '';
  representativeName.value = company.representativeName || '';
  representativeTitle.value = company.representativeTitle || '';
  email.value = company.email || '';
  phone.value = company.phone || '';
  address.value = company.address || '';
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingCompanyId.value = null;
};

const handleSaveCompany = async () => {
  const trimmedLegalName = legalName.value.trim();
  const trimmedRepName = representativeName.value.trim();
  const trimmedRepTitle = representativeTitle.value.trim();
  const trimmedEmail = email.value.trim().toLowerCase();
  const trimmedPhone = phone.value.trim().replace(/\D/g, '');
  const trimmedAddress = address.value.trim();

  if (!trimmedLegalName) {
    formError.value = 'El nombre legal de la empresa es obligatorio.';
    return;
  }

  if (phone.value.trim() && trimmedPhone.length !== 10) {
    formError.value = 'El teléfono de contacto debe contener exactamente 10 dígitos.';
    return;
  }

  isSubmitting.value = true;
  formError.value = '';

  try {
    const payload = {
      name: trimmedLegalName,
      legalName: trimmedLegalName,
      representativeName: trimmedRepName || undefined,
      representativeTitle: trimmedRepTitle || undefined,
      email: trimmedEmail || undefined,
      address: trimmedAddress || undefined,
      phone: trimmedPhone || undefined,
    };

    if (editingCompanyId.value) {
      await companyStore.updateCompany(editingCompanyId.value, payload);
      successMessage.value = 'Información de la empresa actualizada exitosamente.';
    } else {
      await companyStore.createCompany(payload);
      successMessage.value = 'Empresa registrada exitosamente. Se ha despachado el enlace de activación por correo.';
    }
    closeModal();
    setTimeout(() => {
      successMessage.value = '';
    }, 6000);
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
      successMessage.value = `Empresa "${companyName}" eliminada exitosamente.`;
      setTimeout(() => {
        successMessage.value = '';
      }, 4000);
    } catch {
      alert('Error al eliminar la empresa');
    }
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header de Sección -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" class="rounded-xl p-2 text-slate-400 hover:text-foreground cursor-pointer" @click="router.push('/')">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <div class="w-12 h-12 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-600 shadow-sm">
          <Building2 class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-foreground">Clientes Corporativos B2B</h2>
          <p class="text-sm font-medium text-muted-foreground mt-0.5">
            Gestión de empresas, representantes legales y convenios de personal médico
          </p>
        </div>
      </div>

      <Button class="bg-mint-500 hover:bg-mint-600 text-white rounded-xl flex items-center gap-2 shadow-sm font-bold cursor-pointer" @click="openCreateModal">
        <Plus class="w-4 h-4" /> Nueva Empresa
      </Button>
    </header>

    <!-- Banner de Notificación de Éxito -->
    <div
      v-if="successMessage"
      class="p-4 bg-mint-500/10 border border-mint-500/30 text-mint-700 dark:text-mint-300 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-5 h-5 text-mint-600 dark:text-mint-400" />
        <span>{{ successMessage }}</span>
      </div>
      <button class="text-xs hover:underline cursor-pointer" @click="successMessage = ''">Descartar</button>
    </div>

    <!-- Main Content Card -->
    <Card class="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="companyStore.isLoading && companyStore.companies.length === 0" class="p-12 text-center text-muted-foreground">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
          <p>Cargando empresas corporativas...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="companyStore.companies.length === 0" class="p-12 text-center text-muted-foreground space-y-3">
          <div class="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-mint-500">
            <Building2 class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-semibold text-foreground">No hay empresas registradas aún</h3>
          <p class="text-sm max-w-sm mx-auto">Comienza agregando la primera empresa cliente para asociar convenios y personal médico.</p>
          <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
            <Plus class="w-4 h-4 mr-1.5" />
            Agregar Empresa
          </Button>
        </div>

        <!-- Table -->
        <div v-else class="w-full overflow-x-auto">
          <table class="w-full text-left text-sm text-muted-foreground min-w-[900px]">
            <thead class="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap">Empresa / Nombre Legal</th>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap">Representante & Puesto</th>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap">Contacto Corporativo</th>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap">Domicilio Fiscal</th>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap">Fecha Alta</th>
                <th class="px-4 py-3.5 font-bold whitespace-nowrap text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-black font-medium">
              <tr v-for="company in companyStore.companies" :key="company.id" class="hover:bg-muted/60 transition-colors">
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-mint-100 dark:bg-mint-950 text-mint-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {{ (company.legalName || company.name).charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-foreground truncate">{{ company.legalName || company.name }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3.5 space-y-0.5">
                  <div v-if="company.representativeName" class="font-semibold text-foreground text-xs flex items-center gap-1 truncate">
                    <UserCheck class="w-3.5 h-3.5 text-mint-500 shrink-0" />
                    <span>{{ company.representativeName }}</span>
                  </div>
                  <div v-if="company.representativeTitle" class="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Briefcase class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{{ company.representativeTitle }}</span>
                  </div>
                  <span v-if="!company.representativeName && !company.representativeTitle" class="text-xs text-slate-400 italic">No asignado</span>
                </td>
                <td class="px-4 py-3.5 space-y-0.5">
                  <div v-if="company.email" class="text-xs text-foreground flex items-center gap-1.5 truncate">
                    <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{{ company.email }}</span>
                  </div>
                  <div v-if="company.phone" class="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{{ company.phone }}</span>
                  </div>
                  <span v-if="!company.email && !company.phone" class="text-xs text-slate-400 italic">Sin contacto</span>
                </td>
                <td class="px-4 py-3.5 max-w-[280px]">
                  <div v-if="company.address" class="text-xs text-muted-foreground flex items-start gap-1.5" :title="company.address">
                    <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span class="break-words line-clamp-2 leading-relaxed">{{ company.address }}</span>
                  </div>
                  <span v-else class="text-xs text-slate-400 italic">Sin domicilio registrado</span>
                </td>
                <td class="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                  {{ new Date(company.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </td>
                <td class="px-4 py-3.5 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      class="text-mint-600 hover:text-mint-700 hover:bg-mint-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Editar Empresa"
                      @click="openEditModal(company)"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      class="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Eliminar Empresa"
                      @click="handleDelete(company.id, company.name)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Modal Form (Nueva / Editar Empresa - 6 campos Issue #102) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 class="w-5 h-5 text-mint-500" />
            {{ editingCompanyId ? 'Editar Cliente Corporativo B2B' : 'Registrar Cliente Corporativo B2B' }}
          </h2>
          <button class="text-slate-400 hover:text-foreground text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveCompany">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <!-- 1. Nombre Legal -->
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Nombre Legal <span class="text-mint-500">*</span>
            </label>
            <Input
              v-model="legalName"
              placeholder="Ej. TechCorp de México S.A. de C.V."
              :disabled="isSubmitting"
              required
            />
          </div>

          <!-- 2 y 3. Representante y Puesto -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Representante Legal
              </label>
              <Input
                v-model="representativeName"
                placeholder="Ej. Lic. Alejandro Garza Morales"
                :disabled="isSubmitting"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Puesto del Representante
              </label>
              <Input
                v-model="representativeTitle"
                placeholder="Ej. Director de Recursos Humanos"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- 4 y 5. Correo Corporativo y Telefono de Contacto -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Correo Electrónico Corporativo
              </label>
              <Input
                v-model="email"
                type="email"
                placeholder="Ej. contacto@techcorp.com"
                :disabled="isSubmitting"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Telefono de Contacto
              </label>
              <Input
                v-model="phone"
                placeholder="Ej. 8181234567"
                maxlength="10"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- 6. Domicilio Fiscal -->
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Domicilio Fiscal
            </label>
            <Input
              v-model="address"
              placeholder="Ej. Av. de las Industrias 400, Parque Industrial, Monterrey, N.L."
              :disabled="isSubmitting"
            />
          </div>

          <!-- Leyenda Informativa de Activación por Correo -->
          <div class="p-3.5 bg-mint-500/10 border border-mint-500/20 rounded-xl text-xs text-mint-700 dark:text-mint-300 space-y-1">
            <p class="font-bold flex items-center gap-1.5">
              <Mail class="w-4 h-4 text-mint-600 dark:text-mint-400" /> Invitación Segura por Correo
            </p>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
              Al ingresar un correo electrónico, el sistema generará un token con validez de 24 horas y le enviará un correo a la empresa para que configure su propia contraseña confidencial.
            </p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              class="rounded-xl cursor-pointer"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              class="bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ editingCompanyId ? 'Guardar Cambios' : 'Guardar Empresa' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
