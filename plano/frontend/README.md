# Action Plan Dashboard with AI-Powered Reporting

This is a comprehensive, self-contained frontend application for managing multiple action plans. It features an interactive dashboard for data visualization, a sophisticated report management hub, and a centralized interface for creating new actions, either manually or with powerful AI assistance. The application is built with React, TypeScript, and Tailwind CSS, and leverages the Google Gemini API for its advanced artificial intelligence capabilities.

---

## ✨ Key Features

- **Centralized Project Management**: A `HomeDashboard` acts as a command center, providing a high-level overview of all projects with global KPIs. Users can filter, search, and manage plans (view, cancel, delete) in either a card or table layout.

- **In-Depth Plan Analysis**: Each plan has a dedicated `Dashboard` to visualize progress with advanced charts, including status distribution (pie), actions by pillar (bar), workload by department (bar), and completion over time (line).

- **Dynamic Action Tracking**: The `ActionPlanTable` is the core of plan management, offering three distinct views:
    - **Card View**: A detailed, responsive overview of each action.
    - **Table View**: A compact, sortable list for quick analysis.
    - **Gantt Chart View**: A visual timeline of all actions and their deadlines.

- **AI-Powered Planning & Creation**: The application offers multiple intelligent ways to create and manage tasks:
    - **AI Planner**: A dedicated view to generate a complete action plan from a high-level goal or by analyzing an **uploaded PDF document** (e.g., an audit report).
    - **AI Action Generation**: Inside a plan, describe a problem and the Gemini AI will suggest a detailed list of actions, respecting the plan's context.
    - **AI Sub-Task Decomposition**: With a single click on an existing action card, the AI will break it down into smaller, actionable sub-tasks.
    - **AI Text Enhancement**: Improve the clarity and professionalism of task descriptions with an AI-powered rewrite feature directly within the action form.

- **Intelligent Reporting Suite**:
    - **AI-Generated Narratives**: Create professional, multi-page executive reports where Gemini analyzes the plan's data to write a comprehensive summary and conclusion.
    - **Rich Data Visualizations**: Reports automatically include KPI summaries, charts, and detailed data tables.
    - **Multi-Format Exporting**: Export any report or data table in various formats: **PDF**, **Word (.doc)**, **Excel (.xlsx)**, and **CSV**.
    - **Global Reports Hub**: A dedicated view to see, filter, and access all generated reports from every action plan in one place.

- **Smart UI/UX Features**:
    - **Global Search**: Instantly find any plan or action item across all projects using the persistent header search bar (shortcut: `/`).
    - **Responsive Design**: A modern, fully responsive interface with a collapsible sidebar ensures a seamless experience on any device.
    - **Toast Notifications**: Provides clear, non-intrusive feedback for user actions.

## 🤖 AI Integration (Google Gemini)

Artificial intelligence is at the core of this application's advanced functionality, utilized in several key areas via the `geminiService`:

1.  **`generateActionPlan`**: Powers the "AI Action Generation" feature. It takes a user prompt and an optional file (PDF), analyzes them within the context of the plan's creation date and origin, and returns a structured list of suggested actions using a specific, brand-protective tone.

2.  **`generateExecutiveSummary`**: The engine behind the executive reports. It analyzes a complete set of action items and generates a professional, narrative report in Markdown, including a summary and final considerations.

3.  **`generateSubTasks`**: Used by the main "AI Planner" to decompose a high-level objective or the contents of an uploaded document into a full, detailed action plan.

4.  **`generateSubTasksForAction`**: Enables the "Decompose with AI" feature, breaking down a single, complex action item into 1-3 smaller, manageable sub-tasks.

5.  **`rewriteText`**: A utility integrated into the action form that allows users to refine and professionalize their own writing for key fields, ensuring clarity and consistency.

## 🛠️ Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Data Visualization**: Recharts
- **Exporting**: jsPDF, html2canvas, SheetJS (XLSX)
- **State Management**: React Hooks (useState, useMemo) & Context API
