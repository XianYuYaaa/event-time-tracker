use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{Migration, MigrationKind};

// 数据结构定义（这些结构体保留用于将来的类型安全查询）
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub level: i32,
    pub parent_id: Option<i64>,
    pub sort_order: i32,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Region {
    pub id: i64,
    pub name: String,
    pub region_type: String,
    pub province: Option<String>,
    pub is_active: i32,
    pub sort_order: i32,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct TimePoint {
    pub id: i64,
    pub category_l1_id: i64,
    pub category_l2_id: i64,
    pub category_l3_id: Option<i64>,
    pub region_id: i64,
    pub event_date: String,
    pub end_date: Option<String>,
    pub year: i32,
    pub note: Option<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub is_confirmed: i32,
    pub remind_days: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct CreateTimePoint {
    pub category_l1_id: i64,
    pub category_l2_id: i64,
    pub category_l3_id: Option<i64>,
    pub region_id: i64,
    pub event_date: String,
    pub end_date: Option<String>,
    pub year: i32,
    pub note: Option<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub is_confirmed: i32,
    pub remind_days: Option<i32>,
}

// 获取数据库迁移配置
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed initial data",
            sql: include_str!("../migrations/002_seed.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "update time_points table",
            sql: include_str!("../migrations/003_update_timepoints.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "make category_l3_id optional",
            sql: include_str!("../migrations/004_make_category_l3_optional.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add remind_days field",
            sql: include_str!("../migrations/005_add_remind_days.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
