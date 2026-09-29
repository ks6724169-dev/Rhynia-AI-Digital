/**
 * Rhynia Intelligence SaaS — Auth Module (Screens 07, 08, 09, 10, 11)
 * Strict Brand Compliance: Rhynia
 * Zero Dead Buttons:
 *   - Screen 07: Login form, eye visibility toggle, forgot password link, social buttons
 *   - Screen 08: Registration form, 4-bar password strength meter, password visibility toggle
 *   - Screen 09: 6-slot SMS OTP auto-advance & paste, 48s countdown timer, resend button
 *   - Screen 10: 6-slot Email OTP auto-advance & paste, 48s countdown timer, resend button
 *   - Screen 11: Forgot password recovery form, submit action, back to sign in
 */

let smsTimerInterval = null;
let emailTimerInterval = null;

/**
 * Toggle Password Visibility (Eye Icon Button)
 */
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    if (icon) icon.textContent = "visibility_off";
  } else {
    input.type = "password";
    if (icon) icon.textContent = "visibility";
  }
}

/**
 * Real-Time 4-Bar Password Strength Meter (Screen 08)
 */
function updatePasswordStrengthMeter(password) {
  const textEl = document.getElementById("pwd-strength-text");
  const bar1 = document.getElementById("pwd-bar-1");
  const bar2 = document.getElementById("pwd-bar-2");
  const bar3 = document.getElementById("pwd-bar-3");
  const bar4 = document.getElementById("pwd-bar-4");

  const bars = [bar1, bar2, bar3, bar4];

  if (!password) {
    if (textEl) {
      textEl.textContent = "None";
      textEl.className = "text-neutral-500 font-medium text-[11px]";
    }
    bars.forEach(b => { if (b) b.className = "h-full rounded-full bg-white/10 transition-colors"; });
    return;
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  bars.forEach((b, idx) => {
    if (!b) return;
    if (idx < score) {
      if (score === 1) b.className = "h-full rounded-full bg-red-500 transition-colors";
      else if (score === 2) b.className = "h-full rounded-full bg-amber-500 transition-colors";
      else if (score === 3) b.className = "h-full rounded-full bg-[#0078D4] transition-colors";
      else b.className = "h-full rounded-full bg-emerald-500 transition-colors";
    } else {
      b.className = "h-full rounded-full bg-white/10 transition-colors";
    }
  });

  if (textEl) {
    if (score <= 1) {
      textEl.textContent = "Weak";
      textEl.className = "text-red-400 font-medium text-[11px]";
    } else if (score === 2) {
      textEl.textContent = "Fair";
      textEl.className = "text-amber-400 font-medium text-[11px]";
    } else if (score === 3) {
      textEl.textContent = "Good";
      textEl.className = "text-[#8ecdff] font-medium text-[11px]";
    } else {
      textEl.textContent = "Strong";
      textEl.className = "text-emerald-400 font-medium text-[11px]";
    }
  }
}

/**
 * Handle Login Form Submit (Screen 07)
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const idInput = document.getElementById("login-identifier-input");
  const pwdInput = document.getElementById("login-password-input");
  const submitBtn = document.getElementById("login-submit-btn");

  const identifier = idInput ? idInput.value.trim() : "";
  const password = pwdInput ? pwdInput.value : "";

  if (!identifier || !password) {
    showToast("Please enter both email/username and password", "error");
    return;
  }

  showToast("Signing in to Rhynia...", "info");

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Signing in...</span>`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: identifier,
        email: identifier,
        password: password
      })
    });

    const data = await res.json();
    if (!res.ok) {
      let errMsg = "Authentication failed";
      if (typeof data.detail === "string") {
        errMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errMsg = data.detail.map(e => e.msg || e.detail).join(", ");
      }
      throw new Error(errMsg);
    }

    // Store JWT Token
    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);

    // Load profile and initialize workspace
    showToast("Sign in successful! Welcome to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  }
}

/**
 * Handle Register Form Submit (Screen 08)
 */
async function handleRegisterSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById("register-name-input");
  const emailInput = document.getElementById("register-email-input");
  const phoneInput = document.getElementById("register-phone-input");
  const pwdInput = document.getElementById("register-password-input");
  const submitBtn = document.getElementById("register-submit-btn");

  const displayName = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const password = pwdInput ? pwdInput.value : "";

  if (!displayName || !email || !password || !phone) {
    showToast("Please fill in all mandatory fields (Name, Gmail, Mobile, Password)", "error");
    return;
  }

  const rawPhone = phone.replace(/\D/g, "");
  if (rawPhone.length < 10) {
    showToast("Please enter a valid 10-digit mobile number", "error");
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (password.length < 8) {
    showToast("Password must be at least 8 characters long", "error");
    if (pwdInput) pwdInput.focus();
    return;
  }

  showToast("Creating your Rhynia account...", "info");

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Creating Account...</span>`;
    }

    const cleanUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900);

    const res = await fetch(`${CONFIG.API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        username: cleanUsername,
        password: password,
        phone_number: rawPhone.slice(-10)
      })
    });

    const data = await res.json();
    if (!res.ok) {
      let errMsg = "Registration failed";
      if (typeof data.detail === "string") {
        errMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errMsg = data.detail.map(e => e.msg || e.detail).join(", ");
      }
      throw new Error(errMsg);
    }

    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);

    // Save display name
    await fetch(`${CONFIG.API_BASE}/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${data.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ display_name: displayName })
    });

    showToast("Account created successfully! Welcome to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message, "error");
  } finally {

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Account</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  }
}

/**
 * Initialize Authenticated Workspace
 */
async function initializeWorkspace() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (res.ok) {
      const profile = await res.json();
      AppState.user = profile;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(profile));
      renderUserProfileUI(profile);
      if (typeof updateEmptyStateUserName === "function") {
        updateEmptyStateUserName(profile);
      }
      updateDrawerProfileAvatar();
    }
  } catch (e) {
    console.error("Workspace init error:", e);
  }

  switchView("view-app");
  await loadSessions();
  await loadStorage();

  if (AppState.activeSessionId) {
    await openSession(AppState.activeSessionId);
  } else {
    showEmptyChatScreen();
  }
}

/**
 * Setup OTP Auto-Advance and Navigation for 6 Slots
 */
function setupOtpSlotInputs(prefix) {
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otp-${prefix}-${i}`);
    if (!input) continue;

    input.addEventListener("input", (e) => {
      const val = e.target.value.replace(/\D/g, "");
      e.target.value = val ? val[val.length - 1] : "";
      if (val && i < 6) {
        const next = document.getElementById(`otp-${prefix}-${i + 1}`);
        if (next) next.focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 1) {
        const prev = document.getElementById(`otp-${prefix}-${i - 1}`);
        if (prev) prev.focus();
      }
    });
  }
}

