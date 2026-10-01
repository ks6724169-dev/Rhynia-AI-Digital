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
    if (AppState.user && AppState.user.email && AppState.user.email.toLowerCase() === "mk191515480@gmail.com") {
      AppState.user.plan_tier = "ultra_pro";
    }
  }
} catch (e) {
  AppState.user = null;
}

/**
 * Dynamically resolves and renders the logged-in user's real name across the UI (Hello [Name])
 */
function updateEmptyStateUserName(userObj) {
  const el = document.getElementById("empty-state-username");
  if (!el) return;

  const user = userObj || (window.AppState && window.AppState.user) || (function() {
    try {
      const cached = localStorage.getItem(CONFIG.USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  })();

  if (!user) {
    el.textContent = "";
    return;
  }

  let finalName = "";
  // 1. Priority: User's explicitly set display_name or full_name
  if (user.display_name && typeof user.display_name === "string" && user.display_name.trim()) {
    finalName = user.display_name.trim();
  } else if (user.full_name && typeof user.full_name === "string" && user.full_name.trim()) {
    finalName = user.full_name.trim();
  } else if (user.name && typeof user.name === "string" && user.name.trim()) {
    finalName = user.name.trim();
  } else if (user.username && typeof user.username === "string" && user.username.trim()) {
    // 2. Fallback: Cleaned username (e.g. "kumarsatnamimanish_688" -> "Kumarsatnamimanish")
    const clean = user.username.replace(/[_\d]+$/, "").trim();
    finalName = clean ? (clean.charAt(0).toUpperCase() + clean.slice(1)) : user.username;
  } else if (user.email && typeof user.email === "string" && user.email.trim()) {
    // 3. Fallback: Email username part
    const part = user.email.split("@")[0].replace(/[_\d]+$/, "").trim();
    finalName = part ? (part.charAt(0).toUpperCase() + part.slice(1)) : user.email.split("@")[0];
  }

  el.textContent = finalName || "";
}
window.updateEmptyStateUserName = updateEmptyStateUserName;

// ==========================================
// VIEW SWITCHER (LOGIN-FIRST ROUTING GATE)
// ==========================================
const ALL_VIEWS = [
  "view-login",            // Screen 07
  "view-register",         // Screen 08
  "view-sms-otp",          // Screen 09
  "view-email-otp",        // Screen 10
  "view-forgot-password",  // Screen 11
  "view-new-password",     // Screen 12
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

  // Re-initialize Google Auth buttons when entering login or registration view
  if (targetViewId === "view-login" || targetViewId === "view-register") {
    if (typeof initGoogleAuth === "function") {
      setTimeout(initGoogleAuth, 50);
    }
  }
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

function cleanWikimediaUrl(url) {
  if (!url) return "";
  let clean = url.trim();
  if (clean.includes("/wikipedia/commons/thumb/")) {
    const parts = clean.split("/wikipedia/commons/thumb/")[1].split("/");
    if (parts.length >= 3) {
      clean = `https://upload.wikimedia.org/wikipedia/commons/${parts[0]}/${parts[1]}/${parts[2]}`;
    }
  }
  return clean;
}

function getProxiedImageUrl(url) {
  if (!url) return "";
  const clean = cleanWikimediaUrl(url);
  // Route external diagrams through our high-performance backend proxy with authoritative bot headers
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return `/api/v1/proxy-image?url=${encodeURIComponent(clean)}`;
  }
  return clean;
}

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
        suppressErrorRendering: true,
        theme: isLight ? "default" : "dark",
        securityLevel: "loose",
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 10.5,
        flowchart: {
          htmlLabels: false,
          useMaxWidth: true,
          curve: 'linear'
        },
        themeVariables: isLight ? {
          darkMode: false,
          fontSize: "10.5px",
          background: "#ffffff",
          primaryColor: "#0078D4",
          primaryTextColor: "#0e0e0e",
          primaryBorderColor: "#0078D4",
          lineColor: "#0078D4",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#e5e7eb"
        } : {
          darkMode: true,
          fontSize: "10.5px",
          background: "#141619",
          primaryColor: "#0078D4",
          primaryTextColor: "#ffffff",
          primaryBorderColor: "#0078D4",
          lineColor: "#58a6ff",
          secondaryColor: "#1c2128",
          tertiaryColor: "#121417"
        }
      });
      mermaid.parseError = function(err, hash) {
        console.warn("Suppressed Mermaid syntax error:", err);
      };
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

  showToast("Diagram downloaded!", "success");
}

