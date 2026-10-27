# OpenShell 策略生成器

[English](README.md) | **中文文档**

非官方社区工具，与 NVIDIA 无关联。OpenShell 官方默认 `enforcement: audit` 意味着策略**不阻断**，Agent 仍可执行写/删操作。这个工具默认帮你切到 `enforce`，并可视化生成 L7 rules，无需手写 YAML。

**在线使用**：https://qiulingyan.top/openshell-policy-builder/

相比其他可视化编辑器（如 @contextware/openshellpolicy），本工具更轻——零依赖单页、无构建、无 CDN——并且聚焦一件事：避开 `audit` 默认值的坑。

## 使用

打开上面的在线地址，或本地起服务：

```bash
python3 -m http.server 8080
```

零依赖：纯 HTML/CSS/JS，无构建步骤、无外部库。界面支持中英双语（右上角切换，偏好会记住）。

## 生成的策略结构（示例）

```yaml
network_policies:
  - name: my-policy
    endpoints:
      - host: api.github.com
        port: 443
        protocol: rest
        enforcement: enforce
        access: read-only
```

支持 `rest` / `websocket` / `graphql` / `tcp` / 不设 protocol（仅 L4），自定义 allow/deny rules，`tls: skip`。

## 校验

生成 YAML 后点击"下载候选策略并校验"得到 `candidate.yaml`，然后：

```bash
openshell-prover check candidate.yaml --boundary your_boundary.yaml
# 或
python3 validate.py candidate.yaml your_boundary.yaml
# 或直接建 sandbox 试跑：
# openshell sandbox create --policy ./candidate.yaml -- claude
```

## 安全提示（引自官方文档）

- `enforcement` 默认 `audit`：只记录不阻断，Agent 仍可执行写操作。选 `enforce` 才会返回 403。
- 不设 `protocol` 时：只做 TCP 流放行，不检查 payload，`rules` 和 `access` 完全无效。
- `access: full` + `enforcement: audit` = 零限制：官方 skill 文档明确警告，full access 在 audit 模式下"所有流量直接通过，等同于仅监控策略"。
- `tls: skip` 会使 L7 检查、凭据注入、TLS 终止全部失效，仅用于原生 TCP 客户端。
