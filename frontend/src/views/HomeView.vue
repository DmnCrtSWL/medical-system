<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button.vue';
</script>

<template>
  <div class="min-h-screen bg-navy-50 p-8 flex flex-col items-center justify-center">
    <Card class="max-w-md w-full text-center shadow-xl">
      <CardHeader>
        <CardTitle class="text-3xl font-extrabold text-navy-900">Medical System</CardTitle>
        <CardDescription class="text-base text-slate-500">
          Plataforma de Gestión Médica B2B & Consultas
        </CardDescription>
      </CardHeader>
      
      <CardContent class="pt-4 flex justify-center">
        <router-link to="/login">
          <Button variant="default" size="lg">
            Ir al Login
          </Button>
        </router-link>
      </CardContent>
    </Card>
  </div>
</template>
