<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Cloud, CloudOff, HelpCircle, Loader2, Pencil, Send } from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import { api, errorMessage } from '../services/api';
import { ALL_QUESTIONS, QUESTIONNAIRE, UNKNOWN_ANSWER } from '../lib/questionnaire';

type Answers = Record<string, string | string[]>;
type Stage = 'loading' | 'invalid' | 'welcome' | 'questions' | 'review' | 'done';

const route = useRoute();
const token = String(route.params.token || '');

const stage = ref<Stage>('loading');
const respondentName = ref('');
const answers = ref<Answers>({});
const index = ref(0);
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
const submitting = ref(false);
const submitError = ref('');
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

const question = computed(() => ALL_QUESTIONS[index.value]);
const total = ALL_QUESTIONS.length;

const isAnswered = (id: string): boolean => {
  const value = answers.value[id];
  const other = answers.value[`${id}_otro`];
  if (Array.isArray(value)) return value.length > 0 || Boolean(typeof other === 'string' && other.trim());
  return Boolean((typeof value === 'string' && value.trim()) || (typeof other === 'string' && other.trim()));
};

const answeredCount = computed(() => ALL_QUESTIONS.filter((q) => isAnswered(q.id)).length);
const progress = computed(() => Math.round((answeredCount.value / total) * 100));

const sectionProgress = computed(() =>
  QUESTIONNAIRE.map((section) => ({
    id: section.id,
    title: section.title,
    answered: section.questions.filter((q) => isAnswered(q.id)).length,
    total: section.questions.length,
    firstIndex: ALL_QUESTIONS.findIndex((q) => q.sectionId === section.id),
  }))
);

const currentSection = computed(() => QUESTIONNAIRE.find((s) => s.id === question.value?.sectionId));
const isFirstOfSection = computed(() => index.value === 0 || ALL_QUESTIONS[index.value - 1].sectionId !== question.value.sectionId);

// --- Lectura y guardado ---
onMounted(async () => {
  try {
    const { data } = await api.get<{ respondentName: string; answers: Answers; status: string }>(`/public/questionnaire/${token}`);
    respondentName.value = data.respondentName;
    answers.value = data.answers || {};
    if (data.status === 'SUBMITTED') {
      stage.value = 'done';
    } else {
      const firstPending = ALL_QUESTIONS.findIndex((q) => !isAnswered(q.id));
      index.value = firstPending === -1 ? 0 : firstPending;
      stage.value = 'welcome';
    }
  } catch {
    stage.value = 'invalid';
  }
});

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const persist = async (submit = false) => {
  clearTimeout(saveTimer);
  saveState.value = 'saving';
  try {
    await api.put(`/public/questionnaire/${token}`, { answers: answers.value, submit });
    saveState.value = 'saved';
  } catch (err) {
    saveState.value = 'error';
    if (submit) throw err;
  }
};

const scheduleSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(), 800);
};

watch(answers, scheduleSave, { deep: true });

// Si el cliente cierra la pestaña con cambios sin guardar, los enviamos con keepalive
const flushOnLeave = () => {
  if (saveState.value === 'saved' || stage.value === 'loading' || stage.value === 'invalid') return;
  fetch(`${api.defaults.baseURL}/public/questionnaire/${token}`, {
    method: 'PUT',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: answers.value }),
  });
};
window.addEventListener('pagehide', flushOnLeave);
onBeforeUnmount(() => window.removeEventListener('pagehide', flushOnLeave));

// --- Edición de respuestas ---
const textValue = computed({
  get: () => {
    const v = answers.value[question.value.id];
    return typeof v === 'string' ? v : '';
  },
  set: (v: string) => {
    answers.value = { ...answers.value, [question.value.id]: v };
  },
});

const otherValue = computed({
  get: () => {
    const v = answers.value[`${question.value.id}_otro`];
    return typeof v === 'string' ? v : '';
  },
  set: (v: string) => {
    answers.value = { ...answers.value, [`${question.value.id}_otro`]: v };
  },
});

const selected = (option: string): boolean => {
  const v = answers.value[question.value.id];
  return Array.isArray(v) ? v.includes(option) : v === option;
};

