# 动态内容 SEO 预渲染 — 技术实现方案

> SAAS 建站系统中 Post、MediaResource、Product 等动态内容的 SEO 解决方案
> 可直接作为编码依据

---

## 一、现有架构

```
GrapesJS 编辑器 → 生成完整 HTML → 后端 PageServiceImpl.publish()
→ 写静态文件到 /opt/ws/tenant/{tenantId}/ → Nginx 直出
```

**现有页面类型**（EditorTypeEnum）：
- `SITE` — 站点页面（首页、关于我们等），多页，纯静态
- `CMS_POST` — 文章页面模板
- `MEDIA_RESOURCE` — 媒体资源页面模板
- `PRODUCT` — 产品页面模板

**现有 App API**（已开发完成）：
- `GET /app-api/content/post/page` — 文章分页（支持 type、language 参数）
- `GET /app-api/content/post/get-by-slug` — 按 slug 获取文章详情
- `GET /app-api/content/post/get` — 按 ID 获取文章详情
- `GET /app-api/content/post-type/list` — 文章类型列表
- `GET /app-api/content/media-resource/page` — 媒体资源分页
- `GET /app-api/content/media-resource/get-by-slug` — 按 slug 获取媒体详情
- `GET /app-api/content/media-resource/get` — 按 ID 获取媒体详情
- `GET /app-api/content/media-resource/list-by-category` — 按分类获取媒体列表
- `GET /app-api/content/media-resource-category/list` — 媒体分类列表
- `GET /app-api/product/spu/page` — 产品分页
- `GET /app-api/product/spu/get-detail` — 按 ID 获取产品详情
- `GET /app-api/product/spu/list-by-ids` — 按 ID 批量获取产品列表

**问题**：动态内容（文章、媒体资源、产品）如果用静态 HTML + AJAX 加载，搜索引擎看到的是空壳页面，SEO 极差。

---

## 二、方案核心：模板预渲染

### 2.1 一句话总结

GrapesJS 输出的 HTML 是**含动态占位符的模板**，后端在内容变更时用模板 + 数据渲染出完整静态 HTML。

### 2.2 两类页面

| 类型 | 含义 | 模板与文件关系 | 示例 |
|------|------|---------------|------|
| **普通页面** | 一个模板 → 一个 HTML | 1:1 | 首页含「最新 3 篇文章」组件 |
| **集合页面** | 一个模板 × N 条数据 → N 个 HTML | 1:N | 文章详情模板 × 每篇文章 = N 个详情页 |

### 2.3 完整流程图

```
                    ┌──────────────────────┐
                    │   GrapesJS 编辑器     │
                    │   拖入动态内容组件     │
                    └──────────┬───────────┘
                               │ 发布
                               ▼
                    ┌──────────────────────┐
                    │  PageServiceImpl      │
                    │  .publish()           │
                    │                      │
                    │  1. 保存模板到 DB     │
                    │  2. 解析动态组件标记   │
                    │  3. 写入依赖表        │
                    │  4. 触发首次渲染      │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ 文章发布/改/删 │  │ 媒体资源变更  │  │ 产品上下架/改 │  │ 模板重新发布  │
     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
            │                 │                  │                 │
            └────────┬────────┴──────────────────┘                 │
                     ▼                                             ▼
          ┌─────────────────────┐     ┌─────────────────────┐
          │ 查依赖表             │     │ 重新渲染该模板       │
          │ 找出受影响的页面模板  │     │ 关联的所有页面       │
          └──────────┬──────────┘     └──────────┬──────────┘
                     │                           │
                     └─────────┬─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │  SiteRenderService    │
                    │  (异步渲染引擎)       │
                    │                      │
                    │  1. 读模板（Redis）   │
                    │  2. 查数据（MySQL）   │
                    │  3. Thymeleaf 渲染    │
                    │  4. 写静态文件        │
                    │  5. 清理过期文件      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  /opt/ws/tenant/{id}/ │
                    │  Nginx 直出静态 HTML  │
                    └──────────────────────┘
```

---

## 三、数据库设计

### 3.1 渲染依赖表 cms_render_dependency

记录「哪个页面模板用了哪种动态数据」，用于内容变更时精准找出需要重新渲染的页面。

**核心设计：一个页面可以有多条依赖记录**。每个动态组件独立一条记录，同一个 `page_id` 会出现多次。查依赖是按**组件粒度**（定位哪些页面受影响），渲染是按**页面粒度**（整页重新渲染所有组件）。

**混合页面示例**：首页（`page_id=1`）同时包含博客列表、新闻列表、热销产品、媒体 Top 列表：

```
┌──────────────────────────────────────────────────────────────────────┐
│  首页 (page_id = 1)                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │ 最新博客 (3篇)   │  │ 最新新闻 (5篇)   │                           │
│  │ post-latest      │  │ post-latest      │                           │
│  │ type=blog        │  │ type=news        │                           │
│  └─────────────────┘  └─────────────────┘                           │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │ 热销产品 (6个)    │  │ 媒体精选 (4个)   │                           │
│  │ product-latest   │  │ media-by-category│                           │
│  │ categoryId=10    │  │ categoryCode=    │                           │
│  │                  │  │ gallery          │                           │
│  └─────────────────┘  └─────────────────┘                           │
└──────────────────────────────────────────────────────────────────────┘
```

对应 4 条依赖记录：

| id | page_id | component_type | data_type | data_filter | page_mode |
|----|---------|---------------|-----------|-------------|-----------|
| 1 | 1 | post-latest | post | {"type":"blog"} | single |
| 2 | 1 | post-latest | post | {"type":"news"} | single |
| 3 | 1 | product-latest | product | {"categoryId":10} | single |
| 4 | 1 | media-by-category | media_resource | {"categoryCode":"gallery"} | single |

**触发渲染的查找流程**：

```
一篇 blog 文章发布
    │
    ▼
按 data_type='post' 查依赖表
    │
    ▼
找到 id=1 (page_id=1), id=2 (page_id=1)
    │
    ▼
按 page_id 去重 → 需要渲染的页面: [1]
    │
    ▼
SiteRenderService.renderSinglePage(tenantId, pageId=1)
    │
    ▼
解析模板中 所有 data-cms-* 组件（4个）
一次性收集全部数据 → 渲染出完整首页 HTML
```

> **要点**：不管是哪种数据变更触发，只要影响到 page_id=1，就会重新渲染整个首页（包含全部 4 个组件的最新数据）。查依赖用于**缩小影响范围**——如果产品变更，就不会去重新渲染一个只有文章组件的页面。

```sql
CREATE TABLE cms_render_dependency (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id       BIGINT NOT NULL,
    page_id         BIGINT NOT NULL COMMENT 'cms_page.id — 引用该动态组件的页面模板版本 ID。业务语义统一通过 cms_page.resource_id -> cms_page_resource.resource_type / owner_type / owner_id 解析',
    component_type  VARCHAR(32) NOT NULL COMMENT '动态组件类型：post-list / post-latest / post-detail / media-list / media-by-category / media-detail / product-list / product-latest / product-detail',
    data_type       VARCHAR(32) NOT NULL COMMENT '依赖的数据类型：post / media_resource / product。内容变更时根据此字段找出需要重新渲染的依赖记录',
    data_filter     VARCHAR(512) COMMENT '过滤条件 JSON。文章示例：{"type":"blog","categoryId":5}；媒体示例：{"categoryCode":"gallery"}；产品示例：{"categoryId":10,"sortField":"price","sortAsc":true}',
    page_mode       VARCHAR(16) NOT NULL DEFAULT 'single' COMMENT 'single=普通页面（首页等，一个模板输出一个 HTML） / collection=集合页面（详情模板，一个模板 × N 条数据输出 N 个 HTML）',
    pagination_mode VARCHAR(16) DEFAULT 'static' COMMENT '分页模式：static=静态分页（每页一个 HTML 文件，SEO 友好） / loadmore=前端加载更多 / none=不分页',
    page_size       INT DEFAULT 12 COMMENT '每页条数（pagination_mode=static 或 loadmore 时生效）',
    max_static_pages INT DEFAULT 10 COMMENT '静态分页最大页数（pagination_mode=static 时生效，超出部分不生成文件）',
    output_path     VARCHAR(255) COMMENT '输出路径模式（不含语言前缀），如 blog、products、gallery。最终路径为 /{langSlug}/{outputPath}/index.html',
    creator         VARCHAR(64) DEFAULT '' COMMENT '创建者',
    create_time     DATETIME DEFAULT NOW(),
    update_time     DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted         BIT(1) DEFAULT 0,
    INDEX idx_tenant_data (tenant_id, data_type, deleted)
) COMMENT '渲染依赖表 — 记录页面模板与动态数据的依赖关系，内容变更时据此定位需要重新渲染的页面';
```

