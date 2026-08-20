import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/companies',
      name: 'companies',
      component: () => import('../views/CompaniesView.vue'),
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: () => import('../views/ContractsView.vue'),
    },
  ],
});

// Guard de Navegacion: Redirigir a /login si intenta acceder a rutas protegidas sin token JWT
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const protectedRoutes = ['companies', 'contracts'];
  
  if (protectedRoutes.includes(to.name as string) && !token) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
