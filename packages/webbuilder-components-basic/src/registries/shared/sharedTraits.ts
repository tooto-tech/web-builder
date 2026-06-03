/**
 * container.ts / grid.ts 共享的 Trait 定义。
 * 宽度属性在两个文件中完全重复，统一在此维护。
 *
 * 背景属性和最小高度属性已迁移到 StyleManager（wb-layout / wb-background sector），
 * 不再作为 Traits 管理。
 *
 * ui 字段说明（供 StylesPropertiesPanel.vue 读取，决定渲染方式）：
 *   widget      - 控件类型标识（优先级高于 type）
 *   inlineUnit  - 与该 trait 配对的单位选择 trait 名称（显示在 label-end 插槽）
 */

export const widthTraits = [
  {
    type: 'select',
    label: '内容宽度',
    name: 'contentWidth',
    changeProp: true,
    ui: { widget: 'content-width' },
    options: [
      { id: 'full', name: '全宽度' },
      { id: 'boxed', name: '盒式' },
    ],
  },
  {
    type: 'number',
    label: '盒式宽度(px)',
    name: 'boxedWidth',
    min: 320,
    step: 1,
    changeProp: true,
    ui: { widget: 'hidden' },
  },
]