### 3.2 渲染任务表 cms_render_task

记录异步渲染任务的执行状态，用于追踪、重试、调试。

```sql
CREATE TABLE cms_render_task (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id       BIGINT NOT NULL,
    task_type       VARCHAR(32) NOT NULL COMMENT '任务类型：见渲染任务类型枚举',
    trigger_source  VARCHAR(32) NOT NULL COMMENT '触发来源：post_publish / post_update / post_delete / template_publish / media_publish / product_enable / product_update / product_disable 等',
    trigger_ref_id  BIGINT COMMENT '触发源 ID — 根据 trigger_source 不同含义不同：post_* 时为文章 ID / media_* 时为媒体资源 ID / product_* 时为产品 SPU ID / template_publish 时为 cms_page ID',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending / running / success / failed',
    files_rendered  INT DEFAULT 0 COMMENT '已渲染文件数',
    files_total     INT DEFAULT 0 COMMENT '总需渲染文件数',
    error_msg       VARCHAR(1024) COMMENT '错误信息',
    started_at      DATETIME,
    finished_at     DATETIME,
    creator         VARCHAR(64) DEFAULT '' COMMENT '创建者',
    create_time     DATETIME DEFAULT NOW(),
    update_time     DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted         BIT(1) DEFAULT 0,
    INDEX idx_tenant_status (tenant_id, status, deleted)
) COMMENT '渲染任务表';
```

---

## 四、动态组件标记规范

### 4.1 组件类型枚举

| 组件类型 | component_type | data_type | page_mode | 说明 |
|---------|---------------|-----------|-----------|------|
| 文章列表 | `post-list` | `post` | single | 可配分页，支持按类型和分类筛选 |
| 最新文章 | `post-latest` | `post` | single | 取最新 N 篇，支持按类型和分类筛选，放在任意页面（首页等） |
| 文章详情 | `post-detail` | `post` | collection | 一个模板生成 N 个详情页 |
| 媒体资源列表 | `media-list` | `media_resource` | single | 可配分页，支持按分类筛选 |
| 按分类媒体 | `media-by-category` | `media_resource` | single | 按分类编码展示 |
| 媒体资源详情 | `media-detail` | `media_resource` | collection | 一个模板生成 N 个详情页 |
| 产品列表 | `product-list` | `product` | single | 可配分页，支持按分类筛选和排序 |
| 最新产品 | `product-latest` | `product` | single | 取最新 N 个，支持按分类筛选，放在任意页面 |
| 产品详情 | `product-detail` | `product` | collection | 一个模板生成 N 个详情页 |
| 搜索 | `search` | — | — | 纯前端组件，不参与预渲染 |

### 4.2 HTML 标记语法

GrapesJS 组件输出的 HTML 使用 `data-cms-*` 属性标记动态内容区域。后端渲染引擎解析这些属性，替换为实际数据后**移除所有 `data-cms-*` 属性**，输出干净的 HTML。

#### 4.2.1 组件容器

```html
<!-- 组件容器：声明组件类型和配置 -->
<div data-cms-component="post-list"
     data-type="blog"
     data-page-size="12"
     data-pagination="static"
     data-max-pages="10">
  <!-- 内部是循环体模板 -->
</div>
```

属性说明：

| 属性 | 说明 | 适用组件 |
|------|------|---------|
| `data-cms-component` | 组件类型（必填） | 所有 |
| `data-type` | 文章类型 code | post-list, post-latest, post-detail |
| `data-category-id` | 分类 ID（通用筛选） | post-list, post-latest, product-list, product-latest |
| `data-limit` | 最大条数（非分页组件用） | post-latest, product-latest, media-by-category |
| `data-page-size` | 每页条数 | post-list, media-list, product-list |
| `data-pagination` | 分页模式：static / loadmore / none | post-list, media-list, product-list |
| `data-max-pages` | 静态分页最大页数 | post-list, media-list, product-list |
| `data-category` | 媒体分类 code | media-by-category |
| `data-resource-type` | 媒体资源类型（IMAGE 等） | media-list |
| `data-sort-field` | 排序字段：price / salesCount / createTime | product-list |
| `data-sort-asc` | 排序方向：true=升序 / false=降序 | product-list |

#### 4.2.2 循环

```html
<div data-cms-repeat="post">
  <!-- 此节点会被重复渲染，每条数据一份 -->
</div>
```

循环变量名根据 `data-cms-repeat` 的值确定：
- `data-cms-repeat="post"` → 循环变量为 `post`
- `data-cms-repeat="media"` → 循环变量为 `media`
- `data-cms-repeat="product"` → 循环变量为 `product`

#### 4.2.3 数据绑定

```html
<!-- 文本绑定：替换节点的 textContent -->
<h3 data-cms-bind="post.name">占位标题</h3>

<!-- HTML 绑定：替换节点的 innerHTML（用于富文本内容） -->
<div data-cms-html="post.content">占位内容</div>

<!-- 属性绑定：替换指定的 HTML 属性值 -->
<img data-cms-bind-src="post.image"
     data-cms-bind-alt="post.name"
     src="placeholder.jpg"
     alt="placeholder" />

<a data-cms-bind-href="post.url" href="#">Read More</a>

<!-- 日期格式化 -->
<time data-cms-bind="post.publishTime"
      data-cms-format="yyyy-MM-dd">
  2026-01-01
</time>

<!-- 条件渲染：无值时移除整个节点 -->
<div data-cms-if="post.image">
  <img data-cms-bind-src="post.image" />
</div>
```

#### 4.2.4 分页导航

```html
<!-- 分页导航（渲染引擎自动填充） -->
<nav data-cms-pagination>
  <!-- 渲染引擎会在此处生成分页链接 -->
</nav>
```

渲染引擎在 `data-cms-pagination` 节点内生成：

```html
<nav>
  <a href="/en/blog/" class="active">1</a>
  <a href="/en/blog/page/2.html">2</a>
  <a href="/en/blog/page/3.html">3</a>
  <a href="/en/blog/page/2.html" rel="next">Next &raquo;</a>
</nav>
```

同时在 `<head>` 中注入 SEO 分页标签：

```html
<link rel="prev" href="..." />
<link rel="next" href="..." />
```

#### 4.2.5 SEO Meta 注入

详情页组件自动在 `<head>` 中注入 meta 标签：

```html
<!-- 在模板的 <head> 中声明 -->
<title data-cms-bind="post.name">Page Title</title>
<meta name="keywords" data-cms-bind-content="post.metaKeywords" content="" />
<meta name="description" data-cms-bind-content="post.metaDescription" content="" />
```

### 4.3 可绑定的数据字段

#### Post 字段（对应现有 App API 返回结构）

| 字段 | 类型 | 说明 |
|------|------|------|
| `post.id` | Long | 文章 ID |
| `post.name` | String | 标题（当前语言） |
| `post.slug` | String | URL slug |
| `post.excerpt` | String | 摘要 |
| `post.content` | String | 正文 HTML（仅详情页） |
| `post.image` | String | 封面图 URL |
| `post.type` | String | 文章类型 code |
| `post.publishTime` | DateTime | 发布时间 |
| `post.views` | Integer | 浏览量 |
| `post.metaKeywords` | String | SEO 关键词（仅详情页） |
| `post.metaDescription` | String | SEO 描述（仅详情页） |
| `post.url` | String | **计算字段**，详情页 URL，格式：`/{lang}/post/{type}/{slug}.html` |

#### MediaResource 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `media.id` | Long | 资源 ID |
| `media.title` | String | 标题（当前语言） |
| `media.description` | String | 描述（当前语言） |
| `media.slug` | String | URL slug |
| `media.type` | String | 资源类型 |
| `media.url` | String | 文件 URL |
| `media.coverUrl` | String | 封面图 URL |
| `media.publishTime` | DateTime | 发布时间 |
| `media.seoTitle` | String | SEO 标题（仅详情页） |
| `media.seoDescription` | String | SEO 描述（仅详情页） |
| `media.seoKeywords` | String | SEO 关键词（仅详情页） |
| `media.detailUrl` | String | **计算字段**，详情页 URL |
| `media.items` | List | 子项列表（仅详情页，容器类型） |

