# 镇政府本地档案接入

此定制分支使用用户本机 `personnel-archive` 项目的官方 MCP 服务。它提供五个只读工具：人员检索、档案读取、已发布证据问答、证据块读取、快照复现。复核 Skill 只输出待人工核对的建议，不包含审批或发布能力。

## 安装

使用档案项目已有 Python 环境（包括 PyYAML），先预览，再安装：

```sh
/PATH/personnel-archive/backend/.venv/bin/python custom/township/scripts/register_archive.py --archive-root /PATH/personnel-archive
/PATH/personnel-archive/backend/.venv/bin/python custom/township/scripts/register_archive.py --archive-root /PATH/personnel-archive --install
```

安装器保留原有 Goose 设置，备份原配置，增加默认停用的 `personnel-archive` 扩展，并将原有证据助手和本分支的档案审核 Skill 安装到 `~/.agents/skills/`。已有同名扩展不覆盖，已有 Skill 存在本地修改时停止。需要其他技能目录可指定 `--skills-root`。

## 完成连接

- 在扩展配置核对 `ARCHIVE_API_URL`（示例为 `http://127.0.0.1:8000`）。远端服务必须 HTTPS。
- 通过 Goose 的秘密设置配置 `ARCHIVE_API_TOKEN`，或由启动环境提供；不要把 token 写进本仓库、截图或 Skill。使用具备必要档案范围授权的账号。
- 先运行档案 API，启用扩展并完成 MCP 握手。存在扩展条目或 Skill 不等于业务接口已授权连通。
- 本轮配置不创建账号、不签发 token、不查询真实人员记录，不开启 MCP 写工具。

stdio 直接启动本机项目 `.venv/bin/python -m app.integrations.mcp_server`，工作目录指向其 backend，依赖与服务实现由原项目维护。配置改变、授权失败或服务不可用时，界面及报告应呈现真实失败状态。

## 主题与账户

实际桌面源码新增主题中心和底部账户弹出菜单，支持朱砂政务、深蓝政务、青山雅政各自的 Light / Dark 模式；跟随系统保留当前政务配色。主题会保存并广播到其他 Goose 窗口，MCP App 接收相同主题变量。

“张主任”为可编辑的本地显示资料，头像为姓名首字。资料不是认证身份；菜单明确显示未接入统一登录。实际政务 SSO 与权限服务不在本轮接入范围。

## 主题包

主题中心支持导入 JSON 主题包。主题包可以设置颜色、字体，以及对话气泡、工具卡和输入框的样式。三套内置政务主题也通过同一套对话组件插槽生效。开发规则和示例见 [theme-packs/README.md](theme-packs/README.md)。
