/**
 * Rhynia Intelligence SaaS — Master Application Orchestrator
 * Strict Brand Compliance: Rhynia
 * Login-First Route Gate, View Switcher, Global State & Toast Utility
 */

// ==========================================
// GLOBAL APPLICATION STATE
// ==========================================
const AppState = {
  token: localStorage.getItem(CONFIG.TOKEN_KEY) || null,
  user: null,
  activeSessionId: localStorage.getItem(CONFIG.SESSION_KEY) || null,
  sessions: [],
  pendingFiles: [],
  isStreaming: false,
};

try {
  const cachedUser = localStorage.getItem(CONFIG.USER_KEY);
  if (cachedUser) {
    AppState.user = JSON.parse(cachedUser);
  }
} catch (e) {
  AppState.user = null;
}

// ==========================================
// VIEW SWITCHER (LOGIN-FIRST ROUTING GATE)
// ==========================================
const ALL_VIEWS = [
  "view-login",            // Screen 07
  "view-register",         // Screen 08
  "view-sms-otp",          // Screen 09
  "view-email-otp",        // Screen 10
  "view-forgot-password",  // Screen 11
  "view-app"               // Screens 01 - 06 Authenticated Workspace
];

function switchView(targetViewId) {
  ALL_VIEWS.forEach(viewId => {
    const el = document.getElementById(viewId);
    if (el) {
      if (viewId === targetViewId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });

  // Scroll to top of newly selected view
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ==========================================
// TOAST NOTIFICATION UTILITY
// ==========================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-2xl text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 border`;

  let icon = "info";
  if (type === "success") {
    icon = "check_circle";
    toast.className += " bg-[#16261c] text-[#a3f7bf] border-[#20633b]";
  } else if (type === "error") {
    icon = "error";
    toast.className += " bg-[#2d1618] text-[#ffb4ab] border-[#6b1e23]";
  } else {
    icon = "info";
    toast.className += " bg-[#1f1f1f] text-neutral-200 border-white/10";
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px] shrink-0">${icon}</span>
    <span class="leading-snug">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  });

  // Auto-dismiss after 3.5 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// STRING & MARKDOWN HELPERS
// ==========================================
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// UNIVERSAL FILE EXPORTER & EXTENSION MAPPINGS
// ==========================================
const EXTENSION_MAP = {
  python: { ext: "py", mime: "text/x-python", label: "Python" },
  py: { ext: "py", mime: "text/x-python", label: "Python" },
  javascript: { ext: "js", mime: "application/javascript", label: "JavaScript" },
  js: { ext: "js", mime: "application/javascript", label: "JavaScript" },
  typescript: { ext: "ts", mime: "application/typescript", label: "TypeScript" },
  ts: { ext: "ts", mime: "application/typescript", label: "TypeScript" },
  html: { ext: "html", mime: "text/html", label: "HTML" },
  htm: { ext: "html", mime: "text/html", label: "HTML" },
  css: { ext: "css", mime: "text/css", label: "CSS" },
  json: { ext: "json", mime: "application/json", label: "JSON" },
  csv: { ext: "csv", mime: "text/csv;charset=utf-8;", label: "CSV" },
  sql: { ext: "sql", mime: "application/sql", label: "SQL" },
  svg: { ext: "svg", mime: "image/svg+xml", label: "SVG" },
  xml: { ext: "xml", mime: "application/xml", label: "XML" },
  markdown: { ext: "md", mime: "text/markdown", label: "Markdown" },
  md: { ext: "md", mime: "text/markdown", label: "Markdown" },
  java: { ext: "java", mime: "text/x-java-source", label: "Java" },
  cpp: { ext: "cpp", mime: "text/x-c++src", label: "C++" },
  c: { ext: "c", mime: "text/x-csrc", label: "C" },
  csharp: { ext: "cs", mime: "text/x-csharp", label: "C#" },
  cs: { ext: "cs", mime: "text/x-csharp", label: "C#" },
  php: { ext: "php", mime: "text/x-php", label: "PHP" },
  ruby: { ext: "rb", mime: "text/x-ruby", label: "Ruby" },
  rb: { ext: "rb", mime: "text/x-ruby", label: "Ruby" },
  rust: { ext: "rs", mime: "text/rust", label: "Rust" },
  rs: { ext: "rs", mime: "text/rust", label: "Rust" },
  go: { ext: "go", mime: "text/x-go", label: "Go" },
  sh: { ext: "sh", mime: "application/x-sh", label: "Shell" },
  bash: { ext: "sh", mime: "application/x-sh", label: "Bash" },
  powershell: { ext: "ps1", mime: "text/plain", label: "PowerShell" },
  ps1: { ext: "ps1", mime: "text/plain", label: "PowerShell" },
  yaml: { ext: "yaml", mime: "text/yaml", label: "YAML" },
  yml: { ext: "yaml", mime: "text/yaml", label: "YAML" },
  text: { ext: "txt", mime: "text/plain", label: "Text" },
  txt: { ext: "txt", mime: "text/plain", label: "Text" },
  r: { ext: "r", mime: "text/x-r", label: "R" },
  dart: { ext: "dart", mime: "application/dart", label: "Dart" },
  kotlin: { ext: "kt", mime: "text/x-kotlin", label: "Kotlin" },
  swift: { ext: "swift", mime: "text/x-swift", label: "Swift" }
};

function extractFileName(rawCode, ext) {
  const firstLine = (rawCode || "").trim().split("\n")[0] || "";
  const match = firstLine.match(/(?:#|\/\/|\/\*|<!--|--)\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return `rhynia_export_${Date.now().toString().slice(-6)}.${ext}`;
}

function copyCodeBlock(buttonEl) {
  const container = buttonEl.closest(".code-block-container");
  if (!container) return;
  const code = container.querySelector("code")?.innerText || "";
  navigator.clipboard.writeText(code);
  showToast("Code copied to clipboard!", "success");
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  if (icon) {
    icon.textContent = "check";
    setTimeout(() => icon.textContent = "content_copy", 2000);
  }
}

function downloadCodeBlock(buttonEl, lang) {
  const container = buttonEl.closest(".code-block-container");
  if (!container) return;
  const codeEl = container.querySelector("code");
  if (!codeEl) return;

  const rawCode = codeEl.innerText;
  const langKey = (lang || "").toLowerCase().trim();
  const config = EXTENSION_MAP[langKey] || { ext: langKey || "txt", mime: "text/plain", label: "File" };
  const fileName = extractFileName(rawCode, config.ext);

  const blob = new Blob([rawCode], { type: config.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded ${fileName}!`, "success");
}

function initMermaid() {
  if (typeof mermaid !== "undefined") {
    try {
      const isLight = document.documentElement.classList.contains("light");
      mermaid.initialize({
        startOnLoad: false,
        theme: isLight ? "default" : "dark",
        securityLevel: "loose",
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        themeVariables: isLight ? {
          darkMode: false,
          background: "#ffffff",
          primaryColor: "#0078D4",
          primaryTextColor: "#0e0e0e",
          primaryBorderColor: "#0078D4",
          lineColor: "#0078D4",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#e5e7eb"
        } : {
          darkMode: true,
          background: "#141619",
          primaryColor: "#0078D4",
          primaryTextColor: "#ffffff",
          primaryBorderColor: "#0078D4",
          lineColor: "#58a6ff",
          secondaryColor: "#1c2128",
          tertiaryColor: "#121417"
        }
      });
    } catch (e) {
      console.warn("Mermaid init error:", e);
    }
  }
}

function toggleMermaidView(buttonEl) {
  const container = buttonEl.closest(".mermaid-block-container");
  if (!container) return;
  const diagramBox = container.querySelector(".mermaid-diagram-box");
  const codeBox = container.querySelector(".code-raw-box");
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  const text = buttonEl.querySelector(".btn-label");

  if (!diagramBox || !codeBox) return;

  const isCodeHidden = codeBox.classList.contains("hidden");
  if (isCodeHidden) {
    codeBox.classList.remove("hidden");
    diagramBox.classList.add("hidden");
    if (icon) icon.textContent = "visibility";
    if (text) text.textContent = "Preview";
  } else {
    codeBox.classList.add("hidden");
    diagramBox.classList.remove("hidden");
    if (icon) icon.textContent = "code";
    if (text) text.textContent = "Code";
  }
}

function downloadMermaidAsSvg(buttonEl) {
  const container = buttonEl.closest(".mermaid-block-container");
  if (!container) return;
  const svgEl = container.querySelector(".mermaid-diagram-box svg");
  if (!svgEl) {
    showToast("Diagram is still rendering or invalid.", "error");
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rhynia_diagram_${Date.now().toString().slice(-6)}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("SmartArt Diagram downloaded as .svg!", "success");
}

async function renderAllMermaidDiagrams(rootEl) {
  const container = rootEl || document;
  const boxes = container.querySelectorAll(".mermaid-diagram-box:not([data-rendered='true'])");
  if (!boxes.length) return;

  if (typeof mermaid === "undefined") {
    return;
  }

  initMermaid();

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    const rawEncoded = box.getAttribute("data-mermaid-code");
    if (!rawEncoded) continue;

    const code = decodeURIComponent(rawEncoded).trim();
    const uniqueId = `mermaid_diag_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`;

    try {
      const { svg } = await mermaid.render(uniqueId, code);
      box.innerHTML = svg;
      box.setAttribute("data-rendered", "true");
      const svgEl = box.querySelector("svg");
      if (svgEl) {
        svgEl.style.maxWidth = "100%";
        svgEl.style.height = "auto";
        svgEl.classList.add("fluent-mermaid-svg");
      }
    } catch (err) {
      console.warn("Mermaid render error:", err);
      box.setAttribute("data-rendered", "error");
      box.innerHTML = `
        <div class="text-xs text-amber-400/90 flex items-center gap-1.5 p-3">
          <span class="material-symbols-outlined text-[18px]">warning</span>
          <span>Diagram rendering in progress or syntax error. Click 'Code' to view.</span>
        </div>
      `;
    }
  }
}

function toggleSvgPreview(buttonEl) {
  const container = buttonEl.closest(".code-block-container");
  if (!container) return;
  const previewBox = container.querySelector(".svg-preview-box");
  const codeBox = container.querySelector(".code-raw-box");
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  const text = buttonEl.querySelector(".btn-label");

  if (!previewBox || !codeBox) return;

  const isCodeHidden = codeBox.classList.contains("hidden");
  if (isCodeHidden) {
    codeBox.classList.remove("hidden");
    previewBox.classList.add("hidden");
    if (icon) icon.textContent = "visibility";
    if (text) text.textContent = "Preview";
  } else {
    codeBox.classList.add("hidden");
    previewBox.classList.remove("hidden");
    if (icon) icon.textContent = "code";
    if (text) text.textContent = "Code";
  }
}

function downloadTableAsCSV(buttonEl) {
  const tableContainer = buttonEl.closest(".markdown-table-wrapper");
  if (!tableContainer) return;
  const table = tableContainer.querySelector("table");
  if (!table) return;

  let csvContent = "";
  const rows = table.querySelectorAll("tr");
  rows.forEach(row => {
    const cells = row.querySelectorAll("th, td");
    const rowData = Array.from(cells).map(cell => {
      let text = cell.innerText.replace(/"/g, '""').trim();
      return `"${text}"`;
    });
    csvContent += rowData.join(",") + "\r\n";
  });

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fileName = `rhynia_table_${Date.now().toString().slice(-6)}.csv`;
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded ${fileName}!`, "success");
}

function splitTableRow(rowText) {
  let s = (rowText || "").trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map(cell => cell.trim());
}

function renderInlineMarkdown(str) {
  if (!str) return "";
  return str
    .replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[13px] text-white">$1</code>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong class="text-white font-semibold">$1</strong>`)
    .replace(/\*([^*]+)\*/g, `<em class="italic">$1</em>`);
}

function renderMarkdown(rawText) {
  if (!rawText) return "";

  const blocks = [];
  function storeBlock(html) {
    const idx = blocks.length;
    blocks.push(html);
    return `\n\n__RHYNIA_BLOCK_${idx}__\n\n`;
  }

  // 1. Normalize line endings
  let text = String(rawText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Triple-backtick code blocks
  text = text.replace(/```([a-zA-Z0-9_\-\.]*)[ \t]*\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanLang = (lang || "").toLowerCase().trim();

    // 2A. Mermaid SmartArt Diagram Blocks
    if (cleanLang === "mermaid") {
      const escapedCode = escapeHtml(code);
      const encodedCode = encodeURIComponent(code);

      const blockHtml = `
        <div class="mermaid-block-container relative rounded-xl overflow-hidden my-4 border border-white/10 bg-[#121417] shadow-lg">
          <div class="flex items-center justify-between px-3.5 py-2 bg-[#1c2128] border-b border-white/10 text-xs text-neutral-400">
            <span class="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
              <span class="material-symbols-outlined text-[16px] text-[#0078D4]">account_tree</span>
              <span class="font-semibold text-white">SmartArt Diagram</span>
            </span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="toggleMermaidView(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Toggle Code / Diagram View">
                <span class="material-symbols-outlined text-[14px] text-[#4cc2ff]">code</span>
                <span class="btn-label">Code</span>
              </button>
              <button type="button" onclick="downloadMermaidAsSvg(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Download Diagram as Vector SVG">
                <span class="material-symbols-outlined text-[14px] text-[#107c41]">file_download</span>
                <span>Export .svg</span>
              </button>
              <button type="button" onclick="copyCodeBlock(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Copy Mermaid Definition">
                <span class="material-symbols-outlined text-[14px]">content_copy</span>
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div class="mermaid-diagram-box p-4 flex items-center justify-center bg-[#101214] overflow-x-auto min-h-[150px]" data-mermaid-code="${encodedCode}">
            <div class="text-xs text-neutral-400 flex items-center gap-2">
              <span class="inline-block w-3.5 h-3.5 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin"></span>
              <span>Rendering diagram...</span>
            </div>
          </div>
          <div class="code-raw-box hidden">
            <pre class="p-3.5 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto leading-relaxed"><code>${escapedCode}</code></pre>
          </div>
        </div>
      `.trim();

      return storeBlock(blockHtml);
    }

    // 2B. Standard Code / SVG Blocks
    const config = EXTENSION_MAP[cleanLang] || { ext: cleanLang || "txt", label: cleanLang ? cleanLang.toUpperCase() : "CODE" };
    const isSvg = cleanLang === "svg" || code.includes("<svg");
    const escapedCode = escapeHtml(code);

    const blockHtml = `
      <div class="code-block-container relative rounded-xl overflow-hidden my-3 border border-white/10 bg-[#161616] shadow-lg">
        <div class="flex items-center justify-between px-3.5 py-2 bg-[#202020] border-b border-white/5 text-xs text-neutral-400">
          <span class="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
            <span class="w-2 h-2 rounded-full bg-[#0078D4]"></span>
            <span>${isSvg ? 'SmartArt Graphic' : config.label}</span>
          </span>
          <div class="flex items-center gap-2">
            ${isSvg ? `
            <button type="button" onclick="toggleSvgPreview(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Toggle Code / Visual Preview">
              <span class="material-symbols-outlined text-[14px] text-[#4cc2ff]">code</span>
              <span class="btn-label">Code</span>
            </button>` : ""}
            <button type="button" onclick="downloadCodeBlock(this, '${cleanLang}')" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Download .${config.ext} file directly">
              <span class="material-symbols-outlined text-[14px] text-[#0078D4]">download</span>
              <span>Download .${config.ext}</span>
            </button>
            <button type="button" onclick="copyCodeBlock(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Copy code to clipboard">
              <span class="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Copy</span>
            </button>
          </div>
        </div>
        ${isSvg ? `<div class="svg-preview-box p-4 flex items-center justify-center bg-[#111111] overflow-x-auto min-h-[160px]">${code}</div>` : ""}
        <div class="code-raw-box ${isSvg ? 'hidden' : ''}">
          <pre class="p-3.5 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto leading-relaxed"><code>${escapedCode}</code></pre>
        </div>
      </div>
    `.trim();

    return storeBlock(blockHtml);
  });

  // 3. GFM Markdown Tables
  const lines = text.split("\n");
  const processedLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("|") && line.trim().length > 0) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim().length > 0) {
        tableLines.push(lines[j]);
        j++;
      }

      if (tableLines.length >= 2) {
        const separatorIdx = tableLines.findIndex((tl, idx) => {
          if (idx === 0) return false;
          const s = tl.trim();
          return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(s);
        });

        if (separatorIdx > 0) {
          const headerLine = tableLines[0];
          const headers = splitTableRow(headerLine);
          const bodyLines = tableLines.slice(separatorIdx + 1);

          let tableHtml = `<div class="markdown-table-wrapper my-4 rounded-xl border border-white/10 bg-[#121417] overflow-hidden shadow-lg">`;
          tableHtml += `<div class="flex items-center justify-between px-3.5 py-1.5 bg-[#1c2128] border-b border-white/10 text-xs text-neutral-400">`;
          tableHtml += `<span class="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">`;
          tableHtml += `<span class="material-symbols-outlined text-[15px] text-[#0078D4]">table_chart</span>`;
          tableHtml += `<span>Data Table</span>`;
          tableHtml += `</span>`;
          tableHtml += `<button type="button" onclick="downloadTableAsCSV(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300" title="Download as CSV Spreadsheet for Excel">`;
          tableHtml += `<span class="material-symbols-outlined text-[14px] text-[#107c41]">file_download</span>`;
          tableHtml += `<span>Export .csv</span>`;
          tableHtml += `</button>`;
          tableHtml += `</div>`;
          tableHtml += `<div class="overflow-x-auto">`;
          tableHtml += `<table class="w-full text-left text-xs sm:text-sm border-collapse">`;
          tableHtml += `<thead><tr class="bg-[#1c2128]">`;
          headers.forEach((h, hIdx) => {
            const isLast = hIdx === headers.length - 1;
            const borderR = isLast ? "" : "border-r border-white/10";
            tableHtml += `<th class="px-4 py-2.5 font-semibold text-[#58a6ff] tracking-tight ${borderR}">${renderInlineMarkdown(escapeHtml(h))}</th>`;
          });
          tableHtml += `</tr></thead>`;
          tableHtml += `<tbody>`;
          bodyLines.forEach((bl, rowIdx) => {
            const cells = splitTableRow(bl);
            const isLastRow = rowIdx === bodyLines.length - 1;
            const borderB = isLastRow ? "" : "border-b border-white/10";
            tableHtml += `<tr class="bg-[#121417] hover:bg-[#191c22] transition-colors ${borderB}">`;
            for (let c = 0; c < headers.length; c++) {
              const cellVal = cells[c] || "";
              const isLastCol = c === headers.length - 1;
              const borderR = isLastCol ? "" : "border-r border-white/10";
              tableHtml += `<td class="px-4 py-2 text-neutral-200 ${borderR}">${renderInlineMarkdown(escapeHtml(cellVal))}</td>`;
            }
            tableHtml += `</tr>`;
          });
          tableHtml += `</tbody></table></div></div>`;

          processedLines.push(storeBlock(tableHtml));
          i = j;
          continue;
        }
      }
    }

    processedLines.push(line);
    i++;
  }

  text = processedLines.join("\n");

  // 4. Escape general HTML (for surrounding text)
  text = escapeHtml(text);

  // 5. Inline text styles (bold, italic, inline code)
  text = renderInlineMarkdown(text);

  // 6. Lists
  text = text.replace(/(?:^|\n)[*-]\s+(.+)/g, `\n<li class="ml-4 list-disc text-neutral-300 leading-relaxed">$1</li>`);
  text = text.replace(/(?:^|\n)\d+\.\s+(.+)/g, `\n<li class="ml-4 list-decimal text-neutral-300 leading-relaxed">$1</li>`);

  // 7. Paragraphs & Line Breaks
  text = text.replace(/\n\n+/g, `<div class="h-2"></div>`);
  text = text.replace(/\n/g, `<br/>`);

  // 8. Restore Code & Table Blocks
  blocks.forEach((blockHtml, idx) => {
    const placeholder = `__RHYNIA_BLOCK_${idx}__`;
    text = text.split(placeholder).join(blockHtml);
  });

  // 9. Clean up stray <br/> adjacent to block elements
  text = text.replace(/(?:<br\/>|\s)*(<div class="(?:markdown-table-wrapper|code-block-container|mermaid-block-container))/g, '$1');
  text = text.replace(/(<\/div>)(?:<br\/>|\s)*/g, '$1');

  return text;
}

// Expose functions to window
window.renderMarkdown = renderMarkdown;
window.downloadCodeBlock = downloadCodeBlock;
window.copyCodeBlock = copyCodeBlock;
window.toggleSvgPreview = toggleSvgPreview;
window.downloadTableAsCSV = downloadTableAsCSV;
window.toggleMermaidView = toggleMermaidView;
window.downloadMermaidAsSvg = downloadMermaidAsSvg;
window.renderAllMermaidDiagrams = renderAllMermaidDiagrams;


// ==========================================
// APPLICATION INITIALIZATION & ROUTE GUARD
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Theme & Accent preference from storage
  const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || "dark";
  applyTheme(savedTheme);

  const savedAccent = localStorage.getItem(CONFIG.ACCENT_KEY) || "#0078D4";
  applyAccentColor(savedAccent, false);

  // 2. Direct Hash Route or Seamless Chat Gateway
  if (!AppState.token) {
    const hash = window.location.hash.toLowerCase().replace("#", "").trim();
    if (hash === "chat" || hash === "empty-chat" || hash === "settings" || !hash) {
      try {
        const guestRes = await fetch(`${CONFIG.API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: "guest_user@rhynia.com" })
        });
        if (guestRes.ok) {
          const authData = await guestRes.json();
          AppState.token = authData.access_token;
          localStorage.setItem(CONFIG.TOKEN_KEY, authData.access_token);
          AppState.user = authData.user;
          localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(authData.user));
        }
      } catch (e) {
        console.warn("Guest auto-auth fallback", e);
      }
    }

    if (!AppState.token) {
      if (window.location.hash) {
        handleHashRoute();
      } else {
        switchView("view-login");
      }
      return;
    }
  }

  // 3. Validate Token & Load Authenticated User
  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) {
      // Invalid or expired token: clear and force login
      logoutUser();
      return;
    }

    const profile = await res.json();
    AppState.user = profile;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(profile));

    // Switch to Authenticated Workspace
    switchView("view-app");

    // Populate user profile info across all UI elements
    renderUserProfileUI(profile);
    updateDrawerProfileAvatar();

    // Load active sessions list
    await loadSessions();

    // Check if there was an active session
    if (AppState.activeSessionId) {
      await openSession(AppState.activeSessionId);
    } else {
      showEmptyChatScreen();
    }

    // Load Storage metrics
    await loadStorage();

  } catch (err) {
    console.error("Initialization error:", err);
    // If backend unreachable, still allow cached UI or login
    if (!AppState.user) {
      switchView("view-login");
    } else {
      switchView("view-app");
    }
  }

  // 4. Attach Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // ESC closes Drawer, Settings, Flyouts
    if (e.key === "Escape") {
      toggleSidebarDrawer(false);
      toggle3DotsMenu(false);
      toggleAttachmentMenu(false);
      toggleEditProfileModal(false);
      const colorPicker = document.getElementById("accent-color-picker-flyout");
      if (colorPicker) colorPicker.classList.add("hidden");
      const langPicker = document.getElementById("language-selector-flyout");
      if (langPicker) langPicker.classList.add("hidden");
    }
  });

  // 5. Initialize Send Button State
  if (typeof updateSendButtonState === "function") {
    updateSendButtonState();
  }

  // 6. Handle URL Hash Navigation for Direct Links
  if (window.location.hash) {
    handleHashRoute();
  }
});

// ==========================================
// URL HASH ROUTING FOR DIRECT VIEW LINKS
// ==========================================
function handleHashRoute() {
  const hash = window.location.hash.toLowerCase().replace("#", "").trim();
  if (!hash) return;

  if (hash === "login" || hash === "signin") {
    switchView("view-login");
  } else if (hash === "register" || hash === "signup") {
    switchView("view-register");
  } else if (hash === "sms-otp") {
    switchView("view-sms-otp");
  } else if (hash === "email-otp") {
    switchView("view-email-otp");
  } else if (hash === "forgot-password" || hash === "reset-password") {
    switchView("view-forgot-password");
  } else if (hash === "settings") {
    switchView("view-app");
    openSettingsPanel();
  } else if (hash === "edit-profile") {
    switchView("view-app");
    openSettingsPanel();
    toggleEditProfileModal(true);
  } else if (hash === "drawer") {
    switchView("view-app");
    closeSettingsPanel();
    toggleSidebarDrawer(true);
  } else if (hash === "chat" || hash === "empty-chat") {
    switchView("view-app");
    closeSettingsPanel();
    toggleSidebarDrawer(false);
  }
}

window.addEventListener("hashchange", handleHashRoute);

