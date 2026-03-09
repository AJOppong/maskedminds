import Link from "next/link";
import { DoorOpen } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-[400px] space-y-8 animate-fade-in">
                <div className="space-y-2 text-center">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors absolute top-8 left-8">
                        <DoorOpen className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                {children}
            </div>
        </div>
    );
}
