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

  var METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "*"];

  var ACCESS_HINTS = {
    "read-only": "read-only（REST）：GET, HEAD, OPTIONS",
    "read-write": "read-write（REST）：GET, HEAD, OPTIONS + POST, PUT, PATCH",
    "full": "full：所有方法与路径（放弃 L7 控制）",
    "custom": "自定义：在下方 rules 编辑器逐条指定 allow/deny"
  };

  function updateAccessHint() {
    accessHint.textContent = ACCESS_HINTS[accessEl.value] || "";
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
    yamlOutput.textContent = yaml || SAMPLE_YAML + "# ↑ 请填写 host 后生成策略";
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
      copyBtn.textContent = "已复制 ✓";
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

  // 初始化：默认给一条规则行示例
  generate();
  createRuleRow(rulesContainer);
  rulesField.classList.toggle("hidden", accessEl.value !== "custom");
  denyToggleField.classList.toggle("hidden", accessEl.value !== "custom");
})();
