# SwipeJobs Take-Home

A Next.js (App Router) React app that loads worker matches and supports accept/reject decisions using the SwipeJobs test API.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm test` - unit tests (Jest + React Testing Library)

## Architecture Notes

- Data access is centralized in `src/lib/api.ts`, with runtime guards and a shared `ApiError`.
- `src/hooks/useMatchesData.ts` encapsulates fetching worker + matches with React Query.
- `src/components/matches/JobActionsProvider.tsx` handles optimistic hide + undo flow with per-job timers.
- `src/components` contains UI building blocks with CSS Modules for isolated styling.
- Next.js route handlers in `src/app/api` proxy SwipeJobs requests to avoid browser CORS issues.
- Routes are under `/matches` with a persistent split layout on desktop.

## Testing

- `__tests__/api.test.ts` covers success and failure cases, including network, 404, and 500 responses.
- `__tests__/pagination.test.tsx` validates pagination behavior and disabled states.
- `__tests__/job-actions-provider.test.tsx` covers optimistic hide + undo behavior.

## Project Structure

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    page.module.css
    not-found.tsx
    matches/
      layout.tsx
      page.tsx
      [jobId]/
        page.tsx
        loading.tsx
  components/
    jobs/
      CompanyMark.tsx
      JobCard.tsx
      JobCard.module.css
      JobDetailsPanel.tsx
      JobDetailsPanel.module.css
      Pagination.tsx
      Pagination.module.css
      Toast.tsx
      Toast.module.css
      ToastProvider.tsx
      ToastProvider.module.css
    matches/
      JobActionsProvider.tsx
      MatchesList.tsx
      MatchesShell.tsx
    navbar/
      Navbar.tsx
      Navbar.module.css
    providers/
      QueryProvider.tsx
  hooks/
    useMatchesData.ts
  lib/
    api.ts
    types.ts
__tests__/
  api.test.ts
  pagination.test.tsx
  job-actions-provider.test.tsx
  jobcard.test.tsx
  jobdetails-panel.test.tsx
```
