'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/db"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export default function Account() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const router = useRouter();
  const {setUser} = useAuth();

  async function onLogin(data: z.infer<typeof FormSchema>) {
    try {
      const Login = await signInWithEmailAndPassword(auth,data.email, data.password)
      setUser(Login.user);
      // Redirect to home page or dashboard
    } catch (error) {
      console.error(error)
      // Handle error
    } finally {
        router.push('/');
    }
  }

  async function onSignUp(data: z.infer<typeof FormSchema>) {
    try {
      const SignIn = await createUserWithEmailAndPassword(auth,data.email, data.password)
      setUser(SignIn.user);
      // Redirect to home page or dashboard
    } catch (error) {
      console.error(error)
      // Handle error
    } finally {
        router.push('/');
    }
  }

  return (
    <Tabs defaultValue="login" className="mt-10 w-[400px] mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Login to your account here.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Login</Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create a new account here.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Sign Up</Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
