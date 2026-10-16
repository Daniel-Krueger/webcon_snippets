# WEBCON Snippets – Development Guidelines

## Project context

This repository contains JavaScript/HTML snippets that run inside **WEBCON BPS**, a third-party Single Page Application. The SPA's DOM structure cannot be modified. Snippets are injected through WEBCON's built-in **HTML attribute fields**.

---

## Two-field pattern

Every feature is split across exactly **two** WEBCON HTML fields:

### 1 – Logic field
Contains the reusable module. Wrap everything in an **IIFE** assigned to `window`:

```html
<script>
window.myFeature = (function () {
    'use strict';

    // private implementation …

    function init(param1, param2) {
        // entry point called by the configuration field
    }

    console.log("My feature loaded.")
    return { init: init };
})();
</script>
```

- No hardcoded IDs or environment-specific values.
- All configuration is received through `init()` parameters.
- The module is self-contained; the `window` assignment makes it callable from the other field.

### 2 – Configuration / initialization field
Contains the anchor element and the `init()` call with WEBCON variables:

```html
<div id="MyAnchor"/>
<script>
window.myFeature.init(#{DBID}#, '#{BRD:FIELDID}#');
</script>
```

- WEBCON variables use the `#{VARIABLE}#` syntax (server-side substitution).
- Field values use `#{BRD:FIELDID}#`.
- Keep this field minimal – only wiring, no logic.

---

## WEBCON CSS conventions

The SPA's stylesheet is always present. Reuse existing classes rather than writing custom CSS:

| Purpose | Key classes |
|---|---|
| Field grid wrapper | `main-panel main-panel__wrap-grid group` |
| Field row | `main-panel__wrap-grid__wrapper` |
| Label column | `inline-panel__grid-label__wrapper` → `attributeLabelDisplayName` |
| Control column | `inline-panel--control form-field-control-wrapper inline-panel__grid-control` |
| Read-only textarea | `webcon-ui textarea textarea--read-only textarea--medium textarea--outline textarea--resize-none form-control text-field` |
| Checkbox (unchecked) | `webcon-ui checkbox checkbox--default-appearance checkbox--medium checkbox--no-padding checkbox-control` |
| Checkbox (checked) | add `checkbox--checked`; indicator gets `checkbox__input-indicator--checked` + SVG checkmark |
| Group panel box | `webcon-ui box box--outline box--after-border header-panel__wrapper` |

---

## DOM insertion

New elements are inserted as **siblings** after the anchor div — never appended to `body` or other shared containers:

```javascript
anchor.insertAdjacentElement('afterend', newElement);
```

When inserting multiple siblings in order, keep a moving reference:

```javascript
let ref = anchor;
elements.forEach(function (el) {
    ref.insertAdjacentElement('afterend', el);
    ref = el;
});
```

---

## SPA globals

| Variable | Value | Usage |
|---|---|---|
| `G_BROWSER_LANGUAGE` | e.g. `"en-us"` | Locale for `toLocaleString()` / `toLocaleDateString()` |

Always fall back gracefully:
```javascript
const LANG = (typeof G_BROWSER_LANGUAGE !== 'undefined' ? G_BROWSER_LANGUAGE : navigator.language);
```

---

## API calls

Endpoints are always **same-origin** — no base URL needed, no CORS headers required.

Common pattern:
```
/attachments/db/{dbId}/preview/{attachmentId}
```

