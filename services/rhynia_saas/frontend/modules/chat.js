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

  const scrollBtn = document.getElementById("btn-scroll-to-bottom");
  if (scrollBtn) {
    scrollBtn.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    scrollBtn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
  }

  const headerTitle = document.getElementById("active-thread-title");
  if (headerTitle) headerTitle.textContent = "Rhynia";

  const user = window.AppState && window.AppState.user;
  if (typeof updateEmptyStateUserName === "function") {
    updateEmptyStateUserName(user);
  }
}

let currentChatAbortController = null;

/**
 * Stop Answer Generation on User Click (1-click push to stop)
 */
function stopGeneratingAnswer() {
  if (currentChatAbortController) {
    try {
      currentChatAbortController.abort();
    } catch (_) {}
    currentChatAbortController = null;
  }
  AppState.isStreaming = false;
  updateComposerSendState(false);

  // Remove any remaining thinking indicators immediately
  document.querySelectorAll(".rhynia-thinking-wrapper").forEach(el => {
    el.style.display = "none";
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  const anchor = document.getElementById("chat-scroll-anchor");
  if (anchor) anchor.style.minHeight = "140px";

  // Reveal actions bar on any finished / stopped messages
  document.querySelectorAll(".ai-actions-bar.hidden").forEach(bar => {
    bar.classList.remove("hidden");
    bar.classList.add("flex");
  });
}
window.stopGeneratingAnswer = stopGeneratingAnswer;

/**
 * Send Chat Message & Read Server-Sent Events (SSE) Stream
 */
async function sendChatMessage() {
  // If AI is currently generating answer, 1-click push on button STOPS generation immediately!
  if (AppState.isStreaming) {
    stopGeneratingAnswer();
    return;
  }

  const inputEl = document.getElementById("chat-input");
  if (!inputEl) return;

  const content = inputEl.value.trim();
  const files = [...AppState.pendingFiles];

  if (!content && files.length === 0) {
    inputEl.focus();
    return;
  }

  const effectiveMessage = content || (files.length > 0 ? "कृपया इस संलग्न फ़ोटो/फ़ाइल का गहन विश्लेषण करें और इसके बारे में विस्तार से समझाएं। (Please analyze the attached file/image in detail)." : "");
  const displayContent = content || (files.length === 1 ? `संलग्न फ़ाइल का विश्लेषण: ${files[0].name}` : `संलग्न ${files.length} फ़ाइलों का विश्लेषण`);

  // Clear input and pending files immediately
  inputEl.value = "";
  AppState.pendingFiles = [];
  const chipsContainer = document.getElementById("input-attachment-chips");
  if (chipsContainer) {
    chipsContainer.innerHTML = "";
    chipsContainer.classList.add("hidden");
  }
  if (typeof updateSendButtonState === "function") {
    updateSendButtonState();
  }

  showActiveChatScreen();

  // Reset scroll tracking
  userHasScrolledUpDuringStream = false;

  // 1. Render User Prompt Message (Right-aligned, soft surface)
  const userMsgEl = appendUserMessageUI(displayContent, files, null, true);

  // 2. Render Rhynia Response Stream Container (Left-aligned, open layout)
  const { rhyniaMessageId, textContainer, actionsContainer, msgDiv: aiMsgEl } = appendRhyniaPlaceholderUI();

  // Scroll new question all the way to the top of screen (matching position of message 1)
  scrollNewMessageToTop(userMsgEl);

  // If user requests free AI image generation, route directly to Puter Visual Engine
  if (isImageGenerationRequest(effectiveMessage) && (!files || files.length === 0)) {
    AppState.isStreaming = true;
    updateComposerSendState(true);
    generateImageWithPuter(effectiveMessage, rhyniaMessageId, textContainer, actionsContainer);
    return;
  }

  // 3. Initiate SSE Streaming Request to POST /api/v1/chat
  AppState.isStreaming = true;
  updateComposerSendState(true);
  currentChatAbortController = new AbortController();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/chat`, {
      method: "POST",
      signal: currentChatAbortController.signal,
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: effectiveMessage,
        session_id: AppState.activeSessionId,
        stream: true,
        files: files.map(f => f.id),
        web_search: true
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

    // Read Response: Supports both JSON and SSE Stream
    const contentType = res.headers.get("content-type") || "";
    let fullResponse = "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      finishRhyniaThinkingState(rhyniaMessageId);
      fullResponse = data.reply || data.content || data.detail || "";
      textContainer.innerHTML = renderMarkdown(fullResponse);
      const msgEl = document.getElementById(rhyniaMessageId);
      if (msgEl && data.message_id) msgEl.dataset.messageId = data.message_id;
      if (msgEl && (data.rre_score !== undefined)) {
        const qcBadge = msgEl.querySelector(".rre-qc-badge");
        const qcText = msgEl.querySelector(".rre-qc-text");
        if (qcBadge && qcText) {
          qcText.textContent = `RRS v1.0 Verified (${data.rre_score}% Quality Score)`;
          qcBadge.classList.remove("hidden");
          qcBadge.classList.add("inline-flex");
        }
      }
      if (data.session_id && !AppState.activeSessionId) {
        AppState.activeSessionId = data.session_id;
        localStorage.setItem(CONFIG.SESSION_KEY, data.session_id);
        loadSessions();
      }
    } else {
      // Read SSE Stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        if (!AppState.isStreaming || (currentChatAbortController && currentChatAbortController.signal.aborted)) {
          break;
        }

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Split cleanly on official SSE double-newline boundary
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || ""; // Retain incomplete trailing chunk

        for (const event of events) {
          const trimmedEvent = event.trim();
          if (!trimmedEvent) continue;

          const lines = trimmedEvent.split(/\r?\n/);
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;

            const payload = trimmedLine.replace(/^data:\s*/, "").trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.type === "init" && parsed.session_id) {
                if (!AppState.activeSessionId) {
                  AppState.activeSessionId = parsed.session_id;
                  localStorage.setItem(CONFIG.SESSION_KEY, parsed.session_id);
                  if (typeof loadSessions === "function") {
                    loadSessions();
                  }
                }
                continue;
              }

              if (parsed.type === "done") {
                finishRhyniaThinkingState(rhyniaMessageId);
                const msgEl = document.getElementById(rhyniaMessageId);
                if (msgEl) {
                  if (parsed.message_id) {
                    msgEl.dataset.messageId = parsed.message_id;
                  }
                  const qcBadge = msgDiv ? msgDiv.querySelector(".rre-qc-badge") : msgEl.querySelector(".rre-qc-badge");
                  const qcText = msgDiv ? msgDiv.querySelector(".rre-qc-text") : msgEl.querySelector(".rre-qc-text");
                  if (qcBadge && qcText && (parsed.rre_score !== undefined)) {
                    qcText.textContent = `RRS v1.0 Verified (${parsed.rre_score}% Quality Score)`;
                    qcBadge.classList.remove("hidden");
                    qcBadge.classList.add("inline-flex");
                  }
                }
                // Only overwrite if response was empty
                if (parsed.content && !fullResponse.trim()) {
                  fullResponse = parsed.content;
                  textContainer.innerHTML = renderMarkdown(fullResponse);
                }
                continue;
              }

              const token = parsed.token || parsed.delta || (parsed.type === "token" ? parsed.content : "") || "";
              if (token) {
                finishRhyniaThinkingState(rhyniaMessageId);
                fullResponse += token;
                textContainer.innerHTML = renderMarkdown(fullResponse);
                scrollChatToBottom(false);
              }
            } catch (e) {
              // Critical Safety: Never dump raw JSON packets or metadata into chat markdown!
              if (payload.startsWith("{") || payload.startsWith("[") || payload.includes('"type"')) {
                console.warn("Skipping partial or malformed SSE JSON payload");
              } else {
                finishRhyniaThinkingState(rhyniaMessageId);
                fullResponse += payload;
                textContainer.innerHTML = renderMarkdown(fullResponse);
                scrollChatToBottom(false);
              }
            }
          }
        }
      }
    }

    finishRhyniaThinkingState(rhyniaMessageId);

    if (!fullResponse.trim()) {
      fullResponse = "नमस्ते! आपका संदेश प्राप्त हो गया है। कृपया कोई भी प्रश्न पूछें, मैं उत्तर देने के लिए तैयार हूँ।";
      textContainer.innerHTML = renderMarkdown(fullResponse);
    }

    // Finished streaming: reveal Response Action Bar (5 icons)
    actionsContainer.classList.remove("hidden");
    actionsContainer.classList.add("flex");

    // Render Mermaid SmartArt diagrams if present
    if (typeof renderAllMermaidDiagrams === "function") {
      renderAllMermaidDiagrams(textContainer);
    }

    // Render Microsoft Office Visual Charts if present
    if (typeof renderAllRhyniaCharts === "function") {
      renderAllRhyniaCharts(textContainer);
    }

    // Refresh storage telemetry
    loadStorage();

  } catch (err) {
    if (err.name === "AbortError") {
      // User clicked stop! Cleanly finalize the response so far
      console.log("Chat streaming stopped by user");
      finishRhyniaThinkingState(rhyniaMessageId);
      if (fullResponse) {
        textContainer.innerHTML = renderMarkdown(fullResponse);
      }
      actionsContainer.classList.remove("hidden");
      actionsContainer.classList.add("flex");
    } else {
      console.error("Chat error:", err);
      finishRhyniaThinkingState(rhyniaMessageId);
      textContainer.innerHTML = `<span class="text-red-400 text-sm">Error: ${escapeHtml(err.message)}</span>`;
      showToast(err.message, "error");
    }
  } finally {
    AppState.isStreaming = false;
    currentChatAbortController = null;
    updateComposerSendState(false);
    const anchor = document.getElementById("chat-scroll-anchor");
    if (anchor) anchor.style.minHeight = "140px";
    if (typeof updateSendButtonState === "function") {
      updateSendButtonState();
    }
  }
}

/**
 * Format message timestamp into ChatGPT style ("Today, 11:30 am" / "Yesterday, 2:45 pm" / "Oct 6, 1:05 pm")
 */
function formatUserMsgDateHeader(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return "Today, " + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    const month = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${month}, ${timeStr}`;
  }
}

/**
 * State for User Message Context Menu
 */
let activeUserMsgContextText = "";
let activeUserMsgContextElement = null;
let userTouchStartX = 0;
let userTouchStartY = 0;
let userLongPressTimer = null;
let isUserLongPressActive = false;
let suppressUserBubbleClickUntil = 0;

/**
 * Open User Message Floating Context Menu (Anchored to Bubble)
 */
function openUserBubbleContextMenuAtElement(bubbleEl, text, timeStr) {
  const menu = document.getElementById("user-msg-context-menu");
  const backdrop = document.getElementById("user-msg-context-backdrop");
  const timeEl = document.getElementById("user-msg-ctx-time");
  if (!menu || !backdrop || !bubbleEl) return;

  activeUserMsgContextText = text || bubbleEl.dataset.userText || bubbleEl.textContent.trim();
  activeUserMsgContextElement = bubbleEl;

  if (timeEl) {
    timeEl.textContent = timeStr || bubbleEl.dataset.msgTime || formatUserMsgDateHeader();
  }

  const rect = bubbleEl.getBoundingClientRect();
  const menuWidth = Math.min(380, window.innerWidth - 20);
  const menuHeight = 400;

  // Horizontal position: align to right edge of user bubble, keep in viewport
  let left = rect.right - menuWidth;
  if (left < 16) left = 16;
  if (left + menuWidth > window.innerWidth - 16) {
    left = window.innerWidth - menuWidth - 16;
  }

  // Vertical position: below user bubble if space, else above
  let top = rect.bottom + 8;
  if (top + menuHeight > window.innerHeight - 16) {
    top = rect.top - menuHeight - 8;
  }
  if (top < 16) top = 16;

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}

/**
 * Close User Message Context Menu
 */
function closeUserMsgContextMenu() {
  const menu = document.getElementById("user-msg-context-menu");
  const backdrop = document.getElementById("user-msg-context-backdrop");
  if (menu) menu.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
}

/**
 * Long-Press & Right-Click Event Handlers for User Message Bubbles
 */
function onUserBubbleTouchStart(e, bubbleEl) {
  if (e.touches && e.touches.length > 0) {
    userTouchStartX = e.touches[0].clientX;
    userTouchStartY = e.touches[0].clientY;
  }
  isUserLongPressActive = false;
  if (userLongPressTimer) clearTimeout(userLongPressTimer);

  const text = bubbleEl.dataset.userText || bubbleEl.textContent.trim();
  const timeStr = bubbleEl.dataset.msgTime || formatUserMsgDateHeader();

  userLongPressTimer = setTimeout(() => {
    isUserLongPressActive = true;
    suppressUserBubbleClickUntil = Date.now() + 650;
    openUserBubbleContextMenuAtElement(bubbleEl, text, timeStr);
  }, 380);
}

function onUserBubbleTouchMove(e) {
  if (e.touches && e.touches.length > 0) {
    const dx = Math.abs(e.touches[0].clientX - userTouchStartX);
    const dy = Math.abs(e.touches[0].clientY - userTouchStartY);
    if (dx > 10 || dy > 10) {
      if (userLongPressTimer) {
        clearTimeout(userLongPressTimer);
        userLongPressTimer = null;
      }
    }
  }
}

function onUserBubbleTouchEnd(e) {
  if (userLongPressTimer) {
    clearTimeout(userLongPressTimer);
    userLongPressTimer = null;
  }
}

function openUserBubbleContextMenu(e, bubbleEl) {
  e.preventDefault();
  const text = bubbleEl.dataset.userText || bubbleEl.textContent.trim();
  const timeStr = bubbleEl.dataset.msgTime || formatUserMsgDateHeader();
  openUserBubbleContextMenuAtElement(bubbleEl, text, timeStr);
}

/**
 * Dedicated Full Screen "Select Text" View (ChatGPT Experience)
 */
function openSelectTextScreen(text) {
  if (typeof closeUserMsgContextMenu === "function") {
    closeUserMsgContextMenu();
  }
  const screen = document.getElementById("screen-select-text");
  const contentEl = document.getElementById("select-text-content");
  if (!screen || !contentEl) return;

  contentEl.textContent = text || activeUserMsgContextText || "";
  screen.classList.remove("hidden");
  screen.style.display = "flex";
}
window.openSelectTextScreen = openSelectTextScreen;

function closeSelectTextScreen(event) {
  if (event) {
    try {
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
    } catch (_) {}
  }
  const screen = document.getElementById("screen-select-text");
  if (screen) {
    screen.classList.add("hidden");
    screen.style.display = "none";
  }
  // Clear any existing text selection range
  try {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  } catch (_) {}
  if (typeof showActiveChatScreen === "function") {
    showActiveChatScreen();
  }
}
window.closeSelectTextScreen = closeSelectTextScreen;

async function copyAllSelectedText() {
  const contentEl = document.getElementById("select-text-content");
  const text = contentEl ? contentEl.textContent : activeUserMsgContextText;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copied to clipboard", "success");
  }
}

