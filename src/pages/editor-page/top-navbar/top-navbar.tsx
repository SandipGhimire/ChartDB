import React from 'react';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { ThemeNav } from './theme-nav/theme-nav';
import { Menu } from './menu/menu';
import { UserMenu } from './user-menu/user-menu';
import { SidePanelToggle } from './side-panel-toggle/side-panel-toggle';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    return (
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="hidden items-center md:flex">
                    <SidePanelToggle />
                </div>
                <Menu />
            </div>
            <DiagramName />
            <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                <LastSaved />
                <ThemeNav />
                <LanguageNav />
                <UserMenu />
            </div>
        </nav>
    );
};
