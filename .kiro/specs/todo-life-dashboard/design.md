# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a self-contained, client-side productivity application delivered as a single HTML page. It requires no server, no build step, and no external dependencies — the user opens `index.html` directly in a browser and everything works.

The application is composed of five independent widgets that share a common persistence layer (the browser's `localStorage` API) and a common theming system:

1. **Greeting Widget** — time, date, and a time-of-day greeting personalised with the user's name.
2. **Focus Timer** — a configurable Pomodoro-style countdown with start / stop / reset controls.
3. **To-Do List** — a persistent task list with add, edit, complete, and delete operations.
4. **Quick Links Panel** — a set of user-defined shortcut buttons that open URLs in new tabs.
5. **Settings Bar** — controls for the user name, Pomodoro duration, and light/dark theme toggle.

All state mutations follow the same pattern: update the in-memory model → re-render the affected widget → write the updated model to `localStorage`.

---

## Architecture

The application follows a simple **Model → View → Event** pattern without any framework:

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │                    js/app.js                      │   │
│  │                                                   │   │
│  │  ┌─────────────┐   ┌──────────────────────────┐  │   │
│  │  │    Model    │   │         View             │  │   │
│  │  │  (plain JS  │──▶│  (DOM manipulation,      │  │   │
│  │  │   objects)  │   │   innerHTML / classList) │  │   │
│  │  └──────┬──────┘   └──────────────────────────┘  │   │
│  │         │                      ▲                  │   │
│  │         ▼                      │                  │   │
│  │  ┌─────────────┐   ┌──────────────────────────┐  │   │
│  │  │  Storage    │   │       Event Handlers      │  │   │
│  │  │ (localStorage│   │  (click, input, submit,  │  │   │
│  │  │  read/write)│   │   setInterval)            │  │   │
│  │  └─────────────┘   └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  css/style.css  (theming via CSS custom properties)      │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **No framework**: Keeps the file count at exactly three (HTML, CSS, JS) and eliminates any build step or dependency management.
- **CSS custom properties for theming**: The `<html>` element carries a `data-theme` attribute (`"dark"` or `"light"`). All colours are defined as CSS variables scoped to `[data-theme="dark"]` and `[data-theme="light"]` selectors, so a single attribute change re-themes the entire page instantly.
- **Single JS file, module-like structure**: `app.js` is organised into clearly separated sections (constants, storage helpers, model, render functions, event wiring, init) using plain functions and closures — no ES modules required, so the file works when opened from the filesystem (`file://`).
- **setInterval for the clock**: A 60-second interval updates the time display. The greeting text is derived from `Date` on each tick, so it transitions automatically at the correct hour boundary.
- **setInterval for the timer**: A 1-second interval drives the countdown. The interval handle is stored in a module-level variable so it can be cleared on stop/reset.

---

## Components and Interfaces

### 1. Storage Module

Wraps `localStorage` with a try/catch so the rest of the code never needs to handle storage errors directly.

```
storageGet(key)          → value | null
storageSet(key, value)   → void
storageAvailable()       → boolean
```

On page load, `storageAvailable()` is called once. If it returns `false`, a non-blocking banner is shown and all subsequent `storageSet` calls become no-ops.

**Storage keys:**

| Key                    | Type                    | Default  |
| ---------------------- | ----------------------- | -------- |
| `tld_userName`         | string                  | `""`     |
| `tld_pomodoroDuration` | number                  | `25`     |
| `tld_tasks`            | JSON array of Task      | `[]`     |
| `tld_links`            | JSON array of QuickLink | `[]`     |
| `tld_theme`            | `"dark"` \| `"light"`   | `"dark"` |

---

### 2. Greeting Widget

**Render function:** `renderGreeting()`

Reads the current `Date`, computes the greeting phrase, reads `state.userName`, and writes to the relevant DOM elements.

**Clock tick:** `startClock()` sets a 60-second interval that calls `renderGreeting()`.

**Greeting logic:**

| Hour range  | Phrase         |
| ----------- | -------------- |
| 05:00–11:59 | Good Morning   |
| 12:00–17:59 | Good Afternoon |
| 18:00–21:59 | Good Evening   |
| 22:00–04:59 | Good Night     |

---

### 3. Focus Timer

**State fields:** `timerSeconds` (remaining), `timerRunning` (boolean), `timerIntervalId`.

**Functions:**

```
startTimer()   — sets interval, updates button states
stopTimer()    — clears interval, updates button states
resetTimer()   — clears interval, restores timerSeconds from state.pomodoroDuration
renderTimer()  — writes MM:SS to DOM, updates button disabled states
onTimerTick()  — decrements timerSeconds, calls renderTimer(), fires completion if 0
```

**Completion:** When `timerSeconds` reaches 0, `stopTimer()` is called and `window.alert()` notifies the user.

**Button state rules:**

| Timer state | Start    | Stop     | Reset   |
| ----------- | -------- | -------- | ------- |
| Stopped     | enabled  | disabled | enabled |
| Running     | disabled | enabled  | enabled |

---

### 4. To-Do List

**State field:** `state.tasks` — array of `Task` objects (see Data Models).

**Functions:**

```
addTask(label)           — validates, appends to state.tasks, persists, re-renders
toggleTask(id)           — flips completed flag, persists, re-renders
beginEditTask(id)        — replaces task row with inline edit field
saveEditTask(id, label)  — validates, updates label, persists, re-renders
deleteTask(id)           — removes from state.tasks, persists, re-renders
renderTasks()            — rebuilds the task list DOM from state.tasks
```

**Validation:** A label is valid if `label.trim().length > 0`.

---

### 5. Quick Links Panel

**State field:** `state.links` — array of `QuickLink` objects (see Data Models).

**Functions:**

```
addLink(label, url)   — validates, appends to state.links, persists, re-renders
deleteLink(id)        — removes from state.links, persists, re-renders
renderLinks()         — rebuilds the links panel DOM from state.links
```

**URL validation:** Uses the `URL` constructor inside a try/catch. A URL is valid if `new URL(value)` does not throw and the protocol is `http:` or `https:`.

---

### 6. Settings Bar

Handles three concerns:

- **User name**: An `<input>` + save button. On save, writes to `state.userName`, persists, calls `renderGreeting()`.
- **Pomodoro duration**: A number `<input>` (min=1, max=120) + save button. On save, validates range, writes to `state.pomodoroDuration`, persists, calls `resetTimer()` if timer is not running.
- **Theme toggle**: A `<button>` that flips `state.theme` between `"dark"` and `"light"`, sets `document.documentElement.dataset.theme`, and persists.

---

### 7. Initialisation (`init()`)

Called once on `DOMContentLoaded`:

1. Call `storageAvailable()`; show warning banner if false.
2. Load all keys from `localStorage` into the `state` object (with defaults for missing keys).
3. Apply `state.theme` to `document.documentElement.dataset.theme`.
4. Render all widgets: `renderGreeting()`, `renderTimer()`, `renderTasks()`, `renderLinks()`.
5. Populate settings inputs from state.
6. Wire all event listeners.
7. Call `startClock()`.

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  label:     string,   // non-empty, trimmed
  completed: boolean   // false by default
}
```

### QuickLink

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty, trimmed
  url:   string   // valid http/https URL
}
```

