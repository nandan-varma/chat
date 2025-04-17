import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <>
            <AuthProvider>
                {children}
            </AuthProvider>
            <Toaster />
        </>
    )
}