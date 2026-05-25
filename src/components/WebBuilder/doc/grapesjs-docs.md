# GrapesJS 完整文档

> 整合自 [https://grapesjs.com/docs/](https://grapesjs.com/docs/)，包含所有模块与指南的完整内容。

---

## 目录

- [简介](#简介)
  - [什么是 GrapesJS](#什么是-grapesjs)
  - [为什么选择 GrapesJS](#为什么选择-grapesjs)
  - [快速开始](#快速开始)
  - [安装](#安装)
- [入门指南](#入门指南)
  - [画布设置](#画布设置)
  - [Blocks 系统](#blocks-系统)
  - [Components 概念](#components-概念)
  - [UI 面板与按钮](#ui-面板与按钮)
  - [Layers 面板](#layers-面板)
  - [Style Manager](#style-manager入门)
  - [Traits](#traits入门)
  - [响应式设计](#响应式设计)
  - [存储配置](#存储配置)
  - [主题定制](#主题定制)
- [模块：Components（组件）](#模块components组件)
  - [核心概念](#核心概念)
  - [内置组件类型](#内置组件类型)
  - [创建自定义组件](#创建自定义组件)
  - [关键方法](#关键方法)
  - [生命周期钩子](#生命周期钩子)
  - [高级特性](#高级特性)
- [模块：Components & JS（组件与脚本）](#模块components--js组件与脚本)
  - [基础脚本](#基础脚本)
  - [重要注意事项](#重要注意事项)
  - [向脚本传递属性](#向脚本传递属性)
  - [外部依赖处理](#外部依赖处理)
- [模块：Traits（特征）](#模块traits特征)
  - [核心概念-traits](#核心概念-traits)
  - [内置 Trait 类型](#内置-trait-类型)
  - [关键特性](#关键特性)
  - [自定义 Trait 类型](#自定义-trait-类型)
  - [国际化支持](#国际化支持)
- [模块：Blocks（区块）](#模块blocks区块)
  - [概述](#概述)
  - [配置与初始化](#配置与初始化)
  - [区块内容类型](#区块内容类型)
  - [重要注意事项-blocks](#重要注意事项-blocks)
  - [编程接口](#编程接口)
  - [自定义 UI](#自定义-ui)
- [模块：Assets（资源）](#模块assets资源)
  - [核心功能](#核心功能)
  - [配置区域](#配置区域)
  - [文件上传](#文件上传)
  - [事件系统](#事件系统)
  - [编程控制](#编程控制)
  - [自定义资源管理器](#自定义资源管理器)
- [模块：Commands（命令）](#模块commands命令)
  - [核心概念-commands](#核心概念-commands)
  - [有状态命令](#有状态命令)
  - [内置命令](#内置命令)
  - [扩展与事件](#扩展与事件)
- [模块：I18n（国际化）](#模块i18n国际化)
  - [基本配置](#基本配置)
  - [更新字符串](#更新字符串)
  - [添加新语言](#添加新语言)
  - [插件开发中的国际化](#插件开发中的国际化)
- [模块：Selectors（选择器）](#模块selectors选择器)
  - [用途](#用途)
  - [主要功能](#主要功能)
  - [配置与设置](#配置与设置)
  - [组件优先选择器](#组件优先选择器)
  - [自定义选择器 UI](#自定义选择器-ui)
- [模块：Layers（图层）](#模块layers图层)
  - [配置](#配置)
  - [编程使用](#编程使用)
  - [自定义图层 UI](#自定义图层-ui)
  - [重要说明](#重要说明)
- [模块：Pages（页面）](#模块pages页面)
  - [简介-pages](#简介-pages)
  - [初始化](#初始化)
  - [编程接口-pages](#编程接口-pages)
  - [自定义 UI-pages](#自定义-ui-pages)
- [模块：Style Manager（样式管理器）](#模块style-manager样式管理器)
  - [配置与初始化-sm](#配置与初始化-sm)
  - [属性类型](#属性类型)
  - [组件约束](#组件约束)
  - [编程 API](#编程-api)
  - [自定义选项](#自定义选项)
- [模块：Storage Manager（存储管理器）](#模块storage-manager存储管理器)
  - [配置](#配置-storage)
  - [项目数据](#项目数据)
  - [存储策略](#存储策略)
  - [本地存储](#本地存储)
  - [远程存储](#远程存储)
  - [Storage API](#storage-api)
  - [常用场景](#常用场景)
- [模块：Modal（弹窗）](#模块modal弹窗)
  - [基本用法](#基本用法)
  - [API 方法](#api-方法)
  - [自定义选项-modal](#自定义选项-modal)
  - [自定义弹窗实现](#自定义弹窗实现)
- [模块：Plugins（插件）](#模块plugins插件)
  - [基本插件结构](#基本插件结构)
  - [带选项的插件](#带选项的插件)
  - [TypeScript 支持](#typescript-支持)
  - [开发工具](#开发工具)
- [指南：Symbols（符号）](#指南symbols符号)
  - [概念](#概念)
  - [编程使用-symbols](#编程使用-symbols)
  - [事件](#事件)
  - [实现说明](#实现说明)
- [指南：替换富文本编辑器](#指南替换富文本编辑器)
  - [核心实现](#核心实现)
  - [重要细节](#重要细节)
- [指南：使用自定义 CSS 解析器](#指南使用自定义-css-解析器)
  - [导入 HTML/CSS](#导入-htmlcss)
  - [CSSOM 的不一致性](#cssom-的不一致性)
  - [自定义解析器设置](#自定义解析器设置)
  - [规则对象结构](#规则对象结构)
  - [示例规则](#示例规则)
- [指南：GrapesJS 遥测](#指南grapesjs-遥测)
  - [数据收集](#数据收集)
  - [数据用途](#数据用途)
  - [退出遥测](#退出遥测)

---

## 简介

### 什么是 GrapesJS

GrapesJS 是一个 Web 构建框架，专为创建拖放编辑器而设计。它并不局限于网页，而是一个多用途工具，可用于任何类 HTML 结构——包括新闻简报、移动应用、桌面应用和 PDF。

该框架让开发者能够为终端用户构建强大的编辑器，用户无需任何编码知识即可创建复杂的模板。

### 为什么选择 GrapesJS

GrapesJS 最初是为 CMS 系统设计的，旨在替代传统的 WYSIWYG 编辑器，后来演变为适合各种应用场景的可扩展框架，超越了内容管理的范畴。

### 快速开始

GrapesJS 提供三种预设实现：

- **Webpage Builder preset** — 网页构建预设
- **Newsletter Builder preset** — 新闻简报构建预设
- **MJML-based Newsletter Builder** — 基于 MJML 的新闻简报构建预设

### 安装

**通过 npm：**

```bash
npm i grapesjs
```

**通过 CDN（unpkg 或 cdnjs）：**

```html
<link rel="stylesheet" href="https://unpkg.com/grapesjs/dist/css/grapes.min.css">
<script src="https://unpkg.com/grapesjs"></script>
```

**通过 Git 克隆：**

```bash
git clone https://github.com/GrapesJS/grapesjs.git
```

---

## 入门指南

### 画布设置

通过 CDN 或 npm 导入 GrapesJS，然后用基础容器初始化编辑器：

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/grapesjs/dist/css/grapes.min.css">
</head>
<body>
  <div id="gjs"></div>
  <script src="https://unpkg.com/grapesjs"></script>
  <script>
    const editor = grapesjs.init({
      container: '#gjs',
      fromElement: true,
      height: '100vh',
      width: 'auto',
    });
  </script>
</body>
</html>
```

### Blocks 系统

Blocks 是用户可以拖入画布的可复用内容片段。通过 `BlockManager` 的 `appendTo` 和 `blocks` 属性来配置：

```javascript
const editor = grapesjs.init({
  // ...
  blockManager: {
    appendTo: '#blocks',
    blocks: [
      {
        id: 'section',
        label: '<b>Section</b>',
        attributes: { class: 'gjs-block-section' },
        content: `<section>
          <h1>This is a simple title</h1>
          <div>This is just a Lorem text</div>
        </section>`,
      },
      {
        id: 'text',
        label: 'Text',
        content: '<div data-gjs-type="text">Insert your text here</div>',
      },
      {
        id: 'image',
        label: 'Image',
        select: true,
        content: { type: 'image' },
        activate: true,
      },
    ]
  },
});
```

### Components 概念

当区块被拖入画布时，它们成为 GrapesJS 的 **Component**（组件）。组件对象包含：
- **View（视图）**：渲染逻辑
- **Model（模型）**：导出数据

视图和模型可以完全解耦——组件在画布中显示的内容可以与其存储模型不同。

### UI 面板与按钮

通过面板创建工具栏按钮，按钮可触发命令：

```javascript
const editor = grapesjs.init({
  // ...
  panels: {
    defaults: [
      {
        id: 'layers',
        el: '.panel__right',
        resizable: {
          maxDim: 350,
          minDim: 200,
          tc: false, // Top direction
          cl: true,  // Left direction
          cr: false, // Right direction
          bc: false, // Bottom direction
          keyWidth: 'flex-basis',
        },
      },
      {
        id: 'panel-switcher',
        el: '.panel__switcher',
        buttons: [
          {
            id: 'show-layers',
            active: true,
            label: 'Layers',
            command: 'show-layers',
            togglable: false,
          },
          {
            id: 'show-style',
            active: true,
            label: 'Styles',
            command: 'show-styles',
            togglable: false,
          },
        ],
      }
    ]
  }
});
```

**命令**支持生命周期钩子（`before`、`after`、`abort`），用于全局追踪操作：

```javascript
editor.Commands.add('show-layers', {
  getRowEl(editor) { return editor.getContainer().closest('.editor-row'); },
  getLayersEl(row) { return row.querySelector('.layers-container'); },
  run(editor, sender) {
    const lmEl = this.getLayersEl(this.getRowEl(editor));
    lmEl.style.display = '';
  },
  stop(editor, sender) {
    const lmEl = this.getLayersEl(this.getRowEl(editor));
    lmEl.style.display = 'none';
  },
});
```

### Layers 面板

图层面板提供文档结构的树视图：

```javascript
const editor = grapesjs.init({
  // ...
  layerManager: {
    appendTo: '.layers-container'
  },
});
```

### Style Manager（入门）

样式管理器将 CSS 属性组织为扇区（sectors），支持多种输入类型：

```javascript
const editor = grapesjs.init({
  // ...
  styleManager: {
    appendTo: '.styles-container',
    sectors: [
      {
        name: 'Dimension',
        open: false,
        properties: [
          { name: 'Flex Children', property: 'label-parent-flex', type: 'integer' },
          'width', 'min-width', 'height', 'min-height', 'max-height',
          { name: 'Margin', property: 'margin', type: 'composite', ... }
        ]
      },
      {
        name: 'Typography',
        open: false,
        properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color',
          { property: 'text-align', type: 'radio', ... }
        ]
      }
    ]
  },
});
```

### Traits（入门）

Traits 管理组件的 HTML 属性（如 `placeholder`、`alt`）以及自定义行为：

```javascript
editor.DomComponents.addType('text-component', {
  model: {
    defaults: {
      traits: [
        {
          type: 'text',
          label: 'Placeholder',
          name: 'placeholder',
          placeholder: 'Enter placeholder'
        }
      ]
    }
  }
});
```

### 响应式设计

通过 Device Manager 定义断点并切换视口：

```javascript
const editor = grapesjs.init({
  // ...
  deviceManager: {
    devices: [
      { name: 'Desktop', width: '' },
      { name: 'Mobile', width: '320px', widthMedia: '480px' },
    ]
  },
  mediaCondition: 'max-width', // 默认是 min-width (移动优先)
});
```

### 存储配置

支持本地（localStorage）或远程存储，并可自动保存：

```javascript
const editor = grapesjs.init({
  // ...
  storageManager: {
    type: 'local',
    autosave: true,
    autoload: true,
    stepsBeforeSave: 1,
  },
});
```

### 主题定制

使用原子设计 CSS 类或 CSS 自定义属性修改外观：

```css
/* 通过 CSS 变量定制主题 */
.gjs-one-bg { background-color: #78366a; }
.gjs-two-bg { background-color: #ec5896; }
.gjs-three-bg { background-color: #5e2a4e; }
.gjs-four-bg { background-color: #623d5c; }
```

---

## 模块：Components（组件）

### 核心概念

GrapesJS 将组件视为模板的基础构建块。如文档所述："Component 是模板的基础元素。它可以是简单的原子元素，如图片或文本框，也可以是复杂的结构。"

系统通过以下几个关键阶段运作：

- **组件识别与类型栈（Component Type Stack）**：HTML 被解析时，编辑器遍历已注册的组件类型以识别应分配哪种类型。这个有序列表称为"组件类型栈"，自定义类型优先于内置默认值。
- **Model 与 View**：Model（组件实例）是导出代码的唯一来源，View 负责画布渲染和用户交互。两者可以不同——组件可能导出简单 HTML，但在编辑器中渲染自定义 UI 元素。

### 内置组件类型

GrapesJS 为常见元素提供了专门处理程序：

| 分类 | 类型 |
|------|------|
| 表格相关 | `cell`、`row`、`table`、`thead`、`tbody`、`tfoot` |
| 媒体 | `image`、`video`、`svg` |
| 表单元素 | `label`、`link` |
| 内容 | `text`、`textnode`、`script`、`comment` |
| 容器 | `wrapper`（画布根节点）、`default`（后备） |

### 创建自定义组件

自定义类型通常在插件中定义，以确保在组件初始化前加载。一个最小化示例，注册一个 input 组件：

```javascript
editor.DomComponents.addType('my-input-type', {
  isComponent: (el) => el.tagName === 'INPUT',
  model: {
    defaults: {
      tagName: 'input',
      draggable: 'form, form *',
      droppable: false,
      attributes: { type: 'text', name: 'default-name' },
      traits: ['name', 'placeholder']
    }
  }
});
```

### 关键方法

| 方法 | 说明 |
|------|------|
| `isComponent(el)` | 判断元素是否匹配此组件类型 |
| `model.defaults` | 设置默认属性和特征 |
| `view` | 自定义画布渲染和交互 |
| `traits` | 定义 UI 中可编辑的属性 |

### 生命周期钩子

组件在特定阶段触发钩子：

1. `model.init()` — 模型初始化
2. `component:create` — 组件创建
3. `view.init()` — 视图初始化
4. `view.onRender()` — 视图渲染
5. `component:mount` — 组件挂载
6. `model.updated()` — 模型更新
7. `component:update` — 组件更新事件
8. `model.removed()` — 模型移除
9. `component:remove` — 组件移除事件

### 高级特性

**组件样式**：使用 `styles` 属性将 CSS 与组件捆绑，编辑器将作为一组进行管理。

**JSX 支持**：对于大型 HTML 片段，JSX 语法跳过解析和识别步骤，同时保持可读性，性能更佳：

```jsx
editor.DomComponents.addType('my-component', {
  model: {
    defaults: {
      components: (
        <div>
          <span>Hello World</span>
        </div>
      )
    }
  }
});
```

**扩展（Extension）**：新类型可以使用 `extend` 和 `extendView` 属性继承现有类型，复用父类功能：

```javascript
editor.DomComponents.addType('my-extended-type', {
  extend: 'existing-type',
  model: {
    defaults: {
      // 覆盖父类默认值
    }
  }
});
```

---

## 模块：Components & JS（组件与脚本）

### 基础脚本

组件可以包含自定义脚本，其中 `this` 绑定到组件元素。编辑器将脚本包裹在 IIFE 中，并为组件分配唯一 ID，通过 `querySelectorAll` 执行：

```javascript
editor.DomComponents.addType('my-component', {
  model: {
    defaults: {
      script() {
        // `this` 指向组件的 DOM 元素
        const initLib = () => {
          const el = this;
          // 初始化逻辑
        };

        if (typeof someLibrary === 'undefined') {
          const script = document.createElement('script');
          script.onload = initLib;
          script.src = 'https://cdn.example.com/lib.js';
          document.head.appendChild(script);
        } else {
          initLib();
        }
      },
    }
  }
});
```

### 重要注意事项

脚本在画布的 **iframe 中执行**，与外部库和主文档隔离。在脚本函数外部定义的变量将无法访问——所有依赖必须在函数作用域内处理。

### 向脚本传递属性

使用 `script-props` 属性将组件特征传递给脚本，允许基于用户通过 UI 修改的特征实现动态行为：

```javascript
editor.DomComponents.addType('my-component', {
  model: {
    defaults: {
      myProp: 'default-value',
      'script-props': ['myProp'],
      script({ myProp }) {
        // 使用从 trait 传来的 myProp
        this.setAttribute('data-value', myProp);
      },
      traits: [
        { name: 'myProp', changeProp: true }
      ]
    }
  }
});
```

### 外部依赖处理

**方法 1 — 组件相关依赖**：在脚本内动态加载库，确保依赖只在组件存在时出现在 HTML 中。

**方法 2 — 模板相关依赖**：通过画布配置全局注入脚本/样式，适用于多个组件共享的库。注意：这些不会包含在导出的 HTML 中：

```javascript
const editor = grapesjs.init({
  canvas: {
    scripts: ['https://cdn.example.com/shared-lib.js'],
    styles: ['https://cdn.example.com/shared-styles.css'],
  }
});
```

该指南强调，脚本在编辑器画布和最终导出 HTML 中的行为完全一致，保证开发体验的一致性。

---

## 模块：Traits（特征）

### 核心概念（Traits）

Traits 定义组件参数。默认情况下，组件包含 `id` 和 `title` traits。可以将 traits 定义为字符串（自动转换为 text 类型）或带有特定配置的对象：

```javascript
editor.DomComponents.addType('my-component', {
  model: {
    defaults: {
      traits: [
        'title',                        // 字符串形式（text 类型）
        {
          type: 'text',
          label: 'My Label',
          name: 'my-attribute',
          placeholder: 'Input placeholder',
        }
      ]
    }
  }
});
```

### 内置 Trait 类型

| 类型 | 说明 | 特殊选项 |
|------|------|----------|
| `text` | 简单文本输入 | `placeholder` |
| `number` | 数字输入 | `min`、`max`、`step` |
| `checkbox` | 布尔输入 | `valueTrue`、`valueFalse` |
| `select` | 下拉选择 | `options: [{id, name}]` |
| `color` | 颜色选择器 | — |
| `button` | 可点击元素 | 触发命令 |

**Select 示例：**

```javascript
{
  type: 'select',
  label: 'Align',
  name: 'text-align',
  options: [
    { id: 'left', label: 'Left' },
    { id: 'center', label: 'Center' },
    { id: 'right', label: 'Right' },
  ]
}
```

### 关键特性

**动态 trait 定义**：Traits 可以通过函数基于组件特性动态生成，允许条件性 trait 生成：

```javascript
traits() {
  const result = [{ type: 'text', name: 'placeholder' }];
  if (this.attributes.type === 'checkbox') {
    result.push({ type: 'checkbox', name: 'checked' });
  }
  return result;
}
```

**Trait 绑定**：默认情况下，traits 修改组件属性。使用 `changeProp: 1` 将其绑定到属性（properties）而非 HTML 属性（attributes）：

```javascript
{
  type: 'text',
  name: 'myProp',
  changeProp: true,  // 修改 model property 而非 HTML attribute
}
```

**分类（Categories）**：使用 category 对象将相关 traits 分组：

```javascript
{
  type: 'text',
  name: 'my-trait',
  category: {
    id: 'my-category',
    label: 'My Category',
    open: false,
  }
}
```

**运行时更新**：通过编程方式访问和修改 traits：

```javascript
const component = editor.getSelected();
const trait = component.getTrait('placeholder');
trait.set('value', 'New placeholder');

// 动态添加/移除
component.addTrait({ type: 'text', name: 'new-trait' });
component.removeTrait('old-trait');
```

### 自定义 Trait 类型

通过定义 `createInput()`、`onEvent()` 和 `onUpdate()` 方法创建自定义 trait 类型，可集成 Vue 或 React 等外部 UI 框架：

```javascript
editor.TraitManager.addType('custom-select', {
  createInput({ trait }) {
    // 创建自定义输入元素
    const el = document.createElement('select');
    // ...
    return el;
  },
  onEvent({ elInput, component, event }) {
    // 处理输入事件
    const value = elInput.value;
    component.addAttributes({ [trait.getName()]: value });
  },
  onUpdate({ elInput, component }) {
    // 更新 UI 以反映组件状态
    elInput.value = component.getAttributes()[trait.getName()] || '';
  },
});
```

对于完整 UI 替换，在 trait manager 配置中启用 `custom: true` 并监听 `trait:custom` 事件。

### 国际化支持

I18n 模块通过结构化 schema 支持 trait 翻译，涵盖标签、属性和选项文本：

```javascript
editor.I18n.addMessages({
  zh: {
    traitManager: {
      traits: {
        labels: {
          'my-trait': '我的特征',
        },
      }
    }
  }
});
```

---

## 模块：Blocks（区块）

### 概述

Block Manager 文档说明了区块作为可复用对象如何与 GrapesJS 中的组件关联。区块可以表示单个组件，也可以是多个组件的复杂组合。

### 配置与初始化

Block Manager 设置通过编辑器初始化时的 `blockManager` 属性传递。Block Manager UI 默认隐藏，通过设置 `appendTo` 并定义区块来立即渲染：

```javascript
const editor = grapesjs.init({
  blockManager: {
    appendTo: '#blocks',
    blocks: [
      {
        id: 'my-block-id',
        label: 'Block Label',
        media: `<svg viewBox="0 0 24 24">...</svg>`, // 图标
        content: '<div class="my-block">Content</div>',
      }
    ]
  }
});
```

### 区块内容类型

**1. 组件导向（Component-oriented）**：使用组件定义实现精确控制：

```javascript
{
  id: 'component-block',
  content: {
    type: 'my-component-type',
    style: { color: 'red' },
  }
}
```

**2. HTML 字符串**：接受会被解析为组件的 HTML：

```javascript
{
  id: 'html-block',
  content: '<div class="my-block">Simple HTML</div>',
}
```

**3. 混合方式**：在数组中结合两种方法：

```javascript
{
  id: 'mixed-block',
  content: [
    '<div>HTML part</div>',
    { type: 'my-component', style: { margin: '10px' } }
  ]
}
```

### 重要注意事项（Blocks）

- 避免在区块中放置不可序列化的属性（函数），将这些保留在组件定义中
- 不要在区块内容中直接放置样式，防止序列化问题和样式冲突
- 保持区块内容简洁，复杂逻辑放在组件定义中

### 编程接口

通过 Blocks API 以编程方式添加、获取、更新和移除区块：

```javascript
const bm = editor.Blocks;

// 添加
bm.add('my-block', { label: 'My Block', content: '...' });

// 获取
const block = bm.get('my-block');

// 更新
bm.set('my-block', { label: 'Updated Label' });

// 移除
bm.remove('my-block');

// 获取所有区块
const allBlocks = bm.getAll();
```

### 自定义 UI

通过设置 `custom: true` 并监听 `block:custom` 事件启用自定义 UI：

```javascript
const editor = grapesjs.init({
  blockManager: { custom: true }
});

editor.on('block:custom', ({ container, blocks, dragStart, dragStop }) => {
  // container: 用于渲染自定义 UI 的元素
  // blocks: 所有区块数据的数组
  // dragStart/dragStop: 拖拽回调
  renderCustomBlockUI(container, blocks);
});
```

---

## 模块：Assets（资源）

### 核心功能

Asset Manager 是 GrapesJS 内置的数字资源处理模块，主要用于图片。提供轻量级资源处理和扩展自定义资源类型的能力。包含拖放上传器和模态界面，当用户与图片组件交互时显示。

### 配置区域

资源通过编辑器初始化时的 `assetManager` 属性配置。该模块维护两个集合：

- **全局集合**：所有资源
- **可见集合**：用于渲染的资源

```javascript
const editor = grapesjs.init({
  assetManager: {
    assets: [
      'http://placehold.it/350x250/78c5d6/fff/image1.jpg',
      {
        type: 'image',
        src: 'http://placehold.it/350x250/459ba8/fff/image2.jpg',
        height: 350,
        width: 250,
        name: 'displayName'
      },
    ],
  }
});
```

### 文件上传

系统通过可配置端点支持服务器端上传：

```javascript
assetManager: {
  upload: 'https://endpoint/upload/assets',
  uploadName: 'files',
  headers: {},
  credentials: 'include',
  multiUpload: true,
}
```

服务器应返回包含 `data` 键的 JSON 响应：

```json
{ "data": ["url1", "url2", ...] }
// 或
{ "data": [{ "src": "...", "type": "image" }, ...] }
```

### 事件系统

模块触发上传生命周期事件：

| 事件 | 说明 |
|------|------|
| `asset:upload:start` | 上传开始 |
| `asset:upload:end` | 上传结束 |
| `asset:upload:error` | 上传错误 |
| `asset:upload:response` | 收到服务器响应 |

### 编程控制

```javascript
const am = editor.AssetManager;

// 添加资源
am.add('http://example.com/image.jpg');
am.add({ type: 'image', src: '...', width: 100, height: 100 });

// 获取资源
const asset = am.get('http://example.com/image.jpg');

// 获取所有
const assets = am.getAll();

// 渲染
am.render();

// 移除
am.remove('http://example.com/image.jpg');
```

### 自定义资源管理器

通过设置 `custom: true` 并监听 `asset:custom` 事件完全替换默认 UI：

```javascript
const editor = grapesjs.init({
  assetManager: { custom: true }
});

editor.on('asset:custom', ({ container, assets, options, close }) => {
  // 渲染自定义资源管理器 UI
});
```

对于外部资源管理器，通过 `assetManager.custom.open` 和 `assetManager.custom.close` 回调绑定状态。

---

## 模块：Commands（命令）

### 核心概念（Commands）

Commands 模块为整个编辑器提供管理可复用函数的集中化系统。

**基本设置**：命令通过 ID 和回调函数注册，可在初始化时通过 `commands.defaults` 定义，也可在初始化后通过 Commands API 动态添加：

```javascript
// 初始化时定义
const editor = grapesjs.init({
  commands: {
    defaults: [
      {
        id: 'my-command-id',
        run(editor) {
          // 命令逻辑
        },
      }
    ]
  }
});

// 初始化后动态添加
editor.Commands.add('my-command-id', (editor, sender, options) => {
  // 命令逻辑
});

// 执行命令
editor.runCommand('my-command-id', { optionKey: 'optionValue' });
```

### 有状态命令

通过实现 `run` 和 `stop` 方法，命令可以维护状态。这可防止重复执行并通过 `commands.isActive()` 或 `commands.getActive()` 追踪活跃命令：

```javascript
editor.Commands.add('toggle-panel', {
  run(editor, sender) {
    // 开启面板逻辑
    editor.getContainer().querySelector('#panel').style.display = '';
  },
  stop(editor, sender) {
    // 关闭面板逻辑
    editor.getContainer().querySelector('#panel').style.display = 'none';
  },
});

// 运行 / 停止
editor.runCommand('toggle-panel');
editor.stopCommand('toggle-panel');

// 检查状态
editor.Commands.isActive('toggle-panel'); // true/false
```

**注意**：保持 UI 状态同步——如果弹窗在外部关闭，应手动停止命令以防止不一致。

### 内置命令

GrapesJS 包含约 20 个内置命令，前缀为 `core:*`：

| 命令 | 说明 |
|------|------|
| `core:component-enter` | 进入组件 |
| `core:component-exit` | 退出组件 |
| `core:component-next` | 选择下一个组件 |
| `core:component-prev` | 选择上一个组件 |
| `core:copy` | 复制组件 |
| `core:paste` | 粘贴组件 |
| `core:canvas-clear` | 清除画布 |
| `core:open-layers` | 打开图层面板 |
| `core:open-styles` | 打开样式面板 |
| `core:open-traits` | 打开特征面板 |
| `core:open-blocks` | 打开区块面板 |
| `core:open-assets` | 打开资源面板 |
| `core:preview` | 预览模式 |
| `core:fullscreen` | 全屏模式 |
| `core:undo` | 撤销 |
| `core:redo` | 重做 |

### 扩展与事件

通过 `commands.extend()` 覆盖特定方法来扩展命令：

```javascript
editor.Commands.extend('existing-command', {
  run(editor, sender, options) {
    // 调用原始命令
    this.callParent('run', editor, sender, options);
    // 额外逻辑
  }
});
```

模块触发生命周期事件，允许拦截执行或通过设置 `options.abort = true` 中止命令：

```javascript
editor.on('command:run:before', ({ id, options }) => {
  if (someCondition) {
    options.abort = true; // 中止命令
  }
});

editor.on('command:run', ({ id, result, options }) => {
  console.log(`Command ${id} executed`);
});

editor.on('command:stop', ({ id, result, options }) => {
  console.log(`Command ${id} stopped`);
});
```

---

## 模块：I18n（国际化）

### 基本配置

编辑器默认使用英语。要添加其他语言，导入语言文件并进行配置：

```javascript
import grapesjs from 'grapesjs';
import it from 'grapesjs/locale/it';
import zh from 'grapesjs/locale/zh'; // 如果存在中文包

const editor = grapesjs.init({
  i18n: {
    locale: 'en',        // 默认语言
    detectLocale: true,  // 自动检测浏览器语言
    localeFallback: 'en', // 后备语言
    messages: {
      it,
      zh: {
        // 自定义中文翻译
      }
    },
  }
});
```

语言代码遵循 ISO 639-1 标准。

### 更新字符串

通过 I18n API 定位特定路径修改默认 UI 字符串：

```javascript
// 修改 Style Manager 空状态消息
editor.I18n.setLocale('zh');

editor.I18n.addMessages({
  zh: {
    styleManager: {
      empty: '选择一个组件以编辑其样式',
    },
    traitManager: {
      empty: '选择一个组件以查看其特征',
    },
    assetManager: {
      inputPlh: '输入图片 URL',
    },
  }
});
```

文档建议将 API 调用封装在插件中以更好地组织代码。

### 添加新语言

贡献者可以通过以下步骤添加语言支持：

1. 检查仓库中是否已存在该语言文件
2. 提交 issue 与其他贡献者协调
3. 复制并翻译英语语言文件（`src/i18n/locale/en.ts`）
4. 向 `dev` 分支提交 Pull Request

### 插件开发中的国际化

插件开发者应将语言文件放在插件特定命名空间下，并从入口点导出，让用户可以按需导入额外的语言变体：

```javascript
// 插件内部
const plugin = (editor, opts = {}) => {
  editor.I18n.addMessages({
    en: {
      'my-plugin': {
        label: 'My Plugin Label',
      }
    }
  });
};

// 导出语言文件
export { default as it } from './locale/it';
export { default as zh } from './locale/zh';
```

---

## 模块：Selectors（选择器）

### 用途

Selector Manager 是 GrapesJS 中用于管理基于 CSS 类选择器样式的核心模块。它收集并追踪整个项目中使用的选择器（CSS 类），实现组件间的样式复用——功能类似于 HTML class 属性。

### 主要功能

- 组件和样式加载后收集选择器数据
- 显示 UI 展示当前选择状态
- 支持禁用特定选择器和状态更改（如 hover）
- 在需要时启用组件优先样式

### 配置与设置

配置通过编辑器初始化时的 `selectorManager` 属性传递。模块会从加载的组件和样式中自动发现选择器：

```javascript
const editor = grapesjs.init({
  selectorManager: {
    appendTo: '#selector-container',
    // 其他配置选项
  }
});
```

### 组件优先选择器

可选模式（`componentFirst: true`）允许对单个组件而非所有共享类的组件进行样式设置。这还能启用多组件选择，并将公共选择器与组件样式同步：

```javascript
const editor = grapesjs.init({
  selectorManager: {
    componentFirst: true,
  }
});
```

### 自定义选择器 UI

对于高级用例，通过设置 `custom: true` 并监听 `selector:custom` 事件替换默认 UI：

```javascript
const editor = grapesjs.init({
  selectorManager: { custom: true }
});

editor.on('selector:custom', ({ container }) => {
  // container: 用于渲染自定义 UI 的元素
  renderCustomSelectorUI(container);
});
```

---

## 模块：Layers（图层）

### 配置

图层管理器通过 `layerManager` 对象传递主编辑器配置。选项包括设置自定义根组件、禁用排序和隐藏图层：

```javascript
const editor = grapesjs.init({
  layerManager: {
    appendTo: '.layers-container',
    // 自定义根组件（可选）
    root: editor.getWrapper(),
    // 禁用拖拽排序
    sortable: false,
    // 隐藏特定图层
    hidable: true,
  }
});
```

### 编程使用

图层管理器通过代码而非 UI 公开 API 来管理图层：

```javascript
const lm = editor.LayerManager;

// 设置根组件
lm.setRoot(editor.getWrapper());

// 获取根组件
const root = lm.getRoot();
```

### 自定义图层 UI

通过以下方式替换默认 UI：

1. 在图层管理器配置中设置 `custom: true`
2. 订阅三个关键事件：

```javascript
const editor = grapesjs.init({
  layerManager: { custom: true }
});

// UI 容器就绪时触发
editor.on('layer:custom', ({ container }) => {
  renderCustomLayerUI(container);
});

// 根图层更改时触发
editor.on('layer:root', ({ root }) => {
  updateRootLayer(root);
});

// 组件更新时触发
editor.on('layer:component', ({ component }) => {
  updateComponentLayer(component);
});
```

### 重要说明

- 需要 GrapesJS v0.19.5 或更高版本
- 图层只在组件加载到编辑器后才显示
- 如果未指定自定义根节点，则以主 wrapper 组件作为默认根节点

---

## 模块：Pages（页面）

### 简介（Pages）

Pages 模块支持 GrapesJS（v0.21.1+）的多页面项目。默认情况下，自动存在一个页面，即使对于单页面设置也保持 API 一致性。

### 初始化

标准编辑器设置自动迁移到 Page Manager。配置使用带有 `id`、`styles` 和 `component` 属性的 `pageManager.pages` 数组：

```javascript
const editor = grapesjs.init({
  pageManager: {
    pages: [
      {
        id: 'page-1',
        styles: '.page-1 { font-size: 16px; }',
        component: '<div class="page-1">Page 1 content</div>',
      },
      {
        id: 'page-2',
        component: '<div>Page 2</div>',
      }
    ]
  }
});
```

### 编程接口（Pages）

```javascript
const pm = editor.Pages;

// 获取所有页面
const allPages = pm.getAll();

// 获取当前选中页面
const currentPage = pm.getSelected();

// 添加新页面
const newPage = pm.add({
  id: 'new-page',
  styles: '...',
  component: '<div>...</div>',
});

// 获取特定页面
const page = pm.get('page-1');

// 切换活跃页面
pm.select('page-2');
// 或
pm.select(page);

// 移除页面
pm.remove('page-1');

// 提取页面的 HTML/CSS
pm.select('page-1');
const html = editor.getHtml();
const css = editor.getCss();
```

### 自定义 UI（Pages）

该模块没有内置 UI，但提供 API 用于构建自定义界面。通用 `page` 事件在模块变化时触发，实现响应式 UI 更新：

```javascript
editor.on('page', () => {
  // 页面发生任何变化时触发
  updatePageUI();
});

editor.on('page:add', ({ page }) => { /* 页面添加 */ });
editor.on('page:remove', ({ page }) => { /* 页面移除 */ });
editor.on('page:select', ({ page, prevPage }) => { /* 页面切换 */ });
```

---

## 模块：Style Manager（样式管理器）

### 配置与初始化（SM）

Style Manager 模块处理组件样式属性的显示和更新。通过扇区（sectors）组织样式，每个扇区包含属性。通过编辑器初始化时的 `styleManager` 选项配置：

```javascript
const editor = grapesjs.init({
  styleManager: {
    appendTo: '#styles-container',
    sectors: [
      {
        id: 'sector-typography',
        name: 'Typography',
        open: false,
        properties: [
          'font-family',
          'font-size',
          'font-weight',
          {
            name: 'Text align',
            property: 'text-align',
            type: 'radio',
            defaults: 'left',
            options: [
              { value: 'left', className: 'fa fa-align-left' },
              { value: 'center', className: 'fa fa-align-center' },
              { value: 'right', className: 'fa fa-align-right' },
            ]
          }
        ],
      },
    ],
  }
});
```

### 属性类型

GrapesJS 提供多种内置属性类型：

| 类型 | 说明 |
|------|------|
| `base` | 文本输入 |
| `color` | 颜色选择器 |
| `number` | 数字字段（含单位） |
| `slider` | 滑块输入 |
| `select` | 下拉选择 |
| `radio` | 单选按钮组 |
| `composite` | 简写属性（如 `margin`） |
| `stack` | 多值属性（如 `box-shadow`） |

### 组件约束

组件可以定义 `stylable` 和 `unstylable` 属性，控制选中该组件时 Style Manager 中出现哪些 CSS 属性：

```javascript
editor.DomComponents.addType('my-component', {
  model: {
    defaults: {
      stylable: ['color', 'font-size', 'padding'],   // 只允许这些
      unstylable: ['position', 'float'],             // 排除这些
    }
  }
});
```

### 编程 API

```javascript
const sm = editor.StyleManager;

// 添加扇区
sm.addSector('my-sector', {
  name: 'My Sector',
  open: true,
  properties: ['color', 'font-size'],
});

// 获取扇区
const sector = sm.getSector('my-sector');

// 选择目标（组件或 CSS 选择器）
sm.select(component);
sm.select('.my-class');

// 获取当前选中目标的样式
const styles = sm.getSelectedAll();
```

### 自定义选项

**添加新属性类型：**

```javascript
sm.addType('custom-type', {
  create({ props, change }) {
    const el = document.createElement('div');
    // 构建自定义输入 UI
    return el;
  },
  emit({ props, updateStyle }, { event, partial }) {
    const { value } = event.target;
    updateStyle(`${value}px`);
  },
  update({ value, el }) {
    el.querySelector('input').value = parseInt(value);
  },
  destroy() {
    // 清理逻辑
  }
});
```

**完整 UI 替换：**

```javascript
const editor = grapesjs.init({
  styleManager: { custom: true }
});

editor.on('style:custom', ({ container }) => {
  renderCustomStyleUI(container);
});
```

---

## 模块：Storage Manager（存储管理器）

### 配置（Storage）

Storage Manager 是 GrapesJS 内置的数据持久化模块。默认设置包括存储类型（local/remote）、自动保存开关、自动加载行为和保存前步骤数。通过设置 `storageManager: false` 可完全禁用持久化：

```javascript
const editor = grapesjs.init({
  storageManager: {
    type: 'local',      // 或 'remote'
    autosave: true,
    autoload: true,
    stepsBeforeSave: 1, // 多少步操作后触发保存
  },
  // 完全禁用
  // storageManager: false,
});
```

### 项目数据

项目数据是包含所有编辑器信息（样式、页面等）的 JSON 对象。通过以下方式访问和加载：

```javascript
// 获取项目数据
const projectData = editor.getProjectData();
console.log(projectData);
// { assets: [...], pages: [...], styles: [...] }

// 加载项目数据
editor.loadProjectData(projectData);
```

文档强调：**仅依赖 JSON 进行持久化**，而不是 HTML/CSS 解析。

### 存储策略

数据在变更达到配置阈值时自动保存。也可通过以下方式手动触发：

```javascript
// 手动保存
await editor.store();

// 手动加载
await editor.load();
```

### 本地存储

使用浏览器 localStorage 作为默认存储。配置存储键以区分不同项目：

```javascript
storageManager: {
  type: 'local',
  options: {
    local: {
      key: `gjsProject-${projectId}`,
    }
  }
}
```

### 远程存储

需要服务器端 API 配置：

```javascript
storageManager: {
  type: 'remote',
  options: {
    remote: {
      urlLoad: `https://api.example.com/projects/${projectId}`,
      urlStore: `https://api.example.com/projects/${projectId}`,
      fetchOptions: (opts) => ({
        ...opts,
        method: opts.body ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
      // 存储前转换数据
      onStore: (data, editor) => ({
        id: projectId,
        data,
        // 额外包含 HTML/CSS
        html: editor.getHtml(),
        css: editor.getCss(),
      }),
      // 加载后转换数据
      onLoad: (result) => result.data,
    }
  }
}
```

### Storage API

**三种使用方式：**

1. 定义新存储类型：

```javascript
editor.Storage.add('my-storage', {
  async load(options) {
    return await fetchData(options);
  },
  async store(data, options) {
    await saveData(data, options);
  },
});
```

2. 扩展现有存储：

```javascript
const localStorage = editor.Storage.get('local');
// 自定义扩展...
```

3. 替换默认实现（如用 IndexedDB 替换 localStorage）

### 常用场景

**跳过初始加载：**

```javascript
const editor = grapesjs.init({
  projectData: myProjectData, // 直接使用项目数据初始化
});
```

**在存储时包含 HTML/CSS：**

```javascript
storageManager: {
  options: {
    remote: {
      onStore: (data, editor) => ({
        ...data,
        html: editor.getHtml(),
        css: editor.getCss(),
      })
    }
  }
}
```

**内联存储（基于表单的工作流）：**

```javascript
editor.Storage.add('inline', {
  load() {
    return JSON.parse(document.getElementById('myField').value || '{}');
  },
  store(data) {
    document.getElementById('myField').value = JSON.stringify(data);
  },
});
```

---

## 模块：Modal（弹窗）

### 基本用法

最简单的方法是调用 `editor.Modal.open()`，传入标题和内容参数（可以是字符串或 HTML 元素）：

```javascript
const modal = editor.Modal;

// 打开弹窗
modal.open({
  title: 'My Modal Title',
  content: '<div>Modal content here</div>',
  attributes: { class: 'my-modal' },
});

// 内容也可以是 DOM 元素
const el = document.createElement('div');
el.innerHTML = 'Custom content';
modal.open({ title: 'Title', content: el });
```

### API 方法

| 方法 | 说明 |
|------|------|
| `Modal.open(opts)` | 打开弹窗 |
| `Modal.close()` | 关闭弹窗 |
| `Modal.isOpen()` | 检查是否打开 |
| `Modal.setTitle(title)` | 更新标题 |
| `Modal.setContent(content)` | 更新内容 |
| `Modal.onceClose(callback)` | 注册单次关闭回调 |

### 自定义选项（Modal）

**方式 1：CSS 样式定制**

```css
/* 通过内置 CSS 类定制 */
.gjs-mdl-dialog { background: #fff; border-radius: 8px; }
.gjs-mdl-header { background: #f5f5f5; }
.gjs-mdl-title { font-size: 18px; }
```

**方式 2：完整替换**

在编辑器配置中设置 `modal: { custom: true }`：

```javascript
const editor = grapesjs.init({
  modal: { custom: true }
});
```

### 自定义弹窗实现

使用自定义弹窗时，订阅 `modal` 事件，该事件提供：

```javascript
editor.on('modal', ({ open, title, content, attributes, close }) => {
  // open: boolean — 弹窗状态
  // title: Node — 标题节点
  // content: Node — 内容节点
  // attributes: Object — 自定义属性
  // close: Function — 关闭回调

  if (open) {
    myModal.show(title, content);
    myModal.onClose = close;
  } else {
    myModal.hide();
  }
});
```

> 需要 GrapesJS v0.17.26 或更高版本。

---

## 模块：Plugins（插件）

### 基本插件结构

插件是在编辑器初始化期间执行的函数。一个简单示例添加自定义区块：

```javascript
function myPlugin(editor) {
  editor.Blocks.add('my-first-block', {
    label: 'Simple block',
    content: '<div class="my-block">This is a simple block</div>',
  });
}

const editor = grapesjs.init({
  plugins: [myPlugin],
});
```

插件可以组织在单独的文件中，或从 NPM 包导入：

```javascript
import myPlugin from 'grapesjs-my-plugin';

const editor = grapesjs.init({
  plugins: [myPlugin],
});
```

### 带选项的插件

插件通过 `pluginsOpts` 接受自定义参数：

```javascript
const myPluginWithOptions = (editor, options = {}) => {
  const { customField = 'defaultValue' } = options;

  editor.Blocks.add('my-block', {
    label: options.label || 'My Block',
    content: `<div class="${options.className}">Content</div>`,
  });
};

const editor = grapesjs.init({
  plugins: [myPluginWithOptions],
  pluginsOpts: {
    [myPluginWithOptions]: { customField: 'customValue', label: 'Custom Label' }
  }
});
```

### TypeScript 支持

为获得类型安全，使用带有 `Plugin<OptionsType>` 接口的 `usePlugin` 辅助函数，无需单独的 `pluginsOpts` 配置：

```typescript
import { usePlugin, Plugin } from 'grapesjs';

interface MyPluginOptions {
  label?: string;
  className?: string;
}

const myPlugin: Plugin<MyPluginOptions> = (editor, options) => {
  // options 已被 TypeScript 正确推断类型
  editor.Blocks.add('my-block', {
    label: options.label || 'My Block',
  });
};

const editor = grapesjs.init({
  plugins: [usePlugin(myPlugin, { label: 'Custom Label' })],
});
```

### 开发工具

文档推荐使用 `grapesjs-cli` 搭建新插件，处理依赖设置和构建配置，无需手动配置 Webpack 或 Babel：

```bash
# 安装 CLI
npm install -g grapesjs-cli

# 创建新插件
grapesjs-cli init my-plugin

# 启动开发服务器
cd my-plugin && npm start
```

---

## 指南：Symbols（符号）

### 概念

Symbols 是 GrapesJS 的 beta 功能（v0.21.11+），用于跨项目复用组件同时保持一致性。

Symbols 由**主符号（Main Symbol）**和**实例符号（Instance Symbols）**组成。对主符号的更新会自动传播到所有实例。

### 编程使用（Symbols）

```javascript
const { Components } = editor;

// 创建符号（将组件转换为主符号）
const symbol = Components.addSymbol(component);

// 获取所有符号
const symbols = Components.getSymbols();

// 检查符号信息
const info = Components.getSymbolInfo(component);
// 返回: { isMain, isInstance, main, instances, relatives }

console.log(info.isMain);     // 是否是主符号
console.log(info.isInstance); // 是否是实例
console.log(info.main);       // 主符号引用
console.log(info.instances);  // 所有实例数组
```

**设置属性覆盖**（阻止传播到实例）：

```javascript
const instanceComponent = info.instances[0];
instanceComponent.setSymbolOverride(['style', 'attributes.class']);
// 该实例的 style 和 class 不会再从主符号同步
```

**分离实例：**

```javascript
Components.detachSymbol(instanceComponent);
// instanceComponent 现在是独立组件，不再与主符号关联
```

**移除主符号：**

```javascript
symbol.remove();
// 注意：实例会变成普通独立组件
```

### 事件

```javascript
editor.on('symbol:main:add', ({ component }) => { /* 主符号创建 */ });
editor.on('symbol:main:update', ({ component }) => { /* 主符号更新 */ });
editor.on('symbol:instance:add', ({ component }) => { /* 实例创建 */ });

// 通配符事件
editor.on('symbol:main', ({ event, component }) => { /* 所有主符号事件 */ });
editor.on('symbol', ({ event, component }) => { /* 所有符号事件 */ });
```

### 实现说明

该功能在低级别运作，没有内置 UI，需要开发者实现用于符号管理的自定义界面。理解 Components API 是使用此功能的前提知识。

---

## 指南：替换富文本编辑器

### 核心实现

文档要求通过 `setCustomRte()` 实现四个接口方法：

```javascript
editor.setCustomRte({
  // 1. Enable — 在元素上初始化自定义 RTE，包含复用现有实例的逻辑
  enable(el, rte) {
    if (rte && rte.isReady) {
      rte.focus();
      return rte;
    }

    // 初始化第三方编辑器（如 CKEditor）
    const newRte = CKEditor.replace(el, {
      // 配置选项
    });
    return newRte;
  },

  // 2. Disable — 在元素上停用编辑模式
  disable(el, rte) {
    rte?.destroy?.();
  },

  // 3. getContent — 返回最终 HTML 字符串（库特定）
  getContent(el, rte) {
    return rte ? rte.getData() : el.innerHTML;
  },

  // 4. Focus — 管理编辑器焦点状态的辅助函数
  focus(el, rte) {
    rte?.focus?.();
  },
});
```

**工具栏定位**（放在 GrapesJS 的工具栏容器中防止滚动问题）：

```javascript
enable(el, rte) {
  // 将工具栏移到 GrapesJS 容器
  const toolbar = rte.ui.view.toolbar.element;
  editor.RichTextEditor.getToolbarEl().appendChild(toolbar);
  return rte;
}
```

**实验性内容解析**（将返回的 HTML 解析为组件）：

```javascript
editor.setCustomRte({
  parseContent: true, // 启用实验性功能
  // ...其他方法
});
```

### 重要细节

- 需要 GrapesJS v0.21.2 或更高版本
- 自定义 RTE 处理自身的内容行为——GrapesJS 按原样存储
- 工具栏应放在 GrapesJS 的工具栏容器中以防止滚动问题
- 链接编辑等功能成为第三方库的责任
- 现成的 CKEditor 插件：`grapesjs-plugin-ckeditor`

---

## 指南：使用自定义 CSS 解析器

### 导入 HTML/CSS

GrapesJS 可以通过利用浏览器 DOM/CSSOM API 来解析现有的 HTML/CSS 模板，从而实现对预构建模板的即时编辑。

### CSSOM 的不一致性

浏览器 CSSOM 对象会产生不可靠的结果：

- 属性被重新排序
- 颜色被转换为不同格式（如 `red` → `rgb(255, 0, 0)`）
- 出现意外的厂商前缀

**非直觉行为示例**：简写属性中的 CSS 变量（如 `background: var(--my-var)`）可能会序列化为空字符串，而对应的长写属性则不会。

### 自定义解析器设置

开发者可以定义一个接收 CSS 字符串和编辑器实例的解析器函数，返回规则对象数组：

```javascript
const editor = grapesjs.init({
  // ...
  cssParser: (css, editor) => {
    // 使用第三方 CSS 解析器（如 PostCSS）解析 css 字符串
    const result = myThirdPartyCssParser(css);

    // 将结果转换为 GrapesJS 规则对象数组
    return result.map(rule => ({
      selectors: rule.selector || '',
      style: rule.declarations,   // { property: value, ... }
      atRule: rule.atRule || '',  // 如 'media', 'keyframes', 'font-face'
      params: rule.params || '',  // 如 '(max-width: 768px)'
    }));
  },
});
```

### 规则对象结构

每个规则对象支持以下字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| `selectors` | 是（可为空字符串） | CSS 选择器，如 `.my-class` 或 `h1` |
| `style` | 否 | CSS 声明对象，如 `{ color: 'red', 'font-size': '16px' }` |
| `atRule` | 否 | at 规则名称，如 `media`、`keyframes`、`font-face` |
| `params` | 否 | at 规则参数，如 `(max-width: 768px)` |

### 示例规则

**`@font-face`：**

```javascript
{
  selectors: '',
  atRule: 'font-face',
  style: {
    'font-family': 'MyFont',
    src: "url('myfont.woff2') format('woff2')",
  }
}
```

**`@keyframes`：**

```javascript
{
  selectors: 'from',
  atRule: 'keyframes',
  params: 'my-animation',
  style: { opacity: '0' },
},
{
  selectors: 'to',
  atRule: 'keyframes',
  params: 'my-animation',
  style: { opacity: '1' },
}
```

**`@media` 查询：**

```javascript
{
  selectors: '.container',
  atRule: 'media',
  params: '(max-width: 768px)',
  style: { width: '100%' },
}
```

**CSS 自定义属性：**

```javascript
{
  selectors: ':root',
  style: {
    '--primary-color': '#3498db',
    '--font-size': '16px',
  }
}
```

**推荐插件**：[grapesjs-parser-postcss](https://github.com/GrapesJS/parser-postcss) — 基于 PostCSS 的现成 CSS 解析器插件。

---

## 指南：GrapesJS 遥测

### 数据收集

GrapesJS 收集三种数据点：

1. 使用它的**域名**
2. **版本号**
3. **加载时间戳**

### 数据用途

收集的信息服务于三个目的：

1. 识别和修复 bug
2. 分析功能采用模式
3. 支持用户与平台的交互

### 退出遥测

用户可以在初始化编辑器时传递 `telemetry: false` 来禁用遥测：

```javascript
const editor = grapesjs.init({
  telemetry: false,
});
```

---

*文档整合自 [GrapesJS 官方文档](https://grapesjs.com/docs/)，整合时间：2026-03-03*
