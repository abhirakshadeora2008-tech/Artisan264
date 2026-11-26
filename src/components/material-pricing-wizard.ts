/**
 * ARTISAN MARKETPLACE: MATERIAL PRICING & ACCESSIBILITY WIZARD
 * File: src/components/material-pricing-wizard.ts
 * 
 * Orchestrates:
 * 1. Offline-First Material & Cost Validation (IndexedDB + +/-30% Warning Modal)
 * 2. AI Pricing Transparency & Override Simulator (+/- 25% capped slider + Health Meter)
 * 3. Village Trust Linear Milestone Timeline & Web Speech Audio Narrator
 * 4. Supabase Dynamic Hydration & Batch Synchronization
 */

import { ProductListingPayload, MilestoneStatus } from "../types/artisan.ts";
import { OfflineSyncManager } from "../services/storage.ts";
import { validateMaterialCost, CostWarningModalController, INTERNAL_MATERIAL_BENCHMARKS } from "../services/validation.ts";
import { calculatePricingBreakdown, evaluateSaleLikelihood } from "../services/pricing.ts";
import { VillageAudioAssistant } from "../services/accessibility.ts";
import { SupabaseArtisanService } from "../services/supabase.ts";
import { renderFinancialTimelineHTML } from "./milestone-timeline.ts";

/**
 * Generates the accessible HTML5/CSS3 template for the entire modular suite.
 */
