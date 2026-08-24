import React, { useEffect, useState } from 'react';
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
import {
    updateDiagramAsAdmin,
    type AdminDiagram,
} from '@/lib/admin-diagrams-api';

export interface RenameDiagramDialogProps {
    diagram: AdminDiagram | null;
    onOpenChange: (open: boolean) => void;
    onRenamed: () => void;
}

export const RenameDiagramDialog: React.FC<RenameDiagramDialogProps> = ({
    diagram,
    onOpenChange,
    onRenamed,
}) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (diagram) {
            setName(diagram.name);
        }
    }, [diagram]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!diagram) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        setSubmitting(true);
        try {
            await updateDiagramAsAdmin(diagram.id, { name: trimmed });
            toast({ title: 'Diagram renamed' });
            onOpenChange(false);
            onRenamed();
        } catch (error) {
            toast({
                title:
                    error instanceof Error
                        ? error.message
                        : 'Failed to rename diagram',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={!!diagram} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rename diagram</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="rename-diagram-name">Name</Label>
                            <Input
                                id="rename-diagram-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={submitting || !name.trim()}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
