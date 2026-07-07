import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import ProfileIcon from './ProfileIcon';
import { avatarUri } from '../services/avatar';

interface FriendsViewProps {
    users: User[];
    currentUser: User | null;
    userId?: string;
    onSelectUser: (id: string) => void;
    onUpdateAvatar: () => void;
    onLoginClick: () => void;
}

interface UserStats {
    records: number;
    genres: number;
    decades: number;
    topGenre?: string;
    common: number;
}

type AlbumRow = {
    user_id: string;
    artist: string;
    title: string;
    genre: string | null;
    year: string | null;
    status: string | null;
};

const inCollection = (a: AlbumRow) => a.status === 'collection' || !a.status;
const albumKey = (a: AlbumRow) => `${a.artist.toLowerCase().trim()}|${a.title.toLowerCase().trim()}`;

const decadeOf = (year: string | null): number | null => {
    const y = parseInt(year ?? '', 10);
    if (isNaN(y) || y < 1900 || y > 2100) return null;
    return Math.floor(y / 10);
};

const buildStats = (albums: AlbumRow[], ownerId: string, myKeys: Set<string>, isMe: boolean): UserStats => {
    const mine = albums.filter(a => a.user_id === ownerId && inCollection(a));
    const genreCounts: Record<string, number> = {};
    const decades = new Set<number>();
    let common = 0;
    mine.forEach(a => {
        if (a.genre) genreCounts[a.genre] = (genreCounts[a.genre] || 0) + 1;
        const d = decadeOf(a.year);
        if (d !== null) decades.add(d);
        if (!isMe && myKeys.has(albumKey(a))) common++;
    });
    return {
        records: mine.length,
        genres: Object.keys(genreCounts).length,
        decades: decades.size,
        topGenre: Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
        common,
    };
};

