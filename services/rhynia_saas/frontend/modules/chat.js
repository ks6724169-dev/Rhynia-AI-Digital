/**
 * Rhynia Intelligence SaaS — Chat & Actions Module (Screen 02 & 03)
 * Open Layout (No bounding boxes), Streaming SSE, 5 Response Action Buttons, 3-Dots Flyout Menu
 */

let activeUtterance = null;
let activeSpeakerBtn = null;

/**
 * Toggle 3-Dots More Options Flyout (Screen 03)
 */
function toggle3DotsMenu(force) {
  const menu = document.getElementById("three-dots-menu");
  if (!menu) return;
  const willOpen = (typeof force === "boolean") ? force : menu.classList.contains("hidden");

  if (willOpen) {
    menu.classList.remove("hidden");
  } else {
    menu.classList.add("hidden");
  }
}

/**
 * Show / Switch between Screen 01 (Empty State) and Screen 02 (Active Chat)
 */
function showActiveChatScreen() {
  const emptyScreen = document.getElementById("screen-empty-state");
  const activeChat = document.getElementById("screen-active-chat");
  if (emptyScreen) emptyScreen.classList.add("hidden");
  if (activeChat) activeChat.classList.remove("hidden");
}

function showEmptyChatScreen() {
  const emptyScreen = document.getElementById("screen-empty-state");
  const activeChat = document.getElementById("screen-active-chat");
  if (emptyScreen) emptyScreen.classList.remove("hidden");
  if (activeChat) activeChat.classList.add("hidden");

  const headerTitle = document.getElementById("active-thread-title");
  if (headerTitle) headerTitle.textContent = "Rhynia";
}

/**
 * Send Chat Message & Read Server-Sent Events (SSE) Stream
 */
