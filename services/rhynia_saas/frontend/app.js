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

function renderMarkdown(rawText) {
  if (!rawText) return "";

  let html = escapeHtml(rawText);

  // 1. Triple-backtick code blocks: ```lang\ncode\n```
  html = html.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `
      <div class="relative rounded-lg overflow-hidden my-3 border border-white/10 bg-[#161616]">
        <div class="flex items-center justify-between px-3.5 py-1.5 bg-[#202020] border-b border-white/5 text-xs text-neutral-400">
          <span class="font-mono text-[11px] uppercase tracking-wider">${lang || "CODE"}</span>
          <button onclick="navigator.clipboard.writeText(this.closest('div.relative').querySelector('code').innerText); showToast('Code copied!', 'success');" class="hover:text-white flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy</span>
          </button>
        </div>
        <pre class="p-3.5 text-xs font-mono text-neutral-200 overflow-x-auto"><code>${code}</code></pre>
      </div>
    `;
  });

  // 2. Inline code: `code`
  html = html.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[13px] text-white">$1</code>`);

  // 3. Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong class="text-white font-semibold">$1</strong>`);

  // 4. Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, `<em class="italic">$1</em>`);

  // 5. Unordered List Items: * item or - item
  html = html.replace(/(?:^|\n)[*-]\s+(.+)/g, `\n<li class="ml-4 list-disc text-neutral-300 leading-relaxed">$1</li>`);

  // 6. Ordered List Items: 1. item
  html = html.replace(/(?:^|\n)\d+\.\s+(.+)/g, `\n<li class="ml-4 list-decimal text-neutral-300 leading-relaxed">$1</li>`);

  // 7. Paragraph line breaks
  html = html.replace(/\n\n+/g, `<div class="h-2"></div>`);
  html = html.replace(/\n/g, `<br/>`);

  return html;
}

// ==========================================
// APPLICATION INITIALIZATION & ROUTE GUARD
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Theme preference from storage
  const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || "dark";
  applyTheme(savedTheme);

  // 2. Strict Login-First Route Gate
  if (!AppState.token) {
    switchView("view-login");
    return;
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

  // 5. Attach Chat Input "Enter" Key Listener
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
});