#### Product 字段（对应现有 App API 返回结构 + ProductSpuContentDO 多语言）

产品数据分主表（`product_spu`）和多语言内容表（`product_spu_content`），渲染时根据当前语言合并。

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| `product.id` | Long | product_spu | 产品 SPU ID |
| `product.name` | String | product_spu_content（当前语言） | 产品名称（多语言） |
| `product.introduction` | String | product_spu_content（当前语言） | 产品简介（多语言） |
| `product.description` | String | product_spu_content（当前语言） | 产品详情 HTML（多语言，仅详情页） |
| `product.picUrl` | String | product_spu | 封面图 URL |
| `product.sliderPicUrls` | List\<String\> | product_spu | 轮播图 URL 列表（仅详情页） |
| `product.categoryId` | Long | product_spu | 分类 ID |
| `product.categoryName` | String | product_category | 分类名称 |
| `product.brandId` | Long | product_spu | 品牌 ID |
| `product.price` | Integer | product_spu | 价格（单位：分） |
| `product.marketPrice` | Integer | product_spu | 市场价（单位：分） |
| `product.priceFormatted` | String | **计算字段** | 格式化价格，如 "$10.24" |
| `product.stock` | Integer | product_spu | 库存 |
| `product.salesCount` | Integer | product_spu | 销量（实际 + 虚拟） |
| `product.specType` | Boolean | product_spu | 规格类型：false=单规格 / true=多规格 |
| `product.skus` | List | product_sku | SKU 列表（仅详情页） |
| `product.url` | String | **计算字段** | 详情页 URL，格式：`/{lang}/products/{id}.html` |

> **说明**：产品目前没有 slug 字段，详情页 URL 使用 ID 作为标识。后续如需要 SEO 友好 URL，可在 `product_spu` 表添加 `slug` 字段。

#### Product vs Post/MediaResource 数据模型差异

| 差异点 | Post / MediaResource | Product |
|--------|---------------------|---------|
| **多语言存储** | `cms_post_content` / `cms_media_resource_content` 表 | `product_spu_content` 表（含 name, description, detail） |
| **可见性控制** | 发布状态 `publish_status` | 商品状态 `status`（ENABLE=1 上架 / DISABLE=0 下架 / RECYCLE=-1 回收站） |
| **URL 标识** | slug 字段 | 暂用 ID，可扩展 slug |
| **渲染触发时机** | 发布/更新/删除 | 上架/更新/下架 |
| **数据来源模块** | tooto-module-cms | yudao-module-mall/yudao-module-product |
| **分类体系** | PostType（文章类型）/ MediaResourceCategory | ProductCategory（二级树形结构） |
| **特有字段** | excerpt, views, metaKeywords | price, marketPrice, stock, salesCount, skus, specType |

---

## 五、渲染引擎设计

### 5.1 模块结构

```
com.toototech.service.render/
├── SiteRenderService.java              // 渲染入口，协调各组件
├── TemplateParser.java                 // 解析 HTML 中的 data-cms-* 标记
├── TemplateRenderer.java              // 用 Thymeleaf 执行渲染
├── RenderDependencyService.java       // 依赖关系管理
├── RenderTaskService.java             // 异步任务管理
├── RenderQueue.java                   // 渲染任务队列（防抖合并）
├── RenderFileWriter.java             // 文件写入 + 过期文件清理
├── TemplateCache.java                // Redis 模板缓存
├── handler/                          // 各组件类型的渲染处理器
│   ├── ComponentHandler.java         // 处理器接口
│   ├── PostListHandler.java          // post-list 处理
│   ├── PostLatestHandler.java        // post-latest 处理
│   ├── PostDetailHandler.java        // post-detail 处理
│   ├── MediaListHandler.java         // media-list 处理
│   ├── MediaByCategoryHandler.java   // media-by-category 处理
│   └── MediaDetailHandler.java       // media-detail 处理
│   ├── ProductListHandler.java       // product-list 处理
│   ├── ProductLatestHandler.java     // product-latest 处理
│   └── ProductDetailHandler.java     // product-detail 处理
├── model/
│   ├── RenderContext.java            // 渲染上下文（tenantId, langId, langSlug 等）
│   └── PaginationInfo.java          // 分页信息
└── event/
    ├── PostRenderEventListener.java  // 监听文章变更事件
    ├── MediaResourceRenderEventListener.java
    └── ProductRenderEventListener.java  // 监听产品上下架/变更事件
```

### 5.2 渲染入口 SiteRenderService

```java
@Service
@Slf4j
public class SiteRenderService {

    @Resource
    private TemplateParser templateParser;
    @Resource
    private TemplateRenderer templateRenderer;
    @Resource
    private RenderDependencyService dependencyService;
    @Resource
    private RenderFileWriter fileWriter;
    @Resource
    private TemplateCache templateCache;
    @Resource
    private LanguageService languageService;
    @Resource
    private Map<String, ComponentHandler> handlerMap; // Spring 自动注入所有 handler

    /**
     * 渲染一个普通页面（一个模板 → 一个 HTML）
     * 适用于：首页含 post-latest、列表页含 post-list 等
     *
     * @param tenantId  租户 ID
     * @param pageId    cms_page 的 ID
     */
    @Async
    public void renderSinglePage(Long tenantId, Long pageId) {
        String templateHtml = templateCache.getTemplate(tenantId, pageId);
        List<LanguageDO> languages = languageService.getLanguageList();

        for (LanguageDO lang : languages) {
            RenderContext ctx = RenderContext.builder()
                .tenantId(tenantId)
                .languageId(lang.getId())
                .languageSlug(lang.getSlug())
                .languageCode(lang.getCode())
                .build();

            // 解析模板中的所有动态组件
            List<ComponentDescriptor> components = templateParser.parse(templateHtml);

            if (components.isEmpty()) {
                // 无动态组件，直接写入原始 HTML（纯静态页面）
                fileWriter.write(tenantId, outputPath, templateHtml);
                return;
            }

            // 处理非分页组件（post-latest, media-by-category 等）
            // 收集数据，交给 Thymeleaf 渲染
            Map<String, Object> data = new HashMap<>();
            for (ComponentDescriptor comp : components) {
                ComponentHandler handler = handlerMap.get(comp.getType());
                handler.collectData(ctx, comp, data);
            }

            String renderedHtml = templateRenderer.render(templateHtml, data, ctx);
            String outputPath = resolveOutputPath(pageId, lang);
            fileWriter.write(tenantId, outputPath, renderedHtml);
        }
    }

    /**
     * 渲染集合页面（一个模板 × N 条数据 → N 个 HTML）
     * 适用于：文章详情模板、媒体资源详情模板、产品详情模板
     *
     * @param tenantId    租户 ID
     * @param pageId      cms_page 的 ID（模板）
     * @param dataType    数据类型：post / media_resource / product
     * @param dataItemId  指定数据 ID（null 则渲染所有）
     */
    @Async
    public void renderCollectionPage(Long tenantId, Long pageId,
                                      String dataType, Long dataItemId) {
        String templateHtml = templateCache.getTemplate(tenantId, pageId);
        List<LanguageDO> languages = languageService.getLanguageList();

        ComponentHandler handler = handlerMap.get(dataType + "-detail");

        for (LanguageDO lang : languages) {
            RenderContext ctx = RenderContext.builder()
                .tenantId(tenantId)
                .languageId(lang.getId())
                .languageSlug(lang.getSlug())
                .languageCode(lang.getCode())
                .build();

            // 获取数据项列表
            List<?> items = (dataItemId != null)
                ? handler.getItemById(ctx, dataItemId)
                : handler.getAllItems(ctx);

            for (Object item : items) {
                Map<String, Object> data = handler.buildDetailData(ctx, item);
                String renderedHtml = templateRenderer.render(templateHtml, data, ctx);
                String outputPath = handler.resolveDetailPath(ctx, item);
                fileWriter.write(tenantId, outputPath, renderedHtml);
            }
        }
    }

    /**
     * 渲染列表分页（一个列表模板 → N 个分页 HTML）
     *
     * @param tenantId  租户 ID
     * @param pageId    cms_page 的 ID（列表模板）
     * @param dep       依赖信息（含 pageSize、maxPages、dataFilter 等）
     */
    @Async
    public void renderListPages(Long tenantId, Long pageId, RenderDependencyDO dep) {
        String templateHtml = templateCache.getTemplate(tenantId, pageId);
        List<LanguageDO> languages = languageService.getLanguageList();

        ComponentHandler handler = handlerMap.get(dep.getComponentType());
        int pageSize = dep.getPageSize();
        int maxPages = dep.getMaxStaticPages();

        for (LanguageDO lang : languages) {
            RenderContext ctx = RenderContext.builder()
                .tenantId(tenantId)
                .languageId(lang.getId())
                .languageSlug(lang.getSlug())
                .languageCode(lang.getCode())
                .build();

            // 查总数
            long totalCount = handler.countItems(ctx, dep.getDataFilter());
            int totalPages = (int) Math.ceil((double) totalCount / pageSize);
            int staticPages = Math.min(totalPages, maxPages);

            // 渲染每一页
            for (int page = 1; page <= staticPages; page++) {
                List<?> items = handler.getPage(ctx, dep.getDataFilter(), page, pageSize);

                PaginationInfo pagination = PaginationInfo.builder()
                    .currentPage(page)
                    .totalPages(totalPages)
                    .staticPages(staticPages)
                    .pageSize(pageSize)
                    .basePath("/" + lang.getSlug() + "/" + dep.getOutputPath())
                    .build();

                Map<String, Object> data = handler.buildListData(ctx, items);
                data.put("pagination", pagination);

                String renderedHtml = templateRenderer.render(templateHtml, data, ctx);

                String filePath = page == 1
                    ? lang.getSlug() + "/" + dep.getOutputPath() + "/index.html"
                    : lang.getSlug() + "/" + dep.getOutputPath() + "/page/" + page + ".html";

                fileWriter.write(tenantId, filePath, renderedHtml);
            }

            // 清理多余的旧分页文件
            fileWriter.cleanupStalePages(tenantId, lang.getSlug(),
                dep.getOutputPath(), staticPages);
        }
    }
}
```

