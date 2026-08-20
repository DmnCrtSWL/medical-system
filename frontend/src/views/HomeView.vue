<template>
  <div class="min-h-screen bg-navy-50 p-8 flex flex-col items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
      <h1 class="text-3xl font-extrabold text-navy-900 mb-2">Medical System</h1>
      <p class="text-slate-500 mb-6">Sistema de Gestión Médica B2B & Consultas</p>
      
      <div class="flex justify-center gap-4">
        <router-link
          to="/login"
          class="px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl shadow-md transition-all duration-200"
        >
          Ir al Login
        </router-link>
      </div>
    </div>
  </div>
</template>