function selectAllTextInScreen() {
  const contentEl = document.getElementById("select-text-content");
  if (!contentEl) return;
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(contentEl);
    selection.removeAllRanges();
    selection.addRange(range);
    showToast("All text selected", "info");
  } catch (err) {
    console.warn("Select all error:", err);
  }
}

/**
 * Execute User Message Action (Copy, Select text, Edit message, Share prompt)
 */
async function executeUserMsgAction(action) {
  const text = activeUserMsgContextText;
  const bubbleEl = activeUserMsgContextElement;
  closeUserMsgContextMenu();
  if (!text) return;

  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Prompt copied to clipboard", "success");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Prompt copied to clipboard", "success");
    }
  } else if (action === "select_text") {
    openSelectTextScreen(text);
  } else if (action === "edit") {
    const inputEl = document.getElementById("chat-input");
    if (inputEl) {
      inputEl.value = text;
      inputEl.focus();
      if (typeof autoResizeComposer === "function") {
        autoResizeComposer(inputEl);
      }
      if (typeof updateSendButtonState === "function") {
        updateSendButtonState();
      }
      inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Message loaded into input for editing", "info");
    }
  } else if (action === "share") {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rhynia AI Prompt",
          text: text
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          navigator.clipboard.writeText(text);
          showToast("Prompt copied for sharing", "success");
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      showToast("Prompt copied for sharing", "success");
    }
  }
}

