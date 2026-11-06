'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();

        if (name.split(/\s+/).length < 2) {
            setError("Please enter your full name.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await registerUser(email, formData.password, name);

            if (!result.success) {
                setError("Registration failed. Please try again.");
                return;
            }

            setRegisteredEmail(email);
            setSuccess(true);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {success ? "Check your email" : "Create an account"}
                    </CardTitle>
                    <CardDescription>
                        {success
                            ? `A verification link has been sent to ${registeredEmail}.`
                            : "Create your JobLens account to discover remote opportunities."}
                    </CardDescription>
                </CardHeader>

                {success ? (
                    <>
                        <CardContent className="text-sm text-muted-foreground">
                            Verify your email within 15 minutes to activate your account. Check your Spam folder if you don't see the email.
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/login">Go to Sign In</Link>
                            </Button>
                        </CardFooter>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            {([
                                ["name", "Full Name", "text"],
                                ["email", "Email", "email"],
                                ["password", "Password", "password"],
                                ["confirmPassword", "Confirm Password", "password"],
                            ] as const).map(([name, label, type]) => (
                                <div key={name} className="space-y-2">
                                    <Label htmlFor={name}>{label}</Label>
                                    <Input
                                        id={name}
                                        name={name}
                                        type={type}
                                        required
                                        value={formData[name]}
                                        onChange={(e) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                [name]: e.target.value,
                                            }))
                                        }
                                        disabled={isLoading}
                                    />
                                </div>
                            ))}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating account..." : "Create Account"}
                            </Button>

                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}