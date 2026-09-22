/**
 * Rhynia Intelligence SaaS — Client Application Engine
 * Architecture: Mobile-First Single Page Application (SPA)
 * Security: Login-First Gate, JWT Auth, Zero-Leakage Brand Compliance
 */

const AppState = {
  token: null,
  user: null,
  activeSessionId: null,
  sessions: [],
  isStreaming: false,
  searchGrounding: false,
  pendingFiles: [],
  storageData: null,
  currentView: "view-login"
};

// ============================================================================
// 1. INITIALIZATION & LOGIN-FIRST ROUTE GUARD
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await initApp();
});

async function initApp() {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) {
    // Strict Login-First Gate: Unauthenticated users are redirected to Screen 07
    switchView("view-login");
    return;
  }

  AppState.token = token;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      // Invalid or expired token
      logout();
      return;
    }

    const userData = await res.json();
    AppState.user = userData;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));

    // Update UI profile elements
    updateUserProfileUI(userData);

    // Apply saved theme
    applyTheme(userData.theme || "dark", userData.accent_color);

    // Switch to Authenticated App View
    switchView("view-app");

    // Load initial data
    await Promise.all([
      loadSessions(),
      loadStorage()
    ]);

  } catch (err) {
    console.error("Auth verification failed:", err);
    switchView("view-login");
  }
}

function switchView(viewId) {
  AppState.currentView = viewId;
  const views = document.querySelectorAll(".view-panel");
  views.forEach(v => {
    if (v.id === viewId) {
      v.classList.remove("hidden");
      v.classList.add("flex", "active");
    } else {
      v.classList.add("hidden");
      v.classList.remove("flex", "active");
    }
  });

  // Ensure modals are closed when switching top-level views
  closeAllModals();
}

function logout() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  localStorage.removeItem(CONFIG.SESSION_KEY);
  AppState.token = null;
  AppState.user = null;
  AppState.activeSessionId = null;
  AppState.sessions = [];
  AppState.pendingFiles = [];
  switchView("view-login");
  showToast("Logged out successfully");
}

// ============================================================================
// 2. AUTHENTICATION SERVICES
// ============================================================================

async function handleEmailLogin(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!email || !password) {
    showToast("Please enter both email and password", "error");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Signing in...`;

    const res = await fetch(`${CONFIG.API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Authentication failed");
    }

    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);
    showToast("Sign in successful!", "success");
    await initApp();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Sign In</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
  }
}

async function handleEmailRegister(event) {
  event.preventDefault();
  const form = event.target;
  const fullName = form.full_name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const phoneNumber = form.phone_number ? form.phone_number.value.trim() : null;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!email || !password || !fullName) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Creating account...`;

    const res = await fetch(`${CONFIG.API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber || null
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    showToast("Account created successfully! Please sign in.", "success");
    switchView("view-login");
    // Pre-fill email in login form
    const loginEmailInput = document.querySelector('#form-login #email');
    if (loginEmailInput) loginEmailInput.value = email;

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Create Account</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
  }
}

