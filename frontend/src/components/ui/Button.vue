<script setup lang="ts">
import { computed } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-mint-500 text-white hover:bg-mint-600 shadow-md hover:shadow-mint-500/20',
        secondary: 'bg-navy-900 text-white hover:bg-navy-800 shadow-md',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
        ghost: 'hover:bg-slate-100 hover:text-navy-900 text-slate-700',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600 shadow-md',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-13 px-8 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants>;

interface Props {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  class?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  type: 'button',
  disabled: false,
});

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)
);
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :class="classes">
    <slot />
  </button>
</template>
