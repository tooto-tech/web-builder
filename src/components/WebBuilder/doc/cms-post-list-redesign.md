# CMS 文章列表组件重构方案

> 更新说明：当前正式实现已迁移到 `registries/cms/post/list.ts`，统一注册入口为 `registries/cms/index.ts`。

## 一、现状问题

| 问题 | 说明 |
|------|------|
| 编辑器与前端样式割裂 | 编辑器用内联 style 预览，发布用 Tailwind class 硬编码在 `publishTemplate` 中，两套样式独立维护 |
| CMS 组件不可编辑 | `droppable: false` + `STATIC_CHILD` 锁死整个子组件树，用户无法调整卡片内容和样式 |
| publishTemplate 硬编码 | 发布 HTML 是手写字符串，和编辑器组件定义完全脱钩 |
| 开发维护困难 | 每种 CMS 列表组件需同时维护：编辑器组件定义 + publishTemplate + factory 样式 |

## 二、设计目标

1. **所见即所得** — 编辑器中的样式 = 发布后前端的样式
2. **用户可编辑** — 卡片内容（图片、标题、摘要、链接等）可在编辑器中自由调整
3. **数据绑定透明** — `data-cms-bind-*` 属性由预设/用户设置，发布时后端据此填充数据
4. **无需 publishTemplate** — GrapesJS 直接输出编辑器中的真实 HTML 结构

## 三、组件拆分

### 3.1 组件定义

| 组件 | 类型常量 | 标签 | droppable | 角色 |
|------|---------|------|-----------|------|
| 文章列表 | `WB_CMS_POST_LIST_TYPE` | `div` | 仅接受 `wb-cms-post-card` | Grid 容器，携带 `data-cms-component="post-list"` 及分页/分类配置 |
| 文章卡片 | `WB_CMS_POST_CARD_TYPE` | `div` | `true`（接受任意子元素） | 单张卡片模板，携带 `data-cms-repeat="post"`，内部可放任意组件 |

### 3.2 组件关系

```
文章列表 (wb-cms-post-list)
│  data-cms-component="post-list"
│  data-category-id="..."
│  data-page-size="12"
│  data-pagination="static"
│  style: display:grid; grid-template-columns:repeat(3,1fr); gap:0 16px;
│
└── 文章卡片 (wb-cms-post-card)    ← 仅允许此类型作为子组件
    │  data-cms-repeat="post"
    │  style: position:relative;
    │
    ├── div (图片容器)
    │   └── img [data-cms-bind-src="post.image"]
    │
    └── div (文字区域)
        ├── span [data-cms-bind="post.publishTime"]
        ├── h4   [data-cms-bind="post.name"]
        ├── p    [data-cms-bind="post.excerpt"]
        └── a    [data-cms-bind-href="post.url"]
```

## 四、文章列表（Post List）详细设计

### 4.1 注册方式

直接 `domComponents.addType()`，**不走 cmsFactory**。

### 4.2 GrapesJS Model 配置

```typescript
{
  name: '文章列表',
  tagName: 'div',
  draggable: '*',
  droppable: '[data-wb-component="cms-post-card"]',  // 仅接受文章卡片
  selectable: true,
  editable: false,
  stylable: true,                                     // 用户可在 StyleManager 调整
  attributes: {
    'data-wb-component': 'cms-post-list',
    'data-cms-component': 'post-list',
    'data-category-id': '',
    'data-page-size': '12',
    'data-pagination': 'static',
    'data-max-pages': '10',
  },
  style: {
    display: 'grid',
    'grid-template-columns': 'repeat(3, 1fr)',
    gap: '0 16px',
  },
  // Model 属性 & Traits
  cmsCategoryId: '',
  cmsPageSize: 12,
  cmsPagination: 'static',
  cmsMaxPages: 10,
  traits: [...],
  // 默认包含 1 个文章卡片
  components: [
    { type: WB_CMS_POST_CARD_TYPE }
  ],
}
```

### 4.3 Traits

| Trait | 属性名 | 类型 | 说明 |
|-------|--------|------|------|
| 文章类型 ID | cmsCategoryId | text | 筛选文章分类 |
| 每页数量 | cmsPageSize | number (1-50) | 分页大小 |
| 分页模式 | cmsPagination | select | static / loadmore / none |
| 最大页数 | cmsMaxPages | number (1-100) | 分页上限 |