async function handleSendPhoneOtp(event) {
  if (event) event.preventDefault();
  const phoneInput = document.getElementById("phone-otp-input");
  const phoneNumber = phoneInput ? phoneInput.value.trim() : "";

  if (!phoneNumber) {
    showToast("Please enter a valid phone number", "error");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to send OTP");

    showToast(`OTP sent to ${phoneNumber}! (Development Code: ${data.debug_otp || 'Sent via SMS'})`, "success");
    document.getElementById("otp-entry-section").classList.remove("hidden");
    document.getElementById("phone-input-section").classList.add("hidden");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleVerifyPhoneOtp(event) {
  if (event) event.preventDefault();
  const phoneInput = document.getElementById("phone-otp-input");
  const phoneNumber = phoneInput ? phoneInput.value.trim() : "";

  // Aggregate 4-digit or 6-digit inputs
  const otpInputs = document.querySelectorAll(".otp-digit-input");
  let otpCode = "";
  otpInputs.forEach(i => otpCode += i.value);

  if (!otpCode || otpCode.length < 4) {
    showToast("Please enter the complete verification code", "error");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/phone/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Invalid or expired OTP");

    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);
    showToast("Phone verified successfully!", "success");
    await initApp();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) {
    showToast("Please enter your email", "error");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");

    showToast(data.message || "Reset link generated!", "success");
    if (data.reset_token) {
      document.getElementById("reset-password-section").classList.remove("hidden");
      document.getElementById("forgot-token-input").value = data.reset_token;
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  const token = document.getElementById("forgot-token-input").value.trim();
  const newPassword = document.getElementById("new-password-input").value;

  if (!token || !newPassword) {
    showToast("Please provide both reset code and new password", "error");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Password reset failed");

    showToast("Password reset successfully! Please log in.", "success");
    switchView("view-login");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================================
// 3. CHAT & SERVER-SENT EVENTS (SSE) STREAMING
// ============================================================================

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message || AppState.isStreaming) return;

  // Clear input field and auto-resize
  input.value = "";
  input.style.height = "auto";

  // Switch to active chat state
  showActiveChatScreen();

  // Render User Message
  renderUserMessage(message, AppState.pendingFiles);

  // Clear pending file attachments
  const filesToSend = [...AppState.pendingFiles];
  AppState.pendingFiles = [];
  renderAttachmentChips();

  // Create Rhynia streaming response bubble
  const responseBubble = createRhyniaMessageBubble();
  const contentEl = responseBubble.querySelector(".markdown-content");
  const cursorEl = responseBubble.querySelector(".stream-cursor");

  AppState.isStreaming = true;
  updateSendButtonState();

  let accumulatedText = "";

  try {
    const response = await fetch(`${CONFIG.API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        session_id: AppState.activeSessionId,
        search_grounding: AppState.searchGrounding
      })
    });

    if (response.status === 429) {
      // Plan quota reached (Free tier 20 msg/day)
      cursorEl.remove();
      contentEl.innerHTML = `
        <div class="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200 text-sm">
          <div class="flex items-center gap-2 font-semibold mb-1">
            <span class="material-symbols-outlined text-[18px]">lock_clock</span>
            Daily Quota Reached
          </div>
          You have reached your Free Plan limit of 20 messages today. Upgrade to Pro for 300 messages/day.
          <div class="mt-2.5">
            <button onclick="openUpgradeModal()" class="px-3 py-1.5 bg-[#0078d4] text-white rounded text-xs font-semibold hover:bg-[#1084d8] transition-colors">
              Upgrade to Pro (₹99/mo)
            </button>
          </div>
        </div>
      `;
      AppState.isStreaming = false;
      updateSendButtonState();
      return;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server responded with ${response.status}`);
    }

    // Read SSE Stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const token = line.slice(6);
          accumulatedText += token;
          contentEl.innerHTML = renderMarkdown(accumulatedText);
          scrollToBottom();
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith("data: ")) {
      accumulatedText += buffer.slice(6);
      contentEl.innerHTML = renderMarkdown(accumulatedText);
    }

    // Remove cursor once stream is finished
    cursorEl.remove();

    // Attach copy and actions footer
    attachMessageActions(responseBubble, accumulatedText);

    // Refresh sessions list to display updated thread title
    await loadSessions();

  } catch (err) {
    cursorEl.remove();
    contentEl.innerHTML = `
      <div class="text-[#ffb4ab] text-sm flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">error</span>
        ${err.message || "Failed to get response from Rhynia."}
      </div>
    `;
  } finally {
    AppState.isStreaming = false;
    updateSendButtonState();
    scrollToBottom();
  }
}

function renderUserMessage(text, files) {
  const container = document.getElementById("chat-messages-container");
  const msgEl = document.createElement("div");
  msgEl.className = "flex justify-end mb-4 animate-fade-in";

  let filesHtml = "";
  if (files && files.length > 0) {
    filesHtml = `
      <div class="flex flex-wrap gap-2 mb-2">
        ${files.map(f => `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/25 text-xs text-white/90 border border-white/10">
            <span class="material-symbols-outlined text-[14px]">attachment</span>
            <span class="truncate max-w-[150px]">${escapeHtml(f.original_name)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  msgEl.innerHTML = `
    <div class="chat-bubble-user max-w-[85%] sm:max-w-[70%] px-4 py-3 text-white text-sm">
      ${filesHtml}
      <div class="whitespace-pre-wrap leading-relaxed">${escapeHtml(text)}</div>
    </div>
  `;
  container.appendChild(msgEl);
  scrollToBottom();
}

function createRhyniaMessageBubble() {
  const container = document.getElementById("chat-messages-container");
  const bubbleWrapper = document.createElement("div");
  bubbleWrapper.className = "flex gap-3 mb-5 animate-fade-in";

  bubbleWrapper.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-[#0078d4] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
      R
    </div>
    <div class="chat-bubble-rhynia flex-1 max-w-[90%] sm:max-w-[85%] p-4 text-sm relative">
      <div class="markdown-content"></div>
      <span class="stream-cursor"></span>
      <div class="message-actions mt-3 pt-2 border-t border-white/5 flex items-center gap-3 text-xs text-[#8a919e]">
      </div>
    </div>
  `;

  container.appendChild(bubbleWrapper);
  scrollToBottom();
  return bubbleWrapper;
}

function attachMessageActions(bubbleEl, text) {
  const actionsEl = bubbleEl.querySelector(".message-actions");
  if (!actionsEl) return;

  actionsEl.innerHTML = `
    <button class="hover:text-white flex items-center gap-1 transition-colors" onclick="copyMessageText(this, ${JSON.stringify(text)})">
      <span class="material-symbols-outlined text-[15px]">content_copy</span>
      <span>Copy</span>
    </button>
    <button class="hover:text-white flex items-center gap-1 transition-colors" onclick="exportActiveSession('text')">
      <span class="material-symbols-outlined text-[15px]">download</span>
      <span>Export</span>
    </button>
  `;
}

function copyMessageText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = `<span class="material-symbols-outlined text-[15px] text-green-400">check</span><span class="text-green-400">Copied!</span>`;
    setTimeout(() => {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">content_copy</span><span>Copy</span>`;
    }, 2000);
  });
}

