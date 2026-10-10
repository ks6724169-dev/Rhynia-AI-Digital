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
let savedBodyScrollY = 0;

function toggleSidebarDrawer(force, skipScrollRestore = false) {
  const drawer = document.getElementById("sidebar-drawer");
  const scrim = document.getElementById("drawer-scrim");
  if (!drawer || !scrim) return;

  const isOpen = (typeof force === "boolean") ? force : !drawer.classList.contains("-translate-x-full");

  if (isOpen) {
    savedBodyScrollY = window.scrollY || window.pageYOffset || 0;
    drawer.classList.remove("-translate-x-full");
    scrim.classList.remove("hidden");
    document.body.classList.add("drawer-open", "overflow-hidden");
    document.documentElement.classList.add("drawer-open", "overflow-hidden");
  } else {
    drawer.classList.add("-translate-x-full");
    scrim.classList.add("hidden");
    document.body.classList.remove("drawer-open", "overflow-hidden");
    document.documentElement.classList.remove("drawer-open", "overflow-hidden");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.style.touchAction = "";
    document.documentElement.style.touchAction = "";
    if (!skipScrollRestore) {
      window.scrollTo(0, savedBodyScrollY);
    }
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

  const isPinnedHelper = (s) => Boolean(s.is_pinned === true || s.is_pinned === 1 || s.is_pinned === "true" || s.is_pinned === "t");
  const pinned = sessionList.filter(s => isPinnedHelper(s));
  const recent = sessionList.filter(s => !isPinnedHelper(s));

  // Toggle Pinned Section Visibility
  if (pinnedSection) {
    pinnedSection.style.display = pinned.length > 0 ? "block" : "none";
  }

  // 1. Render Pinned List
  pinnedContainer.innerHTML = pinned.map(s => renderSessionRow(s, true)).join("");

  // 2. Render Recent List
  if (recent.length === 0 && pinned.length === 0) {
    recentContainer.innerHTML = `
      <div class="px-4 py-8 text-center text-lg text-neutral-400">
        No conversations yet. Start a new chat!
      </div>
    `;
    return;
  }

  recentContainer.innerHTML = recent.map(s => renderSessionRow(s, false)).join("");
}

/**
 * Render an individual chat session row with:
 * - 📌 Pin icon at the right edge if pinned (where 3-dots was)
 * - Long-press touch gesture support to trigger ChatGPT style context popover
 */
let activeInlineEditingSessionId = null;

/**
 * Render an individual session row:
 * - Direct inline editing support when renaming (the chat item itself turns into an edit box!)
 * - Long-press touch gesture support to trigger ChatGPT style context popover
 */
function renderSessionRow(s, isPinnedSection) {
  const isActive = s.id === AppState.activeSessionId;
  const isPinned = Boolean(s.is_pinned === true || s.is_pinned === 1 || s.is_pinned === "true" || s.is_pinned === "t");

  // INLINE EDITING: If this chat is being renamed, transform this exact row into an editable input box!
  if (activeInlineEditingSessionId === s.id) {
    return `
      <div id="session-row-${s.id}" class="session-item-row relative rounded-2xl bg-[#202020] border-2 border-white/30 p-3.5 mb-3 shadow-2xl space-y-3" onclick="event.stopPropagation();">
        <div class="flex items-center gap-3">
          ${isPinned ? `
            <span class="text-[28px] select-none flex-shrink-0 leading-none">📌</span>
          ` : `
            <span class="material-symbols-outlined text-[30px] text-neutral-300 flex-shrink-0">
              edit
            </span>
          `}
          <input id="inline-rename-input-${s.id}"
                 type="text"
                 maxlength="80"
                 value="${escapeHtml(s.title || 'Untitled Chat')}"
                 class="w-full bg-[#141414] border border-white/25 focus:border-white rounded-xl text-white text-[22px] font-semibold outline-none py-2.5 px-3.5 shadow-inner transition-colors"
                 onclick="event.stopPropagation();"
                 onkeydown="handleInlineRenameKey(event, '${s.id}');"
          />
        </div>
        <div class="flex items-center justify-end gap-2.5 pt-1">
          <button type="button"
                  onclick="event.stopPropagation(); cancelInlineRename();"
                  class="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-200 hover:text-white text-base font-semibold transition-all">
            Cancel
          </button>
          <button type="button"
                  onclick="event.stopPropagation(); saveInlineRename('${s.id}');"
                  class="h-10 px-6 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-base font-bold transition-all shadow-md">
            Save
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div id="session-row-${s.id}" class="session-item-row group relative flex items-center justify-between rounded-2xl min-h-[70px] ${isActive ? 'bg-white/[0.08] text-white shadow-sm' : 'text-neutral-200 hover:text-white hover:bg-white/[0.05]'} transition-all px-2 mb-2.5 select-none cursor-pointer"
         ontouchstart="onSessionTouchStart(event, '${s.id}')"
         ontouchmove="onSessionTouchMove(event)"
         ontouchend="onSessionTouchEnd(event, '${s.id}')"
         onclick="onSessionItemClick(event, '${s.id}')"
         oncontextmenu="event.preventDefault(); openContextMenu(event, '${s.id}');">

      <!-- Main Click Area -->
      <div class="flex-1 flex items-center gap-4 px-3.5 py-4 text-left overflow-hidden pointer-events-none">
        ${isPinned ? `
          <!-- ONLY in front of the chat: Original 📌 Pushpin Icon -->
          <span class="text-[32px] select-none flex-shrink-0 leading-none" title="Pinned">📌</span>
        ` : `
          <!-- Regular Chat Bubble Icon for unpinned chats -->
          <span class="material-symbols-outlined text-[34px] text-neutral-400 flex-shrink-0">
            chat_bubble_outline
          </span>
        `}
        <span class="text-[25px] sm:text-[26px] truncate font-semibold leading-normal flex-1 text-neutral-200 group-hover:text-white">
          ${escapeHtml(s.title || "Untitled Chat")}
        </span>
      </div>
    </div>
  `;
}

/**
 * Long-Press Gesture Detection for Sessions:
 * ChatGPT Style floating context popover without vibration
 */
let currentContextSessionId = null;
let longPressTimer = null;
let isLongPressActive = false;
let suppressClickUntil = 0;
let touchStartX = 0;
let touchStartY = 0;

function onSessionTouchStart(e, sessionId) {
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  isLongPressActive = false;
  if (longPressTimer) clearTimeout(longPressTimer);

  longPressTimer = setTimeout(() => {
    isLongPressActive = true;
    suppressClickUntil = Date.now() + 650; // Suppress touch release click so popup stays open!
    const rowEl = document.getElementById(`session-row-${sessionId}`);
    openContextMenuAtElement(rowEl, sessionId);
  }, 420);
}

function onSessionTouchMove(e) {
  if (e.touches && e.touches.length > 0) {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 || dy > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  }
}

function onSessionTouchEnd(e, sessionId) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (isLongPressActive) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function onSessionItemClick(e, sessionId) {
  if (isLongPressActive || Date.now() < suppressClickUntil) {
    e.preventDefault();
    e.stopPropagation();
    isLongPressActive = false;
    return;
  }
  openSession(sessionId);
}

/**
 * Open ChatGPT Style Context Popover Menu
 */
function openContextMenuAtElement(element, sessionId) {
  const session = AppState.sessions.find(s => s.id === sessionId);
  if (!session) return;

  currentContextSessionId = sessionId;

  const menu = document.getElementById("chatgpt-context-menu");
  const backdrop = document.getElementById("chatgpt-context-backdrop");
  const pinText = document.getElementById("ctx-pin-text");
  const pinIcon = document.getElementById("ctx-pin-icon");

  if (pinText) pinText.textContent = session.is_pinned ? "Unpin" : "Pin";
  if (pinIcon) {
    pinIcon.textContent = "📌";
  }

  if (menu && backdrop && element) {
    const rect = element.getBoundingClientRect();

    const menuWidth = 320;
    const menuHeight = 230;

    // Anchor context menu to the right side of the chat item like ChatGPT screenshot
    let left = rect.right - menuWidth - 12;
    if (left < 16) left = 16;
    if (left + menuWidth > window.innerWidth - 16) left = window.innerWidth - menuWidth - 16;

    let top = rect.top + 4;
    if (top + menuHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.bottom - menuHeight);
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    backdrop.classList.remove("hidden");
    menu.classList.remove("hidden");
  }
}

function openContextMenu(e, sessionId) {
  e.preventDefault();
  const rowEl = document.getElementById(`session-row-${sessionId}`) || e.currentTarget;
  openContextMenuAtElement(rowEl, sessionId);
}

function closeContextMenu() {
  const menu = document.getElementById("chatgpt-context-menu");
  const backdrop = document.getElementById("chatgpt-context-backdrop");
  if (menu) menu.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
  currentContextSessionId = null;
  isLongPressActive = false;
}

async function executeContextAction(action) {
  const sessionId = currentContextSessionId;
  closeContextMenu();
  if (!sessionId) return;

  if (action === "pin") {
    await togglePinSessionById(sessionId);
  } else if (action === "rename") {
    await renameSessionById(sessionId);
  } else if (action === "delete") {
    await deleteSessionById(sessionId);
  }
}

/**
 * Scroll To Last Message In View:
 * When user opens a recent chat from history, brings the LAST MESSAGE of the conversation
 * directly into view on the screen, ensuring zero blank/empty screen!
 */
function scrollToLastMessageInView() {
  const container = document.getElementById("chat-messages-container");
  if (!container || !container.lastElementChild) return;

  const anchor = document.getElementById("chat-scroll-anchor");
  if (anchor) {
    anchor.style.minHeight = "48px";
  }

  const lastMsg = container.lastElementChild;

  const performScroll = () => {
    // 1. Scroll directly to the bottom so conversation ends right above input box
    try {
      lastMsg.scrollIntoView({ behavior: "auto", block: "end", inline: "nearest" });
    } catch (_) {
      lastMsg.scrollIntoView(false);
    }

    // 2. Position the response action buttons just slightly above the input box (gap ~28px)
    const composerEl = document.querySelector(".fixed.bottom-0");
    const composerH = composerEl ? composerEl.offsetHeight : 100;
    const winH = window.innerHeight || document.documentElement.clientHeight;
    const actionsBar = lastMsg.querySelector(".ai-actions-bar");
    const targetElement = actionsBar || lastMsg;
    const rect = targetElement.getBoundingClientRect();

    const desiredBottom = winH - composerH - 28;
    const diff = rect.bottom - desiredBottom;
    if (Math.abs(diff) > 4) {
      window.scrollBy({ top: diff, behavior: "auto" });
      if (document.documentElement) document.documentElement.scrollTop += diff;
      if (document.body) document.body.scrollTop += diff;
    }

    // 3. Container scroll if #screen-active-chat has active scrollbar
    const chatScroll = document.getElementById("screen-active-chat");
    if (chatScroll && chatScroll.scrollHeight > chatScroll.clientHeight) {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }
  };

  performScroll();
  requestAnimationFrame(performScroll);
  setTimeout(performScroll, 50);
  setTimeout(performScroll, 160);
  setTimeout(performScroll, 320);
}
window.scrollToLastMessageInView = scrollToLastMessageInView;

/**
 * Open Conversation History by Session ID (GET /api/v1/sessions/{id})
 */
async function openSession(sessionId) {
  if (!sessionId) return;
  toggleSidebarDrawer(false, true);

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

    // Set scroll anchor to 48px so response buttons sit slightly above input box
    const anchor = document.getElementById("chat-scroll-anchor");
    if (anchor) {
      anchor.style.minHeight = "48px";
    }

    // Render Messages
    if (session.messages && session.messages.length > 0) {
      session.messages.forEach(msg => {
        if (msg.role === "user") {
          appendUserMessageUI(msg.content, [], msg.created_at || msg.timestamp, false);
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
      if (anchor) {
        anchor.style.minHeight = "48px";
      }

      // Smoothly bring the LAST MESSAGE into view with response buttons slightly above input box
      scrollToLastMessageInView();
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

    // Instantly update the session in AppState.sessions so it renders immediately
    const sessionToUpdate = AppState.sessions.find(s => s.id === sessionId);
    if (sessionToUpdate) {
      sessionToUpdate.is_pinned = Boolean(updated.is_pinned);
    }
    renderDrawerSessionLists(AppState.sessions);

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

let pendingDeleteSessionId = null;

/**
 * Inline Rename Functionality (Direct inline editing in drawer list):
 * No popups or modals - the chat item row itself becomes an editable input!
 */
function startInlineRename(sessionId) {
  activeInlineEditingSessionId = sessionId;
  renderDrawerSessionLists(AppState.sessions);
  // Auto-focus and select text in the inline input
  setTimeout(() => {
    const input = document.getElementById(`inline-rename-input-${sessionId}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 50);
}

function cancelInlineRename() {
  activeInlineEditingSessionId = null;
  renderDrawerSessionLists(AppState.sessions);
}

function handleInlineRenameKey(event, sessionId) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveInlineRename(sessionId);
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelInlineRename();
  }
}

async function saveInlineRename(sessionId) {
  const input = document.getElementById(`inline-rename-input-${sessionId}`);
  if (!input) {
    cancelInlineRename();
    return;
  }
  const newTitle = input.value.trim();
  if (!newTitle) {
    showToast("Please enter a title", "error");
    return;
  }

  // Update locally immediately for instant feedback
  const targetSession = AppState.sessions.find(s => s.id === sessionId);
  if (targetSession) {
    targetSession.title = newTitle;
  }
  activeInlineEditingSessionId = null;
  renderDrawerSessionLists(AppState.sessions);

  if (AppState.activeSessionId === sessionId) {
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) headerTitle.textContent = newTitle;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}/title`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (!res.ok) throw new Error("Failed to rename conversation");

    showToast("Chat renamed successfully!", "success");
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

let pendingRenameSessionId = null;

function openRenameModal(sessionId) {
  if (!sessionId) return;
  pendingRenameSessionId = sessionId;
  const session = AppState.sessions.find(s => s.id === sessionId);
  const currentTitle = session ? session.title : "";

  const input = document.getElementById("rename-chat-modal-input");
  if (input) {
    input.value = currentTitle;
  }

  const modal = document.getElementById("modal-rename-session");
  if (modal) {
    modal.classList.remove("hidden");
  }

  setTimeout(() => {
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}

function closeRenameModal() {
  const modal = document.getElementById("modal-rename-session");
  if (modal) modal.classList.add("hidden");
  pendingRenameSessionId = null;
}

function handleRenameModalKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    confirmRenameModal();
  } else if (e.key === "Escape") {
    closeRenameModal();
  }
}

async function confirmRenameModal() {
  const sessionId = pendingRenameSessionId;
  const input = document.getElementById("rename-chat-modal-input");
  if (!sessionId || !input) return;

  const newTitle = input.value.trim();
  if (!newTitle) {
    showToast("Please enter a valid title", "error");
    return;
  }

  closeRenameModal();

  // Optimistic UI update
  const targetSession = AppState.sessions.find(s => s.id === sessionId);
  if (targetSession) {
    targetSession.title = newTitle;
  }
  renderDrawerSessionLists(AppState.sessions);

  if (AppState.activeSessionId === sessionId) {
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) headerTitle.textContent = newTitle;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}/title`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (!res.ok) throw new Error("Failed to rename conversation");

    showToast("Chat renamed", "success");
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renameSessionById(sessionId) {
  openRenameModal(sessionId);
}

function openDeleteModal(sessionId) {
  pendingDeleteSessionId = sessionId;
  const modal = document.getElementById("modal-delete-session");
  if (modal) modal.classList.remove("hidden");
}

function closeDeleteModal() {
  const modal = document.getElementById("modal-delete-session");
  if (modal) modal.classList.add("hidden");
  pendingDeleteSessionId = null;
}

async function confirmDeleteSession() {
  const sessionId = pendingDeleteSessionId;
  closeDeleteModal();
  if (!sessionId) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to delete conversation");

    // Remove from AppState immediately
    AppState.sessions = AppState.sessions.filter(s => s.id !== sessionId);
    renderDrawerSessionLists(AppState.sessions);

    showToast("Conversation deleted", "success");

    // If active session was deleted, switch to empty state or next session
    if (AppState.activeSessionId === sessionId) {
      if (AppState.sessions.length > 0) {
        openSession(AppState.sessions[0].id);
      } else {
        startNewChat();
      }
    }

    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function deleteSessionById(sessionId) {
  openDeleteModal(sessionId);
}

window.openRenameModal = openRenameModal;
window.closeRenameModal = closeRenameModal;
window.handleRenameModalKeyDown = handleRenameModalKeyDown;
window.confirmRenameModal = confirmRenameModal;
window.startInlineRename = startInlineRename;
window.cancelInlineRename = cancelInlineRename;
window.handleInlineRenameKey = handleInlineRenameKey;
window.saveInlineRename = saveInlineRename;
window.renameSessionById = renameSessionById;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteSession = confirmDeleteSession;

/**
 * Update Drawer Profile Button with Live User Data
 */
function updateDrawerProfileAvatar() {
  const settingsBtn = document.getElementById("drawer-settings-btn") || document.getElementById("drawer-user-avatar-btn");
  if (!settingsBtn) return;

  const user = AppState.user;
  const name = (user && (user.display_name || user.username)) || "Account";
  settingsBtn.title = `${name} — Settings & Profile`;
}

/**
 * Mobile Touch Gesture: Swipe Left to Close Drawer & Outside Touch Detection
 */
(function initDrawerTouchGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener("touchstart", (e) => {
    const drawer = document.getElementById("sidebar-drawer");
    if (!drawer || drawer.classList.contains("-translate-x-full")) return;

    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  // Prevent background scrolling while moving finger on scrim or outside drawer
  document.addEventListener("touchmove", (e) => {
    const drawer = document.getElementById("sidebar-drawer");
    if (!drawer || drawer.classList.contains("-translate-x-full")) return;

    const target = e.target;
    const isInsideDrawer = drawer.contains(target);

    // If touching outside the drawer (e.g. on scrim), always prevent default scroll
    if (!isInsideDrawer) {
      e.preventDefault();
      return;
    }

    // If inside drawer, allow scrolling ONLY within .custom-scrollbar container
    const scrollContainer = drawer.querySelector(".custom-scrollbar");
    if (scrollContainer && scrollContainer.contains(target)) {
      // Allow scroll inside the drawer list, but stop propagation to window
      e.stopPropagation();
    } else {
      // Header or footer touchmove should not scroll background
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener("touchend", (e) => {
    const drawer = document.getElementById("sidebar-drawer");
    if (!drawer || drawer.classList.contains("-translate-x-full")) return;

    if (e.changedTouches && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const dt = Date.now() - touchStartTime;

      // 1. Swipe Left on drawer to close (movement to the left by >= 40px)
      if (dx < -40 && Math.abs(dx) > Math.abs(dy) * 0.7) {
        toggleSidebarDrawer(false);
        return;
      }
      if (dx < -25 && dt < 300 && Math.abs(dx) > Math.abs(dy)) {
        toggleSidebarDrawer(false);
        return;
      }

      // 2. Touch on the right side screen outside the drawer to auto-close
      const drawerRect = drawer.getBoundingClientRect();
      if (touchStartX > drawerRect.right && touchEndX > drawerRect.right && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        toggleSidebarDrawer(false);
      }
    }
  }, { passive: true });
})();
