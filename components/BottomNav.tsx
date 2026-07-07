import React from 'react';
import { Tab } from '../types';
import { LayoutGrid, Heart, BarChart3, Users } from 'lucide-react';

interface BottomNavProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const TABS = [
    { tab: Tab.TILES, icon: LayoutGrid, label: 'Collection' },
    { tab: Tab.WISHLIST, icon: Heart, label: 'Wishlist' },
    { tab: Tab.STATS, icon: BarChart3, label: 'Stats' },
    { tab: Tab.EXPLORE, icon: Users, label: 'Friends' },
] as const;

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => (
    <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#5e3f28] border-t-2 border-[#3e2b1c] px-1.5 pt-2 flex justify-around"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
        {TABS.map(({ tab, icon: Icon, label }) => {
            const active = activeTab === tab;
            return (
                <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center gap-[3px] px-2 py-1 rounded-lg transition-all duration-150 ${
                        active
                            ? 'text-[#FDF6E3] bg-[rgba(210,105,30,0.9)]'
                            : 'text-[rgba(253,246,227,0.5)]'
                    }`}
                >
                    <Icon size={22} />
                    <span className="text-[10px] font-bold">{label}</span>
                </button>
            );
        })}
    </nav>
);

export default BottomNav;