// ============================================================================
// 4. MARKDOWN & CODE RENDERING ENGINE
// ============================================================================

function renderMarkdown(raw) {
  if (!raw) return "";

  let html = raw;

  // 1. Code blocks with language header and copy button
  html = html.replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const langLabel = lang || "code";
    const escapedCode = escapeHtml(code.trim());
    return `
      <div class="code-block my-2">
        <div class="code-header">
          <span>${langLabel}</span>
          <button class="code-copy-btn" onclick="copyCode(this)">
            <span class="material-symbols-outlined text-[14px]">content_copy</span>
            Copy
          </button>
        </div>
        <pre><code class="language-${langLabel}">${escapedCode}</code></pre>
      </div>
    `;
  });

  // 2. Inline code
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // 3. Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-white mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-4 mb-1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-white mt-4 mb-2">$1</h1>');

  // 4. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 5. Unordered Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

  // 6. Linebreaks (excluding inside pre)
  const parts = html.split(/(<div class="code-block"[\s\S]*?<\/div>)/);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('<div class="code-block"')) {
      parts[i] = parts[i].replace(/\n/g, '<br/>');
    }
  }

  return parts.join("");
}

function copyCode(button) {
  const pre = button.closest(".code-block").querySelector("pre code");
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    button.innerHTML = `<span class="material-symbols-outlined text-[14px] text-green-400">check</span> Copied!`;
    setTimeout(() => {
      button.innerHTML = `<span class="material-symbols-outlined text-[14px]">content_copy</span> Copy`;
    }, 2000);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scrollToBottom() {
  const container = document.getElementById("chat-scroll-area");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// ============================================================================
// 5. SESSION MANAGEMENT & SIDEBAR DRAWER
// ============================================================================

async function loadSessions() {
  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    AppState.sessions = data.sessions || [];
    renderSessionsList();
  } catch (err) {
    console.error("Failed to load sessions:", err);
  }
}

function renderSessionsList() {
  const pinnedList = document.getElementById("pinned-sessions-list");
  const recentList = document.getElementById("recent-sessions-list");

  if (!pinnedList || !recentList) return;

  pinnedList.innerHTML = "";
  recentList.innerHTML = "";

  const pinned = AppState.sessions.filter(s => s.is_pinned);
  const recent = AppState.sessions.filter(s => !s.is_pinned);

  // Render Pinned Sessions
  if (pinned.length === 0) {
    pinnedList.innerHTML = `<div class="text-xs text-neutral-500 py-1 px-3">No pinned chats</div>`;
  } else {
    pinned.forEach(s => pinnedList.appendChild(createSessionItem(s)));
  }

  // Render Recent Sessions
  if (recent.length === 0) {
    recentList.innerHTML = `<div class="text-xs text-neutral-500 py-1 px-3">No chat history</div>`;
  } else {
    recent.forEach(s => recentList.appendChild(createSessionItem(s)));
  }
}

function createSessionItem(session) {
  const isActive = AppState.activeSessionId === session.id;
  const item = document.createElement("div");
  item.className = `group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
    isActive ? "bg-[#0078d4]/20 text-white font-medium border border-[#0078d4]/30" : "text-neutral-300 hover:bg-white/5 hover:text-white"
  }`;

  item.onclick = (e) => {
    // Avoid triggering if clicked on menu button
    if (e.target.closest(".session-actions-trigger")) return;
    selectSession(session.id);
  };

  item.innerHTML = `
    <div class="flex items-center gap-2.5 truncate">
      <span class="material-symbols-outlined text-[18px] ${isActive ? "text-[#0078d4]" : "text-neutral-400"}">
        ${session.is_pinned ? "keep" : "chat_bubble_outline"}
      </span>
      <span class="truncate text-xs">${escapeHtml(session.title || "New Chat")}</span>
    </div>
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="session-actions-trigger p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10" onclick="openSessionActionsModal('${session.id}', event)">
        <span class="material-symbols-outlined text-[16px]">more_horiz</span>
      </button>
    </div>
  `;

  return item;
}

async function selectSession(sessionId) {
  if (AppState.isStreaming) return;

  AppState.activeSessionId = sessionId;
  renderSessionsList();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to load conversation history");

    const sessionData = await res.json();
    renderChatHistory(sessionData);
    showActiveChatScreen();

    // Update Header title
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) headerTitle.textContent = sessionData.title || "Rhynia";

    // Close drawer on mobile
    toggleSidebarDrawer(false);

  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderChatHistory(sessionData) {
  const container = document.getElementById("chat-messages-container");
  container.innerHTML = "";

  const messages = sessionData.messages || [];
  if (messages.length === 0) {
    showEmptyStateScreen();
    return;
  }

  messages.forEach(msg => {
    if (msg.role === "user") {
      renderUserMessage(msg.content);
    } else {
      const bubble = createRhyniaMessageBubble();
      const contentEl = bubble.querySelector(".markdown-content");
      const cursorEl = bubble.querySelector(".stream-cursor");
      if (cursorEl) cursorEl.remove();
      contentEl.innerHTML = renderMarkdown(msg.content);
      attachMessageActions(bubble, msg.content);
    }
  });

  scrollToBottom();
}

function startNewChat() {
  if (AppState.isStreaming) return;
  AppState.activeSessionId = null;
  const container = document.getElementById("chat-messages-container");
  container.innerHTML = "";

  const headerTitle = document.getElementById("active-thread-title");
  if (headerTitle) headerTitle.textContent = "Rhynia";

  showEmptyStateScreen();
  toggleSidebarDrawer(false);
  renderSessionsList();
}

// ============================================================================
// 6. PROFILE & STORAGE TELEMETRY
// ============================================================================

async function loadStorage() {
  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile/storage`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    AppState.storageData = data;
    renderStorageUI(data);
  } catch (err) {
    console.error("Failed to load storage telemetry:", err);
  }
}

function renderStorageUI(data) {
  // Screen 05 storage progress bar
  const storagePill = document.getElementById("settings-storage-pill");
  const storageTrack = document.getElementById("settings-storage-bar");
  const storageUsedTxt = document.getElementById("settings-storage-used-txt");
  const storageFreeTxt = document.getElementById("settings-storage-free-txt");

  if (storagePill) {
    storagePill.textContent = `${data.used_mb} MB of ${data.limit_mb} MB used (${data.percent_used}%)`;
  }
  if (storageTrack) {
    storageTrack.style.width = `${Math.min(data.percent_used, 100)}%`;
  }
  if (storageUsedTxt) {
    storageUsedTxt.textContent = `${data.used_mb} MB`;
  }
  if (storageFreeTxt) {
    storageFreeTxt.textContent = `${data.remaining_mb} MB`;
  }
}

function updateUserProfileUI(user) {
  // Update name & email across drawer & settings panel
  const nameEls = document.querySelectorAll(".user-display-name");
  nameEls.forEach(el => el.textContent = user.display_name || user.email.split("@")[0]);

  const emailEls = document.querySelectorAll(".user-email-text");
  emailEls.forEach(el => el.textContent = user.email);

  const phoneEls = document.querySelectorAll(".user-phone-text");
  phoneEls.forEach(el => el.textContent = user.phone_number || "Not provided");

  const planEls = document.querySelectorAll(".user-plan-badge");
  const planInfo = CONFIG.PLANS[user.plan] || { name: user.plan.toUpperCase() };
  planEls.forEach(el => el.textContent = planInfo.name);

  // Update empty state greeting
  const greetingEl = document.getElementById("empty-state-greeting");
  if (greetingEl) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const firstName = (user.display_name || "there").split(" ")[0];
    greetingEl.textContent = `Good ${timeOfDay}, ${firstName}`;
  }
}

async function handleUpdateProfile(event) {
  event.preventDefault();
  const displayName = document.getElementById("edit-display-name").value.trim();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ display_name: displayName })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");

    AppState.user.display_name = displayName;
    updateUserProfileUI(AppState.user);
    closeAllModals();
    showToast("Profile updated successfully!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleAvatarUpload(file) {
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile/avatar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AppState.token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to upload avatar");

    showToast("Avatar uploaded successfully!", "success");
    AppState.user.avatar_url = data.avatar_url;
    // Reload user
    await initApp();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================================
// 7. FILE ATTACHMENTS & SEARCH GROUNDING
// ============================================================================

async function handleFileUpload(file) {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    showToast(`Uploading ${file.name}...`, "info");
    const res = await fetch(`${CONFIG.API_BASE}/files/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AppState.token}` },
      body: formData
    });

    const data = await res.json();
    if (res.status === 413) {
      showToast("Storage quota exceeded! Upgrade to Pro for 5 GB.", "error");
      return;
    }

    if (!res.ok) throw new Error(data.detail || "File upload failed");

    AppState.pendingFiles.push({
      id: data.file_id,
      original_name: data.filename,
      file_size: data.file_size
    });

    renderAttachmentChips();
    await loadStorage();
    showToast("File attached successfully", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderAttachmentChips() {
  const chipContainer = document.getElementById("input-attachment-chips");
  if (!chipContainer) return;

  if (AppState.pendingFiles.length === 0) {
    chipContainer.innerHTML = "";
    chipContainer.classList.add("hidden");
    return;
  }

  chipContainer.classList.remove("hidden");
  chipContainer.innerHTML = AppState.pendingFiles.map((f, idx) => `
    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0078d4]/15 border border-[#0078d4]/40 text-xs text-[#8ecdff]">
      <span class="material-symbols-outlined text-[14px]">attachment</span>
      <span class="truncate max-w-[140px]">${escapeHtml(f.original_name)}</span>
      <button onclick="removeAttachment(${idx})" class="hover:text-white p-0.5 rounded">
        <span class="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  `).join("");
}

