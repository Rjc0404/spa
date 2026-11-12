import { createRouter, createWebHistory } from 'vue-router'
import BanquetVerify from '@/views/banquet_verify/index.vue'

const routes = [
  {
    path: '/',
    name: 'HomeVerify',
    component: BanquetVerify,
    meta: { title: '宴席主家信息验真' }
  },
  {
    path: '/v',
    name: 'ShortVerify',
    component: BanquetVerify,
    meta: { title: '宴席主家信息验真' }
  },
  {
    path: '/banquet-verify',
    name: 'BanquetVerify',
    component: BanquetVerify,
    meta: { title: '宴席主家信息验真' }
  },
  {
    // 兜底匹配任意子路径（如部署在 /h5/ 或 /banquet/ 下直接访问）
    path: '/:pathMatch(.*)*',
    name: 'FallbackVerify',
    component: BanquetVerify,
    meta: { title: '宴席主家信息验真' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router

