-- 添加提醒天数字段
ALTER TABLE time_points ADD COLUMN remind_days INTEGER DEFAULT 0;