function removeAttachment(idx) {
  AppState.pendingFiles.splice(idx, 1);
  renderAttachmentChips();
}

function toggleSearchGrounding() {
  AppState.searchGrounding = !AppState.searchGrounding;
  const btn = document.getElementById("search-grounding-toggle");
  if (btn) {
    if (AppState.searchGrounding) {
      btn.classList.add("bg-[#0078d4]/20", "text-[#8ecdff]", "border-[#0078d4]/40");
      btn.classList.remove("text-neutral-400");
      showToast("Web Search Grounding Enabled", "info");
    } else {
      btn.classList.remove("bg-[#0078d4]/20", "text-[#8ecdff]", "border-[#0078d4]/40");
      btn.classList.add("text-neutral-400");
      showToast("Web Search Grounding Disabled", "info");
    }
  }
}

// ============================================================================
// 8. SCREEN STATE SWITCHERS & UI MODALS
// ============================================================================

function showEmptyStateScreen() {
  document.getElementById("screen-empty-state").classList.remove("hidden");
  document.getElementById("screen-active-chat").classList.add("hidden");
}

function showActiveChatScreen() {
  document.getElementById("screen-empty-state").classList.add("hidden");
  document.getElementById("screen-active-chat").classList.remove("hidden");
}

function toggleSidebarDrawer(force) {
  const drawer = document.getElementById("sidebar-drawer");
  const backdrop = document.getElementById("drawer-backdrop");

  const isOpen = !drawer.classList.contains("-translate-x-full");
  const shouldOpen = force !== undefined ? force : !isOpen;

  if (shouldOpen) {
    drawer.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
  } else {
    drawer.classList.add("-translate-x-full");
    backdrop.classList.add("hidden");
  }
}

