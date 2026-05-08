// js/app.js — To-Do Life Dashboard
// Single-file, no ES modules (works from file:// directly)

// =============================================================================
// CONSTANTS — Storage Keys
// =============================================================================

var KEYS = {
  userName: "tld_userName",
  pomodoroDuration: "tld_pomodoroDuration",
  tasks: "tld_tasks",
  links: "tld_links",
  theme: "tld_theme",
};

// =============================================================================
// STORAGE MODULE
// =============================================================================

// Tracks whether localStorage is available; set once during init
var _storageAvailable = true;

/**
 * storageAvailable() → boolean
 * Tests whether localStorage can be read and written.
 * Uses the standard feature-detection write/read/delete pattern.
 */
function storageAvailable() {
  try {
    var testKey = "__tld_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * storageGet(key) → value | null
 * Reads a value from localStorage and JSON-parses it.
 * Returns null if the key is missing, storage is unavailable, or parsing fails.
 */
function storageGet(key) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * storageSet(key, value) → void
 * JSON-stringifies value and writes it to localStorage.
 * Becomes a no-op if storage was found to be unavailable on page load.
 */
function storageSet(key, value) {
  if (!_storageAvailable) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Quota exceeded or other write error — silently ignore
  }
}

// =============================================================================
// APPLICATION STATE (in-memory model)
// =============================================================================

// Populated during init(); not persisted directly — individual fields are
// written to localStorage via storageSet() after each mutation.
var state = {
  userName: "", // string — "" if not set
  pomodoroDuration: 25, // number — minutes, 1–120
  tasks: [], // Task[]
  links: [], // QuickLink[]
  theme: "dark", // "dark" | "light"

  // Timer runtime state (not persisted)
  timerSeconds: 0, // number — remaining seconds
  timerRunning: false, // boolean
  timerIntervalId: null, // number | null — setInterval handle

  // Clock runtime state (not persisted)
  clockIntervalId: null, // number | null — setInterval handle for the greeting clock
};

// =============================================================================
// GREETING WIDGET
// =============================================================================

/**
 * getGreetingPhrase(hour) → string
 * Pure function — maps an hour integer (0–23) to a greeting phrase.
 *
 * Hour ranges:
 *   05–11 → "Good Morning"
 *   12–17 → "Good Afternoon"
 *   18–21 → "Good Evening"
 *   22–04 → "Good Night"
 *
 * @param {number} hour - Integer in the range 0–23
 * @returns {string} One of the four greeting phrases
 */
function getGreetingPhrase(hour) {
  if (hour >= 5 && hour <= 11) return "Good Morning";
  if (hour >= 12 && hour <= 17) return "Good Afternoon";
  if (hour >= 18 && hour <= 21) return "Good Evening";
  return "Good Night"; // covers 22–23 and 0–4
}

/**
 * renderGreeting() → void
 * Reads the current Date, computes the time (HH:MM), a human-readable date
 * string, and the greeting phrase. Appends state.userName if non-empty.
 * Writes the results to the three greeting DOM elements.
 */
function renderGreeting() {
  var now = new Date();
  var hour = now.getHours();
  var minutes = now.getMinutes();

  // Format time as HH:MM (zero-padded)
  var timeStr =
    String(hour).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");

  // Format date as e.g. "Monday, June 9, 2025"
  var dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build greeting text, appending name only if non-empty / non-whitespace
  var phrase = getGreetingPhrase(hour);
  var name = state.userName ? state.userName.trim() : "";
  var greetingText = name.length > 0 ? phrase + ", " + name : phrase;

  // Update DOM
  document.getElementById("greeting-time").textContent = timeStr;
  document.getElementById("greeting-date").textContent = dateStr;
  document.getElementById("greeting-text").textContent = greetingText;
}

/**
 * startClock() → void
 * Sets up a 60-second interval that calls renderGreeting() on each tick.
 * Stores the interval ID in state.clockIntervalId for potential cleanup.
 */
function startClock() {
  state.clockIntervalId = setInterval(renderGreeting, 60000);
}

// =============================================================================
// FOCUS TIMER WIDGET
// =============================================================================

/**
 * formatTimerDisplay(seconds) → string
 * Pure function — converts a total number of seconds into a MM:SS string
 * with zero-padded two-digit minutes and seconds.
 *
 * Examples:
 *   formatTimerDisplay(0)    → "00:00"
 *   formatTimerDisplay(90)   → "01:30"
 *   formatTimerDisplay(3600) → "60:00"
 *
 * @param {number} seconds - Non-negative integer number of seconds
 * @returns {string} Zero-padded MM:SS string
 */
function formatTimerDisplay(seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

/**
 * validatePomodoroDuration(n) → boolean
 * Pure function — returns true only if n is an integer in the range [1, 120].
 * Rejects floats, NaN, Infinity, values < 1, and values > 120.
 *
 * @param {*} n - Value to validate
 * @returns {boolean}
 */
function validatePomodoroDuration(n) {
  return (
    typeof n === "number" &&
    !isNaN(n) &&
    isFinite(n) &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 120
  );
}

/**
 * renderTimer() → void
 * Writes the current remaining time (state.timerSeconds) to the timer display
 * element in MM:SS format, and updates the Start/Stop/Reset button disabled
 * states based on whether the timer is currently running.
 *
 * Button state rules:
 *   Running: Start disabled, Stop enabled,  Reset enabled
 *   Stopped: Start enabled,  Stop disabled, Reset enabled
 */
function renderTimer() {
  var display = document.getElementById("timer-display");
  var btnStart = document.getElementById("timer-start");
  var btnStop = document.getElementById("timer-stop");
  var btnReset = document.getElementById("timer-reset");

  if (display) {
    display.textContent = formatTimerDisplay(state.timerSeconds);
  }

  if (btnStart) btnStart.disabled = state.timerRunning;
  if (btnStop) btnStop.disabled = !state.timerRunning;
  if (btnReset) btnReset.disabled = false; // Reset is always enabled
}

/**
 * onTimerTick() → void
 * Called once per second by the timer interval.
 * Decrements state.timerSeconds, re-renders the display, and fires the
 * completion alert + stops the timer when the countdown reaches zero.
 */
function onTimerTick() {
  state.timerSeconds -= 1;
  renderTimer();
  if (state.timerSeconds <= 0) {
    stopTimer();
    window.alert("Time's up! Great work!");
  }
}

/**
 * startTimer() → void
 * Begins the countdown by setting a 1-second interval that calls onTimerTick().
 * Stores the interval ID in state.timerIntervalId and marks the timer as running.
 * Has no effect if the timer is already running.
 */
function startTimer() {
  if (state.timerRunning) return;
  state.timerRunning = true;
  state.timerIntervalId = setInterval(onTimerTick, 1000);
  renderTimer();
}

/**
 * stopTimer() → void
 * Pauses the countdown by clearing the active interval.
 * Marks the timer as stopped without changing the remaining time.
 */
function stopTimer() {
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;
  state.timerRunning = false;
  renderTimer();
}

/**
 * resetTimer() → void
 * Stops any active countdown and restores the remaining time to the full
 * Pomodoro duration (state.pomodoroDuration converted to seconds).
 */
function resetTimer() {
  stopTimer();
  state.timerSeconds = state.pomodoroDuration * 60;
  renderTimer();
}

/**
 * wireTimerListeners() → void
 * Attaches click event listeners to the Start, Stop, and Reset timer buttons.
 * Called once during init().
 */
function wireTimerListeners() {
  var btnStart = document.getElementById("timer-start");
  var btnStop = document.getElementById("timer-stop");
  var btnReset = document.getElementById("timer-reset");

  if (btnStart) btnStart.addEventListener("click", startTimer);
  if (btnStop) btnStop.addEventListener("click", stopTimer);
  if (btnReset) btnReset.addEventListener("click", resetTimer);
}

// =============================================================================
// TO-DO LIST WIDGET
// =============================================================================

/**
 * isValidLabel(str) → boolean
 * Pure function — returns true if str is a non-empty, non-whitespace-only string.
 * Returns false for null, undefined, empty strings, and whitespace-only strings.
 *
 * @param {*} str - Value to validate
 * @returns {boolean}
 */
function isValidLabel(str) {
  if (str === null || str === undefined) return false;
  return String(str).trim().length > 0;
}

/**
 * generateId() → string
 * Generates a unique ID for tasks and quick links.
 * Uses crypto.randomUUID() when available (modern browsers).
 * Falls back to Date.now() + Math.random() for older browsers.
 *
 * @returns {string} A unique identifier string
 */
function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

/**
 * addTask(label) → void
 * Validates the label, creates a new Task object, appends it to state.tasks,
 * persists the updated list to localStorage, and re-renders the task list.
 * Has no effect if the label is invalid (empty or whitespace-only).
 *
 * @param {string} label - The task label to add
 */
function addTask(label) {
  if (!isValidLabel(label)) return;
  var task = {
    id: generateId(),
    label: label.trim(),
    completed: false,
  };
  state.tasks.push(task);
  storageSet(KEYS.tasks, state.tasks);
  renderTasks();
}

/**
 * toggleTask(id) → void
 * Finds the task with the given id, flips its completed flag,
 * persists the updated list to localStorage, and re-renders the task list.
 * Has no effect if no task with the given id exists.
 *
 * @param {string} id - The id of the task to toggle
 */
function toggleTask(id) {
  var task = state.tasks.find(function (t) {
    return t.id === id;
  });
  if (!task) return;
  task.completed = !task.completed;
  storageSet(KEYS.tasks, state.tasks);
  renderTasks();
}

/**
 * beginEditTask(id) → void
 * Finds the task row in the DOM for the given id and replaces it with an
 * inline edit field pre-filled with the current label. The edit field
 * includes a Save button (calls saveEditTask) and a Cancel button
 * (calls renderTasks to restore the normal view).
 * Has no effect if no task with the given id exists or the row is not found.
 *
 * @param {string} id - The id of the task to begin editing
 */
function beginEditTask(id) {
  var task = state.tasks.find(function (t) {
    return t.id === id;
  });
  if (!task) return;

  var row = document.querySelector('[data-task-id="' + id + '"]');
  if (!row) return;

  var editRow = document.createElement("li");
  editRow.className = "task-edit-row";
  editRow.setAttribute("data-task-id", id);

  var input = document.createElement("input");
  input.type = "text";
  input.className = "task-edit-input";
  input.value = task.label;

  var errorSpan = document.createElement("span");
  errorSpan.className = "error-msg";
  errorSpan.style.display = "none";

  var saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "task-save-btn";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", function () {
    var newLabel = input.value;
    if (!isValidLabel(newLabel)) {
      errorSpan.textContent = "Label cannot be empty.";
      errorSpan.style.display = "";
      return;
    }
    saveEditTask(id, newLabel);
  });

  var cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "task-cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", function () {
    renderTasks();
  });

  // Allow saving with Enter key
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      saveBtn.click();
    } else if (e.key === "Escape") {
      renderTasks();
    }
  });

  editRow.appendChild(input);
  editRow.appendChild(errorSpan);
  editRow.appendChild(saveBtn);
  editRow.appendChild(cancelBtn);

  row.parentNode.replaceChild(editRow, row);
  input.focus();
}

