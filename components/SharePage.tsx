import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Album, User } from '../types';
import { avatarUri } from '../services/avatar';

interface SharePageProps {
    username: string;
}

type LoadState = 'loading' | 'ready' | 'private' | 'notfound';

interface VaultOwner extends User {
    created_at?: string;
}

function topGenre(records: Album[]): string | null {
    const counts: Record<string, number> = {};
    for (const r of records) {
        if (!r.genre) continue;
        counts[r.genre] = (counts[r.genre] || 0) + 1;
    }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
}

const RecordTile: React.FC<{ record: Album }> = ({ record }) => (
    <div
        className="relative rounded-xl border-2 border-[#5e3f28] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] overflow-hidden"
        style={{ aspectRatio: '0.78', backgroundColor: record.spineColor || '#4C566A' }}
    >
        {record.coverUrl && (
            <img src={record.coverUrl} alt={record.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.25) 55%, transparent)' }} />
        <div className="absolute top-2 right-2 px-[7px] py-0.5 rounded-full bg-black/50 border border-white/20 text-[9px] font-mono text-white/80">
            {record.year}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="font-black text-white text-sm leading-tight mb-0.5" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                {record.title}
            </h3>
            <p className="text-[11px] text-white/70 truncate">{record.artist}</p>
        </div>
    </div>
);

const CtaCard: React.FC = () => (
    <div className="bg-[#FDF6E3] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-5 flex flex-col items-center gap-2.5 text-center">
        <p className="text-[15px] font-bold text-[#3e2b1c] leading-snug">Got a shelf of your own?</p>
        <a
            href="/"
            className="w-full bg-[#D2691E] hover:bg-[#A0522D] text-white font-bold text-[15px] py-3 px-6 rounded-[10px] border-2 border-[#5e3f28] shadow-[2px_2px_0px_0px_rgba(94,63,40,1)] transition-colors"
        >
            Start your own collection — free
        </a>
        <p className="text-[11px] text-[#8B5E3C]">Scan a barcode, and your first record is in.</p>
    </div>
);

const SharePage: React.FC<SharePageProps> = ({ username }) => {
    const [state, setState] = useState<LoadState>('loading');
    const [owner, setOwner] = useState<VaultOwner | null>(null);
    const [records, setRecords] = useState<Album[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data: userData, error: userError } = await supabase
                .from('vault_users')
                .select('id, username, avatar_icon, is_public, created_at')
                .ilike('username', username)
                .maybeSingle();

            if (userError || !userData) { setState('notfound'); return; }
            if (userData.is_public === false) { setOwner(userData); setState('private'); return; }

            const { data: albumData, error: albumError } = await supabase
                .from('albums')
                .select('*')
                .eq('user_id', userData.id)
                .order('added_at', { ascending: false });

            if (albumError) { setState('notfound'); return; }

            const collection: Album[] = (albumData ?? [])
                .filter((a: any) => a.status !== 'wishlist')
                .map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    artist: a.artist,
                    genre: a.genre,
                    year: a.year,
                    spineColor: a.spine_color,
                    addedAt: a.added_at,
                    status: a.status,
                    userId: a.user_id,
                    coverUrl: a.cover_url ?? null,
                }));

            setOwner(userData);
            setRecords(collection);
            setState('ready');
        };

        load();
    }, [username]);

    const latest = records[0] ?? null;
    const genre = topGenre(records);
    const sinceYear = records.length
        ? new Date(records[records.length - 1].addedAt).getFullYear()
        : owner?.created_at
            ? new Date(owner.created_at).getFullYear()
            : new Date().getFullYear();

    return (
        <div className="min-h-screen bg-[#d6cbb8]">
            {/* Header */}
            <header className="bg-[#8B5E3C] border-b-4 border-[#5e3f28]">
                <div className="max-w-md md:max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2.5 no-underline">
                        <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center animate-spin-slow">
                            <div className="w-[11px] h-[11px] rounded-full bg-[#D2691E]" />
                        </div>
                        <span className="text-base font-black tracking-tighter text-[#FDF6E3]" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>
                            Keeping<span className="text-[#D2691E]">Record</span>
                        </span>
                    </a>
                    <span className="text-[10px] font-mono tracking-[0.1em] text-[#FDF6E3]/60">SHARED COLLECTION</span>
                </div>
            </header>

            <main className="max-w-md md:max-w-3xl mx-auto px-5 pb-8">
                {state === 'loading' && (
                    <div className="flex h-64 items-center justify-center text-[#5e3f28]">
                        <p className="animate-pulse font-bold text-lg">Opening the crate…</p>
                    </div>
                )}

                {state === 'notfound' && (
                    <div className="pt-16 flex flex-col gap-5 max-w-md mx-auto">
                        <div className="text-center text-[#5e3f28]">
                            <p className="text-2xl font-black mb-1">Collection not found</p>
                            <p className="text-sm text-[#8B5E3C]">This link doesn't match any collection.</p>
                        </div>
                        <CtaCard />
                    </div>
                )}

                {state === 'private' && (
                    <div className="pt-16 flex flex-col gap-5 max-w-md mx-auto">
                        <div className="text-center text-[#5e3f28]">
                            <p className="text-2xl font-black mb-1">This collection is private</p>
                            <p className="text-sm text-[#8B5E3C]">The owner has turned the share link off.</p>
                        </div>
                        <CtaCard />
                    </div>
                )}

                {state === 'ready' && owner && (
                    <>
                        {/* Profile row + latest addition — side by side on desktop */}
                        <div className="md:flex md:items-center md:gap-6 md:pt-4">
                        <div className="pt-6 pb-2 md:py-0 md:flex-1 flex items-center gap-3.5">
                            <div className="w-16 h-16 rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] shadow-[3px_3px_0px_0px_rgba(94,63,40,0.8)] overflow-hidden flex-shrink-0">
                                <img src={avatarUri(owner.avatar_icon || owner.username)} alt={`${owner.username}'s avatar`} className="w-full h-full object-cover" draggable={false} />
                            </div>
                            <div>
                                <h1 className="text-[26px] font-black tracking-tight text-[#3e2b1c] leading-[1.05]">
                                    {owner.username}'s Collection
                                </h1>
                                <p className="text-[13px] font-medium text-[#8B5E3C] mt-1">
                                    {records.length} records{genre ? ` · leans ${genre}` : ''} · since {sinceYear}
                                </p>
                            </div>
                        </div>

                        {/* Latest addition */}
                        {latest && (
                            <div className="my-4 md:my-0 md:flex-1 bg-[#5e3f28] bg-clip-padding rounded-[14px] border-2 border-[#3e2b1c] shadow-[4px_4px_0px_0px_rgba(62,43,28,0.6)] px-4 py-3.5 flex items-center gap-3.5 overflow-hidden relative">
                                <div className="relative w-16 h-16 rounded-full bg-black flex-shrink-0 flex items-center justify-center animate-[spin_4s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                    <div className="absolute inset-0 rounded-full opacity-90" style={{ background: 'repeating-radial-gradient(#222 0, #222 2px, #111 3px, #111 4px)' }} />
                                    <div className="w-[22px] h-[22px] rounded-full relative z-10 overflow-hidden" style={{ backgroundColor: latest.spineColor || '#4C566A' }}>
                                        {latest.coverUrl && <img src={latest.coverUrl} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-mono font-bold tracking-[0.15em] text-[#D2691E] uppercase mb-[3px]">Latest addition</p>
                                    <p className="text-[17px] font-black text-[#FDF6E3] leading-tight truncate">{latest.title}</p>
                                    <p className="text-xs text-[#FDF6E3]/65 mt-0.5 truncate">{latest.artist}{latest.year ? ` · ${latest.year}` : ''}</p>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* Record grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 py-2 pb-5 md:pt-6">
                            {records.map(r => <RecordTile key={r.id} record={r} />)}
                        </div>

                        <div className="md:max-w-md md:mx-auto">
                            <CtaCard />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default SharePage;
