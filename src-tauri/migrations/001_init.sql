-- ============================================================================
-- 时间节点记录系统 - 数据库表结构
-- ============================================================================

-- 1. 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,        -- 1/2/3
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    color TEXT,                    -- 颜色值 (十六进制，如 #FF5733)
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 2. 区域表 (支持全国/省份/城市)
CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    region_type TEXT NOT NULL CHECK(region_type IN ('national', 'province', 'city')),
    province TEXT,                 -- 所属省份（仅城市需要）
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    color TEXT,                    -- 区域颜色 (十六进制)
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(name, region_type)
);

-- 3. 时间节点表
CREATE TABLE IF NOT EXISTS time_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_l1_id INTEGER NOT NULL,
    category_l2_id INTEGER NOT NULL,
    category_l3_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    event_date TEXT NOT NULL,       -- YYYY-MM-DD
    event_time TEXT,                -- HH:mm (可选)
    year INTEGER NOT NULL,
    note TEXT,
    source TEXT,
    is_confirmed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (category_l1_id) REFERENCES categories(id),
    FOREIGN KEY (category_l2_id) REFERENCES categories(id),
    FOREIGN KEY (category_l3_id) REFERENCES categories(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(region_type);
CREATE INDEX IF NOT EXISTS idx_timepoints_region ON time_points(region_id);
CREATE INDEX IF NOT EXISTS idx_timepoints_date ON time_points(event_date);
CREATE INDEX IF NOT EXISTS idx_timepoints_year ON time_points(year);
CREATE INDEX IF NOT EXISTS idx_timepoints_category_l1 ON time_points(category_l1_id);
CREATE INDEX IF NOT EXISTS idx_timepoints_category_l2 ON time_points(category_l2_id);
CREATE INDEX IF NOT EXISTS idx_timepoints_category_l3 ON time_points(category_l3_id);