/**
 * saveEditTask(id, label) → void
 * Validates the new label, finds the task with the given id, updates its
 * label to the trimmed value, persists the updated list to localStorage,
 * and re-renders the task list.
 * Has no effect if the label is invalid or no task with the given id exists.
 *
 * @param {string} id    - The id of the task to update
 * @param {string} label - The new label for the task
 */
function saveEditTask(id, label) {
  if (!isValidLabel(label)) return;
  var task = state.tasks.find(function (t) {
    return t.id === id;
  });
  if (!task) return;
  task.label = label.trim();
  storageSet(KEYS.tasks, state.tasks);
  renderTasks();
}

/**
 * deleteTask(id) → void
 * Removes the task with the given id from state.tasks, persists the updated
 * list to localStorage, and re-renders the task list.
 * Has no effect if no task with the given id exists.
 *
 * @param {string} id - The id of the task to delete
 */
function deleteTask(id) {
  state.tasks = state.tasks.filter(function (t) {
    return t.id !== id;
  });
  storageSet(KEYS.tasks, state.tasks);
  renderTasks();
}

/**
 * renderTasks() → void
 * Rebuilds the task list DOM from state.tasks.
 *
 * For each task, creates a <li class="task-item"> with:
 *   - A checkbox that toggles completion via toggleTask(id)
 *   - A <span class="task-label"> with the task text; the parent <li> receives
 *     the "completed" class when task.completed is true, which applies
 *     strikethrough styling via CSS (.task-item.completed .task-label)
 *   - An Edit button that calls beginEditTask(id)
 *   - A Delete button that calls deleteTask(id)
 *
 * If state.tasks is empty, renders a brief empty-state message instead.
 *
 * Requirements: 5.4, 5.5, 5.10
 */
