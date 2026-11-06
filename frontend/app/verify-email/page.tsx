'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { verifyEmail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
    const router = useRouter();
    const verificationStarted = useRef(false);

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (verificationStarted.current) return;
        verificationStarted.current = true;

        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
            setStatus("error");
            setMessage("Verification link is invalid or incomplete.");
            return;
        }

        async function verifyAndSignIn() {
            try {
                // Step 1: Verify email and receive temporary authentication ticket.
                const verificationResponse = await verifyEmail(token!);

                if (!verificationResponse.success || !verificationResponse.ticket) {
                    throw new Error("Email verification failed.");
                }

                setMessage("Email verified. Signing you in...");

                // Step 2: Exchange the ticket through NextAuth Credentials.
                const result = await signIn("credentials", {
                    ticket: verificationResponse.ticket,
                    redirect: false,
                });

                if (!result || result.error) {
                    throw new Error("Email verified, but automatic sign-in failed. Please sign in manually.");
                }

                // Step 3: Establish authenticated navigation.
                setStatus("success");
                setMessage("Email verified successfully. Redirecting to your jobs...");

                router.replace("/jobs");
                router.refresh();

            } catch (error) {
                console.error("Verification Error:", error);

                setStatus("error");
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Email verification failed."
                );
            }
        }

        verifyAndSignIn();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {status === "loading"
                            ? "Verifying Email"
                            : status === "success"
                                ? "Email Verified"
                                : "Verification Failed"}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>

                <CardContent>
                    {status === "loading" && (
                        <p className="text-sm text-muted-foreground">
                            Please wait while we verify your email address.
                        </p>
                    )}
                </CardContent>

                {status !== "loading" && status === "error" && (
                    <CardFooter>
                        <Button asChild className="w-full">
                            <a href="/login">Go to Sign In</a>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}