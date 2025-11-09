<template>
  <div class="data-manage-page">
    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <template #header>
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon :size="18"><Filter /></el-icon>
          <span style="font-weight: 600;">筛选条件</span>
        </div>
      </template>
      <el-form :model="filters">
        <!-- 第一行：分类筛选 -->
        <div class="filter-row">
          <el-form-item label="一级分类" class="filter-item">
            <el-select v-model="filters.category_l1_id" placeholder="全部" clearable style="width: 200px" @change="onL1FilterChange" @clear="onFilterChange">
              <el-option v-for="cat in level1Categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="二级分类" class="filter-item" v-if="filters.category_l1_id">
            <el-select v-model="filters.category_l2_id" placeholder="全部" clearable style="width: 200px" @change="onL2FilterChange" @clear="onFilterChange">
              <el-option v-for="cat in filterLevel2Categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="三级分类" class="filter-item" v-if="filters.category_l2_id">
            <el-select v-model="filters.category_l3_id" placeholder="全部" clearable style="width: 200px" @change="onFilterChange">
              <el-option v-for="cat in filterLevel3Categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
        </div>

        <!-- 第二行：其他筛选 -->
        <div class="filter-row">
          <el-form-item label="区域类型" class="filter-item">
            <el-select v-model="filters.region_type" placeholder="全部" clearable style="width: 150px" @change="onRegionTypeFilterChange" @clear="onFilterChange">
              <el-option label="全国" value="national" />
              <el-option label="省份" value="province" />
              <el-option label="城市" value="city" />
            </el-select>
          </el-form-item>

          <el-form-item label="具体区域" class="filter-item" v-if="filters.region_type">
            <el-select v-model="filters.region_id" placeholder="全部" clearable filterable style="width: 180px" @change="onFilterChange">
              <el-option v-for="region in filteredRegionsByType" :key="region.id" :label="region.name" :value="region.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="关键词" class="filter-item">
            <el-input v-model="filters.keyword" placeholder="搜索备注、来源" clearable style="width: 240px" @change="onFilterChange" />
          </el-form-item>

          <el-form-item class="filter-item">
            <el-button @click="resetFilters" :icon="Refresh">重置筛选</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>


    <!-- 数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon :size="20"><Document /></el-icon>
            <span style="font-size: 16px; font-weight: 600;">数据列表</span>
            <el-tag size="small" type="info" style="margin-left: 8px;">共 {{ totalCount }} 条</el-tag>
          </div>
          <el-space>
            <template v-if="!batchMode">
              <el-button size="default" @click="loadData" :icon="Refresh">刷新</el-button>
              <el-button type="primary" size="default" @click="enterBatchMode" :icon="Operation">批量管理</el-button>
            </template>
            <template v-else>
              <el-button type="danger" size="default" :disabled="!selectedIds.length" @click="handleBatchDelete" :icon="Delete">
                批量删除 ({{ selectedIds.length }})
              </el-button>
              <el-button size="default" @click="exitBatchMode" :icon="Close">退出</el-button>
            </template>
          </el-space>
        </div>
      </template>

      <el-table
        :data="tableData"
        stripe
        @row-dblclick="handleEdit"
        @selection-change="handleSelectionChange"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column v-if="batchMode" type="selection" width="45" />
        
        <el-table-column label="区域" width="120" prop="region_name" show-overflow-tooltip />

        <el-table-column label="分类路径" width="230" prop="category_path" show-overflow-tooltip />

        <el-table-column label="日期范围" width="140">
          <template #default="{ row }">
            {{ row.event_date }}
            <span v-if="row.end_date"> ~ {{ row.end_date }}</span>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="120" prop="note" show-overflow-tooltip />

        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-link v-if="row.source_url" @click.stop="openUrl(row.source_url)" type="primary" size="small" style="cursor: pointer;">
              {{ row.source || '链接' }}
            </el-link>
            <span v-else>{{ row.source || '--' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_confirmed" type="success" size="small">已确认</el-tag>
            <el-tag v-else type="info" size="small">未确认</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="totalCount"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="loadData"
        style="margin-top: 20px; justify-content: center"
      />

      <el-alert
        title="提示：双击行可以快速编辑"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 10px"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑时间节点"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="100px" v-if="editDialogVisible">
        <el-form-item label="分类路径">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-select v-model="editForm.category_l1_id" placeholder="一级" @change="onEditL1Change" style="width: 100%">
                <el-option v-for="cat in level1Categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select v-model="editForm.category_l2_id" placeholder="二级" @change="onEditL2Change" :disabled="!editForm.category_l1_id" style="width: 100%">
                <el-option v-for="cat in editLevel2Categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select 
                v-model="editForm.category_l3_name" 
                placeholder="三级（可选）" 
                :disabled="!editForm.category_l2_id" 
                filterable
                allow-create
                default-first-option
                clearable
                style="width: 100%"
              >
                <el-option v-for="cat in editLevel3Categories" :key="cat.id" :label="cat.name" :value="cat.name" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="区域">
          <el-select v-model="editForm.region_id" placeholder="选择区域" filterable style="width: 100%">
            <el-option v-for="region in allRegions" :key="region.id" :label="region.name" :value="region.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始日期">
          <el-date-picker
            v-model="editForm.event_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="editForm.end_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="可选"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="editForm.note" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="来源名称">
          <el-input v-model="editForm.source" />
        </el-form-item>

        <el-form-item label="来源链接">
          <el-input v-model="editForm.source_url" placeholder="可选" />
        </el-form-item>

        <el-form-item label="提前提醒">
          <el-input-number
            v-model="editForm.remind_days"
            :min="0"
            :max="365"
            placeholder="天数"
            style="width: 180px;"
          />
          <span style="margin-left: 8px; color: #909399; font-size: 13px;">提前多少天提醒（0表示不提醒）</span>
        </el-form-item>

        <el-form-item label="确认状态">
          <el-switch v-model="editForm.is_confirmed" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="updating">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter, Document, Refresh, Operation, Delete, Close } from '@element-plus/icons-vue'
import { api, Category, Region } from '@/api'
import { open as tauriOpen } from '@tauri-apps/plugin-shell'

// 数据
const loading = ref(false)
const updating = ref(false)
const tableData = ref<any[]>([])
const level1Categories = ref<Category[]>([])
const allRegions = ref<Region[]>([])
const selectedIds = ref<number[]>([])
const batchMode = ref(false) // 批量管理模式

// 筛选器
const filters = reactive({
  category_l1_id: null as number | null,
  category_l2_id: null as number | null,
  category_l3_id: null as number | null,
  region_type: null as string | null,
  region_id: null as number | null,
  year: null as number | null,
  keyword: ''
})

const filterLevel2Categories = ref<Category[]>([])
const filterLevel3Categories = ref<Category[]>([])

const filteredRegionsByType = computed(() => {
  if (!filters.region_type) return []
  return allRegions.value.filter(r => r.region_type === filters.region_type)
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20
})

// 统计数据
const totalCount = ref(0)

// 编辑对话框
const editDialogVisible = ref(false)
const editingRow = ref<any>(null)
const editLevel2Categories = ref<Category[]>([])
const editLevel3Categories = ref<Category[]>([])
const editForm = reactive({
  category_l1_id: null as number | null,
  category_l2_id: null as number | null,
  category_l3_id: null as number | null,
  category_l3_name: null as string | null,
  region_id: null as number | null,
  event_date: '',
  end_date: null as string | null,
  note: '',
  source: '',
  source_url: '',
  is_confirmed: false,
  remind_days: 0
})

// 打开URL
const openUrl = async (url: string) => {
  try {
    await tauriOpen(url)
  } catch (error) {
    ElMessage.error('无法打开链接：' + error)
  }
}

onMounted(() => {
  loadData()
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const [timePoints, categories, regions] = await Promise.all([
      api.timePoints.getList(1000, 0),
      api.categories.getAll(),
      api.regions.getAll()
    ])

    level1Categories.value = categories.filter(c => c.level === 1)
    allRegions.value = regions

    // 处理筛选
    let filtered = timePoints

    if (filters.category_l1_id) {
      filtered = filtered.filter(tp => tp.category_l1_id === filters.category_l1_id)
    }
    if (filters.category_l2_id) {
      filtered = filtered.filter(tp => tp.category_l2_id === filters.category_l2_id)
    }
    if (filters.category_l3_id) {
      filtered = filtered.filter(tp => tp.category_l3_id === filters.category_l3_id)
    }
    if (filters.region_id) {
      filtered = filtered.filter(tp => tp.region_id === filters.region_id)
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      filtered = filtered.filter(tp => 
        (tp.note && tp.note.toLowerCase().includes(keyword)) ||
        (tp.source && tp.source.toLowerCase().includes(keyword))
      )
    }

    totalCount.value = filtered.length

    // 分页
    const start = (pagination.page - 1) * pagination.size
    const paged = filtered.slice(start, start + pagination.size)

    // 处理数据
    tableData.value = paged.map(tp => {
      const cat1 = categories.find(c => c.id === tp.category_l1_id)
      const cat2 = categories.find(c => c.id === tp.category_l2_id)
      const cat3 = tp.category_l3_id ? categories.find(c => c.id === tp.category_l3_id) : null
      const region = regions.find(r => r.id === tp.region_id)

      return {
        ...tp,
        category_path: cat3 
          ? `${cat1?.name} > ${cat2?.name} > ${cat3.name}`
          : `${cat1?.name} > ${cat2?.name}`,
        region_name: region?.name || ''
      }
    })
  } catch (error) {
    ElMessage.error('加载失败：' + error)
  } finally {
    loading.value = false
  }
}

// 筛选变化
const onL1FilterChange = async (value: number | null) => {
  filters.category_l2_id = null
  filters.category_l3_id = null
  filterLevel2Categories.value = []
  filterLevel3Categories.value = []
  
  if (value) {
    filterLevel2Categories.value = await api.categories.getByParent(value)
  }
  
  await loadData()
}

const onL2FilterChange = async (value: number | null) => {
  filters.category_l3_id = null
  filterLevel3Categories.value = []
  
  if (value) {
    filterLevel3Categories.value = await api.categories.getByParent(value)
  }
  
  await loadData()
}

const onRegionTypeFilterChange = () => {
  filters.region_id = null
  loadData()
}

const onFilterChange = () => {
  pagination.page = 1
  loadData()
}

const resetFilters = () => {
  filters.category_l1_id = null
  filters.category_l2_id = null
  filters.category_l3_id = null
  filters.region_type = null
  filters.region_id = null
  filters.year = null
  filters.keyword = ''
  filterLevel2Categories.value = []
  filterLevel3Categories.value = []
  pagination.page = 1
  loadData()
}

// 批量管理
const enterBatchMode = () => {
  batchMode.value = true
  selectedIds.value = []
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedIds.value = []
}

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(s => s.id)
}

