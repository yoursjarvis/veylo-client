### 1. Marking the Root Page as a Client Component

- **Problem**: Adding `"use client"` at the top of a root page component forces the entire component tree to render on the client, negating all performance benefits of Server Components. Often done unnecessarily due to misunderstanding architecture.
- **Solution**: Only mark the _individual, interactive leaf nodes_ (child components) that truly require client-side interactivity as client components. Keep parent pages and layouts as Server Components where possible.

### 2. Not Protecting Server Actions

- **Problem**: Server Actions are public HTTP endpoints. If unprotected, anyone can trigger them, potentially leading to unauthorized data manipulation or security vulnerabilities.
- **Solution**: Always implement robust protection for Server Actions: verify user authentication, perform thorough input validation and standardization, and check user access rights before executing any sensitive logic.

### 3. Placing Server Component `get` Calls Inside a Server Actions File

- **Problem**: Any function exported from a file containing `"use server"` becomes a public HTTP endpoint. Placing data fetching (`get`) functions here unnecessarily exposes them and potentially sensitive data.
- **Solution**: Separate data fetching logic (functions that don't perform mutations) into a dedicated file (e.g., `lib/data.ts` or `lib/cart-server.ts`). Only functions intended for mutations should reside in `"use server"` files.

### 4. Shipping AI-Generated Code to Production Without Review

- **Problem**: While AI tools accelerate development, their code isn't always perfect. Shipping unreviewed AI code can introduce bugs, missing edge cases, or inconsistent variable naming.
- **Solution**: Use AI for speed, but always perform thorough code reviews. Leverage AI-powered code review tools (like Graphite) to catch potential issues before deployment.

### 5. Using Route Handlers Instead of Server Components for GET Requests

- **Problem**: Creating separate API routes (`/api/...`) for simple GET requests that could be handled directly by Server Components. This adds unnecessary boilerplate, separate API management, and often forces the use of client components for state management.
- **Solution**: For simple GET requests, fetch data directly within an `async` Server Component. This reduces code, eliminates separate API routes, and keeps logic closer to where it's used. Use Suspense for loading states instead of `useState`.

### 6. Placing a Suspense Boundary at the Wrong Level

- **Problem**: Placing a `<Suspense>` boundary directly around the `async` function call itself will not trigger the loader. It can also lead to errors if `cache` components are enabled and uncached data is accessed outside Suspense.
- **Solution**: Place the `<Suspense>` boundary _one level below_ the async data fetching logic, wrapping the component that _consumes_ the fetched data. This ensures the loader displays correctly while the data is being prepared.

### 7. Mixing Up `use cache` and `use cache private`

- **Problem**: Using `use cache` for dynamic, user-specific data (e.g., a user's cart) that relies on cookies or headers. This can lead to incorrect caching, data leakage, or runtime errors.
- **Solution**: Use `use cache` for static, non-user-specific data. Use `use cache private` for dynamic, user-specific data that accesses cookies, headers, or other dynamic data sources, ensuring proper caching behavior.

### 8. Using `update tag` When You Mean to Use `refresh`

- **Problem**: `update tag` invalidates _statically_ cached data (e.g., from `fetch` with `next.revalidate`). `refresh` forces a server component to re-render and re-read _dynamic_ data (e.g., from cookies). Misusing them leads to stale data or unnecessary cache purges.
- **Solution**: Use `revalidateTag()` (or `revalidatePath()`) to invalidate tagged static caches. Use `router.refresh()` to force a server component to re-render and fetch fresh dynamic data.

### 9. Incorrectly Using Context Providers with the App Router

- **Problem**: Directly wrapping the root `layout.tsx` with a client-side context provider (e.g., a theme provider) can inadvertently force the entire application tree to become a client component, losing Server Component benefits.
- **Solution**: Create a separate client component for your provider (e.g., `ThemeProvider.tsx` with `"use client"`). This provider component should accept `children` as a prop and render them. Then, wrap your layout's `children` with this client-side provider. This allows interleaving of server and client components.

### 10. Using `window` or Client Handlers Inside a Server Component

- **Problem**: Server Components execute in a Node.js environment and do not have access to browser-specific APIs like `window`, `document`, or client-side event handlers. Using them will result in runtime errors or unexpected behavior.
- **Solution**: Extract any code that relies on browser APIs or client-side interactivity into a dedicated client component. Only place `"use client"` at the top of that specific component.

### 11. Adding `"use client"` Unnecessarily

- **Problem**: Developers often add `"use client"` to components with simple forms or buttons, assuming interactivity requires it. This unnecessarily converts the component and its subtree to client-side, hindering Next.js optimizations.
- **Solution**: Many interactive elements, like forms submitting via Server Actions, do not require `"use client"`. Only use it when true client-side interactivity, browser APIs, or state management are genuinely needed.

### 12. Not Revalidating Data After Mutations

- **Problem**: After a mutation (e.g., adding an item to a cart via a Server Action), the UI might display stale data because Next.js's router cache or data cache hasn't been updated.
- **Solution**: Always call `revalidatePath()` or `revalidateTag()` (from `next/cache`) after a successful mutation in your Server Action. This tells Next.js to fetch fresh data for the relevant paths or tags, updating the UI.

### 13. Redirecting Inside a `try-catch` Block

- **Problem**: The `redirect()` function in Next.js works by throwing an internal error to signal the App Router to perform a redirect. If `redirect()` is called inside a `try-catch` block, the `catch` block will intercept this error, preventing the redirect from occurring.
- **Solution**: Call `redirect()` _outside_ of `try-catch` blocks. If it must be inside, ensure you `rethrow` the error within the `catch` block to allow the redirect to proceed.

### 14. Forcing Everything to Be a Server Component (Even Highly Interactive UIs)

- **Problem**: Attempting to implement highly interactive UI elements (e.g., counters, games, drag-and-drop, animations, components using browser APIs) as Server Components leads to constant network round trips, lag, and a poor user experience.
- **Solution**: Embrace client components for genuinely interactive UI. Use them for features like real-time updates, browser API access (local storage, geolocation), complex form validation, and animations. Don't force server components where client-side interactivity is paramount.

### 15. Not Using `loading.tsx` for Loading States

- **Problem**: Instead of `loading.tsx`, developers often convert Server Components to Client Components to manage loading states with `useState`, adding unnecessary client-side code and complexity.
- **Solution**: Leverage `loading.tsx` at the appropriate route segment level. This file automatically displays a loading UI while data for that segment is being fetched, keeping your main page components as Server Components and reducing client-side JavaScript.

### 16. Fetching the Same Data Twice (e.g., for Metadata and Page Content)

- **Problem**: For dynamic routes, developers often fetch the same data twice: once in `generateMetadata` and again in the page component, leading to redundant network requests and performance overhead.
- **Solution**: Use the `cache` function from React (or `unstable_cache` in Next.js) to memoize your data fetching function. Call this cached function once, and it will return the memoized result for both `generateMetadata` and the page component within the same request.

### 17. Not Resolving Hydration Errors Correctly

- **Problem**: Hydration errors occur when the server-rendered HTML doesn't match the client-rendered HTML. Common causes include invalid HTML semantics (e.g., a `<p>` tag containing an `<h2>`) or client-only code running on the server.
- **Solution**:
  1. **Check HTML Semantics**: Ensure your JSX adheres to valid HTML structure.
  2. **Conditional Rendering**: For client-specific code, use `typeof window !== 'undefined'` to ensure it only runs in the browser environment.

### 18. Not Using `layout.tsx` Correctly for Persistent Data Fetching

- **Problem**: Fetching common data (e.g., navigation links, user profile) repeatedly in every dynamic route or page component. This leads to multiple redundant data fetches and re-renders across different pages.
- **Solution**: Move common data fetching logic and components (like a sidebar or header) to the `layout.tsx` file one level up. Make the layout an `async` component and fetch data there. This data will be fetched once and persist across all child routes, improving performance.

### 19. Not Caching Repeatable Code/Expensive Functions

- **Problem**: Re-executing expensive data fetching or computation functions multiple times across different components that require the same data within a single render cycle.
- **Solution**: Use `cache` (or `unstable_cache`) to memoize expensive functions. If multiple components need the same data, call the cached function once. Subsequent calls with the same arguments will return the memoized result, avoiding redundant work.

### 20. Using Environment Variables in Client Components Without Proper Naming

- **Problem**: Accidentally exposing sensitive server-side environment variables to the client by not prefixing them with `NEXT_PUBLIC_`, or conversely, expecting `NEXT_PUBLIC_` variables to be available on the server without the prefix.
- **Solution**:
  - **Server-only**: Use `process.env.YOUR_VAR` for sensitive variables. These are _never_ exposed to the client.
  - **Client-exposed**: Use `process.env.NEXT_PUBLIC_YOUR_VAR` for variables that _must_ be available on the client.
  - Never pass sensitive `process.env.YOUR_VAR` directly to a client component. Instead, fetch data on the server and pass only the necessary, non-sensitive data.

### 21. Not Using `error.tsx` Alongside `loading.tsx`

- **Problem**: Implementing `loading.tsx` but neglecting `error.tsx` leaves users with a broken UI or an unhandled error page if an error occurs during data fetching or component rendering.
- **Solution**: Implement `error.tsx` at the appropriate route segment level. This provides a graceful fallback UI with a helpful message and options (e.g., go home") when errors occur, preventing the entire application from crashing.

### 22. Trying to Use Dynamic Functions Directly in `metadata` Export

- **Problem**: The `metadata` export (e.g., `export const metadata = { title: '...' }`) must be a static object. Attempting to use dynamic values or functions directly within this constant will not work or will lead to incorrect metadata.
- **Solution**: For dynamic metadata (e.g., based on route parameters or fetched data), use the `generateMetadata` async function. This function receives `params` and `searchParams` and allows you to fetch data and construct metadata dynamically.

### 23. Not Using the `cache` Function for Request Memoization

- **Problem**: Making the same data request multiple times within the same render cycle, even if the data is identical, leading to redundant network calls and performance overhead.
- **Solution**: Use the `cache` function from React (or `unstable_cache` in Next.js) to memoize data fetching functions. This ensures that if the function is called multiple times with the same arguments within a render, the result is computed only once and reused.

### 24. Mixing Up `redirect` vs. `router.push`

- **Problem**: Using `router.push` for server-side redirects or `redirect` for client-side navigation, leading to incorrect behavior or unnecessary client-side overhead.
- **Solution**:
  - Use `redirect()` (from `next/navigation`) for _server-side redirects_. This is ideal when no client-side interaction (like toast messages) is needed after an action.
  - Use `router.push()` (from `next/navigation`'s `useRouter` hook) for _client-side navigation_, especially when you need to perform client-side actions (e.g., display a toast, update local state) before or after navigation.

### 25. Causing Layout Shifts by Loading Google Fonts Manually in CSS

- **Problem**: Manually importing Google Fonts in CSS or as a script can cause layout shifts (CLS) because fonts take time to load, and the browser renders text with a fallback font before the custom font is available.
- **Solution**: Use `next/font/google` (or `next/font/local`) to import and optimize fonts. Next.js handles font loading, preloading, and prevents layout shifts by automatically inlining font definitions and applying `font-display: optional`.

### 26. Omitting Debug Logs That Clutter Server Logs and Cost Money

- **Problem**: Leaving `console.log` statements in production code. These clutter server logs, can expose sensitive data, and incur costs from log ingestion services (e.g., Datadog) based on log volume.
- **Solution**: Configure Next.js to remove `console.log` statements in production. Use the `compiler.removeConsole` option in `next.config.js`. You can set it to `true` to remove all logs or `exclude: ['error']` to keep only error logs.

### 27. Images Without `sizes` Prop

- **Problem**: Not using the `sizes` prop with `next/image` leads to loading a large image asset even for smaller viewports, wasting bandwidth and impacting performance.
- **Solution**: Always provide the `sizes` prop to `next/image`. This prop tells the browser the expected rendered size of the image at different viewport widths, allowing Next.js to serve an appropriately sized image, optimizing performance and reducing bandwidth usage.

### 28. Not Tagging the Cache Correctly

- **Problem**: Without proper cache tagging, you lose the ability to selectively invalidate specific pieces of cached data. This often forces you to purge the entire route cache, leading to unnecessary re-fetching of unrelated data and performance degradation.
- **Solution**: When caching data (e.g., with `fetch` or `unstable_cache`), use the `tags` option to assign specific tags (e.g., `['lesson-data']`). This enables granular cache invalidation using `revalidateTag()`, updating only the relevant data.

### 29. Executing Mutations Inside Server Components

- **Problem**: Server Components are primarily for data _fetching_, not _mutation_. Attempting to perform mutations directly within a Server Component (e.g., calling a server action and fetching data in the same component) leads to race conditions, stale data, and chaotic behavior because Server Components don't re-render automatically after mutations.
- **Solution**: Use Server Components for data fetching. Use _Server Actions_ (triggered by forms or buttons) for executing mutations. After a mutation, use `revalidatePath()` or `revalidateTag()` to update the UI. If a Server Component needs to reflect a mutation, it should be re-rendered via `router.refresh()` or by invalidating its cache.
