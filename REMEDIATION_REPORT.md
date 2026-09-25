# WCAG / ADA Remediation Report

**Target URL:** https://deanforantdesigns.com/  
**Audit Timestamp:** 2026-09-25T16:37:04.537Z  

## 1. Executive Scorecard & Legal Risk Summary

This report provides an accessibility compliance audit against WCAG 2.1 Level AA standards and ADA requirements. Detected barriers present potential legal exposure and restrict access for users relying on assistive technologies.

- **Critical Violations:** 1
- **Serious Violations:** 1
- **Moderate Violations:** 0
- **Minor Violations:** 0
- **Total Issues Detected:** 2

## 2. Prioritized Issue Matrix

| Severity | Rule ID | WCAG Ref | Description |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | `aria-allowed-attr` | wcag2a, wcag412 | Ensure an element's role supports its ARIA attributes |
| **SERIOUS** | `color-contrast` | wcag2aa, wcag143 | Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds |

## 3. Engineering Remediation Cards

### 1. [CRITICAL] aria-allowed-attr

- **WCAG Criterion:** wcag2a, wcag412
- **Assistive Technology Barrier:** Users relying on screen readers, keyboard navigation, or magnification may experience failure to perceive or interact with this component.
- **Rule URL:** https://dequeuniversity.com/rules/axe/4.13/aria-allowed-attr?application=playwright

#### Current Problematic HTML:

```html
<button class="process-tabs__tab process-tabs__tab--active" data-tab="discover" aria-selected="true">
                                <span class="process-tabs__number">01</span>
                                <span class="process-tabs__label">Discover</span>
                            </button>
```

**Failure Summary:** Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"

```html
<button class="process-tabs__tab" data-tab="define" aria-selected="false">
                                <span class="process-tabs__number">02</span>
                                <span class="process-tabs__label">Define</span>
                            </button>
```

**Failure Summary:** Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"

```html
<button class="process-tabs__tab" data-tab="design" aria-selected="false">
                                <span class="process-tabs__number">03</span>
                                <span class="process-tabs__label">Design</span>
                            </button>
```

**Failure Summary:** Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"

#### Recommended Remediation:

```html
<button role="tab" class="process-tabs__tab process-tabs__tab--active" data-tab="discover" aria-selected="true">
                                <span class="process-tabs__number">01</span>
                                <span class="process-tabs__label">Discover</span>
                            </button>
```

### 2. [SERIOUS] color-contrast

- **WCAG Criterion:** wcag2aa, wcag143
- **Assistive Technology Barrier:** Users relying on screen readers, keyboard navigation, or magnification may experience failure to perceive or interact with this component.
- **Rule URL:** https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright

#### Current Problematic HTML:

```html
<span class="process-tabs__number">02</span>
```

**Failure Summary:** Fix any of the following:
  Element has insufficient color contrast of 3.65 (foreground color: #4a6c9b, background color: #cbd6e6, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<span class="process-tabs__number">03</span>
```

**Failure Summary:** Fix any of the following:
  Element has insufficient color contrast of 3.65 (foreground color: #4a6c9b, background color: #cbd6e6, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

```html
<span class="process-tabs__number">04</span>
```

**Failure Summary:** Fix any of the following:
  Element has insufficient color contrast of 3.65 (foreground color: #4a6c9b, background color: #cbd6e6, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

#### Recommended Remediation:

```html
<span style="color: #1a365d;" class="process-tabs__number">02</span>
```

## 4. Accessibility Statement

This organization is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards, conforming to WCAG 2.1 Level AA guidelines.

### Feedback & Contact
We welcome your feedback on the accessibility of this property. Please let us know if you encounter accessibility barriers by contacting our support team.