export function renderMaterialPricingWizardHTML(): string {
  const defaultTimelineHTML = renderFinancialTimelineHTML("listed");

  return `
    <div id="artisan-pricing-suite" class="max-w-5xl mx-auto space-y-8 font-sans">
      
      <!-- Top Network Sync Status Banner -->
      <div id="sync-status-banner" class="rounded-2xl p-4 bg-[#EAF1ED] border border-[#6F9B88]/40 flex items-center justify-between shadow-xs transition-all">
        <div class="flex items-center gap-3">
          <span id="sync-status-indicator" class="w-2.5 h-2.5 rounded-full bg-[#174C43] pulse-subtle"></span>
          <span id="sync-status-text" class="text-xs font-bold text-[#174C43]">
            Online • Cloud Synchronization Active
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span id="offline-queue-badge" class="hidden px-2.5 py-1 rounded-full text-xs font-black bg-[#C95D35] text-white shadow-xs">
            0 Queued
          </span>
          <button 
            type="button" 
            id="btn-force-sync" 
            class="hidden px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-[#102F35] border border-[#E6E2D6] hover:bg-[#FAF8F2] shadow-xs transition-colors"
          >
            🔄 Sync Now
          </button>
        </div>
      </div>

      <!-- Linear Milestone Timeline (Feature 3) -->
      <div id="milestone-timeline-container">
        ${defaultTimelineHTML}
      </div>

      <!-- Main Form & Pricing Grid -->
      <form id="craft-pricing-form" class="grid grid-cols-1 lg:grid-cols-12 gap-8" novalidate>
        
        <!-- Left Column: Form & Material Validation (Feature 1) -->
        <div class="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#E6E2D6] shadow-xs space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-[#E6E2D6]">
            <div>
              <h2 class="text-xl font-bold text-[#102F35] font-serif">1. Material & Labor Specification</h2>
              <p class="text-xs text-[#566C70]">Fair cost entry with automatic ±30% craft board benchmark checks</p>
            </div>
            <button 
              type="button" 
              class="audio-btn p-2 rounded-full text-[#174C43] bg-[#EAF1ED] hover:bg-[#DCEAE2] focus:outline-none focus:ring-2 focus:ring-[#174C43]"
              data-audio-text="Material and Labor Specification. Select your craft material, enter what you paid, and your hours of work."
              aria-label="Listen to section instructions"
            >
              🔊
            </button>
          </div>

          <!-- Product Name Input -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="product-name-input" class="text-xs font-bold text-[#102F35]">
                Craft / Product Title
              </label>
              <button 
                type="button" 
                class="audio-btn text-xs text-[#174C43] hover:underline flex items-center gap-1 font-medium"
                data-audio-target="product-name-input"
              >
                <span>🔊</span> <span>Listen</span>
              </button>
            </div>
            <input 
              type="text" 
              id="product-name-input" 
              name="product_name"
              required 
              placeholder="e.g., Hand-carved Teak Elephant, Madhubani Sun Art"
              class="w-full p-3.5 rounded-xl border border-[#E6E2D6] bg-[#FAF8F2] focus:bg-white focus:ring-2 focus:ring-[#174C43] text-sm font-semibold text-[#102F35] transition-all"
            />
          </div>

          <!-- Standardized Material Catalog Dropdown & Numeric Cost Input -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Material Dropdown -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="material-catalog-select" class="text-xs font-bold text-[#102F35]">
                  Standardized Material
                </label>
                <button 
                  type="button" 
                  class="audio-btn text-xs text-[#174C43] hover:underline flex items-center gap-1 font-medium"
                  data-audio-text="Standardized Material Catalog. Choose Clay, Yarn, Wood, Silk, Brass, Bamboo, Stone, or Leather."
                >
                  <span>🔊</span> <span>Listen</span>
                </button>
              </div>
              <select 
                id="material-catalog-select" 
                name="material_type"
                class="w-full p-3.5 rounded-xl border border-[#E6E2D6] bg-white focus:ring-2 focus:ring-[#174C43] text-sm font-semibold text-[#102F35] shadow-2xs cursor-pointer"
              >
                <!-- Hydrated dynamically from Supabase or Fallback -->
                <option value="Wood">Wood (Teak / Neem / Sheesham)</option>
                <option value="Clay">Clay (Terracotta / Pottery)</option>
                <option value="Yarn">Yarn (Khadi / Organic Cotton)</option>
                <option value="Silk">Silk (Tussar / Mulberry)</option>
                <option value="Brass">Brass (Dhokra Bell Metal)</option>
                <option value="Bamboo">Bamboo (Cane & Reeds)</option>
                <option value="Stone">Stone (Soapstone / Marble)</option>
                <option value="Leather">Leather (Vegetable-Tanned)</option>
              </select>
              <p id="benchmark-hint-text" class="text-[11px] font-medium text-[#566C70] mt-1.5">
                Standard Benchmark Baseline: <span id="benchmark-baseline-badge" class="font-bold text-[#174C43]">₹450</span>
              </p>
            </div>

            <!-- Custom Numeric Cost Input -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="material-cost-input" class="text-xs font-bold text-[#102F35]">
                  Custom Material Cost (₹)
                </label>
                <button 
                  type="button" 
                  class="audio-btn text-xs text-[#174C43] hover:underline flex items-center gap-1 font-medium"
                  data-audio-target="material-cost-input"
                >
                  <span>🔊</span> <span>Listen</span>
                </button>
              </div>
              <div class="relative">
                <span class="absolute left-3.5 top-3.5 text-[#566C70] font-bold">₹</span>
                <input 
                  type="number" 
                  id="material-cost-input" 
                  name="custom_material_cost"
                  min="1" 
                  step="1"
                  value="450" 
                  required
                  placeholder="Enter raw material cost in Rupees"
                  class="w-full pl-8 pr-3.5 py-3.5 rounded-xl border border-[#E6E2D6] bg-white focus:ring-2 focus:ring-[#174C43] text-sm font-black text-[#102F35] shadow-2xs"
                />
              </div>
              <p class="text-[11px] text-[#566C70] mt-1.5">
                Monitored within ±30% market baseline window.
              </p>
            </div>
          </div>

          <!-- Labor Hours & Living Wage Rate -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E6E2D6]">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="labor-hours-input" class="text-xs font-bold text-[#102F35]">
                  Handcrafting Hours
                </label>
                <button 
                  type="button" 
                  class="audio-btn text-xs text-[#174C43] hover:underline flex items-center gap-1 font-medium"
                  data-audio-target="labor-hours-input"
                >
                  <span>🔊</span> <span>Listen</span>
                </button>
              </div>
              <input 
                type="number" 
                id="labor-hours-input" 
                name="labor_hours"
                min="0.5" 
                step="0.5" 
                value="12" 
                required
                class="w-full p-3.5 rounded-xl border border-[#E6E2D6] bg-white focus:ring-2 focus:ring-[#174C43] text-sm font-bold text-[#102F35] shadow-2xs"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="hourly-wage-input" class="text-xs font-bold text-[#102F35]">
                  Living Wage Rate (₹/hr)
                </label>
                <button 
                  type="button" 
                  class="audio-btn text-xs text-[#174C43] hover:underline flex items-center gap-1 font-medium"
                  data-audio-target="hourly-wage-input"
                >
                  <span>🔊</span> <span>Listen</span>
                </button>
              </div>
              <div class="relative">
                <span class="absolute left-3.5 top-3.5 text-[#566C70] font-bold">₹</span>
                <input 
                  type="number" 
                  id="hourly-wage-input" 
                  name="hourly_rate"
                  min="50" 
                  step="5" 
                  value="90" 
                  required
                  class="w-full pl-8 pr-3.5 py-3.5 rounded-xl border border-[#E6E2D6] bg-white focus:ring-2 focus:ring-[#174C43] text-sm font-bold text-[#102F35] shadow-2xs"
                />
              </div>
              <p class="text-[11px] text-[#174C43] font-semibold mt-1.5">
                ✓ Compliant with fair rural living standards (≥ ₹80/hr).
              </p>
            </div>
          </div>

          <!-- Submit / Sync Action Button -->
          <div class="pt-6 border-t border-[#E6E2D6] flex items-center justify-between gap-4">
            <div class="text-xs text-[#566C70]">
              <span id="offline-safe-text">Offline-Ready: Form automatically queues if internet drops.</span>
            </div>
            <button 
              type="submit" 
              id="btn-submit-listing"
              class="px-8 py-3.5 rounded-xl bg-[#174C43] hover:bg-[#0F3630] active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Publish Craft Listing</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- Right Column: AI Pricing Transparency & Override Simulator (Feature 2) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- AI Mathematical Breakdown Card -->
          <div class="bg-[#FAF8F2] rounded-2xl p-6 border border-[#E6E2D6] shadow-xs space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-[#E6E2D6]">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚖️</span>
                <h3 class="text-base font-bold text-[#102F35] font-serif">
                  AI Pricing Transparency
                </h3>
              </div>
              <button 
                type="button" 
                class="audio-btn p-1.5 rounded-full text-[#174C43] hover:bg-[#EAF1ED]"
                data-audio-text="AI Pricing Formula. Material Cost plus Hours worked multiplied by Hourly Rate equals AI Fair Base Price."
                aria-label="Listen to pricing formula"
              >
                🔊
              </button>
            </div>

            <!-- Mathematical Equation Visualization -->
            <div class="bg-white rounded-xl p-4 border border-[#E6E2D6] shadow-2xs space-y-3">
              <div class="text-[11px] font-bold text-[#566C70] uppercase tracking-wider">
                Transparent Living-Wage Equation:
              </div>
              <div class="flex items-center justify-between text-xs sm:text-sm font-black text-[#102F35]">
                <div class="text-center">
                  <div class="text-[10px] text-[#566C70] uppercase font-semibold">Material</div>
                  <span id="formula-mat-display" class="text-[#C95D35] font-extrabold">₹450</span>
                </div>
                <span class="text-[#566C70] text-lg">+</span>
                <div class="text-center">
                  <div class="text-[10px] text-[#566C70] uppercase font-semibold">Labor Total</div>
                  <span id="formula-labor-display" class="text-[#174C43] font-extrabold">₹1,080</span>
                </div>
                <span class="text-[#566C70] text-lg">=</span>
                <div class="text-center">
                  <div class="text-[10px] text-[#174C43] uppercase font-bold">AI Fair Base</div>
                  <span id="formula-ai-base-display" class="text-[#174C43] font-black text-base">₹1,530</span>
                </div>
              </div>
              <div class="text-[10px] text-[#566C70] pt-2 border-t border-[#E6E2D6] flex items-center justify-between">
                <span>Labor Calculation:</span>
                <span id="formula-labor-subtext" class="font-semibold text-[#102F35]">12 hrs × ₹90/hr</span>
              </div>
            </div>

            <!-- Override Slider Interface -->
            <div class="bg-white rounded-xl p-4 border border-[#E6E2D6] shadow-2xs space-y-3">
              <div class="flex items-center justify-between">
                <label for="price-override-slider" class="text-xs font-bold text-[#102F35]">
                  Manual Price Override (±25% Max)
                </label>
                <span 
                  id="slider-percent-badge" 
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F2] text-[#102F35] border border-[#E6E2D6]"
                >
                  0% (AI Default)
                </span>
              </div>

              <!-- Native HTML5 Range Input Slider -->
              <div class="space-y-1.5">
                <input 
                  type="range" 
                  id="price-override-slider" 
                  name="price_override_slider"
                  min="-25" 
                  max="25" 
                  value="0" 
                  step="1" 
                  class="w-full h-2 bg-[#E6E2D6] rounded-lg appearance-none cursor-pointer accent-[#174C43] focus:outline-none focus:ring-2 focus:ring-[#174C43]"
                  aria-label="Price adjustment percentage slider from minus 25 percent to plus 25 percent"
                />
                <div class="flex justify-between text-[10px] font-bold text-[#566C70] px-1">
                  <span>-25% (Quick Turnaround)</span>
                  <span>0% (Fair Baseline)</span>
                  <span>+25% (Premium)</span>
                </div>
              </div>

              <!-- Dynamic Final Price Display -->
              <div class="pt-3 border-t border-[#E6E2D6] flex items-center justify-between">
                <div>
                  <span class="text-[10px] font-bold text-[#566C70] uppercase">Final Listing Price</span>
                  <div id="final-price-display" class="text-2xl sm:text-3xl font-black text-[#174C43]">
                    ₹1,530
                  </div>
                </div>
                <button 
                  type="button" 
                  id="btn-tts-final-price"
                  class="audio-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EAF1ED] text-[#174C43] border border-[#6F9B88]/30 hover:bg-[#DCEAE2] shadow-2xs flex items-center gap-1"
                  data-audio-text="Final listing price is 1530 rupees."
                  aria-label="Listen to final calculated price"
                >
                  <span>🔊</span> <span>Listen Price</span>
                </button>
              </div>
            </div>

            <!-- Likelihood of Sale Health Meter Card -->
            <div id="likelihood-health-card" class="bg-white rounded-xl p-4 border border-[#E6E2D6] shadow-2xs space-y-2.5 transition-all">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm">📊</span>
                  <span class="text-xs font-bold text-[#102F35]">Likelihood of Sale Meter</span>
                </div>
                <span 
                  id="likelihood-badge" 
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF1ED] text-[#174C43] border border-[#6F9B88]/40"
                >
                  Balanced (80%)
                </span>
              </div>

              <!-- Visual Health Gauge Bar -->
              <div class="w-full h-2.5 rounded-full bg-[#FAF8F2] overflow-hidden border border-[#E6E2D6] relative">
                <div 
                  id="likelihood-gauge-bar" 
                  class="h-full bg-gradient-to-r from-[#6F9B88] to-[#174C43] rounded-full transition-all duration-300"
                  style="width: 80%;"
                ></div>
              </div>

              <p id="likelihood-desc-text" class="text-xs text-[#566C70] leading-snug">
                Market Recommended: Priced within the optimal sweet spot. Maximizes direct artisan income while maintaining high buyer trust.
              </p>
            </div>

          </div>

        </div>

      </form>

      <!-- CUSTOM ACCESSIBLE WARNING MODAL (Feature 1) -->
      <div 
        id="cost-deviation-modal" 
        class="hidden fixed inset-0 z-50 bg-[#102F35]/70 backdrop-blur-xs flex items-center justify-center p-4"
        role="alertdialog" 
        aria-modal="true" 
        aria-labelledby="modal-deviation-title" 
        aria-describedby="modal-deviation-desc"
        aria-hidden="true"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-[#E6E2D6] space-y-5 text-left transform transition-all">
          
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-[#FBF1ED] border border-[#C95D35]/30 flex items-center justify-center text-xl flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 id="modal-deviation-title" data-modal-title class="text-base font-bold text-[#102F35] leading-tight font-serif">
                  Material Cost Deviation Warning
                </h3>
                <span data-modal-badge class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF1ED] text-[#C95D35] border border-[#C95D35]/20">
                  +35% Deviation
                </span>
              </div>
            </div>
            
            <button 
              type="button" 
              class="audio-btn p-1.5 rounded-full text-[#566C70] hover:text-[#102F35] hover:bg-[#FAF8F2]"
              data-audio-text="Warning. Your entered material cost deviates by more than 30 percent from standard craft board market rates. Please review."
              aria-label="Listen to warning dialog"
            >
              🔊
            </button>
          </div>

          <p id="modal-deviation-desc" data-modal-desc class="text-xs sm:text-sm text-[#566C70] leading-relaxed">
            Your entered material cost deviates from the verified craft council baseline for this material.
          </p>

          <!-- Statistics comparison badge -->
          <div class="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E6E2D6] grid grid-cols-2 gap-3 text-center text-xs">
            <div>
              <span class="text-[10px] text-[#566C70] uppercase font-semibold">Standard Baseline</span>
              <div data-modal-baseline class="text-sm font-bold text-[#102F35]">₹450</div>
            </div>
            <div>
              <span class="text-[10px] text-[#566C70] uppercase font-semibold">Your Entered Cost</span>
              <div data-modal-entered class="text-sm font-bold text-[#C95D35]">₹680</div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              type="button" 
              id="modal-btn-adjust" 
              data-modal-cancel
              class="flex-1 py-3 px-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F0ECE1] text-[#102F35] font-bold text-xs transition-colors border border-[#E6E2D6]"
            >
              ← Adjust to Benchmark
            </button>
            <button 
              type="button" 
              id="modal-btn-override" 
              data-modal-confirm
              class="flex-1 py-3 px-4 rounded-xl bg-[#174C43] hover:bg-[#0F3630] text-white font-bold text-xs shadow-xs transition-colors"
            >
              Keep My Cost (Override)
            </button>
          </div>

        </div>
      </div>

    </div>
  `;
}

