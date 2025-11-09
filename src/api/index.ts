import Database from '@tauri-apps/plugin-sql'

// 类型定义
export interface Category {
  id: number
  name: string
  level: number
  parent_id: number | null
  sort_order: number
  created_at: string
}

export interface Region {
  id: number
  name: string
  region_type: 'national' | 'province' | 'city'
  province: string | null
  is_active: number
  sort_order: number
  created_at: string
}

export interface TimePoint {
  id: number
  category_l1_id: number
  category_l2_id: number
  category_l3_id: number | null
  region_id: number
  event_date: string
  end_date: string | null
  year: number
  note: string | null
  source: string | null
  source_url: string | null
  is_confirmed: number
  remind_days: number | null
  created_at: string
  updated_at: string
}

export interface CreateTimePointData {
  category_l1_id: number
  category_l2_id: number
  category_l3_id: number | null  // 三级分类可选
  region_id: number
  event_date: string
  end_date?: string | null
  year: number
  note?: string | null
  source?: string | null
  source_url?: string | null
  is_confirmed: number
  remind_days?: number | null
}

// 获取数据库连接
let dbInstance: Database | null = null
async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:event_time.db')
  }
  return dbInstance
}

// API 函数
export const api = {
  // 分类相关
  categories: {
    getAll: async () => {
      const db = await getDb()
      return db.select<Category[]>('SELECT * FROM categories ORDER BY level, sort_order, id')
    },
    getByLevel: async (level: number) => {
      const db = await getDb()
      return db.select<Category[]>(
        'SELECT * FROM categories WHERE level = $1 ORDER BY sort_order, id',
        [level]
      )
    },
    getByParent: async (parentId: number) => {
      const db = await getDb()
      return db.select<Category[]>(
        'SELECT * FROM categories WHERE parent_id = $1 ORDER BY sort_order, id',
        [parentId]
      )
    },
    findByNameAndParent: async (name: string, parentId: number, level: number) => {
      const db = await getDb()
      const result = await db.select<Category[]>(
        'SELECT * FROM categories WHERE name = $1 AND parent_id = $2 AND level = $3',
        [name, parentId, level]
      )
      return result.length > 0 ? result[0] : null
    },
    create: async (data: { name: string; level: number; parent_id: number | null; sort_order: number }) => {
      const db = await getDb()
      const result = await db.execute(
        `INSERT INTO categories (name, level, parent_id, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [data.name, data.level, data.parent_id, data.sort_order]
      )
      return result.lastInsertId
    },
    findOrCreate: async (name: string, level: number, parentId: number | null) => {
      const db = await getDb()
      
      // 先查找是否已存在
      if (parentId !== null) {
        const existing = await db.select<Category[]>(
          'SELECT * FROM categories WHERE name = $1 AND parent_id = $2 AND level = $3',
          [name, parentId, level]
        )
        if (existing.length > 0) {
          return existing[0].id
        }
      }
      
      // 不存在则创建
      const siblings = await db.select<Category[]>(
        'SELECT sort_order FROM categories WHERE level = $1 AND parent_id ' + (parentId === null ? 'IS NULL' : '= $2') + ' ORDER BY sort_order DESC LIMIT 1',
        parentId === null ? [level] : [level, parentId]
      )
      const maxSortOrder = siblings.length > 0 ? siblings[0].sort_order : -1
      
      const result = await db.execute(
        `INSERT INTO categories (name, level, parent_id, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [name, level, parentId, maxSortOrder + 1]
      )
      return result.lastInsertId
    },
    update: async (id: number, data: { name?: string; sort_order?: number }) => {
      const db = await getDb()
      const fields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.sort_order !== undefined) {
        fields.push(`sort_order = $${paramIndex++}`)
        values.push(data.sort_order)
      }

      if (fields.length === 0) return

      values.push(id)
      await db.execute(
        `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      )
    },
    delete: async (id: number) => {
      const db = await getDb()
      await db.execute('DELETE FROM categories WHERE id = $1', [id])
    },
  },

  // 区域相关
  regions: {
    getAll: async () => {
      const db = await getDb()
      return db.select<Region[]>(
        'SELECT * FROM regions ORDER BY sort_order, id'
      )
    },
    getByType: async (regionType: 'national' | 'province' | 'city') => {
      const db = await getDb()
      return db.select<Region[]>(
        'SELECT * FROM regions WHERE region_type = $1 AND is_active = 1 ORDER BY sort_order, id',
        [regionType]
      )
    },
    create: async (data: { name: string; region_type: string; province: string | null; sort_order: number; is_active: number }) => {
      const db = await getDb()
      const result = await db.execute(
        `INSERT INTO regions (name, region_type, province, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [data.name, data.region_type, data.province, data.sort_order, data.is_active]
      )
      return result.lastInsertId
    },
    update: async (id: number, data: { name?: string; region_type?: string; province?: string | null; sort_order?: number; is_active?: number }) => {
      const db = await getDb()
      const fields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.region_type !== undefined) {
        fields.push(`region_type = $${paramIndex++}`)
        values.push(data.region_type)
      }
      if (data.province !== undefined) {
        fields.push(`province = $${paramIndex++}`)
        values.push(data.province)
      }
      if (data.sort_order !== undefined) {
        fields.push(`sort_order = $${paramIndex++}`)
        values.push(data.sort_order)
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`)
        values.push(data.is_active)
      }

      if (fields.length === 0) return

      values.push(id)
      await db.execute(
        `UPDATE regions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      )
    },
    delete: async (id: number) => {
      const db = await getDb()
      await db.execute('DELETE FROM regions WHERE id = $1', [id])
    },
  },

  // 时间节点相关
  timePoints: {
    create: async (data: CreateTimePointData) => {
      const db = await getDb()
      const result = await db.execute(
        `INSERT INTO time_points 
         (category_l1_id, category_l2_id, category_l3_id, region_id, 
          event_date, end_date, year, note, source, source_url, is_confirmed, remind_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          data.category_l1_id,
          data.category_l2_id,
          data.category_l3_id,
          data.region_id,
          data.event_date,
          data.end_date || null,
          data.year,
          data.note || null,
          data.source || null,
          data.source_url || null,
          data.is_confirmed,
          data.remind_days || null,
        ]
      )
      return result.lastInsertId
    },
    batchCreate: async (dataList: CreateTimePointData[]) => {
      const db = await getDb()
      const ids: number[] = []
      
      for (const data of dataList) {
        const result = await db.execute(
          `INSERT INTO time_points 
           (category_l1_id, category_l2_id, category_l3_id, region_id, 
            event_date, end_date, year, note, source, source_url, is_confirmed, remind_days)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            data.category_l1_id,
            data.category_l2_id,
            data.category_l3_id,
            data.region_id,
            data.event_date,
            data.end_date || null,
            data.year,
            data.note || null,
            data.source || null,
            data.source_url || null,
            data.is_confirmed,
            data.remind_days || null,
          ]
        )
        ids.push(result.lastInsertId as number)
      }
      
      return ids
    },
    getList: async (limit = 100, offset = 0) => {
      const db = await getDb()
      return db.select<TimePoint[]>(
        `SELECT * FROM time_points 
         ORDER BY event_date DESC, created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
    },
    delete: async (id: number) => {
      const db = await getDb()
      await db.execute('DELETE FROM time_points WHERE id = $1', [id])
    },
    update: async (id: number, data: Partial<CreateTimePointData>) => {
      const db = await getDb()
      const fields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (data.category_l1_id !== undefined) {
        fields.push(`category_l1_id = $${paramIndex++}`)
        values.push(data.category_l1_id)
      }
      if (data.category_l2_id !== undefined) {
        fields.push(`category_l2_id = $${paramIndex++}`)
        values.push(data.category_l2_id)
      }
      if (data.category_l3_id !== undefined) {
        fields.push(`category_l3_id = $${paramIndex++}`)
        values.push(data.category_l3_id)
      }
      if (data.region_id !== undefined) {
        fields.push(`region_id = $${paramIndex++}`)
        values.push(data.region_id)
      }
      if (data.event_date !== undefined) {
        fields.push(`event_date = $${paramIndex++}`)
        values.push(data.event_date)
      }
      if (data.end_date !== undefined) {
        fields.push(`end_date = $${paramIndex++}`)
        values.push(data.end_date)
      }
      if (data.source_url !== undefined) {
        fields.push(`source_url = $${paramIndex++}`)
        values.push(data.source_url)
      }
      if (data.year !== undefined) {
        fields.push(`year = $${paramIndex++}`)
        values.push(data.year)
      }
      if (data.note !== undefined) {
        fields.push(`note = $${paramIndex++}`)
        values.push(data.note)
      }
      if (data.source !== undefined) {
        fields.push(`source = $${paramIndex++}`)
        values.push(data.source)
      }
      if (data.is_confirmed !== undefined) {
        fields.push(`is_confirmed = $${paramIndex++}`)
        values.push(data.is_confirmed)
      }
      if (data.remind_days !== undefined) {
        fields.push(`remind_days = $${paramIndex++}`)
        values.push(data.remind_days)
      }

      fields.push(`updated_at = datetime('now', 'localtime')`)
      values.push(id)

      await db.execute(
        `UPDATE time_points SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      )
    },
  },

}
