import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/dropdown-menu/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/button/button-variants';
import { useTheme } from '@/hooks/use-theme';
import type { Theme } from '@/lib/types';

export interface ThemeNavProps {}

const ThemeIcon = ({ effectiveTheme }: { effectiveTheme: 'light' | 'dark' }) =>
    effectiveTheme === 'dark' ? (
        <Moon className="size-3.5 md:size-4" />
    ) : (
        <Sun className="size-3.5 md:size-4" />
    );

export const ThemeNav: React.FC<ThemeNavProps> = () => {
    const { t } = useTranslation();
    const { theme, setTheme, effectiveTheme } = useTheme();

    const options: {
        value: Theme;
        label: string;
        icon: React.FC<{ className?: string }>;
    }[] = [
        { value: 'system', label: t('theme.system'), icon: Monitor },
        { value: 'light', label: t('theme.light'), icon: Sun },
        { value: 'dark', label: t('theme.dark'), icon: Moon },
    ];

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <div
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'icon',
                                }),
                                'size-6 rounded-full md:size-8 cursor-pointer'
                            )}
                        >
                            <ThemeIcon effectiveTheme={effectiveTheme} />
                            <span className="sr-only">
                                {t('menu.view.theme')}
                            </span>
                        </div>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('menu.view.theme')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-40">
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={theme === option.value}
                        onClick={() => setTheme(option.value)}
                    >
                        <option.icon className="mr-2 size-4" />
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
