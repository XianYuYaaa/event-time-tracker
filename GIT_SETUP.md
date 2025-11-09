# Git 环境配置指南

## 1. 安装 Git

### Windows 系统

**方法一：使用 winget（推荐）**
```powershell
winget install --id Git.Git -e --source winget
```

**方法二：手动下载安装**
1. 访问 [Git官网](https://git-scm.com/download/win)
2. 下载 Git for Windows
3. 运行安装程序，推荐使用默认设置

**验证安装**
```powershell
git --version
```

## 2. 配置 Git 用户信息

安装完成后，打开新的终端窗口，执行以下命令：

```bash
# 配置用户名
git config --global user.name "你的名字"

# 配置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --global --list
```

## 3. 初始化 Git 仓库

在项目根目录执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: 时间节点追踪器项目"
```

## 4. 连接远程仓库（可选）

### GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/event-time-tracker.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

### Gitee（码云）

```bash
# 添加远程仓库
git remote add origin https://gitee.com/你的用户名/event-time-tracker.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

## 5. 常用 Git 命令

```bash
# 查看状态
git status

# 添加文件到暂存区
git add .

# 提交更改
git commit -m "提交说明"

# 推送到远程仓库
git push

# 拉取远程更新
git pull

# 查看提交历史
git log --oneline

# 创建分支
git branch 分支名

# 切换分支
git checkout 分支名

# 合并分支
git merge 分支名
```

## 6. 推荐的 .gitignore 配置

项目已包含 `.gitignore` 文件，包含以下内容：

- `node_modules/` - 依赖包
- `dist/` - 构建产物
- `src-tauri/target/` - Rust编译产物
- `*.db` - 数据库文件
- `*.log` - 日志文件

## 7. 提交规范建议

采用约定式提交（Conventional Commits）规范：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具链相关

**示例**：
```bash
git commit -m "feat: 添加批量导入功能"
git commit -m "fix: 修复时间选择器显示问题"
git commit -m "docs: 更新README文档"
```

## 8. 故障排查

### 问题：git 命令找不到

**解决方案**：
1. 重启终端/IDE
2. 检查环境变量是否包含 Git 安装路径
3. 重新安装 Git

### 问题：中文乱码

**解决方案**：
```bash
git config --global core.quotepath false
git config --global gui.encoding utf-8
git config --global i18n.commit.encoding utf-8
git config --global i18n.logoutputencoding utf-8
```

### 问题：换行符警告

**解决方案**：
```bash
# Windows 系统
git config --global core.autocrlf true

# Linux/Mac 系统
git config --global core.autocrlf input
```

## 完成后

配置完成后，您就可以：
1. 将代码推送到 GitHub/Gitee
2. 与团队协作开发
3. 管理代码版本
4. 回退到历史版本
