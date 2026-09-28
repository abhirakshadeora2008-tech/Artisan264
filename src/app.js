/**
 * Artisan - Main Vanilla JavaScript Application Logic
 * 100% Pure HTML5, CSS3 and Vanilla JS - Zero React/Next.js/Vue/Angular
 */

import { TRANSLATIONS, SUPPORTED_LANGUAGES } from "./translations.js";
import { INITIAL_PRODUCTS, INITIAL_ARTISANS, CRAFT_CATEGORIES, INDIAN_STATES } from "./catalog-data.js";
import { applyStudioEnhancement, generateMarketStallCard } from "./canvas-tools.js";

// ==============================================================================
// APP STATE
// ==============================================================================
const state = {
  currentLang: "hi", // Default to Hindi for Indian artisan accessibility
  activeTab: "catalog",
  userRole: "artisan", // 'artisan' | 'buyer'
  isHighContrast: false,
  isLargeFont: false,
  products: [...INITIAL_PRODUCTS],
  artisans: [...INITIAL_ARTISANS],
  inquiries: [],
  currentArtisan: INITIAL_ARTISANS[0],
  
  // Active catalog filters
  searchQuery: "",
  selectedCategory: "All Categories",
  selectedState: "All States",
  maxPrice: 10000,
  
  // Active Cataloging Wizard Draft
  draft: {
    step: 1,
    rawImageBase64: "",
    enhancedImageBase64: "",
    backgroundStyle: "studio_white",
    voiceNotes: "",
    analysis: null,
    pricing: {
      materialCost: 320,
      laborHours: 16,
      hourlyRate: 85,
      overheadCost: 120,
      profitMarginPercent: 25,
      finalPrice: 2250,
      marketBenchmark: 3600
    },
    approvedTitle: "",
    approvedDesc: "",
    approvedMaterials: [],
    approvedTags: [],
    hasGiTag: false
  },

  // Media Stream
  cameraStream: null,
  isListeningVoice: false,
  recognition: null
};

// ==============================================================================
// ACCESSIBLE IN-APP TOAST NOTIFICATIONS (IFRAME-SAFE)
// ==============================================================================
export function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) {
    console.log(`[${type}]`, message);
    return;
  }
  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs sm:text-sm font-semibold transition-all transform translate-y-3 opacity-0 ${
    type === "error"
      ? "bg-rose-950 text-rose-100 border-rose-800"
      : type === "success"
      ? "bg-emerald-950 text-emerald-100 border-emerald-800"
      : type === "warning"
      ? "bg-amber-950 text-amber-100 border-amber-800"
      : "bg-stone-900 text-white border-stone-700"
  }`;
  
  const icon = type === "error" ? "⚠️" : type === "success" ? "✅" : type === "warning" ? "🔔" : "✨";
  toast.innerHTML = `<span class="text-base">${icon}</span><span class="flex-1">${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-3", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-3", "opacity-0");
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ==============================================================================
// INITIALIZATION
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initSpeechRecognition();
  setupLanguageSelector();
  setupNavigation();
  setupAccessibilityControls();
  setupCameraAndUpload();
  setupSampleCraftButtons();
  setupWizardControls();
  setupPricingCalculator();
  setupCatalogFilters();
  setupInquiryModal();
  setupAudioTTS();
  
  // Fetch products and inquiries from API
  fetchProducts();
  fetchInquiries();
  
  // Setup Interactive AI Artisan Advisor
  setupAIChatAdvisor();
  
  // Apply initial translations
  applyTranslations();
  renderCatalog();
  renderArtisanStudio();
});

// ==============================================================================
// 1. TRANSLATION ENGINE & ACCESSIBILITY
// ==============================================================================
function t(key) {
  const langDict = TRANSLATIONS[state.currentLang] || TRANSLATIONS.en;
  return langDict[key] || TRANSLATIONS.en[key] || key;
}

function setupLanguageSelector() {
  const select = document.getElementById("lang-select");
  if (!select) return;

  select.innerHTML = SUPPORTED_LANGUAGES.map(
    l => `<option value="${l.code}" ${l.code === state.currentLang ? "selected" : ""}>${l.name} (${l.label})</option>`
  ).join("");

  select.addEventListener("change", (e) => {
    state.currentLang = e.target.value;
    applyTranslations();
    renderCatalog();
    renderArtisanStudio();
  });
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.setAttribute("placeholder", t(key));
    }
  });
}

function setupAccessibilityControls() {
  const contrastBtn = document.getElementById("btn-toggle-contrast");
  const fontBtn = document.getElementById("btn-toggle-font");
  const roleBtn = document.getElementById("btn-toggle-role");

  if (contrastBtn) {
    contrastBtn.addEventListener("click", () => {
      state.isHighContrast = !state.isHighContrast;
      document.body.classList.toggle("high-contrast", state.isHighContrast);
      contrastBtn.classList.toggle("bg-yellow-400", state.isHighContrast);
      contrastBtn.classList.toggle("text-black", state.isHighContrast);
    });
  }

  if (fontBtn) {
    fontBtn.addEventListener("click", () => {
      state.isLargeFont = !state.isLargeFont;
      document.body.classList.toggle("large-text", state.isLargeFont);
      fontBtn.classList.toggle("bg-stone-800", state.isLargeFont);
      fontBtn.classList.toggle("text-white", state.isLargeFont);
    });
  }

  if (roleBtn) {
    roleBtn.addEventListener("click", () => {
      state.userRole = state.userRole === "artisan" ? "buyer" : "artisan";
      updateRoleBadge();
    });
    updateRoleBadge();
  }
}

function updateRoleBadge() {
  const roleBtn = document.getElementById("btn-toggle-role");
  if (!roleBtn) return;
  if (state.userRole === "artisan") {
    roleBtn.innerHTML = `<span>🎨</span> <span>${t("artisanMode")}</span>`;
    roleBtn.className = "px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm";
  } else {
    roleBtn.innerHTML = `<span>🛍️</span> <span>${t("buyerMode")}</span>`;
    roleBtn.className = "px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-sm";
  }
}

