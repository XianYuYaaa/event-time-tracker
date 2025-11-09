# 时间节点追踪器

一个基于 Tauri + Vue 3 + Element Plus 的桌面应用程序，用于管理和追踪重要的时间节点。

## 功能特性

- **时间节点管理**：添加、编辑、删除时间节点
- **单条/批量添加**：支持单条添加和批量导入
- **分类管理**：三级分类体系，灵活组织数据
- **区域管理**：支持全国、省份、城市三级区域
- **数据查询**：多维度筛选和搜索
- **数据可视化**：聚合视图和日历视图
- **临期提醒**：系统通知和Server酱微信推送
- **数据备份**：支持数据导出和备份

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI 组件**：Element Plus
- **桌面框架**：Tauri 2.0
- **数据库**：SQLite
- **构建工具**：Vite
- **状态管理**：Pinia

## 开发环境

### 前置要求

- Node.js >= 16
- Rust >= 1.70
- pnpm（推荐）或 npm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建应用

```bash
pnpm tauri build
```

## 项目结构

```
event-time-tracker/
├── src/                    # 前端源代码
│   ├── api/               # API 接口
│   ├── components/        # 公共组件
│   ├── stores/            # 状态管理
│   ├── types/             # 类型定义
│   └── views/             # 页面视图
│       ├── Home.vue           # 添加时间节点
│       ├── QueryPage.vue      # 数据查询
│       ├── Timeline.vue       # 数据可视化
│       ├── DataManage.vue     # 数据管理
│       ├── CategoryManage.vue # 分类管理
│       ├── RegionManage.vue   # 区域管理
│       └── Settings.vue       # 系统设置
├── src-tauri/             # Tauri 后端代码
│   ├── src/               # Rust 源代码
│   └── tauri.conf.json    # Tauri 配置
└── public/                # 静态资源

```

## 数据库结构

### time_points（时间节点表）
- 基本信息：事件日期、结束日期、备注
- 分类信息：三级分类
- 区域信息：区域ID
- 提醒设置：提前天数、确认状态

### categories（分类表）
- 三级分类体系
- 支持自定义添加

### regions（区域表）
- 全国/省份/城市三级
- 支持自定义区域

## 开源协议

MIT License