### 4.4 关键行为

- `init()` — 监听 trait 变化，调用 `_syncAttrs()`
- `_syncAttrs()` — 同步 model 属性到 HTML data attributes
- **不覆盖** `toJSON()` — 正常序列化 components（子组件是用户编辑的内容）
- **不覆盖** `getInnerHTML()` — 让 GrapesJS 正常递归渲染子组件 HTML

## 五、文章卡片（Post Card）详细设计

### 5.1 GrapesJS Model 配置

```typescript
{
  name: '文章卡片',
  tagName: 'div',
  draggable: '[data-wb-component="cms-post-list"]',  // 只能拖入文章列表
  droppable: true,                                     // 接受任意子元素
  selectable: true,
  editable: false,
  stylable: true,
  attributes: {
    'data-wb-component': 'cms-post-card',
    'data-cms-repeat': 'post',
  },
  style: {
    position: 'relative',
  },
  // 默认子组件（预设结构，用户可自由修改）
  components: [
    // 图片容器 + img
    // 文字区域 + span/h4/p/a
  ],
}
```

### 5.2 默认子组件结构

子元素全部是标准 GrapesJS 组件，用户可以：

- 在 **StyleManager** 中调整字体、颜色、间距、布局等
- 在属性面板中编辑 `data-cms-bind-*` 等 HTML 属性
- 添加 / 删除 / 重排子元素
- 拖入其他已注册的组件（按钮、图标等）

### 5.3 数据绑定属性

卡片内子元素通过 HTML 属性与后端数据绑定：

| 属性 | 用途 | 示例 |
|------|------|------|
| `data-cms-bind="field"` | 文本内容绑定 | `data-cms-bind="post.name"` |
| `data-cms-bind-src="field"` | 图片 src 绑定 | `data-cms-bind-src="post.image"` |
| `data-cms-bind-alt="field"` | 图片 alt 绑定 | `data-cms-bind-alt="post.name"` |
| `data-cms-bind-href="field"` | 链接 href 绑定 | `data-cms-bind-href="post.url"` |
| `data-cms-format="pattern"` | 格式化（配合 bind） | `data-cms-format="yyyy-MM-dd"` |

这些属性可由用户在编辑器的属性面板中手动编辑。

## 六、发布流程

### 6.1 变化点

| 环节 | 旧方案 | 新方案 |
|------|--------|--------|
| `getInnerHTML()` | 返回硬编码 publishTemplate | **不覆盖**，GrapesJS 正常递归渲染 |
| `editor.getHtml()` | 输出 publishTemplate 字符串 | 输出编辑器中真实的子组件 HTML（含用户设置的 style/class） |
| `fixCmsComponentsHtml()` | 替换 innerHTML 为 publishTemplate | **不替换 innerHTML**，仅同步 data attributes 和清理 `data-wb-component` |
| `ssgRenderer.ts` | 查找 `[data-cms-repeat]` 模板卡片 | **不变** — 仍然查找 `[data-cms-repeat="post"]`，克隆 → 绑定数据 |

### 6.2 发布输出 HTML 示例

```html
<div data-cms-component="post-list"
     data-category-id=""
     data-page-size="12"
     data-pagination="static"
     data-max-pages="10"
     style="display:grid;grid-template-columns:repeat(3,1fr);gap:0 16px;">

  <!-- 后端根据 data-cms-repeat 循环此卡片 -->
  <div data-cms-repeat="post" style="position:relative;">
    <div style="overflow:hidden;">
      <img data-cms-bind-src="post.image"
           data-cms-bind-alt="post.name"
           src="https://placehold.co/402x308?text=Blog"
           style="width:100%;object-fit:cover;display:block;" />
    </div>
    <div style="padding-top:16px;padding-bottom:16px;">
      <span data-cms-bind="post.publishTime"
            data-cms-format="yyyy-MM-dd"
            style="font-size:14px;margin-bottom:8px;display:block;color:#6b7280;">
        Jan 01, 2023
      </span>
      <h4 data-cms-bind="post.name"
          style="font-size:20px;color:#041038;font-weight:500;">
        文章标题
      </h4>
      <p data-cms-bind="post.excerpt"
         style="color:#193143;line-height:1.6;">
        文章摘要...
      </p>
      <a data-cms-bind-href="post.url"
         href="#"
         style="color:inherit;text-decoration:none;">
        Read more..
      </a>
    </div>
  </div>

</div>
```

