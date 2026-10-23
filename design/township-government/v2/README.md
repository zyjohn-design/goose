# 第二版：主题中心、账户弹出菜单与档案接入

在同一分支 `codex/township-government-harness` 继续开发。浏览器打开 `index.html` 对比三套主题的 Light / Dark，共六张独立效果图。图片由内置 image_gen 生成，完整提示词保存在 `prompts.json`，配色见 `palette.json`。

| 主题 | Light | Dark | 方向 |
| --- | --- | --- | --- |
| 朱砂政务 | `images/01-civic-light.png` | `images/02-civic-dark.png` | 暖白、朱砂红、少量金色，庄重大方 |
| 深蓝政务 | `images/03-navy-light.png` | `images/04-navy-dark.png` | 蓝灰、深海军蓝，沉稳清晰 |
| 青山雅政 | `images/05-forest-light.png` | `images/06-forest-dark.png` | 米白、深青绿，温润克制 |

## 本轮已写入桌面源码

- 新增主题中心，可从侧栏、设置页或账户菜单进入；三套主题各自都有 Light / Dark，保留 Goose 原生主题入口。
- 主题选择保存到 Electron 设置，应用到主题变量并广播至其他 Goose 窗口；“跟随系统”保留所选政务配色，在浅色与深色间自动切换。MCP App 使用对应主题变量。
- 点击底部“张主任”弹出账户与设置菜单，提供个人资料、主题中心、模型服务、连接管理和全部设置。
- 个人资料弹窗可保存姓名、部门和单位，头像使用姓名首字。菜单注明“本地资料 · 尚未登录”，不将本地显示姓名当作认证身份。
- 档案扩展与两个档案技能显示对应名称和图标，其余资源的整体页面重构仍可沿用第一版设计逐步实现。

效果图中的山水、整体首页版式和主题卡片是视觉方案；本轮实际产品源码实现的是主题变量、主题中心、账户菜单/资料弹窗及档案条目标识，不代表全部页面已经按图片完整重做。生成图存在局部字形误差时，以说明和实现文案为准。

## 档案 MCP 与审核 Skill

用户确认接入本机 `personnel-archive` 项目。`custom/township/scripts/register_archive.py` 已在本机运行：

- 登记 Goose 的 `personnel-archive` stdio 扩展，使用本机档案项目 Python 环境和工作目录，默认停用，保留原有配置并备份。
- 安装原有 `personnel-archive` 证据助手与新增 `personnel-archive-review` 档案审核 Skill 到 Goose 支持的 `~/.agents/skills/`。
- 审核 Skill 核对档案身份、发布快照、来源与修订版本，输出待人工核对的意见。只读服务不提供审批、发布或全卷材料扫描，不能把证据问答描述为完成全卷审核。
- 验证了本地 stdio MCP 初始化及五个只读工具声明。验证采用临时协议测试值，没有调用业务工具或查询真实人员。

**真实业务连接待完成：** 当前没有可用的 `ARCHIVE_API_TOKEN`；默认本机地址没有返回预期档案健康接口。请在 Goose 中核对 `ARCHIVE_API_URL`、通过秘密设置或启动环境配置 `ARCHIVE_API_TOKEN`，再启用扩展并验证业务授权。无需在聊天中发送 token。具体安装/配置步骤见仓库 `custom/township/README.md`；本页预览不发起档案请求。

## 已执行验证

- 桌面前端 `pnpm run typecheck`。
- 8 项针对性测试：政务主题的系统模式、存储恢复、MCP App 样式、账户资料弹窗与保存失败处理，以及既有扩展卡片回归。
- 改动源码的 ESLint 检查和格式整理。
- i18n 提取、编译与完整性检查；新增简体中文文案，其他语言目录先使用英文回退。
- Skill frontmatter 校验、安装器的预演/配置保留/重复安装检查，本地 MCP 只读工具协议检查。

未打包或替换用户现有 Goose 安装，未进行真实档案业务联调，也未接入单位 SSO。完整 Electron 打包、跨窗口/操作系统切换的实机验收可按 `goose-self-test.yaml` 的 `township-ui` 检查说明继续进行。
