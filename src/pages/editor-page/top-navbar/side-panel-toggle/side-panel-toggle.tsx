import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useLayout } from '@/hooks/use-layout';

export interface SidePanelToggleProps {}

export const SidePanelToggle: React.FC<SidePanelToggleProps> = () => {
    const { t } = useTranslation();
    const { isSidePanelShowed, showSidePanel, hideSidePanel } = useLayout();

    const toggle = useCallback(() => {
        if (isSidePanelShowed) {
            hideSidePanel();
        } else {
            showSidePanel();
        }
    }, [isSidePanelShowed, showSidePanel, hideSidePanel]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={toggle}
                >
                    {isSidePanelShowed ? (
                        <PanelLeftClose className="size-4" />
                    ) : (
                        <PanelLeftOpen className="size-4" />
                    )}
                    <span className="sr-only">
                        {isSidePanelShowed
                            ? t('menu.view.hide_sidebar')
                            : t('menu.view.show_sidebar')}
                    </span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {isSidePanelShowed
                    ? t('menu.view.hide_sidebar')
                    : t('menu.view.show_sidebar')}
            </TooltipContent>
        </Tooltip>
    );
};
