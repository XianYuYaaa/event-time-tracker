<template>
  <div class="page-header">
    <div class="header-left">
      <el-icon :size="iconSize"><component :is="icon" /></el-icon>
      <span>{{ title }}</span>
    </div>
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 页面头部组件
 * 统一的页面标题栏样式，避免重复代码
 */
interface Props {
  title: string
  icon: any
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  iconSize: 20
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
