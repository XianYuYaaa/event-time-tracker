/**
 * 公共工具函数
 * 集中管理常用的工具函数，避免代码重复
 */

import dayjs from 'dayjs'
import { open as tauriOpen } from '@tauri-apps/plugin-shell'
import { ElMessage } from 'element-plus'
import type { TimePoint, Category, Region, TimePointWithRelations } from '@/types'

/**
 * 打开外部URL
 * @param url URL地址
 */
export async function openUrl(url: string): Promise<void> {
  if (!url) {
    console.warn('URL为空')
    return
  }
  
  try {
    console.log('尝试打开URL:', url)
    await tauriOpen(url)
    console.log('URL打开成功')
  } catch (error) {
    console.error('打开URL失败:', error)
    ElMessage.error('打开链接失败')
  }
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认'YYYY-MM-DD'
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

/**
 * 构建分类路径
 * @param cat1 一级分类
 * @param cat2 二级分类
 * @param cat3 三级分类（可选）
 */
export function buildCategoryPath(
  cat1?: Category | null,
  cat2?: Category | null,
  cat3?: Category | null
): string {
  if (cat3) {
    return `${cat1?.name} > ${cat2?.name} > ${cat3.name}`
  }
  return `${cat1?.name} > ${cat2?.name}`
}

/**
 * 处理时间节点数据，添加关联信息
 * @param timePoints 时间节点列表
 * @param categories 分类列表
 * @param regions 区域列表
 */
export function processTimePoints(
  timePoints: TimePoint[],
  categories: Category[],
  regions: Region[]
): TimePointWithRelations[] {
  // 创建映射以提高查找性能
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const regionMap = new Map(regions.map(r => [r.id, r]))

  return timePoints.map(tp => {
    const cat1 = categoryMap.get(tp.category_l1_id)
    const cat2 = categoryMap.get(tp.category_l2_id)
    const cat3 = tp.category_l3_id ? categoryMap.get(tp.category_l3_id) : null
    const region = regionMap.get(tp.region_id)

    return {
      ...tp,
      category_path: buildCategoryPath(cat1, cat2, cat3),
      region_name: region?.name || '',
      category_l1: cat1,
      category_l2: cat2,
      category_l3: cat3
    }
  })
}

/**
 * 计算提醒信息
 * @param item 时间节点
 * @returns 提醒信息对象
 */
export function calculateReminderInfo(item: TimePoint): { show: boolean; daysLeft: number } {
  if (!item.remind_days) {
    return { show: false, daysLeft: 0 }
  }

  const eventDate = dayjs(item.event_date)
  const today = dayjs()
  const daysUntil = eventDate.diff(today, 'day')
  
  const show = daysUntil >= 0 && daysUntil <= item.remind_days
  
  return {
    show,
    daysLeft: daysUntil
  }
}

/**
 * 按日期分组时间节点
 * @param data 时间节点列表
 */
export function groupByDate(data: TimePointWithRelations[]): Array<{
  date: string
  dateLabel: string
  items: TimePointWithRelations[]
}> {
  const grouped = new Map<string, TimePointWithRelations[]>()
  
  data.forEach(item => {
    const date = item.event_date
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(item)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      dateLabel: formatDate(date, 'YYYY年MM月DD日'),
      items
    }))
}

/**
 * 按一级分类分组时间节点
 * @param data 时间节点列表
 */
export function groupByCategory(data: TimePointWithRelations[]): Array<{
  categoryId: number
  categoryName: string
  items: TimePointWithRelations[]
}> {
  const grouped = new Map<number, TimePointWithRelations[]>()
  
  data.forEach(item => {
    const catId = item.category_l1_id
    if (!grouped.has(catId)) {
      grouped.set(catId, [])
    }
    grouped.get(catId)!.push(item)
  })

  return Array.from(grouped.entries()).map(([categoryId, items]) => ({
    categoryId,
    categoryName: items[0]?.category_l1?.name || '未知分类',
    items
  }))
}

/**
 * 生成可用年份列表
 * @param data 时间节点列表
 */
export function getAvailableYears(data: TimePointWithRelations[]): number[] {
  const years = new Set<number>()
  data.forEach(item => {
    const year = dayjs(item.event_date).year()
    years.add(year)
  })
  return Array.from(years).sort((a, b) => b - a)
}

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}