function toggleSettingsDrawer(force) {
  const drawer = document.getElementById("settings-panel");
  const backdrop = document.getElementById("settings-backdrop");

  const isOpen = !drawer.classList.contains("translate-x-full");
  const shouldOpen = force !== undefined ? force : !isOpen;

  if (shouldOpen) {
    drawer.classList.remove("translate-x-full");
    backdrop.classList.remove("hidden");
    loadStorage();
  } else {
    drawer.classList.add("translate-x-full");
    backdrop.classList.add("hidden");
  }
}

function toggle3DotsMenu(force) {
  const menu = document.getElementById("three-dots-menu");
  const isOpen = !menu.classList.contains("hidden");
  const shouldOpen = force !== undefined ? force : !isOpen;

  if (shouldOpen) {
    menu.classList.remove("hidden");
  } else {
    menu.classList.add("hidden");
  }
}

function openEditProfileModal() {
  const modal = document.getElementById("modal-edit-profile");
  modal.classList.remove("hidden");
  const input = document.getElementById("edit-display-name");
  if (input && AppState.user) {
    input.value = AppState.user.display_name || "";
  }
}

function openUpgradeModal() {
  const modal = document.getElementById("modal-upgrade-plan");
  if (modal) modal.classList.remove("hidden");
}

function closeAllModals() {
  document.querySelectorAll(".ui-modal").forEach(m => m.classList.add("hidden"));
  const threeDots = document.getElementById("three-dots-menu");
  if (threeDots) threeDots.classList.add("hidden");
}

