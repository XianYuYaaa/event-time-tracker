import { computed } from 'vue'
import dayjs from 'dayjs'
import { open as tauriOpen } from '@tauri-apps/plugin-shell'

/**
 * 事件卡片公共逻辑
 */

// 事件项类型
export interface EventItem {
  id: number
  event_date: string
  end_date?: string | null
  region_id: number
  region_name: string
  category_l1_id: number
  category_l2_id: number
  category_l3_id?: number | null
  category_path: string
  year: number
  month: number | null
  note: string | null
  source: string | null
  source_url: string | null
  is_confirmed: number
  remind_days: number | null
  category_l1?: any
  category_l2?: any
  category_l3?: any
}

/**
 * 获取事件提醒信息
 */
export const getEventReminderInfo = (item: EventItem) => {
  if (!item.remind_days) {
    return { show: false, daysLeft: 0 }
  }

  const eventDate = dayjs(item.event_date)
  const today = dayjs()
  const daysUntil = eventDate.diff(today, 'day')
  
  // 如果在提醒天数范围内且事件未过期
  if (daysUntil >= 0 && daysUntil <= item.remind_days) {
    return { show: true, daysLeft: daysUntil }
  }
  
  return { show: false, daysLeft: daysUntil }
}

/**
 * 打开URL
 */
export const openUrl = async (url: string | null) => {
  if (!url) return
  
  try {
    await tauriOpen(url)
  } catch (error) {
    console.error('打开URL失败:', error)
  }
}

/**
 * 格式化事件日期
 */
export const formatEventDate = (dateStr: string) => {
  const date = dayjs(dateStr)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    return '今天 ' + date.format('MM月DD日')
  } else if (date.isSame(now.add(1, 'day'), 'day')) {
    return '明天 ' + date.format('MM月DD日')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 ' + date.format('MM月DD日')
  } else {
    return date.format('MM月DD日')
  }
}

/**
 * 格式化完整日期（用于DateGroupCard）
 */
export const formatFullDate = (dateStr: string) => {
  const date = dayjs(dateStr)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    return '今天 · ' + date.format('YYYY年MM月DD日')
  } else if (date.isSame(now.add(1, 'day'), 'day')) {
    return '明天 · ' + date.format('YYYY年MM月DD日')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 · ' + date.format('YYYY年MM月DD日')
  } else {
    return date.format('YYYY年MM月DD日')
  }
}

/**
 * 使用事件卡片的公共状态
 */
export const useEventCardStats = (items: EventItem[]) => {
  // 是否有提醒
  const hasReminder = computed(() => {
    return items.some(item => getEventReminderInfo(item).show)
  })

  // 已确认数量
  const confirmedCount = computed(() => {
    return items.filter(item => item.is_confirmed === 1).length
  })

  return {
    hasReminder,
    confirmedCount
  }
}
