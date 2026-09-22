/**
 * Rhynia Intelligence SaaS — Feedback Module (Screenshots Exact Match)
 * Handles Like (thumb_up) and Dislike (thumb_down) Interactive Feedback Modal
 * Automatically localizes titles, tags, and notices to user's selected app language
 * Brand Compliance: 100% Rhynia Clean
 */

const FEEDBACK_I18N_FALLBACK = {
  hi: {
    feedback_like_title: "आपको क्या पसंद आया? (ज़रूरी नहीं)",
    feedback_dislike_title: "आपको क्या पसंद नहीं आया? (ज़रूरी नहीं)",
    feedback_tag_incorrect: "गलत",
    feedback_tag_unsafe: "आपत्तिजनक या असुरक्षित",
    feedback_tag_not_working: "काम नहीं कर रहा है",
    feedback_tag_not_helpful: "काम की नहीं थी",
    feedback_tag_saved_time: "समय की बचत हुई",
    feedback_tag_clear: "सटीक और स्पष्ट",
    feedback_tag_helpful: "मददगार",
    feedback_tag_great: "बेहतरीन",
    feedback_tag_other: "अन्य",
    feedback_comment_placeholder: "कुछ जानकारी शेयर करें...",
    feedback_chat_copy_notice: "इस चैट की एक कॉपी शामिल की जाएगी।",
    feedback_submit: "सबमिट करें",
    feedback_submitted_toast: "धन्यवाद! आपका फ़ीडबैक सबमिट हो गया है।"
  },
  en: {
    feedback_like_title: "What did you like? (Optional)",
    feedback_dislike_title: "What didn't you like? (Optional)",
    feedback_tag_incorrect: "Incorrect",
    feedback_tag_unsafe: "Offensive or unsafe",
    feedback_tag_not_working: "Not working",
    feedback_tag_not_helpful: "Not helpful",
    feedback_tag_saved_time: "Saved time",
    feedback_tag_clear: "Accurate & clear",
    feedback_tag_helpful: "Helpful",
    feedback_tag_great: "Great response",
    feedback_tag_other: "Other",
    feedback_comment_placeholder: "Share some details...",
    feedback_chat_copy_notice: "A copy of this chat will be included.",
    feedback_submit: "Submit",
    feedback_submitted_toast: "Thank you! Your feedback has been recorded."
  }
};

/**
 * Robust string resolver: prefers window.I18n, falls back to language dictionary, then English
 */
function resolveFeedbackString(key, fallbackDefault) {
  if (window.I18n && typeof window.I18n.t === "function") {
    const val = window.I18n.t(key);
    if (val && val !== key) {
      return val;
    }
  }

  const currentLang = (window.I18n && window.I18n.currentLanguage) || localStorage.getItem("rhynia_language") || "en";
  if (FEEDBACK_I18N_FALLBACK[currentLang] && FEEDBACK_I18N_FALLBACK[currentLang][key]) {
    return FEEDBACK_I18N_FALLBACK[currentLang][key];
  }

  return FEEDBACK_I18N_FALLBACK.en[key] || fallbackDefault || key;
}

let activeFeedbackState = {
  rating: null,           // "like" or "dislike"
  messageId: null,
  sessionId: null,
  chatSnippet: "",
  selectedTags: new Set(),
  originButtonEl: null
};

/**
 * Open Feedback Modal (invoked from Like/Dislike action icons in chat)
 */
