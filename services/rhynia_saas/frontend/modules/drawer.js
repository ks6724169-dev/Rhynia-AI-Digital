/**
 * Rhynia Intelligence SaaS — Navigation Drawer Module (Screen 04)
 * Strict Brand Compliance: Rhynia
 * Exact Reference Match: docs/rhynia_saas/ui_screens/04_sidebar_drawer.html
 * Zero Dead Buttons:
 *   - Search icon expands live search filter (oninput real-time search across conversations)
 *   - Pinned conversation list with Azure indicator and full action flyout (Pin/Unpin, Rename, Delete)
 *   - Recent conversation list with full click-to-load and hover actions
 *   - Bottom Left: [ + New Chat ] button (clears session, switches to empty workspace)
 *   - Bottom Right: [ (👤) ] Profile avatar button (opens Screen 05 Settings & Profile panel)
 */

/**
 * Toggle Navigation Drawer (Screen 04)
 */
function toggleSidebarDrawer(force) {
  const drawer = document.getElementById("sidebar-drawer");
  const scrim = document.getElementById("drawer-scrim");
  if (!drawer || !scrim) return;

  const isOpen = (typeof force === "boolean") ? force : !drawer.classList.contains("-translate-x-full");

  if (isOpen) {
    drawer.classList.remove("-translate-x-full");
    scrim.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  } else {
    drawer.classList.add("-translate-x-full");
    scrim.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }
}

/**
 * Toggle Inline Search Bar in Drawer Header
 */
function toggleDrawerSearch() {
  const searchContainer = document.getElementById("drawer-search-container");
  const searchInput = document.getElementById("drawer-search-input");
  if (!searchContainer || !searchInput) return;

  if (searchContainer.classList.contains("hidden")) {
    searchContainer.classList.remove("hidden");
    searchInput.focus();
  } else {
    searchContainer.classList.add("hidden");
    searchInput.value = "";
    filterDrawerSessions("");
  }
}

/**
 * Live Filter Pinned & Recent Sessions on Keystroke
 */
function filterDrawerSessions(query) {
  const q = (query || "").trim().toLowerCase();
  const pinnedContainer = document.getElementById("drawer-pinned-list");
  const recentContainer = document.getElementById("drawer-recent-list");

  if (!AppState.sessions || AppState.sessions.length === 0) return;

  const filtered = AppState.sessions.filter(s => {
    if (!q) return true;
    return (s.title || "").toLowerCase().includes(q);
  });

  renderDrawerSessionLists(filtered);
}

/**
 * Load Sessions from Backend REST API (GET /api/v1/sessions)
 */
