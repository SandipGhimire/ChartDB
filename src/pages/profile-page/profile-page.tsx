import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { Toaster } from '@/components/toast/toaster';
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
import { Badge } from '@/components/badge/badge';
import { Separator } from '@/components/separator/separator';
import { useToast } from '@/components/toast/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ThemeNav } from '@/pages/editor-page/top-navbar/theme-nav/theme-nav';
import { updateProfile, changePassword } from '@/lib/profile-api';

const ProfileDetailsCard: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name ?? '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || !user) return;
        setSubmitting(true);
        try {
            const { user: updated } = await updateProfile(trimmed);
            updateUser(updated);
            toast({ title: 'Profile updated' });
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update profile',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                            id="profile-email"
                            value={user?.email ?? ''}
                            disabled
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="profile-name">Name</Label>
                        <Input
                            id="profile-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Role
                        </span>
                        <Badge
                            variant={
                                user?.role === 'ADMIN' ? 'default' : 'secondary'
                            }
                        >
                            {user?.role === 'ADMIN' ? 'Admin' : 'User'}
                        </Badge>
                    </div>
                    <div>
                        <Button
                            type="submit"
                            disabled={
                                submitting ||
                                !name.trim() ||
                                name.trim() === user?.name
                            }
                        >
                            Save changes
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

const ChangePasswordCard: React.FC = () => {
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const mismatch =
        confirmPassword.length > 0 && newPassword !== confirmPassword;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (mismatch || newPassword.length < 8) return;
        setSubmitting(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast({ title: 'Password changed' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to change password',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                    Signing in on other devices will require the new password;
                    this session stays signed in.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="current-password">
                            Current password
                        </Label>
                        <Input
                            id="current-password"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={submitting}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="new-password">New password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={submitting}
                            minLength={8}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirm-password">
                            Confirm new password
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={submitting}
                            required
                        />
                        {mismatch ? (
                            <p className="text-sm text-destructive">
                                Passwords don&apos;t match.
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <Button
                            type="submit"
                            disabled={
                                submitting ||
                                mismatch ||
                                newPassword.length < 8 ||
                                !currentPassword
                            }
                        >
                            Update password
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

const ProfilePageComponent: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Profile</title>
            </Helmet>
            <div className="flex h-screen w-screen flex-col overflow-auto bg-background">
                <nav className="flex h-12 shrink-0 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="font-semibold">Profile</span>
                    </div>
                    <ThemeNav />
                </nav>
                <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
                    <ProfileDetailsCard />
                    <ChangePasswordCard />
                </div>
            </div>
            <Toaster />
        </>
    );
};

export const ProfilePage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <ProfilePageComponent />
        </ThemeProvider>
    </LocalConfigProvider>
);
