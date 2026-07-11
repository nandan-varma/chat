'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'

const authSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type AuthValues = z.infer<typeof authSchema>

export function AuthForm() {
  const { signIn, signUp, loading, clearError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    clearError()
    form.reset()
  }

  async function onSubmit(data: AuthValues) {
    clearError()
    try {
      if (mode === 'signin') {
        await signIn(data.email, data.password)
      } else {
        await signUp(data.email, data.password)
      }
    } catch {
      // Error handled by auth provider via toast
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        <button
          type="button"
          onClick={() => handleModeSwitch('signin')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            mode === 'signin'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('signup')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Create account
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