function renderTasks() {
  var list = document.getElementById("todo-list");
  if (!list) return;

  // Clear existing content
  list.innerHTML = "";

  // Empty state
  if (state.tasks.length === 0) {
    var emptyItem = document.createElement("li");
    emptyItem.className = "task-empty";
    emptyItem.textContent = "No tasks yet. Add one above!";
    emptyItem.style.color = "var(--color-text-muted)";
    emptyItem.style.padding = "0.75rem";
    emptyItem.style.textAlign = "center";
    emptyItem.style.fontSize = "0.875rem";
    list.appendChild(emptyItem);
    return;
  }

  // Render each task
  state.tasks.forEach(function (task) {
    var li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.setAttribute("data-task-id", task.id);

    // Completion checkbox
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task complete: " + task.label);
    checkbox.addEventListener("change", function () {
      toggleTask(task.id);
    });

    // Task label
    var labelSpan = document.createElement("span");
    labelSpan.className = "task-label";
    labelSpan.textContent = task.label;

    // Controls wrapper
    var controls = document.createElement("div");
    controls.className = "task-controls";

    // Edit button
    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "task-btn";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", "Edit task: " + task.label);
    editBtn.addEventListener("click", function () {
      beginEditTask(task.id);
    });

    // Delete button
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete task: " + task.label);
    deleteBtn.addEventListener("click", function () {
      deleteTask(task.id);
    });

    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(labelSpan);
    li.appendChild(controls);

    list.appendChild(li);
  });
}

