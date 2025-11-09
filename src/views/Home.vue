<template>
  <div class="home-page">
    <el-card class="form-card">
      <template #header>
        <div class="page-header">
          <div class="page-header-left">
            <el-icon :size="18"><Edit /></el-icon>
            <h1 class="page-title">添加时间节点</h1>
          </div>
          <div class="page-header-right">
            <div class="shortcut-hint">
              <span class="shortcut-key">Ctrl+Enter</span>
              <span class="shortcut-label">保存</span>
            </div>
            <div class="shortcut-hint">
              <span class="shortcut-key">Esc</span>
              <span class="shortcut-label">重置</span>
            </div>
            <el-button-group size="small">
              <el-button 
                :type="addMode === 'single' ? 'primary' : 'default'"
                @click="addMode = 'single'"
              >
                <el-icon><Document /></el-icon>
                <span>单条</span>
              </el-button>
              <el-button 
                :type="addMode === 'batch' ? 'primary' : 'default'"
                @click="addMode = 'batch'"
              >
                <el-icon><CopyDocument /></el-icon>
                <span>批量</span>
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        label-position="right"
        class="optimized-form"
      >
        <!-- 分类信息 -->
        <!-- 分类信息 - 一行展示 -->
        <el-form-item label="分类" required>
          <el-row :gutter="12" style="width: 100%">
            <el-col :span="8">
              <el-select
                v-model="form.category_l1_id"
                placeholder="一级分类"
                @change="onLevel1Change"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in level1Categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
                <el-option :value="-1" label="新增分类" style="color: #409eff; font-weight: bold;" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="form.category_l2_id"
                placeholder="二级分类"
                :disabled="!form.category_l1_id || form.category_l1_id === -1"
                @change="onLevel2Change"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in level2Categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
                <el-option v-if="form.category_l1_id && form.category_l1_id !== -1" :value="-1" label="新增分类" style="color: #409eff; font-weight: bold;" />
              </el-select>
            </el-col>
            <el-col :span="8" v-if="addMode === 'single'">
              <el-select
                v-model="form.category_l3_name"
                placeholder="三级分类（可选，输入可筛选或新建）"
                :disabled="!form.category_l2_id || form.category_l2_id === -1"
                filterable
                allow-create
                default-first-option
                clearable
                style="width: 100%"
                @change="handleCategory3Change"
              >
                <el-option
                  v-for="cat in level3Categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.name"
                />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 区域信息 -->
        <el-form-item label="区域类型" required>
          <el-radio-group v-model="regionType" @change="onRegionTypeChange">
            <el-radio label="national">全国</el-radio>
            <el-radio label="province">省份</el-radio>
            <el-radio label="city">城市</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="选择区域" prop="region_id" v-if="regionType !== 'national'">
          <el-select
            v-model="form.region_id"
            :placeholder="`选择${regionTypeText}`"
            @change="onRegionChange"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="region in filteredRegions"
              :key="region.id"
              :label="region.name"
              :value="region.id"
            />
          </el-select>
        </el-form-item>

        <!-- 单条模式的日期信息 -->
        <el-form-item v-if="addMode === 'single'" label="日期范围" prop="event_date" required>
          <el-row :gutter="12" style="width: 100%">
            <el-col :span="12">
              <el-date-picker
                v-model="form.event_date"
                type="date"
                placeholder="开始日期（必填）"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="onDateChange"
              />
            </el-col>
            <el-col :span="12">
              <el-date-picker
                v-model="form.end_date"
                type="date"
                placeholder="结束日期（可选）"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 批量模式的数据项列表 -->
        <el-form-item v-if="addMode === 'batch'" label="批量数据" required>
          <div class="batch-items-container">
            <div class="batch-header">
              <div class="batch-info">
                <span class="batch-count">已添加 {{ batchItems.length }} 条数据</span>
              </div>
              <div class="batch-header-actions">
                <el-upload
                  accept=".xlsx,.xls,.csv"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleFileImport"
                  style="display: inline-block;"
                >
                  <el-button :icon="Upload" size="small">导入Excel/CSV</el-button>
                </el-upload>
                <el-button :icon="Download" size="small" @click="downloadTemplate">下载模板</el-button>
              </div>
            </div>
            
            <div class="batch-table">
              <div class="batch-table-header">
                <div class="batch-col batch-col-index">#</div>
                <div class="batch-col batch-col-category">三级分类</div>
                <div class="batch-col batch-col-date">开始日期</div>
                <div class="batch-col batch-col-date">结束日期</div>
                <div class="batch-col batch-col-note">备注</div>
                <div class="batch-col batch-col-action">操作</div>
              </div>
              <div 
                v-for="(item, index) in batchItems" 
                :key="index" 
                class="batch-table-row"
              >
                <div class="batch-col batch-col-index">
                  <span class="batch-index">{{ index + 1 }}</span>
                </div>
                <div class="batch-col batch-col-category">
                  <el-select
                    v-model="item.category_l3_name"
                    placeholder="可选"
                    filterable
                    allow-create
                    default-first-option
                    clearable
                    size="small"
                  >
                    <el-option
                      v-for="cat in level3Categories"
                      :key="cat.id"
                      :label="cat.name"
                      :value="cat.name"
                    />
                  </el-select>
                </div>
                <div class="batch-col batch-col-date">
                  <el-date-picker
                    v-model="item.event_date"
                    type="date"
                    placeholder="必填"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    size="small"
                  />
                </div>
                <div class="batch-col batch-col-date">
                  <el-date-picker
                    v-model="item.end_date"
                    type="date"
                    placeholder="可选"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    size="small"
                  />
                </div>
                <div class="batch-col batch-col-note">
                  <el-input v-model="item.note" placeholder="可选" clearable size="small" />
                </div>
                <div class="batch-col batch-col-action">
                  <el-button type="danger" link @click="removeBatchItem(index)" size="small" :icon="Delete">删除</el-button>
                </div>
              </div>
            </div>
            
            <div class="batch-actions">
              <el-button type="primary" @click="addBatchItem" :icon="Plus">添加数据项</el-button>
            </div>
          </div>
        </el-form-item>

        <!-- 详细信息（仅单条模式） -->
        <el-form-item v-if="addMode === 'single'" label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="输入备注信息（可选）"
          />
        </el-form-item>

        <el-form-item label="信息来源">
          <el-row :gutter="12" style="width: 100%">
            <el-col :span="12">
              <el-input
                v-model="form.source"
                placeholder="来源名称（可选）"
              />
            </el-col>
            <el-col :span="12">
              <el-input
                v-model="form.source_url"
                placeholder="来源链接（可选）"
              />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="提前提醒">
          <el-input-number
            v-model="form.remind_days"
            :min="0"
            :max="365"
            placeholder="天数"
            style="width: 180px;"
          />
          <span style="margin-left: 8px; color: #909399; font-size: 13px;">提前多少天提醒（0表示不提醒）</span>
        </el-form-item>

        <el-form-item label=" ">
          <el-checkbox v-model="form.is_confirmed">
            确认信息准确无误
          </el-checkbox>
        </el-form-item>

        <el-divider />

        <!-- 操作按钮区 -->
        <div class="form-actions">
          <el-space size="large">
            <el-button size="large" @click="resetForm" :icon="Refresh">重置表单</el-button>
            <el-button size="large" type="primary" @click="handleSubmit" :loading="submitting" :icon="Check">保存记录</el-button>
          </el-space>
        </div>

        <!-- 已添加的同分类数据折叠面板 -->
        <el-collapse v-if="existingData.length > 0" v-model="collapseActive" class="existing-data-collapse">
          <el-collapse-item name="existing">
            <template #title>
              <div class="collapse-title">
                <el-icon><InfoFilled /></el-icon>
                <span>已添加的同分类数据（共 {{ existingData.length }} 条）- 避免重复添加</span>
              </div>
            </template>
            <el-table :data="existingData" stripe :max-height="Math.min(existingData.length * 50 + 60, 400)" size="small">
              <el-table-column label="日期" width="100">
                <template #default="{ row }">
                  {{ row.event_date }}
                </template>
              </el-table-column>
              <el-table-column label="区域" width="90" prop="region_name" />
              <el-table-column label="分类" min-width="180" prop="category_path" show-overflow-tooltip />
              <el-table-column label="备注" min-width="150" prop="note" show-overflow-tooltip />
              <el-table-column label="状态" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.is_confirmed" type="success" size="small">已确认</el-tag>
                  <el-tag v-else type="info" size="small">未确认</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </el-card>

    <!-- 新增分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogTitle"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="分类名称">
          <el-input
            v-model="newCategoryName"
            placeholder="请输入分类名称"
            @keyup.enter="handleSaveCategory"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory" :loading="savingCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { InfoFilled, Edit, Refresh, Check, Plus, Delete, Upload, Download, Document, CopyDocument } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { api, Category, Region } from '@/api'
