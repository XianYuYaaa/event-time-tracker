<template>
  <!-- 这是一个逻辑组件，不渲染任何内容 -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { h } from 'vue'
import type { EventReminder } from '@/services/reminderService'

// 定义props
interface Props {
  enabled: boolean
  checkInterval?: number // 检查间隔（毫秒），默认每小时一次
}

const props = withDefaults(defineProps<Props>(), {
  checkInterval: 3600000 // 默认1小时
})

// 定义emit
const emit = defineEmits<{
  reminderTriggered: [reminders: EventReminder[]]
}>()

let checkTimer: number | null = null

// 显示提醒通知
const showReminderNotification = (reminder: EventReminder) => {
  const title = reminder.daysUntilEvent === 0 
    ? '📅 今天是重要日期！'
    : `📅 还有 ${reminder.daysUntilEvent} 天`
  
  const message = `
    <div style="line-height: 1.6;">
      <div style="font-weight: 600; color: #303133; margin-bottom: 8px;">
        ${reminder.categoryPath}
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #606266;">
        <div><strong>区域：</strong>${reminder.regionName}</div>
        <div><strong>日期：</strong>${reminder.timePoint.event_date}</div>
        ${reminder.timePoint.note ? `<div><strong>备注：</strong>${reminder.timePoint.note}</div>` : ''}
      </div>
    </div>
  `
  
  ElNotification({
    title,
    message,
    dangerouslyUseHTMLString: true,
    type: 'warning',
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: true,
    icon: h(Bell),
    customClass: 'reminder-notification'
  })
}

// 检查提醒
const checkReminders = async () => {
  if (!props.enabled) return
  
  try {
    // 动态导入reminderService以避免循环依赖
    const { reminderService } = await import('@/services/reminderService')
    const reminders = await reminderService.checkReminders()
    
    if (reminders.length > 0) {
      emit('reminderTriggered', reminders)
      
      // 显示每个提醒
      for (const reminder of reminders) {
        showReminderNotification(reminder)
        
        // 记录已提醒，避免重复提醒
        const todayStr = new Date().toISOString().split('T')[0]
        localStorage.setItem(`reminder_${reminder.timePoint.id}`, todayStr)
        
        // 避免同时弹出太多通知，间隔500ms
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  } catch (error) {
    console.error('检查提醒失败:', error)
  }
}

// 启动定时检查
const startCheck = () => {
  if (!props.enabled) return
  
  // 立即执行一次检查
  checkReminders()
  
  // 设置定时检查
  checkTimer = window.setInterval(() => {
    checkReminders()
  }, props.checkInterval)
  
  console.log(`提醒检查已启动，每${props.checkInterval / 1000 / 60}分钟检查一次`)
}

// 停止定时检查
const stopCheck = () => {
  if (checkTimer !== null) {
    clearInterval(checkTimer)
    checkTimer = null
    console.log('提醒检查已停止')
  }
}

onMounted(() => {
  if (props.enabled) {
    startCheck()
  }
})

onUnmounted(() => {
  stopCheck()
})

// 暴露方法供外部调用
defineExpose({
  checkReminders,
  startCheck,
  stopCheck
})
</script>

<style>
/* 自定义通知样式 */
.reminder-notification {
  min-width: 400px;
  border-left: 4px solid #e6a23c;
}

.reminder-notification .el-notification__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.reminder-notification .el-notification__content {
  margin-top: 8px;
}

.reminder-notification .el-notification__icon {
  font-size: 24px;
  color: #e6a23c;
}
</style>