/**
 * wireTaskListeners() → void
 * Attaches the submit handler for the add-task form (#todo-form).
 * On submit:
 *   - Prevents the default form submission
 *   - Reads the value from #todo-input
 *   - If isValidLabel(value) is false, shows an error in #todo-error and returns
 *   - Otherwise, clears the error, calls addTask(value), and clears the input
 *
 * Note: toggle, edit, save, and delete controls are wired inline inside
 * renderTasks() and beginEditTask() — no additional event delegation is needed.
 *
 * Called once during init().
 */
function wireTaskListeners() {
  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var errorSpan = document.getElementById("todo-error");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = input ? input.value : "";
    if (!isValidLabel(value)) {
      if (errorSpan) errorSpan.textContent = "Task label cannot be empty.";
      return;
    }
    if (errorSpan) errorSpan.textContent = "";
    addTask(value);
    if (input) input.value = "";
  });
}

// =============================================================================
// QUICK LINKS PANEL WIDGET
// =============================================================================

/**
 * isValidUrl(str) → boolean
 * Pure function — returns true if and only if str is a well-formed URL with
 * an http: or https: scheme.
 *
 * Returns false for:
 *   - null, undefined, empty strings
 *   - Non-URL strings (plain text, relative paths)
 *   - URLs with other schemes (ftp://, javascript:, data:, etc.)
 *
 * Uses the URL constructor in a try/catch for validation. Falls back to a
 * regex check if the URL constructor is unavailable (very old browsers).
 *
 * @param {*} str - Value to validate
 * @returns {boolean}
 */
