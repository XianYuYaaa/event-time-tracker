import { api, TimePoint } from '@/api'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import dayjs from 'dayjs'

export interface EventReminder {
  timePoint: TimePoint
  daysUntilEvent: number
  categoryPath: string
  regionName: string
}

export class ReminderService {
  private checkTimer: number | null = null
  private lastCheckDate: string = ''

  // 检查是否需要提醒
  async checkReminders(): Promise<EventReminder[]> {
    const today = dayjs().format('YYYY-MM-DD')
    
    // 如果今天已经检查过，跳过
    if (this.lastCheckDate === today) {
      return []
    }
    
    this.lastCheckDate = today

    try {
      // 获取所有时间节点
      const timePoints = await api.timePoints.getList(10000, 0)
      const categories = await api.categories.getAll()
      const regions = await api.regions.getAll()
      
      const today = dayjs()
      const reminders: EventReminder[] = []

      for (const tp of timePoints) {
        // 跳过没有设置提醒天数的事件
        if (!tp.remind_days || tp.remind_days <= 0) {
          continue
        }

        // 解析事件日期
        const eventDate = dayjs(tp.event_date)
        
        // 计算下一个事件日期（考虑年份）
        let nextEventDate = eventDate.year(today.year())
        
        // 如果今年的日期已经过了，则使用明年的日期
        if (nextEventDate.isBefore(today, 'day')) {
          nextEventDate = nextEventDate.year(today.year() + 1)
        }
        
        // 计算距离事件的天数
        const daysUntilEvent = nextEventDate.diff(today, 'day')
        
        // 如果在提醒天数范围内，添加到提醒列表
        if (daysUntilEvent >= 0 && daysUntilEvent <= tp.remind_days) {
          // 检查今天是否已经提醒过
          const lastRemindDate = localStorage.getItem(`reminder_${tp.id}`)
          const todayStr = today.format('YYYY-MM-DD')
          
          if (lastRemindDate === todayStr) {
            // 今天已经提醒过，跳过
            continue
          }

          const cat1 = categories.find(c => c.id === tp.category_l1_id)
          const cat2 = categories.find(c => c.id === tp.category_l2_id)
          const cat3 = tp.category_l3_id ? categories.find(c => c.id === tp.category_l3_id) : null
          const region = regions.find(r => r.id === tp.region_id)

          reminders.push({
            timePoint: tp,
            daysUntilEvent,
            categoryPath: cat3 
              ? `${cat1?.name} > ${cat2?.name} > ${cat3.name}`
              : `${cat1?.name} > ${cat2?.name}`,
            regionName: region?.name || ''
          })
        }
      }

      return reminders
    } catch (error) {
      console.error('检查提醒失败:', error)
      return []
    }
  }

  // 发送系统通知
  async sendSystemNotification(reminder: EventReminder) {
    try {
      let permissionGranted = await isPermissionGranted()
      
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }

      if (permissionGranted) {
        const title = reminder.daysUntilEvent === 0 
          ? '今天是重要日期！'
          : `还有 ${reminder.daysUntilEvent} 天`
        
        const body = `${reminder.categoryPath}\n区域: ${reminder.regionName}\n日期: ${reminder.timePoint.event_date}${reminder.timePoint.note ? '\n备注: ' + reminder.timePoint.note : ''}`

        await sendNotification({
          title: `时间节点记录系统 - ${title}`,
          body
        })

        console.log('系统通知已发送:', title)

        // 记录今天已提醒
        const todayStr = dayjs().format('YYYY-MM-DD')
        localStorage.setItem(`reminder_${reminder.timePoint.id}`, todayStr)
      } else {
        console.warn('系统通知权限未授予')
        throw new Error('系统通知权限未授予，请在系统设置中允许通知')
      }
    } catch (error) {
      console.error('发送系统通知失败:', error)
      throw error
    }
  }

  // 发送Server酱通知
  async sendServerChanNotification(reminder: EventReminder, sendKey: string) {
    if (!sendKey) {
      console.warn('Server酱SendKey未配置')
      return
    }

    try {
      const title = reminder.daysUntilEvent === 0 
        ? '今天是重要日期！'
        : `还有 ${reminder.daysUntilEvent} 天`
      
      const desp = `**分类**: ${reminder.categoryPath}

**区域**: ${reminder.regionName}

**日期**: ${reminder.timePoint.event_date}

${reminder.timePoint.note ? `**备注**: ${reminder.timePoint.note}` : ''}`

      const url = `https://sctapi.ftqq.com/${sendKey}.send`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          title,
          desp
        })
      })

      const result = await response.json()
      
      if (result.code === 0) {
        // 记录今天已提醒
        const todayStr = dayjs().format('YYYY-MM-DD')
        localStorage.setItem(`reminder_${reminder.timePoint.id}`, todayStr)
      } else {
        console.error('Server酱发送失败:', result)
      }
    } catch (error) {
      console.error('发送Server酱通知失败:', error)
    }
  }

  // 执行提醒检查并发送通知
  async performReminderCheck(notificationType: 'system' | 'serverchan' | 'both', serverChanKey?: string) {
    const reminders = await this.checkReminders()
    
    if (reminders.length === 0) {
      return
    }

    for (const reminder of reminders) {
      if (notificationType === 'system' || notificationType === 'both') {
        await this.sendSystemNotification(reminder)
      }
      
      if ((notificationType === 'serverchan' || notificationType === 'both') && serverChanKey) {
        await this.sendServerChanNotification(reminder, serverChanKey)
      }
      
      // 避免发送过快，间隔500ms
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // 启动定时检查（每天0点检查）
  startPeriodicCheck(notificationType: 'system' | 'serverchan' | 'both', serverChanKey?: string) {
    // 清除现有的定时器
    this.stopPeriodicCheck()
    
    // 立即执行一次检查
    this.performReminderCheck(notificationType, serverChanKey)
    
    // 计算到明天0点的毫秒数
    const scheduleNextCheck = () => {
      const now = dayjs()
      const tomorrow = now.add(1, 'day').startOf('day')
      const msUntilMidnight = tomorrow.diff(now)
      
      this.checkTimer = window.setTimeout(() => {
        this.performReminderCheck(notificationType, serverChanKey)
        scheduleNextCheck() // 递归调度下一次检查
      }, msUntilMidnight)
    }
    
    scheduleNextCheck()
  }

  // 停止定时检查
  stopPeriodicCheck() {
    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }
}

// 导出单例
export const reminderService = new ReminderService()