/**
 * Controller class that binds UI elements, event listeners, services, and accessibility hooks.
 */
export class MaterialPricingWizardController {
  private syncManager: OfflineSyncManager;
  private audioAssistant: VillageAudioAssistant;
  private modalController: CostWarningModalController;
  private supabaseService: SupabaseArtisanService;

  private benchmarks: Record<string, number> = { ...INTERNAL_MATERIAL_BENCHMARKS };
  private activeArtisanId = "a0000000-0000-0000-0000-000000000001"; // Master Sitadevi default
  private currentStatus: MilestoneStatus = "listed";

  constructor() {
    this.audioAssistant = new VillageAudioAssistant();
    this.modalController = new CostWarningModalController("cost-deviation-modal");
    this.supabaseService = new SupabaseArtisanService();

    this.syncManager = new OfflineSyncManager(
      "/api/sync/products",
      (isOnline, queuedCount) => this.handleNetworkStatusChange(isOnline, queuedCount)
    );
  }

  /**
   * Initializes the entire interactive controller.
   */
  public async init(containerElement: HTMLElement): Promise<void> {
    // 1. Render layout
    containerElement.innerHTML = renderMaterialPricingWizardHTML();

    // 2. Hydrate benchmarks from Supabase with graceful fallback
    await this.hydrateMaterialBenchmarks();

    // 3. Attach speech assistant to floating speaker buttons
    this.audioAssistant.attachToAllButtons(containerElement);

    // 4. Bind interactive inputs and events
    this.bindFormEvents();
    this.bindModalEvents();
    this.bindSyncBannerEvents();

    // 5. Initial calculation pass
    this.recalculatePricing();
  }

