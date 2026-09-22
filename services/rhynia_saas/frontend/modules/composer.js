/**
 * Rhynia Intelligence SaaS — Docked Composer Module (Screen 01 & 02)
 * Exact Blueprint: Single-line continuous stadium pill (`rounded-full`)
 * Controls: (+) attachment with camera/file picker, text input, mic voice dictation, (#0078D4) near_me send button
 */

let speechRecognizer = null;
let isRecordingVoice = false;

/**
 * Toggle Attachment Popover Menu (Camera Capture & Device File Manager)
 */
function toggleAttachmentMenu(force) {
  const menu = document.getElementById("attachmentMenu");
  const icon = document.getElementById("plusIcon");
  if (!menu) return;

  const willOpen = (typeof force === "boolean") ? force : menu.classList.contains("hidden");

  if (willOpen) {
    menu.classList.remove("hidden");
    if (icon) icon.style.transform = "rotate(45deg)";
  } else {
    menu.classList.add("hidden");
    if (icon) icon.style.transform = "rotate(0deg)";
  }
}

/**
 * Handle File Selection (Device File Manager)
 */
async function handleFileSelection(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    await uploadAttachmentFile(files[i]);
  }
  event.target.value = "";
  toggleAttachmentMenu(false);
}

/**
 * Upload Single File Attachment to Backend (/api/v1/files/upload)
 */
async function uploadAttachmentFile(file) {
  if (!file) return;

  // Render temporary pending chip
  const tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);
  addAttachmentChipUI({ id: tempId, name: file.name, isUploading: true });

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/files/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AppState.token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");

    // Replace temporary chip with confirmed uploaded file
    removeAttachmentChipUI(tempId);
    AppState.pendingFiles.push({
      id: data.id || data.file_id || tempId,
      name: data.filename || file.name,
      url: data.url
    });
    addAttachmentChipUI({ id: data.id || tempId, name: file.name, isUploading: false });
    showToast(`Attached: ${file.name}`, "success");
  } catch (err) {
    removeAttachmentChipUI(tempId);
    showToast(`Failed to upload ${file.name}: ${err.message}`, "error");
  }
}

/**
 * Add Attachment Chip UI Above Composer
 */
function addAttachmentChipUI(fileObj) {
  const container = document.getElementById("input-attachment-chips");
  if (!container) return;

  container.classList.remove("hidden");
  container.classList.add("flex");

  const chip = document.createElement("div");
  chip.id = `chip-${fileObj.id}`;
  chip.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202020] border border-white/10 text-xs text-neutral-200 shadow-sm animate-fade-in";

  chip.innerHTML = `
    <span class="material-symbols-outlined text-[16px] text-primary">
      ${fileObj.isUploading ? "progress_activity" : "description"}
    </span>
    <span class="truncate max-w-[140px]">${escapeHtml(fileObj.name)}</span>
    ${!fileObj.isUploading ? `
      <button type="button" onclick="removeAttachmentFile('${fileObj.id}')" class="text-neutral-400 hover:text-white ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors">
        <span class="material-symbols-outlined text-[14px]">close</span>
      </button>
    ` : ""}
  `;

  if (fileObj.isUploading) {
    chip.querySelector(".material-symbols-outlined").classList.add("animate-spin");
  }

  container.appendChild(chip);
  updateSendButtonState();
}

/**
 * Remove Attachment Chip & Unbind from State
 */
function removeAttachmentFile(fileId) {
  AppState.pendingFiles = AppState.pendingFiles.filter(f => f.id !== fileId);
  removeAttachmentChipUI(fileId);
  updateSendButtonState();
}

function removeAttachmentChipUI(fileId) {
  const chip = document.getElementById(`chip-${fileId}`);
  if (chip) chip.remove();

  const container = document.getElementById("input-attachment-chips");
  if (container && container.children.length === 0) {
    container.classList.add("hidden");
    container.classList.remove("flex");
  }
  updateSendButtonState();
}

