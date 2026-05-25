# 分类列表循环模板化方案

## Summary

- 最终渲染仍是一份完整分类列表模板，和现有链路一致；区别只是发布/渲染前会把“列表整体模板”和“循环体模板”拼成同一份 HTML，再继续走 `data-cms-repeat`/Thymeleaf。
- 循环内容不再固定为文章、产品、媒体实体，也支持分类循环和产品分类详情上下文内容；循环体模板按循环内容类型强约束匹配。
- 循环体模板统一放到一个独立 tab 管理，不和分类列表 tab 混在一起；该 tab 内用“循环体类型”列区分文章、文章分类、产品、产品分类、媒体、媒体分类等循环体。
- `Loop Grid` 是统一循环组件入口，编辑器提供 WordPress Query Loop 风格配置，发布时映射到现有 `post-list`、`product-list`、`media-list` 和产品分类上下文 `context-loop` 后端预渲染协议。

## Key Changes

- 模板管理新增一个统一 tab：`循环体`，资源类型为 `TEMP_LOOP_ITEM`。
- `循环体` tab 单独增加“循环体类型”列，列为：`版本ID、循环体类型、资源标识、版本号、创建时间、更新时间、操作`。
- `TEMP_LOOP_ITEM` 资源用 `extJson.loopItemType` 区分循环体类型：
  - `post`：文章循环体。
  - `postCategory`：文章分类循环体。
  - `product`：产品循环体。
  - `productCategory`：产品分类循环体。
  - `productCategoryFaq`：产品分类 FAQ 循环体，绑定 `productCategory.faqs`。
  - `media`：媒体循环体。
  - `mediaCategory`：媒体分类循环体。
- 新建循环体模板时在 `循环体` tab 内选择循环体类型；后续新增其他可循环实体时只扩展该枚举，不新增 tab。
- 分类列表组件增加循环配置：
  - 循环内容：文章、产品、媒体、文章分类、产品分类、媒体分类。
  - 分类循环模式：一级分类、指定父级的直接下级、指定父级下所有子分类平铺、当前分类直接下级、当前分类下所有子分类平铺。
  - “指定父级”模式未填写父级 ID 时，在分类详情页自动以当前分类 ID 作为父级；例如一级分类页可用该模式空父级输出自己的二级分类。
  - 分类点击效果：进入下一级分类列表，或进入该分类的产品/内容列表。
- 分类列表模板规则的“分类层级”按分类自身层级匹配：一级分类无父级，二级分类有 1 个父级，三级分类有 2 个父级，依次类推；规则面板固定提供一级到五级分类选项，并保存到 `conditions.levels`。
- 分类列表模板发布按当前模板资源收敛渲染范围：发布某个 TEMP 分类模板或其 OWNED 模板规则时，只重渲染最佳匹配到该模板 `resourceId` 的分类页面；共享/旧版规则发布才触发全模板重算。
- 循环体模板选择器按循环内容过滤：产品分类列表选择“产品分类”循环内容时只能选产品分类循环体，选择“产品”循环内容时只能选产品循环体。
- `Loop Grid` 支持同一组循环内容，并在发布 HTML 中输出标准 CMS 属性：
  - `post` / `postCategory` 输出 `data-cms-component="post-list"`。
  - `product` / `productCategory` 输出 `data-cms-component="product-list"`。
  - `media` / `mediaCategory` 输出 `data-cms-component="media-list"`。
  - 产品分类 FAQ 输出 `data-cms-component="context-loop"`，只消费当前产品分类详情上下文，不创建独立列表分页。
  - 产品分类 Application / Engineering / Challenges 仍使用 `post` 文章循环体；Loop Grid 通过“产品分类上下文来源”选择具体集合，并输出 `post@productCategory.applicationPosts`、`post@productCategory.engineeringPosts` 或 `post@productCategory.challengePosts`。
  - `itemsPerPage`、分页类型、最大页数、循环体资源 ID、分类循环模式、点击目标、媒体资源类型、产品排序均同步为后端现有 `data-*` 配置。
- `Loop Grid` 属性面板只展示已经贯通预览、发布和后端渲染的基础能力；未实现完整后端协议的 Source Type、Query Mode、备用模板、空模板、标签/作者/日期过滤、无限滚动等高级选项不展示。mediaCategory 是扁平分类，分类循环参数在媒体分类下按扁平分类兜底处理。
- `TEMP_LOOP_ITEM` 模板设置里，产品分类上下文循环体的预览数据选择器使用产品分类 ID；画布预览会读取该分类配置的 FAQ 分类和关联文章。

