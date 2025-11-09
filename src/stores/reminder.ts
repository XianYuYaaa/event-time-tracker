import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ReminderSettings {
  enabled: boolean
  notificationType: 'system' | 'serverchan' | 'both'
  serverChanKey: string
}

export const useReminderStore = defineStore('reminder', () => {
  const settings = ref<ReminderSettings>({
    enabled: true,
    notificationType: 'system',
    serverChanKey: ''
  })

  // 从localStorage加载配置
  const loadSettings = () => {
    const saved = localStorage.getItem('reminderSettings')
    if (saved) {
      try {
        settings.value = JSON.parse(saved)
      } catch (error) {
        console.error('加载提醒配置失败:', error)
      }
    }
  }

  // 保存配置到localStorage
  const saveSettings = (newSettings: Partial<ReminderSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('reminderSettings', JSON.stringify(settings.value))
  }

  // 初始化时加载配置
  loadSettings()

  return {
    settings,
    loadSettings,
    saveSettings
  }
})
