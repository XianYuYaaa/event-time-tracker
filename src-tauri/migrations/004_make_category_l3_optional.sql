-- ============================================================================
-- 修改时间节点表 - 三级分类改为可选
-- ============================================================================

-- SQLite不支持直接修改列约束，需要重建表
CREATE TABLE time_points_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_l1_id INTEGER NOT NULL,
    category_l2_id INTEGER NOT NULL,
    category_l3_id INTEGER,              -- 改为可选
    region_id INTEGER NOT NULL,
    event_date TEXT NOT NULL,
    end_date TEXT,
    year INTEGER NOT NULL,
    note TEXT,
    source TEXT,
    source_url TEXT,
    is_confirmed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (category_l1_id) REFERENCES categories(id),
    FOREIGN KEY (category_l2_id) REFERENCES categories(id),
    FOREIGN KEY (category_l3_id) REFERENCES categories(id),
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- 复制数据
INSERT INTO time_points_new
SELECT * FROM time_points;

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