## Loop Item Fields

循环体类型由 `TEMP_LOOP_ITEM.extJson.loopItemType` 决定。GrapesJS 动态字段下拉必须按该类型过滤，只展示后端列表渲染数据实际提供的字段。字段来源以 `PostListHandler`、`ProductListHandler`、`MediaListHandler` 构造的列表项 DTO / Map 为准，再由 `TemplateParser` 把 `data-cms-bind*` 转成 Thymeleaf 表达式。

循环体模板发布时后端只抽取 `[data-wb-loop-item-root]` 节点作为循环项注入列表容器，因此动态字段必须放在循环体根节点内部；根节点外的组件不会进入最终循环项。

### `post`：文章循环体

用于文章列表循环项，循环变量为 `post`，可绑定字段：

- `post.id`：文章 ID，数字。
- `post.name`：文章标题，文本。
- `post.slug`：文章 Slug，文本。
- `post.excerpt`：摘要，文本。
- `post.content`：正文 HTML，HTML。
- `post.publishTime`：发布时间，日期。
- `post.image`：封面图，图片。
- `post.imageAlt`：封面图 alt，文本。
- `post.coverWidth`：封面图宽度，数字。
- `post.coverHeight`：封面图高度，数字。
- `post.url`：文章详情 URL，链接。
- `post.typeCode`：文章类型 Code，文本。
- `post.typeName`：文章类型名称，文本。
- `post.views`：浏览量，数字。
- `post.author`：作者，文本。
- `post.metaKeywords`：SEO keywords，文本。
- `post.metaDescription`：SEO description，文本。

### `postCategory`：文章分类循环体

用于文章分类列表循环项，循环变量为 `postCategory`，可绑定字段：

- `postCategory.id`：文章分类 ID，数字。
- `postCategory.parentId`：父级分类 ID，数字。
- `postCategory.code`：文章分类 Code，文本。
- `postCategory.name`：文章分类名称，文本。
- `postCategory.description`：文章分类描述，文本。
- `postCategory.url`：文章分类 URL，链接。
- `postCategory.clickTarget`：点击目标，文本。

### `product`：产品循环体

用于产品列表循环项，循环变量为 `product`，可绑定字段：

- `product.id`：产品 ID，数字。
- `product.name`：产品名称，文本。
- `product.slug`：产品 Slug，文本。
- `product.brandName`：品牌，文本。
- `product.categoryName`：产品分类名称，文本。
- `product.introduction`：简介，文本。
- `product.keyword`：产品关键字，文本。
- `product.description`：详细描述，HTML。
- `product.picUrl`：主图，图片。
- `product.price`：价格，数字。
- `product.marketPrice`：市场价，数字。
- `product.priceFormatted`：格式化价格，文本。
- `product.stock`：库存，数字。
- `product.salesCount`：销量，数字。
- `product.url`：产品详情 URL，链接。
- `product.buyNowUrl`：立即购买 URL，链接。
- `product.buyNowTarget`：立即购买 target，文本。

### `productCategory`：产品分类循环体

用于产品分类列表循环项，循环变量为 `productCategory`，可绑定字段：

- `productCategory.id`：产品分类 ID，数字。
- `productCategory.parentId`：父级分类 ID，数字。
- `productCategory.code`：产品分类 Code，文本。
- `productCategory.name`：产品分类名称，文本。
- `productCategory.description`：产品分类描述，文本。
- `productCategory.image`：产品分类图片，图片。
- `productCategory.picUrl`：产品分类图片 URL，图片。
- `productCategory.url`：产品分类 URL，链接。
- `productCategory.productCount`：产品数量，数字。
- `productCategory.clickTarget`：点击目标，文本。

### `productCategoryFaq`：产品分类 FAQ 循环体

用于产品分类详情页 FAQ 循环项，循环变量为 `faq`，可绑定字段：

- `faq.id`：FAQ ID，数字。
- `faq.question`：问题，文本。
- `faq.answer`：答案纯文本，文本。
- `faq.answerHtml`：答案 HTML，HTML。

### 产品分类 Application / Engineering / Challenges 文章集合

这些内容本质是文章，不单独创建循环体类型；在 Loop Grid 中选择 `post` 文章循环体，再把“产品分类上下文来源”设置为 Application / Engineering / Challenges。发布后循环变量仍为 `post`，可直接复用文章循环体中的 `post.*` 绑定字段：

