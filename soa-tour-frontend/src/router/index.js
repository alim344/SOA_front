import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/GuideHomeView.vue'
import TouristHomeView from '../views/TouristHomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  }
/*{
    path: '/',
    name: 'touristHome',
    component: TouristHomeView
  }*/
 
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router