// ==============================================================================
// 2. NAVIGATION
// ==============================================================================
function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-tab-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });

  const heroCtaAiAdvisor = document.getElementById("hero-cta-ai-advisor");
  if (heroCtaAiAdvisor) {
    heroCtaAiAdvisor.addEventListener("click", () => switchTab("ai-advisor"));
  }

  const heroCtaCatalog = document.getElementById("hero-cta-catalog");
  if (heroCtaCatalog) {
    heroCtaCatalog.addEventListener("click", () => switchTab("cataloging"));
  }
  const heroCtaBrowse = document.getElementById("hero-cta-browse");
  if (heroCtaBrowse) {
    heroCtaBrowse.addEventListener("click", () => switchTab("catalog"));
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.add("hidden");
  });

  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) {
    activeView.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    const isCurrent = btn.getAttribute("data-tab") === tabName;
    if (isCurrent) {
      btn.classList.add("text-amber-700", "font-bold", "border-b-2", "border-amber-700");
      btn.classList.remove("text-stone-500");
    } else {
      btn.classList.remove("text-amber-700", "font-bold", "border-b-2", "border-amber-700");
      btn.classList.add("text-stone-500");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (tabName === "catalog") {
    renderCatalog();
  } else if (tabName === "studio" || tabName === "inquiries") {
    renderArtisanStudio();
  }
}

// ==============================================================================
// 3. VOICE INPUT (WEB SPEECH API & VERNACULAR ASSISTANT)
// ==============================================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported on this browser");
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.continuous = false;
  state.recognition.interimResults = true;

  state.recognition.onstart = () => {
    state.isListeningVoice = true;
    updateVoiceUI(true);
  };

  state.recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    const voiceInput = document.getElementById("voice-input-text");
    if (voiceInput) {
      voiceInput.value = transcript;
      state.draft.voiceNotes = transcript;
    }
  };

  state.recognition.onerror = (e) => {
    console.warn("Speech recognition error:", e.error);
    state.isListeningVoice = false;
    updateVoiceUI(false);
  };

  state.recognition.onend = () => {
    state.isListeningVoice = false;
    updateVoiceUI(false);
  };

  const micBtn = document.getElementById("btn-voice-record");
  if (micBtn) {
    micBtn.addEventListener("click", toggleVoiceRecording);
  }
}

function toggleVoiceRecording() {
  if (!state.recognition) {
    showToast("Speech recognition is not supported in this browser. Please type your description in the box.", "warning");
    return;
  }

  if (state.isListeningVoice) {
    state.recognition.stop();
  } else {
    // Map currentLang to BCP-47 locale
    const langMap = {
      hi: "hi-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      od: "or-IN",
      en: "en-IN"
    };
    state.recognition.lang = langMap[state.currentLang] || "hi-IN";
    try {
      state.recognition.start();
    } catch (e) {
      state.recognition.stop();
    }
  }
}

function updateVoiceUI(isListening) {
  const micBtn = document.getElementById("btn-voice-record");
  const pulseIndicator = document.getElementById("voice-pulse-status");
  if (micBtn) {
    if (isListening) {
      micBtn.classList.add("bg-red-600", "text-white", "voice-recording-pulse");
      micBtn.classList.remove("bg-amber-600");
      micBtn.innerHTML = `<span>🛑</span> <span>${t("stopListening")}</span>`;
    } else {
      micBtn.classList.remove("bg-red-600", "voice-recording-pulse");
      micBtn.classList.add("bg-amber-600", "text-white");
      micBtn.innerHTML = `<span>🎙️</span> <span>${t("tapToSpeak")}</span>`;
    }
  }
  if (pulseIndicator) {
    pulseIndicator.textContent = isListening ? t("listening") : "";
    pulseIndicator.classList.toggle("hidden", !isListening);
  }
}

// ==============================================================================
// 4. CAMERA & IMAGE UPLOAD
// ==============================================================================
function setupCameraAndUpload() {
  const cameraBtn = document.getElementById("btn-open-camera");
  const shutterBtn = document.getElementById("btn-shutter-snap");
  const closeCameraBtn = document.getElementById("btn-close-camera");
  const fileInput = document.getElementById("product-file-input");
  const uploadBox = document.getElementById("file-dropzone");

  if (cameraBtn) {
    cameraBtn.addEventListener("click", startCamera);
  }
  if (shutterBtn) {
    shutterBtn.addEventListener("click", captureSnapshot);
  }
  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", stopCamera);
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
    });
  }

  if (uploadBox) {
    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadBox.classList.add("border-amber-500", "bg-amber-50");
    });
    uploadBox.addEventListener("dragleave", () => {
      uploadBox.classList.remove("border-amber-500", "bg-amber-50");
    });
    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadBox.classList.remove("border-amber-500", "bg-amber-50");
      const file = e.dataTransfer?.files?.[0];
      if (file) handleImageFile(file);
    });
  }
}

async function startCamera() {
  const video = document.getElementById("camera-stream");
  const cameraContainer = document.getElementById("camera-container");
  if (!video || !cameraContainer) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    video.play();
    cameraContainer.classList.remove("hidden");
  } catch (err) {
    console.warn("Camera access failed or denied:", err);
    showToast("Unable to access camera. Please select a photo from your device or use one of the sample demo crafts.", "warning");
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  const cameraContainer = document.getElementById("camera-container");
  if (cameraContainer) cameraContainer.classList.add("hidden");
}

function captureSnapshot() {
  const video = document.getElementById("camera-stream");
  if (!video) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 800;
  canvas.height = video.videoHeight || 600;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const base64 = canvas.toDataURL("image/jpeg", 0.9);
  stopCamera();
  setDraftImage(base64);
}

function handleImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please upload a valid image file (JPEG, PNG, WebP).", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result;
    if (base64) {
      setDraftImage(base64);
    }
  };
  reader.readAsDataURL(file);
}

function setupSampleCraftButtons() {
  const sampleBtns = document.querySelectorAll(".sample-craft-btn");
  sampleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const craftType = btn.getAttribute("data-craft");
      loadSampleCraft(craftType);
    });
  });
}