### Application State (in-memory)

```js
const state = {
  userName:         string,   // "" if not set
  pomodoroDuration: number,   // minutes, 1–120, default 25
  tasks:            Task[],
  links:            QuickLink[],
  theme:            "dark" | "light",

  // Timer runtime (not persisted)
  timerSeconds:     number,
  timerRunning:     boolean,
  timerIntervalId:  number | null
};
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Greeting phrase covers all hours without gaps or overlaps

_For any_ integer hour value in the range 0–23, the `getGreetingPhrase(hour)` function SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night", and the returned phrase SHALL match the defined hour ranges (05–11 → Morning, 12–17 → Afternoon, 18–21 → Evening, 22–04 → Night).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Greeting name suffix is present if and only if name is non-empty

_For any_ non-empty User_Name string, the rendered greeting text SHALL contain that User_Name as a suffix (e.g., "Good Morning, Alex"); and for any empty or whitespace-only User_Name, the rendered greeting text SHALL NOT contain a trailing comma or name suffix.

**Validates: Requirements 1.7, 1.8, 2.4**

---

### Property 3: Timer display formatting

_For any_ integer number of seconds in the range 0–7200, the `formatTimerDisplay(seconds)` function SHALL return a string matching the pattern `MM:SS` where MM and SS are zero-padded two-digit numbers and the total seconds represented equals the input.

**Validates: Requirements 3.1**

---

### Property 4: Timer button state invariant

_For any_ timer state (running or stopped), the button enabled/disabled states SHALL satisfy: when running — Start is disabled, Stop is enabled, Reset is enabled; when stopped — Start is enabled, Stop is disabled, Reset is enabled.

**Validates: Requirements 3.7, 3.8**

---

### Property 5: Pomodoro duration persistence round-trip

_For any_ integer in the range 1–120, saving it as the Pomodoro_Duration and then reading it back from Local Storage SHALL produce the same integer value, and the timer display SHALL reflect that duration in MM:SS format.

**Validates: Requirements 4.2, 4.3**

---

### Property 6: Pomodoro duration validation rejects out-of-range values

_For any_ value outside the range 1–120 (including non-integers, zero, negatives, and values above 120), the `validatePomodoroDuration(n)` function SHALL reject the value, the stored duration SHALL remain unchanged, and an inline validation message SHALL be present in the DOM.

**Validates: Requirements 4.6**

---

### Property 7: Task addition round-trip

_For any_ non-empty, non-whitespace task label string, calling `addTask(label)` and then reading the task list from Local Storage SHALL produce a list that contains a task whose label equals the trimmed input, and the task list length SHALL have increased by exactly one.

**Validates: Requirements 5.2, 5.10, 8.2**

---

### Property 8: Whitespace-only labels are rejected for both task add and task edit

_For any_ string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to add it as a new task label or save it as an edited task label SHALL be rejected, the task list SHALL remain unchanged, and an inline validation message SHALL be present in the DOM.

**Validates: Requirements 5.3, 5.8**

---

### Property 9: Task completion toggle is an involution

_For any_ task, calling `toggleTask(id)` twice in succession SHALL return the task's `completed` field to its original value, and the Local Storage representation SHALL match the in-memory state after each toggle.

**Validates: Requirements 5.5**

---

### Property 10: Task edit round-trip

_For any_ existing task and any non-empty replacement label string, calling `saveEditTask(id, label)` SHALL update the task's label to the trimmed replacement, and reading the task list from Local Storage SHALL reflect the updated label.

**Validates: Requirements 5.7**

---

### Property 11: Task and link deletion removes exactly the targeted item

_For any_ list (tasks or links) and any item ID present in that list, deleting the item with that ID SHALL reduce the list length by exactly one, SHALL remove the item with that ID, and SHALL leave all other items unchanged. The updated list SHALL be persisted to Local Storage.

**Validates: Requirements 5.9, 6.6**

---

### Property 12: Quick link URL validation accepts http/https and rejects all others

_For any_ string, the `isValidUrl(str)` function SHALL return `true` if and only if the string is a well-formed URL with an `http:` or `https:` scheme; it SHALL return `false` for all other strings (empty strings, non-URLs, `ftp://`, `javascript:`, relative paths, etc.).

