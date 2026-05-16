import { createRouter, createWebHistory } from 'vue-router'
import GuideHomeView from '../views/GuideHomeView.vue' // <-- Promenjeno ime importa
import TouristHomeView from '../views/TouristHomeView.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Login
  },
  {
    path: '/touristView',
    name: 'TouristView',
    component: TouristHomeView
  },
  {
    path: '/guideView',
    name: 'GuideView',
    component: GuideHomeView // Sada je ispravno mapirano
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router