function loadSampleCraft(craftType) {
  const sampleMap = {
    madhubani: {
      url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
      voice: "Yeh Madhubani Tree of Life painting hai, Bihar Mithila ki, natural dyes aur handmade paper par 24 ghante lage hain.",
      color: "#991b1b",
      title: "Madhubani Tree of Life"
    },
    channapatna: {
      url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80",
      voice: "Karnataka Channapatna wooden stacking toy, Hale wood aur vegetable lacquer use hua hai, bacchon ke liye 100% safe.",
      color: "#ea580c",
      title: "Channapatna Wooden Toy"
    },
    bluepottery: {
      url: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80",
      voice: "Jaipur Traditional Blue Pottery vase, quartz powder and cobalt blue glaze, hand-painted floral design.",
      color: "#1e40af",
      title: "Jaipur Blue Pottery Vase"
    },
    dhokra: {
      url: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80",
      voice: "Bastar Dhokra brass musician statue, Chhattisgarh lost-wax bell metal casting, 16 hours of handwork.",
      color: "#854d0e",
      title: "Bastar Dhokra Brass Statue"
    }
  };

  const chosen = sampleMap[craftType] || sampleMap.channapatna;
  const voiceInput = document.getElementById("voice-input-text");
  if (voiceInput) {
    voiceInput.value = chosen.voice;
    state.draft.voiceNotes = chosen.voice;
  }

  // Pre-generate guaranteed local canvas artwork first for zero latency
  const localArt = createCraftSampleCanvas(chosen.title, chosen.color);
  setDraftImage(localArt);

  // Attempt external high-res load asynchronously if CORS permits
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setDraftImage(dataUrl);
    } catch (e) {
      // Local canvas art remains active
    }
  };
  img.src = chosen.url;
}

function setDraftImage(base64Data) {
  state.draft.rawImageBase64 = base64Data;
  state.draft.enhancedImageBase64 = base64Data;

  const preview = document.getElementById("uploaded-photo-preview");
  const previewContainer = document.getElementById("photo-preview-container");
  if (preview && previewContainer) {
    preview.src = base64Data;
    previewContainer.classList.remove("hidden");
  }

  const btnAnalyze = document.getElementById("btn-trigger-ai-analysis");
  if (btnAnalyze) {
    btnAnalyze.removeAttribute("disabled");
    btnAnalyze.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

// ==============================================================================
// 5. AI MULTIMODAL CATALOGING WIZARD
// ==============================================================================
function setupWizardControls() {
  const btnAnalyze = document.getElementById("btn-trigger-ai-analysis");
  if (btnAnalyze) {
    btnAnalyze.addEventListener("click", runAIAnalysis);
  }

  // Studio background selection buttons
  const bgButtons = document.querySelectorAll(".bg-style-btn");
  bgButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      bgButtons.forEach(b => b.classList.remove("ring-4", "ring-amber-500"));
      btn.classList.add("ring-4", "ring-amber-500");
      const style = btn.getAttribute("data-style") || "studio_white";
      state.draft.backgroundStyle = style;
      applyBackgroundStyle(style);
    });
  });

  // Wizard Step Next / Back Navigation
  document.querySelectorAll(".wizard-next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextStep = Number(btn.getAttribute("data-next"));
      goToWizardStep(nextStep);
    });
  });

  document.querySelectorAll(".wizard-prev-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const prevStep = Number(btn.getAttribute("data-prev"));
      goToWizardStep(prevStep);
    });
  });

  // Final Publish Button
  const btnPublish = document.getElementById("btn-publish-craft");
  if (btnPublish) {
    btnPublish.addEventListener("click", publishDraftProduct);
  }

  // Translation in Review step
  const btnTranslate = document.getElementById("btn-translate-review");
  if (btnTranslate) {
    btnTranslate.addEventListener("click", translateReviewDetails);
  }
}

