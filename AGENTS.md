<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`.
Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Project rules

## Core principles
- Optimize for readability, consistency, and maintainability.
- Prefer the smallest safe change over broad rewrites.
- Follow existing project patterns before introducing new ones.
- Do not change unrelated code.

## Next.js conventions
- Use App Router.
- Prefer Server Components by default.
- Add `"use client"` only when state, effects, refs, browser APIs, or event handlers are required.
- Keep `page.tsx` and `layout.tsx` thin.
- Move reusable logic into components, hooks, or server utilities.

## File and naming conventions
- Components use PascalCase.
- Hooks use `useXxx` naming.
- Utility functions use camelCase.
- Route folders use kebab-case.
- Exported types/interfaces use PascalCase.
- Avoid vague names like `data`, `item`, `helper`, `temp`.

## Component rules
- One primary component per file.
- Split components that become too large or mix too many concerns.
- Prefer early returns over nested conditionals.
- Extract repeated JSX into subcomponents.
- Avoid complex inline event handlers in JSX.

## Data fetching
- Prefer server-side fetching when possible.
- Use client-side fetching only for interactive or user-driven updates.
- Keep fetching logic out of dumb/presentational components.
- Always handle loading, empty, and error states.
- Never ignore thrown errors.

## TypeScript
- Do not use `any` unless absolutely necessary.
- Add explicit types for exported functions, props, and shared utilities.
- Validate external/API data at the boundary.
- Prefer narrow, local types over overly generic abstractions.

## Styling
- Use Tailwind consistently.
- Reuse existing spacing, radius, and typography patterns.
- Use `cn`/`clsx` for conditional classes.
- Do not introduce custom CSS unless clearly justified.
- Keep styling changes visually consistent with neighboring components.

## Readability
- Prefer clear code over clever code.
- Keep functions focused on one responsibility.
- Use comments sparingly; explain why, not what.
- Avoid premature abstraction.
- Favor descriptive names over short names.

## Before writing code
- Check for existing patterns in nearby files.
- Check whether the same UI or logic already exists.
- If editing a feature, preserve behavior unless explicitly asked to change it.

## When responding
- Briefly explain what changed.
- Mention tradeoffs if relevant.
- Call out anything uncertain before making risky assumptions.