### 5.3 组件处理器接口 ComponentHandler

```java
public interface ComponentHandler {

    /** 组件类型标识 */
    String getType();

    /** 普通页面：收集数据放入 data map */
    void collectData(RenderContext ctx, ComponentDescriptor comp, Map<String, Object> data);

    /** 集合页面：获取所有数据项 */
    List<?> getAllItems(RenderContext ctx);

    /** 集合页面：按 ID 获取单条 */
    List<?> getItemById(RenderContext ctx, Long itemId);

    /** 集合页面：构建详情页数据 */
    Map<String, Object> buildDetailData(RenderContext ctx, Object item);

    /** 集合页面：计算详情页输出路径 */
    String resolveDetailPath(RenderContext ctx, Object item);

    /** 列表页：查总数 */
    long countItems(RenderContext ctx, String dataFilter);

    /** 列表页：分页查询 */
    List<?> getPage(RenderContext ctx, String dataFilter, int pageNo, int pageSize);

    /** 列表页：构建列表数据 */
    Map<String, Object> buildListData(RenderContext ctx, List<?> items);
}
```

### 5.4 PostListHandler 示例

```java
@Component("post-list")
public class PostListHandler implements ComponentHandler {

    @Resource
    private CmsPostMapper postMapper;
    @Resource
    private CmsPostContentMapper postContentMapper;

    @Override
    public String getType() { return "post-list"; }

    @Override
    public void collectData(RenderContext ctx, ComponentDescriptor comp,
                            Map<String, Object> data) {
        String type = comp.getAttribute("data-type");
        Long categoryId = comp.getLongAttribute("data-category-id", null);
        int limit = comp.getIntAttribute("data-limit", 12);

        List<PostRenderDTO> posts = queryPosts(ctx, type, categoryId, 1, limit);
        // key 用组件的唯一标识，支持同一页面多个同类组件
        data.put(comp.getDataKey(), posts);
    }

    @Override
    public long countItems(RenderContext ctx, String dataFilter) {
        Map<String, Object> filter = JsonUtils.parseObject(dataFilter, Map.class);
        String type = filter != null ? (String) filter.get("type") : null;
        Long categoryId = filter != null ? (Long) filter.get("categoryId") : null;
        return postMapper.countPublishedByTypeAndCategory(ctx.getTenantId(), type, categoryId);
    }

    @Override
    public List<?> getPage(RenderContext ctx, String dataFilter,
                           int pageNo, int pageSize) {
        Map<String, Object> filter = JsonUtils.parseObject(dataFilter, Map.class);
        String type = filter != null ? (String) filter.get("type") : null;
        Long categoryId = filter != null ? (Long) filter.get("categoryId") : null;
        return queryPosts(ctx, type, categoryId, pageNo, pageSize);
    }

    @Override
    public Map<String, Object> buildListData(RenderContext ctx, List<?> items) {
        return Map.of("posts", items);
    }

    private List<PostRenderDTO> queryPosts(RenderContext ctx, String type,
                                            Long categoryId, int pageNo, int pageSize) {
        // 查询已发布文章（复用现有 Mapper，支持 type + categoryId 筛选）
        List<PostDO> posts = postMapper.selectPublishedPage(
            ctx.getTenantId(), type, categoryId, pageNo, pageSize);

        return posts.stream().map(post -> {
            PostContentDO content = postContentMapper.selectByPostIdAndLanguageId(
                post.getId(), ctx.getLanguageId());

            PostRenderDTO dto = new PostRenderDTO();
            dto.setId(post.getId());
            dto.setImage(post.getImage());
            dto.setType(post.getType());
            dto.setPublishTime(post.getPublishTime());
            dto.setViews(post.getViews());
            if (content != null) {
                dto.setName(content.getName());
                dto.setSlug(content.getSlug());
                dto.setExcerpt(content.getExcerpt());
                // 计算详情页 URL
                dto.setUrl("/" + ctx.getLanguageSlug() + "/"
                    + post.getType() + "/" + content.getSlug() + ".html");
            }
            return dto;
        }).toList();
    }

    // ... 其他方法类似
}
```

### 5.5 ProductListHandler 示例

```java
@Component("product-list")
public class ProductListHandler implements ComponentHandler {

    @Resource
    private ProductSpuMapper spuMapper;
    @Resource
    private ProductSpuContentMapper spuContentMapper;
    @Resource
    private ProductCategoryMapper categoryMapper;

    @Override
    public String getType() { return "product-list"; }

    @Override
    public void collectData(RenderContext ctx, ComponentDescriptor comp,
                            Map<String, Object> data) {
        Long categoryId = comp.getLongAttribute("data-category-id", null);
        int limit = comp.getIntAttribute("data-limit", 12);
        String sortField = comp.getAttribute("data-sort-field");
        Boolean sortAsc = comp.getBoolAttribute("data-sort-asc", null);

        List<ProductRenderDTO> products = queryProducts(ctx, categoryId,
            sortField, sortAsc, 1, limit);
        data.put(comp.getDataKey(), products);
    }

    @Override
    public long countItems(RenderContext ctx, String dataFilter) {
        Map<String, Object> filter = JsonUtils.parseObject(dataFilter, Map.class);
        Long categoryId = filter != null ? (Long) filter.get("categoryId") : null;
        return spuMapper.countEnabledByCategory(ctx.getTenantId(), categoryId);
    }

    @Override
    public List<?> getPage(RenderContext ctx, String dataFilter,
                           int pageNo, int pageSize) {
        Map<String, Object> filter = JsonUtils.parseObject(dataFilter, Map.class);
        Long categoryId = filter != null ? (Long) filter.get("categoryId") : null;
        String sortField = filter != null ? (String) filter.get("sortField") : null;
        Boolean sortAsc = filter != null ? (Boolean) filter.get("sortAsc") : null;
        return queryProducts(ctx, categoryId, sortField, sortAsc, pageNo, pageSize);
    }

    @Override
    public Map<String, Object> buildListData(RenderContext ctx, List<?> items) {
        return Map.of("products", items);
    }

    private List<ProductRenderDTO> queryProducts(RenderContext ctx, Long categoryId,
                                                   String sortField, Boolean sortAsc,
                                                   int pageNo, int pageSize) {
        // 查询已上架产品（status = ENABLE = 1）
        List<ProductSpuDO> spus = spuMapper.selectEnabledPage(
            ctx.getTenantId(), categoryId, sortField, sortAsc, pageNo, pageSize);

        return spus.stream().map(spu -> {
            // 查多语言内容
            ProductSpuContentDO content = spuContentMapper.selectBySpuIdAndLanguageId(
                spu.getId(), ctx.getLanguageId());

            ProductRenderDTO dto = new ProductRenderDTO();
            dto.setId(spu.getId());
            dto.setPicUrl(spu.getPicUrl());
            dto.setCategoryId(spu.getCategoryId());
            dto.setPrice(spu.getPrice());
            dto.setMarketPrice(spu.getMarketPrice());
            dto.setPriceFormatted(formatPrice(spu.getPrice()));
            dto.setSalesCount(spu.getSalesCount() + spu.getVirtualSalesCount());
            dto.setStock(spu.getStock());
            if (content != null) {
                dto.setName(content.getName());
                dto.setIntroduction(content.getDescription());
            } else {
                dto.setName(spu.getName());
                dto.setIntroduction(spu.getIntroduction());
            }
            // 产品用 ID 作为 URL 标识（无 slug 字段）
            dto.setUrl("/" + ctx.getLanguageSlug() + "/products/" + spu.getId() + ".html");
            return dto;
        }).toList();
    }

    private String formatPrice(Integer priceInCents) {
        if (priceInCents == null) return "";
        return String.format("$%.2f", priceInCents / 100.0);
    }

    // ... getAllItems, getItemById, buildDetailData, resolveDetailPath 等方法
}
```

