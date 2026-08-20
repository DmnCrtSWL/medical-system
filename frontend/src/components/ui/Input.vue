<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../../lib/utils';

interface Props {
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const inputClasses = computed(() =>
  cn(
    'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-mint-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
    props.class
  )
);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <input
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :class="inputClasses"
    @input="onInput"
  />
</template>