/**
 * Voice Dictation via Web Speech Recognition API (Mic Button)
 */
function toggleVoiceInput() {
  const micBtn = document.getElementById("micBtn");
  const micIcon = micBtn ? micBtn.querySelector(".material-symbols-outlined") : null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Voice dictation is not supported in this browser.", "error");
    return;
  }

  if (isRecordingVoice) {
    // Stop recording
    if (speechRecognizer) speechRecognizer.stop();
    isRecordingVoice = false;
    if (micBtn) {
      micBtn.classList.remove("bg-red-500/20", "text-red-400", "animate-pulse");
      micBtn.classList.add("text-neutral-400");
    }
    showToast("Voice dictation stopped", "info");
    return;
  }

  // Start recording
  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = "en-US";

  speechRecognizer.onstart = () => {
    isRecordingVoice = true;
    if (micBtn) {
      micBtn.classList.add("bg-red-500/20", "text-red-400", "animate-pulse");
      micBtn.classList.remove("text-neutral-400");
    }
    showToast("Listening... Speak now", "info");
  };

  speechRecognizer.onresult = (event) => {
    const input = document.getElementById("chat-input");
    if (!input) return;

    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    input.value = (input.value ? input.value + " " : "") + transcript;
    updateSendButtonState();
  };

  speechRecognizer.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isRecordingVoice = false;
    if (micBtn) {
      micBtn.classList.remove("bg-red-500/20", "text-red-400", "animate-pulse");
      micBtn.classList.add("text-neutral-400");
    }
    showToast(`Voice error: ${event.error}`, "error");
  };

  speechRecognizer.onend = () => {
    isRecordingVoice = false;
    if (micBtn) {
      micBtn.classList.remove("bg-red-500/20", "text-red-400", "animate-pulse");
      micBtn.classList.add("text-neutral-400");
    }
  };

  speechRecognizer.start();
}

/**
 * Trigger Native Camera Capture
 */
function triggerCameraCapture() {
  const cameraInput = document.getElementById("cameraInput");
  if (cameraInput) cameraInput.click();
  toggleAttachmentMenu(false);
}

/**
 * Trigger Native Device File Manager
 */
function triggerFileManager() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.click();
  toggleAttachmentMenu(false);
}

/**
 * Update Send Button State (Colorless when empty, Colorful when user types input)
 */
function updateSendButtonState() {
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("btn-send-message");
  if (!sendBtn) return;

  const hasText = inputEl && inputEl.value && inputEl.value.trim().length > 0;
  const hasFiles = window.AppState && window.AppState.pendingFiles && window.AppState.pendingFiles.length > 0;
  const isStreaming = window.AppState && window.AppState.isStreaming;

  if ((hasText || hasFiles) && !isStreaming) {
    sendBtn.classList.remove("btn-send-disabled");
    sendBtn.removeAttribute("disabled");
  } else {
    sendBtn.classList.add("btn-send-disabled");
    sendBtn.setAttribute("disabled", "true");
  }
}

/**
 * Handle Enter Key in Chat Input (Sends message if text is present)
 */
function handleChatInputKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const inputEl = document.getElementById("chat-input");
    const hasText = inputEl && inputEl.value && inputEl.value.trim().length > 0;
    const hasFiles = window.AppState && window.AppState.pendingFiles && window.AppState.pendingFiles.length > 0;
    const isStreaming = window.AppState && window.AppState.isStreaming;

    if ((hasText || hasFiles) && !isStreaming) {
      if (typeof sendChatMessage === "function") {
        sendChatMessage();
      }
    }
  }
}

// Attach listener to chat input once DOM is ready (guard against duplicate attachment)
document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("chat-input");
  if (inputEl) {
    if (!inputEl.getAttribute("oninput")) {
      inputEl.addEventListener("input", updateSendButtonState);
    }
    if (!inputEl.getAttribute("onkeydown")) {
      inputEl.addEventListener("keydown", handleChatInputKeyDown);
    }
  }
  updateSendButtonState();
});


