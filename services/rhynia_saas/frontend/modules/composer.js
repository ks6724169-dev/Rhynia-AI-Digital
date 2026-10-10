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
/**
 * Format bytes into human-readable size (e.g. 240 KB, 1.4 MB)
 */
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get document icon and visual badge styling based on file extension / MIME
 */
function getDocTypeInfo(mimeType, filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") {
    return { icon: "picture_as_pdf", color: "text-red-400 bg-red-500/10 border-red-500/30", label: "PDF" };
  }
  if (mimeType?.includes("word") || ext === "doc" || ext === "docx") {
    return { icon: "description", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", label: "DOCX" };
  }
  if (["js", "ts", "py", "html", "css", "json", "c", "cpp", "java", "sql"].includes(ext)) {
    return { icon: "code", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: ext.toUpperCase() };
  }
  return { icon: "draft", color: "text-neutral-300 bg-white/10 border-white/20", label: ext.toUpperCase() || "FILE" };
}

/**
 * Smart Client-Side Image Compression using HTML5 Canvas
 * Downscales images exceeding maxDimension and compresses to JPEG (quality 0.85).
 * Turns 8-15 MB phone camera photos into ~200-400 KB instantly without losing clarity!
 */
async function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.type.includes("gif") || file.type.includes("svg")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skip resizing if already within bounds and under 400KB
        if (width <= maxDimension && height <= maxDimension && file.size < 400 * 1024) {
          resolve(file);
          return;
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw and export compressed JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^.]+$/, ".jpg");
            const compressedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Handle File Selection (Device File Manager / Camera)
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
 * Upload Single File Attachment with Client-Side Compression & Instant Preview
 */
