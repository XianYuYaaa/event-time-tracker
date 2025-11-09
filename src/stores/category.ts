import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Category {
  id: number
  name: string
  level: number
  parent_id: number | null
  sort_order: number
  color: string | null
  created_at: string
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  
  const loadCategories = async () => {
    // TODO: 从数据库加载分类
    console.log('加载分类数据')
  }
  
  return {
    categories,
    loadCategories
  }
})
