import { createRouter, createWebHistory } from 'vue-router'
import GuideHomeView from '../views/GuideHomeView.vue'

import TouristHomeView from '../views/TouristHomeView.vue'
import Login from '../views/Login.vue'
import CreateTour from "../views/Guide/CreateTour.vue";
import DraftTours from "../views/Guide/DraftTours.vue";

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
  },
  {
    path: '/draftTours',
    name: 'DraftTours',
    component: DraftTours
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router