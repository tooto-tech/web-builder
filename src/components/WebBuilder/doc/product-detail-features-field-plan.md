# 产品详情 Features 动态字段补齐计划

## Summary

本期只补产品详情页 Features 相关选择项，不做产品详情字段全量规整。目标是在动态文本“字段”下拉中可选择产品 Features，并保证后台发布渲染可用。

## Key Changes

- 前端字段表新增 `product.featuresText`，标签为 `[产品] Features / 产品特性`，类型为 `text`。
- 后端 `ProductRenderDTO` 增加计算 getter `getFeaturesText()`，把 `product.features[].text` 拼成可渲染文本。
- 编辑器预览同步补 `product.featuresText`，从管理端返回的 `features` 字符串或数组生成预览文本。
- 保留现有 `feature@product.features` 动态循环数据源，用于需要逐条渲染 Features 的布局。

## Render Flow

- 动态文本选择 `product.featuresText` 后输出 `data-cms-bind="product.featuresText"`。
- 发布时 `TemplateParser` 按现有逻辑转成 `th:text="${product.featuresText}"`。
- Thymeleaf 调用 `ProductRenderDTO.getFeaturesText()`，从当前产品的 Features 列表生成文本。
- 不引入 `product.features` 作为普通文本字段，避免直接渲染对象数组。

## Test Plan

- 前端测试覆盖 `product.featuresText` 出现在产品详情文本字段选项中。
- 前端测试确认现有 `feature@product.features` 循环源仍可用于逐条布局。
- 后端测试覆盖空 Features 和多条 Features 的拼接行为。

## Assumptions

- 本期只解决 Features 下拉缺失，不补其它产品字段。
- Features 普通文本展示使用换行拼接；逐条样式化展示继续使用动态循环 `feature@product.features` + `feature.text`。
- 现有未提交改动作为基线保留，不回退。
