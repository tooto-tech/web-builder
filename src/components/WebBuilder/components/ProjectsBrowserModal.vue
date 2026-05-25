<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getPagePage, type PageVO } from '@/views/content/page/api'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const router = useRouter()

// ── State ──────────────────────────────────────────────────
const loading = ref(false)
const list = ref<PageVO[]>([])
const total = ref(0)

const searchKeyword = ref('')
const statusFilter = ref<'' | 'draft' | 'publish' | 'publish_editing'>('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'name' | 'createTime'>('name')

// ── Computed ───────────────────────────────────────────────
const filteredList = computed(() => {
  let result = [...list.value]

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    result = result.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(kw) ||
        (p.slug || '').toLowerCase().includes(kw)
    )
  }

  if (statusFilter.value) {
    result = result.filter((p) => p.status === statusFilter.value)
  }

  if (sortBy.value === 'name') {
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else {
    result.sort(
      (a, b) =>
        new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime()
    )
  }

  return result
})

// ── Status badge helper ────────────────────────────────────
const statusLabel = (status: string) => {
  if (status === 'publish') return 'published'
  if (status === 'publish_editing') return 'published'
  return 'draft'
}

const isPublished = (status: string) =>
  status === 'publish' || status === 'publish_editing'

// ── Fetch data ─────────────────────────────────────────────
const fetchList = async () => {
  loading.value = true
  try {
    const data = await getPagePage({ pageNo: 1, pageSize: 200 })
    list.value = data.list || []
    total.value = data.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchList()
  }
)

// ── Open project ───────────────────────────────────────────
const handleOpen = (page: PageVO) => {
  emit('update:modelValue', false)
  router.push({ path: '/cms/editor', query: { type: page.type, id: String(page.id) } })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :width="900"
    :show-close="true"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <template #header>
      <div>
        <p class="text-xl font-bold text-gray-900">Browse</p>
        <p class="text-sm text-gray-500 mt-1">Find and explore your projects and templates.</p>
      </div>
    </template>

    <!-- Toolbar row 1: tabs + view toggle -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1">
        <button
          class="px-4 py-1.5 text-sm border rounded font-medium bg-white text-gray-800 border-gray-300"
        >
          Projects
        </button>
        <button
          class="px-4 py-1.5 text-sm border rounded font-medium text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
          disabled
        >
          Templates
        </button>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="p-1.5 rounded border"
          :class="viewMode === 'grid' ? 'bg-gray-100 border-gray-300' : 'border-transparent text-gray-400'"
          title="Grid view"
          @click="viewMode = 'grid'"
        >
          <Icon icon="material-symbols:grid-view" class="text-lg" />
        </button>
        <button
          class="p-1.5 rounded border"
          :class="viewMode === 'list' ? 'bg-gray-100 border-gray-300' : 'border-transparent text-gray-400'"
          title="List view"
          @click="viewMode = 'list'"
        >
          <Icon icon="material-symbols:view-list" class="text-lg" />
        </button>
      </div>
    </div>

    <!-- Toolbar row 2: search + sort -->
    <div class="flex items-center gap-3 mb-4">
      <div class="flex-1 relative">
        <Icon
          icon="ep:search"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Search by name, description, or tag..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-blue-400"
        />
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded px-3 py-2">
        <Icon icon="material-symbols:swap-vert" class="text-base" />
        <select
          v-model="sortBy"
          class="outline-none bg-transparent text-sm text-gray-600 cursor-pointer"
        >
          <option value="name">Name</option>
          <option value="createTime">Create Time</option>
        </select>
      </div>
    </div>

    <!-- Toolbar row 3: status filter -->
    <div class="flex items-center gap-2 mb-5">
      <Icon icon="material-symbols:filter-list" class="text-gray-500" />
      <button
        class="px-4 py-1 text-sm rounded"
        :class="statusFilter === '' ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="statusFilter = ''"
      >
        All
      </button>
      <button
        class="px-4 py-1 text-sm rounded border"
        :class="statusFilter === 'publish' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="statusFilter = statusFilter === 'publish' ? '' : 'publish'"
      >
        Published
      </button>
      <button
        class="px-4 py-1 text-sm rounded border"
        :class="statusFilter === 'draft' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="statusFilter = statusFilter === 'draft' ? '' : 'draft'"
      >
        Draft
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center h-48">
      <Icon icon="svg-spinners:ring-resize" class="text-3xl text-purple-500" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredList.length === 0"
      class="flex flex-col items-center justify-center h-48 text-gray-400"
    >
      <Icon icon="material-symbols:folder-open-outline" class="text-5xl mb-3" />
      <p class="text-sm">No projects found</p>
    </div>

    <!-- Grid view -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1"
    >
      <div
        v-for="page in filteredList"
        :key="page.id"
        class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group"
        @click="handleOpen(page)"
      >
        <!-- Thumbnail area -->
        <div class="h-36 bg-gray-50 flex items-center justify-center group-hover:bg-purple-50 transition-colors">
          <Icon
            icon="material-symbols:folder-outline"
            class="text-6xl text-purple-400 group-hover:text-purple-500 transition-colors"
          />
        </div>
        <!-- Info -->
        <div class="px-3 py-2.5 flex items-center gap-2">
          <span class="font-semibold text-sm text-gray-800 truncate flex-1">
            {{ page.name || 'Untitled' }}
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            :class="
              isPublished(page.status)
                ? 'bg-purple-600 text-white'
                : 'border border-gray-300 text-gray-500'
            "
          >
            {{ statusLabel(page.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div
      v-else
      class="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1"
    >
      <div
        v-for="page in filteredList"
        :key="page.id"
        class="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:shadow-sm hover:border-purple-300 transition-all group"
        @click="handleOpen(page)"
      >
        <Icon
          icon="material-symbols:folder-outline"
          class="text-2xl text-purple-400 flex-shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate">{{ page.name || 'Untitled' }}</p>
          <p v-if="page.slug" class="text-xs text-gray-400 truncate">{{ page.slug }}</p>
        </div>
        <span
          class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          :class="
            isPublished(page.status)
              ? 'bg-purple-600 text-white'
              : 'border border-gray-300 text-gray-500'
          "
        >
          {{ statusLabel(page.status) }}
        </span>
        <Icon icon="ep:arrow-right" class="text-gray-400 group-hover:text-purple-500" />
      </div>
    </div>
  </el-dialog>
</template>