/**
 * Paste OTP Code from Clipboard across 6 Slots
 */
async function pasteOtpFromClipboard(channel) {
  try {
    const text = await navigator.clipboard.readText();
    const digits = text.replace(/\D/g, "");
    if (!digits) {
      showToast("No digits found in clipboard", "error");
      return;
    }

    const chars = digits.split("");
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otp-${channel}-${i}`);
      if (input && chars[i - 1]) {
        input.value = chars[i - 1];
      }
    }
    showToast("Code pasted from clipboard!", "success");
    const last = document.getElementById(`otp-${channel}-${Math.min(6, digits.length)}`);
    if (last) last.focus();
  } catch (err) {
    showToast("Clipboard permission not granted", "error");
  }
}

/**
 * Resend OTP Code with 48s Countdown
 */
function startCountdownTimer(channel) {
  let seconds = 48;
  const countdownEl = document.querySelector(`#${channel}-resend-countdown .countdown-display`);
  const btnEl = document.getElementById(`btn-resend-${channel}-otp`);

  if (btnEl) btnEl.disabled = true;

  const timerRef = setInterval(() => {
    seconds--;
    if (countdownEl) {
      countdownEl.textContent = `00:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    if (seconds <= 0) {
      clearInterval(timerRef);
      if (btnEl) btnEl.disabled = false;
      if (countdownEl) countdownEl.textContent = "00:00";
    }
  }, 1000);

  if (channel === "sms") {
    if (smsTimerInterval) clearInterval(smsTimerInterval);
    smsTimerInterval = timerRef;
  } else {
    if (emailTimerInterval) clearInterval(emailTimerInterval);
    emailTimerInterval = timerRef;
  }
}

/**
 * Start Phone Login Flow (Screen 07 -> Screen 09)
 */
function startPhoneLogin() {
  const currentPhone = AppState.pendingPhoneNumber || "";
  const phone = prompt("Enter your 10-digit mobile number for SMS verification:", currentPhone || "+91 ");
  if (!phone || !phone.trim()) return;
  requestPhoneOtp(phone.trim());
}

/**
 * Request Phone OTP via Fast2SMS API
 */
async function requestPhoneOtp(phoneNumber) {
  showToast("Dispatching SMS code via Fast2SMS...", "info");
  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to send SMS code");
    }

    AppState.pendingPhoneNumber = data.phone_number;
    AppState.isPasswordResetFlow = false;
    switchView("view-sms-otp");

    const targetEl = document.getElementById("sms-phone-target");
    if (targetEl) targetEl.textContent = `Sent to ${data.phone_number}`;

    if (data.dev_code) {
      console.log(`[RHYNIA FAST2SMS OTP] ${data.phone_number} -> ${data.dev_code}`);
    }

    if (data.sms_delivered) {
      showToast("Verification SMS sent to your phone!", "success");
    } else {
      showToast(data.message || "OTP code generated!", "info");
    }

    startCountdownTimer("sms");
  } catch (err) {
    showToast(err.message || "Failed to send SMS", "error");
  }
}

async function resendOtpCode(channel) {
  if (channel === "sms") {
    if (AppState.pendingPhoneNumber) {
      await requestPhoneOtp(AppState.pendingPhoneNumber);
    } else {
      startPhoneLogin();
    }
  } else {
    const targetEmail = AppState.pendingResetEmail || (AppState.user && AppState.user.email);
    if (targetEmail) {
      try {
        await fetch(`${CONFIG.API_BASE}/auth/email/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail })
        });
        showToast(`New verification code sent to ${targetEmail}`, "success");
      } catch (e) {
        showToast("Failed to resend email code", "error");
      }
    } else {
      showToast(`New verification code sent via ${channel.toUpperCase()}`, "success");
    }
    startCountdownTimer(channel);
  }
}

