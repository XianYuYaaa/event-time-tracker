import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'event-time-tracker-form-state'

// 从localStorage加载初始状态
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载表单状态失败:', error)
  }
  return {
    category_l1_id: null,
    category_l2_id: null,
    category_l3_id: null,
    region_id: null,
    regionType: 'national'
  }
}

// 保存到localStorage
const saveToStorage = (state: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('保存表单状态失败:', error)
  }
}

export const useFormStateStore = defineStore('formState', () => {
  const initial = loadFromStorage()
  
  // 保存添加数据页面的表单状态
  const category_l1_id = ref<number | null>(initial.category_l1_id)
  const category_l2_id = ref<number | null>(initial.category_l2_id)
  const category_l3_id = ref<number | null>(initial.category_l3_id)
  const region_id = ref<number | null>(initial.region_id)
  const regionType = ref<'national' | 'province' | 'city'>(initial.regionType)

  // 保存分类选择
  const saveFormState = (data: {
    category_l1_id?: number | null
    category_l2_id?: number | null
    category_l3_id?: number | null
    region_id?: number | null
    regionType?: 'national' | 'province' | 'city'
  }) => {
    if (data.category_l1_id !== undefined) category_l1_id.value = data.category_l1_id
    if (data.category_l2_id !== undefined) category_l2_id.value = data.category_l2_id
    if (data.category_l3_id !== undefined) category_l3_id.value = data.category_l3_id
    if (data.region_id !== undefined) region_id.value = data.region_id
    if (data.regionType !== undefined) regionType.value = data.regionType
    
    // 保存到localStorage
    saveToStorage({
      category_l1_id: category_l1_id.value,
      category_l2_id: category_l2_id.value,
      category_l3_id: category_l3_id.value,
      region_id: region_id.value,
      regionType: regionType.value
    })
  }

  // 清空表单状态
  const clearFormState = () => {
    category_l1_id.value = null
    category_l2_id.value = null
    category_l3_id.value = null
    region_id.value = null
    regionType.value = 'national'
    
    saveToStorage({
      category_l1_id: null,
      category_l2_id: null,
      category_l3_id: null,
      region_id: null,
      regionType: 'national'
    })
  }

  return {
    category_l1_id,
    category_l2_id,
    category_l3_id,
    region_id,
    regionType,
    saveFormState,
    clearFormState
  }
})
