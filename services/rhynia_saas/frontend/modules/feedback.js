/**
 * Rhynia Intelligence SaaS — Feedback Module (Screenshots Match)
 * Handles Like (thumb_up) and Dislike (thumb_down) Interactive Feedback Modal
 * Automatically localizes titles, tags, and notices to user's selected app language
 * Brand Compliance: 100% Rhynia Clean
 */

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
    titleEl.textContent = window.I18n ? window.I18n.t(titleKey) : (isPositive ? "What did you like? (Optional)" : "What didn't you like? (Optional)");
  }

  // 2. Render Tags / Chips matching user screenshot
  renderFeedbackTags(rating);

  // 3. Reset Textarea & Placeholders
  const commentInput = document.getElementById("feedback-modal-comment");
  if (commentInput) {
    commentInput.value = "";
    const placeholderKey = "feedback_comment_placeholder";
    commentInput.placeholder = window.I18n ? window.I18n.t(placeholderKey) : "Share some details...";
  }

  // 4. Update Copy Notice and Submit Button Text
  const noticeEl = document.getElementById("feedback-modal-notice");
  if (noticeEl) {
    noticeEl.textContent = window.I18n ? window.I18n.t("feedback_chat_copy_notice") : "A copy of this chat will be included.";
  }

  const submitBtn = document.getElementById("feedback-modal-submit-btn");
  if (submitBtn) {
    submitBtn.textContent = window.I18n ? window.I18n.t("feedback_submit") : "Submit";
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
    const label = window.I18n ? window.I18n.t(tag.key) : tag.defaultText;
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
 */
async function submitFeedbackModal() {
  const commentInput = document.getElementById("feedback-modal-comment");
  const comment = commentInput ? commentInput.value.trim() : "";
  const submitBtn = document.getElementById("feedback-modal-submit-btn");

  const payload = {
    rating: activeFeedbackState.rating,
    message_id: activeFeedbackState.messageId,
    session_id: activeFeedbackState.sessionId,
    tags: Array.from(activeFeedbackState.selectedTags),
    comment: comment,
    chat_snippet: activeFeedbackState.chatSnippet
  };

  try {
    if (submitBtn) {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin inline-block mr-1">progress_activity</span>`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AppState.token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit feedback");
    }

    // Success: Highlight origin button and reset sibling
    if (activeFeedbackState.originButtonEl) {
      const parentBar = activeFeedbackState.originButtonEl.closest(".ai-actions-bar");
      if (parentBar) {
        // Clear previous like/dislike highlight in this actions bar
        const likeBtn = parentBar.querySelector("button[aria-label='Good response']");
        const dislikeBtn = parentBar.querySelector("button[aria-label='Poor response']");
        if (likeBtn) likeBtn.classList.remove("text-[#0078d4]", "bg-white/10");
        if (dislikeBtn) dislikeBtn.classList.remove("text-red-400", "bg-white/10");
      }

      if (activeFeedbackState.rating === "like") {
        activeFeedbackState.originButtonEl.classList.add("text-[#0078d4]", "bg-white/10");
      } else {
        activeFeedbackState.originButtonEl.classList.add("text-red-400", "bg-white/10");
      }
    }

    closeFeedbackModal();
    const toastMsg = window.I18n ? window.I18n.t("feedback_submitted_toast") : "Thank you! Your feedback has been recorded.";
    if (typeof showToast === "function") {
      showToast(toastMsg, "success");
    }

  } catch (err) {
    console.error("Feedback submit error:", err);
    if (typeof showToast === "function") {
      showToast(err.message || "Failed to submit feedback", "error");
    }
  } finally {
    if (submitBtn) {
      submitBtn.removeAttribute("disabled");
      submitBtn.textContent = window.I18n ? window.I18n.t("feedback_submit") : "Submit";
    }
  }
}
