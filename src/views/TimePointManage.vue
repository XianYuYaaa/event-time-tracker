<template>
  <div class="timepoint-manage-page">
    <el-card>
      <template #header>
        <PageHeader title="时间节点管理" :icon="Calendar">
          <template #actions>
            <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
              批量删除 ({{ selectedIds.length }})
            </el-button>
          </template>
        </PageHeader>
      </template>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        show-icon
        class="mb-16"
      >
        此页面用于批量管理时间节点，日常查看和编辑请使用“查询”页面
      </el-alert>

      <el-table
        :data="tableData"
        @selection-change="handleSelectionChange"
        v-loading="loading"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="日期范围" width="180">
          <template #default="{ row }">
            {{ row.event_date }}
            <span v-if="row.end_date"> ~ {{ row.end_date }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="220">
          <template #default="{ row }">{{ row.category_path }}</template>
        </el-table-column>
        <el-table-column label="区域" prop="region_name" width="120" />
        <el-table-column label="备注" prop="note" min-width="180" show-overflow-tooltip />
        <el-table-column label="来源" width="150">
          <template #default="{ row }">
            <el-link v-if="row.source_url" @click="openUrl(row.source_url)" type="primary">
              {{ row.source || '查看链接' }}
            </el-link>
            <span v-else>{{ row.source || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
        class="mt-20"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar } from '@element-plus/icons-vue'
import { api } from '@/api'
import { processTimePoints } from '@/utils'
import type { TimePointWithRelations } from '@/types'
import PageHeader from '@/components/PageHeader.vue'

const loading = ref(false)
const tableData = ref<TimePointWithRelations[]>([])
const selectedIds = ref<number[]>([])
const total = ref(0)

const pagination = reactive({
  page: 1,
  size: 20
})

// 打开URL
const openUrl = (url: string) => {
  try {
    window.open(url, '_blank')
  } catch (error) {
    ElMessage.error('无法打开链接：' + error)
  }
}

onMounted(() => {
  loadData()
})

/**
 * 加载数据
 * 使用公共工具函数处理时间节点数据
 */
const loadData = async () => {
  loading.value = true
  try {
    // 并行加载数据
    const [timePoints, categories, regions] = await Promise.all([
      api.timePoints.getList(1000, 0),
      api.categories.getAll(),
      api.regions.getAll()
    ])

    // 使用工具函数处理数据
    const processed = processTimePoints(timePoints, categories, regions)

    total.value = processed.length
    const start = (pagination.page - 1) * pagination.size
    tableData.value = processed.slice(start, start + pagination.size)
  } catch (error) {
    ElMessage.error('加载失败：' + error)
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(s => s.id)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning'
    })
    
    await api.timePoints.delete(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '批量删除', {
      type: 'warning'
    })

    for (const id of selectedIds.value) {
      await api.timePoints.delete(id)
    }

    ElMessage.success('删除成功')
    selectedIds.value = []
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error)
    }
  }
}
</script>

<style scoped>
.timepoint-manage-page {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  background: #f0f2f5;
}

.timepoint-manage-page :deep(.el-card) {
  border-radius: 0;
  border: none;
  min-height: 100%;
}

.timepoint-manage-page :deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 2px solid #e4e7ed;
  padding: 20px 32px;
}

.timepoint-manage-page :deep(.el-card__body) {
  padding: 32px;
  background: #f8f9fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.timepoint-manage-page :deep(.el-table) {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.timepoint-manage-page :deep(.el-table__header) {
  font-weight: 600;
  background: #fafafa;
}

.timepoint-manage-page :deep(.el-table__row) {
  transition: background-color 0.2s;
}

.timepoint-manage-page :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
