"use client";

import type React from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

// Define base URL for API endpoints
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function LoginPage() {
  const router = useRouter();
  const [user_id, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(BASE_URL);
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          password,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        alert("❌ Login Failed: " + errText);
        return;
      }

      const data = await response.json();
      console.log("✅ Login Success:", data);

      localStorage.setItem("jwt", data.token);
      localStorage.setItem("username", data.username);
      console.log("username from login:", data.username);

      router.push("/chat");
    } catch (error) {
      console.error("❌ Fail Login Request:", error);
      alert("Cannot access to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center px-4">
      {/* Logo and Tagline */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <img
              src="../images/logo.png"
              alt="Mindrift Logo"
              className="w-28 h-auto"
            />
          </div>
        </div>
        <p className="text-blue-100 text-2xl font-extrabold tracking-wide">
          Reflect your mind daily
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-xl">
        <CardHeader className="text-center space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-white">
            Start your mindful journey
          </h2>
          <p className="text-sm text-slate-300">
            Sign in to continue your journey
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label
                htmlFor="username"
                className="block text-sm text-slate-200 mb-2"
              >
                ID
              </Label>
              <Input
                id="username"
                type="text"
                value={user_id}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your ID"
                className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm text-slate-200 mb-2"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-300">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
