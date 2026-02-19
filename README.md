# SwipeJobs Take-Home

A Next.js (App Router) React app that loads a worker profile, job matches, and supports accept/reject decisions using the SwipeJobs test API.

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
- `src/hooks/useProfile.ts` and `src/hooks/useJobs.ts` encapsulate fetch state, errors, and reloading.
- `src/components` contains UI building blocks with CSS Modules for isolated styling.
- Optimistic updates for accept/reject live in `src/app/page.tsx` and revert on failure.
- Next.js route handlers in `src/app/api` proxy SwipeJobs requests to avoid browser CORS issues.

## Testing

- `__tests__/api.test.ts` covers success and failure cases, including network, 404, and 500 responses.
- `__tests__/pagination.test.tsx` validates pagination behavior and disabled states.

## Project Structure

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    page.module.css
  components/
    ProfileHeader.tsx
    ProfileHeader.module.css
    JobCard.tsx
    JobCard.module.css
    Pagination.tsx
    Pagination.module.css
  hooks/
    useProfile.ts
    useJobs.ts
  lib/
    api.ts
    types.ts
__tests__/
  api.test.ts
  pagination.test.tsx
```