function openFeedbackModal(buttonEl, isPositive) {
  const rating = isPositive ? "like" : "dislike";
  activeFeedbackState.rating = rating;
  activeFeedbackState.originButtonEl = buttonEl;
  activeFeedbackState.selectedTags.clear();

  // Find parent message container
  const msgContainer = buttonEl.closest("[id^='ai-msg-']");
  if (msgContainer) {
    activeFeedbackState.messageId = msgContainer.dataset.messageId || msgContainer.id;
    const textBody = msgContainer.querySelector(".ai-text-body");
    activeFeedbackState.chatSnippet = textBody ? textBody.innerText.substring(0, 500) : "";
  } else {
    activeFeedbackState.messageId = "unknown";
    activeFeedbackState.chatSnippet = "";
  }
  activeFeedbackState.sessionId = window.AppState ? window.AppState.activeSessionId : null;

  // 1. Dynamic Title based on selected Language & Rating
  const titleEl = document.getElementById("feedback-modal-title");
  if (titleEl) {
    const titleKey = isPositive ? "feedback_like_title" : "feedback_dislike_title";
    titleEl.textContent = resolveFeedbackString(titleKey, isPositive ? "What did you like? (Optional)" : "What didn't you like? (Optional)");
  }

  // 2. Render Tags / Chips matching user screenshot
  renderFeedbackTags(rating);

  // 3. Reset Textarea & Placeholders
  const commentInput = document.getElementById("feedback-modal-comment");
  if (commentInput) {
    commentInput.value = "";
    commentInput.placeholder = resolveFeedbackString("feedback_comment_placeholder", "Share some details...");
  }

  // 4. Update Copy Notice and Submit Button Text
  const noticeEl = document.getElementById("feedback-modal-notice");
  if (noticeEl) {
    noticeEl.textContent = resolveFeedbackString("feedback_chat_copy_notice", "A copy of this chat will be included.");
  }

  const submitBtn = document.getElementById("feedback-modal-submit-btn");
  if (submitBtn) {
    submitBtn.textContent = resolveFeedbackString("feedback_submit", "Submit");
    submitBtn.removeAttribute("disabled");
  }

  // 5. Reveal Modal Backdrop
  const modal = document.getElementById("feedback-modal-backdrop");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

/**
 * Render Tags / Chips according to rating (Like vs Dislike) and Active Language
 */
function renderFeedbackTags(rating) {
  const container = document.getElementById("feedback-tags-container");
  if (!container) return;

  const isPositive = (rating === "like");
  const tagDefinitions = isPositive
    ? [
        { id: "saved_time", key: "feedback_tag_saved_time", defaultText: "Saved time" },
        { id: "clear", key: "feedback_tag_clear", defaultText: "Accurate & clear" },
        { id: "helpful", key: "feedback_tag_helpful", defaultText: "Helpful" },
        { id: "great", key: "feedback_tag_great", defaultText: "Great response" },
        { id: "other", key: "feedback_tag_other", defaultText: "Other" }
      ]
    : [
        { id: "incorrect", key: "feedback_tag_incorrect", defaultText: "Incorrect" },
        { id: "unsafe", key: "feedback_tag_unsafe", defaultText: "Offensive or unsafe" },
        { id: "not_working", key: "feedback_tag_not_working", defaultText: "Not working" },
        { id: "not_helpful", key: "feedback_tag_not_helpful", defaultText: "Not helpful" },
        { id: "other", key: "feedback_tag_other", defaultText: "Other" }
      ];

  container.innerHTML = tagDefinitions.map(tag => {
    const label = resolveFeedbackString(tag.key, tag.defaultText);
    return `
      <button 
        type="button" 
        data-tag-id="${tag.id}" 
        data-tag-label="${escapeHtml(label)}"
        onclick="toggleFeedbackTagChip(this, '${tag.id}', '${escapeHtml(label)}')" 
        class="feedback-chip px-3 py-1.5 rounded-lg border border-white/10 bg-[#2b2c31] text-xs text-neutral-300 hover:text-white hover:border-white/20 active:scale-95 transition-all text-left"
      >
        ${escapeHtml(label)}
      </button>
    `;
  }).join("");
}

/**
 * Toggle Tag Selection
 */
function toggleFeedbackTagChip(buttonEl, tagId, tagLabel) {
  const isSelected = activeFeedbackState.selectedTags.has(tagLabel);

  if (isSelected) {
    activeFeedbackState.selectedTags.delete(tagLabel);
    buttonEl.classList.remove("border-[#0078D4]", "bg-[#0078D4]/25", "text-white", "font-medium", "shadow-sm");
    buttonEl.classList.add("border-white/10", "bg-[#2b2c31]", "text-neutral-300");
  } else {
    activeFeedbackState.selectedTags.add(tagLabel);
    buttonEl.classList.remove("border-white/10", "bg-[#2b2c31]", "text-neutral-300");
    buttonEl.classList.add("border-[#0078D4]", "bg-[#0078D4]/25", "text-white", "font-medium", "shadow-sm");
  }
}

/**
 * Close Feedback Modal
 */
function closeFeedbackModal() {
  const modal = document.getElementById("feedback-modal-backdrop");
  if (modal) {
    modal.classList.add("hidden");
  }
  activeFeedbackState.selectedTags.clear();
}

/**
 * Submit Feedback to Backend API (/api/v1/feedback)
 * Closes modal automatically and updates UI immediately
 */
async function submitFeedbackModal() {
  const commentInput = document.getElementById("feedback-modal-comment");
  const comment = commentInput ? commentInput.value.trim() : "";

  const payload = {
    rating: activeFeedbackState.rating,
    message_id: activeFeedbackState.messageId,
    session_id: activeFeedbackState.sessionId,
    tags: Array.from(activeFeedbackState.selectedTags),
    comment: comment,
    chat_snippet: activeFeedbackState.chatSnippet
  };

  const originBtn = activeFeedbackState.originButtonEl;
  const rating = activeFeedbackState.rating;

  // 1. AUTOMATICALLY CLOSE MODAL IMMEDIATELY
  closeFeedbackModal();

  // 2. Visually update active message icon
  if (originBtn) {
    const parentBar = originBtn.closest(".ai-actions-bar");
    if (parentBar) {
      const likeBtn = parentBar.querySelector("button[aria-label='Good response']");
      const dislikeBtn = parentBar.querySelector("button[aria-label='Poor response']");
      if (likeBtn) likeBtn.classList.remove("text-[#0078d4]", "bg-white/10");
      if (dislikeBtn) dislikeBtn.classList.remove("text-red-400", "bg-white/10");
    }

    if (rating === "like") {
      originBtn.classList.add("text-[#0078d4]", "bg-white/10");
    } else {
      originBtn.classList.add("text-red-400", "bg-white/10");
    }
  }

  // 3. Show instant success toast
  const toastMsg = resolveFeedbackString("feedback_submitted_toast", "धन्यवाद! आपका फ़ीडबैक सबमिट हो गया है।");
  if (typeof showToast === "function") {
    showToast(toastMsg, "success");
  }

  // 4. Send to Backend API
  try {
    const token = (window.AppState && window.AppState.token) || localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/feedback`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn("Feedback submission response not ok:", res.status);
    }
  } catch (err) {
    console.warn("Feedback background send warning:", err);
  }
}
