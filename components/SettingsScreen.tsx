import React from 'react';
import { User, Tab } from '../types';
import { avatarUri } from '../services/avatar';
import Toggle from './Toggle';
import { ChevronLeft, ChevronRight, Disc, Share2, LogOut } from 'lucide-react';

interface SettingsScreenProps {
    user: User;
    email: string | null;
    recordCount: number;
    onClose: () => void;
    onOpenShare: () => void;
    onEditAvatar: () => void;
    onLogout: () => void;
    onChangePassword: () => void;
    onUpdatePrefs: (patch: Partial<User>) => void;
}

const TAB_ORDER: { value: string; label: string }[] = [
    { value: Tab.TILES, label: 'Collection' },
    { value: Tab.WISHLIST, label: 'Wishlist' },
    { value: Tab.STATS, label: 'Stats' },
    { value: Tab.EXPLORE, label: 'Friends' },
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#8B5E3C] font-bold mb-2 ml-1">
        {children}
    </p>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    user,
    email,
    recordCount,
    onClose,
    onOpenShare,
    onEditAvatar,
    onLogout,
    onChangePassword,
    onUpdatePrefs,
}) => {
    const openingTab = user.pref_opening_tab || Tab.TILES;
    const openingLabel = TAB_ORDER.find(t => t.value === openingTab)?.label ?? 'Collection';

    const cycleOpeningTab = () => {
        const idx = TAB_ORDER.findIndex(t => t.value === openingTab);
        const next = TAB_ORDER[(idx + 1) % TAB_ORDER.length].value;
        onUpdatePrefs({ pref_opening_tab: next });
    };

    const maskedEmail = email ? `${email.split('@')[0]}@…` : '—';

    return (
        <div className="fixed inset-0 z-[70] bg-[#d6cbb8] flex flex-col animate-fade-in-fast">
            {/* Header */}
            <div className="bg-[#8B5E3C] border-b-4 border-[#5e3f28] px-[18px] py-4 flex items-center gap-3.5 flex-shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-[#5e3f28]/35 hover:bg-[#5e3f28]/55 flex items-center justify-center transition-colors"
                    title="Back"
                >
                    <ChevronLeft size={20} className="text-[#FDF6E3]" strokeWidth={2.5} />
                </button>
                <h1 className="text-xl font-black tracking-tight text-[#FDF6E3]" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>
                    Settings
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-[18px] pb-10">
                <div className="max-w-lg mx-auto flex flex-col gap-5">

                    {/* Profile card */}
                    <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-4 flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden flex-shrink-0">
                            <img src={avatarUri(user.avatar_icon || user.username)} alt="Your avatar" className="w-full h-full object-cover" draggable={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-black text-[#3e2b1c] truncate">{user.username}</p>
                            <p className="text-xs font-mono text-[#8B5E3C] mt-0.5">@{user.username.toLowerCase()} · {recordCount} records</p>
                        </div>
                        <button
                            type="button"
                            onClick={onEditAvatar}
                            className="px-3.5 py-2 border-2 border-[#5e3f28] rounded-lg text-xs font-bold text-[#5e3f28] hover:bg-[#e3dcd2] transition-colors"
                        >
                            Edit
                        </button>
                    </div>

                    {/* Share your vault */}
                    <div>
                        <SectionLabel>Share your vault</SectionLabel>
                        <div className="bg-[#5e3f28] bg-clip-padding border-2 border-[#3e2b1c] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(62,43,28,0.6)] p-[18px] relative overflow-hidden">
                            <Disc
                                size={150}
                                strokeWidth={1.5}
                                className="absolute -right-[30px] -top-5 pointer-events-none"
                                style={{ color: 'rgba(253,246,227,0.06)' }}
                            />
                            <p className="text-base font-black text-[#FDF6E3] mb-1 relative">Send a friend your shelf</p>
                            <p className="text-xs text-[#FDF6E3]/65 mb-3.5 leading-relaxed relative">
                                They browse everything you own — no account needed.
                            </p>
                            <button
                                type="button"
                                onClick={onOpenShare}
                                className="w-full bg-[#D2691E] hover:bg-[#A0522D] text-white text-sm font-bold py-3 rounded-[10px] flex items-center justify-center gap-2 transition-colors relative"
                            >
                                <Share2 size={16} strokeWidth={2.5} /> Share link
                            </button>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div>
                        <SectionLabel>Preferences</SectionLabel>
                        <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] overflow-hidden">
                            <button
                                type="button"
                                onClick={cycleOpeningTab}
                                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2] hover:bg-[#faf3e2] transition-colors text-left"
                            >
                                <span className="text-sm font-semibold text-[#3e2b1c]">Opening tab</span>
                                <span className="text-[13px] font-semibold text-[#8B5E3C] flex items-center gap-1">
                                    {openingLabel} <ChevronRight size={16} strokeWidth={2.5} />
                                </span>
                            </button>
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2]">
                                <div>
                                    <span className="text-sm font-semibold text-[#3e2b1c]">Showcase mode</span>
                                    <p className="text-[11px] text-[#8B5E3C] mt-0.5">Turntable when idle</p>
                                </div>
                                <Toggle
                                    on={user.pref_showcase !== false}
                                    onChange={() => onUpdatePrefs({ pref_showcase: !(user.pref_showcase !== false) })}
                                    label="Showcase mode"
                                />
                            </div>
                            <div className="flex items-center justify-between px-4 py-3.5">
                                <div>
                                    <span className="text-sm font-semibold text-[#3e2b1c]">Shake to play</span>
                                    <p className="text-[11px] text-[#8B5E3C] mt-0.5">Random pick on shake</p>
                                </div>
                                <Toggle
                                    on={!!user.pref_shake}
                                    onChange={() => onUpdatePrefs({ pref_shake: !user.pref_shake })}
                                    label="Shake to play"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account */}
                    <div>
                        <SectionLabel>Account</SectionLabel>
                        <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2]">
                                <span className="text-sm font-semibold text-[#3e2b1c]">Email</span>
                                <span className="text-[13px] font-mono text-[#8B5E3C]">{maskedEmail}</span>
                            </div>
                            <button
                                type="button"
                                onClick={onChangePassword}
                                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2] hover:bg-[#faf3e2] transition-colors text-left"
                            >
                                <span className="text-sm font-semibold text-[#3e2b1c]">Change password</span>
                                <ChevronRight size={16} strokeWidth={2.5} className="text-[#8B5E3C]" />
                            </button>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 px-4 py-3.5 hover:bg-[#faf3e2] transition-colors text-left"
                            >
                                <LogOut size={17} strokeWidth={2.5} className="text-[#b3402f]" />
                                <span className="text-sm font-bold text-[#b3402f]">Log out</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] font-mono tracking-[0.14em] text-[#5e3f28]/40">
                        KEEPINGRECORD · v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
