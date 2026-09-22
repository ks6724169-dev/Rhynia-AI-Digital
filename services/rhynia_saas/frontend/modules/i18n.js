/**
 * Rhynia Intelligence - Internationalization (i18n) Engine
 * Supports 22 Official Indian Languages + 20 Famous Global Languages (Total 42 Languages)
 * Provides dynamic live DOM translation, RTL support, category filter tabs, search, and persistent state.
 */

const RHYNIA_LANGUAGES = [
  // --- 🇮🇳 22 OFFICIAL INDIAN LANGUAGES (8th Schedule of Constitution) ---
  { code: "hi", name: "हिन्दी", englishName: "Hindi", region: "india", rtl: false },
  { code: "bn", name: "বাংলা", englishName: "Bengali", region: "india", rtl: false },
  { code: "te", name: "తెలుగు", englishName: "Telugu", region: "india", rtl: false },
  { code: "mr", name: "मराठी", englishName: "Marathi", region: "india", rtl: false },
  { code: "ta", name: "தமிழ்", englishName: "Tamil", region: "india", rtl: false },
  { code: "ur", name: "اردو", englishName: "Urdu", region: "india", rtl: true },
  { code: "gu", name: "ગુજરાતી", englishName: "Gujarati", region: "india", rtl: false },
  { code: "kn", name: "ಕನ್ನಡ", englishName: "Kannada", region: "india", rtl: false },
  { code: "or", name: "ଓଡ଼ିଆ", englishName: "Odia", region: "india", rtl: false },
  { code: "ml", name: "മലയാളം", englishName: "Malayalam", region: "india", rtl: false },
  { code: "pa", name: "ਪੰਜਾਬੀ", englishName: "Punjabi", region: "india", rtl: false },
  { code: "as", name: "অসমীয়া", englishName: "Assamese", region: "india", rtl: false },
  { code: "mai", name: "मैथिली", englishName: "Maithili", region: "india", rtl: false },
  { code: "sat", name: "ᱥᱟᱱᱛᱟᱲᱤ", englishName: "Santali", region: "india", rtl: false },
  { code: "ks", name: "کٲشُر", englishName: "Kashmiri", region: "india", rtl: true },
  { code: "ne", name: "नेपाली", englishName: "Nepali", region: "india", rtl: false },
  { code: "kok", name: "कोंकणी", englishName: "Konkani", region: "india", rtl: false },
  { code: "sd", name: "سنڌي", englishName: "Sindhi", region: "india", rtl: true },
  { code: "doi", name: "डोगरी", englishName: "Dogri", region: "india", rtl: false },
  { code: "brx", name: "बर'", englishName: "Bodo", region: "india", rtl: false },
  { code: "mni", name: "মৈতৈলোন্", englishName: "Manipuri", region: "india", rtl: false },
  { code: "sa", name: "संस्कृतम्", englishName: "Sanskrit", region: "india", rtl: false },

  // --- 🌍 20 FAMOUS WORLD LANGUAGES ---
  { code: "en", name: "English", englishName: "English (US)", region: "global", rtl: false },
  { code: "es", name: "Español", englishName: "Spanish", region: "global", rtl: false },
  { code: "zh", name: "简体中文", englishName: "Chinese (Simplified)", region: "global", rtl: false },
  { code: "fr", name: "Français", englishName: "French", region: "global", rtl: false },
  { code: "ar", name: "العربية", englishName: "Arabic", region: "global", rtl: true },
  { code: "ru", name: "Русский", englishName: "Russian", region: "global", rtl: false },
  { code: "pt", name: "Português", englishName: "Portuguese", region: "global", rtl: false },
  { code: "de", name: "Deutsch", englishName: "German", region: "global", rtl: false },
  { code: "ja", name: "日本語", englishName: "Japanese", region: "global", rtl: false },
  { code: "ko", name: "한국어", englishName: "Korean", region: "global", rtl: false },
  { code: "it", name: "Italiano", englishName: "Italian", region: "global", rtl: false },
  { code: "tr", name: "Türkçe", englishName: "Turkish", region: "global", rtl: false },
  { code: "vi", name: "Tiếng Việt", englishName: "Vietnamese", region: "global", rtl: false },
  { code: "fa", name: "فارسی", englishName: "Persian", region: "global", rtl: true },
  { code: "pl", name: "Polski", englishName: "Polish", region: "global", rtl: false },
  { code: "nl", name: "Nederlands", englishName: "Dutch", region: "global", rtl: false },
  { code: "th", name: "ไทย", englishName: "Thai", region: "global", rtl: false },
  { code: "id", name: "Bahasa Indonesia", englishName: "Indonesian", region: "global", rtl: false },
  { code: "el", name: "Ελληνικά", englishName: "Greek", region: "global", rtl: false },
  { code: "sv", name: "Svenska", englishName: "Swedish", region: "global", rtl: false }
];

