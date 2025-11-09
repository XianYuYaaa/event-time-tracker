<template>
  <div class="category-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <el-icon :size="18"><Folder /></el-icon>
        <h1 class="page-title">分类管理</h1>
      </div>
      <div class="page-header-right">
        <el-button v-if="!batchMode" type="primary" size="small" @click="handleAdd">添加一级分类</el-button>
        <el-button v-if="!batchMode" size="small" @click="batchMode = true">批量管理</el-button>
        <template v-else>
          <el-button type="danger" size="small" :disabled="selectedNodes.length === 0" @click="handleBatchDelete">
            删除选中 ({{ selectedNodes.length }})
          </el-button>
          <el-button size="small" @click="exitBatchMode">退出批量</el-button>
        </template>
      </div>
    </div>

    <el-card shadow="never">

      <el-alert
        title="提示：双击分类可以编辑，点击展开可查看下级分类"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        :default-expand-all="false"
        :show-checkbox="batchMode"
        @node-click="handleNodeClick"
        @node-expand="handleNodeExpand"
        @check-change="handleCheckChange"
        v-loading="loading"
      >
        <template #default="{ data }">
          <div class="custom-tree-node" @dblclick="handleEdit(data)">
            <span class="node-label">
              <span>{{ data.name }}</span>
              <el-tag size="small" style="margin-left: 8px">{{ getLevelText(data.level) }}</el-tag>
            </span>
            <span class="node-actions" v-if="!batchMode">
              <el-button link type="primary" size="small" @click.stop="handleAddChild(data)" v-if="data.level < 3">
                添加子分类
              </el-button>
              <el-button link type="primary" size="small" @click.stop="handleEdit(data)">
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click.stop="handleDeleteSingle(data)">
                删除
              </el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 编辑/添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="hasChildren ? '700px' : '500px'"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="父级分类" v-if="form.parent_id">
          <el-input :value="parentCategoryName" disabled />
        </el-form-item>

        <el-form-item label="分类名称" required>
          <el-input
            v-if="editingCategory"
            v-model="form.name"
            placeholder="输入分类名称"
          />
          <el-input
            v-else
            v-model="form.name"
            type="textarea"
            :rows="5"
            placeholder="输入分类名称，支持一行一个，批量添加"
          />
        </el-form-item>

        <el-form-item label="排序" v-if="editingCategory">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>

        <!-- 子分类批量编辑区域 -->
        <el-divider v-if="hasChildren" content-position="left">
          <el-text type="primary">{{ childrenLevelText }}{{ childrenCount > 0 ? `（当前 ${childrenCount} 个）` : '（可添加）' }}</el-text>
        </el-divider>
        
        <el-form-item v-if="hasChildren" label="子分类列表">
          <el-input
            v-model="childrenText"
            type="textarea"
            :rows="8"
            :placeholder="childrenCount > 0 ? '每行一个子分类名称，保存时会更新所有子分类' : '每行一个子分类名称，可批量添加多个子分类'"
          />
          <el-text type="info" size="small" style="margin-top: 8px; display: block;">
            提示：一行一个，修改、删除行或添加新行都会生效。删除某行即删除该子分类。
          </el-text>
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
import { Folder } from '@element-plus/icons-vue'
import { api, Category } from '@/api'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const allCategories = ref<Category[]>([])
const editingCategory = ref<Category | null>(null)
const batchMode = ref(false)
const selectedNodes = ref<any[]>([])
const treeRef = ref()
const childrenCategories = ref<Category[]>([])
const childrenText = ref('')

const form = reactive({
  name: '',
  level: 1,
  parent_id: null as number | null,
  sort_order: 0
})

const hasChildren = computed(() => {
  return editingCategory.value && editingCategory.value.level < 3
})

const childrenCount = computed(() => childrenCategories.value.length)

const childrenLevelText = computed(() => {
  if (!editingCategory.value) return ''
  return getLevelText(editingCategory.value.level + 1) + '分类'
})

