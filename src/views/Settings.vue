<template>
  <div class="settings-page">
    <!-- 提醒设置 -->
    <el-card class="setting-card" shadow="never">
      <template #header>
        <div class="card-header-icon-title">
          <el-icon><Bell /></el-icon>
          <span>临期提醒设置</span>
        </div>
      </template>
      <el-form label-width="130px">
        <el-form-item label="启用提醒">
          <el-switch
            v-model="reminderSettings.enabled"
            @change="handleReminderSettingChange"
          />
          <span class="ml-12 text-info">
            系统将在每天0点自动检查并发送提醒
          </span>
        </el-form-item>

        <el-form-item label="提醒方式">
          <el-radio-group
            v-model="reminderSettings.notificationType"
            @change="handleReminderSettingChange"
            :disabled="!reminderSettings.enabled"
          >
            <el-radio label="system">系统通知</el-radio>
            <el-radio label="serverchan">Server酱（微信）</el-radio>
            <el-radio label="both">两者都用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          label="Server酱 SendKey"
          v-if="reminderSettings.notificationType === 'serverchan' || reminderSettings.notificationType === 'both'"
        >
          <el-input
            v-model="reminderSettings.serverChanKey"
            placeholder="请输入Server酱的SendKey"
            @blur="handleReminderSettingChange"
            :disabled="!reminderSettings.enabled"
            class="max-w-450"
          >
            <template #append>
              <el-button @click="openServerChanHelp">
                <el-icon><QuestionFilled /></el-icon>
              </el-button>
            </template>
          </el-input>
          <div class="mt-8 text-small text-info">
            访问 <a href="https://sct.ftqq.com/" target="_blank" class="link-primary">sct.ftqq.com</a> 获取SendKey
          </div>
        </el-form-item>

        <el-divider />

        <el-form-item label=" ">
          <el-space>
            <el-button type="primary" @click="testReminder" :disabled="!reminderSettings.enabled">
              测试提醒
            </el-button>
            <el-button @click="checkRemindersNow" :disabled="!reminderSettings.enabled">
              立即检查
            </el-button>
          </el-space>
        </el-form-item>

        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul class="list-styled">
              <li>在添加时间节点时设置“提前提醒天数”</li>
              <li>系统每天0点自动检查即将到期的事件</li>
              <li>每个事件每天只提醒一次</li>
              <li>系统通知需要授予应用权限</li>
            </ul>
          </template>
        </el-alert>
      </el-form>
    </el-card>

    <!-- 缓存管理 -->
    <el-card class="setting-card" shadow="never">
      <template #header>
        <div class="card-header-icon-title">
          <el-icon><Delete /></el-icon>
          <span>缓存管理</span>
        </div>
      </template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb-16"
      >
        <template #default>
          页面显示异常时，可以尝试清除缓存。清除缓存会清空本地存储的表单状态和临时数据，但不会影响数据库数据。
        </template>
      </el-alert>
      <el-button type="warning" @click="handleClearCache" plain>
        <el-icon class="mr-6"><Refresh /></el-icon>
        清除缓存并刷新
      </el-button>
    </el-card>

    <!-- 数据备份 -->
    <el-card class="setting-card" shadow="never">
      <template #header>
        <div class="card-header-icon-title">
          <el-icon><FolderOpened /></el-icon>
          <span>数据备份</span>
        </div>
      </template>
      <div class="data-management">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="数据库位置">
            <el-text type="info" class="text-monospace">sqlite:event_time.db</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="数据库大小">
            <el-text>{{ dbSize }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <el-space>
          <el-button type="primary" @click="handleBackup">
            <el-icon class="mr-6"><Download /></el-icon>
            备份数据
          </el-button>
          <el-button type="success" @click="handleRestore">
            <el-icon class="mr-6"><Upload /></el-icon>
            恢复数据
          </el-button>
          <el-button type="danger" @click="handleClearAll">
            <el-icon class="mr-6"><Delete /></el-icon>
            清空数据
          </el-button>
        </el-space>
      </div>
    </el-card>

    <!-- 关于 -->
    <el-card class="setting-card" shadow="never">
      <template #header>
        <div class="card-header-icon-title">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="应用名称">时间节点记录系统</el-descriptions-item>
        <el-descriptions-item label="版本">v1.0.1</el-descriptions-item>
        <el-descriptions-item label="技术栈">Tauri 2.0 + Vue 3 + Element Plus</el-descriptions-item>
        <el-descriptions-item label="数据库">SQLite</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, Refresh, Download, Upload, Delete, Bell, FolderOpened, InfoFilled } from '@element-plus/icons-vue'
