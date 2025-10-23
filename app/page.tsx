import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifySession } from "@/lib/auth"

export default async function HomePage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await verifySession(token)
      redirect("/dashboard")
    } catch {
      redirect("/login")
    }
  } else {
    redirect("/login")
  }
}
