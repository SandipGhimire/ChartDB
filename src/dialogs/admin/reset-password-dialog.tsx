import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
import { useToast } from '@/components/toast/use-toast';
import { resetUserPassword, type AdminUser } from '@/lib/admin-api';

export interface ResetPasswordDialogProps {
    user: AdminUser | null;
    onOpenChange: (open: boolean) => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
    user,
    onOpenChange,
}) => {
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await resetUserPassword(user.id, password);
            toast({ title: `Password reset for ${user.email}` });
            setPassword('');
            onOpenChange(false);
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to reset password',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={!!user} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            Reset password for {user?.email}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5 py-4">
                        <Label htmlFor="reset-password">New password</Label>
                        <Input
                            id="reset-password"
                            type="password"
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                            Reset password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
