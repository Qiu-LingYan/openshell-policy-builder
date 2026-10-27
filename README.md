# OpenShell Policy Builder

**English** | [中文文档](README.zh-CN.md)

Unofficial community tool, not affiliated with NVIDIA. OpenShell's official default `enforcement: audit` means policies **do not block** — the agent can still perform write/delete operations. This tool defaults to `enforce` and visually generates L7 rules, so you never hand-write YAML.

**Try it online**: https://qiulingyan.top/openshell-policy-builder/

Compared to other visual editors (e.g. @contextware/openshellpolicy), this one is lighter — a single zero-dependency page, no build step, no CDN — and focuses on one thing: avoiding the `audit` default trap.

## Usage

Open the online URL above, or serve locally:

```bash
python3 -m http.server 8080
```

Zero dependencies: plain HTML/CSS/JS, no build step, no external libraries. UI is available in English and Chinese (toggle top-right; preference persists).

## Generated policy structure (example)

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

Supports `rest` / `websocket` / `graphql` / `tcp` / protocol unset (L4 only), custom allow/deny rules, and `tls: skip`.

## Validation

Click "Download candidate policy & validate" to get `candidate.yaml`, then:

```bash
openshell-prover check candidate.yaml --boundary your_boundary.yaml
# or
python3 validate.py candidate.yaml your_boundary.yaml
# or create a sandbox directly:
# openshell sandbox create --policy ./candidate.yaml -- claude
```

## Safety notes (from the official docs)

- `enforcement` defaults to `audit`: logs but does not block — the agent can still perform write operations. Only `enforce` returns 403.
- With `protocol` unset: TCP traffic is simply allowed through without payload inspection; `rules` and `access` have no effect.
- `access: full` + `enforcement: audit` = zero restriction: the official skill docs warn that full access in audit mode "passes all traffic through, equivalent to a monitor-only policy".
- `tls: skip` disables L7 checks, credential injection and TLS termination — for native TCP clients (e.g. databases) only.