import { api } from '@/api'
import * as XLSX from 'xlsx'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { useReminderStore } from '@/stores/reminder'
import { reminderService } from '@/services/reminderService'
import { open } from '@tauri-apps/plugin-shell'

const dbSize = ref('计算中...')

// 提醒配置
const reminderStore = useReminderStore()
const reminderSettings = reminderStore.settings

// 处理提醒设置变更
const handleReminderSettingChange = () => {
  reminderStore.saveSettings(reminderSettings)
  ElMessage.success('提醒设置已保存')
}

// 打开Server酱帮助
const openServerChanHelp = async () => {
  try {
    await open('https://sct.ftqq.com/')
  } catch (error) {
    window.open('https://sct.ftqq.com/', '_blank')
  }
}

// 测试提醒功能
const testReminder = async () => {
  try {
    if (reminderSettings.notificationType === 'system' || reminderSettings.notificationType === 'both') {
      // 测试系统通知
      await reminderService.sendSystemNotification({
        timePoint: {
          id: 0,
          category_l1_id: 0,
          category_l2_id: 0,
          category_l3_id: null,
          region_id: 0,
          event_date: '2025-11-03',
          end_date: null,
          year: 2024,
          note: '这是一条测试提醒',
          source: null,
          source_url: null,
          is_confirmed: 1,
          remind_days: 3,
          created_at: '',
          updated_at: ''
        },
        daysUntilEvent: 3,
        categoryPath: '测试分类',
        regionName: '测试区域'
      })
      ElMessage.success('系统通知测试成功！请查看系统通知')
    }
    
    if ((reminderSettings.notificationType === 'serverchan' || reminderSettings.notificationType === 'both') && reminderSettings.serverChanKey) {
      // 测试Server酱
      await reminderService.sendServerChanNotification({
        timePoint: {
          id: 0,
          category_l1_id: 0,
          category_l2_id: 0,
          category_l3_id: null,
          region_id: 0,
          event_date: '2024-11-03',
          end_date: null,
          year: 2024,
          note: '这是一条测试提醒',
          source: null,
          source_url: null,
          is_confirmed: 1,
          remind_days: 3,
          created_at: '',
          updated_at: ''
        },
        daysUntilEvent: 3,
        categoryPath: '测试分类',
        regionName: '测试区域'
      }, reminderSettings.serverChanKey)
      ElMessage.success('Server酱测试消息已发送！请查看微信')
    }
    
    if (reminderSettings.notificationType === 'serverchan' && !reminderSettings.serverChanKey) {
      ElMessage.warning('请先配置Server酱SendKey')
    }
  } catch (error) {
    console.error('测试提醒失败:', error)
    ElMessage.error('测试提醒失败：' + error)
  }
}

// 立即检查提醒
const checkRemindersNow = async () => {
  try {
    await reminderService.performReminderCheck(
      reminderSettings.notificationType,
      reminderSettings.serverChanKey
    )
    ElMessage.success('检查完成！如有待提醒事件，已发送通知')
  } catch (error) {
    console.error('检查提醒失败:', error)
    ElMessage.error('检查提醒失败：' + error)
  }
}

onMounted(async () => {
  // 计算数据库大小
  try {
    const timePoints = await api.timePoints.getList(10000, 0)
    const categories = await api.categories.getAll()
    const regions = await api.regions.getAll()
    
    const totalRecords = timePoints.length + categories.length + regions.length
    const estimatedSize = totalRecords * 0.5 // 简单估算，每条记录约0.5KB
    
    if (estimatedSize < 1024) {
      dbSize.value = `${estimatedSize.toFixed(2)} KB`
    } else {
      dbSize.value = `${(estimatedSize / 1024).toFixed(2)} MB`
    }
  } catch (error) {
    dbSize.value = '计算失败'
  }
})