import { useFormStateStore } from '@/stores'

// 添加模式
const addMode = ref<'single' | 'batch'>('single')

// 监听模式切换
watch(addMode, (newMode) => {
  if (newMode === 'batch' && batchItems.value.length === 0) {
    // 切换到批量模式时，如果没有数据项，自动添加一行
    addBatchItem()
  }
})

// 批量添加数据项
interface BatchItem {
  category_l3_name: string | null
  event_date: string
  end_date: string | null
  note: string | null
}

const batchItems = ref<BatchItem[]>([])

// 表单引用
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 分类数据
const level1Categories = ref<Category[]>([])
const level2Categories = ref<Category[]>([])
const level3Categories = ref<Category[]>([])

// 已有的同分类数据
const existingData = ref<any[]>([])
const collapseActive = ref<string[]>(['existing']) // 默认展开折叠面板

// 是否正在恢复表单状态的标志
let isRestoringForm = false

// 新增分类对话框
const categoryDialogVisible = ref(false)
const newCategoryName = ref('')
const savingCategory = ref(false)
const newCategoryLevel = ref(1)
const newCategoryParentId = ref<number | null>(null)

const categoryDialogTitle = computed(() => {
  const levelMap = { 1: '一级', 2: '二级', 3: '三级' }
  return `新增${levelMap[newCategoryLevel.value as 1 | 2 | 3]}分类`
})