- `post.id`：文章 ID，数字。
- `post.name`：文章标题，文本。
- `post.slug`：文章 Slug，文本。
- `post.excerpt`：摘要，文本。
- `post.publishTime`：发布时间，日期。
- `post.image`：封面图，图片。
- `post.imageAlt`：封面图 alt，文本。
- `post.url`：文章详情 URL，链接。
- `post.typeCode`：文章类型 Code，文本。
- `post.typeName`：文章类型名称，文本。

### `media`：媒体循环体

用于媒体资源列表循环项，循环变量为 `media`，可绑定字段：

- `media.id`：媒体 ID，数字。
- `media.title`：媒体标题，文本。
- `media.description`：媒体描述，文本。
- `media.slug`：媒体 Slug，文本。
- `media.type`：媒体类型，文本。
- `media.url`：原始资源 URL，链接。
- `media.coverUrl`：封面图，图片。
- `media.altText`：封面图 alt，文本。
- `media.categoryCode`：媒体分类 Code，文本。
- `media.detailUrl`：媒体详情 URL，链接。
- `media.publishTime`：发布时间，日期。
- `media.seoTitle`：SEO 标题，文本。
- `media.seoDescription`：SEO description，文本。
- `media.seoKeywords`：SEO keywords，文本。

### `mediaCategory`：媒体分类循环体

当前枚举已包含媒体分类循环体，循环变量为 `mediaCategory`，可绑定字段：

- `mediaCategory.id`：媒体分类 ID，数字。
- `mediaCategory.code`：媒体分类 Code，文本。
- `mediaCategory.name`：媒体分类名称，文本。
- `mediaCategory.description`：媒体分类描述，文本。
- `mediaCategory.url`：媒体分类 URL，链接。
- `mediaCategory.clickTarget`：点击目标，文本。

## Render Flow

- 发布分类列表整体模板时，前端保留列表组件配置、循环内容类型、循环体模板引用，不把列表固定成静态卡片。
- 发布 `Loop Grid` 时，前端只把编辑器预览作为画布表现；导出的 HTML 必须是标准 `data-cms-component`、`data-cms-repeat`、`data-cms-pagination` 模板结构。
- 后端解析整体模板，按组件配置找到循环体模板的最新 release 版本，把循环体注入列表容器。
- 注入后仍生成标准 `data-cms-repeat` 结构，例如产品分类循环使用 `productCategory@productCategories`。
- 产品分类详情上下文循环不独立查询分页数据，后端把循环体注入为：
  - `faq@productCategory.faqs`
  - `post@productCategory.applicationPosts`
  - `post@productCategory.engineeringPosts`
  - `post@productCategory.challengePosts`
- 分类列表页面渲染前先根据模板规则匹配整体模板；产品分类列表规则使用当前分类的 `categoryId`、`rootCategoryId`、`level`，其中 `level = 1..5` 分别对应一级到五级分类。
- 若一级分类页面需要输出自己的二级分类卡片，整体模板规则用 `levels = 1` 命中一级分类页面，Loop Grid 分类循环模式可使用“当前分类直接下级”；若使用“指定父级的直接下级”且父级 ID 留空，发布时也会由合成依赖注入当前 `categoryId` 作为父级。
- 发布单个分类列表模板时不会顺带发布同类型其它模板命中的分类页面；不匹配当前模板资源的分类会跳过，避免一次模板发布生成产品详情页或其它层级分类页。
- 后续继续使用现有模板解析、分页、语言链接改写和文件写出链路。
- 发布循环体模板时，不参与模板规则匹配，只触发引用它的分类列表页面重渲染；缺少精确引用索引时先按同循环体类型重渲染相关分类列表。

## Test Plan

- 前端验收：循环体 tab、循环体类型列、新建循环体类型、名称搜索、分类列表组件循环配置、循环体模板过滤、产品分类上下文循环体预览。
- 后端验收：整体模板发布、循环体模板发布、分类循环查询、产品分类上下文 repeat 表达式、点击目标 URL、fallback 逻辑。
- 场景验收：产品分类页循环一级分类、指定父级子分类、平铺子分类；切换点击效果后前台链接正确。
- 兼容验收：未选择循环体模板时继续使用现有默认卡片，旧分类列表模板可正常发布。

## Assumptions

- 模板规则只匹配详情模板和分类列表整体模板；`TEMP_LOOP_ITEM` 通过组件引用选择。
- 循环体模板是 fragment/card，不包含完整页面结构。
- 分类循环能力三类统一建模，产品分类先覆盖完整路径，文章/媒体分类按同一模型接入。