// 备份数据为xlsx
const handleBackup = async () => {
  try {
    const [timePoints, categories, regions] = await Promise.all([
      api.timePoints.getList(10000, 0),
      api.categories.getAll(),
      api.regions.getAll()
    ])
    
    // 准备时间节点数据
    const timePointsData = timePoints.map(tp => {
      const cat1 = categories.find(c => c.id === tp.category_l1_id)
      const cat2 = categories.find(c => c.id === tp.category_l2_id)
      const cat3 = tp.category_l3_id ? categories.find(c => c.id === tp.category_l3_id) : null
      const region = regions.find(r => r.id === tp.region_id)
      
      return {
        '年份': tp.year,
        '一级分类': cat1?.name || '',
        '二级分类': cat2?.name || '',
        '三级分类': cat3?.name || '',
        '区域': region?.name || '',
        '开始日期': tp.event_date,
        '结束日期': tp.end_date || '',
        '备注': tp.note || '',
        '来源': tp.source || '',
        '来源链接': tp.source_url || '',
        '是否确认': tp.is_confirmed ? '是' : '否'
      }
    })
    
    // 准备分类数据
    const categoriesData = categories.map(c => ({
      'ID': c.id,
      '名称': c.name,
      '级别': c.level,
      '父级ID': c.parent_id || '',
      '排序': c.sort_order
    }))
    
    // 准备区域数据
    const regionsData = regions.map(r => ({
      'ID': r.id,
      '名称': r.name,
      '类型': r.region_type === 'national' ? '全国' : r.region_type === 'province' ? '省份' : '城市',
      '排序': r.sort_order
    }))
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 添加工作表
    const ws1 = XLSX.utils.json_to_sheet(timePointsData)
    const ws2 = XLSX.utils.json_to_sheet(categoriesData)
    const ws3 = XLSX.utils.json_to_sheet(regionsData)
    
    XLSX.utils.book_append_sheet(wb, ws1, '时间节点')
    XLSX.utils.book_append_sheet(wb, ws2, '分类')
    XLSX.utils.book_append_sheet(wb, ws3, '区域')
    
    // 生成Excel文件
    const timestamp = new Date().toISOString().split('T')[0]
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    
    try {
      // 使用Tauri对话框让用户选择保存位置
      const filePath = await save({
        defaultPath: `时间节点备份-${timestamp}.xlsx`,
        filters: [{
          name: 'Excel文件',
          extensions: ['xlsx']
        }]
      })
      
      if (filePath) {
        // 将ArrayBuffer转为Uint8Array
        const uint8Array = new Uint8Array(wbout)
        // 使用Tauri API保存文件
        await writeFile(filePath, uint8Array)
        ElMessage.success(`备份成功！文件已保存至：${filePath}`)
      } else {
        ElMessage.info('已取消备份')
      }
    } catch (saveError) {
      // 如果Tauri API失败，降级使用浏览器下载
      console.warn('Tauri保存失败，使用浏览器下载:', saveError)
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `时间节点备份-${timestamp}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      ElMessage.success('备份成功！Excel文件已下载')
    }
  } catch (error) {
    console.error('备份失败：', error)
    ElMessage.error('备份失败：' + error)
  }
}

// 恢复数据从xlsx
const handleRestore = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      await ElMessageBox.confirm(
        `确定要恢复数据吗？这将删除所有现有时间节点数据并导入Excel文件中的数据。`,
        '恢复数据',
        { type: 'warning' }
      )
      
      // 读取Excel文件
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // 读取时间节点工作表
      const timePointsSheet = workbook.Sheets['时间节点']
      if (!timePointsSheet) {
        ElMessage.error('Excel文件中没有找到"时间节点"工作表')
        return
      }
      
      const timePointsData = XLSX.utils.sheet_to_json(timePointsSheet)
      
      if (timePointsData.length === 0) {
        ElMessage.error('时间节点工作表为空')
        return
      }
      
      // 获取分类和区域映射
      const categories = await api.categories.getAll()
      const regions = await api.regions.getAll()
      
      const categoryMap: any = {}
      categories.forEach(c => {
        if (!categoryMap[c.level]) categoryMap[c.level] = {}
        categoryMap[c.level][c.name] = c
      })
      
      const regionMap: any = {}
      regions.forEach(r => {
        regionMap[r.name] = r
      })
      
      // 先清空所有时间节点数据
      const allTimePoints = await api.timePoints.getList(10000, 0)
      for (const tp of allTimePoints) {
        await api.timePoints.delete(tp.id)
      }
      
      // 导入数据
      let successCount = 0
      let failCount = 0
      
      for (const rowData of timePointsData) {
        try {
          const row = rowData as any
          const cat1 = categoryMap[1]?.[row['一级分类']]
          const cat2 = categoryMap[2]?.[row['二级分类']]
          const cat3 = row['三级分类'] ? categoryMap[3]?.[row['三级分类']] : null
          const region = regionMap[row['区域']]
          
          if (!cat1 || !cat2 || !region) {
            console.warn('跳过行：分类或区域未找到', row)
            failCount++
            continue
          }
          
          await api.timePoints.create({
            category_l1_id: cat1.id,
            category_l2_id: cat2.id,
            category_l3_id: cat3?.id || null,
            region_id: region.id,
            event_date: row['开始日期'],
            end_date: row['结束日期'] || null,
            year: Number(row['年份']),
            note: row['备注'] || null,
            source: row['来源'] || null,
            source_url: row['来源链接'] || null,
            is_confirmed: row['是否确认'] === '是' ? 1 : 0
          })
          successCount++
        } catch (err) {
          console.error('导入行失败：', rowData, err)
          failCount++
        }
      }
      
      ElMessage.success(`数据恢复完成！成功 ${successCount} 条，失败 ${failCount} 条`)
      window.location.reload()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('恢复失败：', error)
        ElMessage.error('恢复失败：' + error)
      }
    }
  }
  input.click()
}

// 清空所有数据
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有时间节点数据吗？此操作不可恢复！',
      '警告',
      {
        type: 'warning',
        confirmButtonText: '确定清空',
        cancelButtonText: '取消'
      }
    )
    
    const timePoints = await api.timePoints.getList(10000, 0)
    for (const tp of timePoints) {
      await api.timePoints.delete(tp.id)
    }
    
    ElMessage.success(`已清空 ${timePoints.length} 条数据`)
    window.location.reload()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败：' + error)
    }
  }
}

// 清除缓存
const handleClearCache = () => {
  try {
    // 清除localStorage
    localStorage.clear()
    // 清除sessionStorage
    sessionStorage.clear()
    ElMessage.success('缓存已清除，页面即将刷新')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    ElMessage.error('清除缓存失败：' + error)
  }
}
</script>

<style scoped>
.settings-page {
  padding: 24px 32px;
  height: 100%;
  overflow-y: auto;
  background: #f0f2f5;
}

.setting-card {
  margin: 0 0 24px 0;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: #ffffff;
}

.setting-card:first-child {
  margin-top: 0;
}

.setting-card:last-child {
  margin-bottom: 0;
}

.setting-card :deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 2px solid #e4e7ed;
  padding: 16px 24px;
  font-weight: 600;
  font-size: 15px;
}

.setting-card :deep(.el-card__body) {
  padding: 28px 24px;
  background: #ffffff;
}

.data-management {
  padding: 0;
}

.setting-card :deep(.el-form-item) {
  margin-bottom: 24px;
}

.setting-card :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

.setting-card :deep(.el-divider) {
  margin: 24px 0;
}

.setting-card :deep(.el-descriptions) {
  border-radius: 6px;
  overflow: hidden;
}

.setting-card :deep(.el-space) {
  margin-top: 20px;
}
</style>
