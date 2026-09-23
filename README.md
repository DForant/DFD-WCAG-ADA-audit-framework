# Accessibility Audit Engine

A lightweight, automated digital accessibility audit and remediation framework designed to evaluate web applications against **WCAG 2.1 Level AA** standards. Built with Playwright and Deque's `@axe-core/playwright`, this engine bridges the gap between raw DOM-level test scans and client-ready remediation deliverables.

---

## Features

- **Headless Automated Auditing:** Executes full DOM accessibility scans via Playwright Chromium against WCAG 2.0/2.1 Level A and AA standards (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`).
- **Dynamic Render Support:** Designed to handle Single Page Applications (React, Next.js, Vue) and modern CMS frontends (WordPress, WooCommerce, Squarespace, Webflow) using `networkidle` state detection.
- **Normalized Data Pipeline:** Strips non-actionable engine telemetry and outputs a structured `audit-results.json` mapping CSS selectors, HTML snippets, and failure summaries.
- **Executive & Developer Reporting:** Transforms normalized scan violations into an executive scorecard, a prioritized remediation task matrix, and production-ready code fixes.
- **Zero Ongoing Cost:** Built entirely on open-source frameworks and local scripting, requiring $0 in paid software licensing.

---

## Architecture Overview

Text
```
[ Target URL Input ]
         │
         ▼
[ Playwright (Headless Chromium) ]
         │
         ├─► Executes @axe-core/playwright (WCAG 2.1 AA ruleset)
         │
         ▼
[ Data Normalizer (normalizer.js) ]
         │ Deduplicates by selector, extracts metrics
         │
         ▼
[ audit-results.json ]
         │
         ▼
[ Remediation & Report Engine (reporter.js) ]
         │
         ▼
[ REMEDIATION_REPORT.md ]
  ├── 1. Executive Scorecard & Legal Risk Summary
  ├── 2. Prioritized Issue Matrix (Critical / Serious / Moderate)
  ├── 3. Engineering Remediation Cards (Current vs. Fixed HTML)
  └── 4. Production-Ready Footer Accessibility Statement
 ```

## Quick Start

### Prerequisites
- Node.js (version 20.x LTS or higher)   
- npm (comes packaged with Node.js)

### Installation

1. Clone the repository:

```
Bash

git clone [https://github.com/your-username/accessibility-audit-engine.git](https://github.com/your-username/accessibility-audit-engine.git)
cd accessibility-audit-engine
```

2. Install project dependencies:

```
Bash

npm install
```

4. Install Playwright Chromium browser & OS dependencies:
```
Bash

npx playwright install --with-deps chromium
```

## Usage

#### 1. Run an Automated Audit
To run the headless scanner against a target URL:
```
Bash

node scanner.js
```

By default, the scanner reads configurations from targets.json or targets a specified domain, executing tests across the WCAG 2.1 AA rule inventory and outputting audit-results.json.   

#### 2. Generate Client Deliverables
To process the normalized audit data and compile the client-ready Markdown report:
```
Bash

node reporter.js
```

This compiles REMEDIATION_REPORT.md, generating the executive summary, prioritized issue breakdown, and copy-paste code fixes.

## Configuration
Target pages and audit options are defined in targets.json:
```
JSON

{
  "clientName": "Example Client",
  "domain": "[https://example.com](https://example.com)",
  "templates": [
    { "name": "Homepage", "url": "[https://example.com](https://example.com)" },
    { "name": "Services", "url": "[https://example.com/services](https://example.com/services)" },
    { "name": "Contact Form", "url": "[https://example.com/contact](https://example.com/contact)" }
  ],
  "options": {
    "tags": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    "viewport": { "width": 1440, "height": 900 }
  }
}
```

## Project Structure
```
Plaintext

accessibility-audit-engine/
├── .github/
│   └── workflows/
│       └── ai-agent.yml          # GitHub Actions workflow for automated issue resolution
├── targets.json                  # Target URLs and scan configuration
├── scanner.js                    # Playwright & @axe-core runner
├── normalizer.js                 # Output sanitizer and JSON schema compiler
├── reporter.js                   # Markdown remediation report generator
├── PROJECT_REQUIREMENTS.md       # Master PRD and functional requirements
├── AGENT_INSTRUCTIONS.md         # Autonomous development standards & invariants
├── CLAUDE.md                     # CLI assistant commands and operating guidelines
├── package.json
└── README.md
```

## Commercial Service Delivery

This engine powers a 3-tier accessibility service model tailored for small and medium businesses:

- Tier 1: Base Compliance Audit ($495 – $750): 3–5 core template scans, manual 15-minute keyboard/contrast validation, and executive remediation report.
- Tier 2: Turnkey Audit & Fix ($1,250 – $1,850): Full audit plus direct code remediation on standard CMS platforms (WordPress, Squarespace), post-fix verification scan, and custom footer Accessibility Statement.
- Tier 3: Active Compliance Retainer ($99 – $150/mo): Automated monthly Playwright regression scans, quarterly manual checkups, and ongoing pre-publish content reviews.

## License

This project is licensed under the MIT License. Third-party dependencies (playwright, @axe-core/playwright) are subject to their respective open-source licenses (Apache-2.0 and MPL-2.0).