<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Stethoscope,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  Award,
  GraduationCap,
  Upload,
  FileText,
  CheckCircle2,
  FileCheck,
} from 'lucide-vue-next';
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
const university = ref('');
const phone = ref('');
const companyId = ref('');
const formError = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');

// Gestión de archivo testigo de cédula
const licenseFile = ref<File | null>(null);
const licenseFileName = ref('');
const currentLicenseFileUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

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
  university.value = '';
  phone.value = '';
  companyId.value = '';
  licenseFile.value = null;
  licenseFileName.value = '';
  currentLicenseFileUrl.value = null;
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (doctor: Doctor) => {
  editingDoctorId.value = doctor.id;
  name.value = doctor.user.name;
  email.value = doctor.user.email;
  specialty.value = doctor.specialty || 'Medicina General';
  licenseId.value = doctor.licenseId || '';
  university.value = doctor.university || '';
  phone.value = doctor.phone || '';
  companyId.value = doctor.companyId || '';
  licenseFile.value = null;
  licenseFileName.value = '';
  currentLicenseFileUrl.value = doctor.licenseFileUrl || null;
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingDoctorId.value = null;
  licenseFile.value = null;
  licenseFileName.value = '';
  currentLicenseFileUrl.value = null;
};

// Optimización y compresión ligera de imágenes en canvas antes de subir
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo inicializar canvas'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Fallo en compresión de imagen'));
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    licenseFile.value = null;
    licenseFileName.value = '';
    return;
  }

  const file = input.files[0];
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    formError.value = 'Formato no válido. Únicamente se admiten documentos PDF o imágenes (JPEG, PNG, WEBP).';
    input.value = '';
    return;
  }

  // Si es imagen mayor a 400KB, comprimirla en el navegador para ahorrar ancho de banda y almacenamiento
  if (file.type.startsWith('image/') && file.size > 400 * 1024) {
    try {
      const compressedBlob = await compressImage(file);
      licenseFile.value = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      licenseFileName.value = `${file.name} (optimizado)`;
    } catch {
      licenseFile.value = file;
      licenseFileName.value = file.name;
    }
  } else {
    licenseFile.value = file;
    licenseFileName.value = file.name;
  }
  formError.value = '';
};

const handleSaveDoctor = async () => {
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim().toLowerCase();
  const trimmedSpecialty = specialty.value.trim();
  const trimmedLicenseId = licenseId.value.trim().replace(/\D/g, '');
  const trimmedUniversity = university.value.trim();
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
    const formData = new FormData();
    formData.append('name', trimmedName);
    formData.append('email', trimmedEmail);
    formData.append('specialty', trimmedSpecialty || 'Medicina General');
    if (trimmedLicenseId) formData.append('licenseId', trimmedLicenseId);
    if (trimmedUniversity) formData.append('university', trimmedUniversity);
    if (trimmedPhone) formData.append('phone', trimmedPhone);
    if (companyId.value) formData.append('companyId', companyId.value);
    if (licenseFile.value) {
      formData.append('licenseFile', licenseFile.value);
    }

    if (editingDoctorId.value) {
      await doctorStore.updateDoctor(editingDoctorId.value, formData);
      successMessage.value = 'Información del médico actualizada exitosamente.';
    } else {
      await doctorStore.createDoctor(formData);
      successMessage.value = 'Médico dado de alta exitosamente. Se ha despachado el correo de activación.';
    }
    closeModal();
    setTimeout(() => {
      successMessage.value = '';
    }, 6000);
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
      successMessage.value = `Médico "${doctorName}" eliminado exitosamente.`;
      setTimeout(() => {
        successMessage.value = '';
      }, 4000);
    } catch {
      alert('Error al eliminar al doctor');
    }
  }
};

