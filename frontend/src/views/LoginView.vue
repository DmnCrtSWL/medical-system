<script setup lang="ts">
import { ref } from 'vue';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const email = ref('');
const password = ref('');
</script>

<template>
  <div class="min-h-screen bg-navy-900 flex items-center justify-center p-4">
    <Card class="max-w-md w-full border border-slate-800 shadow-2xl">
      <CardHeader class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint-100 text-mint-600 mx-auto mb-2">
          🏥
        </div>
        <CardTitle class="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Accede con tus credenciales corporativas</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
            <Input
              v-model="email"
              type="email"
              placeholder="doctor@ejemplo.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <Input
              v-model="password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="default" class="w-full mt-2">
            Entrar al Sistema
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