### 5.6 文件写入与过期清理 RenderFileWriter

```java
@Component
@Slf4j
public class RenderFileWriter {

    private static final String BASE_DIR = "/opt/ws/tenant";

    /**
     * 写入文件（原子性：先写临时文件再 rename）
     */
    public void write(Long tenantId, String relativePath, String content) {
        Path targetPath = Paths.get(BASE_DIR, tenantId.toString(), relativePath);
        Path parentDir = targetPath.getParent();

        try {
            if (!Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
            }

            // 原子写入：先写 .tmp 再 rename，防止读到半写文件
            Path tmpPath = targetPath.resolveSibling(targetPath.getFileName() + ".tmp");
            Files.writeString(tmpPath, content, StandardCharsets.UTF_8);
            Files.move(tmpPath, targetPath, StandardCopyOption.ATOMIC_MOVE,
                       StandardCopyOption.REPLACE_EXISTING);

            log.debug("[write] {}", targetPath);
        } catch (IOException e) {
            log.error("[write] Failed: {}", targetPath, e);
            throw new RuntimeException("File write failed: " + relativePath, e);
        }
    }

    /**
     * 清理多余的分页文件
     * 例：之前有 5 页，文章删除后只有 4 页，需要删除 page/5.html
     */
    public void cleanupStalePages(Long tenantId, String langSlug,
                                   String section, int currentTotalPages) {
        Path pageDir = Paths.get(BASE_DIR, tenantId.toString(),
                                 langSlug, section, "page");
        if (!Files.exists(pageDir)) return;

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(pageDir, "*.html")) {
            for (Path file : stream) {
                String name = file.getFileName().toString().replace(".html", "");
                try {
                    int pageNum = Integer.parseInt(name);
                    if (pageNum > currentTotalPages) {
                        Files.delete(file);
                        log.info("[cleanup] Deleted stale page: {}", file);
                    }
                } catch (NumberFormatException ignored) {}
            }
        } catch (IOException e) {
            log.warn("[cleanup] Failed to clean stale pages: {}", pageDir, e);
        }
    }

    /**
     * 删除文件（文章/资源删除时调用）
     */
    public void deleteFile(Long tenantId, String relativePath) {
        Path targetPath = Paths.get(BASE_DIR, tenantId.toString(), relativePath);
        try {
            if (Files.exists(targetPath)) {
                Files.delete(targetPath);
                log.info("[delete] {}", targetPath);
            }
        } catch (IOException e) {
            log.warn("[delete] Failed: {}", targetPath, e);
        }
    }
}
```

### 5.6 渲染任务队列 RenderQueue（防抖合并）

```java
@Component
@Slf4j
public class RenderQueue {

    private final Map<String, ScheduledFuture<?>> pendingTasks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    /** 防抖延迟（秒）：短时间内同类变更合并为一次渲染 */
    private static final int DEBOUNCE_SECONDS = 3;

    /**
     * 提交渲染任务
     * 同一 taskKey 在 DEBOUNCE_SECONDS 内多次提交只执行最后一次
     *
     * @param tenantId  租户 ID
     * @param taskKey   任务唯一标识，如 "post-list:blog" 或 "post-detail:123"
     * @param task      渲染执行体
     */
    public void submit(Long tenantId, String taskKey, Runnable task) {
        String key = tenantId + ":" + taskKey;

        ScheduledFuture<?> existing = pendingTasks.remove(key);
        if (existing != null && !existing.isDone()) {
            existing.cancel(false);
        }

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            pendingTasks.remove(key);
            try {
                task.run();
            } catch (Exception e) {
                log.error("[RenderQueue] Task failed: key={}", key, e);
            }
        }, DEBOUNCE_SECONDS, TimeUnit.SECONDS);

        pendingTasks.put(key, future);
        log.debug("[RenderQueue] Submitted: key={}", key);
    }
}
```

### 5.7 模板缓存 TemplateCache

```java
@Component
public class TemplateCache {

    @Resource
    private StringRedisTemplate redisTemplate;
    @Resource
    private PageMapper pageMapper;

    private static final String KEY_PREFIX = "cms:render:template:";
    private static final long EXPIRE_HOURS = 24;

    public String getTemplate(Long tenantId, Long pageId) {
        String key = KEY_PREFIX + tenantId + ":" + pageId;
        String template = redisTemplate.opsForValue().get(key);
        if (template == null) {
            PageDO page = pageMapper.selectById(pageId);
            if (page == null) return null;
            template = page.getHtmlContentInit();
            if (template != null) {
                redisTemplate.opsForValue().set(key, template, EXPIRE_HOURS, TimeUnit.HOURS);
            }
        }
        return template;
    }

    public void invalidate(Long tenantId, Long pageId) {
        redisTemplate.delete(KEY_PREFIX + tenantId + ":" + pageId);
    }
}
```

---

## 六、事件驱动：触发渲染的时机与范围

### 6.1 触发矩阵

| 事件 | 触发渲染范围 | 任务合并 Key |
|------|------------|-------------|
| **文章发布** | 1. 该文章详情页（×语言数）<br>2. 所有引用 post-list 的列表分页<br>3. 所有引用 post-latest 的页面 | `post-list:{type}`<br>`post-detail:{postId}`<br>`page:{pageId}` |
| **文章更新** | 1. 该文章详情页<br>2. 含该文章的列表分页<br>3. 所有引用 post-latest 的页面 | 同上 |
| **文章删除** | 1. 删除该文章详情页文件<br>2. 重新渲染所有列表分页（含清理多余页）<br>3. 所有引用 post-latest 的页面 | 同上 |
| **媒体资源发布/更新/删除** | 同文章逻辑 | `media-list:{type}`<br>`media-detail:{id}` |
| **产品上架（ENABLE）** | 1. 该产品详情页（×语言数）<br>2. 所有引用 product-list 的列表分页<br>3. 所有引用 product-latest 的页面 | `product-list:{categoryId}`<br>`product-detail:{spuId}`<br>`page:{pageId}` |
| **产品更新** | 1. 该产品详情页<br>2. 含该产品的列表分页<br>3. 所有引用 product-latest 的页面 | 同上 |
| **产品下架/删除（DISABLE/RECYCLE）** | 1. 删除该产品详情页文件<br>2. 重新渲染所有列表分页（含清理多余页）<br>3. 所有引用 product-latest 的页面 | 同上 |
| **站点页面模板发布** | 如果模板含动态组件：渲染该页面 | `page:{pageId}` |
| **列表页模板发布** | 重新渲染所有列表分页 | `post-list:{type}` |
| **详情页模板发布** | 重新渲染该类型所有详情页 | `detail-all:{type}` |

### 6.2 事件监听器