// Comprehensive Translations Dictionaries for UI strings
const RHYNIA_TRANSLATIONS = {
  // English (Default Master)
  en: {
    app_title: "Rhynia Intelligence",
    welcome_tagline: "Ready to assist with your research, engineering, and creative workflows.",
    ask_placeholder: "Ask anything or start a project...",
    new_chat: "New Chat",
    more_options: "More Options",
    share_chat: "Share Chat",
    pin_chat: "Pin Chat",
    delete_chat: "Delete Chat",
    search_conversations: "Search conversations...",
    pinned_chats: "Pinned",
    recent_chats: "Recent",
    settings: "Settings",
    appearance: "Appearance",
    dark_mode: "Dark Horizon",
    light_mode: "Light Canvas",
    switch_to_light: "Switch to Light",
    switch_to_dark: "Switch to Dark",
    accent_color: "Accent Color",
    accent_desc: "Theme highlights & glow",
    language: "Language",
    notifications: "Notifications",
    notifications_desc: "Push alerts for updates",
    free_storage: "Free Storage",
    threads: "Threads",
    media: "Media",
    free: "Free",
    logout: "Log Out",
    edit_profile: "Edit Profile",
    save_changes: "Save Changes",
    cancel: "Cancel",
    display_name: "Display Name",
    username: "Username",
    email_address: "Email Address",
    password: "Password",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    create_account: "Create your account",
    create_account_desc: "Join Rhynia to empower your intelligence and workflows",
    forgot_password: "Forgot password?",
    reset_password: "Reset Password",
    reset_password_desc: "Enter your registered email address or mobile number to receive password reset instructions.",
    send_reset_code: "Send Reset Code",
    remember_password: "Remember your password?",
    dont_have_account: "Don't have an account?",
    already_have_account: "Already have an account?",
    or_continue_with: "OR CONTINUE WITH",
    continue_google: "Continue with Google",
    continue_phone: "Continue with Mobile Number",
    camera_capture: "Camera Capture",
    device_file_manager: "Device File Manager",
    lang_changed: "Language set to {lang}",
    search_language: "Search 42 languages...",
    all_tab: "All (42)",
    indian_tab: "🇮🇳 Indian (22)",
    global_tab: "🌍 Global (20)",
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
    feedback_submitted_toast: "Thank you! Your feedback has been recorded.",
    feedback_info_title: "Feedback & Data Privacy",
    feedback_info_usage_head: "🎯 How is feedback used?",
    feedback_info_usage_text: "Your feedback is used directly to improve Rhynia AI's model accuracy, speed, and response quality.",
    feedback_info_privacy_head: "🔒 Privacy & Security:",
    feedback_info_privacy_text: "Your privacy is 100% protected and encrypted. Your data is never sold or shared with any third party."
  },

  // 1. Hindi (हिन्दी)
  hi: {
    app_title: "राइनिया इंटेलिजेंस",
    welcome_tagline: "आपके शोध, इंजीनियरिंग और रचनात्मक कार्यों में सहायता के लिए तत्पर।",
    ask_placeholder: "कुछ भी पूछें या नया प्रोजेक्ट शुरू करें...",
    new_chat: "नई चैट",
    more_options: "अधिक विकल्प",
    share_chat: "चैट साझा करें",
    pin_chat: "चैट पिन करें",
    delete_chat: "चैट हटाएं",
    search_conversations: "बातचीत खोजें...",
    pinned_chats: "पिन की गई",
    recent_chats: "हालिया चैट",
    settings: "सेटिंग्स",
    appearance: "दिखावट (थीम)",
    dark_mode: "डार्क मोड",
    light_mode: "लाइट मोड",
    switch_to_light: "लाइट मोड चालू करें",
    switch_to_dark: "डार्क मोड चालू करें",
    accent_color: "एक्सेंट रंग",
    accent_desc: "थीम हाइलाइट्स और चमक",
    language: "भाषा (Language)",
    notifications: "सूचनाएं (Notifications)",
    notifications_desc: "अपडेट के लिए अलर्ट",
    free_storage: "निःशुल्क स्टोरेज",
    threads: "थ्रेड्स",
    media: "मीडिया",
    free: "खाली",
    logout: "लॉग आउट",
    edit_profile: "प्रोफ़ाइल संपादित करें",
    save_changes: "परिवर्तन सहेजें",
    cancel: "रद्द करें",
    display_name: "नाम",
    username: "यूज़रनेम",
    email_address: "ईमेल पता",
    password: "पासवर्ड",
    sign_in: "साइन इन करें",
    sign_up: "खाता बनाएं",
    create_account: "अपना खाता बनाएं",
    create_account_desc: "अपनी बुद्धिमत्ता और कार्यक्षमता को बढ़ाने के लिए राइनिया से जुड़ें",
    forgot_password: "पासवर्ड भूल गए?",
    reset_password: "पासवर्ड रीसेट करें",
    reset_password_desc: "पासवर्ड रीसेट निर्देश प्राप्त करने के लिए अपना ईमेल या मोबाइल नंबर दर्ज करें।",
    send_reset_code: "रीसेट कोड भेजें",
    remember_password: "क्या पासवर्ड याद आ गया?",
    dont_have_account: "खाता नहीं है?",
    already_have_account: "पहले से खाता है?",
    or_continue_with: "या इसके साथ जारी रखें",
    continue_google: "गूगल के साथ जारी रखें",
    continue_phone: "मोबाइल नंबर के साथ जारी रखें",
    camera_capture: "कैमरा फोटो लें",
    device_file_manager: "फ़ाइल मैनेजर खोलें",
    lang_changed: "भाषा बदलकर {lang} की गई",
    search_language: "42 भाषाएं खोजें...",
    all_tab: "सभी (42)",
    indian_tab: "🇮🇳 भारतीय भाषाएं (22)",
    global_tab: "🌍 विश्व भाषाएं (20)",
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
    feedback_submitted_toast: "धन्यवाद! आपका फ़ीडबैक सबमिट हो गया है।",
    feedback_info_title: "फ़ीडबैक और डेटा सुरक्षा",
    feedback_info_usage_head: "🎯 फ़ीडबैक का क्या उपयोग होगा?",
    feedback_info_usage_text: "आपके द्वारा दिए गए फ़ीडबैक का उपयोग Rhynia AI के मॉडल को और अधिक सटीक, मददगार और बेहतर बनाने के लिए किया जाता है।",
    feedback_info_privacy_head: "🔒 डेटा प्राइवेसी और सुरक्षा:",
    feedback_info_privacy_text: "आपकी प्राइवेसी 100% सुरक्षित और एन्क्रिप्टेड है। यह डेटा कभी किसी तीसरे पक्ष (third-party) को नहीं बेचा या साझा नहीं किया जाता।"
  },

  // 2. Bengali (বাংলা)
  bn: {
    app_title: "রাইনিয়া ইন্টেলিজেন্স",
    welcome_tagline: "আপনার গবেষণা, ইঞ্জিনিয়ারিং এবং সৃজনশীল কাজে সহায়তার জন্য প্রস্তুত।",
    ask_placeholder: "যেকোনো কিছু জিজ্ঞাসা করুন বা প্রজেক্ট শুরু করুন...",
    new_chat: "নতুন চ্যাট",
    more_options: "আরও বিকল্প",
    share_chat: "চ্যাট শেয়ার করুন",
    pin_chat: "পিন চ্যাট",
    delete_chat: "চ্যাট মুছুন",
    search_conversations: "কথোপকথন খুঁজুন...",
    pinned_chats: "পিন করা",
    recent_chats: "সাম্প্রতিক চ্যাট",
    settings: "সেটিংস",
    appearance: "চেহারা (থিম)",
    dark_mode: "ডার্ক মোড",
    light_mode: "লাইট মোড",
    switch_to_light: "লাইট মোডে যান",
    switch_to_dark: "ডার্ক মোডে যান",
    accent_color: "অ্যাকসেন্ট রঙ",
    accent_desc: "থিম হাইলাইটস এবং আভা",
    language: "ভাষা (Language)",
    notifications: "বিজ্ঞপ্তি",
    notifications_desc: "আপডেটের জন্য পুশ সতর্কতা",
    free_storage: "বিনামূল্যে সঞ্চয়স্থান",
    threads: "থ্রেড",
    media: "মিডিয়া",
    free: "খালি",
    logout: "লগ আউট",
    edit_profile: "প্রোফাইল সম্পাদনা করুন",
    save_changes: "সংরক্ষণ করুন",
    cancel: "বাতিল",
    display_name: "নাম",
    username: "ইউজারনেম",
    email_address: "ইমেল ঠিকানা",
    password: "পাসওয়ার্ড",
    sign_in: "সাইন ইন",
    sign_up: "নিবন্ধন করুন",
    create_account: "আপনার অ্যাকাউন্ট তৈরি করুন",
    create_account_desc: "রাইনিয়ার সাথে যুক্ত হয়ে আপনার সৃজনশীলতাকে এগিয়ে নিন",
    forgot_password: "পাসওয়ার্ড ভুলে গেছেন?",
    reset_password: "পাসওয়ার্ড রিসেট করুন",
    reset_password_desc: "পাসওয়ার্ড রিসেট কোড পেতে ইমেল বা মোবাইল নম্বর দিন।",
    send_reset_code: "রিসেট কোড পাঠান",
    remember_password: "পাসওয়ার্ড মনে পড়েছে?",
    dont_have_account: "অ্যাকাউন্ট নেই?",
    already_have_account: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    or_continue_with: "অথবা এর মাধ্যমে চালিয়ে যান",
    continue_google: "গুগল দিয়ে চালিয়ে যান",
    continue_phone: "মোবাইল নম্বর দিয়ে চালিয়ে যান",
    camera_capture: "ক্যামেরা ছবি তুলুন",
    device_file_manager: "ফাইল ম্যানেজার",
    lang_changed: "ভাষা পরিবর্তন করে {lang} করা হয়েছে",
    search_language: "৪২টি ভাষা অনুসন্ধান করুন...",
    all_tab: "সব (৪২)",
    indian_tab: "🇮🇳 ভারতীয় ভাষা (২২)",
    global_tab: "🌍 বৈশ্বিক ভাষা (২০)"
  },

  // 3. Telugu (తెలుగు)
  te: {
    app_title: "రైనియా ఇంటెలిజెన్స్",
    welcome_tagline: "మీ పరిశోధన, ఇంజనీరింగ్ మరియు సృజనాత్మక పనులకు సహాయం చేయడానికి సిద్ధంగా ఉంది.",
    ask_placeholder: "ఏదైనా అడగండి లేదా ప్రాజెక్ట్ ప్రారంభించండి...",
    new_chat: "కొత్త చాట్",
    more_options: "మరిన్ని ఎంపికలు",
    share_chat: "చాట్ షేర్ చేయండి",
    pin_chat: "పిన్ చేయండి",
    delete_chat: "తొలగించండి",
    search_conversations: "సంభాషణలను శోధించండి...",
    pinned_chats: "పిన్ చేసినవి",
    recent_chats: "ఇటీవలి చాట్‌లు",
    settings: "సెట్టింగ్‌లు",
    appearance: "థీమ్ రూపురేఖలు",
    dark_mode: "డార్క్ మోడ్",
    light_mode: "లైట్ మోడ్",
    switch_to_light: "లైట్ మోడ్ కి మారండి",
    switch_to_dark: "డార్క్ మోడ్ కి మారండి",
    accent_color: "యాస రంగు (Accent Color)",
    accent_desc: "థీమ్ హైలైట్‌లు మరియు గ్లో",
    language: "భాష (Language)",
    notifications: "నోటిఫికేషన్‌లు",
    notifications_desc: "నవీకరణల కోసం హెచ్చరికలు",
    free_storage: "ఉచిత నిల్వ",
    threads: "థ్రెడ్‌లు",
    media: "మీడియా",
    free: "మిగిలినది",
    logout: "లాగ్ అవుట్",
    edit_profile: "ప్రొఫైల్ సవరించండి",
    save_changes: "మార్పులను సేవ్ చేయండి",
    cancel: "రద్దు చేయండి",
    display_name: "పేరు",
    username: "యూజర్‌నేమ్",
    email_address: "ఇమెయిల్ చిరునామా",
    password: "పాస్‌వర్డ్",
    sign_in: "సైన్ ఇన్",
    sign_up: "ఖాతా సృష్టించండి",
    create_account: "ఖాతాను సృష్టించండి",
    create_account_desc: "రైనియాతో చేరి మీ సామర్థ్యాన్ని పెంచుకోండి",
    forgot_password: "పాస్‌వర్డ్ మర్చిపోయారా?",
    reset_password: "పాస్‌వర్డ్ రీసెట్ చేయండి",
    reset_password_desc: "రీసెట్ సూచనల కోసం మీ ఇమెయిల్ లేదా ఫోన్ నంబర్‌ను నమోదు చేయండి.",
    send_reset_code: "రీసెట్ కోడ్ పంపండి",
    remember_password: "పాస్‌వర్డ్ గుర్తుందా?",
    dont_have_account: "ఖాతా లేదా?",
    already_have_account: "ఇప్పటికే ఖాతా ఉందా?",
    or_continue_with: "లేదా వీటితో కొనసాగించండి",
    continue_google: "గూగుల్ తో కొనసాగించండి",
    continue_phone: "మొబైల్ తో కొనసాగించండి",
    camera_capture: "కెమెరా ఫోటో",
    device_file_manager: "ఫైల్ మేనేజర్",
    lang_changed: "భాష {lang} కు మార్చబడింది",
    search_language: "42 భాషలను శోధించండి...",
    all_tab: "అన్నీ (42)",
    indian_tab: "🇮🇳 భారతీయ భాషలు (22)",
    global_tab: "🌍 ప్రపంచ భాషలు (20)"
  },

  // 4. Marathi (मराठी)
  mr: {
    app_title: "रायनिया इंटेलिजन्स",
    welcome_tagline: "तुमच्या संशोधन, अभियांत्रिकी आणि सर्जनशील कामांमध्ये मदत करण्यास सज्ज.",
    ask_placeholder: "काहीही विचारा किंवा नवीन प्रोजेक्ट सुरू करा...",
    new_chat: "नवीन चॅट",
    more_options: "अधिक पर्याय",
    share_chat: "चॅट शेअर करा",
    pin_chat: "चॅट पिन करा",
    delete_chat: "चॅट हटवा",
    search_conversations: "संभाषणे शोधा...",
    pinned_chats: "पिन केलेले",
    recent_chats: "अलीकडील चॅट्स",
    settings: "सेटिंग्ज",
    appearance: "दिसणे (थीम)",
    dark_mode: "डार्क मोड",
    light_mode: "लाइट मोड",
    switch_to_light: "लाइट मोड निवडा",
    switch_to_dark: "डार्क मोड निवडा",
    accent_color: "अ‍ॅक्सेंट रंग",
    accent_desc: "थीम हायलाइट्स आणि चमक",
    language: "भाषा (Language)",
    notifications: "सूचना (Notifications)",
    notifications_desc: "अपडेट्ससाठी सूचना",
    free_storage: "मोफत स्टोरेज",
    threads: "थ्रेड्स",
    media: "मीडिया",
    free: "शिल्लक",
    logout: "लॉग आउट",
    edit_profile: "प्रोफाइल संपादित करा",
    save_changes: "बदल जतन करा",
    cancel: "रद्द करा",
    display_name: "नाव",
    username: "वापरकर्तानाव",
    email_address: "ईमेल पत्ता",
    password: "पासवर्ड",
    sign_in: "साइन इन करा",
    sign_up: "साइन अप करा",
    create_account: "आपले खाते तयार करा",
    create_account_desc: "आपली बुद्धिमत्ता वाढवण्यासाठी रायनियामध्ये सामील व्हा",
    forgot_password: "पासवर्ड विसरलात?",
    reset_password: "पासवर्ड रीसेट करा",
    reset_password_desc: "पासवर्ड रीसेट करण्यासाठी नोंदणीकृत ईमेल किंवा मोबाइल नंबर टाका.",
    send_reset_code: "रीसेट कोड पाठवा",
    remember_password: "पासवर्ड आठवला?",
    dont_have_account: "खाते नाही आहे?",
    already_have_account: "आधीच खाते आहे?",
    or_continue_with: "किंवा यासह पुढे जा",
    continue_google: "Google सह पुढे जा",
    continue_phone: "मोबाइल नंबरसह पुढे जा",
    camera_capture: "कॅमेरा फोटो घ्या",
    device_file_manager: "फाइल व्यवस्थापक",
    lang_changed: "भाषा {lang} वर सेट केली",
    search_language: "४२ भाषा शोधा...",
    all_tab: "सर्व (४२)",
    indian_tab: "🇮🇳 भारतीय भाषा (२२)",
    global_tab: "🌍 जागतिक भाषा (२०)"
  },

  // 5. Tamil (தமிழ்)
  ta: {
    app_title: "ரைனியா நுண்ணறிவு",
    welcome_tagline: "உங்கள் ஆராய்ச்சி மற்றும் படைப்பு பணிகளுக்கு உதவ தயாராக உள்ளது.",
    ask_placeholder: "எதையும் கேளுங்கள் அல்லது ஒரு திட்டத்தைத் தொடங்குங்கள்...",
    new_chat: "புதிய அரட்டை",
    more_options: "கூடுதல் விருப்பங்கள்",
    share_chat: "பகிரவும்",
    pin_chat: "பின் செய்யவும்",
    delete_chat: "நீக்கு",
    search_conversations: "உரையாடல்களைத் தேடுங்கள்...",
    pinned_chats: "பின் செய்யப்பட்டவை",
    recent_chats: "சமீபத்தியவை",
    settings: "அமைப்புகள்",
    appearance: "தோற்றம் (தீம்)",
    dark_mode: "டார்க் பயன்முறை",
    light_mode: "லைட் பயன்முறை",
    switch_to_light: "லைட் பயன்முறைக்கு மாறவும்",
    switch_to_dark: "டார்க் பயன்முறைக்கு மாறவும்",
    accent_color: "முக்கிய வண்ணம்",
    accent_desc: "தீம் சிறப்பம்சங்கள் மற்றும் ஒளி",
    language: "மொழி (Language)",
    notifications: "அறிவிப்புகள்",
    notifications_desc: "புதுப்பிப்புகளுக்கான விழிப்பூட்டல்கள்",
    free_storage: "இலவச சேமிப்பு",
    threads: "நூல்கள்",
    media: "ஊடகம்",
    free: "இலவசம்",
    logout: "வெளியேறு",
    edit_profile: "சுயவிவரத்தைத் திருத்து",
    save_changes: "சேமிக்கவும்",
    cancel: "ரத்து செய்",
    display_name: "பெயர்",
    username: "பயனர்பெயர்",
    email_address: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    sign_in: "உள்நுழைக",
    sign_up: "பதிவு செய்க",
    create_account: "கணக்கை உருவாக்கவும்",
    create_account_desc: "ரைனியாவுடன் இணைந்து உங்கள் அறிவை விரிவுபடுத்துங்கள்",
    forgot_password: "கடவுச்சொல் மறந்துவிட்டதா?",
    reset_password: "கடவுச்சொல்லை மீட்டமைக்கவும்",
    reset_password_desc: "வழிமுறைகளைப் பெற உங்கள் மின்னஞ்சல் அல்லது தொலைபேசியை உள்ளிடவும்.",
    send_reset_code: "குறியீட்டை அனுப்பு",
    remember_password: "கடவுச்சொல் நினைவிருக்கிறதா?",
    dont_have_account: "கணக்கு இல்லையா?",
    already_have_account: "ஏற்கனவே கணக்கு உள்ளதா?",
    or_continue_with: "அல்லது இவற்றுடன் தொடரவும்",
    continue_google: "கூகிள் மூலம் தொடரவும்",
    continue_phone: "கைபேசி எண் மூலம் தொடரவும்",
    camera_capture: "புகைப்படம் எடு",
    device_file_manager: "கோப்பு மேலாளர்",
    lang_changed: "மொழி {lang} ஆக மாற்றப்பட்டது",
    search_language: "42 மொழிகளில் தேடுங்கள்...",
    all_tab: "அனைத்தும் (42)",
    indian_tab: "🇮🇳 இந்திய மொழிகள் (22)",
    global_tab: "🌍 உலக மொழிகள் (20)"
  },

  // 6. Urdu (اردو - RTL)
  ur: {
    app_title: "رائنیا انٹیلی جنس",
    welcome_tagline: "آپ کی تحقیق، انجینئرنگ اور تخلیقی ورک فلو میں مدد کے لیے تیار۔",
    ask_placeholder: "کچھ بھی پوچھیں یا نیا پروجیکٹ شروع کریں...",
    new_chat: "نئی چیٹ",
    more_options: "مزید اختیارات",
    share_chat: "چیٹ شیئر کریں",
    pin_chat: "چیٹ پن کریں",
    delete_chat: "چیٹ ڈیلیٹ کریں",
    search_conversations: "گفتگو تلاش کریں...",
    pinned_chats: "پن کی گئی چیٹس",
    recent_chats: "حالیہ چیٹس",
    settings: "ترتیبات (Settings)",
    appearance: "ظاہری شکل (Theme)",
    dark_mode: "ڈارک موڈ",
    light_mode: "لائٹ موڈ",
    switch_to_light: "لائٹ موڈ منتخب کریں",
    switch_to_dark: "ڈارک موڈ منتخب کریں",
    accent_color: "لہجہ رنگ (Accent Color)",
    accent_desc: "تھیم کی جھلکیاں اور چمک",
    language: "زبان (Language)",
    notifications: "اطلاعات (Notifications)",
    notifications_desc: "تازہ ترین الرٹس",
    free_storage: "مفت اسٹوریج",
    threads: "تھریڈز",
    media: "میڈیا",
    free: "خالی",
    logout: "لاگ آؤٹ",
    edit_profile: "پروفائل تبدیل کریں",
    save_changes: "تبدیلیاں محفوظ کریں",
    cancel: "منسوخ کریں",
    display_name: "نام",
    username: "صارف نام",
    email_address: "ای میل ایڈریس",
    password: "پاس ورڈ",
    sign_in: "سائن ان کریں",
    sign_up: "اکاؤنٹ بنائیں",
    create_account: "اپنا اکاؤنٹ بنائیں",
    create_account_desc: "اپنی ذہانت اور صلاحیتوں کو بڑھانے کے لیے رائنیا میں شامل ہوں",
    forgot_password: "پاس ورڈ بھول گئے؟",
    reset_password: "پاس ورڈ دوبارہ ترتیب دیں",
    reset_password_desc: "ہدایات حاصل کرنے کے لیے اپنا رجسٹرڈ ای میل یا موبائل نمبر درج کریں۔",
    send_reset_code: "ری سیٹ کوڈ بھیجیں",
    remember_password: "پاس ورڈ یاد آگیا؟",
    dont_have_account: "کیا آپ کا اکاؤنٹ نہیں ہے؟",
    already_have_account: "پہلے سے اکاؤنٹ ہے؟",
    or_continue_with: "یا اس کے ساتھ جاری رکھیں",
    continue_google: "گوگل کے ساتھ جاری رکھیں",
    continue_phone: "موبائل نمبر کے ساتھ جاری رکھیں",
    camera_capture: "کیمرہ تصویر لیں",
    device_file_manager: "فائل مینیجر",
    lang_changed: "زبان {lang} پر سیٹ کر دی گئی",
    search_language: "42 زبانیں تلاش کریں...",
    all_tab: "تمام (42)",
    indian_tab: "🇮🇳 ہندوستانی زبانیں (22)",
    global_tab: "🌍 عالمی زبانیں (20)"
  },

  // 7. Gujarati (ગુજરાતી)
  gu: {
    app_title: "રાયનિયા ઇન્ટેલિજન્સ",
    welcome_tagline: "તમારા સંશોધન, એન્જિનિયરિંગ અને સર્જનાત્મક કાર્યોમાં સહાય માટે તૈયાર.",
    ask_placeholder: "કંઈપણ પૂછો અથવા નવો પ્રોજેક્ટ શરૂ કરો...",
    new_chat: "નવી ચેટ",
    more_options: "વધુ વિકલ્પો",
    share_chat: "ચેટ શેર કરો",
    pin_chat: "પિન કરો",
    delete_chat: "કાઢી નાખો",
    search_conversations: "વાતચીત શોધો...",
    pinned_chats: "પિન કરેલ",
    recent_chats: "તાજેતરની ચેટ",
    settings: "સેટિંગ્સ",
    appearance: "દેખાવ (થીમ)",
    dark_mode: "ડાર્ક મોડ",
    light_mode: "લાઇટ મોડ",
    switch_to_light: "લાઇટ મોડ પર સ્વિચ કરો",
    switch_to_dark: "ડાર્ક મોડ પર સ્વિચ કરો",
    accent_color: "એક્સેન્ટ રંગ",
    accent_desc: "થીમ હાઇલાઇટ્સ અને ચમક",
    language: "ભાષા (Language)",
    notifications: "સૂચનાઓ",
    notifications_desc: "અપડેટ્સ માટે ચેતવણીઓ",
    free_storage: "મફત સ્ટોરેજ",
    threads: "થ્રેડો",
    media: "મીડિયા",
    free: "ખાલી",
    logout: "લૉગ આઉટ",
    edit_profile: "પ્રોફાઇલ સંપાદિત કરો",
    save_changes: "ફેરફારો સાચવો",
    cancel: "રદ કરો",
    display_name: "નામ",
    username: "વપરાશકર્તા નામ",
    email_address: "ઇમેઇલ સરનામું",
    password: "પાસવર્ડ",
    sign_in: "સાઇન ઇન કરો",
    sign_up: "સાઇન અપ કરો",
    create_account: "તમારું એકાઉન્ટ બનાવો",
    create_account_desc: "તમારી ક્ષમતા વધારવા માટે રાયનિયા સાથે જોડાઓ",
    forgot_password: "પાસવર્ડ ભૂલી ગયા છો?",
    reset_password: "પાસવર્ડ રીસેટ કરો",
    reset_password_desc: "રીસેટ સૂચનાઓ માટે નોંધાયેલ ઇમેઇલ દાખલ કરો.",
    send_reset_code: "રીસેટ કોડ મોકલો",
    remember_password: "પાસવર્ડ યાદ છે?",
    dont_have_account: "એકાઉન્ટ નથી?",
    already_have_account: "પહેલેથી એકાઉન્ટ છે?",
    or_continue_with: "અથવા આની સાથે ચાલુ રાખો",
    continue_google: "Google સાથે ચાલુ રાખો",
    continue_phone: "મોબાઇલ નંબર સાથે ચાલુ રાખો",
    camera_capture: "કેમેરા ફોટો લો",
    device_file_manager: "ફાઇલ મેનેજર",
    lang_changed: "ભાષા {lang} પર સેટ થઈ",
    search_language: "42 ભાષાઓ શોધો...",
    all_tab: "બધા (42)",
    indian_tab: "🇮🇳 ભારતીય ભાષાઓ (22)",
    global_tab: "🌍 વૈશ્વિક ભાષાઓ (20)"
  },

  // 8. Kannada (ಕನ್ನಡ)
  kn: {
    app_title: "ರೈನಿಯಾ ಇಂಟೆಲಿಜೆನ್ಸ್",
    welcome_tagline: "ನಿಮ್ಮ ಸಂಶೋಧನೆ ಮತ್ತು ಸೃಜನಶೀಲ ಕೆಲಸಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ.",
    ask_placeholder: "ಏನನ್ನಾದರೂ ಕೇಳಿ ಅಥವಾ ಪ್ರಾಜೆಕ್ಟ್ ಪ್ರಾರಂಭಿಸಿ...",
    new_chat: "ಹೊಸ ಚಾಟ್",
    more_options: "ಹೆಚ್ಚಿನ ಆಯ್ಕೆಗಳು",
    share_chat: "ಚಾಟ್ ಹಂಚಿಕೊಳ್ಳಿ",
    pin_chat: "ಪಿನ್ ಮಾಡಿ",
    delete_chat: "ಅಳಿಸಿ",
    search_conversations: "ಸಂಭಾಷಣೆಗಳನ್ನು ಹುಡುಕಿ...",
    pinned_chats: "ಪಿನ್ ಮಾಡಿದವು",
    recent_chats: "ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳು",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    appearance: "ಗೋಚರತೆ (ಥೀಮ್)",
    dark_mode: "ಡಾರ್ಕ್ ಮೋಡ್",
    light_mode: "ಲೈಟ್ ಮೋಡ್",
    switch_to_light: "ಲೈಟ್ ಮೋಡ್ ಗೆ ಬದಲಾಯಿಸಿ",
    switch_to_dark: "ಡಾರ್ಕ್ ಮೋಡ್ ಗೆ ಬದಲಾಯಿಸಿ",
    accent_color: "ಆಕ್ಸೆಂಟ್ ಬಣ್ಣ",
    accent_desc: "ಥೀಮ್ ಮುಖ್ಯಾಂಶಗಳು ಮತ್ತು ಹೊಳಪು",
    language: "ಭಾಷೆ (Language)",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    notifications_desc: "ಅಪ್‌ಡೇಟ್‌ಗಳಿಗಾಗಿ ಎಚ್ಚರಿಕೆಗಳು",
    free_storage: "ಉಚಿತ ಸಂಗ್ರಹಣೆ",
    threads: "ಥ್ರೆಡ್‌ಗಳು",
    media: "ಮಾಧ್ಯಮ",
    free: "ಉಚಿತ",
    logout: "ಲಾಗ್ ಔಟ್",
    edit_profile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
    save_changes: "ಉಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    display_name: "ಹೆಸರು",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    email_address: "ಇಮೇಲ್ ವಿಳಾಸ",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    sign_in: "ಸೈನ್ ಇನ್",
    sign_up: "ಖಾತೆ ತೆರೆಯಿರಿ",
    create_account: "ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    create_account_desc: "ರೈನಿಯಾ ಜೊತೆ ಸೇರಿ ನಿಮ್ಮ ಸಾಮರ್ಥ್ಯವನ್ನು ಹೆಚ್ಚಿಸಿ",
    forgot_password: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",
    reset_password: "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
    reset_password_desc: "ಸೂಚನೆಗಳನ್ನು ಪಡೆಯಲು ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    send_reset_code: "ಕೋಡ್ ಕಳುಹಿಸಿ",
    remember_password: "ಪಾಸ್‌ವರ್ಡ್ ನೆನಪಿದೆಯೇ?",
    dont_have_account: "ಖಾತೆ ಇಲ್ಲವೇ?",
    already_have_account: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    or_continue_with: "ಅಥವಾ ಇದರೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    continue_google: "ಗೂಗಲ್ ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    continue_phone: "ಮೊಬೈಲ್ ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    camera_capture: "ಕ್ಯಾಮೆರಾ ಫೋಟೋ",
    device_file_manager: "ಫೈಲ್ ಮ್ಯಾನೇಜರ್",
    lang_changed: "ಭಾಷೆಯನ್ನು {lang} ಗೆ ಹೊಂದಿಸಲಾಗಿದೆ",
    search_language: "42 ಭಾಷೆಗಳನ್ನು ಹುಡುಕಿ...",
    all_tab: "ಎಲ್ಲಾ (42)",
    indian_tab: "🇮🇳 ಭಾರತೀಯ ಭಾಷೆಗಳು (22)",
    global_tab: "🌍 ಜಾಗತಿಕ ಭಾಷೆಗಳು (20)"
  },

  // 9. Odia (ଓଡ଼ିଆ)
  or: {
    app_title: "ରାଇନିଆ ଇଣ୍ଟେଲିଜେନ୍ସ",
    welcome_tagline: "ଆପଣଙ୍କ ଅନୁସନ୍ଧାନ ଏବଂ ସୃଜନଶୀଳ କାର୍ଯ୍ୟରେ ସାହାଯ୍ୟ କରିବାକୁ ପ୍ରସ୍ତୁତ।",
    ask_placeholder: "କିଛି ବି ପଚାରନ୍ତୁ କିମ୍ବା ନୂଆ ପ୍ରୋଜେକ୍ଟ ଆରମ୍ଭ କରନ୍ତୁ...",
    new_chat: "ନୂତନ ଚାଟ୍",
    more_options: "ଅଧିକ ବିକଳ୍ପ",
    share_chat: "ଚାଟ୍ ସେୟାର କରନ୍ତୁ",
    pin_chat: "ପିନ୍ କରନ୍ତୁ",
    delete_chat: "ଡିଲିଟ୍ କରନ୍ତୁ",
    search_conversations: "କଥାବାର୍ତ୍ତା ଖୋଜନ୍ତୁ...",
    pinned_chats: "ପିନ୍ ହୋଇଥିବା",
    recent_chats: "ସାମ୍ପ୍ରତିକ ଚାଟ୍",
    settings: "ସେଟିଙ୍ଗ୍ସ",
    appearance: "ଦୃଶ୍ୟ (ଥିମ୍)",
    dark_mode: "ଡାର୍କ ମୋଡ୍",
    light_mode: "ଲାଇଟ୍ ମୋଡ୍",
    switch_to_light: "ଲାଇଟ୍ ମୋଡ୍ ବାଛନ୍ତୁ",
    switch_to_dark: "ଡାର୍କ ମୋଡ୍ ବାଛନ୍ତୁ",
    accent_color: "ଏକ୍ସେଣ୍ଟ ରଙ୍ଗ",
    accent_desc: "ଥିମ୍ ହାଇଲାଇଟ୍ ଏବଂ ଉଜ୍ଜ୍ୱଳତା",
    language: "ଭାଷା (Language)",
    notifications: "ବିଜ୍ଞପ୍ତି",
    notifications_desc: "ଅପଡେଟ୍ ପାଇଁ ଆଲର୍ଟ",
    free_storage: "ମାଗଣା ଷ୍ଟୋରେଜ୍",
    threads: "ଥ୍ରେଡ୍ସ",
    media: "ମିଡ଼ିଆ",
    free: "ଖାଲି",
    logout: "ଲଗ୍ ଆଉଟ୍",
    edit_profile: "ପ୍ରୋଫାଇଲ୍ ସମ୍ପାଦନ କରନ୍ତୁ",
    save_changes: "ସେଭ୍ କରନ୍ତୁ",
    cancel: "ବାତିଲ କରନ୍ତୁ",
    display_name: "ନାମ",
    username: "ୟୁଜରନେମ୍",
    email_address: "ଇମେଲ ଠିକଣା",
    password: "ପାସୱାର୍ଡ",
    sign_in: "ସାଇନ୍ ଇନ୍",
    sign_up: "ଖାତା ଖୋଲନ୍ତୁ",
    create_account: "ଆପଣଙ୍କର ଖାତା ଖୋଲନ୍ତୁ",
    create_account_desc: "ରାଇନିଆ ସହିତ ଯୋଡି ହୋଇ ନିଜର ଦକ୍ଷତା ବଢାନ୍ତୁ",
    forgot_password: "ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?",
    reset_password: "ପାସୱାର୍ଡ ରିସେଟ୍ କରନ୍ତୁ",
    reset_password_desc: "ନିର୍ଦ୍ଦେଶ ପାଇବାକୁ ଇମେଲ୍ ପ୍ରବେଶ କରନ୍ତୁ।",
    send_reset_code: "କୋଡ୍ ପଠାନ୍ତୁ",
    remember_password: "ପାସୱାର୍ଡ ମନେ ପଡିଲା କି?",
    dont_have_account: "ଖାତା ନାହିଁ କି?",
    already_have_account: "ପୂର୍ବରୁ ଖାତା ଅଛି?",
    or_continue_with: "କିମ୍ବା ଏହା ସହିତ ଆଗକୁ ବଢନ୍ତୁ",
    continue_google: "ଗୁଗୁଲ୍ ସହିତ ଜାରି ରଖନ୍ତୁ",
    continue_phone: "ଫୋନ୍ ନମ୍ବର ସହିତ ଜାରି ରଖନ୍ତୁ",
    camera_capture: "କ୍ୟାମେରା ଫଟୋ",
    device_file_manager: "ଫାଇଲ୍ ମ୍ୟାନେଜର୍",
    lang_changed: "ଭାଷା {lang} କୁ ପରିବର୍ତ୍ତିତ ହେଲା",
    search_language: "୪୨ଟି ଭାଷା ଖୋଜନ୍ତୁ...",
    all_tab: "ସମସ୍ତ (୪୨)",
    indian_tab: "🇮🇳 ଭାରତୀୟ ଭାଷା (୨୨)",
    global_tab: "🌍 ବିଶ୍ୱ ଭାଷା (୨୦)"
  },

  // 10. Malayalam (മലയാളം)
  ml: {
    app_title: "റൈനിയ ഇന്റലിജൻസ്",
    welcome_tagline: "നിങ്ങളുടെ ഗവേഷണത്തിനും സൃഷ്ടിപരമായ പ്രവർത്തനങ്ങൾക്കും സഹായിക്കാൻ സജ്ജമാണ്.",
    ask_placeholder: "എന്തും ചോദിക്കൂ അല്ലെങ്കിൽ പ്രോജക്റ്റ് ആരംഭിക്കൂ...",
    new_chat: "പുതിയ ചാറ്റ്",
    more_options: "കൂടുതൽ ഓപ്ഷനുകൾ",
    share_chat: "പങ്കിടുക",
    pin_chat: "പിൻ ചെയ്യുക",
    delete_chat: "ഡിലീറ്റ് ചെയ്യുക",
    search_conversations: "സംഭാഷണങ്ങൾ തിരയുക...",
    pinned_chats: "പിൻ ചെയ്തവ",
    recent_chats: "സമീപകാല ചാറ്റുകൾ",
    settings: "ക്രമീകരണങ്ങൾ",
    appearance: "രൂപഭാവം (തീം)",
    dark_mode: "ഡാർക്ക് മോഡ്",
    light_mode: "ലൈറ്റ് മോഡ്",
    switch_to_light: "ലൈറ്റ് മോഡിലേക്ക് മാറുക",
    switch_to_dark: "ഡാർക്ക് മോഡിലേക്ക് മാറുക",
    accent_color: "ആക്സന്റ് നിറം",
    accent_desc: "തീം ഹൈലൈറ്റുകളും തിളക്കവും",
    language: "ഭാഷ (Language)",
    notifications: "അറിയിപ്പുകൾ",
    notifications_desc: "അപ്‌ഡേറ്റുകൾക്കായുള്ള അറിയിപ്പുകൾ",
    free_storage: "സൗജന്യ സ്റ്റോറേജ്",
    threads: "ത്രെഡുകൾ",
    media: "മീഡിയ",
    free: "ബാക്കി",
    logout: "ലോഗ് ഔട്ട്",
    edit_profile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
    save_changes: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    display_name: "പേര്",
    username: "ഉപയോക്തൃനാമം",
    email_address: "ഇമെയിൽ വിലാസം",
    password: "പാസ്‌വേഡ്",
    sign_in: "സൈൻ ഇൻ",
    sign_up: "രജിസ്റ്റർ ചെയ്യുക",
    create_account: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    create_account_desc: "റൈനിയയിൽ ചേർന്ന് നിങ്ങളുടെ കഴിവുകൾ വികസിപ്പിക്കുക",
    forgot_password: "പാസ്‌വേഡ് മറന്നോ?",
    reset_password: "പാസ്‌വേഡ് പുനഃസജ്ജമാക്കുക",
    reset_password_desc: "നിർദ്ദേശങ്ങൾ ലഭിക്കാൻ ഇമെയിൽ നൽകുക.",
    send_reset_code: "കോഡ് അയയ്ക്കുക",
    remember_password: "പാസ്‌വേഡ് ഓർമ്മയുണ്ടോ?",
    dont_have_account: "അക്കൗണ്ട് ഇല്ലേ?",
    already_have_account: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?",
    or_continue_with: "അല്ലെങ്കിൽ തുടരുക",
    continue_google: "Google വഴി തുടരുക",
    continue_phone: "മൊബൈൽ നമ്പർ വഴി തുടരുക",
    camera_capture: "ക്യാമറ ഫോട്ടോ എടുക്കുക",
    device_file_manager: "ഫയൽ മാനേജർ",
    lang_changed: "ഭാഷ {lang} ലേക്ക് മാറ്റി",
    search_language: "42 ഭാഷകൾ തിരയുക...",
    all_tab: "എല്ലാം (42)",
    indian_tab: "🇮🇳 ഇന്ത്യൻ ഭാഷകൾ (22)",
    global_tab: "🌍 ആഗോള ഭാഷകൾ (20)"
  },

  // 11. Punjabi (ਪੰਜਾਬੀ)
  pa: {
    app_title: "ਰਾਈਨੀਆ ਇੰਟੈਲੀਜੈਂਸ",
    welcome_tagline: "ਤੁਹਾਡੀ ਖੋਜ, ਇੰਜੀਨੀਅਰਿੰਗ ਅਤੇ ਸਿਰਜਣਾਤਮਕ ਕੰਮਾਂ ਵਿੱਚ ਸਹਾਇਤਾ ਲਈ ਤਿਆਰ।",
    ask_placeholder: "ਕੁਝ ਵੀ ਪੁੱਛੋ ਜਾਂ ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਸ਼ੁਰੂ ਕਰੋ...",
    new_chat: "ਨਵੀਂ ਗੱਲਬਾਤ",
    more_options: "ਹੋਰ ਵਿਕਲਪ",
    share_chat: "ਚੈਟ ਸਾਂਝੀ ਕਰੋ",
    pin_chat: "ਪਿੰਨ ਕਰੋ",
    delete_chat: "ਮਿਟਾਓ",
    search_conversations: "ਗੱਲਬਾਤ ਖੋਜੋ...",
    pinned_chats: "ਪਿੰਨ ਕੀਤੇ",
    recent_chats: "ਹਾਲੀਆ ਚੈਟਾਂ",
    settings: "ਸੈਟਿੰਗਾਂ",
    appearance: "ਦਿੱਖ (ਥੀਮ)",
    dark_mode: "ਡਾਰਕ ਮੋਡ",
    light_mode: "ਲਾਈਟ ਮੋਡ",
    switch_to_light: "ਲਾਈਟ ਮੋਡ ਚੁਣੋ",
    switch_to_dark: "ਡਾਰਕ ਮੋਡ ਚੁਣੋ",
    accent_color: "ਐਕਸੈਂਟ ਰੰਗ",
    accent_desc: "ਥੀਮ ਹਾਈਲਾਈਟਸ ਅਤੇ ਚਮਕ",
    language: "ਭਾਸ਼ਾ (Language)",
    notifications: "ਸੂਚਨਾਵਾਂ",
    notifications_desc: "ਅੱਪਡੇਟਾਂ ਲਈ ਚੇਤਾਵਨੀਆਂ",
    free_storage: "ਮੁਫ਼ਤ ਸਟੋਰੇਜ",
    threads: "ਥ੍ਰੈੱਡ",
    media: "ਮੀਡੀਆ",
    free: "ਬਾਕੀ",
    logout: "ਲਾਗ ਆਉਟ",
    edit_profile: "ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ",
    save_changes: "ਤਬਦੀਲੀਆਂ ਸੰਭਾਲੋ",
    cancel: "ਰੱਦ ਕਰੋ",
    display_name: "ਨਾਮ",
    username: "ਯੂਜ਼ਰਨੇਮ",
    email_address: "ਈਮੇਲ ਪਤਾ",
    password: "ਪਾਸਵਰਡ",
    sign_in: "ਸਾਈਨ ਇਨ",
    sign_up: "ਖਾਤਾ ਬਣਾਓ",
    create_account: "ਆਪਣਾ ਖਾਤਾ ਬਣਾਓ",
    create_account_desc: "ਆਪਣੀ ਕਾਰਜਕੁਸ਼ਲਤਾ ਵਧਾਉਣ ਲਈ ਰਾਈਨੀਆ ਨਾਲ ਜੁੜੋ",
    forgot_password: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?",
    reset_password: "ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰੋ",
    reset_password_desc: "ਹਦਾਇਤਾਂ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਈਮੇਲ ਦਰਜ ਕਰੋ।",
    send_reset_code: "ਰੀਸੈੱਟ ਕੋਡ ਭੇਜੋ",
    remember_password: "ਕੀ ਪਾਸਵਰਡ ਯਾਦ ਹੈ?",
    dont_have_account: "ਕੀ ਖਾਤਾ ਨਹੀਂ ਹੈ?",
    already_have_account: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?",
    or_continue_with: "ਜਾਂ ਇਸ ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    continue_google: "ਗੂਗਲ ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    continue_phone: "ਮੋਬਾਈਲ ਨੰਬਰ ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    camera_capture: "ਕੈਮਰਾ ਫੋਟੋ",
    device_file_manager: "ਫਾਈਲ ਮੈਨੇਜਰ",
    lang_changed: "ਭਾਸ਼ਾ {lang} ਤੇ ਸੈੱਟ ਕੀਤੀ ਗਈ",
    search_language: "42 ਭਾਸ਼ਾਵਾਂ ਖੋਜੋ...",
    all_tab: "ਸਾਰੇ (42)",
    indian_tab: "🇮🇳 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ (22)",
    global_tab: "🌍 ਵਿਸ਼ਵ ਭਾਸ਼ਾਵਾਂ (20)"
  },

  // 12. Assamese (অসমীয়া)
  as: {
    app_title: "ৰাইনিয়া ইন্টেলিজেন্স",
    welcome_tagline: "আপোনাৰ গৱেষণা আৰু সৃষ্টিশীল কামত সহায় কৰিবলৈ সাজু।",
    ask_placeholder: "যিকোনো কথা সোধক বা নতুন প্ৰজেক্ট আৰম্ভ কৰক...",
    new_chat: "নতুন কথা-বতৰা",
    more_options: "অধিক বিকল্প",
    share_chat: "শ্বেয়াৰ কৰক",
    pin_chat: "পিন কৰক",
    delete_chat: "ডিলিট কৰক",
    search_conversations: "কথোপকথন সন্ধান কৰক...",
    pinned_chats: "পিন কৰা",
    recent_chats: "শেহতীয়া",
    settings: "ছেটিংছ",
    appearance: "ৰূপ (থিম)",
    dark_mode: "ডাৰ্ক মোড",
    light_mode: "লাইট মোড",
    switch_to_light: "লাইট মোডলৈ যাওক",
    switch_to_dark: "ডাৰ্ক মোডলৈ যাওক",
    accent_color: "একচেণ্ট ৰং",
    accent_desc: "থিম উজ্জ্বলতা",
    language: "ভাষা (Language)",
    notifications: "জাননীসমূহ",
    notifications_desc: "আপডেটৰ বাবে সতৰ্কবাৰ্তা",
    free_storage: "বিনামূলীয়া ষ্ট’ৰেজ",
    threads: "থ্ৰেড",
    media: "মিডিয়া",
    free: "খালি",
    logout: "লগ আউট",
    edit_profile: "প্ৰফাইল সম্পাদনা",
    save_changes: "সংৰক্ষণ কৰক",
    cancel: "বাতিল",
    display_name: "নাম",
    username: "ব্যৱহাৰকাৰী নাম",
    email_address: "ইমেইল ঠিকনা",
    password: "পাছৱৰ্ড",
    sign_in: "ছাইন ইন",
    sign_up: "পঞ্জীয়ন কৰক",
    create_account: "একাউণ্ট খোলক",
    create_account_desc: "ৰাইনিয়াৰ সৈতে যুক্ত হওক",
    forgot_password: "পাছৱৰ্ড পাহৰিলে নেকি?",
    reset_password: "পাছৱৰ্ড ৰিছেট কৰক",
    reset_password_desc: "ইমেইল বা ফোন নম্বৰ প্ৰৱেশ কৰক।",
    send_reset_code: "কোড প্ৰেৰণ কৰক",
    remember_password: "পাছৱৰ্ড মনত পৰিল নেকি?",
    dont_have_account: "একাউণ্ট নাই নেকি?",
    already_have_account: "পূৰ্বৰে পৰা একাউণ্ট আছে?",
    or_continue_with: "বা ইয়াৰ দ্বাৰা আগবাঢ়ক",
    continue_google: "গুগলৰ সৈতে আগবাঢ়ক",
    continue_phone: "মোবাইলৰ সৈতে আগবাঢ়ক",
    camera_capture: "কেমেৰা ফটো",
    device_file_manager: "ফাইল মেনেজাৰ",
    lang_changed: "ভাষা {lang} লৈ সলনি কৰা হ’ল",
    search_language: "৪২টা ভাষা সন্ধান কৰক...",
    all_tab: "সকলো (৪২)",
    indian_tab: "🇮🇳 ভাৰতীয় ভাষা (২২)",
    global_tab: "🌍 বিশ্ব ভাষা (২০)"
  },

  // 13. Maithili (मैथिली)
  mai: {
    app_title: "राइनिया इंटेलिजेंस",
    welcome_tagline: "अहाँक शोध, इंजीनियरिंग आ रचनात्मक काज मे सहायता लेल तत्पर।",
    ask_placeholder: "किछुओ पूछू वा नव प्रोजेक्ट शुरू करू...",
    new_chat: "नव चैट",
    more_options: "आर विकल्प",
    share_chat: "साझा करू",
    pin_chat: "पिन करू",
    delete_chat: "हटाउ",
    search_conversations: "बातचीत खोजू...",
    pinned_chats: "पिन कएल",
    recent_chats: "हालक चैट",
    settings: "सेटिंग्स",
    appearance: "दिखावट (थीम)",
    dark_mode: "डार्क मोड",
    light_mode: "लाइट मोड",
    switch_to_light: "लाइट मोड लागू करू",
    switch_to_dark: "डार्क मोड लागू करू",
    accent_color: "एक्सेंट रंग",
    accent_desc: "थीम हाइलाइट्स",
    language: "भाषा (Language)",
    notifications: "सूचना",
    notifications_desc: "अपडेट अलर्ट",
    free_storage: "मुफ्त स्टोरेज",
    threads: "थ्रेड्स",
    media: "मीडिया",
    free: "खाली",
    logout: "लॉग आउट",
    edit_profile: "प्रोफाइल संपादित करू",
    save_changes: "सहेजू",
    cancel: "रद्द करू",
    display_name: "नाम",
    username: "यूजरनेम",
    email_address: "ईमेल",
    password: "पासवर्ड",
    sign_in: "साइन इन",
    sign_up: "खाता बनाउ",
    create_account: "खाता बनाउ",
    create_account_desc: "राइनिया सँ जुड़ू",
    forgot_password: "पासवर्ड बिसरि गेलाह?",
    reset_password: "पासवर्ड रीसेट करू",
    reset_password_desc: "ईमेल वा मोबाइल नंबर प्रविष्ट करू।",
    send_reset_code: "कोड पठाउ",
    remember_password: "पासवर्ड मोन पड़ल?",
    dont_have_account: "खाता नहि अछि?",
    already_have_account: "पहिने सँ खाता अछि?",
    or_continue_with: "वा एहि सँ जारी राखू",
    continue_google: "गूगल सँ जारी राखू",
    continue_phone: "मोबाइल सँ जारी राखू",
    camera_capture: "फोटो खींचू",
    device_file_manager: "फाइल मैनेजर",
    lang_changed: "भाषा {lang} कएल गेल",
    search_language: "42 भाषा खोजू...",
    all_tab: "सभ (42)",
    indian_tab: "🇮🇳 भारतीय भाषा (22)",
    global_tab: "🌍 विश्व भाषा (20)"
  },

  // 14. Sanskrit (संस्कृतम्)
  sa: {
    app_title: "रायनिया प्रज्ञा",
    welcome_tagline: "भवतः अनुसन्धानस्य, तन्त्रज्ञानस्य च साहाय्यार्थं सिद्धा।",
    ask_placeholder: "किमपि पृच्छतु अथवा नूतनकार्यं प्रारभताम्...",
    new_chat: "नूतनसंभाषणम्",
    more_options: "अधिकाः विकल्पाः",
    share_chat: "संभाषणं संविभजतु",
    pin_chat: "कील्यताम्",
    delete_chat: "अपाकुरुत",
    search_conversations: "संभाषणम् अन्विष्यताम्...",
    pinned_chats: "कीलितानि",
    recent_chats: "सद्यस्तनानि",
    settings: "समायोजनानि",
    appearance: "स्वरूपम् (Theme)",
    dark_mode: "तमोरूपम्",
    light_mode: "दीप्तिरूपम्",
    switch_to_light: "दीप्तिरूपं स्वीकुरुत",
    switch_to_dark: "तमोरूपं स्वीकुरुत",
    accent_color: "प्रधानवर्णः",
    accent_desc: "वर्णद्युतिः",
    language: "भाषा (Language)",
    notifications: "सूचनाः",
    notifications_desc: "नवीनवार्ताभ्यः सूचना",
    free_storage: "निःशुल्कस्थानम्",
    threads: "सूत्राणि",
    media: "माध्यमम्",
    free: "रिक्तम्",
    logout: "निर्गमनम् (Log Out)",
    edit_profile: "विवरणं संपाद्यताम्",
    save_changes: "परिवर्तनं रक्षितव्यम्",
    cancel: "निरस्यताम्",
    display_name: "नाम",
    username: "प्रयोक्तृनाम",
    email_address: "ईमेल-सङ्केतः",
    password: "कूटशब्दः (Password)",
    sign_in: "प्रवेशः (Sign In)",
    sign_up: "पञ्जीकरणम्",
    create_account: "खातां सृजतु",
    create_account_desc: "रायनिया-प्रज्ञया सह युज्यताम्",
    forgot_password: "कूटशब्दं विस्मृतम्?",
    reset_password: "कूटशब्दं पुनर्निर्मातु",
    reset_password_desc: "ईमेल अथवा दूरभाषसङ्ख्या प्रविशतु।",
    send_reset_code: "सङ्केतम् प्रेषयतु",
    remember_password: "कूटशब्दः स्मृतः?",
    dont_have_account: "खाता नास्ति?",
    already_have_account: "पूर्वं खाता अस्ति?",
    or_continue_with: "अथवा एतेन सह",
    continue_google: "गूगल-द्वारा अग्रेसरतु",
    continue_phone: "दूरभाष-द्वारा अग्रेसरतु",
    camera_capture: "चित्रं गृह्यताम्",
    device_file_manager: "सञ्चिका-प्रबन्धकः",
    lang_changed: "भाषा {lang} इति निर्धारिता",
    search_language: "42 भाषाः अन्विष्यन्ताम्...",
    all_tab: "सर्वाः (42)",
    indian_tab: "🇮🇳 भारतीयाः भाषाः (22)",
    global_tab: "🌍 वैश्विकाः भाषाः (20)"
  },

  // 15. Spanish (Español)
  es: {
    app_title: "Rhynia Inteligencia",
    welcome_tagline: "Listo para ayudarte con tu investigación, ingeniería y flujos creativos.",
    ask_placeholder: "Pregunta cualquier cosa o inicia un proyecto...",
    new_chat: "Nuevo chat",
    more_options: "Más opciones",
    share_chat: "Compartir chat",
    pin_chat: "Fijar chat",
    delete_chat: "Eliminar chat",
    search_conversations: "Buscar conversaciones...",
    pinned_chats: "Fijados",
    recent_chats: "Recientes",
    settings: "Configuración",
    appearance: "Apariencia",
    dark_mode: "Modo Oscuro",
    light_mode: "Modo Claro",
    switch_to_light: "Cambiar a Claro",
    switch_to_dark: "Cambiar a Oscuro",
    accent_color: "Color de Acento",
    accent_desc: "Destacados y brillo del tema",
    language: "Idioma (Language)",
    notifications: "Notificaciones",
    notifications_desc: "Alertas de actualizaciones",
    free_storage: "Almacenamiento Gratuito",
    threads: "Hilos",
    media: "Medios",
    free: "Libre",
    logout: "Cerrar sesión",
    edit_profile: "Editar perfil",
    save_changes: "Guardar cambios",
    cancel: "Cancelar",
    display_name: "Nombre para mostrar",
    username: "Nombre de usuario",
    email_address: "Correo electrónico",
    password: "Contraseña",
    sign_in: "Iniciar sesión",
    sign_up: "Registrarse",
    create_account: "Crea tu cuenta",
    create_account_desc: "Únete a Rhynia para potenciar tu inteligencia y trabajo",
    forgot_password: "¿Olvidaste tu contraseña?",
    reset_password: "Restablecer contraseña",
    reset_password_desc: "Introduce tu correo o teléfono para recibir instrucciones.",
    send_reset_code: "Enviar código de restablecimiento",
    remember_password: "¿Recordaste tu contraseña?",
    dont_have_account: "¿No tienes una cuenta?",
    already_have_account: "¿Ya tienes una cuenta?",
    or_continue_with: "O CONTINÚA CON",
    continue_google: "Continuar con Google",
    continue_phone: "Continuar con número móvil",
    camera_capture: "Captura de cámara",
    device_file_manager: "Administrador de archivos",
    lang_changed: "Idioma cambiado a {lang}",
    search_language: "Buscar 42 idiomas...",
    all_tab: "Todos (42)",
    indian_tab: "🇮🇳 Idiomas de la India (22)",
    global_tab: "🌍 Idiomas Globales (20)"
  },

  // 16. French (Français)
  fr: {
    app_title: "Rhynia Intelligence",
    welcome_tagline: "Prêt à vous assister dans vos recherches, ingénierie et créations.",
    ask_placeholder: "Posez une question ou démarrez un projet...",
    new_chat: "Nouveau chat",
    more_options: "Plus d'options",
    share_chat: "Partager la discussion",
    pin_chat: "Épingler la discussion",
    delete_chat: "Supprimer la discussion",
    search_conversations: "Rechercher des conversations...",
    pinned_chats: "Épinglés",
    recent_chats: "Récents",
    settings: "Paramètres",
    appearance: "Apparence",
    dark_mode: "Mode Sombre",
    light_mode: "Mode Clair",
    switch_to_light: "Passer en Clair",
    switch_to_dark: "Passer en Sombre",
    accent_color: "Couleur d'accentuation",
    accent_desc: "Mises en valeur et éclat du thème",
    language: "Langue (Language)",
    notifications: "Notifications",
    notifications_desc: "Alertes push pour les mises à jour",
    free_storage: "Stockage Gratuit",
    threads: "Fils",
    media: "Médias",
    free: "Libre",
    logout: "Se déconnecter",
    edit_profile: "Modifier le profil",
    save_changes: "Enregistrer les modifications",
    cancel: "Annuler",
    display_name: "Nom d'affichage",
    username: "Nom d'utilisateur",
    email_address: "Adresse e-mail",
    password: "Mot de passe",
    sign_in: "Se connecter",
    sign_up: "S'inscrire",
    create_account: "Créer un compte",
    create_account_desc: "Rejoignez Rhynia pour décupler votre potentiel",
    forgot_password: "Mot de passe oublié ?",
    reset_password: "Réinitialiser le mot de passe",
    reset_password_desc: "Entrez votre e-mail ou téléphone pour réinitialiser.",
    send_reset_code: "Envoyer le code",
    remember_password: "Vous vous souvenez de votre mot de passe ?",
    dont_have_account: "Vous n'avez pas de compte ?",
    already_have_account: "Vous avez déjà un compte ?",
    or_continue_with: "OU CONTINUER AVEC",
    continue_google: "Continuer avec Google",
    continue_phone: "Continuer avec le téléphone",
    camera_capture: "Prendre une photo",
    device_file_manager: "Gestionnaire de fichiers",
    lang_changed: "Langue définie sur {lang}",
    search_language: "Rechercher 42 langues...",
    all_tab: "Tous (42)",
    indian_tab: "🇮🇳 Langues indiennes (22)",
    global_tab: "🌍 Langues mondiales (20)"
  },

  // 17. German (Deutsch)
  de: {
    app_title: "Rhynia Intelligenz",
    welcome_tagline: "Bereit, Sie bei Forschung, Entwicklung und kreativen Workflows zu unterstützen.",
    ask_placeholder: "Fragen Sie etwas oder starten Sie ein Projekt...",
    new_chat: "Neuer Chat",
    more_options: "Weitere Optionen",
    share_chat: "Chat teilen",
    pin_chat: "Chat anheften",
    delete_chat: "Chat löschen",
    search_conversations: "Unterhaltungen durchsuchen...",
    pinned_chats: "Angeheftet",
    recent_chats: "Zuletzt",
    settings: "Einstellungen",
    appearance: "Erscheinungsbild",
    dark_mode: "Dunkler Modus",
    light_mode: "Heller Modus",
    switch_to_light: "Zu Hell wechseln",
    switch_to_dark: "Zu Dunkel wechseln",
    accent_color: "Akzentfarbe",
    accent_desc: "Design-Highlights und Glanz",
    language: "Sprache (Language)",
    notifications: "Benachrichtigungen",
    notifications_desc: "Push-Warnungen bei Updates",
    free_storage: "Kostenloser Speicher",
    threads: "Threads",
    media: "Medien",
    free: "Frei",
    logout: "Abmelden",
    edit_profile: "Profil bearbeiten",
    save_changes: "Änderungen speichern",
    cancel: "Abbrechen",
    display_name: "Anzeigename",
    username: "Benutzername",
    email_address: "E-Mail-Adresse",
    password: "Passwort",
    sign_in: "Anmelden",
    sign_up: "Registrieren",
    create_account: "Konto erstellen",
    create_account_desc: "Treten Sie Rhynia bei, um Workflows zu optimieren",
    forgot_password: "Passwort vergessen?",
    reset_password: "Passwort zurücksetzen",
    reset_password_desc: "Geben Sie Ihre E-Mail oder Telefonnummer ein.",
    send_reset_code: "Code senden",
    remember_password: "Passwort wieder eingefallen?",
    dont_have_account: "Noch kein Konto?",
    already_have_account: "Bereits ein Konto?",
    or_continue_with: "ODER WEITER MIT",
    continue_google: "Weiter mit Google",
    continue_phone: "Weiter mit Telefonnummer",
    camera_capture: "Kameraaufnahme",
    device_file_manager: "Dateimanager",
    lang_changed: "Sprache auf {lang} geändert",
    search_language: "42 Sprachen durchsuchen...",
    all_tab: "Alle (42)",
    indian_tab: "🇮🇳 Indische Sprachen (22)",
    global_tab: "🌍 Globale Sprachen (20)"
  },

  // 18. Mandarin Chinese (简体中文)
  zh: {
    app_title: "Rhynia 智能",
    welcome_tagline: "随时为您的研究、工程和创意工作流提供支持。",
    ask_placeholder: "询问任何问题或开启新项目...",
    new_chat: "新建对话",
    more_options: "更多选项",
    share_chat: "分享对话",
    pin_chat: "置顶对话",
    delete_chat: "删除对话",
    search_conversations: "搜索历史对话...",
    pinned_chats: "置顶",
    recent_chats: "最近",
    settings: "设置",
    appearance: "外观主题",
    dark_mode: "深色模式",
    light_mode: "浅色模式",
    switch_to_light: "切换至浅色",
    switch_to_dark: "切换至深色",
    accent_color: "强调色彩",
    accent_desc: "主题高亮与光泽",
    language: "语言 (Language)",
    notifications: "通知",
    notifications_desc: "接收推送与更新提醒",
    free_storage: "免费存储空间",
    threads: "对话记录",
    media: "多媒体",
    free: "可用",
    logout: "退出登录",
    edit_profile: "编辑个人资料",
    save_changes: "保存更改",
    cancel: "取消",
    display_name: "显示名称",
    username: "用户名",
    email_address: "电子邮箱",
    password: "密码",
    sign_in: "登录",
    sign_up: "注册",
    create_account: "创建您的账号",
    create_account_desc: "加入 Rhynia，释放您的无尽智慧与效率",
    forgot_password: "忘记密码？",
    reset_password: "重置密码",
    reset_password_desc: "输入注册邮箱或手机号以获取重置说明。",
    send_reset_code: "发送重置码",
    remember_password: "记起密码了？",
    dont_have_account: "还没有账号？",
    already_have_account: "已有账号？",
    or_continue_with: "或通过以下方式继续",
    continue_google: "通过 Google 账号继续",
    continue_phone: "通过手机号继续",
    camera_capture: "相机拍照",
    device_file_manager: "设备文件管理",
    lang_changed: "语言已设置为 {lang}",
    search_language: "搜索 42 种语言...",
    all_tab: "全部 (42)",
    indian_tab: "🇮🇳 印度官方语言 (22)",
    global_tab: "🌍 全球主要语言 (20)"
  },

  // 19. Japanese (日本語)
  ja: {
    app_title: "Rhynia インテリジェンス",
    welcome_tagline: "リサーチ、エンジニアリング、クリエイティブな作業を支援します。",
    ask_placeholder: "何でも質問するか、プロジェクトを開始...",
    new_chat: "新しいチャット",
    more_options: "その他のオプション",
    share_chat: "チャットを共有",
    pin_chat: "ピン留め",
    delete_chat: "削除",
    search_conversations: "会話を検索...",
    pinned_chats: "ピン留め",
    recent_chats: "履歴",
    settings: "設定",
    appearance: "外観 (テーマ)",
    dark_mode: "ダークモード",
    light_mode: "ライトモード",
    switch_to_light: "ライトモードに切替",
    switch_to_dark: "ダークモードに切替",
    accent_color: "アクセントカラー",
    accent_desc: "テーマのハイライトと輝き",
    language: "言語 (Language)",
    notifications: "通知",
    notifications_desc: "最新情報のプッシュ通知",
    free_storage: "無料ストレージ",
    threads: "スレッド",
    media: "メディア",
    free: "空き",
    logout: "ログアウト",
    edit_profile: "プロフィール編集",
    save_changes: "変更を保存",
    cancel: "キャンセル",
    display_name: "表示名",
    username: "ユーザー名",
    email_address: "メールアドレス",
    password: "パスワード",
    sign_in: "サインイン",
    sign_up: "登録する",
    create_account: "アカウントを作成",
    create_account_desc: "Rhynia に参加して作業を効率化",
    forgot_password: "パスワードをお忘れですか？",
    reset_password: "パスワードのリセット",
    reset_password_desc: "登録したメールまたは携帯番号を入力してください。",
    send_reset_code: "リセットコードを送信",
    remember_password: "パスワードを思い出しましたか？",
    dont_have_account: "アカウントをお持ちでないですか？",
    already_have_account: "すでにアカウントをお持ちですか？",
    or_continue_with: "または次で続行",
    continue_google: "Google で続行",
    continue_phone: "携帯電話番号で続行",
    camera_capture: "カメラで撮影",
    device_file_manager: "ファイルマネージャー",
    lang_changed: "言語を {lang} に変更しました",
    search_language: "42の言語を検索...",
    all_tab: "すべて (42)",
    indian_tab: "🇮🇳 インド諸言語 (22)",
    global_tab: "🌍 世界の言語 (20)"
  },

  // 20. Arabic (العربية - RTL)
  ar: {
    app_title: "ذكاء راينيا",
    welcome_tagline: "جاهز لمساعدتك في أبحاثك وهندستك وأعمالك الإبداعية.",
    ask_placeholder: "اسأل أي شيء أو ابدأ مشروعًا...",
    new_chat: "محادثة جديدة",
    more_options: "خيارات أكثر",
    share_chat: "مشاركة المحادثة",
    pin_chat: "تثبيت المحادثة",
    delete_chat: "حذف المحادثة",
    search_conversations: "البحث في المحادثات...",
    pinned_chats: "المثبتة",
    recent_chats: "الأخيرة",
    settings: "الإعدادات",
    appearance: "المظهر",
    dark_mode: "الوضع الداكن",
    light_mode: "الوضع الفاتح",
    switch_to_light: "التبديل إلى الفاتح",
    switch_to_dark: "التبديل إلى الداكن",
    accent_color: "لون التمييز",
    accent_desc: "إضاءة ووهج السمة",
    language: "اللغة (Language)",
    notifications: "الإشعارات",
    notifications_desc: "تنبيهات التحديثات",
    free_storage: "مساحة مجانية",
    threads: "المحادثات",
    media: "الوسائط",
    free: "متاح",
    logout: "تسجيل الخروج",
    edit_profile: "تعديل الملف الشخصي",
    save_changes: "حفظ التغييرات",
    cancel: "إلغاء",
    display_name: "الاسم المعروض",
    username: "اسم المستخدم",
    email_address: "البريد الإلكتروني",
    password: "كلمة المرور",
    sign_in: "تسجيل الدخول",
    sign_up: "إنشاء حساب",
    create_account: "إنشاء حسابك",
    create_account_desc: "انضم إلى راينيا لتعزيز قدراتك الذكية",
    forgot_password: "هل نسيت كلمة المرور؟",
    reset_password: "إعادة تعيين كلمة المرور",
    reset_password_desc: "أدخل بريدك الإلكتروني أو رقم هاتفك لتلقي التعليمات.",
    send_reset_code: "إرسال رمز التعين",
    remember_password: "هل تذكرت كلمة المرور؟",
    dont_have_account: "ليس لديك حساب؟",
    already_have_account: "هل لديك حساب بالفعل؟",
    or_continue_with: "أو المتابعة باستخدام",
    continue_google: "المتابعة مع Google",
    continue_phone: "المتابعة برقم الهاتف",
    camera_capture: "التقاط صورة",
    device_file_manager: "مدير الملفات",
    lang_changed: "تم تعيين اللغة إلى {lang}",
    search_language: "البحث في 42 لغة...",
    all_tab: "الكل (42)",
    indian_tab: "🇮🇳 اللغات الهندية (22)",
    global_tab: "🌍 اللغات العالمية (20)"
  },

  // 21. Russian (Русский)
  ru: {
    app_title: "Rhynia Интеллект",
    welcome_tagline: "Готов помочь в исследованиях, инженерии и творчестве.",
    ask_placeholder: "Спросите что угодно или начните проект...",
    new_chat: "Новый чат",
    more_options: "Дополнительно",
    share_chat: "Поделиться",
    pin_chat: "Закрепить",
    delete_chat: "Удалить",
    search_conversations: "Поиск бесед...",
    pinned_chats: "Закрепленные",
    recent_chats: "Недавние",
    settings: "Настройки",
    appearance: "Оформление",
    dark_mode: "Темная тема",
    light_mode: "Светлая тема",
    switch_to_light: "Светлая тема",
    switch_to_dark: "Темная тема",
    accent_color: "Цвет акцента",
    accent_desc: "Подсветка и сияние темы",
    language: "Язык (Language)",
    notifications: "Уведомления",
    notifications_desc: "Push-оповещения",
    free_storage: "Бесплатное хранилище",
    threads: "Ветки",
    media: "Медиа",
    free: "Свободно",
    logout: "Выйти",
    edit_profile: "Редактировать профиль",
    save_changes: "Сохранить",
    cancel: "Отмена",
    display_name: "Имя",
    username: "Имя пользователя",
    email_address: "Электронная почта",
    password: "Пароль",
    sign_in: "Войти",
    sign_up: "Регистрация",
    create_account: "Создать аккаунт",
    create_account_desc: "Присоединяйтесь к Rhynia для продуктивной работы",
    forgot_password: "Забыли пароль?",
    reset_password: "Сброс пароля",
    reset_password_desc: "Введите почту или телефон для сброса пароля.",
    send_reset_code: "Отправить код",
    remember_password: "Вспомнили пароль?",
    dont_have_account: "Нет аккаунта?",
    already_have_account: "Уже есть аккаунт?",
    or_continue_with: "ИЛИ ВОЙТИ ЧЕРЕЗ",
    continue_google: "Продолжить через Google",
    continue_phone: "Продолжить по номеру телефона",
    camera_capture: "Сделать снимок",
    device_file_manager: "Диспетчер файлов",
    lang_changed: "Язык изменен на {lang}",
    search_language: "Поиск среди 42 языков...",
    all_tab: "Все (42)",
    indian_tab: "🇮🇳 Языки Индии (22)",
    global_tab: "🌍 Мировые языки (20)"
  }
};

