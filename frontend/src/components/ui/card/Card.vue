<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../../../lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();

const classes = computed(() =>
  cn('rounded-2xl border border-slate-100 bg-white text-navy-900 shadow-xl transition-all duration-200', props.class)
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