function goToWizardStep(stepNum) {
  state.draft.step = stepNum;
  document.querySelectorAll(".wizard-step-panel").forEach(panel => {
    panel.classList.add("hidden");
  });

  const targetPanel = document.getElementById(`wizard-step-${stepNum}`);
  if (targetPanel) {
    targetPanel.classList.remove("hidden");
  }

  // Update step indicators
  document.querySelectorAll(".step-indicator-pill").forEach(pill => {
    const pStep = Number(pill.getAttribute("data-step"));
    if (pStep <= stepNum) {
      pill.classList.add("bg-amber-600", "text-white");
      pill.classList.remove("bg-stone-200", "text-stone-600");
    } else {
      pill.classList.remove("bg-amber-600", "text-white");
      pill.classList.add("bg-stone-200", "text-stone-600");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function runAIAnalysis() {
  const voiceNotesInput = document.getElementById("voice-input-text");
  const enteredVoice = voiceNotesInput ? voiceNotesInput.value.trim() : "";

  // If user clicks without photo or text, auto-load sample craft for instant working experience
  if (!state.draft.rawImageBase64 && !enteredVoice) {
    loadSampleCraft("channapatna");
    showToast("Loaded sample Channapatna craft. Analyzing with AI...", "info");
  }

  if (enteredVoice) {
    state.draft.voiceNotes = enteredVoice;
  }

  // If text was provided but no image yet, generate a representative craft canvas
  if (!state.draft.rawImageBase64) {
    const isToy = enteredVoice.toLowerCase().includes("toy") || enteredVoice.toLowerCase().includes("wood");
    const isBrass = enteredVoice.toLowerCase().includes("brass") || enteredVoice.toLowerCase().includes("metal");
    const craftTitle = isToy ? "Channapatna Wooden Craft" : isBrass ? "Bastar Dhokra Brass" : "Artisan Handcrafted Heritage";
    const craftColor = isToy ? "#c2410c" : isBrass ? "#854d0e" : "#1e3a8a";
    setDraftImage(createCraftSampleCanvas(craftTitle, craftColor));
  }

  const loadingOverlay = document.getElementById("ai-analysis-loading");
  if (loadingOverlay) loadingOverlay.classList.remove("hidden");

  try {
    const res = await fetch("/api/ai/analyze-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: state.draft.rawImageBase64,
        voiceDescription: state.draft.voiceNotes || enteredVoice,
        language: state.currentLang
      })
    });

    const data = await res.json();
    if (loadingOverlay) loadingOverlay.classList.add("hidden");

    if (data.success && data.analysis) {
      state.draft.analysis = data.analysis;
      populateAnalysisResults(data.analysis);
      goToWizardStep(2);
      showToast(`AI Craft Analysis Succeeded via ${data.modelUsed || "Gemini"}!`, "success");
    } else {
      showToast("AI analysis could not complete. Please try again.", "error");
    }
  } catch (err) {
    console.error("AI Cataloging error:", err);
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    showToast("Network error communicating with AI cataloging service.", "error");
  }
}

function populateAnalysisResults(analysis) {
  const catEl = document.getElementById("res-category");
  const matsEl = document.getElementById("res-materials");
  const colorsEl = document.getElementById("res-colors");
  const tagsEl = document.getElementById("res-tags");
  const storyEl = document.getElementById("res-story");
  const confBadge = document.getElementById("res-confidence-badge");
  const confText = document.getElementById("res-confidence-text");
  const giStatusText = document.getElementById("res-gi-status-text");
  const guardrailBanner = document.getElementById("res-guardrail-banner");
  const guardrailDesc = document.getElementById("res-guardrail-desc");
  const verificationNoticeEl = document.getElementById("res-verification-notice");

  if (catEl) catEl.textContent = analysis.category || "Traditional Handcraft";
  if (matsEl) {
    const mats = Array.isArray(analysis.materials) ? analysis.materials : [analysis.materials];
    matsEl.innerHTML = mats.map(m => `<span class="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-md text-xs font-medium">${m}</span>`).join(" ");
  }
  if (colorsEl) {
    const colors = Array.isArray(analysis.primaryColors) ? analysis.primaryColors : [analysis.primaryColors];
    colorsEl.innerHTML = colors.map(c => `<span class="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-xs font-medium">${c}</span>`).join(" ");
  }
  if (tagsEl) {
    const tags = Array.isArray(analysis.tags) ? analysis.tags : [analysis.tags];
    tagsEl.innerHTML = tags.map(t => `<span class="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-xs">#${t}</span>`).join(" ");
  }
  if (storyEl) {
    storyEl.textContent = analysis.culturalStory || analysis.description || "";
  }

  // Confidence scoring & SHG verification guardrail
  const confidenceScore = typeof analysis.confidence_score === "number" ? analysis.confidence_score : 0.90;
  const isHighConfidence = confidenceScore >= 0.85;

  if (confBadge && confText) {
    if (isHighConfidence) {
      confBadge.className = "px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1";
      confText.textContent = `${Math.round(confidenceScore * 100)}% High Confidence`;
    } else {
      confBadge.className = "px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1";
      confText.textContent = `${Math.round(confidenceScore * 100)}% Requires SHG Verification`;
    }
  }

  // GI Tag status
  if (giStatusText) {
    const giStatus = analysis.gi_status || (analysis.hasGiTag ? "OFFICIALLY_VERIFIED" : "ESTIMATED_UNVERIFIED");
    giStatusText.textContent = giStatus === "OFFICIALLY_VERIFIED" ? "Officially Verified" : "Estimated Unverified";
  }

  // Guardrail warnings display
  const warnings = Array.isArray(analysis.guardrail_warnings) ? analysis.guardrail_warnings : [];
  if (guardrailBanner) {
    if (!isHighConfidence || warnings.length > 0 || analysis.gi_status === "ESTIMATED_UNVERIFIED") {
      guardrailBanner.classList.remove("hidden");
      if (guardrailDesc) {
        if (!isHighConfidence) {
          guardrailDesc.textContent = `Confidence score is ${(confidenceScore * 100).toFixed(0)}% (below 85% threshold). Human verification by an SHG lead is required to validate materials and craft technique before official certification.`;
        } else if (warnings.length > 0) {
          guardrailDesc.textContent = warnings.join(" • ");
        } else {
          guardrailDesc.textContent = "GI status is marked as an unverified cultural estimate. Uploading cooperative registration documents is recommended.";
        }
      }
      if (verificationNoticeEl && analysis.verification_notice) {
        verificationNoticeEl.textContent = `Notice: ${analysis.verification_notice}`;
      }
    } else {
      guardrailBanner.classList.add("hidden");
    }
  }

  // Pre-fill smart pricing inputs
  if (analysis.suggestedMaterialCost) {
    const matInput = document.getElementById("input-calc-material");
    if (matInput) matInput.value = analysis.suggestedMaterialCost;
  }
  if (analysis.suggestedLaborHours) {
    const hoursInput = document.getElementById("input-calc-hours");
    if (hoursInput) hoursInput.value = analysis.suggestedLaborHours;
  }
  if (analysis.suggestedHourlyRate) {
    const wageInput = document.getElementById("input-calc-wage");
    if (wageInput) wageInput.value = analysis.suggestedHourlyRate;
  }

  // Pre-fill review form
  const reviewTitle = document.getElementById("input-review-title");
  const reviewDesc = document.getElementById("input-review-desc");
  if (reviewTitle) reviewTitle.value = analysis.title || "";
  if (reviewDesc) reviewDesc.value = `${analysis.description}\n\nCultural Heritage:\n${analysis.culturalStory}`;

  // Initial pricing calculation
  recalculatePricing();
}

function applyBackgroundStyle(style) {
  const previewImg = document.getElementById("enhanced-photo-preview");
  if (!previewImg || !state.draft.rawImageBase64) return;

  applyStudioEnhancement(state.draft.rawImageBase64, style, (enhancedDataUrl) => {
    state.draft.enhancedImageBase64 = enhancedDataUrl;
    previewImg.src = enhancedDataUrl;
  });
}

// ==============================================================================
// 6. SMART FAIR-PRICING CALCULATOR
// ==============================================================================
function setupPricingCalculator() {
  const matInput = document.getElementById("input-calc-material");
  const hoursInput = document.getElementById("input-calc-hours");
  const wageInput = document.getElementById("input-calc-wage");
  const overheadInput = document.getElementById("input-calc-overhead");
  const marginInput = document.getElementById("input-calc-margin");

  [matInput, hoursInput, wageInput, overheadInput, marginInput].forEach(inp => {
    if (inp) {
      inp.addEventListener("input", recalculatePricing);
    }
  });
}

function recalculatePricing() {
  const matCost = Number(document.getElementById("input-calc-material")?.value || 300);
  const hours = Number(document.getElementById("input-calc-hours")?.value || 12);
  const wage = Number(document.getElementById("input-calc-wage")?.value || 85);
  const overhead = Number(document.getElementById("input-calc-overhead")?.value || 100);
  const margin = Number(document.getElementById("input-calc-margin")?.value || 25);

  const directLabor = hours * wage;
  const baseCost = matCost + directLabor + overhead;
  const profit = Math.round((baseCost * margin) / 100);
  const finalPrice = Math.round(baseCost + profit);
  const retailBenchmark = Math.round(finalPrice * 1.55);
  const takeHome = Math.round(directLabor + profit);

  state.draft.pricing = {
    materialCost: matCost,
    laborHours: hours,
    hourlyRate: wage,
    overheadCost: overhead,
    profitMarginPercent: margin,
    finalPrice,
    marketBenchmark: retailBenchmark
  };

  // Update UI Elements
  const priceDisplay = document.getElementById("disp-fair-price");
  const retailDisplay = document.getElementById("disp-market-benchmark");
  const takeHomeDisplay = document.getElementById("disp-artisan-earnings");
  const reviewPriceDisplay = document.getElementById("review-final-price-badge");

  if (priceDisplay) priceDisplay.textContent = `₹${finalPrice.toLocaleString("en-IN")}`;
  if (retailDisplay) retailDisplay.textContent = `₹${retailBenchmark.toLocaleString("en-IN")}`;
  if (takeHomeDisplay) takeHomeDisplay.textContent = `₹${takeHome.toLocaleString("en-IN")}`;
  if (reviewPriceDisplay) reviewPriceDisplay.textContent = `₹${finalPrice.toLocaleString("en-IN")}`;
}

// ==============================================================================
// 7. REVIEW, EDIT & PUBLISH
// ==============================================================================
async function translateReviewDetails() {
  const select = document.getElementById("review-translate-lang");
  const targetLang = select?.value || "hi";
  const descInput = document.getElementById("input-review-desc");
  if (!descInput || !descInput.value) return;

  const btn = document.getElementById("btn-translate-review");
  if (btn) btn.textContent = "Translating with AI...";

  try {
    const res = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: descInput.value,
        targetLanguage: targetLang
      })
    });
    const data = await res.json();
    if (data.success && data.translatedText) {
      descInput.value = data.translatedText;
    }
  } catch (e) {
    console.warn("Translation failed:", e);
  } finally {
    if (btn) btn.textContent = t("translateTo");
  }
}