```java
@Component
@Slf4j
public class PostRenderEventListener {

    @Resource
    private RenderDependencyService dependencyService;
    @Resource
    private SiteRenderService renderService;
    @Resource
    private RenderQueue renderQueue;
    @Resource
    private RenderFileWriter fileWriter;

    /**
     * 监听文章发布事件（现有的 PostSaveEvent 扩展）
     */
    @EventListener
    public void onPostSaved(PostSaveEvent event) {
        Long tenantId = TenantContextHolder.getTenantId();
        Long postId = event.getPostId();

        // 1. 渲染该文章的详情页
        renderQueue.submit(tenantId, "post-detail:" + postId, () -> {
            RenderDependencyDO detailDep = dependencyService
                .findByComponentType(tenantId, "post-detail");
            if (detailDep != null) {
                renderService.renderCollectionPage(
                    tenantId, detailDep.getPageId(), "post", postId);
            }
        });

        // 2. 重新渲染所有引用了 post 数据的列表页
        List<RenderDependencyDO> listDeps = dependencyService
            .findAllByDataType(tenantId, "post");
        for (RenderDependencyDO dep : listDeps) {
            String taskKey = dep.getComponentType() + ":" + dep.getOutputPath();
            renderQueue.submit(tenantId, taskKey, () -> {
                if ("collection".equals(dep.getPageMode())) {
                    // 集合页面（详情模板）已经在步骤 1 处理
                    return;
                }
                if ("post-list".equals(dep.getComponentType())
                    || "media-list".equals(dep.getComponentType())) {
                    // 列表页：重新渲染所有分页
                    renderService.renderListPages(tenantId, dep.getPageId(), dep);
                } else {
                    // 普通页面（首页的 post-latest 等）：重新渲染单页
                    renderService.renderSinglePage(tenantId, dep.getPageId());
                }
            });
        }
    }

    /**
     * 监听文章删除事件
     */
    @EventListener
    public void onPostDeleted(PostDeleteEvent event) {
        Long tenantId = TenantContextHolder.getTenantId();
        Long postId = event.getPostId();
        String postSlug = event.getPostSlug();
        String postType = event.getPostType();

        // 1. 删除该文章的详情页文件（每种语言）
        List<LanguageDO> languages = languageService.getLanguageList();
        for (LanguageDO lang : languages) {
            String path = lang.getSlug() + "/" + postType + "/" + postSlug + ".html";
            fileWriter.deleteFile(tenantId, path);
        }

        // 2. 重新渲染列表页（同 onPostSaved 的步骤 2）
        // 列表页渲染时会自动清理多余的分页文件
        // ...（代码同上）
    }
}
```

### 6.3 ProductRenderEventListener

产品的生命周期与文章不同：产品通过**状态切换**（上架/下架）来控制可见性，而非发布/取消发布。

```java
@Component
@Slf4j
public class ProductRenderEventListener {

    @Resource
    private RenderDependencyService dependencyService;
    @Resource
    private SiteRenderService renderService;
    @Resource
    private RenderQueue renderQueue;
    @Resource
    private RenderFileWriter fileWriter;
    @Resource
    private LanguageService languageService;

    /**
     * 监听产品上架/更新事件
     * 产品状态变为 ENABLE(1) 或已上架产品内容更新时触发
     */
    @EventListener
    public void onProductEnabled(ProductSpuStatusChangeEvent event) {
        Long tenantId = TenantContextHolder.getTenantId();
        Long spuId = event.getSpuId();

        if (!ProductSpuStatusEnum.isEnable(event.getNewStatus())) {
            return; // 非上架状态由 onProductDisabled 处理
        }

        // 1. 渲染该产品的详情页
        renderQueue.submit(tenantId, "product-detail:" + spuId, () -> {
            RenderDependencyDO detailDep = dependencyService
                .findByComponentType(tenantId, "product-detail");
            if (detailDep != null) {
                renderService.renderCollectionPage(
                    tenantId, detailDep.getPageId(), "product", spuId);
            }
        });

        // 2. 重新渲染所有引用了 product 数据的列表页
        List<RenderDependencyDO> listDeps = dependencyService
            .findAllByDataType(tenantId, "product");
        for (RenderDependencyDO dep : listDeps) {
            String taskKey = dep.getComponentType() + ":" + dep.getOutputPath();
            renderQueue.submit(tenantId, taskKey, () -> {
                if ("collection".equals(dep.getPageMode())) return;
                if ("product-list".equals(dep.getComponentType())) {
                    renderService.renderListPages(tenantId, dep.getPageId(), dep);
                } else {
                    renderService.renderSinglePage(tenantId, dep.getPageId());
                }
            });
        }
    }

    /**
     * 监听产品下架/删除事件
     * 产品状态变为 DISABLE(0) 或 RECYCLE(-1) 时触发
     */
    @EventListener
    public void onProductDisabled(ProductSpuStatusChangeEvent event) {
        Long tenantId = TenantContextHolder.getTenantId();
        Long spuId = event.getSpuId();

        if (ProductSpuStatusEnum.isEnable(event.getNewStatus())) {
            return;
        }

        // 1. 删除该产品的详情页文件（每种语言）
        List<LanguageDO> languages = languageService.getLanguageList();
        for (LanguageDO lang : languages) {
            String path = lang.getSlug() + "/products/" + spuId + ".html";
            fileWriter.deleteFile(tenantId, path);
        }

        // 2. 重新渲染列表页（同 onProductEnabled 的步骤 2）
        // ...（代码同上）
    }
}
```

---

## 七、搜索功能

### 7.1 核心原则

**搜索结果页不需要 SEO**。Google 官方建议站内搜索结果页加 `noindex`。因此搜索功能不走预渲染，直接用前端 + 现有 App API。

### 7.2 实现方式：调用 App API

搜索页是静态 HTML 壳子，搜索行为通过 JS 调用现有 App API 接口。利用 App API 已有的 `type`、`categoryId`、`language` 等参数进行筛选。

```html
<div data-cms-component="search" data-search-type="post">
  <input type="text" id="search-input" placeholder="Search..." />
  <select id="search-type-filter">
    <option value="">All types</option>
    <!-- 渲染时填入类型选项 -->
  </select>
  <button onclick="doSearch()">Search</button>
  <div id="search-results"></div>
</div>

<script>
async function doSearch() {
  const keyword = document.getElementById('search-input').value;
  const type = document.getElementById('search-type-filter').value;
  const params = new URLSearchParams({
    pageNo: 1, pageSize: 20, language: lang
  });
  if (type) params.set('type', type);
  // 利用 App API 已有的筛选能力
  const resp = await fetch('/app-api/content/post/page?' + params, {
    headers: { 'tenant-id': tenantId }
  });
  const data = await resp.json();
  renderResults(data.data.list);
}
</script>
```

在搜索组件的 GrapesJS 属性面板中配置：

| 属性 | 说明 |
|------|------|
| `data-search-type` | 搜索的数据类型：post / media_resource / product |

---

## 八、GrapesJS 前端组件设计

### 8.1 需要注册的组件列表

| 组件 | Block 名称 | 分类 | 编辑器预览 |
|------|-----------|------|-----------|
| 文章列表 | `cms-post-list` | Dynamic Content | 显示 3 条占位文章卡片 |
| 最新文章 | `cms-post-latest` | Dynamic Content | 显示 N 条占位文章 |
| 文章详情 | `cms-post-detail` | Dynamic Content | 显示占位标题+内容 |
| 媒体资源列表 | `cms-media-list` | Dynamic Content | 显示占位媒体网格 |
| 按分类媒体 | `cms-media-category` | Dynamic Content | 显示占位媒体 |
| 媒体资源详情 | `cms-media-detail` | Dynamic Content | 显示占位标题+媒体 |
| 产品列表 | `cms-product-list` | Dynamic Content | 显示占位产品网格（图片+名称+价格） |
| 最新产品 | `cms-product-latest` | Dynamic Content | 显示 N 个占位产品 |
| 产品详情 | `cms-product-detail` | Dynamic Content | 显示占位产品信息+轮播图+SKU |
| 搜索框 | `cms-search` | Dynamic Content | 显示搜索输入框 |
| 分页导航 | `cms-pagination` | Dynamic Content | 显示占位分页链接 |

### 8.2 组件注册模式（以文章列表为例）

