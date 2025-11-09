/**
 * 公共类型定义
 * 集中管理所有TypeScript类型定义，避免重复和不一致
 */

// 时间节点数据类型（与API保持一致）
export interface TimePoint {
  id: number
  event_date: string
  end_date: string | null
  category_l1_id: number
  category_l2_id: number
  category_l3_id: number | null
  region_id: number
  year: number
  note: string | null
  source: string | null
  source_url: string | null
  is_confirmed: number
  remind_days: number | null
  created_at: string
  updated_at: string
}

// 扩展的时间节点类型（包含关联数据）
export interface TimePointWithRelations extends TimePoint {
  category_path: string
  region_name: string
  category_l1?: any
  category_l2?: any
  category_l3?: any
}

// 分类数据类型（与API保持一致）
export interface Category {
  id: number
  name: string
  level: number
  parent_id: number | null
  sort_order: number
  created_at: string
}

// 区域数据类型（与API保持一致）
export interface Region {
  id: number
  name: string
  region_type: 'national' | 'province' | 'city'
  province: string | null
  is_active: number
  sort_order: number
  created_at: string
}

// 提醒设置类型
export interface ReminderSettings {
  enabled: boolean
  serverChanKey: string
}

// 事件提醒信息类型
export interface EventReminder {
  timePoint: TimePoint
  categoryPath: string
  regionName: string
  daysUntilEvent: number
}

// 分页参数类型
export interface Pagination {
  page: number
  size: number
}

// 筛选条件类型
export interface FilterOptions {
  category_l1_id?: number | null
  category_l2_id?: number | null
  category_l3_id?: number | null
  region_id?: number | null
  year?: number | null
  month?: number | null
  keyword?: string
}
