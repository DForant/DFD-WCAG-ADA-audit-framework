# Manual Accessibility Test Plan

This test plan covers WCAG 2.1 criteria that cannot be fully validated via automated engines (such as axe-core) and require human verification.

## 1. Non-text Content (SC 1.1.1)
- **Objective**: Verify that alternative text provides equivalent context and avoids placeholder strings or file names.
- **Steps**:
  1. Inspect all `<img>`, `<area>`, and `<object>` elements in the DOM.
  2. Verify meaningful images have descriptive alternative text.
  3. Verify decorative images explicitly use `alt=""`.
  4. Ensure no alt texts contain generic text like "image", "photo", or raw file names.

## 2. Audio-only and Video-only / Captions Prerecorded (SC 1.2.1, SC 1.2.2)
- **Objective**: Confirm accurate text transcripts and synchronized captions.
- **Steps**:
  1. Play all `<video>` and `<audio>` elements.
  2. Enable captions and verify synchronization with dialogue, sound effects, and speaker identification.
  3. Check that a full text transcript link is available nearby for audio-only and video content.

## 3. Info and Relationships (SC 1.3.1)
- **Objective**: Ensure visual structures (tables, lists, headings) use proper semantic markup.
- **Steps**:
  1. Review tables to ensure they use `<table>`, `<th>`, `<td>`, and appropriate scope attributes rather than generic `<div>` layouts.
  2. Review lists to ensure they use `<ul>`, `<ol>`, and `<li>` elements.

## 4. Orientation (SC 1.3.4)
- **Objective**: Ensure content is not restricted to a single display orientation.
- **Steps**:
  1. Test the application on mobile/tablet devices or browser responsive simulators in both portrait and landscape modes.
  2. Verify all features and content remain accessible and functional without forced rotation.

## 5. Resize Text (SC 1.4.4)
- **Objective**: Verify text can be scaled up to 200% without loss of content or functionality.
- **Steps**:
  1. Zoom the browser window to 200%.
  2. Check for text truncation, overlapping elements, or horizontal scrolling required to read standard paragraphs.

## 6. Non-text Contrast (SC 1.4.11)
- **Objective**: Evaluate static color contrast on standalone UI components and graphical objects.
- **Steps**:
  1. Inspect UI icons, component boundaries, focus rings, and active state indicators using a contrast checker tool to ensure a minimum 3:1 ratio.

## 7. Keyboard Accessibility (SC 2.1.1)
- **Objective**: Ensure all interactive content is fully operable via keyboard alone.
- **Steps**:
  1. Navigate the entire page using only the `Tab` and `Shift + Tab` keys.
  2. Activate controls using `Enter` or `Space`.
  3. Verify there are no keyboard focus traps and focus indicators are clearly visible.

## 8. Bypass Blocks (SC 2.4.1)
- **Objective**: Verify the availability of a mechanism to bypass blocks of repeated content.
- **Steps**:
  1. Press `Tab` immediately upon loading the page.
  2. Confirm a visible "Skip to Main Content" link appears and successfully redirects focus to the main landmark region when activated.

## 9. Link Purpose in Context (SC 2.4.4)
- **Objective**: Ensure link destinations are clear from the link text alone or its immediate context.
- **Steps**:
  1. Review all `<a>` tags to eliminate ambiguous labels such as "click here" or "read more" unless sufficient context is provided.

## 10. Label in Name (SC 2.5.3)
- **Objective**: Test with speech input software to ensure voice users can activate components using visible text labels.
- **Steps**:
  1. Verify that accessible names (`aria-label`) fully contain or match the visible text label of interactive elements.

## 11. Language of Parts (SC 3.1.2)
- **Objective**: Validate inline language changes.
- **Steps**:
  1. Locate any passages or phrases in a secondary language and confirm they are wrapped in tags containing correct `lang` attributes (e.g., `<span lang="es">`).

## 12. Labels or Instructions (SC 3.3.2)
- **Objective**: Verify form instructions and error messages are clear and accessible.
- **Steps**:
  1. Inspect form inputs to ensure explicit labels, instructions, and error states are programmatically associated with their corresponding fields.