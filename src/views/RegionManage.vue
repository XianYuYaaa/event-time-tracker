<template>
  <div class="region-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <el-icon :size="18"><Location /></el-icon>
        <h1 class="page-title">区域管理</h1>
      </div>
      <div class="page-header-right">
        <el-button type="primary" size="small" @click="handleAdd">添加区域</el-button>
      </div>
    </div>

    <el-card shadow="never">

      <el-alert
        title="提示：双击区域可以编辑"
        type="info"
        :closable="false"
        show-icon
        class="mb-16"
      />

      <el-tabs v-model="activeType">
        <el-tab-pane label="全国" name="national">
          <el-table :data="nationalRegions" stripe>
            <el-table-column label="区域名称" prop="name" />
            <el-table-column label="排序" prop="sort_order" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="省份" name="province">
          <el-table :data="provinceRegions" stripe>
            <el-table-column label="区域名称" prop="name" />
            <el-table-column label="排序" prop="sort_order" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="城市" name="city">
          <el-table :data="cityRegions" stripe>
            <el-table-column label="区域名称" prop="name" />
            <el-table-column label="所属省份" prop="province" width="150" />
            <el-table-column label="排序" prop="sort_order" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 编辑/添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="区域类型" required>
          <el-radio-group v-model="form.region_type">
            <el-radio label="national">全国</el-radio>
            <el-radio label="province">省份</el-radio>
            <el-radio label="city">城市</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="区域名称" required>
          <el-input v-model="form.name" placeholder="输入区域名称" />
        </el-form-item>

        <el-form-item label="所属省份" v-if="form.region_type === 'city'">
          <el-select v-model="form.province" placeholder="选择省份" filterable class="w-100">
            <el-option v-for="p in provinces" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { Region } from '@/types'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const activeType = ref('national')
const allRegions = ref<Region[]>([])
const editingRegion = ref<Region | null>(null)

const form = reactive({
  name: '',
  region_type: 'national' as 'national' | 'province' | 'city',
  province: null as string | null,
  sort_order: 0,
  is_active: true
})

const dialogTitle = computed(() => {
  return editingRegion.value ? '编辑区域' : '添加区域'
})

const nationalRegions = computed(() => {
  return allRegions.value.filter(r => r.region_type === 'national')
})

const provinceRegions = computed(() => {
  return allRegions.value.filter(r => r.region_type === 'province')
})

const cityRegions = computed(() => {
  return allRegions.value.filter(r => r.region_type === 'city')
})

const provinces = computed(() => {
  return provinceRegions.value.map(p => p.name)
})

const loadData = async () => {
  loading.value = true
  try {
    allRegions.value = await api.regions.getAll()
  } catch (error) {
    ElMessage.error('加载失败：' + error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const handleAdd = () => {
  editingRegion.value = null
  form.name = ''
  form.region_type = activeType.value as any
  form.province = null
  form.sort_order = 0
  form.is_active = true
  dialogVisible.value = true
}

const handleEdit = (region: Region) => {
  editingRegion.value = region
  form.name = region.name
  form.region_type = region.region_type as any
  form.province = region.province
  form.sort_order = region.sort_order
  form.is_active = region.is_active === 1
  dialogVisible.value = true
}

const handleDelete = async (region: Region) => {
  try {
    await ElMessageBox.confirm(`确定要删除区域"${region.name}"吗？`, '提示', {
      type: 'warning'
    })
    
    await api.regions.delete(region.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      if (error.toString().includes('FOREIGN KEY') || error.toString().includes('787')) {
        ElMessage.error({
          message: `无法删除区域"${region.name}"，该区域已被时间节点引用。请先删除相关的时间节点数据。`,
          duration: 5000,
          showClose: true
        })
      } else {
        ElMessage.error('删除失败：' + error)
      }
    }
  }
}


const handleSave = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入区域名称')
    return
  }

  if (form.region_type === 'city' && !form.province) {
    ElMessage.warning('城市必须选择所属省份')
    return
  }

  saving.value = true
  try {
    if (editingRegion.value) {
      // 更新区域
      await api.regions.update(editingRegion.value.id, {
        name: form.name,
        region_type: form.region_type,
        province: form.province,
        sort_order: form.sort_order,
        is_active: form.is_active ? 1 : 0
      })
      ElMessage.success('更新成功')
    } else {
      // 添加区域
      await api.regions.create({
        name: form.name,
        region_type: form.region_type,
        province: form.province,
        sort_order: form.sort_order,
        is_active: form.is_active ? 1 : 0
      })
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('保存失败：' + error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.region-manage-page {
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

.region-manage-page :deep(.el-card) {
  border-radius: 0;
  border: none;
  min-height: calc(100% - 56px);
}

.region-manage-page :deep(.el-card__body) {
  padding: 32px;
  background: #f8f9fa;
}

.region-manage-page :deep(.el-tabs) {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.region-manage-page :deep(.el-table) {
  background: #ffffff;
  border-radius: 8px;
}
</style>
