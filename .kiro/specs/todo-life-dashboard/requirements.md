# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub in a single browser page, combining a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel. All data is stored in the browser's Local Storage — no backend or server is required. The app supports a soft purple and black visual theme, light/dark mode toggling, a customizable user name in the greeting, and a configurable Pomodoro duration.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting.
- **Timer**: The Pomodoro-style countdown timer widget.
- **Task_List**: The UI section that manages to-do items.
- **Task**: A single to-do item with a text label and a completion state.
- **Links_Panel**: The UI section that displays user-defined quick-access link buttons.
- **Quick_Link**: A saved entry consisting of a label and a URL that opens in a new browser tab.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Theme**: The visual color scheme of the Dashboard — either Light or Dark.
- **Pomodoro_Duration**: The configurable countdown length for the Timer, defaulting to 25 minutes.
- **User_Name**: The customizable name displayed in the greeting, stored in Local Storage.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting based on the time of day, so that I feel welcomed and oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, June 9, 2025").
3. WHEN the current hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the current hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the current hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the current hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHERE a User_Name has been saved, THE Greeting_Widget SHALL append the User_Name to the greeting (e.g., "Good Morning, Alex").
8. WHERE no User_Name has been saved, THE Greeting_Widget SHALL display the greeting without a name suffix.

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to set my name so that the greeting feels personal to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field or prompt that allows the user to enter a User_Name.
2. WHEN the user saves a User_Name, THE Dashboard SHALL persist the User_Name in Local Storage.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the User_Name from Local Storage and display it in the Greeting_Widget.
4. WHEN the user clears or updates the User_Name, THE Dashboard SHALL update Local Storage and refresh the Greeting_Widget immediately.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a countdown timer I can start, stop, and reset, so that I can work in focused Pomodoro sessions.

#### Acceptance Criteria

1. THE Timer SHALL display the remaining time in MM:SS format.
2. WHEN the Dashboard loads and no session is active, THE Timer SHALL display the current Pomodoro_Duration as the starting value.
3. WHEN the user activates the Start control, THE Timer SHALL begin counting down one second per second.
4. WHEN the user activates the Stop control, THE Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown and restore the display to the current Pomodoro_Duration.
6. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically and notify the user with a browser alert or audible signal.
7. WHILE the Timer is counting down, THE Timer SHALL disable the Start control and enable the Stop and Reset controls.
8. WHILE the Timer is stopped or reset, THE Timer SHALL enable the Start control and disable the Stop control.

---

### Requirement 4: Configurable Pomodoro Duration

**User Story:** As a user, I want to change the Pomodoro timer duration, so that I can adapt the session length to my preferred work style.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a control that allows the user to set the Pomodoro_Duration to any whole number of minutes between 1 and 120.
2. WHEN the user saves a new Pomodoro_Duration, THE Dashboard SHALL persist the value in Local Storage.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the Pomodoro_Duration from Local Storage and apply it as the Timer's starting value.
4. IF no Pomodoro_Duration has been saved, THEN THE Timer SHALL default to 25 minutes.
5. WHEN the user saves a new Pomodoro_Duration while the Timer is not active, THE Timer SHALL immediately update its display to reflect the new duration.
6. IF the user attempts to save a Pomodoro_Duration outside the range of 1 to 120 minutes, THEN THE Dashboard SHALL display an inline validation message and reject the value.

---

### Requirement 5: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Task_List SHALL provide an input field and a submit control for adding new Tasks.
2. WHEN the user submits a new Task with a non-empty label, THE Task_List SHALL append the Task to the list and persist all Tasks to Local Storage.
3. IF the user attempts to submit a Task with an empty or whitespace-only label, THEN THE Task_List SHALL reject the submission and display an inline validation message.
4. THE Task_List SHALL display each Task with its label, a completion toggle, an edit control, and a delete control.
5. WHEN the user activates the completion toggle on a Task, THE Task_List SHALL update the Task's completion state, apply a visual distinction (e.g., strikethrough) to completed Tasks, and persist the updated state to Local Storage.
6. WHEN the user activates the edit control on a Task, THE Task_List SHALL present the Task's label in an editable field pre-filled with the current label.
7. WHEN the user saves an edited Task label that is non-empty, THE Task_List SHALL update the Task's label and persist the change to Local Storage.
8. IF the user attempts to save an edited Task label that is empty or whitespace-only, THEN THE Task_List SHALL reject the change and display an inline validation message.
9. WHEN the user activates the delete control on a Task, THE Task_List SHALL remove the Task from the list and persist the updated list to Local Storage.
10. WHEN the Dashboard loads, THE Task_List SHALL read all Tasks from Local Storage and render them in their saved order and completion state.

