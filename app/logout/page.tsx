'use client'
import { useAuth } from "@/components/auth-provider";
import { toast } from "@/components/ui/use-toast";
import { auth } from "@/lib/db";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogOut() {
    const { user, setUser } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (user != null) {
            const LogOut = signOut(auth).then(() => {
                toast({
                    title: "Bye," + user.email,
                    description: "See you soon",
                });
                setUser(null);
            })
        }
        router.push('/');
    }, [user]);
    return (
        <>
        </>
    )
} 