function normalizeMermaidCode(rawCode) {
  if (!rawCode) return "";
  let code = rawCode.trim();

  // Strip markdown code fences if present
  code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // 1. Normalize diagram keywords to case-sensitive Mermaid standard
  code = code.replace(/^(statediagram(?:-v2)?|quadrantchart|sequencediagram)/im, (m) => {
    const l = m.toLowerCase();
    if (l === "statediagram") return "stateDiagram-v2";
    if (l === "quadrantchart") return "quadrantChart";
    if (l === "sequencediagram") return "sequenceDiagram";
    return l;
  });

  // 2. Fix arrow pipes with trailing greater-than: -->|label|> to -->|label|
  code = code.replace(/(-->|---|==>|-\.->)\s*\|([^|]+)\|>/g, "$1|$2|");

  // 3. Ensure node brackets with spaces or non-ascii are safely quoted: A[text] -> A["text"]
  code = code.replace(/(\b[A-Za-z0-9_]+)\[([^"\]\n]+)\]/g, (match, id, label) => {
    const trimmed = label.trim();
    if (!trimmed.startsWith('"') && !trimmed.endsWith('"')) {
      return `${id}["${trimmed.replace(/"/g, "'")}"]`;
    }
    return match;
  });

  // 4. Ensure diagram type starts cleanly (support flowchart, graph, pie, xychart-beta, timeline, etc.)
  if (!/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|xychart-beta|xychart|timeline|quadrantChart|gitGraph|sankey-beta)/i.test(code)) {
    code = "flowchart TD\n" + code;
  }

  return code;
}

window.normalizeMermaidCode = normalizeMermaidCode;

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

    const rawCode = decodeURIComponent(rawEncoded).trim();
    const code = normalizeMermaidCode(rawCode);
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
      // Suppress and clean any stray error banners injected onto document.body by Mermaid
      document.querySelectorAll("body > [id^='dmermaid'], body > [id^='d'], body > .error-icon").forEach(el => {
        if (el.innerText && (el.innerText.includes("Syntax error") || el.innerText.includes("mermaid version"))) {
          el.remove();
        }
      });

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

function extractCleanDomain(url) {
  try {
    const cleanUrl = String(url).replace(/&amp;/g, "&");
    const u = new URL(cleanUrl);
    let host = u.hostname.replace(/^www\./i, "");
    return host;
  } catch (e) {
    return String(url).replace(/^https?:\/\/(?:www\.)?/i, "").split(/[\/\?#]/)[0] || "source";
  }
}

function renderInlineMarkdown(str) {
  if (!str) return "";
  let out = str;

  // 1. Inline code: `code`
  out = out.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[13px] text-white">$1</code>`);

  // 2. Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, `<strong class="text-white font-semibold">$1</strong>`);

  // 3. Italic: *text*
  out = out.replace(/\*([^*]+)\*/g, `<em class="italic">$1</em>`);

  // 4. Markdown Links: [Anchor Text](URL) -> Compact Blue Source Link Pills
  // Negative lookbehind (?<!!) guarantees ![Caption](URL) images are NOT matched as regular links!
  out = out.replace(/(?<!!)\[([^\]]+)\]\((https?:\/\/[^\s\)\"\'<>]+)\)/gi, (match, label, url) => {
    const cleanLabel = (label || "").trim();
    // Numeric citation badges like [1], [2]
    if (/^\d+$/.test(cleanLabel)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rhynia-citation-pill">[${cleanLabel}]</a>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rhynia-source-link"><span class="material-symbols-outlined source-icon">public</span><span class="source-text">${cleanLabel}</span><span class="material-symbols-outlined external-icon">open_in_new</span></a>`;
  });

  out = out.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s\)\"\'<>]+)\)/gi, (match, caption, url) => {
    const cleanUrl = cleanWikimediaUrl(url);
    const proxiedUrl = getProxiedImageUrl(cleanUrl);
    const safeCaption = escapeHtml(caption || "Image");
    return `<div class="rhynia-image-gallery my-3.5 max-w-xl"><div class="rhynia-image-card rounded-2xl overflow-hidden border border-white/10 bg-[#161616] shadow-xl transition-all duration-300 hover:border-[#0078D4]/60"><div class="rhynia-img-wrapper relative bg-[#0a0a0a] min-h-[190px] max-h-[320px] flex items-center justify-center cursor-pointer group" onclick="window.openRhyniaLightbox('${proxiedUrl}', '${safeCaption}')" title="Click to view"><img src="${proxiedUrl}" alt="${safeCaption}" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300" onerror="this.onerror=null; this.src='/api/v1/proxy-image?url=' + encodeURIComponent('${encodeURIComponent(cleanUrl)}');"/></div><div class="px-3.5 py-2.5 bg-[#1c1c1c] text-xs text-neutral-300 flex items-center justify-between border-t border-white/5"><span class="font-medium text-white truncate mr-2" title="${safeCaption}">${safeCaption}</span><div class="flex items-center gap-2 shrink-0"><button type="button" onclick="window.openRhyniaLightbox('${proxiedUrl}', '${safeCaption}')" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#4cc2ff] text-[11px] flex items-center gap-1" title="View"><span class="material-symbols-outlined text-[14px]">fullscreen</span><span>View</span></button><a href="${cleanUrl}" target="_blank" download class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#10b981] text-[11px] flex items-center gap-1" title="Download"><span class="material-symbols-outlined text-[14px]">download</span><span>Download</span></a></div></div></div></div>`;
  });

  // 5. Standalone numeric citation brackets: [1], [2] (not already linked in markdown)
  out = out.replace(/(?:^|\s)\[(\d{1,2})\](?!\()/g, (match, num) => {
    return ` <span class="rhynia-citation-pill">[${num}]</span>`;
  });

  // 6. Bare HTTP/HTTPS URLs (only in text nodes outside HTML tags - keep plain text, do not create source link pills)
  const parts = out.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/(^|[\s(])https?:\/\/[^\s\)\"\'<>]+(?=[)\s.,;:]|$)/gi, "");
  }
  out = parts.join("");

  return out;
}


// =========================================================
// RHYNIA MICROSOFT OFFICE VISUAL CHART ENGINE
// =========================================================
const OFFICE_PALETTE = [
  "#0078D4", // Office Blue
  "#ED7D31", // Office Coral / Orange
  "#A5A5A5", // Slate Gray
  "#FFC000", // Warm Gold
  "#4472C4", // Deep Blue
  "#70AD47", // Excel Green
  "#264478", // Deep Navy
  "#9E480E", // Rust Brown
  "#636363", // Charcoal
  "#997300", // Dark Mustard
  "#255E91", // Sky Blue
  "#43682B"  // Forest Green
];

const CHART_TYPE_META = {
  column: { icon: "bar_chart", label: "Column Chart" },
  clustered_column: { icon: "bar_chart", label: "Clustered Column" },
  stacked_column: { icon: "bar_chart", label: "Stacked Column" },
  bar: { icon: "align_horizontal_left", label: "Bar Chart" },
  clustered_bar: { icon: "align_horizontal_left", label: "Clustered Bar" },
  stacked_bar: { icon: "align_horizontal_left", label: "Stacked Bar" },
  line: { icon: "show_chart", label: "Line Chart" },
  spline: { icon: "show_chart", label: "Smooth Line" },
  area: { icon: "area_chart", label: "Area Chart" },
  stacked_area: { icon: "area_chart", label: "Stacked Area" },
  pie: { icon: "pie_chart", label: "Pie Chart" },
  pie3d: { icon: "pie_chart", label: "3D Pie Chart" },
  doughnut: { icon: "donut_small", label: "Doughnut Chart" },
  donut: { icon: "donut_small", label: "Doughnut Chart" },
  radar: { icon: "radar", label: "Radar Chart" },
  spider: { icon: "radar", label: "Spider Chart" },
  scatter: { icon: "scatter_plot", label: "XY Scatter" },
  xy: { icon: "scatter_plot", label: "XY Scatter" },
  bubble: { icon: "bubble_chart", label: "Bubble Chart" },
  stock: { icon: "candlestick_chart", label: "Stock Chart" },
  candlestick: { icon: "candlestick_chart", label: "Candlestick Chart" },
  surface: { icon: "view_in_ar", label: "Surface 3D" }
};

function hexToRgba(hex, alpha = 0.6) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(0, 120, 212, ${alpha})`;
  }
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split("").map(ch => ch + ch).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildChartDataTable(labels, datasets) {
  if (!labels || !labels.length) return "";
  const dss = datasets || [];
  
  let html = `<table class="chart-data-table"><thead><tr>`;
  html += `<th>Category / Label</th>`;
  dss.forEach(ds => {
    html += `<th>${escapeHtml(ds.label || "Value")}</th>`;
  });
  html += `</tr></thead><tbody>`;

  labels.forEach((label, idx) => {
    html += `<tr><td class="font-medium text-white">${escapeHtml(String(label))}</td>`;
    dss.forEach(ds => {
      let val = (ds.data && ds.data[idx] !== undefined) ? ds.data[idx] : "-";
      if (typeof val === "object" && val !== null) {
        val = JSON.stringify(val);
      }
      html += `<td>${escapeHtml(String(val))}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

function toggleChartView(buttonEl) {
  const card = buttonEl.closest(".rhynia-chart-card");
  if (!card) return;
  const canvasBox = card.querySelector(".chart-canvas-container");
  const dataBox = card.querySelector(".chart-data-box");
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  const text = buttonEl.querySelector(".btn-label");

  if (!canvasBox || !dataBox) return;

  const isDataHidden = dataBox.classList.contains("hidden");
  if (isDataHidden) {
    dataBox.classList.remove("hidden");
    canvasBox.classList.add("hidden");
    if (icon) icon.textContent = "bar_chart";
    if (text) text.textContent = "Chart";
  } else {
    dataBox.classList.add("hidden");
    canvasBox.classList.remove("hidden");
    if (icon) icon.textContent = "table_chart";
    if (text) text.textContent = "Data";
  }
}

function downloadChartAsPng(buttonEl) {
  const card = buttonEl.closest(".rhynia-chart-card");
  if (!card) return;
  const canvas = card.querySelector("canvas");
  if (!canvas) {
    showToast("Chart canvas not found.", "error");
    return;
  }

  try {
    let dataUrl;
    if (canvas._chartInstance) {
      dataUrl = canvas._chartInstance.toBase64Image("image/png", 1);
    } else {
      dataUrl = canvas.toDataURL("image/png");
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    const title = card.getAttribute("data-chart-title") || "rhynia_chart";
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24);
    a.download = `${cleanTitle}_${Date.now().toString().slice(-6)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast("Office Chart downloaded as .png!", "success");
  } catch (err) {
    console.error("Export chart error:", err);
    showToast("Failed to export chart image", "error");
  }
}

function copyChartSpec(buttonEl) {
  const card = buttonEl.closest(".rhynia-chart-card");
  if (!card) return;
  const rawEncoded = card.getAttribute("data-chart-spec");
  if (!rawEncoded) return;
  try {
    const raw = decodeURIComponent(rawEncoded);
    navigator.clipboard.writeText(raw);
    showToast("Chart specification copied!", "success");
    const icon = buttonEl.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = "check";
      setTimeout(() => (icon.textContent = "content_copy"), 2000);
    }
  } catch (e) {
    showToast("Failed to copy specification", "error");
  }
}

async function renderAllRhyniaCharts(rootEl) {
  const container = rootEl || document;
  const cards = container.querySelectorAll(".rhynia-chart-card:not([data-rendered='true'])");
  if (!cards.length) return;

  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded yet.");
    return;
  }

  const isLight = document.documentElement.classList.contains("light");
  const textColor = isLight ? "#1e293b" : "#e2e8f0";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)";

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const canvas = card.querySelector("canvas");
    const rawEncoded = card.getAttribute("data-chart-spec");
    if (!canvas || !rawEncoded) continue;

    let spec;
    try {
      const rawJson = decodeURIComponent(rawEncoded).trim();
      spec = JSON.parse(rawJson);
    } catch (e) {
      try {
        const rawJson = decodeURIComponent(rawEncoded).trim();
        const fixedJson = rawJson.replace(/,\s*([\]}])/g, "$1");
        spec = JSON.parse(fixedJson);
      } catch (e2) {
        console.warn("Invalid chart JSON:", e2);
        card.setAttribute("data-rendered", "error");
        continue;
      }
    }

    const rawType = (spec.type || "column").toLowerCase().trim();
    let chartJsType = "bar";
    let isHorizontal = false;
    let isStacked = spec.stacked || false;
    let isArea = false;

    if (rawType === "column" || rawType === "clustered_column") {
      chartJsType = "bar";
      isHorizontal = false;
    } else if (rawType === "stacked_column") {
      chartJsType = "bar";
      isStacked = true;
    } else if (rawType === "bar" || rawType === "horizontal_bar") {
      chartJsType = "bar";
      isHorizontal = true;
    } else if (rawType === "stacked_bar") {
      chartJsType = "bar";
      isHorizontal = true;
      isStacked = true;
    } else if (rawType === "line" || rawType === "spline") {
      chartJsType = "line";
    } else if (rawType === "area" || rawType === "stacked_area") {
      chartJsType = "line";
      isArea = true;
      if (rawType === "stacked_area") isStacked = true;
    } else if (rawType === "pie" || rawType === "pie3d") {
      chartJsType = "pie";
    } else if (rawType === "doughnut" || rawType === "donut") {
      chartJsType = "doughnut";
    } else if (rawType === "radar" || rawType === "spider") {
      chartJsType = "radar";
    } else if (rawType === "polararea" || rawType === "polar") {
      chartJsType = "polarArea";
    } else if (rawType === "scatter" || rawType === "xy") {
      chartJsType = "scatter";
    } else if (rawType === "bubble") {
      chartJsType = "bubble";
    } else if (rawType === "stock" || rawType === "candlestick") {
      chartJsType = "bar";
    } else if (rawType === "surface") {
      chartJsType = "radar";
    }

    const labels = spec.labels || spec.data?.labels || [];
    let datasets = spec.datasets || spec.data?.datasets || [];
    const isPieLike = ["pie", "doughnut", "polarArea"].includes(chartJsType);

    datasets = datasets.map((ds, dsIdx) => {
      const paletteColor = OFFICE_PALETTE[dsIdx % OFFICE_PALETTE.length];
      let bg = ds.backgroundColor;
      let border = ds.borderColor;

      if (isPieLike) {
        if (!bg) {
          bg = labels.map((_, lIdx) => OFFICE_PALETTE[lIdx % OFFICE_PALETTE.length]);
        }
        if (!border) {
          border = isLight ? "#ffffff" : "#121417";
        }
      } else if (isArea) {
        if (!bg) bg = hexToRgba(paletteColor, 0.25);
        if (!border) border = paletteColor;
      } else if (chartJsType === "line") {
        if (!border) border = paletteColor;
        if (!bg) bg = hexToRgba(paletteColor, 0.1);
      } else if (chartJsType === "bar") {
        if (!bg) bg = hexToRgba(paletteColor, 0.85);
        if (!border) border = paletteColor;
      } else if (chartJsType === "radar") {
        if (!bg) bg = hexToRgba(paletteColor, 0.25);
        if (!border) border = paletteColor;
      }

      return {
        ...ds,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: ds.borderWidth || (chartJsType === "line" || chartJsType === "radar" ? 2.5 : 1),
        tension: ds.tension !== undefined ? ds.tension : 0.35,
        fill: isArea ? (isStacked ? true : "origin") : ds.fill || false,
        pointRadius: chartJsType === "line" || chartJsType === "radar" ? 4.5 : undefined,
        pointHoverRadius: chartJsType === "line" || chartJsType === "radar" ? 7 : undefined,
        pointBackgroundColor: chartJsType === "line" || chartJsType === "radar" ? border : undefined,
        borderRadius: chartJsType === "bar" && !isStacked ? 4 : 0
      };
    });

    const chartConfig = {
      type: chartJsType,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            display: isPieLike || datasets.length > 1,
            position: isPieLike ? "right" : "top",
            labels: {
              color: textColor,
              font: {
                family: 'Segoe UI, Inter, sans-serif',
                size: 11.5,
                weight: 500
              },
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle"
            }
          },
          tooltip: {
            backgroundColor: isLight ? "#ffffff" : "#1c2128",
            titleColor: isLight ? "#0f172a" : "#ffffff",
            bodyColor: isLight ? "#334155" : "#cbd5e1",
            borderColor: "rgba(0, 120, 212, 0.35)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            boxPadding: 4,
            callbacks: isPieLike ? {
              label: function(context) {
                const val = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + Number(b), 0);
                const pct = total > 0 ? ((Number(val) / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val} (${pct}%)`;
              }
            } : undefined
          }
        }
      }
    };

    if (!["pie", "doughnut", "polarArea", "radar"].includes(chartJsType)) {
      chartConfig.options.scales = {
        x: {
          stacked: isStacked,
          ticks: {
            color: textColor,
            font: { family: 'Segoe UI, Inter, sans-serif', size: 11 }
          },
          grid: {
            color: gridColor,
            drawBorder: false
          }
        },
        y: {
          stacked: isStacked,
          ticks: {
            color: textColor,
            font: { family: 'Segoe UI, Inter, sans-serif', size: 11 }
          },
          grid: {
            color: gridColor,
            drawBorder: false
          }
        }
      };
    } else if (chartJsType === "radar") {
      chartConfig.options.scales = {
        r: {
          ticks: {
            color: textColor,
            backdropColor: "transparent",
            font: { size: 10 }
          },
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: { family: 'Segoe UI, Inter, sans-serif', size: 11, weight: 600 }
          }
        }
      };
    }

    try {
      if (canvas._chartInstance) {
        canvas._chartInstance.destroy();
      }
      const newChart = new Chart(canvas, chartConfig);
      canvas._chartInstance = newChart;
      card.setAttribute("data-rendered", "true");
    } catch (renderErr) {
      console.error("Failed to render Chart.js chart:", renderErr);
      card.setAttribute("data-rendered", "error");
    }
  }
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

  // 1B. Strip trailing source blocks and external web links (preserve markdown image tags ![...](...))
  text = text.replace(/(?:\n+|\s+)(?:❖\s*)?\*\*(?:स्रोतः?|Sources?|संदर्भ|References?)\*\*[\s\S]*$/i, "");
  text = text.replace(/^[ \t]*[✔•\-\*]\s*\[(?:[^\]]+)\]\(https?:\/\/[^\s\)\"\']+\)[ \t]*$/gmi, "");
  text = text.replace(/(?<!\!)\[([^\]]+)\]\(https?:\/\/[^\s\)\"\']+\)/gi, "$1");

  // 2. Triple-backtick code blocks
  text = text.replace(/```([a-zA-Z0-9_\-\.]*)[ \t]*\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanLang = (lang || "").toLowerCase().trim();

    // 2A-0. Rhynia Presentation Deck Blocks
    if (cleanLang === "rhynia-presentation" || cleanLang === "presentation" || cleanLang === "slide-deck" || cleanLang === "pptx") {
      let deckSpec = null;
      try {
        deckSpec = JSON.parse(code.trim());
      } catch (e) {
        try {
          const fixed = code.trim().replace(/,\s*([\]}])/g, "$1");
          deckSpec = JSON.parse(fixed);
        } catch (e2) {
          deckSpec = null;
        }
      }

      if (deckSpec && typeof renderPresentationDeckHTML === "function") {
        const deckHtml = renderPresentationDeckHTML(deckSpec);
        return storeBlock(deckHtml);
      }
    }

    // 2A. Mermaid Diagram Blocks
    if (cleanLang === "mermaid") {
      const escapedCode = escapeHtml(code);
      const encodedCode = encodeURIComponent(code);

      const blockHtml = `
        <div class="mermaid-block-container relative rounded-xl overflow-hidden my-4 border border-white/10 bg-[#121417] shadow-lg">
          <div class="flex items-center justify-end px-3 py-1.5 bg-[#1c2128] border-b border-white/10">
            <button type="button" onclick="downloadMermaidAsSvg(this)" class="hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Download Diagram">
              <span class="material-symbols-outlined text-[15px] text-[#0078D4]">download</span>
              <span>Download</span>
            </button>
          </div>
          <div class="mermaid-diagram-box p-4 flex items-center justify-center bg-[#101214] overflow-x-auto min-h-[150px]" data-mermaid-code="${encodedCode}">
            <div class="text-xs text-neutral-400 flex items-center gap-2">
              <span class="inline-block w-3.5 h-3.5 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin"></span>
              <span>Rendering diagram...</span>
            </div>
          </div>
        </div>
      `.trim();

      return storeBlock(blockHtml);
    }

    // 2B. Microsoft Office Visual Chart Blocks
    if (cleanLang === "chart" || cleanLang === "chartjs" || cleanLang === "office-chart" || cleanLang.startsWith("chart-") || cleanLang.startsWith("chart:")) {
      let spec = null;
      try {
        spec = JSON.parse(code.trim());
      } catch (e) {
        try {
          const fixed = code.trim().replace(/,\s*([\]}])/g, "$1");
          spec = JSON.parse(fixed);
        } catch (e2) {
          spec = null;
        }
      }

      if (spec) {
        const rawType = (spec.type || cleanLang.replace(/^(?:chart[-:]?|office-chart[-:]?)/, "") || "column").toLowerCase().trim();
        spec.type = rawType;
        const meta = CHART_TYPE_META[rawType] || { icon: "bar_chart", label: "Office Chart" };
        const title = spec.title || "Visual Data Chart";
        const encodedSpec = encodeURIComponent(JSON.stringify(spec));
        const labels = spec.labels || spec.data?.labels || [];
        const datasets = spec.datasets || spec.data?.datasets || [];
        const dataTableHtml = buildChartDataTable(labels, datasets);

        const blockHtml = `
          <div class="rhynia-chart-card my-4" data-chart-spec="${encodedSpec}" data-chart-title="${escapeHtml(title)}">
            <div class="rhynia-chart-header flex items-center justify-between">
              <span class="font-semibold text-xs sm:text-sm text-white truncate mr-2">${escapeHtml(title)}</span>
              <button type="button" onclick="downloadChartAsPng(this)" class="hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium shrink-0" title="Download Chart">
                <span class="material-symbols-outlined text-[15px] text-[#0078D4]">download</span>
                <span>Download</span>
              </button>
            </div>
            <div class="chart-canvas-container">
              <canvas></canvas>
            </div>
          </div>
        `.trim();

        return storeBlock(blockHtml);
      }
    }

    // 2C. Standard Code / SVG Blocks
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

  // 2B. Educational Image Cards & Multi-Image Galleries (1 to 6+ images)
  text = text.replace(/((?:(?:[-*•]\s*)?!\[([^\]]*)\]\((https?:\/\/[^\s\)\"\'<>]+)\)[\s\r\n]*)+)/gi, (match) => {
    const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)\"\'<>]+)\)/gi;
    const items = [];
    let m;
    while ((m = imgRegex.exec(match)) !== null) {
      items.push({ caption: m[1].trim(), url: m[2].trim() });
    }
    if (!items.length) return match;

    const isGrid = items.length > 1;
    const gridCols = items.length >= 3 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" : (items.length === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-3.5" : "max-w-2xl mx-auto");
    const serializedItems = encodeURIComponent(JSON.stringify(items));
    let galleryHtml = `<div class="rhynia-image-gallery my-4 ${gridCols}" data-gallery-items="${serializedItems}">`;

    items.forEach((item, itemIdx) => {
      const escapedCaption = escapeHtml(item.caption || "Image");
      const cleanUrl = cleanWikimediaUrl(item.url);
      const safeUrl = getProxiedImageUrl(cleanUrl);
      galleryHtml += `
        <div class="rhynia-image-card rounded-2xl overflow-hidden border border-white/10 bg-[#161616] shadow-xl transition-all duration-300 hover:border-[#0078D4]/60 hover:shadow-2xl flex flex-col justify-between">
          <div class="rhynia-img-wrapper relative bg-[#0a0a0a] overflow-hidden flex items-center justify-center min-h-[190px] max-h-[320px] cursor-pointer group" onclick="openRhyniaLightboxGalleryItem(this, ${itemIdx})" title="Click to view">
            <img src="${safeUrl}" alt="${escapedCaption}" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300" onerror="this.onerror=null; this.src='/api/v1/proxy-image?url=' + encodeURIComponent('${encodeURIComponent(cleanUrl)}');"/>
          </div>
          <div class="px-3.5 py-2.5 flex items-center justify-between bg-[#1c1c1c] border-t border-white/5 text-xs text-neutral-300">
            <span class="font-medium text-white truncate mr-2" title="${escapedCaption}">${escapedCaption}</span>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" onclick="openRhyniaLightboxGalleryItem(this, ${itemIdx})" class="hover:text-white flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#4cc2ff] transition-colors" title="View">
                <span class="material-symbols-outlined text-[14px]">fullscreen</span>
                <span>View</span>
              </button>
              <a href="${cleanUrl}" target="_blank" download class="hover:text-white flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#10b981] transition-colors" title="Download">
                <span class="material-symbols-outlined text-[14px]">download</span>
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      `.trim();
    });

    galleryHtml += `</div>`;
    return storeBlock(galleryHtml);
  });

  // 2C. Recommended Follow-up Questions Interactive Pill Box
  text = text.replace(/(?:^|\n)(?:(?:❖|■)?\s*\*\*(?:आगे जानने योग्य महत्वपूर्ण प्रश्न|संबंधित महत्वपूर्ण प्रश्न|अनुशंसित प्रश्न|Recommended (?:Follow-up )?Questions)[:\*]*\*\*)\s*\n((?:(?:\s*[-*•●]\s*|\s*\d+\.\s*).+\n?)+)/gi, (match, questionsBlock) => {
    const qLines = questionsBlock.split("\n").filter(l => l.trim().length > 0);
    const pills = [];
    qLines.forEach(l => {
      const cleanQ = l.replace(/^[\s*\-•●\d\.]+/g, "").replace(/^[*_]+|[*_]+$/g, "").trim();
      if (cleanQ.length > 3) {
        const escapedQ = escapeHtml(cleanQ);
        const encodedParam = encodeURIComponent(cleanQ);
        pills.push(`
          <button type="button" onclick="window.sendSuggestedPrompt(decodeURIComponent('${encodedParam}'))" class="rhynia-followup-pill text-left text-xs px-3.5 py-2.5 rounded-xl bg-[#1c1f24] hover:bg-[#0078D4]/20 border border-white/10 hover:border-[#0078D4]/50 text-neutral-200 hover:text-white transition-all duration-200 flex items-center justify-between gap-3 group active:scale-[0.99] cursor-pointer shadow-sm">
            <span class="font-medium text-neutral-200 group-hover:text-white">${escapedQ}</span>
            <span class="material-symbols-outlined text-[15px] text-neutral-500 group-hover:text-[#4cc2ff] transition-colors shrink-0">arrow_forward</span>
          </button>
        `.trim());
      }
    });

    if (pills.length === 0) return match;

    const boxHtml = `
      <div class="rhynia-recommended-questions-box my-4 p-4 rounded-2xl border border-white/10 bg-[#121417] shadow-xl">
        <div class="flex items-center gap-2 mb-3 text-xs font-semibold text-white">
          <span class="material-symbols-outlined text-[16px] text-[#4cc2ff]">help_outline</span>
          <span>आगे जानने योग्य महत्वपूर्ण प्रश्न (Recommended Questions)</span>
        </div>
        <div class="flex flex-col gap-2">
          ${pills.join("\n")}
        </div>
      </div>
    `.trim();

    return storeBlock(boxHtml);
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
          return s.includes("|") && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(s);
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

  // Strip leading bullet symbols if immediately followed by an emoji icon (e.g., '▪ 📚' -> '📚')
  text = text.replace(/(?:^|\n)[■▪❖➤➢➔●•○◦\*\-]\s*([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}])/gu, '\n$1');

  // Helper to check if text starts with an emoji or visual symbol
  const hasLeadingEmoji = (str) => /^\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u.test(str);

  // 6. Convert any Markdown Headings to Word-Style Headings (stripping raw ###)
  const formatHeading = (level, bulletCls, bulletChar, content) => {
    const trimmed = content.trim();
    const bulletSpan = hasLeadingEmoji(trimmed) ? '' : `<span class="ms-bullet ${bulletCls}">${bulletChar}</span>`;
    return `\n<h${level} class="ms-heading ms-heading-${level}">${bulletSpan}<span>${trimmed}</span></h${level}>`;
  };

  text = text.replace(/(?:^|\n)#{4,}\s*(.+)/g, (_, c) => formatHeading(4, 'ms-bullet-arrow', '➤', c));
  text = text.replace(/(?:^|\n)#{3}\s*(.+)/g, (_, c) => formatHeading(3, 'ms-bullet-square', '■', c));
  text = text.replace(/(?:^|\n)#{2}\s*(.+)/g, (_, c) => formatHeading(2, 'ms-bullet-diamond', '❖', c));
  text = text.replace(/(?:^|\n)#{1}\s*(.+)/g, (_, c) => formatHeading(1, 'ms-bullet-diamond', '❖', c));

  // Helper for bullet items: omit bullet symbol if line starts with emoji/icon
  const formatBulletItem = (bulletCls, bulletChar, content) => {
    const trimmed = content.trim();
    if (hasLeadingEmoji(trimmed)) {
      return `\n<div class="ms-bullet-item ms-emoji-item"><div class="flex-1">${trimmed}</div></div>`;
    }
    return `\n<div class="ms-bullet-item"><span class="ms-bullet ${bulletCls}">${bulletChar}</span><div class="flex-1">${trimmed}</div></div>`;
  };

  // 7. Microsoft Word Bullet Library List Items
  text = text.replace(/(?:^|\n)(❖)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-diamond', '❖', c));
  text = text.replace(/(?:^|\n)(➤|➢|➔)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-arrow', b, c));
  text = text.replace(/(?:^|\n)(✔|☑)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-check', b, c));
  text = text.replace(/(?:^|\n)(■|▪)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-square', b, c));
  text = text.replace(/(?:^|\n)(●|•)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-circle', '•', c));
  text = text.replace(/(?:^|\n)(○|◦)\s*(.+)/g, (_, b, c) => formatBulletItem('ms-bullet-open-circle', '○', c));

  // 8. Standard Lists (*, -, and numbered 1. in matching neutral text color)
  text = text.replace(/(?:^|\n)[*-]\s+(.+)/g, (_, c) => formatBulletItem('ms-bullet-circle', '•', c));
  text = text.replace(/(?:^|\n)(\d+)\.\s+(.+)/g, '\n<div class="ms-bullet-item"><span class="ms-num-bullet font-semibold text-neutral-200 min-w-[1.25rem]">$1.</span><div class="flex-1">$2</div></div>');

  // 9. Paragraphs & Line Breaks
  text = text.replace(/\n\n+/g, `<div class="h-2.5"></div>`);
  text = text.replace(/\n/g, `<br/>`);

  // 10. Restore Code & Table Blocks
  blocks.forEach((blockHtml, idx) => {
    const placeholder = `__RHYNIA_BLOCK_${idx}__`;
    text = text.split(placeholder).join(blockHtml);
  });

  // 11. Clean up stray <br/> adjacent to block elements and headings
  text = text.replace(/(?:<br\/>|\s)*(<div class="(?:markdown-table-wrapper|code-block-container|mermaid-block-container|rhynia-chart-card|ms-bullet-item))/g, '$1');
  text = text.replace(/(<\/div>|<\/h[1-4]>)(?:<br\/>|\s)*/g, '$1');

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
window.renderAllRhyniaCharts = renderAllRhyniaCharts;
window.toggleChartView = toggleChartView;
window.downloadChartAsPng = downloadChartAsPng;
window.copyChartSpec = copyChartSpec;

/**
 * Handle Click on Recommended Follow-up Question Chip
 * Automatically puts prompt into chat-input and submits message
 */
window.sendSuggestedPrompt = function(promptText) {
  if (!promptText) return;
  const inputEl = document.getElementById("chat-input");
  if (!inputEl) return;
  inputEl.value = promptText.trim();
  if (typeof updateSendButtonState === "function") {
    updateSendButtonState();
  }
  if (typeof window.sendChatMessage === "function") {
    window.sendChatMessage();
  }
};


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

    if (res.status === 401) {
      // Only genuinely expired or invalid token triggers logout
      console.warn("Token expired or unauthorized (401). Redirecting to login.");
      logoutUser();
      return;
    }

    if (!res.ok) {
      // Server is waking up (502/503/504) or experiencing temporary startup latency
      console.warn(`Rhynia API responded with status ${res.status}. Preserving authenticated session.`);
      if (AppState.user) {
        switchView("view-app");
        renderUserProfileUI(AppState.user);
        updateEmptyStateUserName(AppState.user);
        updateDrawerProfileAvatar();
        showToast("Rhynia cloud waking up... your workspace is ready.", "info");
        
        // Background sync once server warms up
        const retryProfileSync = async (retriesLeft = 6) => {
          if (retriesLeft <= 0) return;
          try {
            await new Promise(r => setTimeout(r, 5000));
            const retryRes = await fetch(`${CONFIG.API_BASE}/profile`, {
              headers: { "Authorization": `Bearer ${AppState.token}` }
            });
            if (retryRes.ok) {
              const freshProfile = await retryRes.json();
              AppState.user = freshProfile;
              localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(freshProfile));
              renderUserProfileUI(freshProfile);
              loadSessions();
            } else if (retryRes.status !== 401) {
              retryProfileSync(retriesLeft - 1);
            }
          } catch (_) {
            retryProfileSync(retriesLeft - 1);
          }
        };
        retryProfileSync();
        return;
      }
      // If no cached user profile, fallback to cached view
      switchView("view-app");
      return;
    }

    const profile = await res.json();
    if (profile.email && profile.email.toLowerCase() === "mk191515480@gmail.com") {
      profile.plan_tier = "ultra_pro";
      if (profile.storage) {
        profile.storage.plan_tier = "ultra_pro";
        profile.storage.storage_quota_mb = 25600;
        profile.storage.storage_quota_bytes = 25600 * 1024 * 1024;
        profile.storage.storage_free_mb = Math.max(0, 25600 - (profile.storage.storage_used_mb || 0));
      }
    }
    AppState.user = profile;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(profile));

    // Switch to Authenticated Workspace
    switchView("view-app");

    // Populate user profile info across all UI elements
    renderUserProfileUI(profile);
    updateEmptyStateUserName(profile);
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
    // If backend unreachable due to network or cold boot, preserve session
    if (AppState.user) {
      switchView("view-app");
      renderUserProfileUI(AppState.user);
      updateEmptyStateUserName(AppState.user);
      updateDrawerProfileAvatar();
      showToast("Connecting to cloud... your workspace is ready.", "info");
    } else if (!AppState.token) {
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

// =========================================================
// RHYNIA EDUCATIONAL IMAGE LIGHTBOX MODAL WITH CAROUSEL
// =========================================================
window.activeGalleryImages = [];
window.activeGalleryIndex = 0;

function openRhyniaLightbox(url, caption, galleryList = null, index = 0) {
  const modal = document.getElementById("rhynia-lightbox");
  if (!modal) return;

  if (Array.isArray(galleryList) && galleryList.length > 0) {
    window.activeGalleryImages = galleryList;
    window.activeGalleryIndex = Math.max(0, Math.min(index, galleryList.length - 1));
  } else {
    window.activeGalleryImages = [{ url, caption }];
    window.activeGalleryIndex = 0;
  }

  updateLightboxSlide();
  modal.classList.remove("hidden");
}

function openRhyniaLightboxGalleryItem(el, itemIdx) {
  const gallery = el.closest(".rhynia-image-gallery");
  if (!gallery || !gallery.dataset.galleryItems) {
    return;
  }
  try {
    const items = JSON.parse(decodeURIComponent(gallery.dataset.galleryItems));
    openRhyniaLightbox(items[itemIdx].url, items[itemIdx].caption, items, itemIdx);
  } catch (e) {
    console.warn("Gallery lightbox parse error:", e);
  }
}

function updateLightboxSlide() {
  const img = document.getElementById("lightbox-img");
  const cap = document.getElementById("lightbox-caption");
  const dl = document.getElementById("lightbox-download-btn");
  const counter = document.getElementById("lightbox-counter");
  const prevBtn = document.getElementById("lightbox-prev-btn");
  const nextBtn = document.getElementById("lightbox-next-btn");
  if (!window.activeGalleryImages || !window.activeGalleryImages.length) return;

  const cur = window.activeGalleryImages[window.activeGalleryIndex];
  const cleanUrl = cleanWikimediaUrl(cur.url);
  const proxiedUrl = getProxiedImageUrl(cleanUrl);
  if (img) {
    img.src = proxiedUrl;
    img.setAttribute("referrerpolicy", "no-referrer");
    img.alt = cur.caption || "Educational Diagram";
  }
  if (cap) cap.textContent = cur.caption || "";
  if (dl) dl.href = cleanUrl;

  const total = window.activeGalleryImages.length;
  if (counter) {
    counter.textContent = `${window.activeGalleryIndex + 1} / ${total}`;
    if (total > 1) {
      counter.classList.remove("hidden");
    } else {
      counter.classList.add("hidden");
    }
  }
  if (prevBtn) {
    if (total > 1) {
      prevBtn.classList.remove("hidden");
      prevBtn.classList.add("flex");
    } else {
      prevBtn.classList.add("hidden");
      prevBtn.classList.remove("flex");
    }
  }
  if (nextBtn) {
    if (total > 1) {
      nextBtn.classList.remove("hidden");
      nextBtn.classList.add("flex");
    } else {
      nextBtn.classList.add("hidden");
      nextBtn.classList.remove("flex");
    }
  }
}

function prevRhyniaLightbox(e) {
  if (e) e.stopPropagation();
  if (!window.activeGalleryImages || window.activeGalleryImages.length <= 1) return;
  window.activeGalleryIndex = (window.activeGalleryIndex - 1 + window.activeGalleryImages.length) % window.activeGalleryImages.length;
  updateLightboxSlide();
}

function nextRhyniaLightbox(e) {
  if (e) e.stopPropagation();
  if (!window.activeGalleryImages || window.activeGalleryImages.length <= 1) return;
  window.activeGalleryIndex = (window.activeGalleryIndex + 1) % window.activeGalleryImages.length;
  updateLightboxSlide();
}

function closeRhyniaLightbox(e) {
  const modal = document.getElementById("rhynia-lightbox");
  if (modal) modal.classList.add("hidden");
}

window.openRhyniaLightbox = openRhyniaLightbox;
window.openRhyniaLightboxGalleryItem = openRhyniaLightboxGalleryItem;
window.prevRhyniaLightbox = prevRhyniaLightbox;
window.nextRhyniaLightbox = nextRhyniaLightbox;
window.closeRhyniaLightbox = closeRhyniaLightbox;

document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("rhynia-lightbox");
  if (!modal || modal.classList.contains("hidden")) return;
  if (e.key === "Escape") {
    closeRhyniaLightbox();
  } else if (e.key === "ArrowLeft") {
    prevRhyniaLightbox();
  } else if (e.key === "ArrowRight") {
    nextRhyniaLightbox();
  }
});