function applyTheme(themeName, accentColor) {
  document.body.className = "";
  if (themeName === "midnight") {
    document.body.classList.add("theme-midnight");
  } else if (themeName === "contrast") {
    document.body.classList.add("theme-contrast");
  }

  if (accentColor) {
    document.documentElement.style.setProperty("--rhynia-primary", accentColor);
  }
}

// ============================================================================
// 9. EXPORTS & SESSION ACTIONS
// ============================================================================

async function exportActiveSession(format) {
  if (!AppState.activeSessionId) {
    showToast("No active conversation to export", "error");
    return;
  }

  try {
    showToast(`Generating ${format} export...`, "info");
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/export?format=${format}`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to generate export");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rhynia_session_${AppState.activeSessionId}.${format === 'slides' ? 'txt' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast("Export downloaded successfully!", "success");
    toggle3DotsMenu(false);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function pinActiveSession() {
  if (!AppState.activeSessionId) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/pin`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    const data = await res.json();
    showToast(data.message || "Session updated", "success");
    toggle3DotsMenu(false);
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function renameActiveSession() {
  if (!AppState.activeSessionId) return;
  const newTitle = prompt("Enter new title for this conversation:");
  if (!newTitle || !newTitle.trim()) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/rename`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    const data = await res.json();
    showToast("Session renamed successfully", "success");
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) headerTitle.textContent = newTitle.trim();
    toggle3DotsMenu(false);
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteActiveSession() {
  if (!AppState.activeSessionId) return;
  if (!confirm("Are you sure you want to delete this conversation?")) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    showToast("Session deleted", "success");
    toggle3DotsMenu(false);
    startNewChat();
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================================
// 10. NOTIFICATION TOASTS & EVENT LISTENERS
// ============================================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bg = type === "error" ? "bg-red-900/90 border-red-500/40 text-red-200" :
             type === "success" ? "bg-green-900/90 border-green-500/40 text-green-200" :
             "bg-[#202020]/95 border-white/15 text-white";

  toast.className = `px-4 py-2.5 rounded-lg border shadow-xl text-xs font-medium flex items-center gap-2 transform transition-all duration-200 ${bg}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[16px]">
      ${type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info'}
    </span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function updateSendButtonState() {
  const btn = document.getElementById("btn-send-message");
  if (!btn) return;
  if (AppState.isStreaming) {
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>`;
    btn.disabled = true;
  } else {
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">arrow_upward</span>`;
    btn.disabled = false;
  }
}

function setupEventListeners() {
  // Input auto-resize
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = (this.scrollHeight) + "px";
    });

    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // File picker trigger
  const fileInput = document.getElementById("file-upload-input");
  if (fileInput) {
    fileInput.addEventListener("change", function() {
      if (this.files && this.files[0]) {
        handleFileUpload(this.files[0]);
        this.value = "";
      }
    });
  }

  // Close menus when clicking outside
  document.addEventListener("click", function(e) {
    const menu = document.getElementById("three-dots-menu");
    const menuBtn = document.getElementById("three-dots-trigger");
    if (menu && !menu.classList.contains("hidden") && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}