const dialogTitle = computed(() => {
  if (editingCategory.value) {
    return `编辑${getLevelText(editingCategory.value.level)}分类`
  }
  return form.parent_id ? `添加${getLevelText(form.level)}分类` : '添加一级分类'
})

const parentCategoryName = computed(() => {
  if (!form.parent_id) return ''
  const parent = allCategories.value.find(c => c.id === form.parent_id)
  return parent ? parent.name : ''
})

const treeData = computed(() => {
  const level1 = allCategories.value.filter(c => c.level === 1)
  return level1.map(l1 => ({
    ...l1,
    children: getChildren(l1.id)
  }))
})

const getChildren = (parentId: number): any[] => {
  const children = allCategories.value.filter(c => c.parent_id === parentId)
  return children.map(child => ({
    ...child,
    children: getChildren(child.id)
  }))
}

const getLevelText = (level: number) => {
  const map: Record<number, string> = {
    1: '一级',
    2: '二级',
    3: '三级'
  }
  return map[level] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    allCategories.value = await api.categories.getAll()
  } catch (error) {
    ElMessage.error('加载失败：' + error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const handleAdd = () => {
  editingCategory.value = null
  form.name = ''
  form.level = 1
  form.parent_id = null
  // 计算同级别分类的最大sort_order
  const sameLevelCategories = allCategories.value.filter(c => c.level === 1 && c.parent_id === null)
  const maxSortOrder = sameLevelCategories.length > 0 ? Math.max(...sameLevelCategories.map(c => c.sort_order)) : -1
  form.sort_order = maxSortOrder + 1
  dialogVisible.value = true
}

const handleAddChild = (data: Category) => {
  editingCategory.value = null
  form.name = ''
  form.level = data.level + 1
  form.parent_id = data.id
  // 计算同级别分类的最大sort_order
  const sameLevelCategories = allCategories.value.filter(c => c.level === data.level + 1 && c.parent_id === data.id)
  const maxSortOrder = sameLevelCategories.length > 0 ? Math.max(...sameLevelCategories.map(c => c.sort_order)) : -1
  form.sort_order = maxSortOrder + 1
  dialogVisible.value = true
}

const handleEdit = (data: Category) => {
  editingCategory.value = data
  form.name = data.name
  form.level = data.level
  form.parent_id = data.parent_id
  form.sort_order = data.sort_order
  
  // 加载子分类（如果是一级或二级分类）
  if (data.level < 3) {
    childrenCategories.value = allCategories.value
      .filter(c => c.parent_id === data.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    childrenText.value = childrenCategories.value.map(c => c.name).join('\n')
  } else {
    childrenCategories.value = []
    childrenText.value = ''
  }
  
  dialogVisible.value = true
}

const handleNodeClick = (_data: Category) => {
  // 单击节点时不做任何操作，只是为了满足属性要求
}

const handleNodeExpand = async (_data: Category) => {
  // 展开节点时可以在这里添加懒加载逻辑
}

const handleCheckChange = () => {
  if (treeRef.value) {
    selectedNodes.value = treeRef.value.getCheckedNodes()
  }
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedNodes.value = []
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([])
  }
}

const handleDeleteSingle = async (data: Category) => {
  try {
    await ElMessageBox.confirm(`确定要删除“${data.name}”吗？如果有子分类，也会被一起删除。`, '删除确认', {
      type: 'warning'
    })
    
    await api.categories.delete(data.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      if (error.toString().includes('FOREIGN KEY') || error.toString().includes('787')) {
        ElMessage.error({
          message: `无法删除“${data.name}”，该分类已被时间节点引用。请先删除相关的时间节点数据。`,
          duration: 5000,
          showClose: true
        })
      } else {
        ElMessage.error('删除失败：' + error)
      }
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedNodes.value.length} 个分类吗？如果有子分类，也会被一起删除。`, '批量删除', {
      type: 'warning'
    })
    
    let successCount = 0
    const failedDeletes: string[] = []
    
    for (const node of selectedNodes.value) {
      try {
        await api.categories.delete(node.id)
        successCount++
      } catch (error: any) {
        if (error.toString().includes('FOREIGN KEY') || error.toString().includes('787')) {
          failedDeletes.push(node.name)
        } else {
          throw error
        }
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`已删除 ${successCount} 个分类`)
    }
    
    if (failedDeletes.length > 0) {
      ElMessage.warning({
        message: `以下分类无法删除（已被时间节点引用）：${failedDeletes.join('、')}。请先删除相关的时间节点数据。`,
        duration: 5000,
        showClose: true
      })
    }
    
    exitBatchMode()
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + error)
    }
  }
}


const handleSave = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  saving.value = true
  try {
    if (editingCategory.value) {
      // 更新分类
      await api.categories.update(editingCategory.value.id, {
        name: form.name,
        sort_order: form.sort_order
      })
      
      // 处理子分类的批量更新
      if (editingCategory.value.level < 3) {
        // 自动过滤空行
        const newChildrenNames = childrenText.value
          .split('\n')
          .map(n => n.trim())
          .filter(n => n.length > 0)  // 过滤空行
        
        const oldChildren = childrenCategories.value
        const childLevel = editingCategory.value.level + 1
        
        // 删除已移除的子分类（带引用检查）
        const failedDeletes: string[] = []
        for (const oldChild of oldChildren) {
          if (!newChildrenNames.includes(oldChild.name)) {
            try {
              await api.categories.delete(oldChild.id)
            } catch (error: any) {
              // 如果是外键约束错误，记录下来
              if (error.toString().includes('FOREIGN KEY') || error.toString().includes('787')) {
                failedDeletes.push(oldChild.name)
              } else {
                throw error  // 其他错误直接抛出
              }
            }
          }
        }
        
        // 如果有删除失败的，给出提示
        if (failedDeletes.length > 0) {
          ElMessage.warning({
            message: `以下分类无法删除（已被时间节点引用）：${failedDeletes.join('、')}。请先删除相关的时间节点数据。`,
            duration: 5000,
            showClose: true
          })
        }
        
        // 更新或新增子分类
        for (let i = 0; i < newChildrenNames.length; i++) {
          const name = newChildrenNames[i]
          const existingChild = oldChildren.find(c => c.name === name)
          
          if (existingChild) {
            // 更新排序
            if (existingChild.sort_order !== i) {
              await api.categories.update(existingChild.id, {
                sort_order: i
              })
            }
          } else {
            // 新增子分类
            await api.categories.create({
              name: name,
              level: childLevel,
              parent_id: editingCategory.value.id,
              sort_order: i
            })
          }
        }
      }
      
      ElMessage.success('更新成功')
    } else {
      // 批量添加分类（自动过滤空行）
      const names = form.name
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0)  // 过滤空行
      
      if (names.length === 0) {
        ElMessage.warning('请输入至少一个分类名称')
        return
      }
      
      let successCount = 0
      for (let i = 0; i < names.length; i++) {
        try {
          await api.categories.create({
            name: names[i],
            level: form.level,
            parent_id: form.parent_id,
            sort_order: form.sort_order + i
          })
          successCount++
        } catch (error) {
          console.error(`添加 "${names[i]}" 失败:`, error)
        }
      }
      
      if (successCount > 0) {
        ElMessage.success(`成功添加 ${successCount} 个分类`)
      } else {
        ElMessage.error('所有分类添加失败')
      }
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
.category-manage-page {
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

.category-manage-page :deep(.el-card) {
  border-radius: 0;
  border: none;
  min-height: calc(100% - 56px);
}

.category-manage-page :deep(.el-card__body) {
  padding: 32px;
  background: #f8f9fa;
}

.category-manage-page :deep(.el-tree) {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 12px;
  min-height: 36px;
}

.node-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 8px;
}
</style>
