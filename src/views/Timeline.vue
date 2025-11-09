<template>
  <div class="timeline-page" ref="pageContainer" :class="{ 'scrolled': isScrolled }">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <el-icon :size="18"><TrendCharts /></el-icon>
        <h1 class="page-title">数据可视化</h1>
      </div>
      <div class="page-header-right">
        <el-button
          @click="loadData"
          :loading="loading"
          size="small"
        >
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </el-button>
        <el-button-group size="small">
          <el-button 
            :type="viewMode === 'grouped' ? 'primary' : 'default'"
            @click="viewMode = 'grouped'; onViewModeChange()"
          >
            <el-icon><Memo /></el-icon>
            <span>聚合</span>
          </el-button>
          <el-button 
            :type="viewMode === 'calendar' ? 'primary' : 'default'"
            @click="viewMode = 'calendar'; onViewModeChange()"
          >
            <el-icon><Calendar /></el-icon>
            <span>日历</span>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon stat-icon-primary">
          <el-icon :size="24"><DataAnalysis /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">总计事件</div>
          <div class="stat-value">{{ totalEvents }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-danger">
          <el-icon :size="24"><Bell /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">即将到来</div>
          <div class="stat-value">{{ upcomingEvents }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-info">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月事件</div>
          <div class="stat-value">{{ thisMonthEvents }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-success">
          <el-icon :size="24"><SuccessFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">已确认</div>
          <div class="stat-value">{{ confirmedEvents }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters-card sticky-filters">
      <div class="filters-header">
        <div class="filters-header-left">
          <el-icon :size="18"><Filter /></el-icon>
          <span>筛选条件</span>
        </div>
        <!-- 聚合模式切换 -->
        <div v-if="viewMode === 'grouped'" class="group-mode-switcher">
          <span class="mode-label">聚合方式：</span>
          <el-radio-group v-model="groupMode" size="small">
            <el-radio-button label="date">
              <el-icon><Calendar /></el-icon>
              <span>按日期</span>
            </el-radio-button>
            <el-radio-button label="category">
              <el-icon><Folder /></el-icon>
              <span>按分类</span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="filters-content">
        <el-row :gutter="20" align="middle">
          <el-col :span="5">
            <el-cascader
              v-model="filterCategory"
              :options="cascaderCategories"
              :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children', emitPath: false }"
              placeholder="选择分类"
              clearable
              @change="loadData"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="5">
            <el-cascader
              v-model="filterRegion"
              :options="cascaderRegions"
              :props="cascaderRegionProps"
              placeholder="选择区域"
              clearable
              @change="loadData"
              style="width: 100%"
              filterable
            />
          </el-col>
          <el-col :span="4">
            <el-date-picker
              v-model="filterDate"
              type="month"
              placeholder="选择年月"
              clearable
              @change="onDateFilterChange"
              style="width: 100%"
              format="YYYY年MM月"
              value-format="YYYY-MM"
            />
          </el-col>
          <el-col :span="6">
            <el-input v-model="searchKeyword" placeholder="搜索备注、来源..." clearable @change="loadData">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>

        </el-row>
      </div>
    </div>

      <!-- 聚合视图 -->
      <div v-if="viewMode === 'grouped'" class="grouped-view" v-loading="loading">
        <div v-if="filteredData.length === 0" class="empty-state">
          <el-empty description="暂无数据" />
        </div>
        <div v-else class="grouped-container">
          <!-- 按日期聚合 -->
          <div v-if="groupMode === 'date'" class="date-groups">
            <DateGroupCard
              v-for="group in dateGroups"
              :key="group.date"
              :date="group.date"
              :items="group.items"
            />
          </div>
          <!-- 按分类聚合 -->
          <div v-else class="category-groups">
            <CategoryGroupCard
              v-for="group in categoryGroups"
              :key="group.key"
              :category-l1-name="group.categoryL1Name"
              :category-l2-name="group.categoryL2Name"
              :items="group.items"
            />
          </div>
        </div>
      </div>

      <!-- 日历视图 -->
      <div v-else-if="viewMode === 'calendar'" class="calendar-view" v-loading="loading">
        <div class="calendar-container" :class="{ 'collapsed': selectedDate !== null }">
          <div v-if="selectedDate" class="calendar-header-bar">
            <span class="selected-month">{{ formatSelectedMonth }}</span>
            <el-button size="small" @click="resetCalendar">展开日历</el-button>
          </div>
          <el-calendar v-model="selectedCalendarDate" v-show="!selectedDate">
            <template #date-cell="{ data }">
              <div 
                class="calendar-day" 
                :class="{ 'has-events': getEventsForDate(data.day).length > 0 }"
                @click="handleDateClick(data.day)"
              >
                <div class="day-number">{{ data.day.split('-')[2] }}</div>
                <div v-if="getEventsForDate(data.day).length > 0" class="event-count">
                  {{ getEventsForDate(data.day).length }}
                </div>
              </div>
            </template>
          </el-calendar>
        </div>
        
        <!-- 选中日期的事件列表（按分类展示） -->
        <div v-if="selectedDateEvents.length > 0" class="selected-date-events">
          <div class="selected-date-title">
            <h3>{{ formatFullDate(selectedDate!) }} 的事件</h3>
          </div>
          <div class="category-groups">
            <CategoryGroupCard
              v-for="group in selectedDateCategoryGroups"
              :key="group.key"
              :category-l1-name="group.categoryL1Name"
              :category-l2-name="group.categoryL2Name"
              :items="group.items"
            />
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Calendar, DataAnalysis, SuccessFilled, Filter, Search, Memo, Bell, Folder, Refresh } from '@element-plus/icons-vue'
import { api, Category, Region } from '@/api'
import dayjs from 'dayjs'
import DateGroupCard from '@/components/DateGroupCard.vue'
import CategoryGroupCard from '@/components/CategoryGroupCard.vue'
import { formatFullDate } from '@/composables/useEventCard'

const loading = ref(false)
const allData = ref<any[]>([])
const allCategories = ref<Category[]>([])
const allRegions = ref<Region[]>([])

// 页面容器和滚动状态
const pageContainer = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

// 视图模式
const viewMode = ref<'calendar' | 'grouped'>('grouped')

// 聚合模式：按日期或按分类
const groupMode = ref<'date' | 'category'>('date')

// 日历视图相关
const selectedCalendarDate = ref(new Date())
const selectedDate = ref<string | null>(null)

// 新增的搜索和筛选变量
const filterDate = ref<string | null>(null)
const searchKeyword = ref('')

// 时间轴模式的筛选器
const filterCategory = ref<number | null>(null)
const filterRegion = ref<number | null>(null)

// 统计数据计算
const totalEvents = computed(() => allData.value.length)
const upcomingEvents = computed(() => {
  return allData.value.filter(item => {
    if (!item.advance_days) return false
    const eventDate = dayjs(item.event_date)
    const today = dayjs()
    const daysUntil = eventDate.diff(today, 'day')
    return daysUntil >= 0 && daysUntil <= item.advance_days
  }).length
})
const thisMonthEvents = computed(() => {
  const now = dayjs()
  return allData.value.filter(item => {
    const eventDate = dayjs(item.event_date)
    return eventDate.month() === now.month() && eventDate.year() === now.year()
  }).length
})
const confirmedEvents = computed(() => {
  return allData.value.filter(item => item.is_confirmed === 1).length
})

// 级联选择器数据结构
const cascaderCategories = computed(() => {
  // 构建分类树结构
  const level1 = allCategories.value.filter(c => c.level === 1)
  return level1.map(l1 => ({
    id: l1.id,
    name: l1.name,
    children: allCategories.value
      .filter(c => c.level === 2 && c.parent_id === l1.id)
      .map(l2 => ({
        id: l2.id,
        name: l2.name
      }))
  }))
})

// 级联区域选择器数据结构（全国/省份/城市三级）
const cascaderRegions = computed(() => {
  const result: any[] = []
  
  // 获取所有区域并按类型分组
  const nationalRegions = allRegions.value
    .filter(r => r.region_type === 'national')
    .sort((a, b) => a.sort_order - b.sort_order)
  
  const provinces = allRegions.value
    .filter(r => r.region_type === 'province')
    .sort((a, b) => a.sort_order - b.sort_order)
  
  const cities = allRegions.value
    .filter(r => r.region_type === 'city')
    .sort((a, b) => a.sort_order - b.sort_order)
  
  // 第一级：全国（直接作为叶子节点）
  if (nationalRegions.length > 0) {
    nationalRegions.forEach(region => {
      result.push({
        value: region.id,
        label: region.name,
        isLeaf: true
      })
    })
  }
  
  // 第一级：省份（分组）
  if (provinces.length > 0) {
    result.push({
      value: 'province',
      label: '省份',
      children: provinces.map(province => ({
        value: province.id,
        label: province.name,
        isLeaf: true
      }))
    })
  }
  
  // 第一级：城市（分组）
  if (cities.length > 0) {
    result.push({
      value: 'city',
      label: '城市',
      children: cities.map(city => ({
        value: city.id,
        label: city.name,
        isLeaf: true
      }))
    })
  }
  
  return result
})

// 级联选择器配置
const cascaderRegionProps = {
  checkStrictly: true,
  emitPath: false,
  value: 'value',
  label: 'label',
  children: 'children'
}

// 加载数据
// 初始化加载分类和区域数据
const initializeData = async () => {
  try {
    if (allCategories.value.length === 0) {
      allCategories.value = await api.categories.getAll()
    }
    if (allRegions.value.length === 0) {
      allRegions.value = await api.regions.getAll()
    }
    await loadData()
  } catch (error) {
    ElMessage.error('加载数据失败：' + error)
  }
}

onMounted(() => {
  initializeData()
  
  // 添加滚动事件监听
  if (pageContainer.value) {
    pageContainer.value.addEventListener('scroll', handleScroll)
  }
})

onBeforeUnmount(() => {
  // 移除滚动事件监听
  if (pageContainer.value) {
    pageContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// 处理滚动事件
const handleScroll = () => {
  if (pageContainer.value) {
    isScrolled.value = pageContainer.value.scrollTop > 50
  }
}

// 页面激活时刷新数据（从其他页面返回时）
onActivated(() => {
  // 重新加载数据以获取最新的确认状态
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const timePoints = await api.timePoints.getList(1000, 0)

    // 创建查找映射以提高性能
    const categoryMap = new Map(allCategories.value.map(c => [c.id, c]))
    const regionMap = new Map(allRegions.value.map(r => [r.id, r]))

    allData.value = timePoints.map(tp => {
      const cat1 = categoryMap.get(tp.category_l1_id)
      const cat2 = categoryMap.get(tp.category_l2_id)
      const cat3 = tp.category_l3_id ? categoryMap.get(tp.category_l3_id) : null
      const region = regionMap.get(tp.region_id)

      return {
        ...tp,
        category_path: cat3 
          ? `${cat1?.name} > ${cat2?.name} > ${cat3.name}`
          : `${cat1?.name} > ${cat2?.name}`,
        region_name: region?.name || '',
        category_l1: cat1,
        category_l2: cat2,
        category_l3: cat3
      }
    })
  } catch (error) {
    ElMessage.error('加载失败：' + error)
  } finally {
    loading.value = false
  }
}

// 视图模式切换
const onViewModeChange = () => {
  // 不清空筛选条件，保持用户的选择
  // 如果切换到日历视图，清空选中的日期
  if (viewMode.value === 'calendar') {
    selectedDate.value = null
  }
}

// 获取指定日期的事件
const getEventsForDate = (dateStr: string) => {
  return filteredData.value.filter(item => item.event_date === dateStr)
}

// 处理日期点击
const handleDateClick = (dateStr: string) => {
  selectedDate.value = dateStr
  // 滚动到事件列表
  setTimeout(() => {
    const eventsSection = document.querySelector('.selected-date-events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

// 重置日历
const resetCalendar = () => {
  selectedDate.value = null
}

// 选中日期的事件总数
const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return []
  return getEventsForDate(selectedDate.value)
})

// 选中日期的事件按分类分组
const selectedDateCategoryGroups = computed(() => {
  const groupMap = new Map<string, any[]>()

  selectedDateEvents.value.forEach(item => {
    const groupKey = `${item.category_l1_id}_${item.category_l2_id}`
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(item)
  })

  const groups: any[] = []
  groupMap.forEach((items, key) => {
    const firstItem = items[0]
    groups.push({
      key,
      categoryL1Name: firstItem.category_l1?.name || '未知分类',
      categoryL2Name: firstItem.category_l2?.name || '未知分类',
      items
    })
  })

  return groups
})

// 格式化选中月份
const formatSelectedMonth = computed(() => {
  if (!selectedDate.value) return ''
  const date = dayjs(selectedDate.value)
  return date.format('YYYY年MM月')
})

// 统一的筛选后数据
const filteredData = computed(() => {
  let data = allData.value

  // 分类筛选（支持一级和二级）
  if (filterCategory.value) {
    const selectedCat = allCategories.value.find(c => c.id === filterCategory.value)
    if (selectedCat) {
      if (selectedCat.level === 1) {
        // 筛选一级分类
        data = data.filter(item => item.category_l1_id === filterCategory.value)
      } else if (selectedCat.level === 2) {
        // 筛选二级分类
        data = data.filter(item => item.category_l2_id === filterCategory.value)
      }
    }
  }

    // 区域筛选
  if (filterRegion.value) {
    // 过滤掉省份分组的ID（字符串类型）
    if (typeof filterRegion.value === 'number') {
      data = data.filter(item => item.region_id === filterRegion.value)
    }
  }

  // 年月筛选
  if (filterDate.value) {
    const [year, month] = filterDate.value.split('-').map(Number)
    data = data.filter(item => {
      const eventDate = dayjs(item.event_date)
      return eventDate.year() === year && eventDate.month() + 1 === month
    })
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(item => {
      return (item.note && item.note.toLowerCase().includes(keyword)) ||
             (item.source && item.source.toLowerCase().includes(keyword)) ||
             (item.category_path && item.category_path.toLowerCase().includes(keyword))
    })
  }

  // 按日期排序
  return data.sort((a, b) => {
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  })
})


// 日期筛选变化处理
const onDateFilterChange = () => {
  loadData()
}

// 按日期分组
const dateGroups = computed(() => {
  const groupMap = new Map<string, any[]>()

  filteredData.value.forEach(item => {
    const date = item.event_date
    if (!groupMap.has(date)) {
      groupMap.set(date, [])
    }
    groupMap.get(date)!.push(item)
  })

  const groups = Array.from(groupMap.entries()).map(([date, items]) => ({
    date,
    items
  }))

  return groups.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
})

// 按分类分组（一级+二级）
const categoryGroups = computed(() => {
  const groupMap = new Map<string, any[]>()

  filteredData.value.forEach(item => {
    const groupKey = `${item.category_l1_id}_${item.category_l2_id}`
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(item)
  })

  const groups: any[] = []
  groupMap.forEach((items, key) => {
    const firstItem = items[0]
    groups.push({
      key,
      categoryL1Name: firstItem.category_l1?.name || '未知分类',
      categoryL2Name: firstItem.category_l2?.name || '未知分类',
      items
    })
  })

  return groups
})
</script>

<style scoped>
/* 页面容器 */
.timeline-page {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  background: #f0f2f5;
}

/* 统一页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.page-header-left .el-icon {
  color: #606266;
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  line-height: 1;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn :deep(.el-icon) {
  margin-right: 0;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px 32px;
  background: #f8f9fa;
}

.stat-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.stat-icon-primary {
  background: #409eff;
}

.stat-icon-danger {
  background: #f56c6c;
}

.stat-icon-info {
  background: #909399;
}

.stat-icon-success {
  background: #67c23a;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

/* 筛选器卡片 */
.filters-card {
  margin: 0 32px 24px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: visible;
  z-index: 100;
}

.sticky-filters {
  position: sticky;
  top: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0);
  transition: all 0.3s ease;
  margin-left: 32px;
  margin-right: 32px;
  border-radius: 8px;
}

/* 页面滚动后的样式 */
.timeline-page.scrolled .sticky-filters {
  margin-left: 0;
  margin-right: 0;
  border-radius: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  left: 50%;
  right: 50%;

}

.filters-header {
  background: #fafafa;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.filters-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-mode-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-mode-switcher .mode-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.group-mode-switcher :deep(.el-radio-button__inner) {
  padding: 8px 16px;
  font-size: 13px;
}

.group-mode-switcher :deep(.el-icon) {
  margin-right: 4px;
  vertical-align: middle;
}

.filters-content {
  padding: 20px;
}

/* 滚动后筛选器内容居中 */
.timeline-page.scrolled .filters-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 32px;
}

/* 区域选择器优化 */
.filters-content :deep(.el-select-dropdown__item-group) {
  padding: 0;
}

.filters-content :deep(.el-select-group__title) {
  padding: 8px 12px;
  background: #f5f7fa;
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  border-bottom: 1px solid #e4e7ed;
}

.filters-content :deep(.el-select-group__wrap) {
  padding: 4px 0;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

/* 响应式统计卡片 */
@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 聚合视图样式 */
.grouped-view {
  padding: 0 32px 32px;
}

.grouped-container {
  padding: 20px 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

/* 日期分组容器 */
.date-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 分类分组容器 */
.category-groups {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

@media (max-width: 1400px) {
  .category-groups {
    grid-template-columns: 1fr;
  }
}

/* 日历视图样式 */
.calendar-view {
  padding: 0 32px 32px;
}

.calendar-view .selected-date-events {
  margin-top: 24px;
}

.calendar-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.calendar-container.collapsed {
  padding: 0;
}

.calendar-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
}

.selected-month {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.calendar-container :deep(.el-calendar) {
  border: none;
}

.calendar-container :deep(.el-calendar__header) {
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.calendar-day {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
}

.calendar-day:hover {
  background: #f5f7fa;
}

.calendar-day.has-events {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.calendar-day.has-events:hover {
  background: #d9ecff;
  transform: scale(1.05);
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.event-count {
  margin-top: 4px;
  padding: 2px 8px;
  background: #409eff;
  color: #ffffff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.selected-date-events {
  margin-top: 24px;
}

.selected-date-title {
  margin-bottom: 20px;
}

.selected-date-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding: 16px 0;
  border-bottom: 2px solid #409eff;
}

.selected-date-events .category-groups {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

@media (max-width: 1400px) {
  .selected-date-events .category-groups {
    grid-template-columns: 1fr;
  }
}
</style>
