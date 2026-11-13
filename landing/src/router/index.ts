import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '../services/api';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/LandingView.vue') },
    { path: '/contratar', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/portal/login', name: 'portal-login', component: () => import('../views/PortalLoginView.vue') },
    { path: '/portal', name: 'portal', component: () => import('../views/PortalView.vue'), meta: { requiresAuth: true } },
    { path: '/cuestionario/:token', name: 'questionnaire', component: () => import('../views/QuestionnaireView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) return { name: 'portal-login' };
  return true;
});

export default router;
