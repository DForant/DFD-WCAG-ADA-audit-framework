# Automated WCAG/ADA Accessibility Audit Framework (MVP)
## Project Requirements Document (PRD)

**Document ID:** PRD-WCAG-AUDIT-001  
**Author:** Dean Forant Designs  
**Status:** Approved / In Execution  
**Target Delivery:** MVP Phase 1  

---

## 1. Executive Summary & Objective

### 1.1 Problem Statement
Small and medium-sized local businesses face mounting legal exposure under Title III of the Americans with Disabilities Act (ADA) and state accessibility mandates. Traditional enterprise digital accessibility audits are cost-prohibitive ($2,500–$10,000+) and inaccessible to local service firms. Conversely, free automated browser extensions deliver confusing, disconnected technical metrics without actionable remediation guidance or plain-English business impact translation.

### 1.2 Solution & Value Proposition
The **Automated WCAG/ADA Accessibility Audit Framework** is a lightweight, zero-cost-overhead CLI and scripted automation engine. It leverages Playwright and Deque's open-source `@axe-core/playwright` to execute deterministic automated scans against WCAG 2.1 Level AA criteria across representative client templates. 

Findings are normalized, filtered for false positives, enriched with DOM context, and transformed via structured LLM pipelines into:
1. An **Executive Scorecard & Risk Exposure Summary** for business owners.
2. An **Engineering Remediation Blueprint** with copy-paste code fixes for developers.
3. An **Official Accessibility Statement** template ready for site deployment.

---

## 2. Core Project Scope & Boundaries

### 2.1 In-Scope (MVP Phase 1)
* **Single-URL & Multi-Template Target Scanning:** Execution against client-specified URLs (e.g., Homepage, Service Page, Contact/Form, Blog/Product).
* **Deterministic Automated Evaluation:** Full DOM evaluation against WCAG 2.0 & WCAG 2.1 Level A and AA rulesets via `@axe-core/playwright`.
* **Dynamic Client-Side Render Handling:** Headless Chromium rendering supporting SPAs (React, Next.js, Vue) and CMS frontends (WordPress, WooCommerce, Squarespace, Webflow).
* **Payload Normalization & Context Extraction:** Capturing affected HTML nodes, CSS selectors, failure summaries, and parent DOM hierarchies.
* **Structured Data Export:** Generation of normalized JSON (`audit-results.json`) conforming to a strictly typed schema.
* **Remediation & Report Compilation:** Automated generation of a Markdown report (`REMEDIATION_REPORT.md`) containing executive insights, prioritized impact matrices, and exact before/after code solutions.
* **Internal Dogfooding:** Full testing, benchmarking, and remediation execution using `deanforantdesigns.com` as Client Zero.

### 2.2 Out-of-Scope (Deferred to Post-MVP)
* Web-based multi-tenant SaaS dashboard and user authentication portals.
* Hosted billing or payment gateway integrations (Stripe/LemonSqueezy).
* Full-site multi-thousand-page recursive crawling (MVP operates on scoped template URLs).
* Automated downloadable PDF / media remediation (scans are strictly web DOM).
* Native mobile application audits (iOS / Android).

---

## 3. Technical Architecture & System Mechanics

### 3.1 Architecture Overview

```text
[ Target URL Input ]
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 1. INGESTION & BROWSER RUNNER                           │
│    • Headless Chromium (Playwright)                     │
│    • Network Idle Detection & Viewport Standardization  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 2. ENGINE EVALUATION                                    │
│    • Inject & Execute @axe-core/playwright              │
│    • Filter Tags: wcag2a, wcag2aa, wcag21a, wcag21aa    │
└──────────────────────────┬──────────────────────────────┘
                           │ Raw Axe JSON
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 3. DATA NORMALIZATION & COMPONENT EXTRACTION            │
│    • Deduplicate Violations by CSS Selector / Component │
│    • Extract Impact Metrics: Critical, Serious, Mod.    │
│    • Output: audit-results.json                         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 4. LLM REMEDIATION TRANSFORMER                          │
│    • Structured Prompting (WCAG Criterion + Code Fix)   │
│    • Root Cause & User Barrier Analysis                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 5. ARTIFACT GENERATION                                  │
│    • Executive Scorecard (Plain English)                │
│    • Engineering Remediation Guide (Markdown / HTML)    │
│    • Official Footer Accessibility Statement            │
└─────────────────────────────────────────────────────────┘