/**
 * Verify SMS OTP (Screen 09)
 */
async function verifySmsOtp() {
  let code = "";
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otp-sms-${i}`);
    if (input) code += input.value.trim();
  }

  if (code.length < 6) {
    showToast("Please enter all 6 digits of the SMS code", "error");
    return;
  }

  const phone = AppState.pendingPhoneNumber;
  if (!phone) {
    const enteredPhone = prompt("Please confirm your registered mobile phone number:", "+91 ");
    if (!enteredPhone) return;
    AppState.pendingPhoneNumber = enteredPhone.trim();
  }

  showToast("Verifying SMS code...", "info");

  try {
    // If this is password reset flow:
    if (AppState.isPasswordResetFlow) {
      const verifyRes = await fetch(`${CONFIG.API_BASE}/auth/forgot-password/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: AppState.pendingPhoneNumber,
          otp_code: code
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || "Invalid or expired SMS code");
      }

      AppState.pendingResetCode = code;
      showToast("Code verified! Please create your new password.", "success");

      const targetInfo = document.getElementById("new-password-target-info");
      if (targetInfo) targetInfo.textContent = `Account: ${AppState.pendingPhoneNumber}`;

      switchView("view-new-password");
      return;
    }

    // Standard Phone Login Flow:
    const res = await fetch(`${CONFIG.API_BASE}/auth/phone/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number: AppState.pendingPhoneNumber,
        otp_code: code
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "SMS verification failed");
    }

    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);
    if (data.user) {
      AppState.user = data.user;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    }

    showToast("Phone verification successful! Welcome to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message || "Invalid or expired code", "error");
  }
}

/**
 * Verify Email OTP (Screen 10)
 */
async function verifyEmailOtp() {
  let code = "";
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otp-email-${i}`);
    if (input) code += input.value.trim();
  }

  if (code.length < 6) {
    showToast("Please enter all 6 digits of the email confirmation code", "error");
    return;
  }

  const email = AppState.pendingResetEmail || (AppState.user && AppState.user.email);
  if (!email && AppState.isPasswordResetFlow) {
    const enteredEmail = prompt("Please confirm your registered email address:");
    if (!enteredEmail) return;
    AppState.pendingResetEmail = enteredEmail.trim();
  }

  showToast("Verifying email code...", "info");

  try {
    // If this is password reset flow:
    if (AppState.isPasswordResetFlow) {
      const verifyRes = await fetch(`${CONFIG.API_BASE}/auth/forgot-password/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: AppState.pendingResetEmail,
          otp_code: code
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || "Invalid or expired email verification code");
      }

      AppState.pendingResetCode = code;
      showToast("Code verified! Please create your new password.", "success");

      const targetInfo = document.getElementById("new-password-target-info");
      if (targetInfo) targetInfo.textContent = `Account: ${AppState.pendingResetEmail}`;

      switchView("view-new-password");
      return;
    }

    // Standard Email Verification Flow:
    const res = await fetch(`${CONFIG.API_BASE}/auth/email/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        otp_code: code
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Email verification failed");
    }

    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);
    if (data.user) {
      AppState.user = data.user;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    }

    showToast("Email verified successfully! Welcome to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message || "Invalid or expired code", "error");
  }
}

