# Implementation Plan: To-Do List Life Dashboard

## Overview

This plan implements a self-contained, client-side productivity dashboard using vanilla HTML, CSS, and JavaScript. The application consists of five independent widgets (greeting, focus timer, to-do list, quick links, settings) that share a common localStorage persistence layer and CSS custom properties theming system. No frameworks, build tools, or external dependencies are required.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` in the project root with basic HTML5 structure
  - Add semantic HTML containers for all five widgets: greeting, timer, to-do list, quick links, and settings bar
  - Include `<link>` tag for `css/style.css` and `<script>` tag for `js/app.js` (defer)
  - Add `data-theme="dark"` attribute to `<html>` element for theming
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Implement CSS theming system and base styles
  - Create `css/style.css` with CSS custom properties for dark and light themes
  - Define color variables scoped to `[data-theme="dark"]` and `[data-theme="light"]` selectors
  - Implement soft purple and black palette for dark theme
  - Implement light, high-contrast palette for light theme
  - Add base layout styles for the dashboard grid and widget containers
  - Style all interactive elements (buttons, inputs, checkboxes) with theme-aware colors
  - _Requirements: 7.6, 7.7, 10.1_

- [x] 3. Set up JavaScript application structure and storage module
  - Create `js/app.js` with module-like structure using plain functions and closures
  - Implement storage helper functions: `storageGet(key)`, `storageSet(key, value)`, `storageAvailable()`
  - Wrap all localStorage calls in try/catch blocks for error handling
  - Define storage keys: `tld_userName`, `tld_pomodoroDuration`, `tld_tasks`, `tld_links`, `tld_theme`
  - Create the `state` object to hold all application data in memory
  - _Requirements: 8.1, 8.3, 8.4, 9.4_

- [x] 4. Implement greeting widget with clock
  - [x] 4.1 Create `getGreetingPhrase(hour)` pure function
    - Implement hour-to-phrase mapping: 05-11 → Morning, 12-17 → Afternoon, 18-21 → Evening, 22-04 → Night
    - Return exactly one greeting phrase for any hour value 0-23
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 4.2 Create `renderGreeting()` function
    - Read current Date and compute time, date, and greeting phrase
    - Read `state.userName` and append to greeting if non-empty
    - Update DOM elements for time, date, and greeting text
    - _Requirements: 1.1, 1.2, 1.7, 1.8, 2.3_

  - [x] 4.3 Create `startClock()` function
    - Set up 60-second interval that calls `renderGreeting()`
    - Store interval ID for potential cleanup
    - _Requirements: 1.1_

- [x] 5. Implement focus timer widget
  - [x] 5.1 Create timer pure functions
    - Implement `formatTimerDisplay(seconds)` to return MM:SS format with zero-padding
    - Implement `validatePomodoroDuration(n)` to return true only for integers in [1, 120]
    - _Requirements: 3.1, 4.1, 4.6_

  - [x] 5.2 Create timer state management functions
    - Implement `startTimer()` to set interval, update button states, and set `state.timerRunning = true`
    - Implement `stopTimer()` to clear interval, update button states, and set `state.timerRunning = false`
    - Implement `resetTimer()` to clear interval, restore `state.timerSeconds` from `state.pomodoroDuration`, and render
    - Implement `onTimerTick()` to decrement `state.timerSeconds`, call `renderTimer()`, and fire alert at 0
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [x] 5.3 Create `renderTimer()` function
    - Write formatted time to DOM
    - Update button disabled states based on `state.timerRunning`
    - Start enabled and Stop disabled when stopped; Start disabled and Stop enabled when running
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 5.4 Wire timer button event listeners
    - Attach click handlers for Start, Stop, and Reset buttons
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 6. Checkpoint - Verify greeting and timer widgets
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement to-do list widget
  - [x] 7.1 Create task validation and ID generation
    - Implement `isValidLabel(str)` pure function to return false for empty or whitespace-only strings
    - Implement ID generation using `crypto.randomUUID()` with fallback to `Date.now().toString() + Math.random()`
    - _Requirements: 5.3, 5.8_

  - [x] 7.2 Create task management functions
    - Implement `addTask(label)` to validate, append to `state.tasks`, persist, and re-render
    - Implement `toggleTask(id)` to flip completed flag, persist, and re-render
    - Implement `beginEditTask(id)` to replace task row with inline edit field
    - Implement `saveEditTask(id, label)` to validate, update label, persist, and re-render
    - Implement `deleteTask(id)` to remove from `state.tasks`, persist, and re-render
    - _Requirements: 5.2, 5.5, 5.6, 5.7, 5.9_

  - [x] 7.3 Create `renderTasks()` function
    - Rebuild task list DOM from `state.tasks`
    - Apply visual distinction (strikethrough) to completed tasks
    - Render completion toggle, edit control, and delete control for each task
    - _Requirements: 5.4, 5.5, 5.10_

  - [x] 7.4 Wire task list event listeners
    - Attach submit handler for add task form with validation and inline error display
    - Attach event delegation for toggle, edit, save, and delete controls
    - _Requirements: 5.2, 5.3, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 8. Implement quick links panel widget
  - [x] 8.1 Create URL validation function
    - Implement `isValidUrl(str)` pure function using URL constructor in try/catch
    - Return true only for well-formed http:// or https:// URLs
    - Fallback to regex `/^https?:\/\/.+/` if URL constructor unavailable
    - _Requirements: 6.3_

  - [x] 8.2 Create link management functions
    - Implement `addLink(label, url)` to validate both fields, append to `state.links`, persist, and re-render
    - Implement `deleteLink(id)` to remove from `state.links`, persist, and re-render
    - _Requirements: 6.2, 6.6_

  - [x] 8.3 Create `renderLinks()` function
    - Rebuild links panel DOM from `state.links`
    - Render each link as a button with label and delete control
    - _Requirements: 6.7_

  - [x] 8.4 Wire quick links event listeners
    - Attach submit handler for add link form with validation and inline error display
    - Attach click handlers for link buttons to open URLs in new tabs (`target="_blank"`)
    - Attach event delegation for delete controls
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 9. Checkpoint - Verify task list and quick links widgets
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement settings bar widget
  - [x] 10.1 Create user name settings handler
    - Wire input field and save button for user name
    - On save, validate non-empty, write to `state.userName`, persist, and call `renderGreeting()`
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 10.2 Create Pomodoro duration settings handler
    - Wire number input (min=1, max=120) and save button for Pomodoro duration
    - On save, validate range using `validatePomodoroDuration()`, write to `state.pomodoroDuration`, persist
    - If timer is not running, call `resetTimer()` to update display
    - Display inline validation error for out-of-range values
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [x] 10.3 Create theme toggle handler
    - Wire theme toggle button
    - On click, flip `state.theme` between "dark" and "light"
    - Set `document.documentElement.dataset.theme` to new value
    - Persist new theme to localStorage
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Implement application initialization
  - Create `init()` function called on `DOMContentLoaded`
  - Call `storageAvailable()` and show warning banner if false
  - Load all keys from localStorage into `state` object with defaults: userName="", pomodoroDuration=25, tasks=[], links=[], theme="dark"
  - Apply `state.theme` to `document.documentElement.dataset.theme`
  - Initialize timer runtime state: `state.timerSeconds = state.pomodoroDuration * 60`, `state.timerRunning = false`, `state.timerIntervalId = null`
  - Call all render functions: `renderGreeting()`, `renderTimer()`, `renderTasks()`, `renderLinks()`
  - Populate settings input fields from state
  - Wire all event listeners for all widgets
  - Call `startClock()` to begin clock updates
  - _Requirements: 7.4, 7.5, 8.2, 8.3, 3.2, 4.3, 4.4, 5.10, 6.7_

- [x] 12. Final checkpoint - Verify complete application
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks involve creating or editing the three project files: `index.html`, `css/style.css`, `js/app.js`
- No frameworks, build tools, package managers, or external dependencies are used
- No test files or terminal commands are included per project constraints
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- Pure functions (greeting phrase, timer formatting, validation) are designed to be side-effect-free for easier verification
- All state mutations follow the pattern: update in-memory state → re-render affected widget → persist to localStorage
