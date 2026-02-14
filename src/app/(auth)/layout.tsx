export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {children}
            </div>
        </div>
    )
}