// 编辑
const handleEdit = async (row: any) => {
  editingRow.value = row
  editForm.category_l1_id = row.category_l1_id
  editForm.category_l2_id = row.category_l2_id
  editForm.category_l3_id = row.category_l3_id
  editForm.region_id = row.region_id
  editForm.event_date = row.event_date
  editForm.end_date = row.end_date
  editForm.note = row.note
  editForm.source = row.source
  editForm.source_url = row.source_url
  // 兼容各种可能的值：1, true, "1", "true" 都视为已确认
  editForm.is_confirmed = Boolean(row.is_confirmed === 1 || row.is_confirmed === true || row.is_confirmed === '1' || row.is_confirmed === 'true')
  editForm.remind_days = row.remind_days || 0
  
  // 加载二级和三级分类
  if (row.category_l1_id) {
    editLevel2Categories.value = await api.categories.getByParent(row.category_l1_id)
  }
  if (row.category_l2_id) {
    editLevel3Categories.value = await api.categories.getByParent(row.category_l2_id)
    // 如果有三级分类，找到对应的名称
    if (row.category_l3_id) {
      const cat3 = editLevel3Categories.value.find(c => c.id === row.category_l3_id)
      editForm.category_l3_name = cat3 ? cat3.name : null
    } else {
      editForm.category_l3_name = null
    }
  }
  
  editDialogVisible.value = true
}

