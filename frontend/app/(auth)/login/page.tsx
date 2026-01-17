'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { useFinancialStore } from '../../../store/useFinancialStore'; // Adjust path if needed

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network request
        setTimeout(() => {
            setIsLoading(false);
            // In a real app, we'd validate and get a token. 
            // Here, we just redirect to the dashboard.
            router.push('/app/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FinPlan.AI</h1>
                    <p className="text-sm text-gray-500 mt-2">Welcome back to your financial future</p>
                </div>

                <Card className="border-gray-200 shadow-xl shadow-blue-500/5">
                    <CardHeader>
                        <CardTitle className="text-xl">Sign In</CardTitle>
                        <CardDescription>Enter your email to access your dashboard</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="h-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="h-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full h-10 text-base shadow-blue-500/20 shadow-lg" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                            <div className="text-center text-sm text-gray-500">
                                Don't have an account? <Link href="/register" className="text-blue-600 font-medium hover:underline">Sign up</Link>
                            </div>

                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
                            </div>

                            <Button variant="outline" type="button" className="w-full" onClick={() => router.push('/app/dashboard')}>
                                <PlayCircle className="mr-2 h-4 w-4 text-green-600" /> Demo Mode (Skip Login)
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
