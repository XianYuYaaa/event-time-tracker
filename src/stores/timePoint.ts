import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TimePoint {
  id: number
  category_l1_id: number
  category_l2_id: number
  category_l3_id: number
  region_id: number
  event_date: string
  event_time: string | null
  year: number
  note: string | null
  source: string | null
  is_confirmed: number
  created_at: string
}

export const useTimePointStore = defineStore('timePoint', () => {
  const timePoints = ref<TimePoint[]>([])
  
  const loadTimePoints = async () => {
    // TODO: 从数据库加载时间节点
    console.log('加载时间节点数据')
  }
  
  const addTimePoint = async (data: Partial<TimePoint>) => {
    // TODO: 添加时间节点
    console.log('添加时间节点', data)
  }
  
  return {
    timePoints,
    loadTimePoints,
    addTimePoint
  }
})
