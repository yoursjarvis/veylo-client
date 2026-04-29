// app/login/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="relative w-full max-w-xl">
        {/* subtle guide lines */}
        <div className="pointer-events-none absolute inset-0 border border-white/5" />
        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/5" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/5" />

        <Card className="relative mx-auto w-full max-w-md border-none bg-transparent shadow-none">
          <CardContent className="space-y-6 p-8">
            {/* Logo + Brand */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 shadow-md">
                <span className="text-xl font-bold tracking-tight">A</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Nexus</h1>
            </div>

            {/* Form */}
            <form className="space-y-5">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  type="text"
                  placeholder="John"
                  className="h-12 border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  type="text"
                  placeholder="Doe"
                  className="h-12 border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-12 border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-b from-zinc-600 to-zinc-900 text-base font-medium text-white shadow-lg hover:from-zinc-400 hover:to-zinc-800"
              >
                Sign Up
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
