import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Region {
  id: number
  name: string
  region_type: 'national' | 'province' | 'city'
  province: string | null
  is_active: number
  sort_order: number
  color: string | null
  created_at: string
}

export const useRegionStore = defineStore('region', () => {
  const regions = ref<Region[]>([])
  
  const loadRegions = async () => {
    // TODO: 从数据库加载区域
    console.log('加载区域数据')
  }
  
  return {
    regions,
    loadRegions
  }
})
