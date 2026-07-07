import React from 'react';
import { Tab, User } from '../types';
import { avatarUri } from '../services/avatar';
import { LayoutGrid, BarChart3, Heart, Users, LogIn } from 'lucide-react';

interface HeaderProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isLoggedIn: boolean;
    currentUser: User | null;
    onOpenSettings: () => void;
    onLoginClick: () => void;
}

const NAV = [
    { tab: Tab.TILES, icon: LayoutGrid, label: 'Collection' },
    { tab: Tab.WISHLIST, icon: Heart, label: 'Wishlist' },
    { tab: Tab.STATS, icon: BarChart3, label: 'Stats' },
    { tab: Tab.EXPLORE, icon: Users, label: 'Friends' },
] as const;

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isLoggedIn, currentUser, onOpenSettings, onLoginClick }) => {
    return (
        <header className="sticky top-0 z-50 bg-[#8B5E3C] text-[#FDF6E3] shadow-lg border-b-4 border-[#5e3f28]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="w-12 h-12 bg-black rounded-full border-2 border-[#333] flex items-center justify-center animate-spin-slow shadow-[0_4px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <div className="absolute inset-1 rounded-full border border-white/5"></div>
                                <div className="absolute inset-2 rounded-full border border-white/5"></div>
                                <div className="absolute inset-3 rounded-full border border-white/5"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
                                <div className="w-5 h-5 rounded-full bg-[#D2691E] border border-black/30 flex items-center justify-center z-10">
                                    <div className="w-1 h-1 bg-white/60 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.8)]"></div>
                                </div>
                            </div>
                            <div className="absolute -inset-1 border-2 border-[#5e3f28]/50 rounded-full pointer-events-none"></div>
                        </div>

                        <h1 className="text-2xl font-black tracking-tighter text-[#FDF6E3]" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
                            Keeping<span className="text-[#D2691E]">Record</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Desktop Nav */}
                        <nav className="hidden md:flex space-x-2 bg-[#5e3f28]/30 p-1 rounded-lg">
                            {NAV.map(({ tab, icon: Icon, label }) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                                        activeTab === tab
                                            ? 'bg-[#FDF6E3] text-[#5e3f28] shadow-md font-bold'
                                            : 'text-[#FDF6E3]/80 hover:bg-[#5e3f28]/50'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="hidden lg:inline">{label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Avatar → Settings, or Log In */}
                        {isLoggedIn && currentUser ? (
                            <button
                                type="button"
                                onClick={onOpenSettings}
                                title="Settings"
                                className="w-[38px] h-[38px] rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden shadow-[2px_2px_0px_0px_rgba(62,43,28,0.5)] hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                            >
                                <img
                                    src={avatarUri(currentUser.avatar_icon || currentUser.username)}
                                    alt="Settings"
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                            </button>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#D2691E] text-white hover:bg-[#A0522D] transition-all duration-200 font-bold shadow-md"
                                title="Log In"
                            >
                                <LogIn size={18} />
                                <span className="hidden sm:inline">Log In</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
