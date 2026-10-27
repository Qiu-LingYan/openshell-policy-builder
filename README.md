# OpenShell Policy Builder

非官方社区工具。OpenShell 官方默认 `enforcement: audit` 意味着策略**不阻断**，Agent 仍可执行写/删操作。这个工具默认帮你切到 `enforce`，并可视化生成 L7 rules，无需手写 YAML。

## 使用

```bash
cd openshell-policy-builder
python3 -m http.server 8080
# 打开 http://localhost:8080
```

零依赖：纯 HTML/CSS/JS，无构建步骤、无外部库。

## 校验

生成 YAML 后点击"下载候选策略并校验"得到 `candidate.yaml`，然后：

```bash
openshell-prover check candidate.yaml --boundary your_boundary.yaml
# 或
python3 validate.py candidate.yaml your_boundary.yaml
```

## 安全提示（引自官方文档）

- `enforcement` 默认 `audit`：只记录不阻断，Agent 仍可执行写操作。选 `enforce` 才会返回 403。
- 不设 `protocol` 时：代理只检查 host/port/binary，`rules` 和 `access` 完全无效。
- `access: full` 等于放弃 L7 控制。
- `tls: skip` 会使 L7 检查、凭据注入、TLS 终止全部失效，仅用于原生 TCP 客户端。
