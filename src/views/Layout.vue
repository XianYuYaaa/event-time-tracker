<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo-container">
        <el-icon :size="24"><Clock /></el-icon>
        <span v-if="!isCollapse" class="logo-text">时间节点记录系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        router
      >
        <el-menu-item index="/home">
          <el-icon><Plus /></el-icon>
          <template #title>添加数据</template>
        </el-menu-item>

        <el-menu-item index="/timeline">
          <el-icon><TrendCharts /></el-icon>
          <template #title>数据可视化</template>
        </el-menu-item>

        <el-sub-menu index="manage">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>管理</span>
          </template>
          <el-menu-item index="/manage/category">分类管理</el-menu-item>
          <el-menu-item index="/manage/data">数据管理</el-menu-item>
          <el-menu-item index="/manage/region">区域管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
      
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon :size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-main class="layout-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Clock,
  Plus,
  Document,
  Setting,
  Fold,
  Expand,
  TrendCharts
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  background: #304156;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  padding: 0 16px;
  background: #263445;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-menu-vertical {
  flex: 1;
  border: none;
  background: #304156;
}

.el-menu-vertical :deep(.el-menu-item),
.el-menu-vertical :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.8);
  border-left: 3px solid transparent;
}

.el-menu-vertical :deep(.el-menu-item:hover),
.el-menu-vertical :deep(.el-sub-menu__title:hover) {
  background: rgba(0, 0, 0, 0.1);
  color: #ffffff;
}

.el-menu-vertical :deep(.el-menu-item.is-active) {
  background: rgba(64, 158, 255, 0.2);
  border-left-color: #409eff;
  color: #409eff;
}

.collapse-btn {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  background: #263445;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
}

.layout-main {
  padding: 0;
  overflow: hidden;
  background: #f0f2f5;
}
</style>