  /**
   * Hydrates material dropdown and internal memory with Supabase records.
   */
  private async hydrateMaterialBenchmarks(): Promise<void> {
    try {
      const records = await this.supabaseService.fetchMaterialBenchmarks();
      const selectEl = document.getElementById("material-catalog-select") as HTMLSelectElement | null;

      if (records && records.length > 0) {
        this.benchmarks = {};
        if (selectEl) {
          selectEl.innerHTML = "";
        }

        records.forEach((b) => {
          this.benchmarks[b.material_name] = Number(b.average_cost);
          if (selectEl) {
            const opt = document.createElement("option");
            opt.value = b.material_name;
            opt.textContent = `${b.material_name} (Benchmark: ₹${b.average_cost})`;
            selectEl.appendChild(opt);
          }
        });
      }

      this.updateBenchmarkHint();
    } catch (err) {
      console.warn("[Wizard] Using local fallback benchmarks:", err);
    }
  }

  /**
   * Binds form controls (Material Select, Cost Input, Labor Hours, Hourly Wage, Range Slider).
   */
  private bindFormEvents(): void {
    const materialSelect = document.getElementById("material-catalog-select") as HTMLSelectElement | null;
    const costInput = document.getElementById("material-cost-input") as HTMLInputElement | null;
    const hoursInput = document.getElementById("labor-hours-input") as HTMLInputElement | null;
    const wageInput = document.getElementById("hourly-wage-input") as HTMLInputElement | null;
    const slider = document.getElementById("price-override-slider") as HTMLInputElement | null;
    const form = document.getElementById("craft-pricing-form") as HTMLFormElement | null;

    // A. Material selection change -> update baseline hint & reset entered cost to benchmark
    materialSelect?.addEventListener("change", () => {
      this.updateBenchmarkHint();
      const currentMat = materialSelect.value;
      const benchmarkRate = this.benchmarks[currentMat] || 250;
      if (costInput) {
        costInput.value = String(benchmarkRate);
      }
      this.recalculatePricing();
    });

    // B. Cost input change/blur -> Trigger +/- 30% deviation warning modal
    costInput?.addEventListener("blur", () => {
      this.checkMaterialCostDeviation();
    });

    costInput?.addEventListener("input", () => {
      this.recalculatePricing();
    });

    // C. Hours & Wage input
    hoursInput?.addEventListener("input", () => this.recalculatePricing());
    wageInput?.addEventListener("input", () => this.recalculatePricing());

    // D. Range Slider -> scale final price by capped margin of +/- 25% and update Likelihood meter
    slider?.addEventListener("input", () => {
      this.recalculatePricing();
    });

    // E. Form submission with offline interception & validation
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });
  }

  /**
   * Evaluates cost deviation against the baseline rate and pops the modal if > 30%.
   */
  private checkMaterialCostDeviation(): void {
    const materialSelect = document.getElementById("material-catalog-select") as HTMLSelectElement | null;
    const costInput = document.getElementById("material-cost-input") as HTMLInputElement | null;

    if (!materialSelect || !costInput) return;

    const material = materialSelect.value;
    const enteredCost = Number(costInput.value) || 0;

    const result = validateMaterialCost(material, enteredCost, this.benchmarks);

    if (result.isOutlier) {
      // Trigger accessible modal with voice readout support
      this.modalController.showWarning(
        result,
        // On Confirm (Keep My Custom Cost)
        () => {
          console.info("[Validation] Artisan chose to override benchmark with custom cost:", enteredCost);
          this.recalculatePricing();
        },
        // On Cancel (Adjust to Benchmark)
        () => {
          costInput.value = String(result.baselineCost);
          this.recalculatePricing();
          costInput.focus();
        }
      );
    }
  }

  /**
   * Binds modal buttons (Adjust vs Keep My Custom Cost).
   */
  private bindModalEvents(): void {
    const adjustBtn = document.getElementById("modal-btn-adjust");
    const overrideBtn = document.getElementById("modal-btn-override");

    adjustBtn?.addEventListener("click", () => this.modalController.handleCancel());
    overrideBtn?.addEventListener("click", () => this.modalController.handleConfirm());
  }

  /**
   * Updates benchmark baseline display badge.
   */
  private updateBenchmarkHint(): void {
    const materialSelect = document.getElementById("material-catalog-select") as HTMLSelectElement | null;
    const baselineBadge = document.getElementById("benchmark-baseline-badge");
    if (!materialSelect || !baselineBadge) return;

    const mat = materialSelect.value;
    const cost = this.benchmarks[mat] ?? 450;
    baselineBadge.textContent = `₹${cost}`;
  }

  /**
   * Recalculates formula breakdown, slider override, and Likelihood of Sale health meter.
   */
  private recalculatePricing(): void {
    const costInput = document.getElementById("material-cost-input") as HTMLInputElement | null;
    const hoursInput = document.getElementById("labor-hours-input") as HTMLInputElement | null;
    const wageInput = document.getElementById("hourly-wage-input") as HTMLInputElement | null;
    const slider = document.getElementById("price-override-slider") as HTMLInputElement | null;

    const matCost = Number(costInput?.value) || 0;
    const hours = Number(hoursInput?.value) || 0;
    const wage = Number(wageInput?.value) || 0;
    const overridePercent = Number(slider?.value) || 0;

    // Execute pricing breakdown calculation
    const breakdown = calculatePricingBreakdown(matCost, hours, wage, overridePercent);

    // Update Equation DOM elements
    const matDisp = document.getElementById("formula-mat-display");
    const laborDisp = document.getElementById("formula-labor-display");
    const aiBaseDisp = document.getElementById("formula-ai-base-display");
    const subtextDisp = document.getElementById("formula-labor-subtext");
    const finalPriceDisp = document.getElementById("final-price-display");
    const sliderBadge = document.getElementById("slider-percent-badge");
    const ttsFinalBtn = document.getElementById("btn-tts-final-price");

    if (matDisp) matDisp.textContent = `₹${breakdown.materialCost}`;
    if (laborDisp) laborDisp.textContent = `₹${breakdown.laborTotal}`;
    if (aiBaseDisp) aiBaseDisp.textContent = `₹${breakdown.aiBasePrice}`;
    if (subtextDisp) subtextDisp.textContent = `${breakdown.laborHours} hrs × ₹${breakdown.hourlyRate}/hr`;
    if (finalPriceDisp) finalPriceDisp.textContent = `₹${breakdown.finalAdjustedPrice}`;

    if (sliderBadge) {
      const sign = breakdown.overridePercent > 0 ? "+" : "";
      sliderBadge.textContent = breakdown.overridePercent === 0 
        ? "0% (AI Default)" 
        : `${sign}${breakdown.overridePercent}% Manual Override`;
      sliderBadge.className = breakdown.overridePercent > 0
        ? "px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300"
        : breakdown.overridePercent < 0
        ? "px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300"
        : "px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-stone-100 text-stone-700 border border-stone-300";
    }

    if (ttsFinalBtn) {
      ttsFinalBtn.setAttribute(
        "data-audio-text",
        `The final craft price is ${breakdown.finalAdjustedPrice} rupees.`
      );
    }

    // Evaluate & update Likelihood of Sale Health Meter
    const likelihood = evaluateSaleLikelihood(breakdown.overridePercent);
    const likelihoodBadge = document.getElementById("likelihood-badge");
    const likelihoodBar = document.getElementById("likelihood-gauge-bar");
    const likelihoodDesc = document.getElementById("likelihood-desc-text");

    if (likelihoodBadge) {
      likelihoodBadge.textContent = `${likelihood.title} (${likelihood.scorePercent}%)`;
      likelihoodBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-black ${likelihood.badgeBg} ${likelihood.badgeText}`;
    }

    if (likelihoodBar) {
      likelihoodBar.style.width = `${likelihood.scorePercent}%`;
      likelihoodBar.className = likelihood.state === "High"
        ? "h-full bg-emerald-500 rounded-full transition-all duration-300"
        : likelihood.state === "Balanced"
        ? "h-full bg-amber-500 rounded-full transition-all duration-300"
        : "h-full bg-rose-500 rounded-full transition-all duration-300";
    }

    if (likelihoodDesc) {
      likelihoodDesc.textContent = likelihood.description;
    }
  }

  /**
   * Handles listing form submission: validates, constructs payload, intercepts if offline.
   */
  private async handleFormSubmit(): Promise<void> {
    const nameInput = document.getElementById("product-name-input") as HTMLInputElement | null;
    const materialSelect = document.getElementById("material-catalog-select") as HTMLSelectElement | null;
    const costInput = document.getElementById("material-cost-input") as HTMLInputElement | null;
    const hoursInput = document.getElementById("labor-hours-input") as HTMLInputElement | null;
    const wageInput = document.getElementById("hourly-wage-input") as HTMLInputElement | null;
    const slider = document.getElementById("price-override-slider") as HTMLInputElement | null;

    const productName = nameInput?.value.trim() || "";
    if (!productName) {
      alert("Please enter a craft title for your listing.");
      nameInput?.focus();
      return;
    }

    const materialType = materialSelect?.value || "Wood";
    const customCost = Number(costInput?.value) || 0;
    const laborHours = Number(hoursInput?.value) || 0;
    const hourlyRate = Number(wageInput?.value) || 0;
    const overridePercent = Number(slider?.value) || 0;

    const breakdown = calculatePricingBreakdown(customCost, laborHours, hourlyRate, overridePercent);

    const payload: ProductListingPayload = {
      artisan_id: this.activeArtisanId,
      product_name: productName,
      material_type: materialType,
      custom_material_cost: customCost,
      labor_hours: laborHours,
      hourly_rate: hourlyRate,
      calculated_price: breakdown.finalAdjustedPrice,
      price_override_percent: breakdown.overridePercent,
      status: "listed",
      image_url: "./assets/artisan_logo.jpg",
    };

    // Submit via OfflineSyncManager (IndexedDB cache if offline, or Fetch if online)
    const result = await this.syncManager.submitListing(payload);

    if (result.success) {
      // Audio narration of success for village artisans
      this.audioAssistant.speak(
        result.isOffline
          ? "Craft listing saved offline on your phone. It will automatically upload to the marketplace when your internet reconnects."
          : "Success! Your craft listing is now live on the artisan marketplace."
      );

      alert(result.message);

      // Advance visual timeline to "listed"
      this.setTimelineStatus("listed");
      nameInput.value = "";
    } else {
      alert("Error: " + result.message);
    }
  }

  /**
   * Sets and renders updated timeline status.
   */
  public setTimelineStatus(status: MilestoneStatus): void {
    this.currentStatus = status;
    const container = document.getElementById("milestone-timeline-container");
    if (container) {
      container.innerHTML = renderFinancialTimelineHTML(status);
      this.audioAssistant.attachToAllButtons(container);
    }
  }

  /**
   * Network status handler callback from OfflineSyncManager.
   */
  private handleNetworkStatusChange(isOnline: boolean, queuedCount: number): void {
    const banner = document.getElementById("sync-status-banner");
    const indicator = document.getElementById("sync-status-indicator");
    const text = document.getElementById("sync-status-text");
    const badge = document.getElementById("offline-queue-badge");
    const syncBtn = document.getElementById("btn-force-sync");

    if (!banner || !indicator || !text) return;

    if (isOnline) {
      indicator.className = "w-3 h-3 rounded-full bg-emerald-500 animate-pulse";
      text.textContent = queuedCount > 0 
        ? `Online • Flushing ${queuedCount} queued craft listing(s)...`
        : "Online • Cloud Synchronization Active";
      banner.className = "rounded-2xl p-3.5 bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-xs";
    } else {
      indicator.className = "w-3 h-3 rounded-full bg-rose-500 animate-pulse";
      text.textContent = "Offline Mode Active • Form entries safely caching to device IndexedDB";
      banner.className = "rounded-2xl p-3.5 bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs";
    }

    if (badge) {
      if (queuedCount > 0) {
        badge.classList.remove("hidden");
        badge.textContent = `${queuedCount} Queued`;
      } else {
        badge.classList.add("hidden");
      }
    }

    if (syncBtn) {
      if (isOnline && queuedCount > 0) {
        syncBtn.classList.remove("hidden");
      } else {
        syncBtn.classList.add("hidden");
      }
    }
  }

  /**
   * Binds manual sync trigger button.
   */
  private bindSyncBannerEvents(): void {
    const syncBtn = document.getElementById("btn-force-sync");
    syncBtn?.addEventListener("click", async () => {
      syncBtn.textContent = "Syncing...";
      await this.syncManager.flushQueue();
      syncBtn.textContent = "🔄 Sync Now";
    });
  }
}