function setupAudioTTS() {
  const btnTTS = document.getElementById("btn-tts-read-story");
  if (btnTTS) {
    btnTTS.addEventListener("click", () => {
      const descInput = document.getElementById("input-review-desc");
      const textToRead = descInput?.value || "";
      if (!textToRead) return;

      if (!window.speechSynthesis) {
        showToast("Speech synthesis is not supported on this browser.", "warning");
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      // Map current language
      const langMap = { hi: "hi-IN", bn: "bn-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN", gu: "gu-IN", en: "en-IN" };
      utterance.lang = langMap[state.currentLang] || "hi-IN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    });
  }
}

async function publishDraftProduct() {
  const titleInput = document.getElementById("input-review-title");
  const descInput = document.getElementById("input-review-desc");

  const title = titleInput?.value || state.draft.analysis?.title || "Artisan Handcrafted Creation";
  const description = descInput?.value || state.draft.analysis?.description || "";
  const category = state.draft.analysis?.category || "Paintings & Folk Art";
  const materials = state.draft.analysis?.materials || ["Natural Material"];
  const finalPrice = state.draft.pricing.finalPrice || 1800;

  const payload = {
    artisanId: state.currentArtisan.id,
    title,
    category,
    materials,
    primaryColors: state.draft.analysis?.primaryColors || ["Earthy"],
    craftTechnique: state.draft.analysis?.craftTechnique || "Handcrafted",
    description,
    culturalStory: state.draft.analysis?.culturalStory || "",
    tags: state.draft.analysis?.tags || ["Handmade", "ArtisanDirect"],
    materialCost: state.draft.pricing.materialCost,
    laborHours: state.draft.pricing.laborHours,
    hourlyRate: state.draft.pricing.hourlyRate,
    overheadCost: state.draft.pricing.overheadCost,
    profitMarginPercent: state.draft.pricing.profitMarginPercent,
    finalPrice,
    marketBenchmarkPrice: state.draft.pricing.marketBenchmark,
    imageUrl: state.draft.rawImageBase64,
    enhancedImageUrl: state.draft.enhancedImageBase64 || state.draft.rawImageBase64,
    backgroundStyle: state.draft.backgroundStyle,
    originState: state.currentArtisan.state || "Bihar",
    hasGiTag: Boolean(state.draft.analysis?.hasGiTag),
    isInStock: true
  };

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.product) {
      state.products.unshift(data.product);
      showToast(t("publishSuccess"), "success");
      
      // Open Printable Market Card Modal
      openMarketCardModal(data.product);
      
      // Reset wizard
      resetWizard();
      renderCatalog();
      renderArtisanStudio();
    }
  } catch (err) {
    console.error("Publish error:", err);
    showToast("Failed to publish craft.", "error");
  }
}

function resetWizard() {
  state.draft.rawImageBase64 = "";
  state.draft.enhancedImageBase64 = "";
  state.draft.analysis = null;
  const photoPreview = document.getElementById("photo-preview-container");
  if (photoPreview) photoPreview.classList.add("hidden");
  goToWizardStep(1);
}

// ==============================================================================
// 8. MARKET-READY PRINTABLE CARD MODAL
// ==============================================================================
function openMarketCardModal(product) {
  const modal = document.getElementById("market-card-modal");
  const cardCanvasPreview = document.getElementById("market-card-preview-img");
  const downloadBtn = document.getElementById("btn-download-stall-card");
  const closeBtn = document.getElementById("btn-close-card-modal");

  if (!modal || !cardCanvasPreview) return;

  generateMarketStallCard(product, state.currentArtisan, (cardDataUrl) => {
    cardCanvasPreview.src = cardDataUrl;
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.download = `Artisan-${product.title.slice(0, 20).replace(/\s+/g, "_")}.png`;
        link.href = cardDataUrl;
        link.click();
      };
    }
  });

  modal.classList.remove("hidden");
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.add("hidden");
  }
}