async function loadSessions() {
  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (res.status === 401) {
      logoutUser();
      return;
    }

    if (!res.ok) throw new Error("Failed to load conversation history");

    const data = await res.json();
    AppState.sessions = Array.isArray(data) ? data : [];
    renderDrawerSessionLists(AppState.sessions);

  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

/**
 * Render Pinned and Recent conversation items into the Drawer DOM
 */
function renderDrawerSessionLists(sessionList) {
  const pinnedContainer = document.getElementById("drawer-pinned-list");
  const recentContainer = document.getElementById("drawer-recent-list");
  const pinnedSection = document.getElementById("drawer-pinned-section");

  if (!pinnedContainer || !recentContainer) return;

  const pinned = sessionList.filter(s => s.is_pinned);
  const recent = sessionList.filter(s => !s.is_pinned);

  // Toggle Pinned Section Visibility
  if (pinnedSection) {
    pinnedSection.style.display = pinned.length > 0 ? "block" : "none";
  }

  // 1. Render Pinned List
  pinnedContainer.innerHTML = pinned.map(s => {
    const isActive = s.id === AppState.activeSessionId;
    return `
      <div class="rounded-lg bg-[#272727] border ${isActive ? 'border-[#0078D4]/50' : 'border-[#383838]'} p-1.5 shadow-sm space-y-1 mb-2">
        <!-- Active Chat Item Row with Azure vertical indicator -->
        <div onclick="openSession('${s.id}')" class="relative flex items-center justify-between px-2.5 py-2 rounded-md ${isActive ? 'bg-[#303030] text-white' : 'hover:bg-[#303030] text-neutral-200'} cursor-pointer transition-colors group">
          ${isActive ? `<div class="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0078D4] rounded-r-full"></div>` : ""}
          <div class="flex items-center gap-2.5 pl-1.5 overflow-hidden">
            <span class="material-symbols-outlined text-base ${isActive ? 'text-[#0078D4]' : 'text-neutral-400'}" style="font-variation-settings: 'FILL' 1;">chat_bubble</span>
            <span class="text-xs font-medium truncate">${escapeHtml(s.title || "Untitled Chat")}</span>
          </div>
          <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#0078D4]' : 'bg-transparent'} flex-shrink-0"></span>
        </div>

        <!-- Action Buttons (Pinned, Rename, Delete) matching Screen 04 card layout -->
        ${isActive ? `
          <div class="pt-1 pb-0.5 px-0.5 flex flex-col gap-0.5 bg-[#202020] rounded-md border border-[#2d2d2d]">
            <button onclick="togglePinSessionById('${s.id}')" class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-[#0078D4] hover:bg-[#0078D4]/10 active:bg-[#0078D4]/20 transition-colors text-left" title="Unpin from top">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">keep</span>
              <span>Pinned</span>
            </button>
            <button onclick="renameSessionById('${s.id}')" class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-[#e5e2e1] hover:bg-[#2e2e2e] active:bg-[#383838] transition-colors text-left" title="Rename Chat">
              <span class="material-symbols-outlined text-sm text-[#8a919e]">edit</span>
              <span>Rename</span>
            </button>
            <div class="h-px bg-[#2d2d2d] my-0.5 mx-1"></div>
            <button onclick="deleteSessionById('${s.id}')" class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-[#ff7b7b] hover:bg-[#93000a]/20 active:bg-[#93000a]/30 transition-colors text-left" title="Delete Chat">
              <span class="material-symbols-outlined text-sm text-[#ff7b7b]">delete</span>
              <span>Delete</span>
            </button>
          </div>
        ` : `
          <div class="flex items-center justify-end gap-1 px-1 py-0.5 text-neutral-400">
            <button onclick="togglePinSessionById('${s.id}')" class="p-1 hover:text-white rounded hover:bg-white/10" title="Unpin">
              <span class="material-symbols-outlined text-xs">keep</span>
            </button>
            <button onclick="renameSessionById('${s.id}')" class="p-1 hover:text-white rounded hover:bg-white/10" title="Rename">
              <span class="material-symbols-outlined text-xs">edit</span>
            </button>
            <button onclick="deleteSessionById('${s.id}')" class="p-1 hover:text-red-400 rounded hover:bg-white/10" title="Delete">
              <span class="material-symbols-outlined text-xs">delete</span>
            </button>
          </div>
        `}
      </div>
    `;
  }).join("");

  // 2. Render Recent List
  if (recent.length === 0 && pinned.length === 0) {
    recentContainer.innerHTML = `
      <div class="px-3 py-6 text-center text-xs text-neutral-500">
        No conversations yet. Start a new chat!
      </div>
    `;
    return;
  }

  recentContainer.innerHTML = recent.map(s => {
    const isActive = s.id === AppState.activeSessionId;
    return `
      <div class="group relative flex items-center justify-between rounded-md ${isActive ? 'bg-[#2a2a2a] text-white' : 'text-[#c0c7d4] hover:text-white hover:bg-[#2a2a2a]'} transition-colors">
        <button onclick="openSession('${s.id}')" class="w-full flex items-center gap-2.5 px-2.5 py-2 text-left overflow-hidden">
          <span class="material-symbols-outlined text-base ${isActive ? 'text-[#0078D4]' : 'text-[#8a919e]'} flex-shrink-0">chat_bubble_outline</span>
          <span class="text-xs truncate font-normal">${escapeHtml(s.title || "Untitled Chat")}</span>
        </button>
        <div class="opacity-0 group-hover:opacity-100 flex items-center pr-1 transition-opacity">
          <button onclick="togglePinSessionById('${s.id}')" class="p-1 text-neutral-400 hover:text-[#0078D4] rounded" title="Pin to top">
            <span class="material-symbols-outlined text-xs">keep</span>
          </button>
          <button onclick="deleteSessionById('${s.id}')" class="p-1 text-neutral-400 hover:text-red-400 rounded" title="Delete">
            <span class="material-symbols-outlined text-xs">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Open Conversation History by Session ID (GET /api/v1/sessions/{id})
 */
async function openSession(sessionId) {
  if (!sessionId) return;
  toggleSidebarDrawer(false);

  AppState.activeSessionId = sessionId;
  localStorage.setItem(CONFIG.SESSION_KEY, sessionId);

  showActiveChatScreen();

  const container = document.getElementById("chat-messages-container");
  if (container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-16 text-neutral-400 gap-2">
        <span class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
        <span class="text-sm">Loading conversation...</span>
      </div>
    `;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to load session details");

    const session = await res.json();

    // Update Header Thread Title
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) {
      headerTitle.textContent = session.title || "Conversation";
    }

    // Update Header Keep Icon if pinned
    const headerPin = document.getElementById("active-thread-pin-icon");
    if (headerPin) {
      headerPin.style.display = session.is_pinned ? "inline-block" : "none";
    }

    if (container) container.innerHTML = "";

    // Render Messages
    if (session.messages && session.messages.length > 0) {
      session.messages.forEach(msg => {
        if (msg.role === "user") {
          appendUserMessageUI(msg.content, []);
        } else {
          // Rhynia Response Message
          const { textContainer, actionsContainer } = appendRhyniaPlaceholderUI(msg.id);
          textContainer.innerHTML = renderMarkdown(msg.content);
          actionsContainer.classList.remove("hidden");
          actionsContainer.classList.add("flex");
        }
      });
      if (typeof renderAllMermaidDiagrams === "function") {
        renderAllMermaidDiagrams(container);
      }
      if (typeof renderAllRhyniaCharts === "function") {
        renderAllRhyniaCharts(container);
      }
      scrollChatToBottom();
    } else {
      if (container) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center py-16 text-neutral-500 gap-2">
            <span class="material-symbols-outlined text-3xl">chat</span>
            <span class="text-sm">Conversation is empty. Type below to begin.</span>
          </div>
        `;
      }
    }

    // Refresh drawer selection state
    renderDrawerSessionLists(AppState.sessions);

  } catch (err) {
    console.error("Error opening session:", err);
    showToast(err.message, "error");
    if (container) {
      container.innerHTML = `<div class="text-center py-12 text-red-400 text-sm">Error: ${escapeHtml(err.message)}</div>`;
    }
  }
}

/**
 * Pin / Unpin Session by ID (PATCH /api/v1/sessions/{id}/pin)
 */
async function togglePinSessionById(sessionId) {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}/pin`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to toggle pin");

    const updated = await res.json();
    showToast(updated.is_pinned ? "Pinned to Top!" : "Unpinned", "success");

    // If active session, update header pin icon
    if (AppState.activeSessionId === sessionId) {
      const headerPin = document.getElementById("active-thread-pin-icon");
      if (headerPin) headerPin.style.display = updated.is_pinned ? "inline-block" : "none";
    }

    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * Rename Session by ID (PATCH /api/v1/sessions/{id}/title)
 */
async function renameSessionById(sessionId) {
  const current = AppState.sessions.find(s => s.id === sessionId);
  const currentTitle = current ? current.title : "";

  const newTitle = prompt("Enter new title for this conversation:", currentTitle);
  if (!newTitle || !newTitle.trim()) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}/title`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (!res.ok) throw new Error("Failed to rename conversation");

    showToast("Conversation renamed!", "success");

    if (AppState.activeSessionId === sessionId) {
      const headerTitle = document.getElementById("active-thread-title");
      if (headerTitle) headerTitle.textContent = newTitle.trim();
    }

    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * Delete Session by ID (DELETE /api/v1/sessions/{id})
 */
async function deleteSessionById(sessionId) {
  if (!confirm("Are you sure you want to delete this conversation?")) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to delete conversation");

    showToast("Conversation deleted", "success");

    if (AppState.activeSessionId === sessionId) {
      startNewChat();
    }

    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * Update Drawer Profile Button with Live User Data
 */
function updateDrawerProfileAvatar() {
  const avatarImg = document.getElementById("drawer-user-avatar-img");
  const avatarBtn = document.getElementById("drawer-user-avatar-btn");
  if (!avatarBtn) return;

  if (AppState.user) {
    avatarBtn.title = `${AppState.user.display_name || AppState.user.username || "User"} - Profile & Settings`;
    if (avatarImg) {
      if (AppState.user.avatar_url) {
        avatarImg.src = AppState.user.avatar_url;
        avatarImg.classList.remove("hidden");
      } else {
        // Fallback: styled initial
        avatarImg.classList.add("hidden");
        let initialEl = avatarBtn.querySelector(".user-avatar-initial");
        if (!initialEl) {
          initialEl = document.createElement("span");
          initialEl.className = "user-avatar-initial text-xs font-semibold text-white";
          avatarBtn.prepend(initialEl);
        }
        initialEl.textContent = (AppState.user.display_name || AppState.user.username || "U")[0].toUpperCase();
      }
    }
  }
}
