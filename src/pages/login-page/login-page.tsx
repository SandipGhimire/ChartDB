import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
import { Spinner } from '@/components/spinner/spinner';

const LoginPageComponent: React.FC = () => {
    const { login, status } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            const from =
                (location.state as { from?: { pathname: string } } | null)?.from
                    ?.pathname ?? '/';
            navigate(from, { replace: true });
        }
    }, [status, navigate, location.state]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(undefined);
        setSubmitting(true);
        const result = await login(email, password);
        setSubmitting(false);
        if (!result.success) {
            setError(result.error ?? 'Login failed');
        }
    };

    return (
        <>
            <Helmet>
                <title>Sign in</title>
            </Helmet>
            <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your diagrams.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            {error ? (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            ) : null}
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <Spinner size="small" />
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export const LoginPage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <LoginPageComponent />
        </ThemeProvider>
    </LocalConfigProvider>
);