// ==============================================================================
// 9. PRODUCT CATALOG & SEARCH / FILTER
// ==============================================================================
async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (data.products && Array.isArray(data.products)) {
      state.products = data.products;
      renderCatalog();
    }
  } catch (e) {
    console.warn("Could not load products from API, using pre-seeded dataset:", e);
  }
}

function setupCatalogFilters() {
  const searchInput = document.getElementById("catalog-search-input");
  const categorySelect = document.getElementById("catalog-category-filter");
  const stateSelect = document.getElementById("catalog-state-filter");
  const priceSlider = document.getElementById("catalog-price-slider");
  const priceValueLabel = document.getElementById("catalog-price-val");

  if (categorySelect) {
    categorySelect.innerHTML = CRAFT_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
    categorySelect.addEventListener("change", (e) => {
      state.selectedCategory = e.target.value;
      renderCatalog();
    });
  }

  if (stateSelect) {
    stateSelect.innerHTML = INDIAN_STATES.map(s => `<option value="${s}">${s}</option>`).join("");
    stateSelect.addEventListener("change", (e) => {
      state.selectedState = e.target.value;
      renderCatalog();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderCatalog();
    });
  }

  if (priceSlider) {
    priceSlider.addEventListener("input", (e) => {
      state.maxPrice = Number(e.target.value);
      if (priceValueLabel) priceValueLabel.textContent = `₹${state.maxPrice.toLocaleString("en-IN")}`;
      renderCatalog();
    });
  }
}

function renderCatalog() {
  const grid = document.getElementById("catalog-products-grid");
  const countEl = document.getElementById("catalog-results-count");
  if (!grid) return;

  const q = state.searchQuery.toLowerCase().trim();
  const filtered = state.products.filter(p => {
    const matchesCat = state.selectedCategory === "All Categories" || p.category.toLowerCase() === state.selectedCategory.toLowerCase();
    const matchesState = state.selectedState === "All States" || (p.originState && p.originState.toLowerCase() === state.selectedState.toLowerCase());
    const matchesPrice = p.finalPrice <= state.maxPrice;
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.originState && p.originState.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q))) ||
      p.description.toLowerCase().includes(q);

    return matchesCat && matchesState && matchesPrice && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} ${t("navCatalog")}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-stone-500">
        <div class="text-4xl mb-3">🔍</div>
        <p class="text-lg font-medium">No crafts found matching your filters.</p>
        <p class="text-sm">Try searching for "Madhubani", "brass", "wood", or reset filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const artisan = state.artisans.find(a => a.id === p.artisanId) || state.currentArtisan;
    const localizedTitle = (p.titleRegional && p.titleRegional[state.currentLang]) || p.title;
    const mats = Array.isArray(p.materials) ? p.materials.slice(0, 2).join(" • ") : p.materials;

    return `
      <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
        <!-- Image Container -->
        <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
          <img 
            src="${p.enhancedImageUrl || p.imageUrl}" 
            alt="${localizedTitle}" 
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          ${p.hasGiTag ? `
            <span class="absolute top-2.5 left-2.5 bg-orange-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span>✦</span> GI Tagged
            </span>
          ` : ""}
          <span class="absolute bottom-2.5 right-2.5 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md">
            ${p.originState || "India"}
          </span>
        </div>

        <!-- Content -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="text-xs text-stone-500 font-medium mb-1">${p.category}</div>
            <h3 class="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 mb-2">
              ${localizedTitle}
            </h3>
            <p class="text-xs text-stone-500 mb-3 flex items-center gap-1.5">
              <span>🌱</span> <span>${mats || "Natural Artisanal Materials"}</span>
            </p>
          </div>

          <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Fair Direct Price</div>
              <div class="text-lg font-extrabold text-amber-700">₹${Number(p.finalPrice).toLocaleString("en-IN")}</div>
            </div>
            <div class="flex items-center gap-1.5">
              <button 
                data-action="view-product" 
                data-id="${p.id}"
                class="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold"
                title="View Full Story & Details"
              >
                Story
              </button>
              <button 
                data-action="share-card" 
                data-id="${p.id}"
                class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
                title="Generate Market Stall Card"
              >
                Card
              </button>
              <button 
                data-action="open-inquiry" 
                data-id="${p.id}"
                class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Attach card action handlers
  grid.querySelectorAll("button[data-action='view-product']").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-id");
      const prod = state.products.find(p => p.id === prodId);
      if (prod) openProductDetailModal(prod);
    });
  });

  grid.querySelectorAll("button[data-action='share-card']").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-id");
      const prod = state.products.find(p => p.id === prodId);
      if (prod) openMarketCardModal(prod);
    });
  });

  grid.querySelectorAll("button[data-action='open-inquiry']").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-id");
      const prod = state.products.find(p => p.id === prodId);
      if (prod) openInquiryModal(prod);
    });
  });
}

// ==============================================================================
// 10. PRODUCT DETAIL MODAL
// ==============================================================================
function openProductDetailModal(product) {
  const modal = document.getElementById("product-detail-modal");
  if (!modal) return;

  const artisan = state.artisans.find(a => a.id === product.artisanId) || state.currentArtisan;
  const localizedTitle = (product.titleRegional && product.titleRegional[state.currentLang]) || product.title;

  document.getElementById("detail-modal-img").src = product.enhancedImageUrl || product.imageUrl;
  document.getElementById("detail-modal-title").textContent = localizedTitle;
  document.getElementById("detail-modal-category").textContent = product.category;
  document.getElementById("detail-modal-price").textContent = `₹${Number(product.finalPrice).toLocaleString("en-IN")}`;
  document.getElementById("detail-modal-desc").textContent = product.description;
  document.getElementById("detail-modal-story").textContent = product.culturalStory || "Handcrafted according to ancestral traditions.";
  document.getElementById("detail-modal-artisan-name").textContent = artisan.fullName;
  document.getElementById("detail-modal-artisan-village").textContent = `${artisan.districtVillage || artisan.state} • ${artisan.yearsExperience} yrs experience`;

  const modalArtisanImg = document.getElementById("detail-modal-artisan-img");
  if (modalArtisanImg) {
    modalArtisanImg.src = artisan.profileImage || "/assets/sitadevi_profile.jpg";
  }

  // WhatsApp click to chat
  const waBtn = document.getElementById("detail-btn-whatsapp");
  if (waBtn) {
    const rawPhone = (artisan.phone || "").replace(/\D/g, "");
    const waText = encodeURIComponent(`Namaste ${artisan.fullName}! I am interested in your handcrafted item "${product.title}" listed on Artisan for ₹${product.finalPrice}. Is it available for order?`);
    waBtn.onclick = () => {
      window.open(`https://wa.me/${rawPhone || "919876543210"}?text=${waText}`, "_blank");
    };
  }

  // Call Artisan
  const callBtn = document.getElementById("detail-btn-call");
  if (callBtn) {
    callBtn.onclick = () => {
      window.location.href = `tel:${artisan.phone || "+919876543210"}`;
    };
  }

  // Inquire button
  const inqBtn = document.getElementById("detail-btn-inquiry");
  if (inqBtn) {
    inqBtn.onclick = () => {
      modal.classList.add("hidden");
      openInquiryModal(product);
    };
  }

  modal.classList.remove("hidden");
  document.getElementById("btn-close-detail-modal").onclick = () => modal.classList.add("hidden");
}

