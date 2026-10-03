# Standard Operating Procedure: WCAG 2.1 A/AA Hybrid Compliance Audit

**Document Version:** 1.0.0  
**Target Execution Window:** 60 - 90 Minutes  
**Scope:** WCAG 2.1 Level A & AA compliance and ADA risk assessment

---

## Section 1: Environment Setup & Page Sampling

### 1.1 Tooling & Environment Configuration
- **Browsers:** Google Chrome or Microsoft Edge with the **Microsoft Accessibility Insights for Web** extension installed.
- **Screen Readers:** Local NVDA (Windows) or VoiceOver (macOS).
- **Hardware:** Disconnect any physical mouse / trackpad when executing keyboard and screen reader testing phases to enforce zero-mouse validation.

### 1.2 Page Sampling Rules
Select exactly 4 to 5 high-value page templates representing the web application:
1. **Homepage / Landing View**
2. **Primary Content / Article Page**
3. **Primary Conversion Funnel** (e.g., checkout, booking, or contact form)
4. **Dynamic UI View** (e.g., interactive dashboard, modal dialog, or carousel)

---

## Section 2: Automated Execution (The `reporter.js` Pipeline)

- Execute the automated scan across the sampled target URLs by updating `targets.json` and running:
  ```bash
  npm run audit
  ```
- The script invokes `scanner.js` via Playwright and `axe-core`, processing results through `normalizer.js` to output `audit-results.json`.
- **Rule:** Do *not* manually re-verify automated DOM checks (e.g., missing alt text, ARIA attributes, contrast math) unless visual rendering explicitly contradicts the engine output.

---

## Section 3: The 3-Phase Manual Workflow (30 Criteria)

Execute the following manual testing checklist linearly across all sampled page templates.

### Phase 1: Media & Content (Mouse Allowed)
- [ ] **1.2.1** - Confirm transcript availability for prerecorded audio-only and video-only media.
- [ ] **1.2.3** - Verify synchronized prerecorded video captions or audio descriptions.
- [ ] **1.2.4** - Verify live captions on streaming media.
- [ ] **1.2.5** - Verify audio descriptions for prerecorded video.
- [ ] **1.3.3** - Verify sensory characteristics (shape, size, visual location, orientation) are not solely relied upon for instructions.
- [ ] **1.4.5** - Identify text used inside images instead of true styled text.
- [ ] **2.5.1** - Test pointer cancellation for multi-point or path-based gestures.
- [ ] **2.5.2** - Verify pointer cancellation and up-event functionality on interactive controls.

### Phase 2: Visual & Layout Simulation (Accessibility Insights / DevTools)
- [ ] **1.4.1** - Toggle grayscale/monochrome mode to verify color is not used as the sole visual means of conveying information.
- [ ] **1.4.10** - Simulate 320px viewport reflow without horizontal scrolling or clipped content.
- [ ] **1.4.12** - Inject text-spacing bookmarklets/CSS to confirm text spacing (line height, paragraph spacing, word spacing, letter spacing) does not break content.
- [ ] **2.4.3** - Verify logical focus order and visual tab sequence match reading flow.
- [ ] **2.4.5** - Confirm multiple ways (search, site map, navigation menu) are available to locate pages.

### Phase 3: Keyboard & Screen Reader (No Mouse)
- [ ] **2.1.1** - Unplug mouse and test complete keyboard operability for all interactive components.
- [ ] **2.1.2** - Ensure no keyboard traps exist within modals, dropdowns, or embedded widgets.
- [ ] **3.3.3** - Verify form error suggestions and descriptive correction prompts.
- [ ] **4.1.3** - Use screen reader (NVDA/VoiceOver) to verify dynamic status toast and live region announcements.

---

## Section 4: Data Integration & Report Compilation

### 4.1 Manual Logging Format
Record manual test findings in shorthand JSON format inside a file named `manual-results.json`:
```json
[
  {
    "rule": "2.1.1",
    "location": "Checkout Modal",
    "impact": "serious",
    "description": "Focus trapped inside closed modal dialog",
    "note": "Keyboard focus cannot escape back to trigger button"
  }
]
```

### 4.2 Report Compilation
1. Ensure both `audit-results.json` and `manual-results.json` are present in the working directory.
2. Run the ingestion and report compiler script to merge automated axe-core data and manual findings against the `RULE_METADATA` dictionary.
3. Verify the generated `REMEDIATION_REPORT.md` client deliverable is fully populated and formatted correctly.