/**
 * i18n Engine Core Class
 */
class RhyniaI18n {
  constructor() {
    this.currentLanguage = localStorage.getItem("rhynia_language") || "en";
    this.activeFilter = "all";
    this.searchQuery = "";
  }

  /**
   * Initialize i18n on page boot
   */
  init() {
    this.applyLanguage(this.currentLanguage, false);
    this.renderLanguageGrid();
  }

  /**
   * Translate a single key with fallback to English
   */
  t(key, params = {}) {
    const langDict = RHYNIA_TRANSLATIONS[this.currentLanguage] || RHYNIA_TRANSLATIONS.en;
    let text = langDict[key] || RHYNIA_TRANSLATIONS.en[key] || key;

    // Parameter interpolation (e.g. {used}, {total}, {pct})
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
    return text;
  }

  /**
   * Get language metadata by code
   */
  getLangMeta(code) {
    return RHYNIA_LANGUAGES.find(l => l.code === code) || RHYNIA_LANGUAGES.find(l => l.code === "en");
  }

  /**
   * Set and apply new language
   */
  setLanguage(langCode) {
    const meta = this.getLangMeta(langCode);
    if (!meta) return;

    this.currentLanguage = langCode;
    localStorage.setItem("rhynia_language", langCode);

    this.applyLanguage(langCode, true);
    this.renderLanguageGrid();

    // Toggle Flyout closed
    const picker = document.getElementById("language-selector-flyout");
    if (picker) picker.classList.add("hidden");

    if (typeof showToast === "function") {
      showToast(this.t("lang_changed", { lang: `${meta.name} (${meta.englishName})` }), "success");
    }
  }