// ==============================================================================
// 11. BUYER INQUIRY & ORDER MODAL
// ==============================================================================
let activeInquiryProduct = null;
function setupInquiryModal() {
  const form = document.getElementById("buyer-inquiry-form");
  const closeBtn = document.getElementById("btn-close-inquiry-modal");
  const modal = document.getElementById("buyer-inquiry-modal");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const buyerName = document.getElementById("inq-buyer-name")?.value;
      const buyerPhone = document.getElementById("inq-buyer-phone")?.value;
      const buyerLocation = document.getElementById("inq-buyer-location")?.value;
      const quantity = document.getElementById("inq-quantity")?.value;
      const message = document.getElementById("inq-message")?.value;

      if (!buyerName || !buyerPhone) {
        showToast("Please provide your name and mobile number.", "warning");
        return;
      }

      const payload = {
        productId: activeInquiryProduct?.id,
        artisanId: activeInquiryProduct?.artisanId || "artisan-1",
        buyerName,
        buyerPhone,
        buyerLocation,
        quantity: Number(quantity) || 1,
        message
      };

      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          state.inquiries.unshift(data.inquiry);
          showToast(t("inquirySuccess"), "success");
          modal.classList.add("hidden");
          form.reset();
          renderArtisanStudio();
        }
      } catch (err) {
        console.error("Inquiry error:", err);
        showToast("Failed to submit inquiry.", "error");
      }
    });
  }
}

function openInquiryModal(product) {
  activeInquiryProduct = product;
  const modal = document.getElementById("buyer-inquiry-modal");
  const titleEl = document.getElementById("inq-product-title-display");
  const priceEl = document.getElementById("inq-product-price-display");

  if (titleEl) titleEl.textContent = product.title;
  if (priceEl) priceEl.textContent = `₹${Number(product.finalPrice).toLocaleString("en-IN")}`;

  if (modal) modal.classList.remove("hidden");
}

// ==============================================================================
// 12. ARTISAN STUDIO & INQUIRIES DASHBOARD
// ==============================================================================
async function fetchInquiries() {
  try {
    const res = await fetch("/api/inquiries");
    const data = await res.json();
    if (data.inquiries && Array.isArray(data.inquiries)) {
      state.inquiries = data.inquiries;
      renderArtisanStudio();
    }
  } catch (e) {
    console.warn("Could not fetch inquiries:", e);
  }
}

