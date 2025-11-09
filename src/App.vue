<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useReminderStore } from '@/stores/reminder'
import { reminderService } from '@/services/reminderService'

const reminderStore = useReminderStore()

onMounted(() => {
  console.log('时间节点记录系统启动成功！')
  
  // 初始化提醒服务
  if (reminderStore.settings.enabled) {
    reminderService.startPeriodicCheck(
      reminderStore.settings.notificationType,
      reminderStore.settings.serverChanKey
    )
    console.log('提醒服务已启动，将在每天0点自动检查')
  }
})

onUnmounted(() => {
  // 停止提醒服务
  reminderService.stopPeriodicCheck()
  console.log('提醒服务已停止')
})
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
