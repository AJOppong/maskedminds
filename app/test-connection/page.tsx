"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function TestConnectionPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const log = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);
        console.log(`[Diagnostic] ${msg}`);
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setLogs([]);
        log("Starting diagnostics...");

        try {
            // 1. Environment Check
            log("1. Checking Environment...");
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!url) log("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing");
            else log(`✅ Supabase URL found: ${url.substring(0, 15)}...`);

            if (!key) log("❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
            else log(`✅ Anon Key found: ${key.substring(0, 5)}...`);

            // 2. Auth Check
            log("2. Checking Session...");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                log(`❌ Auth Error: ${sessionError.message}`);
            } else if (!session) {
                log("⚠️ No active session. Some tests may fail due to RLS.");
            } else {
                log(`✅ User logged in: ${session.user.email} (${session.user.id})`);
            }

            // 3. Read Test (Public access check)
            log("3. Testing Read Access (Fetch Chats)...");
            const readPromise = supabase.from('chats').select('count', { count: 'exact', head: true });

            // Add timeout for read
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Read timeout (5s)")), 5000)
            );

            try {
                const { count, error: readError } = await Promise.race([readPromise, timeoutPromise]) as any;

                if (readError) {
                    log(`❌ Read Error: ${readError.message} (Code: ${readError.code})`);
                } else {
                    log(`✅ Read successful. Total chats detected: ${count}`);
                }
            } catch (err: any) {
                log(`❌ Read Critical Failure: ${err.message}`);
            }

            // 4. Write Test (If logged in)
            if (session) {
                log("4. Testing Write Access (Insert Chat)...");
                const testChat = {
                    title: "Diagnostic Test Chat",
                    description: "Temporary chat to test write permissions",
                    section_id: "test",
                    created_by: session.user.id
                };

                const writePromise = supabase.from('chats').insert([testChat]).select().single();
                const writeTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Write timeout (10s)")), 10000)
                );

                try {
                    const { data, error: writeError } = await Promise.race([writePromise, writeTimeout]) as any;

                    if (writeError) {
                        log(`❌ Write Error: ${writeError.message} (Code: ${writeError.code})`);
                        log(`ℹ️ Hint: ${writeError.hint || 'No hint provided'}`);
                    } else {
                        log(`✅ Write successful! Created Chat ID: ${data.id}`);
                        // Cleanup
                        log("5. Cleaning up test chat...");
                        await supabase.from('chats').delete().eq('id', data.id);
                        log("✅ Cleanup done.");
                    }
                } catch (err: any) {
                    log(`❌ Write Critical Failure: ${err.message}`);
                }
            } else {
                log("Skipping Write Test (User not logged in)");
            }

        } catch (globalErr: any) {
            log(`❌ UNEXPECTED CRASH: ${globalErr.message}`);
        } finally {
            log("Diagnostics finished.");
            setIsRunning(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6 text-white bg-black min-h-screen font-mono">
            <h1 className="text-2xl font-bold border-b border-gray-700 pb-2">Supabase Connectivity Diagnostics</h1>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <p className="text-gray-400 mb-4">
                    Run this test to identify why database requests are timing out.
                </p>
                <Button
                    onClick={runDiagnostics}
                    disabled={isRunning}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                    {isRunning ? "Running Tests..." : "Run Diagnostics"}
                </Button>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-300">Logs:</h2>
                <div className="bg-black border border-gray-800 p-4 rounded h-96 overflow-y-auto font-mono text-sm leading-relaxed">
                    {logs.length === 0 ? (
                        <span className="text-gray-600">Waiting to start...</span>
                    ) : (
                        logs.map((L, i) => (
                            <div key={i} className={L.includes("ERROR") || L.includes("❌") ? "text-red-400" : L.includes("✅") ? "text-green-400" : "text-gray-300"}>
                                {L}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