```typescript
// blocks/cms-post-list.ts

export function registerPostListBlock(editor: any) {

  // 1. 注册组件类型
  editor.Components.addType('cms-post-list', {
    // 通过 data-cms-component 属性识别已有的 HTML
    isComponent: (el: HTMLElement) =>
      el.getAttribute?.('data-cms-component') === 'post-list',

    model: {
      defaults: {
        tagName: 'div',
        droppable: false, // 不允许往里面拖其他组件
        attributes: {
          'data-cms-component': 'post-list',
          'data-type': 'blog',
          'data-category-id': '',
          'data-page-size': '12',
          'data-pagination': 'static',
          'data-max-pages': '10',
        },
        // 属性面板配置
        traits: [
          {
            type: 'select',
            label: 'Post Type',
            name: 'data-type',
            options: [
              { value: 'blog', name: 'Blog' },
              { value: 'cases', name: 'Cases' },
              { value: 'solutions', name: 'Solutions' },
            ]
          },
          {
            type: 'select',
            label: 'Category',
            name: 'data-category-id',
            options: [] // 动态从 API 加载分类列表
          },
          {
            type: 'number',
            label: 'Items per page',
            name: 'data-page-size',
            default: 12, min: 1, max: 50,
          },
          {
            type: 'select',
            label: 'Pagination Mode',
            name: 'data-pagination',
            options: [
              { value: 'static', name: 'Static Pages (Best for SEO)' },
              { value: 'loadmore', name: 'Load More Button' },
              { value: 'none', name: 'No Pagination' },
            ]
          },
          {
            type: 'number',
            label: 'Max Static Pages',
            name: 'data-max-pages',
            default: 10, min: 1, max: 100,
          },
        ],
        // 编辑器中的预览 HTML
        components: `
          <div class="grid grid-cols-3 gap-4" style="padding: 20px;">
            <div data-cms-repeat="post" class="border rounded p-4">
              <img data-cms-bind-src="post.image"
                   src="https://via.placeholder.com/400x250?text=Post+Image"
                   class="w-full rounded" />
              <h3 data-cms-bind="post.name" class="text-lg font-bold mt-2">
                Post Title
              </h3>
              <p data-cms-bind="post.excerpt" class="text-gray-500 mt-1">
                Post excerpt goes here...
              </p>
              <a data-cms-bind-href="post.url" href="#"
                 class="text-blue-500 mt-2 inline-block">
                Read More →
              </a>
            </div>
          </div>
          <nav data-cms-pagination class="flex gap-2 justify-center mt-4">
            <span class="px-3 py-1 bg-blue-500 text-white rounded">1</span>
            <span class="px-3 py-1 bg-gray-200 rounded">2</span>
            <span class="px-3 py-1 bg-gray-200 rounded">3</span>
          </nav>
        `,
      }
    }
  });

  // 2. 注册到组件面板
  editor.BlockManager.add('cms-post-list', {
    label: 'Post List',
    category: 'Dynamic Content',
    media: '<svg>...</svg>', // 图标
    content: { type: 'cms-post-list' },
  });
}
```

### 8.3 组件注册入口

```typescript
// grapesjs/components/dynamic-content.ts

import { registerPostListBlock } from './cms-post-list'
import { registerPostLatestBlock } from './cms-post-latest'
import { registerPostDetailBlock } from './cms-post-detail'
import { registerMediaListBlock } from './cms-media-list'
import { registerMediaCategoryBlock } from './cms-media-category'
import { registerMediaDetailBlock } from './cms-media-detail'
import { registerProductListBlock } from './cms-product-list'
import { registerProductLatestBlock } from './cms-product-latest'
import { registerProductDetailBlock } from './cms-product-detail'
import { registerSearchBlock } from './cms-search'
import { registerPaginationBlock } from './cms-pagination'

export function registerDynamicContentComponents(editor: any) {
  registerPostListBlock(editor)
  registerPostLatestBlock(editor)
  registerPostDetailBlock(editor)
  registerMediaListBlock(editor)
  registerMediaCategoryBlock(editor)
  registerMediaDetailBlock(editor)
  registerProductListBlock(editor)
  registerProductLatestBlock(editor)
  registerProductDetailBlock(editor)
  registerSearchBlock(editor)
  registerPaginationBlock(editor)
}
```

在 WebBuilder 初始化时调用：

```typescript
// composables/useGrapes.ts 中
import { registerDynamicContentComponents } from '@/grapesjs/components/dynamic-content'

// editor 初始化后
registerDynamicContentComponents(editor)
```

---

## 九、模板引擎集成（Thymeleaf 独立模式）

### 9.1 Maven 依赖

```xml
<!-- pom.xml：tooto-module-cms/tooto-module-content -->
<dependency>
    <groupId>org.thymeleaf</groupId>
    <artifactId>thymeleaf</artifactId>
    <version>3.1.2.RELEASE</version>
</dependency>
```

### 9.2 TemplateRenderer 实现

渲染引擎分两步工作：
1. **预处理**：将 `data-cms-*` 属性转换为 Thymeleaf 语法
2. **渲染**：用 Thymeleaf 执行模板渲染

```java
@Component
public class TemplateRenderer {

    private final TemplateEngine engine;

    public TemplateRenderer() {
        this.engine = new TemplateEngine();
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        engine.setTemplateResolver(resolver);
    }

    /**
     * 渲染模板
     *
     * @param templateHtml  含 data-cms-* 标记的 HTML
     * @param data          数据（posts、pagination 等）
     * @param ctx           渲染上下文
     * @return 渲染后的干净 HTML
     */
    public String render(String templateHtml, Map<String, Object> data, RenderContext ctx) {
        // 1. 预处理：data-cms-* → Thymeleaf 语法
        String thymeleafHtml = preprocess(templateHtml);

        // 2. 准备上下文
        Context context = new Context();
        context.setVariables(data);
        context.setVariable("lang", ctx.getLanguageSlug());
        context.setVariable("langCode", ctx.getLanguageCode());

        // 3. 渲染
        return engine.process(thymeleafHtml, context);
    }

    /**
     * 预处理：将 data-cms-* 转为 Thymeleaf 语法
     *
     * 转换规则：
     * data-cms-repeat="post"           → th:each="post : ${posts}"
     * data-cms-bind="post.name"        → th:text="${post.name}"
     * data-cms-html="post.content"     → th:utext="${post.content}"
     * data-cms-bind-src="post.image"   → th:src="${post.image}"
     * data-cms-bind-href="post.url"    → th:href="${post.url}"
     * data-cms-bind-alt="post.name"    → th:alt="${post.name}"
     * data-cms-bind-content="post.x"   → th:content="${post.x}"  (for meta tags)
     * data-cms-if="post.image"         → th:if="${post.image}"
     * data-cms-format="yyyy-MM-dd"     → 配合 th:text 使用日期格式化
     * data-cms-component="..."         → 移除（仅用于解析阶段）
     * data-cms-pagination              → 替换为分页 HTML fragment
     */
    private String preprocess(String templateHtml) {
        // 使用 Jsoup 解析和转换 HTML
        // 具体实现见 TemplateParser.java
        return TemplateParser.convertToThymeleaf(templateHtml);
    }
}
```

### 9.3 TemplateParser：HTML 标记解析与转换

```java
@Component
public class TemplateParser {

    /**
     * 解析 HTML 中的所有动态组件声明
     * 返回组件描述列表（用于构建依赖关系）
     */
    public List<ComponentDescriptor> parse(String html) {
        Document doc = Jsoup.parse(html);
        List<ComponentDescriptor> components = new ArrayList<>();

        doc.select("[data-cms-component]").forEach(el -> {
            ComponentDescriptor comp = new ComponentDescriptor();
            comp.setType(el.attr("data-cms-component"));
            comp.setAttributes(extractDataAttributes(el));
            components.add(comp);
        });

        return components;
    }

    /**
     * 将 data-cms-* 标记转换为 Thymeleaf 语法
     */
    public static String convertToThymeleaf(String html) {
        Document doc = Jsoup.parse(html);

        // 处理循环
        doc.select("[data-cms-repeat]").forEach(el -> {
            String varName = el.attr("data-cms-repeat");
            String collectionName = varName + "s"; // post → posts
            el.attr("th:each", varName + " : ${" + collectionName + "}");
            el.removeAttr("data-cms-repeat");
        });

        // 处理文本绑定
        doc.select("[data-cms-bind]").forEach(el -> {
            String field = el.attr("data-cms-bind");
            String format = el.attr("data-cms-format");
            if (!format.isEmpty()) {
                el.attr("th:text",
                    "${#temporals.format(" + field + ", '" + format + "')}");
                el.removeAttr("data-cms-format");
            } else {
                el.attr("th:text", "${" + field + "}");
            }
            el.removeAttr("data-cms-bind");
        });

        // 处理 HTML 绑定（富文本）
        doc.select("[data-cms-html]").forEach(el -> {
            el.attr("th:utext", "${" + el.attr("data-cms-html") + "}");
            el.removeAttr("data-cms-html");
        });

        // 处理属性绑定 data-cms-bind-{attr}
        for (String attr : List.of("src", "href", "alt", "content")) {
            doc.select("[data-cms-bind-" + attr + "]").forEach(el -> {
                el.attr("th:" + attr, "${" + el.attr("data-cms-bind-" + attr) + "}");
                el.removeAttr("data-cms-bind-" + attr);
            });
        }

        // 处理条件渲染
        doc.select("[data-cms-if]").forEach(el -> {
            el.attr("th:if", "${" + el.attr("data-cms-if") + "}");
            el.removeAttr("data-cms-if");
        });

        // 移除组件容器标记（渲染后不需要）
        doc.select("[data-cms-component]").forEach(el ->
            el.removeAttr("data-cms-component"));

        // 移除其他配置属性
        for (String configAttr : List.of("data-type", "data-limit", "data-page-size",
                "data-pagination", "data-max-pages", "data-category", "data-category-id",
                "data-resource-type", "data-sort-field",
                "data-sort-asc", "data-search-type")) {
            doc.select("[" + configAttr + "]").forEach(el ->
                el.removeAttr(configAttr));
        }

        // 处理分页导航占位
        doc.select("[data-cms-pagination]").forEach(el -> {
            el.removeAttr("data-cms-pagination");
            // 替换为 Thymeleaf 分页 fragment
            el.html(PAGINATION_FRAGMENT);
        });

        return doc.html();
    }

    private static final String PAGINATION_FRAGMENT = """
        <th:block th:if="${pagination != null}">
          <a th:if="${pagination.hasPrev}"
             th:href="${pagination.prevUrl}" rel="prev">&laquo; Prev</a>
          <th:block th:each="p : ${pagination.pageNumbers}">
            <a th:href="${p.url}"
               th:classappend="${p.active ? 'active' : ''}"
               th:text="${p.number}">1</a>
          </th:block>
          <a th:if="${pagination.hasNext}"
             th:href="${pagination.nextUrl}" rel="next">Next &raquo;</a>
        </th:block>
        """;
}
```