/**
 * Handle Forgot Password (Screen 11)
 */
async function handleForgotSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("forgot-identifier-input");
  const submitBtn = document.getElementById("btn-send-reset-otp");
  const val = input ? input.value.trim() : "";

  if (!val) {
    showToast("Please enter your registered email or phone", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Sending Code...</span>`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: val })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to dispatch reset code");
    }

    if (data.phone_number) {
      AppState.pendingPhoneNumber = data.phone_number;
      AppState.isPasswordResetFlow = true;

      showToast(data.message || "Verification code sent to your phone!", "success");
      switchView("view-sms-otp");

      const targetEl = document.getElementById("sms-phone-target");
      if (targetEl) targetEl.textContent = `Reset code sent to ${data.phone_number}`;
      startCountdownTimer("sms");
    } else {
      const email = data.email || val;
      AppState.pendingResetEmail = email;
      AppState.isPasswordResetFlow = true;

      showToast(data.message || "Verification code sent to your email!", "success");
      switchView("view-email-otp");

      const targetEl = document.getElementById("email-otp-target");
      if (targetEl) targetEl.textContent = `Reset code sent to ${email}`;
      startCountdownTimer("email");
    }

  } catch (err) {
    showToast(err.message || "Password reset failed", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Send Reset Code</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  }
}

/**
 * Handle Set New Password Submission (Screen 12)
 */
async function handleNewPasswordSubmit(event) {
  event.preventDefault();
  const pwdInput = document.getElementById("reset-new-password-input");
  const confirmInput = document.getElementById("reset-confirm-password-input");
  const submitBtn = document.getElementById("btn-save-new-password");

  const pwd = pwdInput ? pwdInput.value : "";
  const confirmPwd = confirmInput ? confirmInput.value : "";

  if (!pwd || pwd.length < 8) {
    showToast("Password must be at least 8 characters long", "error");
    if (pwdInput) pwdInput.focus();
    return;
  }

  if (pwd !== confirmPwd) {
    showToast("Passwords do not match. Please re-check.", "error");
    if (confirmInput) confirmInput.focus();
    return;
  }

  const payload = {
    otp_code: AppState.pendingResetCode,
    new_password: pwd
  };

  if (AppState.pendingResetEmail) {
    payload.email = AppState.pendingResetEmail;
  } else if (AppState.pendingPhoneNumber) {
    payload.phone_number = AppState.pendingPhoneNumber;
  } else {
    showToast("Reset session expired. Please start over.", "error");
    switchView("view-forgot-password");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Updating Password...</span>`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/auth/forgot-password/reset-with-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to update password");
    }

    // Reset flow completed successfully
    AppState.isPasswordResetFlow = false;
    AppState.pendingResetCode = null;
    AppState.pendingResetEmail = null;
    AppState.pendingPhoneNumber = null;

    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);
    if (data.user) {
      AppState.user = data.user;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    }

    showToast("Password updated successfully! Welcome back to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message || "Failed to update password", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Update Password & Sign In</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  }
}