const toggleOption = (option: string) => {
  const q = question.value;
  if (q.type === 'multi') {
    const current = Array.isArray(answers.value[q.id]) ? (answers.value[q.id] as string[]) : [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current.filter((o) => o !== UNKNOWN_ANSWER), option];
    answers.value = { ...answers.value, [q.id]: next };
  } else {
    answers.value = { ...answers.value, [q.id]: option };
    // En preguntas de opción única avanzamos solos para agilizar
    setTimeout(() => {
      if (answers.value[q.id] === option && question.value.id === q.id) next();
    }, 280);
  }
};

const markUnknown = () => {
  const q = question.value;
  answers.value = { ...answers.value, [q.id]: q.type === 'multi' ? [UNKNOWN_ANSWER] : UNKNOWN_ANSWER, [`${q.id}_otro`]: '' };
  next();
};

const focusInput = async () => {
  await nextTick();
  inputRef.value?.focus();
};

const next = () => {
  if (index.value < total - 1) {
    index.value++;
    focusInput();
  } else {
    persist();
    stage.value = 'review';
  }
};

const back = () => {
  if (index.value > 0) {
    index.value--;
    focusInput();
  }
};

const goTo = (i: number) => {
  index.value = i;
  stage.value = 'questions';
  focusInput();
};

const start = () => {
  stage.value = 'questions';
  focusInput();
};

const onKeydown = (e: KeyboardEvent) => {
  if (stage.value !== 'questions') return;
  if (e.key === 'Enter' && !e.shiftKey && question.value.type === 'text') {
    e.preventDefault();
    next();
  }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    next();
  }
};

const displayAnswer = (id: string): string => {
  const v = answers.value[id];
  const other = answers.value[`${id}_otro`];
  const parts = [Array.isArray(v) ? v.join(', ') : v || '', typeof other === 'string' && other.trim() ? `Otro: ${other.trim()}` : ''];
  return parts.filter(Boolean).join(' · ');
};