---

## 十、文件输出目录结构

```
/opt/ws/tenant/{tenantId}/
│
├── index.html                          ← 首页（可能含 post-latest 等动态组件，预渲染）
├── about-us.html                       ← 纯静态或含动态组件
├── contact.html
├── style.css
│
├── en/                                 ← 英文（按语言 slug 分目录）
│   ├── blog/                           ← 文章类型 = blog
│   │   ├── index.html                  ← 列表第 1 页
│   │   ├── page/
│   │   │   ├── 2.html
│   │   │   └── 3.html
│   │   ├── spring-is-coming.html       ← 详情页（按 slug 命名）
│   │   └── my-first-post.html
│   ├── cases/                          ← 文章类型 = cases
│   │   ├── index.html
│   │   └── success-story.html
│   ├── gallery/                        ← 媒体资源
│   │   ├── index.html
│   │   └── product-photos.html
│   ├── products/                       ← 产品列表与详情
│   │   ├── index.html                  ← 列表第 1 页
│   │   ├── page/
│   │   │   ├── 2.html
│   │   │   └── 3.html
│   │   ├── 101.html                    ← 产品详情页（按 SPU ID 命名）
│   │   └── 102.html
│   └── ...
│
├── zh/                                 ← 中文
│   ├── blog/
│   │   ├── index.html
│   │   └── ...
│   └── ...
│
└── hk/                                 ← 其他语言
    └── ...
```

---

## 十一、Nginx 路由配置

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.example\.com$;

    # 根据域名解析租户（需配合域名映射表或 Lua 脚本）
    set $tenant_id 1;
    root /opt/ws/tenant/$tenant_id;

    # 静态资源
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2?|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 多语言动态内容路由
    # 列表页：/en/blog/ → /en/blog/index.html
    # 分页：  /en/blog/page/2 → /en/blog/page/2.html
    # 详情页：/en/blog/my-post → /en/blog/my-post.html
    location ~ ^/([\w-]+)/([\w-]+)(?:/page/(\d+))?/?$ {
        set $lang $1;
        set $section $2;
        set $page_num $3;

        if ($page_num) {
            rewrite ^ /$lang/$section/page/$page_num.html break;
        }
        try_files /$lang/$section/index.html =404;
    }

    location ~ ^/([\w-]+)/([\w-]+)/([\w-]+)/?$ {
        try_files /$1/$2/$3.html /$1/$2/$3/index.html =404;
    }

    # 站点主页面（非多语言）
    location / {
        try_files $uri $uri.html $uri/index.html =404;
    }

    # App API 代理（搜索、询盘等少量动态请求）
    location /app-api/ {
        proxy_pass http://127.0.0.1:48080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 禁止访问内部文件
    location ~ /\. { deny all; }

    # 自定义 404 页面
    error_page 404 /404.html;
}
```

---

## 十二、开发任务拆分

### 第一阶段：渲染引擎核心（后端）

| # | 任务 | 产出文件 | 依赖 |
|---|------|---------|------|
| 1 | 建表：cms_render_dependency, cms_render_task | SQL 脚本 | 无 |
| 2 | RenderContext, PaginationInfo, ComponentDescriptor 模型类 | model/*.java | 无 |
| 3 | TemplateParser：解析 data-cms-* 属性，转换为 Thymeleaf 语法 | TemplateParser.java | Jsoup |
| 4 | TemplateRenderer：Thymeleaf 独立模式渲染 | TemplateRenderer.java | Thymeleaf |
| 5 | RenderFileWriter：文件写入 + 过期清理 | RenderFileWriter.java | 无 |
| 6 | TemplateCache：Redis 模板缓存 | TemplateCache.java | Redis |
| 7 | RenderQueue：防抖任务队列 | RenderQueue.java | 无 |
| 8 | ComponentHandler 接口 + PostListHandler + PostLatestHandler + PostDetailHandler | handler/*.java | 1~4 |
| 9 | MediaListHandler + MediaByCategoryHandler + MediaDetailHandler | handler/*.java | 1~4 |
| 10 | ProductListHandler + ProductLatestHandler + ProductDetailHandler | handler/*.java | 1~4 |
| 11 | SiteRenderService：渲染入口（单页、集合页、列表分页） | SiteRenderService.java | 全部 |
| 12 | RenderDependencyService：依赖解析与管理 | RenderDependencyService.java | 1 |

### 第二阶段：事件集成（后端）

| # | 任务 | 产出文件 | 依赖 |
|---|------|---------|------|
| 13 | PostRenderEventListener：监听文章发布/更新/删除 | event/PostRenderEventListener.java | 11, 12 |
| 14 | MediaResourceRenderEventListener：监听媒体资源变更 | event/MediaResourceRenderEventListener.java | 11, 12 |
| 15 | ProductRenderEventListener：监听产品上下架/更新 | event/ProductRenderEventListener.java | 11, 12 |
| 16 | PageServiceImpl 改造：发布模板时解析依赖 + 触发首次渲染 | 修改 PageServiceImpl.java | 11, 12 |
| 17 | RenderTaskService：任务状态追踪、失败重试 | RenderTaskService.java | 7, 1 |

### 第三阶段：GrapesJS 组件（前端）

| # | 任务 | 产出文件 | 依赖 |
|---|------|---------|------|
| 18 | 文章列表组件（含分页导航） | cms-post-list.ts | 无 |
| 19 | 最新文章组件 | cms-post-latest.ts | 无 |
| 20 | 文章详情组件 | cms-post-detail.ts | 无 |
| 21 | 媒体资源列表组件 | cms-media-list.ts | 无 |
| 22 | 按分类媒体组件 | cms-media-category.ts | 无 |
| 23 | 媒体资源详情组件 | cms-media-detail.ts | 无 |
| 24 | 产品列表组件（含分类筛选、排序、分页） | cms-product-list.ts | 无 |
| 25 | 最新产品组件 | cms-product-latest.ts | 无 |
| 26 | 产品详情组件（含轮播图、SKU 选择） | cms-product-detail.ts | 无 |
| 27 | 搜索组件（调用 App API） | cms-search.ts | 无 |
| 28 | 分页导航组件 | cms-pagination.ts | 无 |
| 29 | 组件注册入口 + WebBuilder 集成 | dynamic-content.ts | 18~28 |

### 第四阶段：部署与配置

| # | 任务 | 说明 |
|---|------|------|
| 30 | Nginx 路由配置 | 多语言、分页、详情页路由 |
| 31 | 性能测试 | 验证大数据量渲染耗时 |
| 32 | 端到端测试 | 从编辑器设计 → 发布内容 → 访客查看 |