// 区域数据
const regionType = ref<'national' | 'province' | 'city'>('national')
const allRegions = ref<Region[]>([])

// 表单状态store
const formStateStore = useFormStateStore()

// 表单数据
interface FormData {
  category_l1_id: number | null
  category_l2_id: number | null
  category_l3_id: number | null
  category_l3_name: string | null  // 三级分类名称（自由输入）
  region_id: number | null
  event_date: string
  end_date: string | null
  year: number
  note: string | null
  source: string | null
  source_url: string | null
  is_confirmed: number
  remind_days: number | null
}

const form = reactive<FormData>({
  category_l1_id: null,
  category_l2_id: null,
  category_l3_id: null,
  category_l3_name: null,
  region_id: null,
  event_date: '',
  end_date: null,
  year: new Date().getFullYear(),
  note: null,
  source: null,
  source_url: null,
  is_confirmed: 0,
  remind_days: 0,
})

// 数据缓存
let allTimePointsCache: any[] = []
let allCategoriesCache: any[] = []
let allRegionsCache: any[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 60000 // 缓存1分钟

// 加载已有同分类数据（带缓存和防抖）
let loadExistingDataTimer: any = null
const loadExistingData = async () => {
  // 清除之前的定时器
  if (loadExistingDataTimer) {
    clearTimeout(loadExistingDataTimer)
  }

  // 使用防抖，300ms后执行
  loadExistingDataTimer = setTimeout(async () => {
    // 至少要选择二级分类和区域才显示
    if (!form.category_l1_id || !form.category_l2_id || !form.region_id) {
      existingData.value = []
      return
    }

    try {
      const now = Date.now()
      
      // 检查缓存是否有效
      if (now - cacheTimestamp > CACHE_DURATION || allTimePointsCache.length === 0) {
        // 缓存过期或不存在，重新加载
        const [timePoints, categories, regions] = await Promise.all([
          api.timePoints.getList(1000, 0),
          api.categories.getAll(),
          api.regions.getAll()
        ])
        
        allTimePointsCache = timePoints
        allCategoriesCache = categories
        allRegionsCache = regions
        cacheTimestamp = now
      }

      // 使用缓存数据筛选
      let filtered = allTimePointsCache.filter(tp => {
        if (tp.category_l1_id !== form.category_l1_id) return false
        if (tp.category_l2_id !== form.category_l2_id) return false
        // 如果选择了三级分类，则匹配三级分类
        if (form.category_l3_id && tp.category_l3_id !== form.category_l3_id) return false
        // 区域必须匹配
        if (tp.region_id !== form.region_id) return false
        return true
      })

      // 处理数据
      existingData.value = filtered.map(tp => {
        const cat1 = allCategoriesCache.find(c => c.id === tp.category_l1_id)
        const cat2 = allCategoriesCache.find(c => c.id === tp.category_l2_id)
        const cat3 = tp.category_l3_id ? allCategoriesCache.find(c => c.id === tp.category_l3_id) : null
        const region = allRegionsCache.find(r => r.id === tp.region_id)

        return {
          ...tp,
          category_path: cat3 
            ? `${cat1?.name} > ${cat2?.name} > ${cat3.name}`
            : `${cat1?.name} > ${cat2?.name}`,
          region_name: region?.name || ''
        }
      }).sort((a, b) => {
        // 按日期降序排列
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      })
    } catch (error) {
      console.error('加载已有数据失败：', error)
    }
  }, 300)
}

// 清除缓存的函数，在保存新数据后调用
const clearDataCache = () => {
  cacheTimestamp = 0
  allTimePointsCache = []
}

// 监听表单变化并保存到store，同时加载已有数据
watch([
  () => form.category_l1_id,
  () => form.category_l2_id,
  () => form.category_l3_id,
  () => form.region_id,
  () => regionType.value
], () => {
  // 如果正在恢复表单状态，不保存到store，避免保存中间状态
  if (!isRestoringForm) {
    formStateStore.saveFormState({
      category_l1_id: form.category_l1_id,
      category_l2_id: form.category_l2_id,
      category_l3_id: form.category_l3_id,
      region_id: form.region_id,
      regionType: regionType.value
    })
  }
  
  // 加载已有同分类数据
  loadExistingData()
})

// 表单验证规则
const validateRequired = (message: string) => {
  return (_rule: any, value: any, callback: any) => {
    if (value === null || value === undefined || value === '') {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

const rules = reactive<FormRules>({
  category_l1_id: [
    { required: true, validator: validateRequired('请选择一级分类'), trigger: 'change' }
  ],
  category_l2_id: [
    { required: true, validator: validateRequired('请选择二级分类'), trigger: 'change' }
  ],
  // 三级分类为可选
  region_id: [
    { required: true, validator: validateRequired('请选择区域'), trigger: 'change' }
  ],
  event_date: [
    { required: true, validator: validateRequired('请选择开始日期'), trigger: 'change' }
  ],
})

// 计算属性
const filteredRegions = computed(() => {
  return allRegions.value.filter(r => r.region_type === regionType.value)
})

const regionTypeText = computed(() => {
  const map = {
    national: '全国',
    province: '省份',
    city: '城市'
  }
  return map[regionType.value]
})

// 加载数据
onMounted(async () => {
  try {
    // 加载一级分类
    level1Categories.value = await api.categories.getByLevel(1)
    
    // 加载所有区域
    allRegions.value = await api.regions.getAll()
    
    // 从store恢复表单状态
    isRestoringForm = true // 设置恢复标志，阻止watch保存中间状态
    
    // 恢复分类
    if (formStateStore.category_l1_id) {
      form.category_l1_id = formStateStore.category_l1_id
      level2Categories.value = await api.categories.getByParent(formStateStore.category_l1_id)
      
      // 使用nextTick确保DOM更新完成
      await nextTick()
      
      if (formStateStore.category_l2_id && level2Categories.value.length > 0) {
        form.category_l2_id = formStateStore.category_l2_id
        level3Categories.value = await api.categories.getByParent(formStateStore.category_l2_id)
        
        await nextTick()
        
        if (formStateStore.category_l3_id && level3Categories.value.length > 0) {
          form.category_l3_id = formStateStore.category_l3_id
        }
      }
    }
    
    // 恢复区域
    if (formStateStore.regionType) {
      regionType.value = formStateStore.regionType
    }
    
    if (formStateStore.region_id) {
      form.region_id = formStateStore.region_id
    } else {
      // 如果没有保存的区域，默认选择全国
      const nationalRegion = allRegions.value.find(r => r.region_type === 'national')
      if (nationalRegion) {
        form.region_id = nationalRegion.id
      }
    }
    
    isRestoringForm = false // 恢复完成，清除标志
    
    // 恢复完成后，立即保存一次完整状态到store，确保下次能正确恢复
    await nextTick()
    formStateStore.saveFormState({
      category_l1_id: form.category_l1_id,
      category_l2_id: form.category_l2_id,
      category_l3_id: form.category_l3_id,
      region_id: form.region_id,
      regionType: regionType.value
    })
    
    // 初始加载已有数据
    await loadExistingData()
  } catch (error) {
    ElMessage.error('加载数据失败：' + error)
  }
})

// 分类变化处理
const onLevel1Change = async (value: number) => {
  if (value === -1) {
    // 新增一级分类
    newCategoryLevel.value = 1
    newCategoryParentId.value = null
    newCategoryName.value = ''
    categoryDialogVisible.value = true
    form.category_l1_id = null as any
    return
  }
  
  // 如果正在恢复表单状态，不清空下级分类
  if (!isRestoringForm) {
    form.category_l2_id = null as any
    form.category_l3_id = null as any
    level2Categories.value = []
    level3Categories.value = []
  }
  
  if (value) {
    try {
      level2Categories.value = await api.categories.getByParent(value)
    } catch (error) {
      ElMessage.error('加载二级分类失败')
    }
  }
}

const onLevel2Change = async (value: number) => {
  if (value === -1) {
    // 新增二级分类
    newCategoryLevel.value = 2
    newCategoryParentId.value = form.category_l1_id
    newCategoryName.value = ''
    categoryDialogVisible.value = true
    form.category_l2_id = null as any
    return
  }
  
  // 如果正在恢复表单状态，不清空下级分类
  if (!isRestoringForm) {
    form.category_l3_id = null as any
    form.category_l3_name = null
    level3Categories.value = []
  }
  
  if (value) {
    try {
      level3Categories.value = await api.categories.getByParent(value)
    } catch (error) {
      ElMessage.error('加载三级分类失败')
    }
  }
}

// 批量添加相关函数
const addBatchItem = () => {
  batchItems.value.push({
    category_l3_name: null,
    event_date: '',
    end_date: null,
    note: null
  })
}

const removeBatchItem = (index: number) => {
  batchItems.value.splice(index, 1)
}

// 三级分类变更时检查是否为新分类
const handleCategory3Change = (value: string) => {
  if (!value) return
  
  const exists = level3Categories.value.find(c => c.name === value)
  if (!exists) {
    ElMessage.info({
      message: `将自动创建新分类："${value}"`,
      duration: 2000,
      showClose: true
    })
  }
}

// 日期格式标准化：支持 2024-10-01、2024.10.1、2024.10.1 15:00 等格式
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return ''
  
  // 移除时间部分（如果有）
  const dateOnly = String(dateStr).split(' ')[0]
  
  // 替换 . 为 -
  let normalized = dateOnly.replace(/\./g, '-')
  
  // 分割日期部分
  const parts = normalized.split('-')
  if (parts.length !== 3) return dateStr
  
  // 补齐月份和日期的前导零
  const year = parts[0]
  const month = parts[1].padStart(2, '0')
  const day = parts[2].padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Excel/CSV导入
const handleFileImport = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      
      // 解析数据
      const imported: BatchItem[] = []
      for (const row of jsonData as any[]) {
        imported.push({
          category_l3_name: row['三级分类'] || null,
          event_date: normalizeDate(row['开始日期'] || ''),
          end_date: row['结束日期'] ? normalizeDate(row['结束日期']) : null,
          note: row['备注'] || null
        })
      }
      
      if (imported.length > 0) {
        batchItems.value.push(...imported)
        ElMessage.success(`成功导入 ${imported.length} 条数据`)
      } else {
        ElMessage.warning('文件中没有有效数据')
      }
    } catch (error) {
      ElMessage.error('导入失败：' + error)
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

// 下载模板
const downloadTemplate = () => {
  const template = [
    {
      '三级分类': '示例分类',
      '开始日期': '2024-01-01',
      '结束日期': '2024-01-31',
      '备注': '示例备注'
    }
  ]
  
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '批量数据')
  XLSX.writeFile(wb, '批量添加模板.xlsx')
  ElMessage.success('模板下载成功')
}

// 保存新增分类
const handleSaveCategory = async () => {
  if (!newCategoryName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  savingCategory.value = true
  try {
    // 计算同级别分类的最大sort_order
    let allCategories: Category[] = []
    if (newCategoryLevel.value === 1) {
      allCategories = level1Categories.value
    } else if (newCategoryLevel.value === 2) {
      allCategories = level2Categories.value
    } else {
      allCategories = level3Categories.value
    }
    const maxSortOrder = allCategories.length > 0 ? Math.max(...allCategories.map(c => c.sort_order)) : -1
    
    const newCategoryId = await api.categories.create({
      name: newCategoryName.value.trim(),
      level: newCategoryLevel.value,
      parent_id: newCategoryParentId.value,
      sort_order: maxSortOrder + 1
    })
    
    ElMessage.success('分类创建成功')
    
    // 刷新对应级别的分类列表并自动选中新创建的分类
    if (newCategoryLevel.value === 1) {
      level1Categories.value = await api.categories.getByLevel(1)
      form.category_l1_id = newCategoryId as number
      // 触发一级分类变化，加载二级分类
      await onLevel1Change(newCategoryId as number)
    } else if (newCategoryLevel.value === 2) {
      level2Categories.value = await api.categories.getByParent(form.category_l1_id!)
      form.category_l2_id = newCategoryId as number
      // 触发二级分类变化，加载三级分类
      await onLevel2Change(newCategoryId as number)
    } else {
      level3Categories.value = await api.categories.getByParent(form.category_l2_id!)
      form.category_l3_id = newCategoryId as number
    }
    
    categoryDialogVisible.value = false
  } catch (error) {
    ElMessage.error('创建分类失败：' + error)
  } finally {
    savingCategory.value = false
  }
}

// 区域类型变化
const onRegionTypeChange = () => {
  if (regionType.value === 'national') {
    // 全国时自动选择全国选项
    const nationalRegion = allRegions.value.find(r => r.region_type === 'national')
    form.region_id = nationalRegion ? nationalRegion.id : null as any
  } else {
    form.region_id = null as any
  }
}

const onRegionChange = () => {
  // 可以在这里添加额外逻辑
}

// 日期变化
const onDateChange = (value: string) => {
  if (value) {
    form.year = parseInt(value.split('-')[0])
  }
}

// 提交表单
const handleSubmit = async () => {
  if (addMode.value === 'single') {
    await handleSingleSubmit()
  } else {
    await handleBatchSubmit()
  }
}

// 单条提交
const handleSingleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        
        // 处理三级分类：如果输入了名称，查找或创建分类
        let category_l3_id: number | null = null
        if (form.category_l3_name && form.category_l3_name.trim()) {
          const id = await api.categories.findOrCreate(
            form.category_l3_name.trim(),
            3,
            form.category_l2_id
          )
          category_l3_id = id as number
        }
        
        const data = {
          category_l1_id: form.category_l1_id!,
          category_l2_id: form.category_l2_id!,
          category_l3_id: category_l3_id,
          region_id: form.region_id!,
          event_date: form.event_date,
          end_date: form.end_date || null,
          year: form.year,
          note: form.note || null,
          source: form.source || null,
          source_url: form.source_url || null,
          is_confirmed: form.is_confirmed ? 1 : 0,
          remind_days: form.remind_days || null,
        }
        
        await api.timePoints.create(data)
        
        ElMessage.success('保存成功！')
        
        // 清除缓存并刷新已有数据列表
        clearDataCache()
        await loadExistingData()
        
        // 保存并继续：只清空部分字段
        form.event_date = ''
        form.end_date = null
        form.category_l3_name = null
        form.note = null
        form.source = null
        form.source_url = null
        form.is_confirmed = 0
        form.remind_days = 0
      } catch (error) {
        ElMessage.error('保存失败：' + error)
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 批量提交
const handleBatchSubmit = async () => {
  // 验证必填字段
  if (!form.category_l1_id || !form.category_l2_id || !form.region_id) {
    ElMessage.warning('请选择一级分类、二级分类和区域')
    return
  }
  
  if (batchItems.value.length === 0) {
    ElMessage.warning('请至少添加一条数据')
    return
  }
  
  // 验证每个数据项的开始日期
  const invalidItems = batchItems.value.filter(item => !item.event_date)
  if (invalidItems.length > 0) {
    ElMessage.warning('请为所有数据项填写开始日期')
    return
  }
  
  try {
    submitting.value = true
    
    // 准备批量数据
    const dataList: any[] = []
    for (const item of batchItems.value) {
      // 处理三级分类
      let category_l3_id: number | null = null
      if (item.category_l3_name && item.category_l3_name.trim()) {
        const id = await api.categories.findOrCreate(
          item.category_l3_name.trim(),
          3,
          form.category_l2_id
        )
        category_l3_id = id as number
      }
      
      const year = parseInt(item.event_date.split('-')[0])
      dataList.push({
        category_l1_id: form.category_l1_id!,
        category_l2_id: form.category_l2_id!,
        category_l3_id: category_l3_id,
        region_id: form.region_id!,
        event_date: item.event_date,
        end_date: item.end_date || null,
        year: year,
        note: item.note || null,
        source: form.source || null,
        source_url: form.source_url || null,
        is_confirmed: form.is_confirmed ? 1 : 0,
        remind_days: form.remind_days || null,
      })
    }
    
    // 批量创建
    await api.timePoints.batchCreate(dataList)
    
    ElMessage.success(`成功保存 ${dataList.length} 条记录！`)
    
    // 清除缓存并刷新已有数据列表
    clearDataCache()
    await loadExistingData()
    
    // 清空批量数据
    batchItems.value = []
  } catch (error) {
    ElMessage.error('批量保存失败：' + error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.category_l1_id = null
  form.category_l2_id = null
  form.category_l3_id = null
  form.category_l3_name = null
  form.region_id = null
  form.event_date = ''
  form.end_date = null
  form.note = null
  form.source = null
  form.source_url = null
  form.is_confirmed = 0
  form.remind_days = 0
  level2Categories.value = []
  level3Categories.value = []
  regionType.value = 'national'
  batchItems.value = []
  
  // 重新加载一级分类和全国区域
  const nationalRegion = allRegions.value.find(r => r.region_type === 'national')
  if (nationalRegion) {
    form.region_id = nationalRegion.id
  }
}

// 快捷键支持
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      resetForm()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  return () => {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.home-page {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  background: #f0f2f5;
}

.form-card {
  margin-bottom: 0;
  border-radius: 0;
  border: none;
  min-height: 100%;
}

.form-card :deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
}

.form-card :deep(.el-card__body) {
  padding: 32px;
  background: #f8f9fa;
}

/* 统一页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 24px;
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
  gap: 16px;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.shortcut-key {
  padding: 2px 8px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: #606266;
}

.form-actions {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  margin: 12px 0;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
}

.form-actions .el-button {
  min-width: 140px;
  font-weight: 600;
  padding: 12px 32px;
}

.optimized-form {
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.optimized-form .el-form-item {
  margin-bottom: 24px;
}

.optimized-form .el-form-item__label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.existing-data-collapse {
  margin-top: 24px;
}

.existing-data-collapse :deep(.el-collapse-item__header) {
  background-color: #fef6ec;
  border: 2px solid #f0ad4e;
  padding: 0 20px;
  font-weight: 600;
  color: #e6a23c;
  border-radius: 6px;
}

.existing-data-collapse :deep(.el-collapse-item__content) {
  padding: 16px 0 0 0;
  background-color: #ffffff;
  border: 2px solid #f0ad4e;
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.el-divider {
  margin: 28px 0;
}

.batch-items-container {
  width: 100%;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.batch-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.batch-header-actions :deep(.el-upload) {
  display: inline-flex;
  align-items: center;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-count {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.batch-table {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.batch-table-header {
  display: flex;
  background: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
}

.batch-table-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.2s;
}

.batch-table-row:last-child {
  border-bottom: none;
}

.batch-table-row:hover {
  background-color: #f5f7fa;
}

.batch-col {
  padding: 12px;
  display: flex;
  align-items: center;
}

.batch-col-index {
  width: 60px;
  justify-content: center;
}

.batch-col-category {
  flex: 1;
  min-width: 150px;
}

.batch-col-date {
  width: 180px;
}

.batch-col-note {
  flex: 1;
  min-width: 150px;
}

.batch-col-action {
  width: 100px;
  justify-content: center;
}

.batch-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #409eff;
  color: #ffffff;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
}



.batch-col :deep(.el-select),
.batch-col :deep(.el-date-editor),
.batch-col :deep(.el-input) {
  width: 100%;
}

.batch-actions {
  margin-top: 12px;
  padding: 12px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.batch-actions .el-button {
  min-width: 120px;
}
</style>
