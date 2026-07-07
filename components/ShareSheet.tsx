import React, { useEffect, useRef, useState } from 'react';
import { Album, User } from '../types';
import { avatarUri } from '../services/avatar';
import Toggle from './Toggle';
import { X, Copy, Check, MessageCircle, Mail, QrCode, MoreHorizontal, Globe } from 'lucide-react';

interface ShareSheetProps {
    user: User;
    records: Album[];
    onClose: () => void;
    onToggleLive: () => void;
}

async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Older WebViews (and capacitor://) may not expose the async API
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
}

const ShareSheet: React.FC<ShareSheetProps> = ({ user, records, onClose, onToggleLive }) => {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const shareUrl = `${window.location.origin}/v/${encodeURIComponent(user.username)}`;
    const displayUrl = shareUrl.replace(/^https?:\/\//, '');
    const shareText = `Check out my vinyl collection on KeepingRecord: ${shareUrl}`;
    const isLive = user.is_public !== false;

    useEffect(() => {
        return () => { if (copyTimer.current) clearTimeout(copyTimer.current); };
    }, []);

    const handleCopy = async () => {
        const ok = await copyText(shareUrl);
        if (!ok) return;
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    const handleMore = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: `${user.username}'s Vault`, url: shareUrl }); } catch { /* user cancelled */ }
        } else {
            handleCopy();
        }
    };

    const targets = [
        { label: 'Messages', icon: MessageCircle, onClick: () => { window.location.href = `sms:?&body=${encodeURIComponent(shareText)}`; } },
        { label: 'Email', icon: Mail, onClick: () => { window.location.href = `mailto:?subject=${encodeURIComponent(`${user.username}'s vinyl vault`)}&body=${encodeURIComponent(shareText)}`; } },
        { label: 'QR code', icon: QrCode, onClick: () => setShowQr(v => !v) },
        { label: 'More', icon: MoreHorizontal, onClick: handleMore },
    ];

    return (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-[rgba(30,20,12,0.55)] backdrop-blur-[2px] animate-fade-in"
            />

            {/* Sheet */}
            <div className="relative bg-[#d6cbb8] rounded-t-3xl border-t-4 border-[#5e3f28] shadow-[0_-12px_40px_rgba(0,0,0,0.3)] px-[22px] pt-3 pb-7 animate-sheet-up">
                <div className="max-w-lg mx-auto">
                    <div className="w-11 h-[5px] rounded-full bg-[#b3a488] mx-auto mb-4" />

                    <div className="flex items-center justify-between mb-[18px]">
                        <h2 className="text-[22px] font-black tracking-tight text-[#3e2b1c]">Share your vault</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[#e3dcd2] hover:bg-[#d4c5a9] flex items-center justify-center transition-colors"
                            title="Close"
                        >
                            <X size={18} strokeWidth={2.5} className="text-[#5e3f28]" />
                        </button>
                    </div>

                    {/* Vault preview */}
                    <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-3.5 flex items-center gap-3 mb-[18px]">
                        <div className="w-[46px] h-[46px] rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden flex-shrink-0">
                            <img src={avatarUri(user.avatar_icon || user.username)} alt="Your avatar" className="w-full h-full object-cover" draggable={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-black text-[#3e2b1c] truncate">{user.username}'s Vault</p>
                            <p className="text-[11px] font-mono text-[#8B5E3C] mt-0.5">
                                {records.length} records · {isLive ? 'public' : 'private'}
                            </p>
                        </div>
                        <div className="flex">
                            {records.slice(0, 3).map((r, i) => (
                                <div
                                    key={r.id}
                                    className="w-[26px] h-[26px] rounded-[5px] border-[1.5px] border-[#5e3f28]"
                                    style={{ backgroundColor: r.spineColor || '#4C566A', marginLeft: i === 0 ? 0 : -8 }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Link + copy */}
                    <div className="flex items-center gap-2 bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[10px] p-1 pl-3.5 mb-4">
                        <span className="flex-1 text-[13px] font-mono text-[#5e3f28] whitespace-nowrap overflow-hidden text-ellipsis">
                            {displayUrl}
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="text-white text-[13px] font-bold px-[18px] py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                            style={{ backgroundColor: copied ? '#3a5a2e' : '#D2691E' }}
                        >
                            {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} strokeWidth={2.5} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    {/* QR (revealed by the QR target) */}
                    {showQr && (
                        <div className="bg-[#FDF6E3] border-2 border-[#5e3f28] rounded-[14px] p-4 mb-4 flex justify-center animate-fade-in">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                                alt={`QR code for ${displayUrl}`}
                                width={180}
                                height={180}
                            />
                        </div>
                    )}

                    {/* Share targets */}
                    <div className="grid grid-cols-4 gap-3 mb-5">
                        {targets.map(({ label, icon: Icon, onClick }) => (
                            <button key={label} type="button" onClick={onClick} className="flex flex-col items-center gap-[7px] group">
                                <div className="w-[54px] h-[54px] rounded-[14px] bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] shadow-[3px_3px_0px_0px_rgba(94,63,40,0.8)] flex items-center justify-center group-hover:bg-[#e3dcd2] transition-colors">
                                    <Icon size={24} className="text-[#5e3f28]" />
                                </div>
                                <span className="text-[11px] font-semibold text-[#5e3f28]">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Link is live */}
                    <div className="bg-[#e3dcd2] bg-clip-padding border-2 border-[#5e3f28] rounded-xl px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Globe size={18} className="text-[#5e3f28]" />
                            <div>
                                <span className="text-sm font-bold text-[#3e2b1c]">Link is live</span>
                                <p className="text-[11px] text-[#8B5E3C] mt-0.5">Anyone with it can view</p>
                            </div>
                        </div>
                        <Toggle on={isLive} onChange={onToggleLive} label="Link is live" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareSheet;