function isValidUrl(str) {
  if (str === null || str === undefined || str === "") return false;
  if (typeof URL === "function") {
    try {
      var url = new URL(str);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  }
  // Fallback for environments without the URL constructor
  return /^https?:\/\/.+/.test(str);
}

/**
 * addLink(label, url) → void
 * Validates both the label and URL, creates a new QuickLink object, appends it
 * to state.links, persists the updated list to localStorage, and re-renders
 * the links panel.
 * Has no effect if the label is invalid (empty or whitespace-only) or the URL
 * is not a well-formed http/https URL.
 *
 * @param {string} label - The display label for the link
 * @param {string} url   - The URL to open when the link is clicked
 */
function addLink(label, url) {
  if (!isValidLabel(label)) return;
  if (!isValidUrl(url)) return;
  var link = {
    id: generateId(),
    label: label.trim(),
    url: url,
  };
  state.links.push(link);
  storageSet(KEYS.links, state.links);
  renderLinks();
}

/**
 * deleteLink(id) → void
 * Removes the link with the given id from state.links, persists the updated
 * list to localStorage, and re-renders the links panel.
 * Has no effect if no link with the given id exists.
 *
 * @param {string} id - The id of the link to delete
 */
function deleteLink(id) {
  state.links = state.links.filter(function (link) {
    return link.id !== id;
  });
  storageSet(KEYS.links, state.links);
  renderLinks();
}

/**
 * renderLinks() → void
 * Rebuilds the links panel DOM from state.links.
 *
 * For each link, creates a <div class="link-item"> with:
 *   - A <button class="link-button"> with the link label; clicking opens
 *     link.url in a new tab using window.open with noopener,noreferrer
 *   - A <button class="link-delete"> delete control; clicking calls deleteLink(id)
 *
 * If state.links is empty, renders a brief empty-state message instead.
 *
 * Requirements: 6.7
 */
function renderLinks() {
  var container = document.getElementById("links-container");
  if (!container) return;

  // Clear existing content
  container.innerHTML = "";

  // Empty state
  if (state.links.length === 0) {
    var emptyMsg = document.createElement("p");
    emptyMsg.className = "links-empty";
    emptyMsg.textContent = "No links yet. Add one above!";
    emptyMsg.style.color = "var(--color-text-muted)";
    emptyMsg.style.padding = "0.75rem";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.fontSize = "0.875rem";
    container.appendChild(emptyMsg);
    return;
  }

  // Render each link
  state.links.forEach(function (link) {
    var wrapper = document.createElement("div");
    wrapper.className = "link-item";
    wrapper.setAttribute("data-link-id", link.id);

    // Link button — opens URL in a new tab
    var linkBtn = document.createElement("button");
    linkBtn.type = "button";
    linkBtn.className = "link-button";
    linkBtn.textContent = link.label;
    linkBtn.setAttribute("aria-label", "Open link: " + link.label);
    linkBtn.addEventListener("click", function () {
      window.open(link.url, "_blank", "noopener,noreferrer");
    });

    // Delete button
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "link-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete link: " + link.label);
    deleteBtn.addEventListener("click", function () {
      deleteLink(link.id);
    });

    wrapper.appendChild(linkBtn);
    wrapper.appendChild(deleteBtn);

    container.appendChild(wrapper);
  });
}