/**
 * Toggle Password Visibility (Eye Icon)
 */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  const btn = input.parentElement ? input.parentElement.querySelector("button") : null;
  if (btn) {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = isPassword ? "visibility_off" : "visibility";
    }
  }
}

/**
 * Cancel Password Reset Flow
 */
function cancelPasswordReset() {
  AppState.isPasswordResetFlow = false;
  AppState.pendingResetCode = null;
  AppState.pendingResetEmail = null;
  AppState.pendingPhoneNumber = null;
  switchView("view-login");
}

window.handleNewPasswordSubmit = handleNewPasswordSubmit;
window.togglePasswordVisibility = togglePasswordVisibility;
window.cancelPasswordReset = cancelPasswordReset;


// ==========================================
// GOOGLE OAUTH 2.0 (GIS) INTEGRATION
// ==========================================
let googleTokenClient = null;
let googleAuthInitialized = false;

/**
 * Initialize Google Identity Services (GIS)
 */
function initGoogleAuth() {
  if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
    // Retry when GIS SDK finishes loading
    setTimeout(initGoogleAuth, 350);
    return;
  }

  const clientId = (typeof CONFIG !== "undefined" && CONFIG.GOOGLE_CLIENT_ID)
    ? CONFIG.GOOGLE_CLIENT_ID
    : "1001346913265-qbdhpbb69gen2mvcjtu56jepn1sld8os.apps.googleusercontent.com";

  try {
    // 1. Initialize Google ID Token flow (GIS)
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // 2. Render Google Button on Login Screen
    const loginContainer = document.getElementById("google-login-btn-container");
    if (loginContainer) {
      loginContainer.innerHTML = "";
      google.accounts.id.renderButton(loginContainer, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 380,
      });
    }

    // 3. Render Google Button on Register Screen
    const regContainer = document.getElementById("google-register-btn-container");
    if (regContainer) {
      regContainer.innerHTML = "";
      google.accounts.id.renderButton(regContainer, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 380,
      });
    }

    // 4. Initialize OAuth2 Token Client for fallback button clicks
    if (google.accounts.oauth2) {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: handleGoogleTokenResponse,
      });
    }

    googleAuthInitialized = true;
  } catch (err) {
    console.error("Google Auth initialization error:", err);
    // Show fallback buttons if GIS render had any constraint issue
    const customLoginBtn = document.getElementById("google-login-custom-btn");
    if (customLoginBtn) customLoginBtn.classList.remove("hidden");
    const customRegBtn = document.getElementById("google-register-custom-btn");
    if (customRegBtn) customRegBtn.classList.remove("hidden");
  }
}

