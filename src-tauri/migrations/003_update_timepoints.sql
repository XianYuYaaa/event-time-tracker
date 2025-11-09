-- ============================================================================
-- 更新时间节点表 - 添加结束日期和来源链接
-- ============================================================================

-- 添加结束日期字段（可选）
ALTER TABLE time_points ADD COLUMN end_date TEXT;

-- 添加来源链接字段（可选）
ALTER TABLE time_points ADD COLUMN source_url TEXT;

-- 删除原来的 event_time 字段（SQLite不支持直接删除列，需要重建表）
-- 创建新表
CREATE TABLE time_points_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_l1_id INTEGER NOT NULL,
    category_l2_id INTEGER NOT NULL,
    category_l3_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    event_date TEXT NOT NULL,       -- YYYY-MM-DD 开始日期
    end_date TEXT,                  -- YYYY-MM-DD 结束日期（可选）
    year INTEGER NOT NULL,
    note TEXT,
    source TEXT,                    -- 来源文字
    source_url TEXT,                -- 来源链接（可选）
    is_confirmed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (category_l1_id) REFERENCES categories(id),
    FOREIGN KEY (category_l2_id) REFERENCES categories(id),
    FOREIGN KEY (category_l3_id) REFERENCES categories(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- 复制数据
INSERT INTO time_points_new (
    id, category_l1_id, category_l2_id, category_l3_id, region_id,
    event_date, year, note, source, is_confirmed, created_at, updated_at
)
SELECT 
    id, category_l1_id, category_l2_id, category_l3_id, region_id,
    event_date, year, note, source, is_confirmed, created_at, updated_at
FROM time_points;

-- 删除旧表
DROP TABLE time_points;

-- 重命名新表
ALTER TABLE time_points_new RENAME TO time_points;

-- 重建索引
CREATE INDEX idx_timepoints_region ON time_points(region_id);
CREATE INDEX idx_timepoints_date ON time_points(event_date);
CREATE INDEX idx_timepoints_year ON time_points(year);
CREATE INDEX idx_timepoints_category_l1 ON time_points(category_l1_id);
CREATE INDEX idx_timepoints_category_l2 ON time_points(category_l2_id);
CREATE INDEX idx_timepoints_category_l3 ON time_points(category_l3_id);
