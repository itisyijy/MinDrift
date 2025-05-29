'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [userid, setUserid] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
  
    setError("")
  
    const response = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        user_id: userid,
        password,
      }),
    })
  
    const data = await response.json()
  
    if (response.ok) {
      router.push("/login")
    } else {
      setError(data.message || "Sign up failed")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center px-4">
      {/* Logo and Tagline */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <Image src="/images/logo.png" alt="Mindrift Logo" width={112} height={112} />
          </div>
        </div>
        <p className="text-blue-100 text-2xl font-extrabold tracking-wide">Reflect your mind daily</p>
      </div>

      {/* SignUp Card */}
      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-xl">
        <CardHeader className="text-center space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-white">Start your mindful journey</h2>
          <p className="text-sm text-slate-300">Create an account to begin your journey</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="username" className="block text-sm text-slate-200 mb-2">
                User Name
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="bg-slate-700/50 border border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="userid" className="block text-sm text-slate-200 mb-2">
                User ID
              </Label>
              <Input
                id="userid"
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="Choose a user ID"
                className="bg-slate-700/50 border border-slate-600 text-white"
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
                className="bg-slate-700/50 border border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm text-slate-200 mb-2">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="bg-slate-700/50 border border-slate-600 text-white"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Sign up
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-300">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