  /**
   * Apply translations to the DOM
   */
  applyLanguage(langCode, notify = false) {
    const meta = this.getLangMeta(langCode);
    if (!meta) return;

    // 1. Update HTML lang & dir
    document.documentElement.lang = meta.code;
    if (meta.rtl) {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.removeAttribute("dir");
    }

    // 2. Update Settings Language Label
    const labels = document.querySelectorAll("#settings-language-label, .current-lang-label");
    labels.forEach(el => {
      el.textContent = `${meta.name} (${meta.englishName})`;
    });

    // 3. Dynamic DOM node translations: [data-i18n]
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // 4. Dynamic Input Placeholders: [data-i18n-placeholder]
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) {
        el.placeholder = this.t(key);
      }
    });

    // 5. Dynamic Titles: [data-i18n-title]
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (key) {
        el.title = this.t(key);
      }
    });

    // 6. Dynamic Aria Labels: [data-i18n-aria]
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria");
      if (key) {
        el.setAttribute("aria-label", this.t(key));
      }
    });
  }

  /**
   * Filter languages by Category and Search Query
   */
  getFilteredLanguages() {
    return RHYNIA_LANGUAGES.filter(lang => {
      const matchesCategory = 
        this.activeFilter === "all" ||
        (this.activeFilter === "india" && lang.region === "india") ||
        (this.activeFilter === "global" && lang.region === "global");

      const query = this.searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        lang.name.toLowerCase().includes(query) ||
        lang.englishName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }

  /**
   * Set active tab filter (all, india, global)
   */
  setFilter(filter) {
    this.activeFilter = filter;
    this.renderLanguageGrid();
  }

  /**
   * Set search query
   */
  onSearchInput(query) {
    this.searchQuery = query;
    this.renderLanguageGrid();
  }

  /**
   * Render the 42 Languages Interactive Grid in the Settings Flyout
   */
  renderLanguageGrid() {
    const container = document.getElementById("language-selector-flyout");
    if (!container) return;

    const filtered = this.getFilteredLanguages();

    container.innerHTML = `
      <!-- Search & Category Filter Header -->
      <div class="space-y-2 mb-3">
        <!-- Search Input -->
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-2.5 text-neutral-400 text-sm pointer-events-none">search</span>
          <input 
            type="text" 
            value="${this.searchQuery}"
            oninput="window.I18n.onSearchInput(this.value)" 
            placeholder="${this.t('search_language')}" 
            class="w-full bg-[#1b1c1c] border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#0078D4] transition-colors"
          />
          ${this.searchQuery ? `
            <button type="button" onclick="window.I18n.onSearchInput('')" class="absolute right-2 text-neutral-400 hover:text-white">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          ` : ''}
        </div>

        <!-- Category Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium">
          <button 
            type="button" 
            onclick="window.I18n.setFilter('all')" 
            class="px-2.5 py-1 rounded-md transition-all ${this.activeFilter === 'all' ? 'bg-[#0078D4] text-white shadow-sm font-semibold' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}"
          >
            ${this.t('all_tab')}
          </button>
          <button 
            type="button" 
            onclick="window.I18n.setFilter('india')" 
            class="px-2.5 py-1 rounded-md transition-all ${this.activeFilter === 'india' ? 'bg-[#0078D4] text-white shadow-sm font-semibold' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}"
          >
            ${this.t('indian_tab')}
          </button>
          <button 
            type="button" 
            onclick="window.I18n.setFilter('global')" 
            class="px-2.5 py-1 rounded-md transition-all ${this.activeFilter === 'global' ? 'bg-[#0078D4] text-white shadow-sm font-semibold' : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'}"
          >
            ${this.t('global_tab')}
          </button>
        </div>
      </div>

      <!-- Languages Scrollable Grid -->
      <div class="max-h-64 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-0.5">
        ${filtered.length > 0 ? filtered.map(lang => {
          const isSelected = lang.code === this.currentLanguage;
          return `
            <button 
              type="button" 
              onclick="window.I18n.setLanguage('${lang.code}')" 
              class="flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                isSelected 
                  ? 'bg-[#0078D4]/20 border border-[#0078D4] text-white font-medium shadow-sm' 
                  : 'bg-[#1e1e1e] hover:bg-white/10 border border-white/5 text-neutral-300 hover:text-white'
              }"
            >
              <div class="flex flex-col">
                <span class="text-xs font-semibold ${isSelected ? 'text-[#8ecdff]' : 'text-white'}">${lang.name}</span>
                <span class="text-[10px] text-neutral-400">${lang.englishName}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">${lang.region === 'india' ? '🇮🇳' : '🌍'}</span>
                ${isSelected ? '<span class="material-symbols-outlined text-[16px] text-[#0078D4]">check</span>' : ''}
              </div>
            </button>
          `;
        }).join('') : `
          <div class="col-span-2 py-6 text-center text-xs text-neutral-400">
            No languages match your search.
          </div>
        `}
      </div>
    `;
  }
}

// Global I18n Singleton Instance
window.I18n = new RhyniaI18n();

// Compatibility wrappers for existing code
function toggleLanguageSelector() {
  const picker = document.getElementById("language-selector-flyout");
  if (!picker) return;
  const isHidden = picker.classList.toggle("hidden");
  if (!isHidden) {
    window.I18n.renderLanguageGrid();
  }
}

function selectLanguage(langCode) {
  window.I18n.setLanguage(langCode);
}

// Auto-boot on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.I18n.init());
} else {
  window.I18n.init();
}