**Validates: Requirements 6.2, 6.3**

---

### Property 13: Quick link addition round-trip

_For any_ valid Quick_Link (non-empty label, valid http/https URL), calling `addLink(label, url)` and then reading the links list from Local Storage SHALL produce a list that contains a link with the same label and URL, and the links list length SHALL have increased by exactly one.

**Validates: Requirements 6.2, 6.7**

---

### Property 14: Theme toggle is an involution and persists correctly

_For any_ current theme value (`"dark"` or `"light"`), toggling the theme twice SHALL return the `data-theme` attribute on `<html>` to its original value, and after each toggle the value stored in Local Storage SHALL equal the current `data-theme` attribute value.

**Validates: Requirements 7.2, 7.3, 7.4**

---

## Error Handling

| Scenario                                                      | Handling                                                                                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage` unavailable (private browsing, quota exceeded) | `storageAvailable()` returns `false`; a non-blocking banner is shown; `storageSet` becomes a no-op; app runs on in-memory defaults for the session. |
| Corrupt JSON in `localStorage` (e.g., manually edited)        | `JSON.parse` is wrapped in try/catch; on failure the affected key is treated as missing and the default value is used.                              |
| `crypto.randomUUID()` unavailable (very old browser)          | Falls back to `Date.now().toString() + Math.random()` for ID generation.                                                                            |
| `URL` constructor unavailable                                 | Falls back to a regex-based URL check (`/^https?:\/\/.+/`).                                                                                         |
| Timer reaches 00:00                                           | `window.alert()` is used for the notification; no async or permission-dependent API is required.                                                    |
| User submits empty/whitespace task or link label              | Inline `<span class="error-msg">` is shown adjacent to the relevant input; submission is blocked.                                                   |
| User submits invalid Pomodoro duration                        | Inline error shown; `localStorage` and timer state are not updated.                                                                                 |
| User submits invalid URL for a Quick Link                     | Inline error shown; link is not added.                                                                                                              |

---

## Testing Strategy

This feature is a pure client-side application with no build step, no framework, and no server. The testing approach is entirely manual and browser-based, supplemented by the property-based reasoning captured in the Correctness Properties section above.

### Pure Logic Functions (Highest-Value Test Targets)

The following functions should be written as pure functions with no side effects, making them straightforward to verify in isolation:

- `getGreetingPhrase(hour)` — deterministic mapping from hour integer to phrase string.
- `formatTimerDisplay(seconds)` — MM:SS formatting with zero-padding.
- `isValidLabel(str)` — returns `false` for empty or whitespace-only strings.
- `isValidUrl(str)` — returns `true` only for well-formed `http:`/`https:` URLs.
- `validatePomodoroDuration(n)` — returns `true` only for integers in [1, 120].

Keeping these functions pure and side-effect-free is a design requirement, not just a testing convenience.

### Property-Based Testing

If a property-based testing library (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript) is introduced, the Correctness Properties above map directly to test cases. Each property is universally quantified and driven by a generator:

| Property                                     | Generator inputs                                      |
| -------------------------------------------- | ----------------------------------------------------- |
| 1 — Greeting phrase                          | Integers in [0, 23]                                   |
| 2 — Greeting name suffix                     | Arbitrary strings (empty, non-empty, whitespace-only) |
| 3 — Timer display formatting                 | Integers in [0, 7200]                                 |
| 4 — Timer button state invariant             | Boolean timer-running flag                            |
| 5 — Duration persistence round-trip          | Integers in [1, 120]                                  |
| 6 — Duration validation rejects out-of-range | Integers outside [1, 120], floats, NaN                |
| 7 — Task addition round-trip                 | Non-empty, non-whitespace strings                     |
| 8 — Whitespace label rejection               | Strings of spaces, tabs, newlines                     |
| 9 — Completion toggle involution             | Arbitrary task objects                                |
| 10 — Task edit round-trip                    | Task objects + non-empty replacement labels           |
| 11 — Deletion removes exactly one item       | Arrays of tasks/links + valid IDs                     |
| 12 — URL validation                          | Valid http/https URLs, invalid strings, other schemes |
| 13 — Link addition round-trip                | Valid Quick_Link objects                              |
| 14 — Theme toggle involution + persistence   | Theme values, toggle sequences                        |

Each property test should run a minimum of 100 iterations.

### Manual Browser Testing Checklist

1. Open `index.html` directly from the filesystem (no web server) — verifies Requirement 9.5, 10.4.
2. Verify initial render in Chrome, Firefox, Edge, and Safari — verifies Requirement 10.1.
3. Verify greeting phrase changes at each hour boundary (temporarily override `new Date()`) — verifies Requirements 1.3–1.6.
4. Set a custom name; reload and verify it appears in the greeting — verifies Requirements 2.2, 2.3.
5. Change Pomodoro duration; verify timer resets to new value; test boundary values 1 and 120; test invalid values 0 and 121 — verifies Requirements 4.1, 4.5, 4.6.
6. Start timer; verify countdown; let it reach 00:00 and verify alert fires — verifies Requirements 3.3, 3.6.
7. Start timer; stop it; verify time is frozen; reset and verify it returns to duration — verifies Requirements 3.4, 3.5.
8. Add, complete, edit, and delete tasks; reload and verify persistence — verifies Requirements 5.2–5.10.
9. Attempt to add empty and whitespace-only tasks; verify inline error — verifies Requirement 5.3.
10. Add and delete quick links; verify they open in new tabs — verifies Requirements 6.2, 6.4, 6.6.
11. Attempt to add a link with empty label or invalid URL; verify inline error — verifies Requirement 6.3.
12. Toggle theme; reload and verify theme persists — verifies Requirements 7.2–7.4.
13. Test in a private/incognito window to exercise the `localStorage` unavailable path — verifies Requirement 8.3.