const FriendsView: React.FC<FriendsViewProps> = ({
                                                     users,
                                                     currentUser,
                                                     userId,
                                                     onSelectUser,
                                                     onUpdateAvatar,
                                                     onLoginClick,
                                                 }) => {
    const [seg, setSeg] = useState<'friends' | 'discover'>('friends');
    const [query, setQuery] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [followSet, setFollowSet] = useState<Set<string>>(new Set());
    const [albums, setAlbums] = useState<AlbumRow[]>([]);

    // Anonymous visitors compare against the default (public) collection
    const myId = userId ?? (import.meta.env.VITE_DEFAULT_USER_ID as string);

    useEffect(() => {
        const fetchAlbums = async () => {
            const { data, error } = await supabase
                .from('albums')
                .select('user_id, artist, title, genre, year, status');
            if (!error && data) setAlbums(data as AlbumRow[]);
        };
        fetchAlbums();
    }, []);

    useEffect(() => {
        if (!userId) {
            setFollowSet(new Set());
            return;
        }
        const fetchFollows = async () => {
            const { data, error } = await supabase
                .from('follows')
                .select('followee_id')
                .eq('follower_id', userId);
            if (!error && data) setFollowSet(new Set(data.map((f: any) => f.followee_id)));
        };
        fetchFollows();
    }, [userId]);

    const myKeys = useMemo(() => {
        const keys = new Set<string>();
        albums.forEach(a => {
            if (a.user_id === myId && inCollection(a)) keys.add(albumKey(a));
        });
        return keys;
    }, [albums, myId]);

    const statsById = useMemo(() => {
        const map: Record<string, UserStats> = {};
        users.forEach(u => { map[u.id] = buildStats(albums, u.id, myKeys, u.id === myId); });
        map[myId] = buildStats(albums, myId, myKeys, true);
        return map;
    }, [albums, users, myKeys, myId]);

    const myStats = statsById[myId];

    const toggleFollow = async (targetId: string) => {
        if (!userId) {
            onLoginClick();
            return;
        }
        const wasFollowing = followSet.has(targetId);
        // Optimistic update, reverted if the write fails
        setFollowSet(prev => {
            const next = new Set(prev);
            wasFollowing ? next.delete(targetId) : next.add(targetId);
            return next;
        });
        const { error } = wasFollowing
            ? await supabase.from('follows').delete().eq('follower_id', userId).eq('followee_id', targetId)
            : await supabase.from('follows').insert([{ follower_id: userId, followee_id: targetId }]);
        if (error) {
            console.error(error);
            setFollowSet(prev => {
                const next = new Set(prev);
                wasFollowing ? next.add(targetId) : next.delete(targetId);
                return next;
            });
        }
    };

    const q = query.trim().toLowerCase();
    const visibleUsers = q
        ? users.filter(u => u.username?.toLowerCase().includes(q))
        : users.filter(u => (seg === 'friends' ? followSet.has(u.id) : !followSet.has(u.id)));

    const compareRows = (theirs: UserStats) => [
        { label: 'Records', a: myStats?.records ?? 0, b: theirs.records },
        { label: 'Genres', a: myStats?.genres ?? 0, b: theirs.genres },
        { label: 'Decades', a: myStats?.decades ?? 0, b: theirs.decades },
    ].map(r => ({
        ...r,
        aPct: r.a + r.b > 0 ? Math.round((r.a / (r.a + r.b)) * 100) : 50,
    }));

    const renderCard = (user: User, open: boolean) => {
        const stats = statsById[user.id];
        const following = followSet.has(user.id);
        return (
            <div
                className={`flex flex-col gap-3 bg-[#e3dcd2] border-2 rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-3.5 ${
                    open ? 'border-[#D2691E]' : 'border-[#5e3f28]'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-[46px] h-[46px] rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden flex-shrink-0">
                        <img
                            src={avatarUri(user.avatar_icon || user.username)}
                            alt={`${user.username}'s avatar`}
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-[#3e2b1c] truncate">{user.username}</p>
                        <p className="text-[11px] font-mono text-[#8B5E3C] mt-0.5 truncate">
                            {stats ? `${stats.records} records${stats.topGenre ? ` · ${stats.topGenre}` : ''}` : '· · ·'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setOpenId(open ? null : user.id)}
                        className={`flex-1 flex items-center justify-center px-3 py-[7px] rounded-[9px] border-2 border-[#5e3f28] font-bold text-xs whitespace-nowrap transition-colors ${
                            open
                                ? 'bg-[#5e3f28] text-[#FDF6E3]'
                                : 'bg-transparent text-[#5e3f28] hover:bg-[#5e3f28]/10'
                        }`}
                    >
                        {open ? 'Hide' : 'Compare'}
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleFollow(user.id)}
                        className={`px-3 py-[7px] rounded-[9px] border-2 border-[#5e3f28] font-bold text-xs whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(94,63,40,0.4)] transition-colors ${
                            following
                                ? 'bg-[#e3dcd2] text-[#5e3f28]'
                                : 'bg-[#D2691E] text-white hover:bg-[#A0522D]'
                        }`}
                    >
                        {following ? 'Following' : '+ Follow'}
                    </button>
                </div>
            </div>
        );
    };

    const renderComparePanel = (user: User) => {
        const stats = statsById[user.id];
        if (!stats) return null;
        return (
            <div className="flex-[2_1_280px] min-w-0 bg-[#efe9df] border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase text-[#8B5E3C]">
                        You vs {user.username}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-[#D2691E] text-white text-xs font-bold px-2.5 py-1 rounded-full border-2 border-[#5e3f28]">
                        {stats.common} in common
                    </span>
                </div>
                <div className="flex gap-4 font-mono text-[10px] text-[#8B5E3C] mb-3">
                    <span className="inline-flex items-center gap-[5px]">
                        <span className="w-[9px] h-[9px] rounded-[2px] bg-[#D2691E] inline-block" />you
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                        <span className="w-[9px] h-[9px] rounded-[2px] bg-[#8B5E3C] inline-block" />{user.username}
                    </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-6 gap-y-3">
                    {compareRows(stats).map(row => (
                        <div key={row.label}>
                            <div className="flex justify-between font-mono text-[11px] mb-1">
                                <span className="text-[#D2691E] font-bold">{row.a}</span>
                                <span className="text-[#5e3f28] font-bold uppercase tracking-[0.06em]">{row.label}</span>
                                <span className="text-[#8B5E3C] font-bold">{row.b}</span>
                            </div>
                            <div className="flex h-[9px] rounded-[5px] overflow-hidden border border-[#5e3f28]">
                                <div className="bg-[#D2691E]" style={{ width: `${row.aPct}%` }} />
                                <div className="flex-1 bg-[#8B5E3C]" />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => onSelectUser(user.id)}
                    className="mt-3.5 w-full py-[9px] rounded-[9px] border-2 border-[#5e3f28] bg-[#5e3f28] text-[#FDF6E3] font-bold text-[13px] hover:bg-[#3e2b1c] transition-colors"
                >
                    View {user.username}'s shelf
                </button>
            </div>
        );
    };

    const emptyMessage = q
        ? `No collectors match "${query.trim()}".`
        : seg === 'friends'
            ? userId
                ? "You're not following anyone yet — find collectors in Discover."
                : 'Log in to follow your favorite collectors.'
            : 'No new collectors to discover right now.';

    return (
        <div className="p-[18px] md:p-6 max-w-6xl mx-auto min-h-screen">
            <h2 className="text-xl font-black tracking-tight text-[#3e2b1c] mb-4">Friends</h2>

            {/* YOUR PROFILE — back to your own collection */}
            {!!userId && !!currentUser && (
                <div
                    onClick={() => onSelectUser(userId)}
                    className="bg-[#e3dcd2] bg-clip-padding border-2 border-[#5e3f28] rounded-[14px] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-3.5 flex items-center gap-3 cursor-pointer hover:-translate-y-[3px] transition-transform duration-150 mb-4"
                >
                    <ProfileIcon
                        seed={currentUser.avatar_icon || currentUser.username}
                        isEditable={true}
                        onEdit={onUpdateAvatar}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-base text-[#3e2b1c] truncate">Your Collection</p>
                        <p className="text-xs font-mono text-[#8B5E3C] mt-0.5">
                            {myStats ? `${myStats.records} records · your shelf` : 'back to your shelf'}
                        </p>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.5} className="text-[#8B5E3C] flex-shrink-0" />
                </div>
            )}

            {/* SEARCH */}
            <div className="flex items-center gap-2.5 bg-[#e3dcd2] border-2 border-[#5e3f28] rounded-xl shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] px-3.5 py-[11px] mb-3.5">
                <Search size={18} strokeWidth={2.5} className="text-[#8B5E3C] flex-shrink-0" />
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Find a collector by username…"
                    className="border-none bg-transparent outline-none font-[inherit] text-sm text-[#3e2b1c] placeholder-[#8B5E3C]/70 flex-1 min-w-0"
                />
            </div>

            {/* MY FRIENDS / DISCOVER */}
            <div className="flex gap-1.5 bg-[rgba(94,63,40,0.15)] border-2 border-[#5e3f28] rounded-xl p-[5px] mb-4">
                {([['friends', 'My Friends'], ['discover', 'Discover']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => { setSeg(key); setOpenId(null); }}
                        className={`flex-1 flex items-center justify-center px-2.5 py-[9px] rounded-lg font-bold text-sm transition-colors ${
                            seg === key && !q
                                ? 'bg-[#FDF6E3] text-[#5e3f28] shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                                : 'bg-transparent text-[#8B5E3C] hover:text-[#5e3f28]'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ROSTER GRID */}
            {visibleUsers.length === 0 ? (
                <div className="bg-[#e3dcd2] border-2 border-dashed border-[#8B5E3C] rounded-[14px] p-6 text-center">
                    <p className="text-sm font-bold text-[#5e3f28]">{emptyMessage}</p>
                    {!userId && seg === 'friends' && !q && (
                        <button
                            type="button"
                            onClick={onLoginClick}
                            className="mt-3 px-4 py-2 rounded-[9px] border-2 border-[#5e3f28] bg-[#D2691E] text-white font-bold text-sm shadow-[2px_2px_0px_0px_rgba(94,63,40,0.4)] hover:bg-[#A0522D] transition-colors"
                        >
                            Log In
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(228px,1fr))] gap-3.5 items-start">
                    {visibleUsers.map(user => {
                        const open = openId === user.id;
                        if (!open) return <React.Fragment key={user.id}>{renderCard(user, false)}</React.Fragment>;
                        return (
                            <div key={user.id} className="col-span-full flex flex-wrap gap-3.5 items-stretch">
                                <div className="flex-[1_1_220px] min-w-0">{renderCard(user, true)}</div>
                                {renderComparePanel(user)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FriendsView;