/**
 * wireLinksListeners() → void
 * Attaches the submit handler for the add-link form (#links-form).
 * On submit:
 *   - Prevents the default form submission
 *   - Reads the label from #link-label-input and the URL from #link-url-input
 *   - If isValidLabel(label) is false, shows "Link label cannot be empty." in
 *     #links-error and returns
 *   - If isValidUrl(url) is false, shows "Please enter a valid http:// or
 *     https:// URL." in #links-error and returns
 *   - Otherwise, clears the error, calls addLink(label, url), and clears both
 *     inputs
 *
 * Note: link button clicks and delete controls are already wired inline inside
 * renderLinks() — no additional event delegation is needed here.
 *
 * Called once during init().
 *
 * Requirements: 6.2, 6.3, 6.4, 6.6
 */
function wireLinksListeners() {
  var form = document.getElementById("links-form");
  var labelInput = document.getElementById("link-label-input");
  var urlInput = document.getElementById("link-url-input");
  var errorSpan = document.getElementById("links-error");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var label = labelInput ? labelInput.value : "";
    var url = urlInput ? urlInput.value : "";

    if (!isValidLabel(label)) {
      if (errorSpan) errorSpan.textContent = "Link label cannot be empty.";
      return;
    }
    if (!isValidUrl(url)) {
      if (errorSpan)
        errorSpan.textContent = "Please enter a valid http:// or https:// URL.";
      return;
    }

    if (errorSpan) errorSpan.textContent = "";
    addLink(label, url);
    if (labelInput) labelInput.value = "";
    if (urlInput) urlInput.value = "";
  });
}

// =============================================================================
// SETTINGS BAR WIDGET
// =============================================================================

/**
 * wireNameSettings() → void
 * Attaches a click handler to the #settings-name-save button.
 * On click:
 *   - Reads the value from #settings-name and trims it
 *   - Writes the trimmed value to state.userName (empty string is valid —
 *     it clears the name from the greeting)
 *   - Persists the value to localStorage via storageSet(KEYS.userName, ...)
 *   - Clears any existing error message in #settings-name-error
 *   - Calls renderGreeting() to update the greeting display immediately
 *
 * Requirements: 2.1, 2.2, 2.4
 *
 * Called once during init().
 */
function wireNameSettings() {
  var saveBtn = document.getElementById("settings-name-save");
  var nameInput = document.getElementById("settings-name");
  var errorSpan = document.getElementById("settings-name-error");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", function () {
    var value = nameInput ? nameInput.value.trim() : "";

    // Save the trimmed value — empty string is valid (clears the name)
    state.userName = value;
    storageSet(KEYS.userName, state.userName);

    // Clear any previous error
    if (errorSpan) errorSpan.textContent = "";

    // Update the greeting immediately
    renderGreeting();
  });
}

/**
 * wirePomodoroSettings() → void
 * Attaches a click handler to the #settings-pomodoro-save button.
 * On click:
 *   - Reads the value from #settings-pomodoro and parses it as an integer
 *   - Calls validatePomodoroDuration(parsed) — if false, shows an inline
 *     error message in #settings-pomodoro-error and returns early
 *   - Otherwise, clears the error, writes parsed to state.pomodoroDuration,
 *     persists via storageSet(KEYS.pomodoroDuration, ...)
 *   - If the timer is not currently running, calls resetTimer() so the
 *     timer display updates to reflect the new duration
 *
 * Requirements: 4.1, 4.2, 4.5, 4.6
 *
 * Called once during init().
 */
