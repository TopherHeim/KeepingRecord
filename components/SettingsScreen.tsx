import React, { useState } from 'react';
import { User, Tab } from '../types';
import { avatarUri } from '../services/avatar';
import Toggle from './Toggle';
import { ChevronLeft, ChevronRight, Disc, Share2, LogOut, Trash2 } from 'lucide-react';

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
    onChangeUsername: (newName: string) => Promise<boolean>;
    onDeleteAccount: () => void;
}

const IDLE_DELAYS: { seconds: number; label: string }[] = [
    { seconds: 60, label: '1 min' },
    { seconds: 120, label: '2 min' },
    { seconds: 300, label: '5 min' },
    { seconds: 900, label: '15 min' },
];

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
    onChangeUsername,
    onDeleteAccount,
}) => {
    const openingTab = user.pref_opening_tab || Tab.TILES;
    const openingLabel = TAB_ORDER.find(t => t.value === openingTab)?.label ?? 'Collection';

    const cycleOpeningTab = () => {
        const idx = TAB_ORDER.findIndex(t => t.value === openingTab);
        const next = TAB_ORDER[(idx + 1) % TAB_ORDER.length].value;
        onUpdatePrefs({ pref_opening_tab: next });
    };

    const showcaseOn = user.pref_showcase !== false;
    const idleDelay = user.pref_idle_delay ?? 60;
    const idleLabel = IDLE_DELAYS.find(d => d.seconds === idleDelay)?.label ?? `${Math.round(idleDelay / 60)} min`;

    const cycleIdleDelay = () => {
        const idx = IDLE_DELAYS.findIndex(d => d.seconds === idleDelay);
        const next = IDLE_DELAYS[(idx + 1) % IDLE_DELAYS.length].seconds;
        onUpdatePrefs({ pref_idle_delay: next });
    };

    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(user.username);
    const [nameError, setNameError] = useState<string | null>(null);
    const [savingName, setSavingName] = useState(false);

    const submitUsername = async () => {
        const name = nameValue.trim();
        if (name === user.username) { setEditingName(false); setNameError(null); return; }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
            setNameError('3–20 characters; letters, numbers, and _ only.');
            return;
        }
        setSavingName(true);
        const ok = await onChangeUsername(name);
        setSavingName(false);
        if (ok) {
            setEditingName(false);
            setNameError(null);
        } else {
            setNameError('That username is taken.');
        }
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

                    {/* Share your collection */}
                    <div>
                        <SectionLabel>Share your collection</SectionLabel>
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
                                    on={showcaseOn}
                                    onChange={() => onUpdatePrefs({ pref_showcase: !showcaseOn })}
                                    label="Showcase mode"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={cycleIdleDelay}
                                disabled={!showcaseOn}
                                className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2] transition-colors text-left ${
                                    showcaseOn ? 'hover:bg-[#faf3e2]' : 'opacity-40 cursor-not-allowed'
                                }`}
                            >
                                <div>
                                    <span className="text-sm font-semibold text-[#3e2b1c]">Showcase delay</span>
                                    <p className="text-[11px] text-[#8B5E3C] mt-0.5">Idle time before it kicks in</p>
                                </div>
                                <span className="text-[13px] font-semibold text-[#8B5E3C] flex items-center gap-1">
                                    {idleLabel} <ChevronRight size={16} strokeWidth={2.5} />
                                </span>
                            </button>
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
                            {editingName ? (
                                <div className="px-4 py-3.5 border-b border-[#e3dcd2]">
                                    <span className="text-sm font-semibold text-[#3e2b1c]">Username</span>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            value={nameValue}
                                            onChange={e => { setNameValue(e.target.value); setNameError(null); }}
                                            onKeyDown={e => { if (e.key === 'Enter') submitUsername(); }}
                                            autoFocus
                                            maxLength={20}
                                            className="flex-1 min-w-0 px-3 py-2 border-2 border-[#5e3f28] rounded-lg bg-white text-sm font-semibold text-[#3e2b1c] outline-none focus:border-[#D2691E]"
                                        />
                                        <button
                                            type="button"
                                            onClick={submitUsername}
                                            disabled={savingName}
                                            className="px-3.5 py-2 rounded-lg bg-[#D2691E] hover:bg-[#A0522D] text-white text-xs font-bold border-2 border-[#5e3f28] transition-colors disabled:opacity-50"
                                        >
                                            {savingName ? 'Saving…' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setEditingName(false); setNameValue(user.username); setNameError(null); }}
                                            className="px-3.5 py-2 rounded-lg border-2 border-[#5e3f28] text-xs font-bold text-[#5e3f28] hover:bg-[#e3dcd2] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    {nameError && <p className="text-[11px] font-bold text-[#b3402f] mt-1.5">{nameError}</p>}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setNameValue(user.username); setEditingName(true); }}
                                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#e3dcd2] hover:bg-[#faf3e2] transition-colors text-left"
                                >
                                    <span className="text-sm font-semibold text-[#3e2b1c]">Username</span>
                                    <span className="text-[13px] font-semibold text-[#8B5E3C] flex items-center gap-1">
                                        {user.username} <ChevronRight size={16} strokeWidth={2.5} />
                                    </span>
                                </button>
                            )}
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

                    {/* Danger zone */}
                    <div>
                        <SectionLabel>Danger zone</SectionLabel>
                        <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#b3402f] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(179,64,47,0.4)] overflow-hidden">
                            <button
                                type="button"
                                onClick={onDeleteAccount}
                                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#faf3e2] transition-colors text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={17} strokeWidth={2.5} className="text-[#b3402f]" />
                                    <div>
                                        <span className="text-sm font-bold text-[#b3402f]">Delete account</span>
                                        <p className="text-[11px] text-[#8B5E3C] mt-0.5">Removes your account and all records — permanent</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} strokeWidth={2.5} className="text-[#b3402f]" />
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
