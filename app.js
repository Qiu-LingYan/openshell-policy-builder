// OpenShell 策略生成器 — 纯原生 JS，无外部依赖
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var hostEl = $("host");
  var portEl = $("port");
  var protocolEl = $("protocol");
  var l4Hint = $("l4-hint");
  var tcpHint = $("tcp-hint");
  var enforcementField = $("enforcement-field");
  var accessField = $("access-field");
  var accessEl = $("access");
  var accessHint = $("access-hint");
  var policyNameEl = $("policy-name");
  var rulesField = $("rules-field");
  var rulesContainer = $("rules-container");
  var denyToggleField = $("deny-toggle-field");
  var denyField = $("deny-field");
  var denyContainer = $("deny-container");
  var denyEnabled = $("deny-enabled");
  var tlsField = $("tls-field");
  var tlsSkip = $("tls-skip");
  var tlsHint = $("tls-hint");
  var yamlOutput = $("yaml-output");
  var copyBtn = $("copy-btn");
  var downloadBtn = $("download-btn");
  var langBtn = $("lang-btn");

  // ---------- i18n ----------

  var I18N = {
    zh: {
      docTitle: "OpenShell 策略生成器",
      title: "OpenShell 策略生成器",
      langBtn: "EN",
      warn1: '⚠️ <strong>enforcement 默认是 audit</strong>：不阻断，只记录。本工具默认帮你切到 <code>enforce</code>。',
      warn2: '⚠️ <strong>不设 protocol 时，rules 形同虚设</strong>：代理只检查 host/port/binary，不检查 HTTP 方法或路径。',
      warn3: '⚠️ <strong>access: full + enforcement: audit = 零限制</strong>：官方 skill 文档明确警告，full access 在 audit 模式下"所有流量直接通过，等同于仅监控策略"。',
      "label-host": 'host <span class="req">*</span>',
      "label-rules": "rules（allow）",
      "opt-proto-none": "不设置（仅 L4 检查）",
      "opt-access-custom": "自定义",
      "hint-l4": "当前仅做 L4 检查。rules 和 access 不会生效。",
      "hint-tcp": "⚠️ tcp 模式下 L7 字段（enforcement/access/rules）不输出。",
      "hint-enforcement": "audit 只记录不阻断，enforce 返回 403。",
      "chk-deny": "添加 deny 规则（优先级高于 allow）",
      "chk-tls": "tls: skip（仅用于非 HTTP 客户端）",
      "hint-tls": "⚠️ 勾选后 L7 检查、凭据注入、TLS 终止全部失效，仅用于原生 TCP 客户端（如数据库）。",
      "h2-output": "生成的 YAML",
      "btn-copy": "复制",
      "btn-download": "下载候选策略并校验",
      "hint-validate": '下载 candidate.yaml 后，在终端运行：<code>openshell-prover check candidate.yaml --boundary your_boundary.yaml</code>，或使用附带的 <code>validate.py</code>。',
      footer: "非官方社区工具 · 生成的 YAML 需自行用 openshell-prover 校验",
      "btn-add-rule": "+ 添加规则",
      "btn-add-deny": "+ 添加 deny 规则",
      copied: "已复制 ✓",
      sampleSuffix: "# ↑ 请填写 host 后生成策略",
      accessHints: {
        "read-only": "read-only（REST）：GET, HEAD, OPTIONS",
        "read-write": "read-write（REST）：GET, HEAD, OPTIONS + POST, PUT, PATCH",
        "full": "full：所有方法与路径（放弃 L7 控制）",
        "custom": "自定义：在下方 rules 编辑器逐条指定 allow/deny"
      }
    },
    en: {
      docTitle: "OpenShell Policy Builder",
      title: "OpenShell Policy Builder",
      langBtn: "中文",
      warn1: '⚠️ <strong>enforcement defaults to audit</strong>: logged but NOT blocked. This tool defaults to <code>enforce</code> for you.',
      warn2: '⚠️ <strong>Without protocol, rules are useless</strong>: the proxy only checks host/port/binary, not HTTP methods or paths.',
      warn3: '⚠️ <strong>access: full + enforcement: audit = zero restriction</strong>: the official skill docs warn that full access in audit mode "passes all traffic through, equivalent to a monitor-only policy".',
      "label-host": 'host <span class="req">*</span>',
      "label-rules": "rules (allow)",
      "opt-proto-none": "Not set (L4 only)",
      "opt-access-custom": "Custom",
      "hint-l4": "L4 checking only. rules and access have no effect.",
      "hint-tcp": "⚠️ In tcp mode, L7 fields (enforcement/access/rules) are omitted.",
      "hint-enforcement": "audit only logs without blocking; enforce returns 403.",
      "chk-deny": "Add deny rules (higher priority than allow)",
      "chk-tls": "tls: skip (non-HTTP clients only)",
      "hint-tls": "⚠️ Once checked, L7 checks, credential injection and TLS termination all stop working. For native TCP clients (e.g. databases) only.",
      "h2-output": "Generated YAML",
      "btn-copy": "Copy",
      "btn-download": "Download candidate policy & validate",
      "hint-validate": 'After downloading candidate.yaml, run in a terminal: <code>openshell-prover check candidate.yaml --boundary your_boundary.yaml</code>, or use the bundled <code>validate.py</code>.',
      footer: "Unofficial community tool · Validate the generated YAML yourself with openshell-prover",
      "btn-add-rule": "+ Add rule",
      "btn-add-deny": "+ Add deny rule",
      copied: "Copied ✓",
      sampleSuffix: "# ↑ Fill in host to generate a policy",
      accessHints: {
        "read-only": "read-only (REST): GET, HEAD, OPTIONS",
        "read-write": "read-write (REST): GET, HEAD, OPTIONS + POST, PUT, PATCH",
        "full": "full: all methods and paths (no L7 control)",
        "custom": "Custom: specify allow/deny rules one by one below"
      }
    }
  };

  var currentLang = localStorage.getItem("lang") ||
    (navigator.language && navigator.language.indexOf("zh") === 0 ? "zh" : "en");

  function applyLang() {
    var dict = I18N[currentLang];
    document.title = dict.docTitle;
    document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    langBtn.textContent = dict.langBtn;
    updateAccessHint();
  }

  langBtn.addEventListener("click", function () {
    currentLang = currentLang === "zh" ? "en" : "zh";
    localStorage.setItem("lang", currentLang);
    applyLang();
  });

  var METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "*"];

  function updateAccessHint() {
    var hints = I18N[currentLang].accessHints;
    accessHint.textContent = hints[accessEl.value] || "";
  }

  // ---------- 规则行 ----------

  function createRuleRow(container) {
    var row = document.createElement("div");
    row.className = "rule-row";

    var method = document.createElement("select");
    METHODS.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      method.appendChild(opt);
    });

    var path = document.createElement("input");
    path.type = "text";
    path.placeholder = "/repos/**";

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", function () {
      row.remove();
      generate();
    });

    method.addEventListener("change", generate);
    path.addEventListener("input", generate);

    row.appendChild(method);
    row.appendChild(path);
    row.appendChild(removeBtn);
    container.appendChild(row);
    generate();
    return row;
  }

  function collectRules(container) {
    var out = [];
    container.querySelectorAll(".rule-row").forEach(function (row) {
      var m = row.querySelector("select").value;
      var p = row.querySelector("input").value.trim();
      if (p) out.push({ method: m, path: p });
    });
    return out;
  }

  $("add-rule").addEventListener("click", function () { createRuleRow(rulesContainer); });
  $("add-deny").addEventListener("click", function () { createRuleRow(denyContainer); });

  // ---------- 显隐逻辑 ----------

  function isL7() {
    var p = protocolEl.value;
    return p === "rest" || p === "websocket" || p === "graphql";
  }

  function updateVisibility() {
    var protocol = protocolEl.value;

    l4Hint.classList.toggle("hidden", protocol !== "");
    tcpHint.classList.toggle("hidden", protocol !== "tcp");

    // protocol 不设置或 tcp 时，隐藏 L7 字段并清空相关值
    if (isL7()) {
      enforcementField.classList.remove("hidden");
      accessField.classList.remove("hidden");
      tlsField.classList.remove("hidden");
      var custom = accessEl.value === "custom";
      rulesField.classList.toggle("hidden", !custom);
      denyToggleField.classList.toggle("hidden", !custom);
      denyField.classList.toggle("hidden", !custom || !denyEnabled.checked);
      tlsHint.classList.toggle("hidden", !tlsSkip.checked);
    } else {
      // 清空 L7 相关值，避免残留状态
      rulesContainer.innerHTML = "";
      denyContainer.innerHTML = "";
      denyEnabled.checked = false;
      tlsSkip.checked = false;
      tlsHint.classList.add("hidden");
      enforcementField.classList.add("hidden");
      accessField.classList.add("hidden");
      rulesField.classList.add("hidden");
      denyToggleField.classList.add("hidden");
      denyField.classList.add("hidden");
    }
  }

  // ---------- YAML 生成 ----------

  function yamlRulesBlock(lines, indent, rules, withAllow) {
    rules.forEach(function (r) {
      if (withAllow) {
        lines.push(indent + "- allow:");
        lines.push(indent + "    method: " + r.method);
        lines.push(indent + "    path: " + r.path);
      } else {
        lines.push(indent + "- method: " + r.method);
        lines.push(indent + "  path: " + r.path);
      }
    });
  }

  function buildYaml() {
    var host = hostEl.value.trim();
    if (!host) return null;

    var protocol = protocolEl.value;
    var lines = [];
    lines.push("network_policies:");
    lines.push("  - name: " + (policyNameEl.value.trim() || "my-policy"));
    lines.push("    endpoints:");
    lines.push("      - host: " + host);
    lines.push("        port: " + (portEl.value || "443"));

    if (protocol) {
      lines.push("        protocol: " + protocol);
    }

    if (isL7()) {
      var enforcement = document.querySelector('input[name="enforcement"]:checked').value;
      lines.push("        enforcement: " + enforcement);

      var access = accessEl.value;
      if (access !== "custom") {
        lines.push("        access: " + access);
      } else {
        var rules = collectRules(rulesContainer);
        if (rules.length) {
          lines.push("        rules:");
          yamlRulesBlock(lines, "          ", rules, true);
        }
        if (denyEnabled.checked) {
          var denies = collectRules(denyContainer);
          if (denies.length) {
            lines.push("        deny_rules:");
            yamlRulesBlock(lines, "          ", denies, false);
          }
        }
      }
    }

    if (tlsSkip.checked) {
      lines.push("        tls: skip");
    }

    return lines.join("\n") + "\n";
  }

  var SAMPLE_YAML = [
    "network_policies:",
    "  - name: my-policy",
    "    endpoints:",
    "      - host: api.github.com",
    "        port: 443",
    "        protocol: rest",
    "        enforcement: enforce",
    "        access: read-only",
    "",
  ].join("\n");

  function generate() {
    updateVisibility();
    updateAccessHint();
    var yaml = buildYaml();
    yamlOutput.textContent = yaml || SAMPLE_YAML + I18N[currentLang].sampleSuffix;
  }

  // ---------- 事件绑定 ----------

  [hostEl, portEl, protocolEl, accessEl, tlsSkip, denyEnabled, policyNameEl].forEach(function (el) {
    el.addEventListener("change", generate);
    el.addEventListener("input", generate);
  });

  document.querySelectorAll('input[name="enforcement"]').forEach(function (el) {
    el.addEventListener("change", generate);
  });

  copyBtn.addEventListener("click", function () {
    navigator.clipboard.writeText(yamlOutput.textContent).then(function () {
      var old = copyBtn.textContent;
      copyBtn.textContent = I18N[currentLang].copied;
      setTimeout(function () { copyBtn.textContent = old; }, 1500);
    });
  });

  downloadBtn.addEventListener("click", function () {
    var yaml = buildYaml() || SAMPLE_YAML;
    var blob = new Blob([yaml], { type: "text/yaml" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "candidate.yaml";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // 初始化
  applyLang();
  generate();
  createRuleRow(rulesContainer);
  rulesField.classList.toggle("hidden", accessEl.value !== "custom");
  denyToggleField.classList.toggle("hidden", accessEl.value !== "custom");
})();