/**
 * Trigger Google Login manually
 */
function triggerGoogleLogin() {
  if (googleTokenClient) {
    googleTokenClient.requestAccessToken();
  } else if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.prompt();
  } else {
    showToast("Connecting to Google Services...", "info");
    initGoogleAuth();
  }
}

/**
 * Handle Google ID Token Credential Response
 */
async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showToast("Google sign in was cancelled or failed", "error");
    return;
  }
  await processGoogleAuthPayload(response.credential);
}

/**
 * Handle Google OAuth2 Access Token Response
 */
async function handleGoogleTokenResponse(tokenResponse) {
  if (!tokenResponse || !tokenResponse.access_token) {
    showToast("Google sign in was cancelled or failed", "error");
    return;
  }
  await processGoogleAuthPayload(tokenResponse.access_token);
}

/**
 * Send Token to Rhynia Backend for Authentication / Registration
 */
async function processGoogleAuthPayload(tokenOrCredential) {
  showToast("Signing in with Google...", "info");

  try {
    const res = await fetch(`${CONFIG.API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: tokenOrCredential }),
    });

    const data = await res.json();
    if (!res.ok) {
      let errMsg = "Google authentication failed";
      if (typeof data.detail === "string") {
        errMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errMsg = data.detail.map(e => e.msg || e.detail).join(", ");
      }
      throw new Error(errMsg);
    }

    AppState.token = data.access_token;
    localStorage.setItem(CONFIG.TOKEN_KEY, data.access_token);

    if (data.user) {
      AppState.user = data.user;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    }

    // Check if phone number is required (MANDATORY for all accounts)
    if (data.needs_phone || !data.user || !data.user.phone_number) {
      const modal = document.getElementById("modal-google-phone");
      if (modal) {
        modal.classList.remove("hidden");
        const phoneInput = document.getElementById("google-phone-input");
        if (phoneInput) phoneInput.focus();
        showToast("Mobile number is mandatory. Please enter your 10-digit number.", "info");
        return;
      }
    }

    showToast(`Welcome ${data.user?.display_name || "to Rhynia"}!`, "success");
    await initializeWorkspace();

  } catch (err) {
    console.error("Google authentication error:", err);
    showToast(err.message || "Google sign in failed", "error");
  }
}

/**
 * Handle Mandatory Phone Submission for Google Sign-In
 */
async function submitGooglePhoneNumber(event) {
  event.preventDefault();
  const phoneInput = document.getElementById("google-phone-input");
  const submitBtn = document.getElementById("btn-submit-google-phone");
  const phone = phoneInput ? phoneInput.value.trim() : "";

  const rawDigits = phone.replace(/\D/g, "");
  if (rawDigits.length < 10) {
    showToast("Please enter a valid 10-digit mobile number", "error");
    if (phoneInput) phoneInput.focus();
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Saving Number...</span>`;
    }

    const res = await fetch(`${CONFIG.API_BASE}/auth/set-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AppState.token}`
      },
      body: JSON.stringify({ phone_number: rawDigits.slice(-10) })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to save mobile number");
    }

    if (AppState.user) {
      AppState.user.phone_number = data.phone_number;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(AppState.user));
    }

    const modal = document.getElementById("modal-google-phone");
    if (modal) modal.classList.add("hidden");

    showToast("Mobile number registered successfully! Welcome to Rhynia.", "success");
    await initializeWorkspace();

  } catch (err) {
    showToast(err.message || "Failed to set mobile number", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Complete Sign In</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  }
}

window.submitGooglePhoneNumber = submitGooglePhoneNumber;

// Initialize OTP slot listeners, Google Auth and countdown on page load
document.addEventListener("DOMContentLoaded", () => {
  setupOtpSlotInputs("sms");
  setupOtpSlotInputs("email");
  startCountdownTimer("sms");
  startCountdownTimer("email");
  initGoogleAuth();
});