/**
 * Append User Message UI Bubble (Right-aligned, soft surface)
 */
function appendUserMessageUI(text, files, createdDate, shouldScroll = false) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const timeStr = formatUserMsgDateHeader(createdDate);

  const msgDiv = document.createElement("div");
  msgDiv.className = "flex flex-col items-end w-full pl-8 sm:pl-16 py-3 animate-fade-in";

  let filesHtml = "";
  if (files && files.length > 0) {
    filesHtml = `<div class="flex flex-wrap gap-4 mb-4 justify-end w-full">` +
      files.map(f => {
        const isImg = (f.type && f.type.startsWith("image/")) || (f.name && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        const displayUrl = f.previewUrl || f.url;
        if (isImg && displayUrl) {
          return `
            <div class="rounded-3xl overflow-hidden border-2 border-white/25 bg-[#121214] shadow-2xl group relative cursor-pointer flex-shrink-0 transition-all hover:border-white/50 active:scale-[0.99] w-full max-w-[380px] sm:max-w-[540px] max-h-[500px] sm:max-h-[640px]" onclick="window.openRhyniaLightbox('${displayUrl}', '${escapeHtml(f.name)}')">
              <img src="${displayUrl}" alt="${escapeHtml(f.name)}" class="w-full h-auto max-h-[500px] sm:max-h-[640px] object-cover rounded-3xl block" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div class="px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md text-white flex items-center gap-2.5 shadow-2xl border border-white/30 text-base font-bold">
                  <span class="material-symbols-outlined text-[26px]">zoom_in</span>
                  <span class="tracking-wide">View Full Photo</span>
                </div>
              </div>
            </div>
          `;
        }
        const docInfo = (typeof getDocTypeInfo === "function") ? getDocTypeInfo(f.type, f.name) : { icon: "description", color: "text-[#0078d4] bg-white/5 border-white/10" };
        return `
          <div class="inline-flex items-center gap-4 sm:gap-5 p-5 sm:p-6 pr-6 rounded-3xl bg-[#1c1c24] hover:bg-[#252530] border-2 border-white/25 text-white shadow-2xl flex-shrink-0 transition-all w-full max-w-[360px] sm:max-w-[460px]">
            <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center border ${docInfo.color} shrink-0">
              <span class="material-symbols-outlined text-[36px] sm:text-[40px]">${docInfo.icon}</span>
            </div>
            <div class="flex flex-col min-w-0 pr-1 text-left flex-1">
              <span class="truncate max-w-[220px] sm:max-w-[300px] font-black text-white text-xl sm:text-2xl">${escapeHtml(f.name)}</span>
              <span class="text-sm sm:text-base text-neutral-300 font-mono mt-1">${f.sizeFormatted || "Document"}</span>
            </div>
          </div>
        `;
      }).join("") +
      `</div>`;
  }

  msgDiv.className = "flex flex-col items-end gap-1.5 w-full pl-6 sm:pl-24 py-2 animate-fade-in";
  msgDiv.innerHTML = `
    ${filesHtml}
    <div class="user-bubble inline-block bg-[#262626] text-white px-7 py-4 rounded-2xl rounded-br-sm text-[26px] sm:text-[26px] font-normal text-left leading-[1.65] max-w-[90%] sm:max-w-2xl border border-white/[0.06] shadow-sm select-text cursor-pointer active:scale-[0.99] transition-transform"
         ontouchstart="onUserBubbleTouchStart(event, this)"
         ontouchmove="onUserBubbleTouchMove(event)"
         ontouchend="onUserBubbleTouchEnd(event)"
         oncontextmenu="openUserBubbleContextMenu(event, this)"
         data-user-text="${escapeHtml(text)}"
         data-msg-time="${escapeHtml(timeStr)}"
         title="Long press for options">
      ${escapeHtml(text)}
    </div>
  `;

  container.appendChild(msgDiv);
  if (shouldScroll) {
    scrollNewMessageToTop(msgDiv);
  }
  return msgDiv;
}

