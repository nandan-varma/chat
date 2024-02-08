import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";

/* Core */
// import { Provider } from "react-redux";

/* Instruments */
// import { reduxStore } from "@/lib/redux";

// export const Providers = (props: React.PropsWithChildren) => {
//   return <Provider store={reduxStore}>{props.children}</Provider>;
// };

export default function Providers({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <>
            {/* <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
            > */}
                <AuthProvider>
                    {children}
                </AuthProvider>
                <Toaster/>
            {/* </ThemeProvider> */}
        </>
    )
}