function wirePomodoroSettings() {
  var saveBtn = document.getElementById("settings-pomodoro-save");
  var pomodoroInput = document.getElementById("settings-pomodoro");
  var errorSpan = document.getElementById("settings-pomodoro-error");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", function () {
    var value = pomodoroInput ? pomodoroInput.value : "";
    var parsed = parseInt(value, 10);

    if (!validatePomodoroDuration(parsed)) {
      if (errorSpan)
        errorSpan.textContent =
          "Please enter a whole number between 1 and 120.";
      return;
    }

    // Clear any previous error
    if (errorSpan) errorSpan.textContent = "";

    // Update state and persist
    state.pomodoroDuration = parsed;
    storageSet(KEYS.pomodoroDuration, state.pomodoroDuration);

    // Update timer display if the timer is not currently running
    if (!state.timerRunning) {
      resetTimer();
    }
  });
}

/**
 * wireThemeToggle() → void
 * Attaches a click handler to the #theme-toggle button.
 * On click:
 *   - Flips state.theme between "dark" and "light"
 *   - Applies the new theme to document.documentElement.dataset.theme
 *   - Persists the new theme to localStorage via storageSet(KEYS.theme, ...)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 *
 * Called once during init().
 */
function wireThemeToggle() {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", function () {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    storageSet(KEYS.theme, state.theme);
  });
}

// =============================================================================
// INITIALISATION
// =============================================================================

/**
 * init() → void
 * Called once on DOMContentLoaded. Bootstraps the entire application:
 *   1. Checks localStorage availability and shows a warning banner if unavailable
 *   2. Loads all persisted keys into the state object (with defaults for missing keys)
 *   3. Applies the saved theme to the <html> element
 *   4. Initialises timer runtime state
 *   5. Renders all widgets
 *   6. Populates settings input fields from state
 *   7. Wires all event listeners
 *   8. Starts the clock
 *
 * Requirements: 7.4, 7.5, 8.2, 8.3, 3.2, 4.3, 4.4, 5.10, 6.7
 */
function init() {
  // 1. Check localStorage availability; show warning banner if unavailable
  _storageAvailable = storageAvailable();
  if (!_storageAvailable) {
    var warningBanner = document.getElementById("storage-warning");
    if (warningBanner) {
      warningBanner.hidden = false;
    }
  }

  // 2. Load all persisted keys into state with defaults for missing keys
  var storedUserName = storageGet(KEYS.userName);
  state.userName = storedUserName !== null ? storedUserName : "";

  var storedPomodoroDuration = storageGet(KEYS.pomodoroDuration);
  state.pomodoroDuration =
    storedPomodoroDuration !== null ? storedPomodoroDuration : 25;

  var storedTasks = storageGet(KEYS.tasks);
  state.tasks = Array.isArray(storedTasks) ? storedTasks : [];

  var storedLinks = storageGet(KEYS.links);
  state.links = Array.isArray(storedLinks) ? storedLinks : [];

  var storedTheme = storageGet(KEYS.theme);
  state.theme = storedTheme !== null ? storedTheme : "dark";

  // 3. Apply saved theme to the <html> element
  document.documentElement.dataset.theme = state.theme;

  // 4. Initialise timer runtime state
  state.timerSeconds = state.pomodoroDuration * 60;
  state.timerRunning = false;
  state.timerIntervalId = null;

  // 5. Render all widgets
  renderGreeting();
  renderTimer();
  renderTasks();
  renderLinks();

  // 6. Populate settings input fields from state
  var settingsNameInput = document.getElementById("settings-name");
  if (settingsNameInput) {
    settingsNameInput.value = state.userName;
  }

  var settingsPomodoroInput = document.getElementById("settings-pomodoro");
  if (settingsPomodoroInput) {
    settingsPomodoroInput.value = state.pomodoroDuration;
  }

  // 7. Wire all event listeners
  wireTimerListeners();
  wireTaskListeners();
  wireLinksListeners();
  wireNameSettings();
  wirePomodoroSettings();
  wireThemeToggle();

  // 8. Start the clock (60-second interval for greeting updates)
  startClock();
}

document.addEventListener("DOMContentLoaded", init);