const submit = async () => {
  submitError.value = '';
  submitting.value = true;
  try {
    await persist(true);
    stage.value = 'done';
    window.scrollTo({ top: 0 });
  } catch (err) {
    submitError.value = errorMessage(err, 'No pudimos enviar tus respuestas. Intenta de nuevo.');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-navy-50" @keydown="onKeydown">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <BrandLogo />
        <div v-if="stage === 'questions' || stage === 'review'" class="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <template v-if="saveState === 'saving'"><Loader2 class="h-3.5 w-3.5 animate-spin" /> Guardando…</template>
          <template v-else-if="saveState === 'saved'"><Cloud class="h-3.5 w-3.5 text-mint-600" /> Guardado</template>
          <template v-else-if="saveState === 'error'"><CloudOff class="h-3.5 w-3.5 text-rose-500" /> Sin conexión, reintentando</template>
        </div>
      </div>
      <div v-if="stage === 'questions' || stage === 'review'" class="h-1 bg-slate-100">
        <div class="h-1 bg-mint-500 transition-all duration-500" :style="{ width: `${progress}%` }"></div>
      </div>
    </header>

    <main class="container-page py-10">
      <!-- Cargando / link inválido -->
      <div v-if="stage === 'loading'" class="flex justify-center py-32"><Loader2 class="h-8 w-8 animate-spin text-mint-500" /></div>

      <div v-else-if="stage === 'invalid'" class="card mx-auto max-w-md p-8 text-center">
        <p class="text-lg font-extrabold text-navy-800">Este link no es válido</p>
        <p class="mt-2 text-sm text-slate-500">Revisa que lo hayas copiado completo o pide uno nuevo a tu contacto.</p>
      </div>

      <!-- Bienvenida -->
      <div v-else-if="stage === 'welcome'" class="mx-auto max-w-2xl">
        <div class="overflow-hidden rounded-3xl bg-navy-800 p-8 text-white shadow-xl sm:p-12">
          <p class="text-sm font-bold uppercase tracking-wider text-mint-500">Cuestionario del sitio web</p>
          <h1 class="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Hola, {{ respondentName }}</h1>
          <p class="mt-4 text-lg leading-relaxed text-slate-300">
            Estamos construyendo tu sitio de paquetes médicos. Con estas preguntas vamos a escribir tus servicios, tarifas y textos
            sin tener que interrumpirte con llamadas.
          </p>
          <ul class="mt-8 space-y-3 text-sm text-slate-300">
            <li class="flex items-center gap-3"><Clock class="h-4 w-4 text-mint-500" /> Toma unos 15 minutos · {{ total }} preguntas</li>
            <li class="flex items-center gap-3"><Cloud class="h-4 w-4 text-mint-500" /> Se guarda solo: puedes salir y volver con este mismo link</li>
            <li class="flex items-center gap-3"><HelpCircle class="h-4 w-4 text-mint-500" /> Si no sabes algo, elige "Aún no lo sé" y sigue</li>
          </ul>
          <button class="btn-primary mt-10 !px-8 !py-4 text-base" @click="start">
            {{ answeredCount ? `Continuar (${answeredCount} de ${total})` : 'Empezar' }} <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Preguntas -->
      <div v-else-if="stage === 'questions' && question" class="grid gap-8 lg:grid-cols-[240px_1fr]">
        <!-- Secciones -->
        <aside class="hidden lg:block">
          <nav class="sticky top-24 space-y-1">
            <button
              v-for="s in sectionProgress"
              :key="s.id"
              class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition"
              :class="question.sectionId === s.id ? 'bg-white font-bold text-navy-800 shadow-sm' : 'text-slate-500 hover:bg-white/60'"
              @click="goTo(s.firstIndex)"
            >
              <span>{{ s.title }}</span>
              <span v-if="s.answered === s.total" class="flex h-5 w-5 items-center justify-center rounded-full bg-mint-500 text-white"><Check class="h-3 w-3" /></span>
              <span v-else class="text-xs font-semibold text-slate-400">{{ s.answered }}/{{ s.total }}</span>
            </button>
          </nav>
        </aside>

        <section class="mx-auto w-full max-w-2xl">
          <div v-if="isFirstOfSection && currentSection" class="mb-6 rounded-2xl border border-mint-500/20 bg-mint-50 px-5 py-4">
            <p class="text-xs font-bold uppercase tracking-wider text-mint-700">{{ currentSection.title }}</p>
            <p class="mt-0.5 text-sm text-slate-600">{{ currentSection.intro }}</p>
          </div>

          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pregunta {{ index + 1 }} de {{ total }} · {{ question.sectionTitle }}
          </p>
          <h2 class="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-navy-800 sm:text-3xl">{{ question.title }}</h2>
          <p v-if="question.why" class="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <HelpCircle class="mt-0.5 h-4 w-4 shrink-0 text-mint-600" /> {{ question.why }}
          </p>

          <div class="mt-8">
            <input
              v-if="question.type === 'text'"
              ref="inputRef"
              v-model="textValue"
              class="input !py-4 !text-base"
              :placeholder="question.placeholder || 'Escribe tu respuesta'"
            />
            <textarea
              v-else-if="question.type === 'textarea'"
              ref="inputRef"
              v-model="textValue"
              rows="5"
              class="input !py-4 !text-base leading-relaxed"
              :placeholder="question.placeholder || 'Escribe tu respuesta'"
            ></textarea>

            <div v-else class="space-y-2.5">
              <p v-if="question.type === 'multi'" class="mb-3 text-xs font-semibold text-slate-500">Puedes elegir varias opciones</p>
              <button
                v-for="(option, i) in question.options"
                :key="option"
                class="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3.5 text-left text-sm font-semibold transition"
                :class="selected(option) ? 'border-mint-500 bg-mint-50 text-navy-800' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
                @click="toggleOption(option)"
              >
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center border-2 text-[11px] font-extrabold"
                  :class="[
                    question.type === 'multi' ? 'rounded-md' : 'rounded-full',
                    selected(option) ? 'border-mint-500 bg-mint-500 text-white' : 'border-slate-300 text-slate-400',
                  ]"
                >
                  <Check v-if="selected(option)" class="h-3.5 w-3.5" />
                  <template v-else>{{ String.fromCharCode(65 + i) }}</template>
                </span>
                {{ option }}
              </button>
              <div v-if="question.allowOther" class="pt-2">
                <label class="label" :for="`otro-${question.id}`">Otra respuesta o detalle</label>
                <input :id="`otro-${question.id}`" v-model="otherValue" class="input" placeholder="Escribe aquí si ninguna opción aplica o quieres agregar algo" />
              </div>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-white disabled:opacity-40" :disabled="index === 0" @click="back">
              <ArrowLeft class="h-4 w-4" /> Atrás
            </button>
            <div class="flex flex-wrap items-center gap-2">
              <button class="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-white" @click="markUnknown">{{ UNKNOWN_ANSWER }}</button>
              <button class="btn-primary !px-6" @click="next">
                {{ index === total - 1 ? 'Revisar respuestas' : isAnswered(question.id) ? 'Siguiente' : 'Saltar' }}
                <ArrowRight class="h-4 w-4" />
              </button>
            </div>
          </div>
          <p v-if="question.type !== 'choice'" class="mt-4 text-right text-xs text-slate-400">
            {{ question.type === 'text' ? 'Presiona Enter para continuar' : 'Ctrl + Enter para continuar' }}
          </p>
        </section>
      </div>

      <!-- Revisión -->
      <div v-else-if="stage === 'review'" class="mx-auto max-w-3xl">
        <h1 class="text-3xl font-extrabold tracking-tight text-navy-800">Revisa tus respuestas</h1>
        <p class="mt-2 text-slate-500">
          Respondiste {{ answeredCount }} de {{ total }} preguntas. Puedes corregir cualquiera antes de enviar; las que dejaste vacías las vemos después.
        </p>

        <div class="mt-8 space-y-6">
          <section v-for="section in QUESTIONNAIRE" :key="section.id" class="card overflow-hidden">
            <h2 class="border-b border-slate-100 bg-navy-50/60 px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-navy-800">{{ section.title }}</h2>
            <ul class="divide-y divide-slate-100">
              <li v-for="q in section.questions" :key="q.id" class="flex items-start justify-between gap-4 px-6 py-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-600">{{ q.title }}</p>
                  <p v-if="displayAnswer(q.id)" class="mt-1 whitespace-pre-line text-sm font-semibold text-navy-800">{{ displayAnswer(q.id) }}</p>
                  <p v-else class="mt-1 text-sm italic text-slate-400">Sin respuesta</p>
                </div>
                <button
                  class="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-mint-600 hover:bg-mint-50"
                  @click="goTo(ALL_QUESTIONS.findIndex((x) => x.id === q.id))"
                >
                  <Pencil class="h-3.5 w-3.5" /> Editar
                </button>
              </li>
            </ul>
          </section>
        </div>

        <p v-if="submitError" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{{ submitError }}</p>
        <div class="mt-8 flex flex-wrap justify-end gap-3">
          <button class="btn-secondary" @click="goTo(0)">Volver al inicio</button>
          <button class="btn-primary !px-8" :disabled="submitting" @click="submit">
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" /><Send v-else class="h-4 w-4" /> Enviar respuestas
          </button>
        </div>
      </div>

      <!-- Enviado -->
      <div v-else-if="stage === 'done'" class="card mx-auto max-w-xl p-10 text-center">
        <CheckCircle2 class="mx-auto h-14 w-14 text-mint-500" />
        <h1 class="mt-5 text-2xl font-extrabold text-navy-800">¡Gracias, {{ respondentName }}!</h1>
        <p class="mt-3 text-slate-500">
          Recibimos tus respuestas. Con esto vamos a completar tu sitio y te avisaremos cuando esté listo para revisarlo.
        </p>
        <button class="btn-secondary mt-8" @click="stage = 'review'">
          <Pencil class="h-4 w-4" /> Ver o corregir mis respuestas
        </button>
      </div>
    </main>
  </div>
</template>