async function uploadAttachmentFile(file) {
  if (!file) return;

  const isImage = file.type && file.type.startsWith("image/");
  const tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);

  // Generate zero-latency local blob preview for images immediately
  let localPreviewUrl = "";
  if (isImage) {
    try {
      localPreviewUrl = URL.createObjectURL(file);
    } catch (e) {
      localPreviewUrl = "";
    }
  }

  // Render instant ChatGPT-style pending card
  addAttachmentChipUI({
    id: tempId,
    name: file.name,
    previewUrl: localPreviewUrl,
    isImage: isImage,
    isUploading: true,
    sizeFormatted: formatFileSize(file.size)
  });

  try {
    // Perform rapid Canvas compression for images
    let fileToUpload = file;
    if (isImage) {
      fileToUpload = await compressImageFile(file, 1600, 0.85);
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const res = await fetch(`${CONFIG.API_BASE}/files/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${window.AppState?.token || ""}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");

    // Replace temporary chip with confirmed uploaded file
    removeAttachmentChipUI(tempId, false);

    const fileId = (data.file && data.file.id) ? data.file.id : (data.id || tempId);
    const fileName = (data.file && data.file.original_filename) ? data.file.original_filename : (data.filename || fileToUpload.name);
    const fileUrl = (data.file && data.file.id) ? `${CONFIG.API_BASE}/files/${data.file.id}/download` : (data.url || "");
    const mimeType = (data.file && data.file.mime_type) ? data.file.mime_type : (fileToUpload.type || "");
    const finalSize = (data.file && data.file.file_size_bytes) ? data.file.file_size_bytes : fileToUpload.size;

    if (window.AppState) {
      if (!window.AppState.pendingFiles) window.AppState.pendingFiles = [];
      window.AppState.pendingFiles.push({
        id: fileId,
        name: fileName,
        url: fileUrl,
        previewUrl: localPreviewUrl,
        type: mimeType,
        size: finalSize
      });
    }

    addAttachmentChipUI({
      id: fileId,
      name: fileName,
      url: fileUrl,
      previewUrl: localPreviewUrl,
      isImage: isImage,
      isUploading: false,
      sizeFormatted: formatFileSize(finalSize)
    });

    showToast(`Attached: ${fileName} (${formatFileSize(finalSize)})`, "success");
  } catch (err) {
    removeAttachmentChipUI(tempId, true);
    showToast(`Failed to upload ${file.name}: ${err.message}`, "error");
  }
}

/**
 * Add Attachment Chip UI Above Composer (ChatGPT-Style Compact Badge / Thumbnail)
 */
function addAttachmentChipUI(fileObj) {
  const container = document.getElementById("input-attachment-chips");
  if (!container) return;

  container.classList.remove("hidden");
  container.classList.add("flex");

  const chip = document.createElement("div");
  chip.id = `chip-${fileObj.id}`;

  const isImg = fileObj.isImage || (fileObj.type && fileObj.type.startsWith("image/")) || (fileObj.name && fileObj.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

  if (isImg) {
    // ChatGPT & Gemini Style Extra Large Image Preview (144x144 px / 176x176 px with rounded-3xl)
    chip.className = "relative group/chip rounded-3xl overflow-hidden border-2 border-white/30 bg-[#16161a] w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 shadow-2xl animate-fade-in";
    chip.innerHTML = `
      <img src="${fileObj.previewUrl || fileObj.url}" alt="${escapeHtml(fileObj.name)}" class="w-full h-full object-cover rounded-3xl" />
      ${fileObj.isUploading ? `
        <div class="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
          <span class="material-symbols-outlined text-[40px] text-[#0078D4] animate-spin">progress_activity</span>
        </div>
      ` : `
        <button type="button" onclick="removeAttachmentFile('${fileObj.id}')" title="Remove attachment" class="absolute top-2 right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/90 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-xl border border-white/25">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
        </button>
      `}
    `;
  } else {
    // ChatGPT & Gemini Style Extra Large Prominent Document Card
    const docInfo = getDocTypeInfo(fileObj.type, fileObj.name);
    chip.className = "relative inline-flex items-center gap-4 p-4 sm:p-5 pr-5 rounded-3xl bg-[#1c1c22] hover:bg-[#24242c] border-2 border-white/25 text-neutral-200 shadow-2xl animate-fade-in group/chip flex-shrink-0 min-w-[260px] sm:min-w-[320px] max-w-[380px]";
    chip.innerHTML = `
      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border ${docInfo.color} shrink-0">
        <span class="material-symbols-outlined text-[32px] sm:text-[36px]">${docInfo.icon}</span>
      </div>
      <div class="flex flex-col min-w-0 pr-2 text-left flex-1">
        <span class="font-black text-white truncate text-lg sm:text-xl leading-tight">${escapeHtml(fileObj.name)}</span>
        <span class="text-sm text-neutral-300 font-mono mt-1">${fileObj.sizeFormatted || docInfo.label}</span>
      </div>
      ${fileObj.isUploading ? `
        <span class="material-symbols-outlined text-[24px] text-[#0078D4] animate-spin ml-1 shrink-0">progress_activity</span>
      ` : `
        <button type="button" onclick="removeAttachmentFile('${fileObj.id}')" title="Remove attachment" class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-all ml-auto shrink-0 shadow-md">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      `}
    `;
  }

  container.appendChild(chip);
  updateSendButtonState();
}

/**
 * Remove Attachment Chip & Unbind from State
 */
function removeAttachmentFile(fileId) {
  if (window.AppState && window.AppState.pendingFiles) {
    const item = window.AppState.pendingFiles.find(f => f.id === fileId);
    if (item && item.previewUrl && item.previewUrl.startsWith("blob:")) {
      try { URL.revokeObjectURL(item.previewUrl); } catch (e) {}
    }
    window.AppState.pendingFiles = window.AppState.pendingFiles.filter(f => f.id !== fileId);
  }
  removeAttachmentChipUI(fileId, true);
  updateSendButtonState();
}

function removeAttachmentChipUI(fileId, revokeUrl = true) {
  const chip = document.getElementById(`chip-${fileId}`);
  if (chip) {
    if (revokeUrl) {
      const img = chip.querySelector("img");
      if (img && img.src && img.src.startsWith("blob:")) {
        try { URL.revokeObjectURL(img.src); } catch (e) {}
      }
    }
    chip.remove();
  }

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

// Direct Live Web Search Grounding is permanently enabled
if (window.AppState) {
  window.AppState.webSearchEnabled = true;
}
window.toggleWebSearch = function() {};

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
