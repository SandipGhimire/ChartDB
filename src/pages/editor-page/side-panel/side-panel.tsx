import React, { useCallback, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { Button } from '@/components/button/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useToast } from '@/components/toast/use-toast';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TablesSection } from './tables-section/tables-section';
import { useLayout } from '@/hooks/use-layout';
import type { SidebarSection } from '@/context/layout-context/layout-context';
import { useTranslation } from 'react-i18next';
import { useChartDB } from '@/hooks/use-chartdb';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { CustomTypesSection } from './custom-types-section/custom-types-section';
import { supportsCustomTypes } from '@/lib/domain/database-capabilities';
import { DBMLSection } from './dbml-section/dbml-section';
import { RefsSection } from './refs-section/refs-section';
import { VisualsSection } from './visuals-section/visuals-section';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const { t } = useTranslation();
    const { databaseType, diagramId, loadDiagram } = useChartDB();
    const { selectSidebarSection, selectedSidebarSection } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        if (!diagramId || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await loadDiagram(diagramId);
            toast({ title: t('side_panel.refreshed') });
        } catch {
            toast({
                title: t('side_panel.refresh_diagram'),
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [diagramId, loadDiagram, isRefreshing, toast, t]);

    return (
        <aside className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-end border-b px-1 py-0.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw
                                className={cn(
                                    'size-3.5',
                                    isRefreshing && 'animate-spin'
                                )}
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('side_panel.refresh_diagram')}
                    </TooltipContent>
                </Tooltip>
            </div>
            {!isDesktop ? (
                <div className="flex justify-center border-b pt-0.5">
                    <Select
                        value={selectedSidebarSection}
                        onValueChange={(value) =>
                            selectSidebarSection(value as SidebarSection)
                        }
                    >
                        <SelectTrigger className="rounded-none border-none font-semibold shadow-none hover:bg-secondary hover:underline focus:border-transparent focus:ring-0">
                            <SelectValue />
                            <div className="flex flex-1 justify-end px-2 text-xs font-normal text-muted-foreground">
                                {t('side_panel.view_all_options')}
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="tables">
                                    {t('side_panel.tables_section.tables')}
                                </SelectItem>
                                <SelectItem value="refs">
                                    {t('side_panel.refs_section.refs')}
                                </SelectItem>
                                <SelectItem value="areas">
                                    {t('side_panel.areas_section.areas')}
                                </SelectItem>
                                <SelectItem value="visuals">
                                    {t('side_panel.visuals_section.visuals')}
                                </SelectItem>
                                {supportsCustomTypes(databaseType) ? (
                                    <SelectItem value="customTypes">
                                        {t(
                                            'side_panel.custom_types_section.custom_types'
                                        )}
                                    </SelectItem>
                                ) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            ) : null}
            {selectedSidebarSection === 'tables' ? (
                <TablesSection />
            ) : selectedSidebarSection === 'dbml' ? (
                <DBMLSection />
            ) : selectedSidebarSection === 'refs' ? (
                <RefsSection />
            ) : selectedSidebarSection === 'visuals' ? (
                <VisualsSection />
            ) : (
                <CustomTypesSection />
            )}
        </aside>
    );
};
