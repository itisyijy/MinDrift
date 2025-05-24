'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
  
    const response = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
  
    const data = await response.json()
  
    if (response.ok) {
      // 1. Save token & user to localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
  
      // 2. Redirect to chat page
      router.push("/chat")
    } else {
      alert(data.message || "Login failed")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center px-4">
      {/* Logo and Tagline */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <img src="/images/logo.png" alt="Mindrift Logo" className="w-28 h-auto" /> {/*logo image inserting */}
          </div>
        </div>
        <p className="text-blue-100 text-2xl font-extrabold tracking-wide">Reflect your mind daily</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-xl">
        <CardHeader className="text-center space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-white">Start your mindful journey</h2>
          <p className="text-sm text-slate-300">Sign in to continue your journey</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email" className="block text-sm text-slate-200 mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm text-slate-200 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Log in
              </Button>

              <Button
                type="button"
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78...z" />
                  <path fill="#34A853" d="M12 23c2.97...z" />
                  <path fill="#FBBC05" d="M5.84 14.09...z" />
                  <path fill="#EA4335" d="M12 5.38...z" />
                </svg>
                <img src="/images/google_logo.png" alt="Google Logo" className="w-5 h-5" />
                Continue with Google
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-300">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}