---

### Requirement 6: Quick Links Panel

**User Story:** As a user, I want to save and access my favorite website links from the Dashboard, so that I can navigate to them quickly.

#### Acceptance Criteria

1. THE Links_Panel SHALL provide input fields for a link label and a URL, and a submit control for adding new Quick_Links.
2. WHEN the user submits a new Quick_Link with a non-empty label and a valid URL, THE Links_Panel SHALL add a button for the Quick_Link and persist all Quick_Links to Local Storage.
3. IF the user attempts to submit a Quick_Link with an empty label or an invalid URL, THEN THE Links_Panel SHALL reject the submission and display an inline validation message.
4. WHEN the user activates a Quick_Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
5. THE Links_Panel SHALL provide a delete control for each Quick_Link.
6. WHEN the user activates the delete control on a Quick_Link, THE Links_Panel SHALL remove the Quick_Link and persist the updated list to Local Storage.
7. WHEN the Dashboard loads, THE Links_Panel SHALL read all Quick_Links from Local Storage and render them as buttons.

---

### Requirement 7: Light / Dark Mode

**User Story:** As a user, I want to toggle between a light and dark color scheme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the Theme between Light and Dark.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI elements immediately without a page reload.
3. WHEN the user activates the theme toggle, THE Dashboard SHALL persist the selected Theme in Local Storage.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved Theme from Local Storage and apply it before rendering content.
5. IF no Theme has been saved, THEN THE Dashboard SHALL apply the Dark Theme as the default.
6. WHILE the Dark Theme is active, THE Dashboard SHALL use a soft purple and black color palette.
7. WHILE the Light Theme is active, THE Dashboard SHALL use a light, readable color palette with sufficient contrast for all text and interactive elements.

---

### Requirement 8: Data Persistence and Integrity

**User Story:** As a user, I want my data to survive page refreshes and browser restarts, so that I never lose my tasks, links, or settings.

#### Acceptance Criteria

1. THE Dashboard SHALL store all user data — Tasks, Quick_Links, User_Name, Pomodoro_Duration, and Theme — exclusively in Local Storage.
2. WHEN the Dashboard loads, THE Dashboard SHALL restore all widgets to their last saved state from Local Storage.
3. IF Local Storage is unavailable or read fails, THEN THE Dashboard SHALL display a non-blocking warning message and operate with default in-memory values for the session.
4. THE Dashboard SHALL NOT require any network request, backend server, or external dependency to function.

---

### Requirement 9: File and Project Structure

**User Story:** As a developer, I want the project to follow a clean, predictable file structure, so that the codebase is easy to navigate and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using exactly one HTML file at the project root.
2. THE Dashboard SHALL use exactly one CSS file located inside a `css/` directory.
3. THE Dashboard SHALL use exactly one JavaScript file located inside a `js/` directory.
4. THE Dashboard SHALL NOT depend on any JavaScript framework, library, or build tool.
5. THE Dashboard SHALL NOT require a backend server or any server-side runtime to operate.

---

### Requirement 10: Browser Compatibility and Performance

**User Story:** As a user, I want the Dashboard to load quickly and work reliably across modern browsers, so that I can use it anywhere without friction.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL complete its initial render within 2 seconds on a standard desktop connection.
3. WHEN the user interacts with any control (add task, toggle theme, start timer, etc.), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
4. THE Dashboard SHALL be usable as a standalone HTML file opened directly in a browser without a web server.
