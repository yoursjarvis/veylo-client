# Veylo Client (Next.js + shadcn/ui)

Modern, high-performance frontend for Veylo, built with Next.js 15, TanStack Query, and shadcn/ui.

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Local Host Configuration

To support multi-tenancy and subdomains (e.g., `org1.veylo.local`), you need to update your hosts file.

### Linux / macOS
Add the following to `/etc/hosts`:
```bash
127.0.0.1 veylo.local
```

### Windows
Add the following to `C:\Windows\System32\drivers\etc\hosts` (Run Notepad as Administrator):
```text
127.0.0.1 veylo.local
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

```env
# URL of the Express Backend API
NEXT_PUBLIC_API_URL=http://veylo.local:4000/api/v1

# Base URL for Better Auth (on the backend)
NEXT_PUBLIC_BETTER_AUTH_URL="http://veylo.local:4000"

# Application Name
NEXT_PUBLIC_APP_NAME="Veylo"

# Current Frontend URL
NEXT_PUBLIC_APP_URL="http://veylo.local:3000"
```

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm i
   ```

2. **Run the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://veylo.local:3000](http://veylo.local:3000) with your browser to see the result.

## UI Components (shadcn/ui)

To add components to your app, run the following command:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
```

Components are located in the `components/ui` directory. Use them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
- `features/`: Logic and components grouped by feature (Auth, Org, etc.).
- `hooks/`: Custom React hooks.
- `lib/`: Shared utility functions and configurations (axios, auth-client, etc.).
- `public/`: Static assets.

