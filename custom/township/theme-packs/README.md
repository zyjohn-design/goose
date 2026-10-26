# 主题包开发指南

主题包是一个 JSON 文件，在「设置 → 主题中心 → 导入主题包」里导入后，会出现在“已导入主题包”区域，可以切换明暗，也可以移除。导入的文件保存在 Goose 用户数据目录的 `themes/<id>.json`。

示例：[jinse-dangjian.json](jinse-dangjian.json)。主题中心的“下载主题包模板”按钮下载的也是这份文件。

## 结构

| 字段 | 说明 |
| --- | --- |
| `schemaVersion` | 固定为 `1` |
| `id` | 2–48 位小写字母、数字或连字符，不能和内置主题重名（light、dark、aura、civic、navy、forest、system） |
| `name` / `version` / `author` / `description` | 显示在主题中心 |
| `accent` | 主色，用于选中边框 |
| `variants.light` / `variants.dark` | 至少提供一个；只提供一个时，“跟随系统”会停在这一种明暗 |
| `variants.*.tokens` | 覆盖基础设计 token，例如 `--color-background-primary`、`--color-text-primary`、`--font-sans`；没写的 token 继承 Goose 原生的 light/dark。这些 token 也会同步给 MCP 应用 |
| `variants.*.components` | 对话组件样式插槽，见下表 |

## 对话组件插槽

| 变量 | 作用 |
| --- | --- |
| `--chat-user-bubble-bg` / `-text` / `-radius` | 用户消息气泡 |
| `--chat-agent-bubble-bg` / `-border` / `-radius` / `-padding` | 助手回复卡片 |
| `--chat-tool-card-bg` / `-border` / `-radius` | 工具调用、MCP 结果卡片（待审批的卡片仍使用审批专用样式） |
| `--chat-composer-bg` / `-border` / `-radius` / `-shadow` | 输入框外框 |
| `--chat-composer-min-height` | 输入框最小高度，38–240px |

## 校验规则

导入时会逐项校验，不通过就拒绝并提示原因：

- 只允许上面列出的字段和变量，不认识的字段会直接报错。
- 颜色只能是 `#hex`、`rgb()/rgba()/hsl()/hsla()`、`transparent`；尺寸只能是 px/rem/em/%。
- 阴影值里不能出现 `url`、`var()`、`image`。主题包无法加载远程资源，也读不到宿主的内部变量。
- 文件不能超过 256 KB。
- 主题包里不能写 CSS 选择器、`@import` 或 JavaScript。

## 本地调试

1. 复制示例文件，改 `id` 和 `name`。
2. 在主题中心导入。导入同一个 `id` 会覆盖旧版本，所有窗口会同步刷新。
3. 切换到这个主题的浅色或深色，在对话页检查气泡、工具卡和输入框的效果。
