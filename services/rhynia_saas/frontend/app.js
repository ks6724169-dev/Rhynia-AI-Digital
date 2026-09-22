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

function toggleSvgPreview(buttonEl) {
  const container = buttonEl.closest(".code-block-container");
  if (!container) return;
  const previewBox = container.querySelector(".svg-preview-box");
  const codeBox = container.querySelector(".code-raw-box");
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  const text = buttonEl.querySelector(".btn-label");

  if (!previewBox || !codeBox) return;

  const isPreviewHidden = previewBox.classList.contains("hidden");
  if (isPreviewHidden) {
    const rawSvg = container.querySelector("code").innerText;
    previewBox.innerHTML = rawSvg;
    previewBox.classList.remove("hidden");
    codeBox.classList.add("hidden");
    if (icon) icon.textContent = "code";
    if (text) text.textContent = "Code";
  } else {
    previewBox.classList.add("hidden");
    codeBox.classList.remove("hidden");
    if (icon) icon.textContent = "visibility";
    if (text) text.textContent = "Preview";
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

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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

function renderMarkdown(rawText) {
  if (!rawText) return "";

  let html = escapeHtml(rawText);

  // 1. Triple-backtick code blocks: ```lang\ncode\n```
  html = html.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanLang = (lang || "").toLowerCase().trim();
    const config = EXTENSION_MAP[cleanLang] || { ext: cleanLang || "txt", label: cleanLang ? cleanLang.toUpperCase() : "CODE" };
    const isSvg = cleanLang === "svg" || code.includes("&lt;svg");

    return `
      <div class="code-block-container relative rounded-xl overflow-hidden my-3 border border-white/10 bg-[#161616] shadow-lg">
        <div class="flex items-center justify-between px-3.5 py-2 bg-[#202020] border-b border-white/5 text-xs text-neutral-400">
          <span class="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
            <span class="w-2 h-2 rounded-full bg-[#0078D4]"></span>
            <span>${config.label}</span>
          </span>
          <div class="flex items-center gap-2">
            ${isSvg ? `
            <button type="button" onclick="toggleSvgPreview(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium" title="Toggle Vector Live Preview">
              <span class="material-symbols-outlined text-[14px] text-[#4cc2ff]">visibility</span>
              <span class="btn-label">Preview</span>
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
        ${isSvg ? `<div class="svg-preview-box hidden p-4 flex items-center justify-center bg-[#111111] overflow-x-auto min-h-[160px]"></div>` : ""}
        <div class="code-raw-box">
          <pre class="p-3.5 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto leading-relaxed"><code>${code}</code></pre>
        </div>
      </div>
    `;
  });

  // 2. GFM Markdown Tables: | Col1 | Col2 |
  html = html.replace(/((?:\|(?:[^\n|]+)\|(?:\r?\n|$))+)/g, (match) => {
    const lines = match.trim().split(/\r?\n/).filter(l => l.trim().startsWith("|") && l.trim().endsWith("|"));
    if (lines.length < 2) return match;

    const separatorIdx = lines.findIndex(l => /^\|(?:\s*:?-+:?\s*\|)+$/.test(l.replace(/\s+/g, "")));
    if (separatorIdx <= 0) return match;

    const headers = lines[0].split("|").slice(1, -1).map(h => h.trim());
    const bodyLines = lines.slice(separatorIdx + 1);

    return `
      <div class="markdown-table-wrapper my-4 rounded-xl border border-white/10 bg-[#161616] overflow-hidden shadow-lg">
        <div class="flex items-center justify-between px-3.5 py-1.5 bg-[#202020] border-b border-white/5 text-xs text-neutral-400">
          <span class="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
            <span class="material-symbols-outlined text-[15px] text-[#0078D4]">table_chart</span>
            <span>Data Table</span>
          </span>
          <button type="button" onclick="downloadTableAsCSV(this)" class="hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300" title="Download as CSV Spreadsheet for Excel">
            <span class="material-symbols-outlined text-[14px] text-[#107c41]">file_download</span>
            <span>Export .csv</span>
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr class="bg-[#242424] text-white border-b border-white/10">
                ${headers.map(h => `<th class="px-3.5 py-2.5 font-semibold text-neutral-200 tracking-tight">${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${bodyLines.map(rowLine => {
                const cells = rowLine.split("|").slice(1, -1).map(c => c.trim());
                return `<tr class="hover:bg-white/[0.03] transition-colors">
                  ${cells.map(c => `<td class="px-3.5 py-2 text-neutral-300">${c}</td>`).join("")}
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  // 3. Inline code: `code`
  html = html.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[13px] text-white">$1</code>`);

  // 4. Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong class="text-white font-semibold">$1</strong>`);

  // 5. Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, `<em class="italic">$1</em>`);

  // 6. Unordered List Items: * item or - item
  html = html.replace(/(?:^|\n)[*-]\s+(.+)/g, `\n<li class="ml-4 list-disc text-neutral-300 leading-relaxed">$1</li>`);

  // 7. Ordered List Items: 1. item
  html = html.replace(/(?:^|\n)\d+\.\s+(.+)/g, `\n<li class="ml-4 list-decimal text-neutral-300 leading-relaxed">$1</li>`);

  // 8. Paragraph line breaks
  html = html.replace(/\n\n+/g, `<div class="h-2"></div>`);
  html = html.replace(/\n/g, `<br/>`);

  return html;
}

// Expose downloader functions to window
window.downloadCodeBlock = downloadCodeBlock;
window.copyCodeBlock = copyCodeBlock;
window.toggleSvgPreview = toggleSvgPreview;
window.downloadTableAsCSV = downloadTableAsCSV;


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

