# Gantt Chart Implementation

This document describes how the Gantt Chart is implemented using `@visuallyjs/browser-ui-react` and `@visuallyjs/browser-ui`.

## Components

The application is built using a mix of standard VisuallyJS components and highly customized Gantt-specific components:

- **`SurfaceProvider`**: Provides the context for the underlying VisuallyJS surface.
- **`GanttProvider`**: A custom provider that manages the Gantt-specific state, such as tasks, dependencies, and timeline zoom levels.

### Custom Layout Components
- **`GanttControls`**: A custom toolbar for managing the Gantt chart (zoom, export, adding tasks).
- **`GanttLabels`**: Renders the task names and metadata in a left-hand column.
- **`GanttHeaders`**: Renders the timeline (days, weeks, months) at the top of the chart.
- **`GanttChart`**: The main component that renders the timeline bars and dependency arrows using a VisuallyJS surface.
- **Decorators**: The application uses decorators like `GanttBodyDecorator` and `GanttHeaders` to overlay additional information on the surface.

## Configuration Options

The Gantt chart is configured using several specialized options:

- **`renderOptions`**: Defines how the task bars and dependency lines are rendered.
- **`viewOptions`**: Configures the surface behavior, specifically tailored for timeline-based navigation.
- **`modelOptions`**: Defines rules for task relationships and date constraints.

The data is managed by a `parser.ts` which converts task data into a format suitable for the VisuallyJS surface.

## CSS Integration
- **VisuallyJS Core**: The core styles are included in `src/index.css` via `@import "@visuallyjs/browser-ui/css/visuallyjs.css";`.
- **App Styles**: Custom styles for the complex Gantt layout, timeline headers, and task bars are imported from `gantt.css`.
