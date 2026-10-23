# 对外 Agent 契约

HTTP MCP: `https://archive.internal/mcp/`，官方 Python SDK 1.x，Streamable HTTP；部署方预先签发 Bearer token。没有 OAuth 自动发现；客户端需支持自定义 Authorization 头。只读服务账号还必须有对应人员的 record grants。管理员 token 不应分发给外部 Agent。

本地 stdio 配置（替换路径；密钥由宿主的秘密管理能力注入，勿写入共享配置）：

```json
{
  "mcpServers": {
    "personnel-archive": {
      "command": "/ABS/PATH/backend/.venv/bin/python",
      "args": ["-m", "app.integrations.mcp_server"],
      "cwd": "/ABS/PATH/backend",
      "env": {"ARCHIVE_API_URL": "http://127.0.0.1:8000"}
    }
  }
}
```

启动进程时必须注入 `ARCHIVE_API_TOKEN`，所有工具经 HTTP API 复用权限和审计。stdio 固定只读；HTTP 可由部署方显式开启待审修正工具，仍校验角色和档案授权。

可用工具：`archive_search_records(query)`、`archive_get_record(record_id)`、`archive_ask(record_id, question)`、`archive_get_evidence(block_id)`、`archive_get_snapshot(record_id, snapshot_id)`。可选 `archive_propose_revision(block_id,text,reason,expected_version)`。

原件链接为受保护的后台相对路径；在同一受控客户端带 Bearer 下载，不能把路径变成公开静态 URL。MCP readOnlyHint 表示不改变档案内容，查询仍会写审计与问答历史。

接口完整 schema 由内网 `/openapi.json` 提供。生产反向代理需终止 TLS 并保留 Authorization、Accept、MCP-Protocol-Version 等头，禁止缓存响应。Host 必须在 `ARCHIVE_MCP_ALLOWED_HOSTS` 中，浏览器 Origin 默认只允许本机，其他宿主需按批准的接入域配置后再开放。
