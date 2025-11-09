import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '添加信息' }
      },
      {
        path: '/timeline',
        name: 'Timeline',
        component: () => import('@/views/Timeline.vue'),
        meta: { title: '数据可视化' }
      },
      {
        path: '/manage/category',
        name: 'CategoryManage',
        component: () => import('@/views/CategoryManage.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: '/manage/data',
        name: 'DataManage',
        component: () => import('@/views/DataManage.vue'),
        meta: { title: '数据管理' }
      },
      {
        path: '/manage/region',
        name: 'RegionManage',
        component: () => import('@/views/RegionManage.vue'),
        meta: { title: '区域管理' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
