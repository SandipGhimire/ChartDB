import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/select/select';
import { Badge } from '@/components/badge/badge';
import { useToast } from '@/components/toast/use-toast';
import { X } from 'lucide-react';
import {
    listDiagramMembers,
    addDiagramMember,
    updateDiagramMemberRole,
    removeDiagramMember,
    type DiagramMember,
    type DiagramMemberRole,
} from '@/lib/diagram-members-api';

export interface ShareDiagramDialogProps {
    diagramId?: string;
    onOpenChange: (open: boolean) => void;
}

export const ShareDiagramDialog: React.FC<ShareDiagramDialogProps> = ({
    diagramId,
    onOpenChange,
}) => {
    const { toast } = useToast();
    const [members, setMembers] = useState<DiagramMember[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<DiagramMemberRole>('EDITOR');
    const [submitting, setSubmitting] = useState(false);

    const refresh = useCallback(async () => {
        if (!diagramId) return;
        try {
            const { members } = await listDiagramMembers(diagramId);
            setMembers(members);
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to load members',
                variant: 'destructive',
            });
        }
    }, [diagramId, toast]);

    useEffect(() => {
        if (diagramId) {
            refresh();
        }
    }, [diagramId, refresh]);

    const handleAdd = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!diagramId) return;
        setSubmitting(true);
        try {
            await addDiagramMember(diagramId, email, role);
            setEmail('');
            refresh();
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to add member',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRoleChange = async (
        userId: string,
        newRole: DiagramMemberRole
    ) => {
        if (!diagramId) return;
        try {
            await updateDiagramMemberRole(diagramId, userId, newRole);
            refresh();
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update role',
                variant: 'destructive',
            });
        }
    };

    const handleRemove = async (userId: string) => {
        if (!diagramId) return;
        try {
            await removeDiagramMember(diagramId, userId);
            refresh();
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to remove member',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={!!diagramId} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share diagram</DialogTitle>
                    <DialogDescription>
                        Invite people by email and choose what they can do.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAdd} className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <Label htmlFor="share-email">Email</Label>
                        <Input
                            id="share-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Select
                        value={role}
                        onValueChange={(value) =>
                            setRole(value as DiagramMemberRole)
                        }
                    >
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="OWNER">Owner</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" disabled={submitting}>
                        Add
                    </Button>
                </form>

                <div className="flex flex-col gap-2 py-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-sm">
                                    {member.user.email}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {member.role === 'OWNER' ? (
                                    <Badge variant="default">Owner</Badge>
                                ) : (
                                    <Select
                                        value={member.role}
                                        onValueChange={(value) =>
                                            handleRoleChange(
                                                member.userId,
                                                value as DiagramMemberRole
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-7 w-24 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="VIEWER">
                                                Viewer
                                            </SelectItem>
                                            <SelectItem value="EDITOR">
                                                Editor
                                            </SelectItem>
                                            <SelectItem value="OWNER">
                                                Owner
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => handleRemove(member.userId)}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
