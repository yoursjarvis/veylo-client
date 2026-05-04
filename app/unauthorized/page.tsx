import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string | string[] }
}) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string"
      ? searchParams.callbackUrl
      : "/dashboard"

  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Unauthorized</CardTitle>
          <CardDescription>
            You need to sign in before you can open this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>If you already have access, sign in again and we&apos;ll send you back.</p>
          <p className="break-all">Destination: {callbackUrl}</p>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button className="flex-1" render={<Link href={loginHref} />}>
            Go to Login
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/" />}>
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
