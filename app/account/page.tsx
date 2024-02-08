'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/db"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"
import Link from "next/link"

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
    // const router = useRouter();
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    async function onLogin(data: z.infer<typeof FormSchema>) {
        try {
            signInWithEmailAndPassword(auth, data.email, data.password).then((userCred) => {
                setUser(userCred.user);
                toast({
                    title: "Welcome Back," + userCred.user.email,
                    description: "Good to have you back",
                });
                router.push('/');
            }).catch((err) => {
                console.error(err);
                toast({
                    title: err.code,
                    description: err.message,
                });
            })
            // Redirect to home page or dashboard
        } catch (error) {
            console.error(error);
            toast({
                title: "Something went wrong",
                description: "Please try again at a later time",
            });
            // Handle error
        } finally {

        }
    }

    async function onSignUp(data: z.infer<typeof FormSchema>) {
        try {
            createUserWithEmailAndPassword(auth, data.email, data.password).then((userCred) => {
                setUser(userCred.user);
                toast({
                    title: "Welcome to Chats," + userCred.user.email,
                    description: "Hope you find this interesting",
                });
                router.push('/');
            }).catch((err) => {
                console.error(err);
                toast({
                    title: err.code,
                    description: err.message,
                });
                // Handle error
            })
            // Redirect to home page or dashboard
        } catch (error) {
            console.error(error);
            toast({
                title: "Something went wrong",
                description: "Please try again at a later time",
            });
            // Handle error
        } finally {
            // router.push('/');
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
                            {user === null ? "Login to your account here." :
                                "You are currently logged in as " + user.email}
                            {user !== null && <Link href={'/logout'} className="text-primary"> logout ?</Link>}
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
                            {user === null ? "Login to your account here." :
                                "You are currently logged in as " + user.email}
                            {user !== null && <Link href={'/logout'} className="text-primary"> logout ?</Link>}
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
