"use client";

import { Button } from "@/components/ui/button";
import {
    DoorOpen,
    MessageCircleQuestion,
    ShieldCheck,
    Mail,
    Phone,
    Lightbulb,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const FAQ_ITEMS = [
    {
        question: "Is Masked Minds truly anonymous?",
        answer: "Yes. Your identity is hidden behind your chosen nickname. To protect the community, we use automated systems to monitor behavior, but we never reveal who flagged you or who you flagged."
    },
    {
        question: "How do I report a user?",
        answer: "Click the flag icon next to a user's nickname in the chat. You'll be asked to provide a reason. Reports are only valid if you were active in the chat, preventing 'mob-flagging' or coordinated abuse."
    },
    {
        question: "What are the consequences of being flagged?",
        answer: "Our system is fully automated. 3 valid flags trigger a Warning. 5 valid flags result in a 72-hour Suspension. If you are suspended 3 times within a year, your account will be permanently Banned."
    },
    {
        question: "How do flags expire?",
        answer: "Every flag is temporary and automatically expires after 30 days. This means past mistakes doesn't permanently affect your account unless you repeatedly violate guidelines."
    }
];

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <DoorOpen className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="font-bold text-lg">Help & Support</h1>
            </header>

            <main className="max-w-2xl mx-auto p-6 space-y-10">
                {/* FAQ Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <MessageCircleQuestion className="w-5 h-5" />
                        <h2>Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-2">
                        {FAQ_ITEMS.map((item, index) => (
                            <div key={index} className="border border-border rounded-xl overflow-hidden bg-card">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                                >
                                    <span className="font-medium text-sm">{item.question}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 pt-0 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-1">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Safety section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-accent font-semibold">
                        <ShieldCheck className="w-5 h-5" />
                        <h2>Community Guidelines & Safety</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                            <h3 className="text-sm font-bold">Standard Rules</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Be respectful and kind to others.</li>
                                <li>No hate speech, harassment, or bullying.</li>
                                <li>Do not share personal identifying information.</li>
                                <li>Avoid spamming or promoting fraudulent content.</li>
                            </ul>
                        </div>
                        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Automated Enforcement</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-card p-3 rounded-lg border border-border">
                                    <div className="text-xs font-bold text-yellow-500">Warning</div>
                                    <div className="text-[10px] text-muted-foreground">3 Valid Flags</div>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                    <div className="text-xs font-bold text-destructive">Suspension</div>
                                    <div className="text-[10px] text-muted-foreground">5 Valid Flags (72h)</div>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border">
                                    <div className="text-xs font-bold text-destructive">Ban</div>
                                    <div className="text-[10px] text-muted-foreground">3 Suspensions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reach Out Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold">
                        <Mail className="w-5 h-5" />
                        <h2>Reach Out to Us</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
                            <Phone className="w-6 h-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">Call Us</span>
                            <a href="tel:0240152026" className="font-bold hover:text-primary transition-colors">0240152026</a>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
                            <Mail className="w-6 h-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">Email Us</span>
                            <a href="mailto:maskedminds26@gmail.com" className="font-bold hover:text-primary transition-colors break-all">maskedminds26@gmail.com</a>
                        </div>
                    </div>
                </section>

                {/* Questions & Suggestions Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                        <Lightbulb className="w-5 h-5" />
                        <h2>Questions & Suggestions</h2>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 text-center space-y-4 shadow-md">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Have a question, idea, or want to contribute to the project? We value our community's input in making Masked Minds safer and better. Ask us anything or share your suggestions!
                        </p>
                        <textarea
                            placeholder="Ask a question or share your suggestions and ideas..."
                            className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            id="suggestion-text"
                        />
                        <Button
                            className="w-full h-12 rounded-xl shadow-lg ring-offset-background hover:scale-[1.02] transition-transform"
                            onClick={() => {
                                const text = (document.getElementById('suggestion-text') as HTMLTextAreaElement)?.value || '';
                                window.location.href = `mailto:maskedminds26@gmail.com?subject=Masked Minds Question/Suggestion&body=${encodeURIComponent(text)}`;
                            }}
                        >
                            Send Message
                        </Button>
                    </div>
                </section>

                <footer className="text-center text-xs text-muted-foreground py-10 opacity-50">
                    &copy; 2026 Masked Minds. Built for safe expression.
                </footer>
            </main>
        </div>
    );
}