> 注意：style 值来自用户在编辑器 StyleManager 中设置的样式，由 GrapesJS `getHtml()` + `getCss()` 自动输出。编辑器中怎么改，发布就怎么输出。

## 七、Live Preview 适配

### 7.1 现有逻辑

```
1. 找到 [data-cms-repeat] 容器
2. 克隆第一个子组件作为模板
3. 隐藏原始元素（display:none + data-cms-hidden）
4. 在旁边插入 [data-cms-preview] 容器填充真实数据
```

### 7.2 适配方案

由于文章卡片现在是可编辑的 GrapesJS 组件，MutationObserver 会监听其 DOM 变化。Live preview 的 DOM 操作会被同步到 model，导致污染。

**解决方案：** 在**文章列表**层级操作，不动卡片内部 DOM：

```
1. 找到文章列表容器（data-cms-component="post-list"）
2. 隐藏列表内所有子组件（卡片们）
3. 在列表末尾追加 [data-cms-preview] 容器
4. 在 preview 容器内渲染 grid + 真实数据卡片
5. 保存/发布时清理 preview 容器、恢复卡片显示
```

这与现有模式完全一致，只是操作层级从 `[data-cms-repeat]` 上移到 post-list 容器。

### 7.3 序列化保护

由于 preview 容器插入在文章列表层级，而文章列表的 `droppable` 限制为只接受 `wb-cms-post-card`，GrapesJS 的 MutationObserver 在发现不匹配的子元素时会忽略，不会将 preview 容器同步到 model。

> 需验证：GrapesJS 对 droppable 约束之外的 DOM 变更是否确实忽略。若不忽略，备选方案是在 `toJSON()` 中过滤掉带 `data-cms-preview` 属性的子组件。

## 八、BlocksPanel.vue 注册

在 `dynamic` 分类中添加：

```typescript
{
  id: 'cms-post-list',
  label: '文章列表',
  icon: '📋',
  category: 'dynamic',
  content: { type: WB_CMS_POST_LIST_TYPE },
},
{
  id: 'cms-post-card',
  label: '文章卡片',
  icon: '📰',
  category: 'dynamic',
  content: { type: WB_CMS_POST_CARD_TYPE },
},
```

**用户使用流程：**

1. 拖入"文章列表"到画布 → 自动包含 1 张预设卡片
2. 选中卡片 → 编辑内部元素的样式、内容
3. 选中列表 → 在右侧面板设置分类 ID、分页参数
4. 选中列表 → 在 StyleManager 调整列数（grid-template-columns）、间距（gap）等
5. 如需多张预览卡片 → 复制卡片（后端只取第一张 `[data-cms-repeat]` 作为模板）
6. 发布 → 输出的 HTML 和编辑器中看到的完全一致

## 九、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `registries/cms/post/list.ts` | **新位置** | 文章列表 + 文章卡片组件注册的正式实现 |
| `registries/cms/index.ts` | **新位置** | CMS 组件统一注册入口的正式实现 |
| `components/BlocksPanel.vue` | **修改** | 更新 dynamic 分类中的 block 定义 |
| `composables/useCmsLivePreview.ts` | **修改** | 适配新 DOM 结构的 preview 注入 |
| `utils/cmsFactory.ts` | **修改** | 卡片样式引用已切到新目录 |
| `utils/ssgRenderer.ts` | **修改** | 卡片样式引用已切到新目录 |

## 十、后续扩展

本次只重构 **文章列表**（post-list）。验证成功后，可用相同模式重构：

- 产品列表（product-list）→ 产品列表 + 产品卡片
- 媒体资源列表（media-list）→ 媒体列表 + 媒体卡片

通用模式可提取为 `CMS List + Card` 基类，减少重复代码。
