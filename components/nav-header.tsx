"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function NavHeader() {
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState<"admin" | "user">("user")
  const [fullName, setFullName] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/verify", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.username) {
          setUsername(data.username)
          setUserRole(data.role || "user")
          setFullName(data.fullName || data.username)
        }
      })
      .catch((error) => {
        console.error("[v0] Failed to fetch user data:", error)
      })
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
      router.push("/")
      router.refresh()
    }
  }

  return (
    <header className="border-b border-border bg-card gradient-bg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <Image src="/logo.jpg" alt="Liana" width={100} height={33} priority />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {fullName || "Завантаження..."} ({userRole === "admin" ? "Адмін" : "Користувач"})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Налаштування профілю</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Вийти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <nav className="flex gap-1">
            <Link href="/home">
              <Button variant={pathname === "/home" ? "secondary" : "ghost"} size="sm">
                Головна
              </Button>
            </Link>
            <Link href="/objects">
              <Button
                variant={pathname === "/objects" || pathname?.startsWith("/objects/") ? "secondary" : "ghost"}
                size="sm"
              >
                Об'єкти
              </Button>
            </Link>
            <Link href="/clients">
              <Button
                variant={pathname === "/clients" || pathname?.startsWith("/clients/") ? "secondary" : "ghost"}
                size="sm"
              >
                Клієнти
              </Button>
            </Link>
            <Link href="/showings">
              <Button variant={pathname === "/showings" ? "secondary" : "ghost"} size="sm">
                Покази
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
