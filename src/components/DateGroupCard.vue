<template>
  <el-card class="date-group-card" shadow="hover">
    <!-- 卡片头部：日期信息 -->
    <div class="date-header">
      <div class="date-info">
        <el-icon :size="18" class="date-icon"><Calendar /></el-icon>
        <span class="date-text">{{ formatDate }}</span>
        <el-divider direction="vertical" />
        <span class="event-count" :class="{ 'has-reminder': hasReminder }">
          {{ items.length }} 个事件
        </span>
        <el-tag v-if="confirmedCount > 0" type="success" size="small" effect="plain">
          {{ confirmedCount }} 已确认
        </el-tag>
      </div>
      <el-button
        v-if="items.length > 4"
        text
        @click="expanded = !expanded"
        class="expand-btn"
      >
        {{ expanded ? '收起' : '展开全部' }}
        <el-icon :class="{ 'rotate': expanded }"><ArrowDown /></el-icon>
      </el-button>
    </div>

    <!-- 事件列表 -->
    <div class="events-list" :class="{ 'compact': !expanded && items.length > 4 }">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="event-row"
        :class="{ 'has-reminder': getEventReminderInfo(item).show }"
      >
        <!-- 左侧状态指示器 -->
        <div class="event-status">
          <div class="status-indicator" :class="{
            'confirmed': item.is_confirmed === 1,
            'reminder': getEventReminderInfo(item).show
          }">
            <el-icon v-if="item.is_confirmed === 1" :size="12"><Check /></el-icon>
            <el-icon v-else-if="getEventReminderInfo(item).show" :size="12"><Bell /></el-icon>
          </div>
        </div>

        <!-- 事件主要内容 -->
        <div class="event-main">
          <!-- 第一行：分类和地区 -->
          <div class="event-header">
            <span class="event-category">
              <span class="category-l1">{{ getCategoryL1(item) }}</span>
              <el-icon :size="12" class="arrow-icon"><ArrowRight /></el-icon>
              <span class="category-l2">{{ getCategoryL2(item) }}</span>
              <template v-if="item.category_l3">
                <el-icon :size="12" class="arrow-icon"><ArrowRight /></el-icon>
                <span class="category-l3">{{ item.category_l3.name }}</span>
              </template>
            </span>
            <span class="event-region">
              <el-icon :size="13"><Location /></el-icon>
              {{ item.region_name }}
            </span>
          </div>

          <!-- 第二行：备注（如果有） -->
          <div v-if="item.note" class="event-note">
            Tips：{{ item.note }}
          </div>

          <!-- 第三行：附加信息 -->
          <div v-if="item.source || item.end_date || getEventReminderInfo(item).show" class="event-footer">
            <span v-if="getEventReminderInfo(item).show" class="reminder-badge">
              <el-icon :size="12"><Bell /></el-icon>
              {{ getEventReminderInfo(item).daysLeft }}天后
            </span>
            <span v-if="item.end_date" class="duration-text">
              <el-icon :size="12"><Clock /></el-icon>
              至{{ item.end_date }}截止
            </span>
            <el-link
              v-if="item.source_url"
              @click.stop="openUrl(item.source_url)"
              type="primary"
              :underline="false"
              size="small"
              class="source-link"
            >
              <el-icon :size="12"><Link /></el-icon>
              {{ item.source }}
            </el-link>
            <span v-else-if="item.source" class="source-text">
              <el-icon :size="12"><Link /></el-icon>
              {{ item.source }}
            </span>
          </div>
        </div>

        <!-- 右侧已确认标识 -->
        <div v-if="item.is_confirmed === 1" class="event-confirmed-badge">
          <el-icon :size="14"><CircleCheck /></el-icon>
        </div>
      </div>

      <!-- 展开提示 -->
      <div v-if="!expanded && items.length > 4" class="expand-hint" @click="expanded = true">
        <el-icon><ArrowDown /></el-icon>
        <span>还有 {{ items.length - 4 }} 个事件，点击展开</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Calendar,
  Location,
  Bell,
  Check,
  Link,
  Clock,
  ArrowDown,
  ArrowRight,
  CircleCheck
} from '@element-plus/icons-vue'
import { 
  type EventItem,
  getEventReminderInfo,
  openUrl,
  formatFullDate
} from '@/composables/useEventCard'

interface Props {
  date: string
  items: EventItem[]
}

const props = defineProps<Props>()

const expanded = ref(false)

// 显示的事件列表
const displayItems = computed(() => {
  if (expanded.value || props.items.length <= 4) {
    return props.items
  }
  return props.items.slice(0, 4)
})

// 格式化日期
const formatDate = computed(() => formatFullDate(props.date))

// 是否有提醒
const hasReminder = computed(() => {
  return props.items.some(item => getEventReminderInfo(item).show)
})

// 已确认数量
const confirmedCount = computed(() => {
  return props.items.filter(item => item.is_confirmed === 1).length
})

// 获取一级分类名称
const getCategoryL1 = (item: EventItem) => {
  return item.category_l1?.name || '未知'
}

// 获取二级分类名称
const getCategoryL2 = (item: EventItem) => {
  return item.category_l2?.name || '未知'
}
</script>