const getFileUrl = (url: string | null | undefined) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Top Bar / Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            class="text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            @click="router.push('/')"
          >
            <ArrowLeft class="w-5 h-5 mr-1" />
            Volver
          </Button>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-2 text-foreground">
              <Stethoscope class="w-8 h-8 text-mint-500" />
              Plantilla de Doctores In-House
            </h1>
            <p class="text-sm text-muted-foreground">Gestión de médicos, testigos de cédula y asignación a clientes corporativos B2B</p>
          </div>
        </div>

        <Button
          variant="default"
          class="bg-mint-500 hover:bg-mint-600 text-white font-semibold shadow-md rounded-xl cursor-pointer"
          @click="openCreateModal"
        >
          <Plus class="w-5 h-5 mr-1.5" />
          Nuevo Doctor
        </Button>
      </div>

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
        <CardHeader class="border-b border-border pb-4">
          <CardTitle class="text-xl text-foreground">Directorio de Médicos</CardTitle>
          <CardDescription class="text-muted-foreground">Plantilla de doctores registrados, cédulas profesionales y asignaciones corporativas</CardDescription>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Loading State -->
          <div v-if="doctorStore.isLoading && doctorStore.doctors.length === 0" class="p-12 text-center text-muted-foreground">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mb-3"></div>
            <p>Cargando plantilla de doctores...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="doctorStore.doctors.length === 0" class="p-12 text-center text-muted-foreground space-y-3">
            <div class="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-mint-500">
              <Stethoscope class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-semibold text-foreground">No hay doctores registrados aún</h3>
            <p class="text-sm max-w-sm mx-auto">Comienza agregando el primer médico a la plantilla para asignarlo a consultorios corporativos.</p>
            <Button variant="default" class="mt-2 bg-mint-500 hover:bg-mint-600 text-white rounded-xl cursor-pointer" @click="openCreateModal">
              <Plus class="w-4 h-4 mr-1.5" />
              Agregar Doctor
            </Button>
          </div>

          <!-- Table -->
          <div v-else class="w-full">
            <table class="w-full text-left text-sm text-muted-foreground">
              <thead class="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th class="px-4 py-3.5 font-bold">Médico / Contacto</th>
                  <th class="px-4 py-3.5 font-bold">Especialidad & Universidad</th>
                  <th class="px-4 py-3.5 font-bold">Cédula & Testigo</th>
                  <th class="px-4 py-3.5 font-bold">Empresa B2B</th>
                  <th class="px-4 py-3.5 font-bold">Fecha Registro</th>
                  <th class="px-4 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-black font-medium">
                <tr v-for="doctor in doctorStore.doctors" :key="doctor.id" class="hover:bg-muted/60 transition-colors">
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-mint-100 dark:bg-mint-950 text-mint-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {{ doctor.user.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-bold text-foreground truncate">{{ doctor.user.name }}</p>
                        <p class="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail class="w-3 h-3 text-slate-400 shrink-0" />
                          {{ doctor.user.email }}
                        </p>
                        <p v-if="doctor.phone" class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                          {{ doctor.phone }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 space-y-1">
                    <span class="inline-flex items-center gap-1 bg-mint-500/10 text-mint-600 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-mint-500/20">
                      {{ doctor.specialty }}
                    </span>
                    <div v-if="doctor.university" class="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <GraduationCap class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{{ doctor.university }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 space-y-1">
                    <div v-if="doctor.licenseId" class="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
                      <Award class="w-3.5 h-3.5 text-slate-400" />
                      {{ doctor.licenseId }}
                    </div>
                    <div v-if="doctor.licenseFileUrl">
                      <a
                        :href="getFileUrl(doctor.licenseFileUrl)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-mint-500/10 hover:bg-mint-500/20 text-mint-700 dark:text-mint-300 border border-mint-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Ver o descargar comprobante"
                      >
                        <FileCheck class="w-3 h-3 text-mint-600" />
                        Ver Testigo
                      </a>
                    </div>
                    <span v-else-if="!doctor.licenseId" class="text-xs text-muted-foreground italic">Sin cédula</span>
                    <span v-else class="text-[11px] text-slate-400 italic block">Sin testigo</span>
                  </td>
                  <td class="px-4 py-3.5">
                    <div v-if="doctor.company" class="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/80 px-2.5 py-1 rounded-xl border border-border">
                      <Building2 class="w-3.5 h-3.5 text-mint-500 shrink-0" />
                      <span class="font-medium">{{ doctor.company.name }}</span>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5 text-slate-300" />
                      Sin asignar
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {{ new Date(doctor.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </td>
                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        class="text-mint-600 hover:text-mint-700 hover:bg-mint-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                        title="Editar Doctor"
                        @click="openEditModal(doctor)"
                      >
                        <Pencil class="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        class="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl p-2 h-8 w-8 inline-flex items-center justify-center cursor-pointer transition-colors"
                        title="Eliminar Doctor"
                        @click="handleDelete(doctor.id, doctor.user.name)"
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

    <!-- Modal Form (Nuevo / Editar Doctor) -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope class="w-5 h-5 text-mint-500" />
            {{ editingDoctorId ? 'Editar Información Médica' : 'Registrar Nuevo Médico' }}
          </h2>
          <button class="text-slate-400 hover:text-foreground text-lg font-bold cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveDoctor">
          <div v-if="formError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Nombre Completo <span class="text-mint-500">*</span>
            </label>
            <Input v-model="name" placeholder="Ej. Dr. Carlos Mendoza" :disabled="isSubmitting" required />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Correo Electrónico <span class="text-mint-500">*</span>
            </label>
            <Input v-model="email" type="email" placeholder="carlos.mendoza@medical.com" :disabled="isSubmitting" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Cédula Profesional</label>
              <Input v-model="licenseId" placeholder="Ej. 12345678" maxlength="8" :disabled="isSubmitting" />
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Especialidad Médica</label>
              <Input v-model="specialty" placeholder="Ej. Medicina General" :disabled="isSubmitting" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Universidad de Egreso</label>
            <Input v-model="university" placeholder="Ej. UNAM Facultad de Medicina" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Teléfono de Contacto (10 dígitos)</label>
            <Input v-model="phone" placeholder="Ej. 5551234567" maxlength="10" :disabled="isSubmitting" />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">Asignar a Empresa Cliente B2B</label>
            <select
              v-model="companyId"
              class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-mint-500 cursor-pointer"
              :disabled="isSubmitting"
            >
              <option value="">-- Sin Asignar (General) --</option>
              <option v-for="company in companyStore.companies" :key="company.id" :value="company.id">
                {{ company.name }} {{ company.taxId ? `(${company.taxId})` : '' }}
              </option>
            </select>
          </div>

          <!-- Subida de Testigo de Cédula Profesional (Foto o PDF) -->
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Testigo de Cédula (Foto o PDF)
            </label>
            <div
              class="border-2 border-dashed border-border hover:border-mint-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-muted/40"
              @click="fileInputRef?.click()"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleFileChange"
              />
              <div class="flex flex-col items-center justify-center gap-1.5">
                <div class="w-10 h-10 rounded-xl bg-mint-500/10 text-mint-600 flex items-center justify-center">
                  <Upload class="w-5 h-5" />
                </div>
                <div v-if="licenseFileName" class="text-xs font-bold text-mint-600 flex items-center gap-1">
                  <FileCheck class="w-4 h-4" /> {{ licenseFileName }}
                </div>
                <div v-else class="text-xs text-muted-foreground">
                  <span class="font-semibold text-foreground">Haz clic para adjuntar comprobante</span> o arrastra el archivo aquí
                  <p class="text-[11px] text-slate-400 mt-0.5">Formatos admitidos: PDF, JPG, PNG o WEBP (máx. 10MB)</p>
                </div>
              </div>
            </div>

            <div v-if="currentLicenseFileUrl && !licenseFileName" class="mt-2 flex items-center justify-between text-xs p-2.5 rounded-xl bg-muted border border-border">
              <span class="text-muted-foreground flex items-center gap-1.5 font-medium">
                <FileText class="w-4 h-4 text-mint-500" /> Testigo cargado previamente
              </span>
              <a
                :href="getFileUrl(currentLicenseFileUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-mint-600 hover:underline font-semibold"
              >
                Ver Documento
              </a>
            </div>
          </div>

          <!-- Leyenda Informativa de Activación por Correo -->
          <div class="p-3.5 bg-mint-500/10 border border-mint-500/20 rounded-xl text-xs text-mint-700 dark:text-mint-300 space-y-1">
            <p class="font-bold flex items-center gap-1.5">
              <Mail class="w-4 h-4 text-mint-600 dark:text-mint-400" /> Invitación Segura por Correo
            </p>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
              El sistema generará un token con validez de 24 horas y le enviará un correo de bienvenida para que el médico configure su propia contraseña confidencial.
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
              <span v-else>{{ editingDoctorId ? 'Guardar Cambios' : 'Guardar Médico' }}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