/**
 * Finish Rhynia Thinking State (Auto-hides thinking card immediately when answer arrives)
 */
function finishRhyniaThinkingState(msgId) {
  const container = document.getElementById(msgId + "-thinking");
  if (container) {
    container.style.display = "none";
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
  const msgEl = document.getElementById(msgId);
  if (msgEl) {
    const wrappers = msgEl.querySelectorAll(".rhynia-thinking-wrapper");
    wrappers.forEach(w => {
      w.style.display = "none";
      if (w.parentNode) w.parentNode.removeChild(w);
    });
  }
}

/**
 * Append Rhynia Placeholder UI (Left-aligned, open layout with 5 action buttons)
 */
function appendRhyniaPlaceholderUI(existingMessageId) {
  const container = document.getElementById("chat-messages-container");
  const msgId = "ai-msg-" + (existingMessageId || Date.now());

  const msgDiv = document.createElement("div");
  msgDiv.id = msgId;
  if (existingMessageId) {
    msgDiv.dataset.messageId = existingMessageId;
  }
  msgDiv.className = "flex flex-col gap-3.5 w-full px-3 sm:px-6 py-5 animate-fade-in border-b border-white/[0.04]";

  const thinkingHtml = existingMessageId ? "" : `
    <!-- Rhynia Live Thinking Indicator (Head with Running Cycle Light + 3 Pulsing Dots Underneath - Enhanced Size) -->
    <div class="rhynia-thinking-wrapper my-3 flex flex-col items-center self-start select-none transition-all duration-200 pl-1" id="${msgId}-thinking">
      <!-- Head + Running 360 Cycle Light (Enlarged for clear visibility) -->
      <div class="relative w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] flex items-center justify-center shrink-0">
        <!-- Running Cycle Light Ring -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none rhynia-orbit-cycle" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="orbitLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
              <stop offset="60%" stop-color="#818cf8" stop-opacity="0.6" />
              <stop offset="90%" stop-color="#38bdf8" stop-opacity="1" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
            </linearGradient>
            <filter id="orbStarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <!-- Faint orbit track -->
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(56, 189, 248, 0.28)" stroke-width="1.3" stroke-dasharray="2.5 2.5" />
          <!-- Running Light Beam Trail -->
          <circle cx="30" cy="30" r="26" fill="none" stroke="url(#orbitLightGrad)" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="60 110" />
          <!-- Running Star Orb -->
          <circle cx="56" cy="30" r="3.8" fill="#ffffff" filter="url(#orbStarGlow)" />
          <circle cx="56" cy="30" r="2" fill="#ffffff" />
        </svg>

        <!-- Cyber Head with Neural Network -->
        <img src="assets/rhynia-head.svg" alt="Rhynia AI" class="w-[50px] h-[50px] sm:w-[58px] sm:h-[58px] object-contain relative z-10 pointer-events-none drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]" />
      </div>

      <!-- Niche Pulsing 3 Dots -->
      <div class="flex items-center justify-center gap-2 pt-2">
        <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 rhynia-wave-dot-1"></span>
        <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 rhynia-wave-dot-2"></span>
        <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 rhynia-wave-dot-3"></span>
      </div>
    </div>
  `;

  msgDiv.innerHTML = `
    ${thinkingHtml}

    <!-- Response Markdown Content -->
    <div class="ai-text-body markdown-body space-y-4 text-[#e2e8f0] text-[26px] sm:text-[26px] leading-[1.82]">
    </div>

    <!-- RRE Quality Control Score Badge (RRS v1.0) -->
    <div class="rre-qc-badge hidden items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit mt-1">
      <span class="material-symbols-outlined text-sm">verified_user</span>
      <span class="rre-qc-text">RRS v1.0 Quality Verified (100%)</span>
    </div>

    <!-- Response Action Bar (5 Icons: Copy, Speaker, Good, Bad, Share) -->
    <div class="ai-actions-bar hidden items-center gap-5 sm:gap-5 pt-4 text-neutral-400">
      <button onclick="copyResponseText(this)" aria-label="Copy response" title="Copy response" class="w-[58px] h-[58px] min-w-[58px] min-h-[58px] rounded-2xl inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[32px]">content_copy</span>
      </button>
      <button onclick="speakResponseText(this)" aria-label="Read aloud" title="Read aloud" class="w-[58px] h-[58px] min-w-[58px] min-h-[58px] rounded-2xl inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[32px]">volume_up</span>
      </button>
      <button onclick="feedbackResponse(this, true)" aria-label="Good response" title="Good response" class="w-[58px] h-[58px] min-w-[58px] min-h-[58px] rounded-2xl inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[32px]">thumb_up</span>
      </button>
      <button onclick="feedbackResponse(this, false)" aria-label="Poor response" title="Poor response" class="w-[58px] h-[58px] min-w-[58px] min-h-[58px] rounded-2xl inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[32px]">thumb_down</span>
      </button>
      <button onclick="shareResponseSnippet(this)" aria-label="Share snippet" title="Share snippet" class="w-[58px] h-[58px] min-w-[58px] min-h-[58px] rounded-2xl inline-flex items-center justify-center hover:text-white hover:bg-white/10 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[32px]">share</span>
      </button>
    </div>
  `;

  container.appendChild(msgDiv);
  triggerAutoScrollToBottom(true);

  return {
    rhyniaMessageId: msgId,
    assistantMessageId: msgId,
    msgDiv: msgDiv,
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
 * 5 Actions: Like / Dislike Feedback (Triggers Interactive Modal)
 */
function feedbackResponse(buttonEl, isPositive) {
  if (typeof openFeedbackModal === "function") {
    openFeedbackModal(buttonEl, isPositive);
  } else {
    buttonEl.classList.add(isPositive ? "text-[#0078d4]" : "text-red-400");
    buttonEl.classList.add("bg-white/10");
  }
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
  const activeSession = AppState.sessions ? AppState.sessions.find(s => s.id === AppState.activeSessionId) : null;
  const title = activeSession?.title || "Conversation";
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
    // Option 3: Pulsing Rhynia Sparkle Star (Brand Glow style - Large & Prominent)
    sendBtn.innerHTML = `
      <div class="relative flex items-center justify-center w-full h-full select-none cursor-pointer" title="उत्तर रोकें (Click to stop)">
        <span class="absolute w-12 h-12 md:w-8 md:h-8 rounded-full bg-cyan-300/45 blur-[4px] animate-pulse pointer-events-none"></span>
        <svg class="w-11 h-11 md:w-7 md:h-7 text-white drop-shadow-[0_0_14px_rgba(56,189,248,1)] animate-pulse pointer-events-none transition-transform active:scale-90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z" />
        </svg>
      </div>
    `;
    sendBtn.classList.remove("btn-send-disabled");
    sendBtn.removeAttribute("disabled");
  } else {
    sendBtn.innerHTML = `<span class="material-symbols-outlined text-[38px] md:text-[24px] transform -rotate-45 ml-0.5">near_me</span>`;
    if (typeof updateSendButtonState === "function") {
      updateSendButtonState();
    }
  }
}

let userHasScrolledUpDuringStream = false;

/**
 * Toggle Visibility of Floating Down-Arrow Button (ChatGPT & Gemini Style)
 */
function updateScrollToBottomButtonVisibility() {
  const btn = document.getElementById("btn-scroll-to-bottom");
  if (!btn) return;

  const activeChat = document.getElementById("screen-active-chat");
  const container = document.getElementById("chat-messages-container");
  if (!activeChat || activeChat.classList.contains("hidden") || !container || container.children.length === 0) {
    btn.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    btn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
    return;
  }

  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
  const winScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const winHeight = window.innerHeight || document.documentElement.clientHeight;
  const distFromBottom = docHeight - (winScrollY + winHeight);

  // If user has scrolled up away from bottom (> 130px), reveal the down-arrow button!
  if (distFromBottom > 130) {
    btn.classList.remove("opacity-0", "translate-y-3", "pointer-events-none");
    btn.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
  } else {
    btn.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    btn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
  }
}

/**
 * Handle Click on Down-Arrow Button: Smoothly scrolls to bottom and hides button
 */
function onScrollToBottomClick() {
  userHasScrolledUpDuringStream = false;
  const btn = document.getElementById("btn-scroll-to-bottom");
  if (btn) {
    btn.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    btn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
  }
  scrollChatToBottom(true);
}
window.onScrollToBottomClick = onScrollToBottomClick;
window.updateScrollToBottomButtonVisibility = updateScrollToBottomButtonVisibility;

/**
 * Initialize scroll tracking listeners:
 * Detects if user manually scrolled up or down and updates arrow button visibility.
 */
function initChatScrollTracking() {
  const handleScroll = () => {
    updateScrollToBottomButtonVisibility();

    if (AppState.isStreaming) {
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const winScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const distFromBottom = docHeight - (winScrollY + winHeight);

      if (distFromBottom > 160) {
        userHasScrolledUpDuringStream = true;
      } else if (distFromBottom < 60) {
        userHasScrolledUpDuringStream = false;
      }
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  const chatScroll = document.getElementById("screen-active-chat");
  if (chatScroll) {
    chatScroll.addEventListener("scroll", handleScroll, { passive: true });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChatScrollTracking);
  } else {
    initChatScrollTracking();
  }
}

/**
 * ChatGPT-Grade Auto-Scroll to Bottom:
 * - Automatically scrolls window, html, body, and internal container simultaneously.
 * - Ensures newly sent message and thinking indicator slide up into clear view.
 * - Smoothly scrolls older messages upwards out of the way.
 */
function scrollChatToBottom(force = false) {
  if (userHasScrolledUpDuringStream && !force) {
    return;
  }

  // 1. Scroll internal container if it has overflow
  const chatScroll = document.getElementById("screen-active-chat");
  if (chatScroll && chatScroll.scrollHeight > chatScroll.clientHeight) {
    try {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    } catch (_) {}
  }

  // 2. Compute maximum document height
  const targetY = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );

  // 3. Scroll window & document body to the bottom
  try {
    window.scrollTo({
      top: targetY + 300,
      behavior: force ? "smooth" : "auto"
    });
  } catch (_) {
    window.scrollTo(0, targetY + 300);
  }

  if (document.documentElement) {
    document.documentElement.scrollTop = targetY + 300;
  }
  if (document.body) {
    document.body.scrollTop = targetY + 300;
  }

  // 4. Scroll anchor into view as secondary guarantee
  const anchor = document.getElementById("chat-scroll-anchor");
  if (anchor) {
    try {
      anchor.scrollIntoView({
        behavior: force ? "smooth" : "auto",
        block: "end",
        inline: "nearest"
      });
    } catch (_) {}
  }

  const scrollBtn = document.getElementById("btn-scroll-to-bottom");
  if (scrollBtn) {
    scrollBtn.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    scrollBtn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
  }
}

/**
 * Trigger robust multi-phase auto-scroll on new message entry or state change.
 * Fires immediately, on next animation frame (post-reflow), and after micro-delays.
 */
function triggerAutoScrollToBottom(force = true) {
  userHasScrolledUpDuringStream = false;
  scrollChatToBottom(force);

  requestAnimationFrame(() => {
    scrollChatToBottom(force);
    requestAnimationFrame(() => {
      scrollChatToBottom(force);
    });
  });

  setTimeout(() => scrollChatToBottom(force), 40);
  setTimeout(() => scrollChatToBottom(force), 120);
  setTimeout(() => scrollChatToBottom(force), 260);
}

/**
 * Scroll New Message to Top (ChatGPT Clean Top Position):
 * Scrolls the newly submitted question all the way up to ~116px from the top of the screen
 * (the exact position where the 1st message is displayed on a clean screen).
 * Older messages slide cleanly up out of the viewport.
 */
function scrollNewMessageToTop(userMsgEl) {
  if (!userMsgEl) return;

  const headerOffset = 116; // Exact spacing below floating header where message 1 sits

  const executeScroll = () => {
    // 1. Give ample runway below so browser can scroll all the way to the top
    const anchor = document.getElementById("chat-scroll-anchor");
    if (anchor) {
      anchor.style.minHeight = "calc(100vh - 180px)";
    }

    // 2. Measure user message position relative to document
    const rect = userMsgEl.getBoundingClientRect();
    const currentWinY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const targetY = Math.max(0, currentWinY + rect.top - headerOffset);

    try {
      window.scrollTo({
        top: targetY,
        behavior: "smooth"
      });
    } catch (_) {
      window.scrollTo(0, targetY);
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = targetY;
    }
    if (document.body) {
      document.body.scrollTop = targetY;
    }

    // 3. Scroll internal container if screen-active-chat has active scrollbar
    const chatScroll = document.getElementById("screen-active-chat");
    if (chatScroll && chatScroll.scrollHeight > chatScroll.clientHeight) {
      try {
        const cRect = chatScroll.getBoundingClientRect();
        const relTop = rect.top - cRect.top + chatScroll.scrollTop;
        chatScroll.scrollTo({
          top: Math.max(0, relTop - 20),
          behavior: "smooth"
        });
      } catch (_) {}
    }

    // 4. scrollIntoView with scrollMarginTop guarantee
    userMsgEl.style.scrollMarginTop = `${headerOffset}px`;
    try {
      userMsgEl.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (_) {}
  };

  userHasScrolledUpDuringStream = false;
  executeScroll();

  requestAnimationFrame(() => {
    executeScroll();
    requestAnimationFrame(() => {
      executeScroll();
    });
  });

  setTimeout(executeScroll, 40);
  setTimeout(executeScroll, 120);
  setTimeout(executeScroll, 260);
}

/**
 * Detect if user query is requesting AI image generation (Multilingual: Hindi, Hinglish, English)
 */
function isImageGenerationRequest(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();

  // 1. Core visual words (including Hinglish transliterations and typos)
  const hasVisualWord = /\b(?:image|images|photo|photos|picture|pictures|pic|pics|wallpaper|portrait|illustration|drawing|painting|chitra|tasveer|tasvir|तस्वीर|फोटो|चित्र|पेंटिंग|चित्रण|लोगो|बैनर)\b/i.test(clean);

  // 2. Core intent / creation words (including typos: creat, genrate, bnao)
  const hasIntentWord = /\b(?:create|creat|make|generate|genrate|draw|paint|render|design|banao|bana|bnao|karo|do|dikhao|chahiye|dikhaye|बनाओ|बनाएं|जनरेट|तैयार|दिखाओ|बनाकर)\b/i.test(clean);

  // Both visual word and intent word -> TRUE (Catches "ek image creat karo jisme...", "sher ki photo banao", etc.)
  if (hasVisualWord && hasIntentWord) return true;

  // Direct prefixes
  if (/^(?:an?\s+)?(?:photo|image|picture|pic|illustration|painting|drawing|wallpaper)\s+(?:of|showing|depicting)/i.test(clean)) return true;
  if (/^(?:draw|paint)\s+(?:an?\s+)?/i.test(clean)) return true;

  // Phrases like 'ek image...', 'ki photo...', 'ka photo...'
  if (/\b(?:ek|1|एक)\s+(?:image|photo|picture|pic|chitra|tasveer|तस्वीर|फोटो|चित्र)\b/i.test(clean)) return true;
  if (/(?:की|का|ke|ki|ka)\s*(?:तस्वीर|फोटो|चित्र|image|photo|picture|pic|wallpaper|chitra|tasveer)/i.test(clean)) return true;

  // Ends with photo/image (e.g. 'lion photo', 'car image')
  if (/(?:image|photo|picture|pic|wallpaper)$/i.test(clean)) return true;

  return false;
}

/**
 * Clean and isolate the descriptive image prompt and enrich it for diffusion models
 */
function extractImagePrompt(rawText) {
  let prompt = (rawText || "").trim();

  // Strip creation command phrases from start and end
  prompt = prompt.replace(/^(?:generate|genrate|create|creat|make|draw|paint|render|design)\s+(?:an?\s+)?(?:image|photo|picture|pic|illustration|artwork)?\s*(?:of|showing|depicting)?\s*/i, "");
  prompt = prompt.replace(/^(?:ek|1|एक)?\s*(?:image|photo|picture|pic|chitra|tasveer|तस्वीर|फोटो|चित्र)?\s*(?:creat|create|banao|bnao|generate|genrate)?\s*(?:karo|do|kro)?\s*(?:jisme|jis me|in which|showing|ki|ka|ke)?\s*/i, "");
  prompt = prompt.replace(/(?:ki|ka|ke)\s*(?:photo|image|picture|pic|तस्वीर|फोटो|चित्र)?\s*(?:banao|bnao|karo|creat|create|generate)?\s*$/i, "");
  prompt = prompt.replace(/(?:की\s*|का\s*)?(?:तस्वीर|फोटो|चित्र|पेंटिंग|चित्रण|लोगो|इमेज)\s*(?:बनाओ|बनाएं|जनरेट करो|तैयार करो|बनाकर दो|दिखाओ)?\s*$/i, "");
  prompt = prompt.replace(/^(?:a|an|the|ek|एक)\s+/i, "");

  const cleanSubject = prompt.trim() || rawText;

  // Dictionary for translating/enriching Hindi & Hinglish visual keywords
  const dict = {
    'रोबोट': 'humanoid cyber robot',
    'शेर': 'majestic royal lion',
    'बाघ': 'royal bengal tiger',
    'कार': 'luxury sports car',
    'गाड़ी': 'modern aerodynamic supercar',
    'घर': 'beautiful modern luxury house',
    'बिल्ली': 'cute fluffy cat',
    'कुत्ता': 'playful cute dog',
    'सूरज': 'golden sunset',
    'सूर्यास्त': 'dramatic golden hour sunset',
    'मंदिर': 'ancient sacred stone temple',
    'चांद': 'glowing full moon night sky',
    'फूल': 'colorful vibrant blooming flowers',
    'लड़की': 'portrait of a beautiful young woman',
    'लड़का': 'portrait of a handsome young man',
    'ताजमहल': 'majestic Taj Mahal monument',
    'घोड़ा': 'majestic running horse',
    'शहर': 'futuristic neon city skyline',
    'जंगल': 'lush misty tropical rainforest'
  };

  let enriched = cleanSubject;
  for (const [hi, en] of Object.entries(dict)) {
    if (enriched.includes(hi)) {
      enriched = enriched.replace(new RegExp(hi, 'g'), en);
    }
  }

  // Common Hinglish terms & action phrases
  const hinglishDict = {
    'sher': 'majestic royal lion',
    'bagh': 'royal bengal tiger',
    'billi': 'cute fluffy kitten',
    'kutta': 'playful cute puppy',
    'gadi': 'luxury modern supercar',
    'ghar': 'modern architecture house',
    'mandir': 'ancient sacred temple',
    'phool': 'colorful blooming flowers',
    'sky me flying kar rah hoo': 'majestic lion flying high in dramatic cloud sky with grand fantasy wings, golden sunset background, fantasy digital art',
    'sky me flying': 'flying high in dramatic clouds sky with majestic fantasy wings, fantasy art',
    'flying in sky': 'flying high in dramatic clouds sky with majestic wings, fantasy art',
    'udta hua': 'flying with majestic wings'
  };
  for (const [hi, en] of Object.entries(hinglishDict)) {
    const r = new RegExp('\\b' + hi + '\\b', 'gi');
    enriched = enriched.replace(r, en);
  }

  return {
    display: cleanSubject,
    enriched: enriched.trim() || cleanSubject
  };
}

/**
 * 1-Click Client-side direct Image Downloader
 */
async function downloadRhyniaImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || (`rhynia_ai_${Date.now()}.jpg`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (e) {
    window.open(url, '_blank');
  }
}

/**
 * Bulletproof Multi-Engine Visual Generator (FLUX.1 + Puter AI)
 */
async function generateImageWithPuter(userPrompt, rhyniaMessageId, textContainer, actionsContainer) {
  const { display, enriched } = extractImagePrompt(userPrompt);
  const seed = Math.floor(Math.random() * 9000000) + 1000000;
  
  // Show elegant loading shimmer card
  textContainer.innerHTML = `
    <div class="flex flex-col gap-3 py-2 animate-pulse">
      <div class="flex items-center gap-2.5 text-sm text-[#4cc2ff] font-medium">
        <span class="material-symbols-outlined text-[20px] animate-spin">auto_awesome</span>
        <span>Rhynia Visual Engine तस्वीर तैयार कर रहा है...</span>
      </div>
      <div class="w-full max-w-md h-64 sm:h-72 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center p-4 text-center">
        <span class="material-symbols-outlined text-4xl text-[#4cc2ff] mb-2 animate-bounce">palette</span>
        <p class="text-xs text-neutral-300 font-mono tracking-wide px-4">"${escapeHtml(display.slice(0, 80))}"</p>
        <span class="text-[11px] text-neutral-500 mt-2 font-mono">Model: FLUX.1 Neural Engine</span>
      </div>
    </div>
  `;
  scrollChatToBottom();

  const renderSuccess = (imgSrc) => {
    textContainer.innerHTML = `
      <div class="flex flex-col gap-3.5 py-1 animate-fade-in max-w-xl">
        <p class="text-sm text-neutral-200 leading-relaxed">
          मैंने आपके अनुरोध पर <strong>"${escapeHtml(display)}"</strong> के लिए यह तस्वीर जनरेट कर दी है:
        </p>
        <div class="relative group rounded-2xl overflow-hidden border border-white/15 bg-[#141414] shadow-2xl transition-all">
          <img src="${imgSrc}" alt="${escapeHtml(display)}" class="w-full h-auto max-h-[520px] object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]" onclick="window.openRhyniaLightbox('${imgSrc}', '${escapeHtml(display)}')"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 pointer-events-none">
            <span class="text-xs text-white/90 font-mono truncate mr-2 drop-shadow">Rhynia Visual Engine</span>
            <div class="flex items-center gap-2 pointer-events-auto">
              <button type="button" onclick="window.downloadRhyniaImage('${imgSrc}', 'rhynia_${seed}.jpg')" class="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95" title="Download Image">
                <span class="material-symbols-outlined text-[16px]">download</span>
                <span>Download</span>
              </button>
              <button type="button" onclick="window.openRhyniaLightbox('${imgSrc}', '${escapeHtml(display)}')" class="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white shadow-md transition-all active:scale-95" title="Full screen">
                <span class="material-symbols-outlined text-[16px]">fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    actionsContainer.classList.remove("hidden");
    actionsContainer.classList.add("flex");
    scrollChatToBottom();
    AppState.isStreaming = false;
    updateComposerSendState(false);
    if (typeof updateSendButtonState === "function") updateSendButtonState();
  };

  try {
    // 1. Check if Puter AI is available
    if (typeof puter !== "undefined" && puter.ai && typeof puter.ai.txt2img === "function") {
      try {
        const imgElement = await Promise.race([
          puter.ai.txt2img(enriched),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Puter timeout")), 8000))
        ]);
        const pSrc = imgElement.src || (imgElement instanceof HTMLImageElement ? imgElement.src : null);
        if (pSrc) {
          renderSuccess(pSrc);
          return;
        }
      } catch (pErr) {
        console.warn("Puter visual call skipped, trying primary neural visual engine:", pErr.message);
      }
    }

    // 2. High-speed Direct Neural Visual Generation (clean free parameters without 402 custom dimension penalty)
    const promptWithQuality = `${enriched}, cinematic lighting, photorealistic, 8k resolution, highly detailed`;
    const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptWithQuality)}?nologo=true`;
    const fallbackModelUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enriched)}?model=sana&nologo=true`;

    let isRendered = false;
    const safeRender = (url) => {
      if (isRendered) return;
      isRendered = true;
      renderSuccess(url);
    };

    const preloader = new Image();
    preloader.onload = () => {
      safeRender(directUrl);
    };
    preloader.onerror = () => {
      // Secondary fallback model (SANA)
      const fallbackLoader = new Image();
      fallbackLoader.onload = () => {
        safeRender(fallbackModelUrl);
      };
      fallbackLoader.onerror = () => {
        safeRender(directUrl);
      };
      fallbackLoader.src = fallbackModelUrl;
    };

    // Safety timeout: render card after 7.5 seconds so user never hangs indefinitely
    setTimeout(() => {
      safeRender(directUrl);
    }, 7500);

    preloader.src = directUrl;

  } catch (err) {
    console.error("Rhynia image generation error:", err);
    textContainer.innerHTML = `
      <div class="p-4 rounded-xl bg-[#2b1619] border border-[#6e2229] text-red-200 text-sm space-y-1">
        <div class="font-bold flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">error</span>
          <span>Image Generation Encountered an Issue</span>
        </div>
        <p class="text-xs text-red-300">${escapeHtml(err.message || "Failed to render visual. Please try again.")}</p>
      </div>
    `;
    AppState.isStreaming = false;
    updateComposerSendState(false);
    if (typeof updateSendButtonState === "function") updateSendButtonState();
  }
}

window.sendChatMessage = sendChatMessage;
window.scrollChatToBottom = scrollChatToBottom;
window.triggerAutoScrollToBottom = triggerAutoScrollToBottom;
window.scrollNewMessageToTop = scrollNewMessageToTop;
window.isImageGenerationRequest = isImageGenerationRequest;
window.extractImagePrompt = extractImagePrompt;
window.generateImageWithPuter = generateImageWithPuter;
window.downloadRhyniaImage = downloadRhyniaImage;