async function sendChatMessage() {
  const inputEl = document.getElementById("chat-input");
  if (!inputEl || AppState.isStreaming) return;

  const content = inputEl.value.trim();
  const files = [...AppState.pendingFiles];

  if (!content && files.length === 0) {
    inputEl.focus();
    return;
  }

  // Clear input and pending files immediately
  inputEl.value = "";
  AppState.pendingFiles = [];
  const chipsContainer = document.getElementById("input-attachment-chips");
  if (chipsContainer) {
    chipsContainer.innerHTML = "";
    chipsContainer.classList.add("hidden");
  }

  showActiveChatScreen();

  // 1. Render User Prompt Message (Right-aligned, soft surface)
  appendUserMessageUI(content, files);

  // 2. Render Rhynia Response Stream Container (Left-aligned, open layout)
  const { rhyniaMessageId, textContainer, actionsContainer } = appendRhyniaPlaceholderUI();

  // 3. Initiate SSE Streaming Request to POST /api/v1/chat
  AppState.isStreaming = true;
  updateComposerSendState(true);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: content,
        session_id: AppState.activeSessionId,
        files: files.map(f => f.id)
      })
    });

    if (res.status === 429) {
      const errData = await res.json();
      throw new Error(errData.detail || "Daily message limit reached. Please upgrade your tier.");
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${res.status}`);
    }

    // Capture Session ID from Response Header if new session created
    const headerSessionId = res.headers.get("X-Rhynia-Session-Id");
    if (headerSessionId && !AppState.activeSessionId) {
      AppState.activeSessionId = headerSessionId;
      localStorage.setItem(CONFIG.SESSION_KEY, headerSessionId);
      loadSessions();
    }

    // Read SSE Stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullResponse = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Retain incomplete line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.replace("data: ", "").trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            const token = parsed.token || parsed.delta || parsed.content || "";
            fullResponse += token;
            textContainer.innerHTML = renderMarkdown(fullResponse);
            scrollChatToBottom();
          } catch (e) {
            // Text chunk
            fullResponse += payload;
            textContainer.innerHTML = renderMarkdown(fullResponse);
            scrollChatToBottom();
          }
        }
      }
    }

    // Finished streaming: reveal Response Action Bar (5 icons)
    actionsContainer.classList.remove("hidden");
    actionsContainer.classList.add("flex");

    // Refresh storage telemetry
    loadStorage();

  } catch (err) {
    console.error("Chat error:", err);
    textContainer.innerHTML = `<span class="text-red-400 text-sm">Error: ${escapeHtml(err.message)}</span>`;
    showToast(err.message, "error");
  } finally {
    AppState.isStreaming = false;
    updateComposerSendState(false);
  }
}

/**
 * Append User Message UI Bubble (Right-aligned, soft surface)
 */
function appendUserMessageUI(text, files) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = "flex flex-col items-end w-full pl-8 sm:pl-16 py-3 animate-fade-in";

  let filesHtml = "";
  if (files && files.length > 0) {
    filesHtml = `<div class="flex flex-wrap gap-1.5 mb-2 justify-end">` +
      files.map(f => `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#252525] border border-white/10 text-xs text-neutral-300">
          <span class="material-symbols-outlined text-[15px] text-[#0078d4]">attach_file</span>
          <span class="truncate max-w-[150px]">${escapeHtml(f.name)}</span>
        </span>
      `).join("") +
      `</div>`;
  }

  msgDiv.innerHTML = `
    ${filesHtml}
    <div class="text-[16px] sm:text-[17px] text-white font-medium text-right leading-relaxed tracking-tight max-w-2xl py-1">
      ${escapeHtml(text)}
    </div>
  `;

  container.appendChild(msgDiv);
  scrollChatToBottom();
}

/**
 * Append Rhynia Placeholder UI (Left-aligned, open layout with 5 action buttons)
 */
function appendRhyniaPlaceholderUI() {
  const container = document.getElementById("chat-messages-container");
  const msgId = "ai-msg-" + Date.now();

  const msgDiv = document.createElement("div");
  msgDiv.id = msgId;
  msgDiv.className = "flex flex-col gap-3 w-full pr-2 sm:pr-8 py-4 animate-fade-in border-b border-white/[0.04]";

  msgDiv.innerHTML = `
    <!-- Response Markdown Content -->
    <div class="ai-text-body markdown-body space-y-3 text-[#d0d0d0] text-[15px] leading-relaxed">
      <span class="inline-block w-2 h-4 bg-[#0078d4] animate-pulse rounded-sm"></span>
    </div>

    <!-- Response Action Bar (5 Icons: Copy, Speaker, Good, Bad, Share) -->
    <div class="ai-actions-bar hidden items-center gap-1.5 pt-2 text-neutral-400">
      <button onclick="copyResponseText(this)" aria-label="Copy response" title="Copy response" class="w-8 h-8 rounded-md inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">content_copy</span>
      </button>
      <button onclick="speakResponseText(this)" aria-label="Read aloud" title="Read aloud" class="w-8 h-8 rounded-md inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">volume_up</span>
      </button>
      <button onclick="feedbackResponse(this, true)" aria-label="Good response" title="Good response" class="w-8 h-8 rounded-md inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">thumb_up</span>
      </button>
      <button onclick="feedbackResponse(this, false)" aria-label="Poor response" title="Poor response" class="w-8 h-8 rounded-md inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">thumb_down</span>
      </button>
      <button onclick="shareResponseSnippet(this)" aria-label="Share snippet" title="Share snippet" class="w-8 h-8 rounded-md inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">share</span>
      </button>
    </div>
  `;

  container.appendChild(msgDiv);
  scrollChatToBottom();

  return {
    assistantMessageId: msgId,
    textContainer: msgDiv.querySelector(".ai-text-body"),
    actionsContainer: msgDiv.querySelector(".ai-actions-bar")
  };
}

/**
 * 5 Actions: Copy Response Text
 */
async function copyResponseText(buttonEl) {
  const parent = buttonEl.closest("[id^='ai-msg-']");
  if (!parent) return;
  const textBody = parent.querySelector(".ai-text-body");
  if (!textBody) return;

  try {
    await navigator.clipboard.writeText(textBody.innerText);
    showToast("Copied response to clipboard!", "success");
    const icon = buttonEl.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = "check";
      setTimeout(() => icon.textContent = "content_copy", 2000);
    }
  } catch (err) {
    showToast("Failed to copy text", "error");
  }
}

/**
 * 5 Actions: Speaker Read-Aloud (SpeechSynthesis API)
 */
function speakResponseText(buttonEl) {
  const icon = buttonEl.querySelector(".material-symbols-outlined");

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (activeSpeakerBtn && activeSpeakerBtn.querySelector(".material-symbols-outlined")) {
      activeSpeakerBtn.querySelector(".material-symbols-outlined").textContent = "volume_up";
    }
    if (activeSpeakerBtn === buttonEl) {
      activeSpeakerBtn = null;
      return;
    }
  }

  const parent = buttonEl.closest("[id^='ai-msg-']");
  if (!parent) return;
  const textBody = parent.querySelector(".ai-text-body");
  if (!textBody) return;

  const text = textBody.innerText;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;

  utterance.onstart = () => {
    if (icon) icon.textContent = "stop_circle";
    activeSpeakerBtn = buttonEl;
  };

  utterance.onend = () => {
    if (icon) icon.textContent = "volume_up";
    activeSpeakerBtn = null;
  };

  utterance.onerror = () => {
    if (icon) icon.textContent = "volume_up";
    activeSpeakerBtn = null;
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * 5 Actions: Like / Dislike Feedback
 */
function feedbackResponse(buttonEl, isPositive) {
  const icon = buttonEl.querySelector(".material-symbols-outlined");
  buttonEl.classList.add(isPositive ? "text-[#0078d4]" : "text-red-400");
  buttonEl.classList.add("bg-white/10");
  showToast(isPositive ? "Thanks for your feedback!" : "Feedback recorded", "info");
}

/**
 * 5 Actions: Share Response Snippet
 */
async function shareResponseSnippet(buttonEl) {
  const parent = buttonEl.closest("[id^='ai-msg-']");
  const text = parent ? parent.querySelector(".ai-text-body").innerText : "";

  if (navigator.share) {
    try {
      await navigator.share({ title: "Rhynia Intelligence", text: text });
      return;
    } catch (e) {}
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    showToast("Shareable snippet copied to clipboard!", "success");
  } catch (e) {
    showToast("Failed to share", "error");
  }
}

/**
 * 3-Dots Menu: Pin/Unpin Active Session
 */
async function pinActiveSession() {
  toggle3DotsMenu(false);
  if (!AppState.activeSessionId) {
    showToast("No active conversation to pin", "info");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/pin`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to update pin status");
    const updated = await res.json();
    showToast(updated.is_pinned ? "Pinned to Top!" : "Unpinned", "success");

    const headerPin = document.getElementById("active-thread-pin-icon");
    if (headerPin) headerPin.style.display = updated.is_pinned ? "inline-block" : "none";

    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * 3-Dots Menu: Rename Active Session
 */
async function renameActiveSession() {
  toggle3DotsMenu(false);
  if (!AppState.activeSessionId) {
    showToast("No active conversation to rename", "info");
    return;
  }

  const currentTitle = document.getElementById("active-thread-title")?.textContent || "";
  const newTitle = prompt("Enter new title for this conversation:", currentTitle);
  if (!newTitle || !newTitle.trim()) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/title`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (!res.ok) throw new Error("Failed to rename conversation");
    const headerTitle = document.getElementById("active-thread-title");
    if (headerTitle) headerTitle.textContent = newTitle.trim();
    showToast("Conversation renamed!", "success");
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * 3-Dots Menu: Export Conversation (Document / Presentation)
 */
async function exportActiveSession(format = "text") {
  toggle3DotsMenu(false);
  if (!AppState.activeSessionId) {
    showToast("No active conversation to export", "info");
    return;
  }

  showToast(`Preparing ${format === 'slides' ? 'presentation' : 'document'} export...`, "info");

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}/export?format=${format}`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (res.status === 403) {
      const err = await res.json();
      throw new Error(err.detail || "Export requires upgraded plan");
    }

    if (!res.ok) throw new Error("Export failed");

    if (format === "slides") {
      const outline = await res.json();
      showToast("Presentation outline generated!", "success");
      console.log("Presentation Outline:", outline);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rhynia_${AppState.activeSessionId.substring(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast("Document downloaded successfully!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * 3-Dots Menu: Share Conversation
 */
async function shareActiveSession() {
  toggle3DotsMenu(false);
  const title = document.getElementById("active-thread-title")?.textContent || "Conversation";
  const shareData = {
    title: `Rhynia - ${title}`,
    text: `Read conversation "${title}" on Rhynia Intelligence`,
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (e) {}
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Conversation link copied to clipboard!", "success");
  } catch (err) {
    showToast("Failed to copy link", "error");
  }
}

/**
 * 3-Dots Menu: Delete Active Session
 */
async function deleteActiveSession() {
  toggle3DotsMenu(false);
  if (!AppState.activeSessionId) {
    showToast("No active conversation to delete", "info");
    return;
  }

  if (!confirm("Are you sure you want to delete this conversation?")) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/sessions/${AppState.activeSessionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to delete conversation");
    showToast("Conversation deleted", "success");
    startNewChat();
    await loadSessions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * Start New Chat
 */
function startNewChat() {
  toggleSidebarDrawer(false);
  toggle3DotsMenu(false);
  AppState.activeSessionId = null;
  localStorage.removeItem(CONFIG.SESSION_KEY);

  const container = document.getElementById("chat-messages-container");
  if (container) container.innerHTML = "";

  showEmptyChatScreen();
  const input = document.getElementById("chat-input");
  if (input) input.focus();
}

/**
 * Update Send Button Visual State during streaming
 */
function updateComposerSendState(isStreaming) {
  const sendBtn = document.getElementById("btn-send-message");
  if (!sendBtn) return;

  if (isStreaming) {
    sendBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>`;
  } else {
    sendBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] transform -rotate-45 ml-0.5">near_me</span>`;
  }
}

function scrollChatToBottom() {
  const chatScroll = document.getElementById("screen-active-chat");
  if (chatScroll) {
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }
}