const onEditL1Change = async (value: number) => {
  editForm.category_l2_id = null
  editForm.category_l3_id = null
  editForm.category_l3_name = null
  editLevel2Categories.value = []
  editLevel3Categories.value = []
  
  if (value) {
    editLevel2Categories.value = await api.categories.getByParent(value)
  }
}

const onEditL2Change = async (value: number) => {
  editForm.category_l3_id = null
  editForm.category_l3_name = null
  editLevel3Categories.value = []
  
  if (value) {
    editLevel3Categories.value = await api.categories.getByParent(value)
  }
}

const handleUpdate = async () => {
  if (!editingRow.value) return
  
  try {
    updating.value = true
    
    // 处理三级分类：如果输入了名称，查找或创建分类
    let category_l3_id: number | null = null
    if (editForm.category_l3_name && editForm.category_l3_name.trim()) {
      const id = await api.categories.findOrCreate(
        editForm.category_l3_name.trim(),
        3,
        editForm.category_l2_id
      )
      category_l3_id = id as number
    }
    
    await api.timePoints.update(editingRow.value.id, {
      category_l1_id: editForm.category_l1_id!,
      category_l2_id: editForm.category_l2_id!,
      category_l3_id: category_l3_id,
      region_id: editForm.region_id!,
      event_date: editForm.event_date,
      end_date: editForm.end_date,
      year: parseInt(editForm.event_date.split('-')[0]),
      note: editForm.note || null,
      source: editForm.source || null,
      source_url: editForm.source_url || null,
      is_confirmed: editForm.is_confirmed ? 1 : 0,
      remind_days: editForm.remind_days || null
    })
    
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('更新失败：' + error)
  } finally {
    updating.value = false
  }
}

// 删除
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
.data-manage-page {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  background: #f0f2f5;
}

.filter-card {
  margin-bottom: 0;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  flex-shrink: 0;
}

.filter-card :deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 32px;
}

.filter-card :deep(.el-card__body) {
  padding: 24px 32px;
  background: #ffffff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-item {
  margin-bottom: 0 !important;
}

.filter-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.table-card {
  flex: 1;
  border-radius: 0;
  border: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 2px solid #e4e7ed;
  padding: 16px 32px;
  flex-shrink: 0;
}

.table-card :deep(.el-card__body) {
  padding: 24px 32px;
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}

.table-card :deep(.el-table) {
  font-size: 14px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-card :deep(.el-table__header) {
  font-weight: 600;
  background: #fafafa;
}

.table-card :deep(.el-table__row) {
  transition: background-color 0.2s;
}

.table-card :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.source-link {
  color: #409eff;
  text-decoration: none;
  font-size: 12px;
  cursor: pointer;
}

.source-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