function renderArtisanStudio() {
  const listingsCount = document.getElementById("studio-listings-count");
  const inquiriesCount = document.getElementById("studio-inquiries-count");
  const inquiriesList = document.getElementById("studio-inquiries-list");
  const studioAvatar = document.getElementById("artisan-profile-avatar");

  if (studioAvatar && state.currentArtisan?.profileImage) {
    studioAvatar.src = state.currentArtisan.profileImage;
  }

  const myCrafts = state.products.filter(p => p.artisanId === state.currentArtisan.id);
  if (listingsCount) listingsCount.textContent = myCrafts.length;
  if (inquiriesCount) inquiriesCount.textContent = state.inquiries.length;

  if (inquiriesList) {
    if (state.inquiries.length === 0) {
      inquiriesList.innerHTML = `<div class="p-6 text-center text-stone-500">No buyer inquiries received yet.</div>`;
      return;
    }

    inquiriesList.innerHTML = state.inquiries.map(inq => {
      const prod = state.products.find(p => p.id === inq.productId) || { title: "Craft Item", finalPrice: 0 };
      const rawPhone = (inq.buyerPhone || "").replace(/\D/g, "");
      const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(`Namaste ${inq.buyerName}, thank you for your interest in our handcrafted ${prod.title}. I am happy to discuss your order!`)}`;

      return `
        <div class="p-4 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-stone-900 text-sm">${inq.buyerName}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">${inq.quantity} unit(s)</span>
              <span class="text-[11px] text-stone-400">${new Date(inq.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="text-xs text-stone-600 mb-1">
              <strong>Item:</strong> ${prod.title} (₹${prod.finalPrice})
            </div>
            <div class="text-xs text-stone-500">
              📍 ${inq.buyerLocation || "India"} | 💬 "${inq.message || "Interested in buying"}"
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a 
              href="${waLink}" 
              target="_blank" 
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
            >
              <span>💬</span> WhatsApp Buyer
            </a>
            <a 
              href="tel:${inq.buyerPhone}" 
              class="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1"
            >
              <span>📞</span> Call
            </a>
          </div>
        </div>
      `;
    }).join("");
  }
}

// ==============================================================================
// 10. INTERACTIVE AI ARTISAN ADVISOR (GEMINI CONVERSATIONAL ASSISTANT)
// ==============================================================================
let aiChatHistory = [];

function setupAIChatAdvisor() {
  const chatForm = document.getElementById("ai-chat-form");
  const chatInput = document.getElementById("ai-chat-input");
  const chatMessages = document.getElementById("ai-chat-messages");
  const chatLoading = document.getElementById("ai-chat-loading");
  const clearBtn = document.getElementById("btn-clear-ai-chat");
  const micBtn = document.getElementById("btn-ai-chat-mic");
  const promptChips = document.querySelectorAll(".ai-prompt-chip");

  // Quick prompt chip clicks
  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const promptText = chip.getAttribute("data-prompt");
      if (promptText && chatInput) {
        chatInput.value = promptText;
        submitAIChatMessage(promptText);
      }
    });
  });

  // Form submit
  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = "";
      submitAIChatMessage(text);
    });
  }

  // Clear chat
  if (clearBtn && chatMessages) {
    clearBtn.addEventListener("click", () => {
      aiChatHistory = [];
      chatMessages.innerHTML = `
        <div class="flex items-start gap-3 max-w-2xl">
          <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
            🤖
          </div>
          <div class="bg-white p-4 rounded-2xl rounded-tl-xs border border-stone-200 shadow-xs text-xs sm:text-sm text-stone-800 space-y-2 leading-relaxed">
            <div class="font-bold text-amber-900">Chat cleared. How can I assist you with your traditional crafts today?</div>
            <p class="text-stone-600 text-xs">Ask any question about fair pricing formulas, craft origins, GI validation, or direct marketing!</p>
          </div>
        </div>
      `;
      showToast("Conversation cleared", "info");
    });
  }

  // Microphone voice speech-to-text
  if (micBtn && chatInput) {
    micBtn.addEventListener("click", () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("Voice recognition not supported in this browser. Please type your question.", "info");
        return;
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = state.currentLang === "hi" ? "hi-IN" : "en-IN";
        recognition.interimResults = false;
        
        micBtn.classList.add("bg-red-500", "text-white", "animate-pulse");
        showToast("Listening... Speak your question now", "info");

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            chatInput.value = transcript;
            submitAIChatMessage(transcript);
          }
        };

        recognition.onerror = () => {
          micBtn.classList.remove("bg-red-500", "text-white", "animate-pulse");
          showToast("Voice input paused.", "info");
        };

        recognition.onend = () => {
          micBtn.classList.remove("bg-red-500", "text-white", "animate-pulse");
        };

        recognition.start();
      } catch (err) {
        micBtn.classList.remove("bg-red-500", "text-white", "animate-pulse");
      }
    });
  }
}

async function submitAIChatMessage(messageText) {
  const chatMessages = document.getElementById("ai-chat-messages");
  const chatLoading = document.getElementById("ai-chat-loading");
  if (!chatMessages) return;

  // Append user bubble
  const userBubble = document.createElement("div");
  userBubble.className = "flex items-start justify-end gap-3";
  userBubble.innerHTML = `
    <div class="bg-gradient-to-r from-amber-700 to-orange-700 text-white p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm max-w-xl leading-relaxed">
      ${escapeHtml(messageText)}
    </div>
    <div class="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      👤
    </div>
  `;
  chatMessages.appendChild(userBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (chatLoading) chatLoading.classList.remove("hidden");

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        history: aiChatHistory,
        language: state.currentLang
      })
    });

    const data = await res.json();
    if (chatLoading) chatLoading.classList.add("hidden");

    const reply = data.reply || data.error || "Sorry, I could not process your request at this moment.";

    // Track history
    aiChatHistory.push({ role: "user", text: messageText });
    aiChatHistory.push({ role: "model", text: reply });

    // Format markdown in reply
    const formattedReply = formatMarkdownSimple(reply);

    // Append AI bubble
    const aiBubble = document.createElement("div");
    aiBubble.className = "flex items-start gap-3 max-w-2xl";
    aiBubble.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
        🤖
      </div>
      <div class="bg-white p-4 rounded-2xl rounded-tl-xs border border-stone-200 shadow-xs text-xs sm:text-sm text-stone-800 space-y-2 leading-relaxed">
        <div class="flex items-center justify-between text-[11px] text-amber-900/70 border-b border-stone-100 pb-1.5 mb-1 font-semibold">
          <span>Artisan AI • ${data.modelUsed || "Gemini"}</span>
          <button class="btn-copy-chat hover:text-amber-800 text-stone-400 transition-colors" title="Copy answer">📋 Copy</button>
        </div>
        <div class="chat-reply-content prose-sm">
          ${formattedReply}
        </div>
      </div>
    `;

    const copyBtn = aiBubble.querySelector(".btn-copy-chat");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(reply);
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 2000);
      });
    }

    chatMessages.appendChild(aiBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (err) {
    if (chatLoading) chatLoading.classList.add("hidden");
    const errBubble = document.createElement("div");
    errBubble.className = "flex items-start gap-3 max-w-2xl";
    errBubble.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        ⚠️
      </div>
      <div class="bg-red-50 p-4 rounded-2xl rounded-tl-xs border border-red-200 shadow-xs text-xs sm:text-sm text-red-900 leading-relaxed">
        Could not connect to the AI service. Please check your connection or try again.
      </div>
    `;
    chatMessages.appendChild(errBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function formatMarkdownSimple(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Bullet lines starting with * or -
  html = html.replace(/^\s*[\*\-]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Wrap lists
  html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-2 space-y-1">$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n+/g, '<p class="my-2"></p>');
  html = html.replace(/\n/g, '<br />');

  return html;
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function createCraftSampleCanvas(title, primaryColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, "#1c1917");
  grad.addColorStop(1, primaryColor || "#78350f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);
  
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(200, 140, 80, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = "rgba(251,191,36,0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 200, 140);
  
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#fef08a";
  ctx.fillText("Traditional Indian Artisan Heritage", 200, 168);
  
  return canvas.toDataURL("image/jpeg", 0.9);
}
