'use client'

import LoginForm from '@/components/loginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center px-4">
      <LoginForm />
    </div>
  )
}