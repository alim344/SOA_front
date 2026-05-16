import { createRouter, createWebHistory } from 'vue-router'
import GuideHomeView from '../views/GuideHomeView.vue'

import TouristHomeView from '../views/TouristHomeView.vue'
import Login from '../views/Login.vue'
import CreateTour from "../views/Guide/CreateTour.vue";

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
    component: GuideHomeView
  },
  {
    path: '/create-tour',
    name: 'CreateTour',
    component: CreateTour
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router