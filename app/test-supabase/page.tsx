"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth-context";

export default function TestSupabasePage() {
    const { user } = useAuth();
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testConnection = async () => {
        setIsLoading(true);
        setTestResults([]);

        try {
            addResult("🔍 Testing Supabase connection...");

            // Test 1: Check if supabase client exists
            addResult(`✅ Supabase client exists: ${!!supabase}`);

            // Test 2: Check user authentication
            addResult(`👤 User authenticated: ${!!user} (ID: ${user?.id || 'none'})`);

            // Test 3: Try to select from chats table
            addResult("📊 Testing SELECT from chats table...");
            const { data: chatsData, error: chatsError } = await supabase
                .from('chats')
                .select('*')
                .limit(5);

            if (chatsError) {
                addResult(`❌ SELECT error: ${chatsError.message}`);
            } else {
                addResult(`✅ SELECT successful. Found ${chatsData?.length || 0} chats`);
            }

            // Test 4: Try to insert a test chat (if user is logged in)
            if (user) {
                addResult("📝 Testing INSERT into chats table...");
                const testChat = {
                    title: "Test Chat " + Date.now(),
                    description: "This is a test",
                    section_id: "relationships",
                    created_by: user.id
                };

                addResult(`Inserting: ${JSON.stringify(testChat)}`);

                const { data: insertData, error: insertError } = await supabase
                    .from('chats')
                    .insert([testChat])
                    .select()
                    .single();

                if (insertError) {
                    addResult(`❌ INSERT error: ${insertError.message}`);
                    addResult(`Error code: ${insertError.code}`);
                    addResult(`Error details: ${JSON.stringify(insertError.details)}`);
                    addResult(`Error hint: ${insertError.hint}`);
                } else {
                    addResult(`✅ INSERT successful! Chat ID: ${insertData?.id}`);

                    // Clean up - delete the test chat
                    await supabase.from('chats').delete().eq('id', insertData.id);
                    addResult(`🗑️ Test chat deleted`);
                }
            } else {
                addResult("⚠️ Skipping INSERT test - user not logged in");
            }

            // Test 5: Try to fetch Messages + Profiles (The issue user is facing)
            addResult("📨 Testing Message Fetch with Profile Join...");
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select(`
                    *,
                    profiles (nickname)
                `)
                .limit(5);

            if (msgError) {
                addResult(`❌ Message Fetch Error: ${msgError.message}`);
                addResult(`Details: ${JSON.stringify(msgError)}`);
            } else {
                addResult(`✅ Message Fetch Successful. Found ${msgData?.length} messages.`);
                if (msgData && msgData.length > 0) {
                    addResult(`Sample Message: ${JSON.stringify(msgData[0])}`);
                    if (!msgData[0].profiles) {
                        addResult("⚠️ WARNING: 'profiles' is null on the message. Check Profiles RLS or Foreign Key.");
                    } else {
                        addResult(`✅ Profile data found: ${JSON.stringify(msgData[0].profiles)}`);
                    }
                } else {
                    addResult("ℹ️ No messages found in DB to test join (create one first).");
                }
            }


        } catch (err: any) {
            addResult(`💥 Unexpected error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

                <button
                    onClick={testConnection}
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 mb-6"
                >
                    {isLoading ? "Testing..." : "Run Tests"}
                </button>

                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
                    {testResults.length === 0 ? (
                        <p className="text-muted-foreground">Click "Run Tests" to start</p>
                    ) : (
                        <div className="space-y-2 font-mono text-sm">
                            {testResults.map((result, index) => (
                                <div key={index} className="p-2 bg-secondary/50 rounded">
                                    {result}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
