import React, {useState, useEffect, useCallback, useRef} from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import TileView from './components/TileView';
import StatsView from './components/StatsView';
import AddRecordModal from './components/AddRecordModal';
import NowPlayingModal from './components/NowPlayingModal';
import DiscoveryCrate from './components/DiscoveryCrate';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { useToast } from './Hooks/useToast';
import { Tab, Album, NewAlbumInput, User } from './types';
import LoginModal from './components/LoginModal';
import FriendsView from './components/FriendsView';
import AvatarPicker from './components/AvatarPicker';
import BarcodeScanner from "@/components/BarcodeScanner.tsx";
import { batchFetchCovers, saveSpineColor } from './services/discogsService';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import VinylShowcase from './components/VinylShowcase';
import { getDominantColor } from './services/dominantColor';
import { API_BASE } from './services/apiBase';
import BottomNav from './components/BottomNav';
import SettingsScreen from './components/SettingsScreen';
import ShareSheet from './components/ShareSheet';
import ResetPasswordModal from './components/ResetPasswordModal';


export const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.TILES);
    const [records, setRecords] = useState<Album[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Album | null>(null);
    const [playingRecord, setPlayingRecord] = useState<Album | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [exploreUsers, setExploreUsers] = useState<User[]>([]);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isResetOpen, setIsResetOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        danger?: boolean;
        confirmLabel?: string;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const { toasts, removeToast, toast } = useToast();

    const showConfirm = (title: string, message: string, onConfirm: () => void, danger = false, confirmLabel = 'Confirm') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, danger, confirmLabel });
    };

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    // Fetch the user's profile, creating it if missing. Signups that happen
    // with email confirmation enabled can't insert a profile row (no session
    // yet), so the username travels in auth metadata and the row is created
    // here on first login instead.
    const ensureProfile = async (authUser: { id: string; email?: string; user_metadata?: any }) => {
        const { data } = await supabase
            .from('vault_users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
        if (data) return data;

        const base = String(authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'collector')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .slice(0, 20) || 'collector';
        // Second candidate covers a username collision (unique index)
        for (const candidate of [base, `${base.slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`]) {
            const { data: created, error } = await supabase
                .from('vault_users')
                .insert([{ id: authUser.id, username: candidate }])
                .select()
                .single();
            if (!error) return created;
            if (error.code !== '23505') break;
        }
        return null;
    };

    // 1. RESTORE SESSION ON PAGE LOAD
    useEffect(() => {
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUserId(session.user.id);
                setIsLoggedIn(true);
                setViewingUserId(session.user.id);
                setUserEmail(session.user.email ?? null);

                const data = await ensureProfile(session.user);
                if (data) {
                    setCurrentUser(data);
                    // Honor the "Opening tab" preference from Settings
                    const opening = data.pref_opening_tab;
                    if (opening && opening !== Tab.SHOWCASE && (Object.values(Tab) as string[]).includes(opening)) {
                        setActiveTab(opening as Tab);
                    }
                }

                // Trigger fetch immediately with the ID we just got
                fetchRecords(session.user.id);
            } else {
                // Default view for logged-out users
                fetchRecords(import.meta.env.VITE_DEFAULT_USER_ID);
            }
            setAuthReady(true);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Arriving via a password-recovery email link — prompt for the
            // new password (the link signs the user in with a recovery session)
            if (event === 'PASSWORD_RECOVERY') {
                setIsResetOpen(true);
            }

            if (session?.user) {
                setUserId(session.user.id);
                setIsLoggedIn(true);
                setViewingUserId(session.user.id);
                setUserEmail(session.user.email ?? null);
                fetchRecords(session.user.id);
                // Deferred: awaiting supabase inside onAuthStateChange deadlocks.
                // Covers first login after email confirmation, where no profile
                // row exists yet.
                const authUser = session.user;
                setTimeout(() => {
                    ensureProfile(authUser).then(profile => {
                        if (profile) setCurrentUser(profile);
                    });
                }, 0);
            } else {
                setUserId(null);
                setIsLoggedIn(false);
                setCurrentUser(null);
                setViewingUserId(null);
                setUserEmail(null);
                setIsSettingsOpen(false);
                setIsShareOpen(false);
                fetchRecords(import.meta.env.VITE_DEFAULT_USER_ID);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. FETCH RECORDS WHEN userId CHANGES
    useEffect(() => {
        const effectiveUserId = userId ?? import.meta.env.VITE_DEFAULT_USER_ID;
        fetchRecords(effectiveUserId);
    }, [authReady, userId]);

    // 3. FETCH EXPLORE USERS WHEN TAB CHANGES
    useEffect(() => {
        if (activeTab === Tab.EXPLORE) {
            fetchExploreUsers();
        }
    }, [activeTab]);

    const fetchRecords = async (effectiveUserId: string) => {
        setIsLoading(true);

        const { data, error } = await supabase
            .from('albums')
            .select('*')
            .eq('user_id', effectiveUserId)
            .order('added_at', { ascending: false });

        if (error) {
            console.error(error);
            setRecords([]);
            setIsLoading(false);
            return;
        }

        const mapped: Album[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            artist: item.artist,
            genre: item.genre,
            year: item.year,
            spineColor: item.spine_color,
            addedAt: item.added_at,
            status: item.status,
            userId: item.user_id,
            coverUrl: item.cover_url ?? null,
        }));

        setRecords(mapped);
        setIsLoading(false);

        // Fetch missing covers in the background
        batchFetchCovers(
            mapped.map((a) => ({
                id: a.id,
                artist: a.artist,
                title: a.title,
                coverUrl: a.coverUrl,
            })),
            async (id, url) => {
                const dominantColor = await getDominantColor(url);
                setRecords(prev =>
                    prev.map(r => r.id === id ? { ...r, coverUrl: url, spineColor: dominantColor } : r)
                );
                if (dominantColor !== '#222222') saveSpineColor(id, dominantColor);
            }
        );

        // Backfill spine colors for records that already have a cover but
        // were saved before spine colors were persisted
        backfillSpineColors(mapped);
    };

    const backfillSpineColors = async (albums: Album[]) => {
        const needsColor = albums.filter(
            a => a.coverUrl && (!a.spineColor || a.spineColor === '#222222')
        );
        for (const album of needsColor) {
            const color = await getDominantColor(album.coverUrl!);
            if (color === '#222222') continue; // fallback — nothing better found
            setRecords(prev =>
                prev.map(r => r.id === album.id ? { ...r, spineColor: color } : r)
            );
            saveSpineColor(album.id, color);
        }
    };

    // 4. ADD NEW RECORD
    const handleAddRecord = async (input: NewAlbumInput) => {
        const isDuplicate = records.some(r =>
            r.artist.toLowerCase().trim() === input.artist.toLowerCase().trim() &&
            r.title.toLowerCase().trim() === input.title.toLowerCase().trim()
        );

        if (isDuplicate) {
            toast.error(`"${input.title}" by ${input.artist} is already in your vault!`);
            return;
        }

        const newRecordPayload = {
            title: input.title,
            artist: input.artist,
            genre: input.genre,
            year: isNaN(parseInt(input.year)) ? "Unknown" : input.year.toString(),
            spine_color: input.spineColor,
            status: input.status,
            added_at: new Date().toISOString(),
            user_id: userId,
            cover_url: input.coverUrl ?? null,
        };

        const { data, error } = await supabase
            .from('albums')
            .insert([newRecordPayload])
            .select();

        if (error) {
            toast.error("Error saving to database: " + error.message);
        } else if (data) {
            const savedRecord: Album = {
                id: data[0].id,
                title: data[0].title,
                artist: data[0].artist,
                genre: data[0].genre,
                year: data[0].year,
                spineColor: data[0].spine_color,
                addedAt: data[0].added_at,
                status: data[0].status,
                userId: data[0].user_id,
                coverUrl: data[0].cover_url ?? null,
            };
            setRecords(prev => [savedRecord, ...prev]);
            toast.success(`"${savedRecord.title}" added to your vault!`);
        }
    };

    // 4b. UPDATE EXISTING RECORD
    const handleUpdateRecord = async (id: string, input: NewAlbumInput) => {
        const payload = {
            title: input.title,
            artist: input.artist,
            genre: input.genre,
            year: isNaN(parseInt(input.year)) ? "Unknown" : input.year.toString(),
            spine_color: input.spineColor,
            status: input.status,
            cover_url: input.coverUrl || null,
        };

        const { error } = await supabase
            .from('albums')
            .update(payload)
            .eq('id', id);

        if (error) {
            toast.error("Failed to update record: " + error.message);
        } else {
            setRecords(prev => prev.map(r =>
                r.id === id
                    ? {
                        ...r,
                        title: input.title,
                        artist: input.artist,
                        genre: input.genre,
                        year: payload.year as any,
                        spineColor: input.spineColor,
                        status: input.status,
                        coverUrl: input.coverUrl || null,
                    }
                    : r
            ));
            toast.success(`"${input.title}" updated!`);
        }
    };

    // 5. DELETE RECORD
    const handleDeleteRecord = (id: string) => {
        const record = records.find(r => r.id === id);
        showConfirm(
            'Remove Record',
            `Are you sure you want to remove "${record?.title}" from your vault? This can't be undone.`,
            async () => {
                const { error } = await supabase.from('albums').delete().eq('id', id);
                if (error) {
                    toast.error("Failed to delete record.");
                } else {
                    setRecords(prev => prev.filter(r => r.id !== id));
                    toast.success("Record removed from your vault.");
                }
                closeConfirm();
            },
            true,
            'Remove'
        );
    };

    // 6. MOVE TO COLLECTION
    const handleMoveToCollection = async (album: Album) => {
        const { error } = await supabase
            .from('albums')
            .update({ status: 'collection' })
            .eq('id', album.id);

        if (error) {
            toast.error("Failed to move record to collection.");
        } else {
            setRecords(prev => prev.map(r =>
                r.id === album.id ? { ...r, status: 'collection' } : r
            ));
            toast.success(`"${album.title}" moved to your collection!`);
        }
    };

    // 7. BARCODE SCAN
    const handleScanResult = useCallback(async (barcode: string) => {
        // Loose text match for validating search results: lowercase, strip
        // accents and punctuation
        const norm = (s: string) =>
            s.toLowerCase()
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();

        const getHighResCover = async (artist: string, title: string): Promise<string | null> => {
            try {
                const searchTerm = encodeURIComponent(`${artist} ${title}`);
                const url = `https://itunes.apple.com/search?term=${searchTerm}&entity=album&limit=10`;
                const response = await fetch(url);
                const data = await response.json();
                const nArtist = norm(artist);
                const nTitle = norm(title);
                // iTunes fuzzy search happily returns a different artist's
                // album as the top hit (e.g. "The Hits 2" by Prince matched
                // "The Hits" by Jagged Edge) — only accept a result whose
                // artist AND title actually correspond to what we asked for
                const match = (data.results ?? []).find((r: any) => {
                    const a = norm(r.artistName ?? '');
                    const t = norm(r.collectionName ?? '');
                    if (!a || !t) return false;
                    const artistOk = a.includes(nArtist) || nArtist.includes(a);
                    const titleOk = t.includes(nTitle) || nTitle.includes(t);
                    return artistOk && titleOk;
                });
                return match
                    ? match.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
                    : null;
            } catch (err) {
                console.error("iTunes fetch failed:", err);
                return null;
            }
        };

        try {
            const response = await fetch(`${API_BASE}/.netlify/functions/discogs-proxy?barcode=${encodeURIComponent(barcode)}`);

            if (!response.ok) {
                toast.error("Error connecting to Discogs API.");
                return;
            }

            const data = await response.json();

            // The proxy returns { results: [] } when nothing matched;
            // otherwise the matched release itself at the top level
            if (Array.isArray(data.results)) {
                toast.error(`No records found for barcode: ${barcode}`);
                return;
            }

            const artist = (data.canonicalArtist || "Unknown").trim();
            const title = (data.canonicalAlbum || data.title || "Unknown").trim();
            const highResCover = await getHighResCover(artist, title);
            const coverUrl = highResCover || (data.cover_image && !data.cover_image.includes('spacer.gif')
                ? data.cover_image
                : null);
            const spineColor = coverUrl ? await getDominantColor(coverUrl) : "#222222";

            const scannedAlbum: NewAlbumInput = {
                title,
                artist,
                genre: Array.isArray(data.genre) ? data.genre[0] : (data.genre || "Rock"),
                year: data.year ? data.year.toString() : "Unknown",
                spineColor,
                status: 'collection',
                coverUrl,
            };

            await handleAddRecord(scannedAlbum);
            setIsScannerOpen(false);
        } catch (error) {
            console.error("Scan error:", error);
            toast.error("An error occurred during the scan process.");
        }
    }, [records, userId, handleAddRecord, toast]);

    // 8. FETCH EXPLORE USERS
    const fetchExploreUsers = async () => {
        const { data, error } = await supabase
            .from('vault_users')
            .select('id, username, avatar_icon');

        if (error) {
            console.error(error);
            return;
        }

        // Tally record counts for the "N records" row subtitles
        const { data: albumOwners } = await supabase
            .from('albums')
            .select('user_id');
        const counts: Record<string, number> = {};
        (albumOwners ?? []).forEach((a: any) => {
            counts[a.user_id] = (counts[a.user_id] || 0) + 1;
        });

        const withCounts = data.map(user => ({ ...user, record_count: counts[user.id] ?? 0 }));
        setExploreUsers(withCounts.filter(user => user.id !== userId));
        setCurrentUser(prev => prev ? { ...prev, record_count: counts[prev.id] ?? 0 } : prev);
    };

    // 9. UPDATE AVATAR
    const handleUpdateAvatar = async (newSeed: string) => {
        if (!userId) return;

        setCurrentUser(prev => prev ? { ...prev, avatar_icon: newSeed } : prev);

        const { error } = await supabase
            .from('vault_users')
            .update({ avatar_icon: newSeed })
            .eq('id', userId);

        if (error) {
            toast.error("Failed to save avatar.");
        } else {
            setExploreUsers(prev =>
                prev.map(u => u.id === userId ? { ...u, avatar_icon: newSeed } : u)
            );
            setIsPickerOpen(false);
            toast.success("Avatar updated!");
        }
    };

    // 9b. UPDATE PREFERENCES (Settings screen + Share sheet)
    const handleUpdatePrefs = async (patch: Partial<User>) => {
        if (!userId) return;
        setCurrentUser(prev => prev ? { ...prev, ...patch } : prev);

        const { error } = await supabase
            .from('vault_users')
            .update(patch)
            .eq('id', userId);

        if (error) toast.error('Failed to save settings.');
    };

    // 9c. CHANGE PASSWORD — the user is already authenticated, so set it
    // directly instead of round-tripping through a reset email
    const handleChangePassword = () => setIsResetOpen(true);

    // 9d. CHANGE USERNAME — returns false on a uniqueness conflict so the
    // settings screen can show "taken" inline
    const handleChangeUsername = async (newName: string): Promise<boolean> => {
        if (!userId) return false;

        const { error } = await supabase
            .from('vault_users')
            .update({ username: newName })
            .eq('id', userId);

        if (error) {
            if (error.code === '23505') return false;
            toast.error('Failed to update username: ' + error.message);
            return false;
        }

        setCurrentUser(prev => prev ? { ...prev, username: newName } : prev);
        setExploreUsers(prev => prev.map(u => u.id === userId ? { ...u, username: newName } : u));
        toast.success(`Username changed to ${newName}!`);
        return true;
    };

    // 9e. DELETE ACCOUNT — server-side function wipes records and the auth user
    const handleDeleteAccount = () => {
        showConfirm(
            'Delete Account',
            "This permanently deletes your account and every record in your collection. This can't be undone.",
            async () => {
                closeConfirm();
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    toast.error('Not logged in.');
                    return;
                }
                try {
                    const res = await fetch(`${API_BASE}/.netlify/functions/delete-account`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    });
                    if (!res.ok) {
                        toast.error('Could not delete account. Please try again.');
                        return;
                    }
                    setIsSettingsOpen(false);
                    await supabase.auth.signOut();
                    toast.info('Your account has been deleted.');
                } catch {
                    toast.error('Could not delete account. Please try again.');
                }
            },
            true,
            'Delete Forever'
        );
    };

    // 10. LOGOUT
    const handleLogout = () => {
        showConfirm(
            'Log Out',
            'Are you sure you want to log out?',
            async () => {
                await supabase.auth.signOut();
                fetchRecords(import.meta.env.VITE_DEFAULT_USER_ID);
                closeConfirm();
                toast.info("You've been logged out.");
            },
            false,
            'Log Out'
        );
    };

    const collectionRecords = records.filter(r => r.status === 'collection' || !r.status);
    const wishlistRecords = records.filter(r => r.status === 'wishlist');

    // Preference gates — anonymous visitors keep the original behavior
    const showcaseEnabled = !currentUser || currentUser.pref_showcase !== false;
    const shakeEnabled = currentUser ? !!currentUser.pref_shake : true;

    // Mono meta lines under the grid titles (redesign spec)
    const computeTopGenre = (recs: Album[]): string | undefined => {
        const counts: Record<string, number> = {};
        recs.forEach(r => { if (r.genre) counts[r.genre] = (counts[r.genre] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    };
    const collectionTopGenre = computeTopGenre(collectionRecords);
    const collectionSince = collectionRecords.length
        ? Math.min(...collectionRecords.map(r => new Date(r.addedAt).getFullYear()))
        : null;
    const collectionMeta = collectionRecords.length
        ? `${collectionRecords.length} record${collectionRecords.length === 1 ? '' : 's'}${collectionTopGenre ? ` · leans ${collectionTopGenre}` : ''}${collectionSince ? ` · since ${collectionSince}` : ''}`
        : undefined;
    const wishlistMeta = wishlistRecords.length
        ? `${wishlistRecords.length} record${wishlistRecords.length === 1 ? '' : 's'} · most-wanted`
        : undefined;

    // SHAKE TO PLAY RANDOM RECORD
    const [motionPermission, setMotionPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

    useEffect(() => {
        const DME = DeviceMotionEvent as any;
        if (typeof DME.requestPermission === 'function') {
            setMotionPermission('unknown');
        } else {
            setMotionPermission('granted');
        }
    }, []);

    const requestMotionPermission = () => {
        const DME = (DeviceMotionEvent as any);
        if (typeof DME.requestPermission !== 'function') {
            setMotionPermission('granted');
            return;
        }
        DME.requestPermission().then((r: string) => {
            setMotionPermission(r === 'granted' ? 'granted' : 'denied');
        });
    };

    const lastShakeRef = useRef(0);
    const lastAccRef = useRef({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        if (motionPermission !== 'granted' || collectionRecords.length === 0 || !shakeEnabled) return;

        const THRESHOLD = 25;
        const COOLDOWN = 2000;

        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity || e.acceleration;
            if (!acc) return;

            const { x = 0, y = 0, z = 0 } = acc;
            const dx = Math.abs(x - lastAccRef.current.x);
            const dy = Math.abs(y - lastAccRef.current.y);
            const dz = Math.abs(z - lastAccRef.current.z);
            lastAccRef.current = { x, y, z };

            const force = dx + dy + dz;

            if (force > THRESHOLD) {
                const now = Date.now();
                if (now - lastShakeRef.current < COOLDOWN) return;
                lastShakeRef.current = now;
                const random = collectionRecords[Math.floor(Math.random() * collectionRecords.length)];
                setPlayingRecord(random);
                Haptics.impact({ style: ImpactStyle.Heavy });
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [motionPermission, collectionRecords, shakeEnabled]);

    // IDLE SHOWCASE TIMER
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // "Showcase delay" preference, in seconds — anonymous visitors get the default
    const idleTimeoutMs = (currentUser?.pref_idle_delay ?? 60) * 1000;

    // Any open overlay suspends the idle takeover — otherwise the app
    // flips to the showcase underneath Settings/modals and the user gets
    // dumped there when they close the overlay
    const overlayOpen =
        isSettingsOpen || isShareOpen || isModalOpen || !!editingRecord ||
        !!playingRecord || isScannerOpen || isPickerOpen ||
        confirmModal.isOpen || showLoginModal || isResetOpen;

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (!showcaseEnabled || overlayOpen) return;
        idleTimerRef.current = setTimeout(() => {
            setActiveTab(Tab.SHOWCASE);
        }, idleTimeoutMs);
    }, [showcaseEnabled, overlayOpen, idleTimeoutMs]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        resetIdleTimer(); // start timer on mount
        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetIdleTimer]);

    return (
        <div className="min-h-screen bg-[#d6cbb8] flex flex-col">

            {/* Hide header completely in showcase mode */}
            {activeTab !== Tab.SHOWCASE && (
                <Header
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                        setActiveTab(tab);
                        requestMotionPermission();
                    }}
                    isLoggedIn={isLoggedIn}
                    currentUser={currentUser}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onLoginClick={() => {
                        setShowLoginModal(true);
                        requestMotionPermission();
                    }}
                />
            )}

            <main className={activeTab !== Tab.SHOWCASE ? 'flex-grow pb-24 md:pb-0' : 'flex-grow'}>
                {/* Showcase renders outside the isLoading check so it always works */}
                {activeTab === Tab.SHOWCASE && (
                    <VinylShowcase
                        albums={collectionRecords}
                        onExit={() => {
                            setActiveTab(Tab.TILES);
                            resetIdleTimer();
                        }}
                    />
                )}

                {activeTab !== Tab.SHOWCASE && (
                    isLoading ? (
                        <div className="flex h-64 items-center justify-center text-[#5e3f28]">
                            <p className="animate-pulse font-bold text-xl">Opening Collection...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === Tab.TILES && (
                                <TileView
                                    records={collectionRecords}
                                    onAddClick={() => setIsModalOpen(true)}
                                    onDelete={handleDeleteRecord}
                                    onRecordClick={setPlayingRecord}
                                    onEdit={setEditingRecord}
                                    onScanClick={() => setIsScannerOpen(true)}
                                    title={
                                        viewingUserId && viewingUserId !== userId
                                            ? `${exploreUsers.find(u => u.id === viewingUserId)?.username}'s Collection`
                                            : userId
                                                ? "Your Collection"
                                                : "Topher's Collection"
                                    }
                                    meta={collectionMeta}
                                    isAdmin={!!userId && viewingUserId === userId}
                                    onLoginClick={() => setShowLoginModal(true)}
                                    userId={userId}
                                    viewingUserId={viewingUserId}
                                />
                            )}

                            {activeTab === Tab.EXPLORE && (
                                <FriendsView
                                    users={exploreUsers}
                                    currentUser={currentUser}
                                    userId={userId || undefined}
                                    onSelectUser={(id) => {
                                        setViewingUserId(id);
                                        fetchRecords(id);
                                        setActiveTab(Tab.TILES);
                                    }}
                                    onUpdateAvatar={() => setIsPickerOpen(true)}
                                    onLoginClick={() => setShowLoginModal(true)}
                                />
                            )}

                            {activeTab === Tab.WISHLIST && (
                                <TileView
                                    records={wishlistRecords}
                                    onAddClick={() => setIsModalOpen(true)}
                                    onDelete={handleDeleteRecord}
                                    onRecordClick={setPlayingRecord}
                                    onEdit={setEditingRecord}
                                    onMoveToCollection={handleMoveToCollection}
                                    title={
                                        viewingUserId && viewingUserId !== userId
                                            ? `${exploreUsers.find(u => u.id === viewingUserId)?.username}'s Wishlist`
                                            : userId
                                                ? "Your Wishlist"
                                                : "Topher's Wishlist"
                                    }
                                    meta={wishlistMeta}
                                    isAdmin={!!userId && viewingUserId === userId}
                                    onLoginClick={() => setShowLoginModal(true)}
                                    userId={userId}
                                    viewingUserId={viewingUserId}
                                    afterGridContent={
                                        <DiscoveryCrate
                                            ownedAlbums={collectionRecords}
                                            onAddToWishlist={handleAddRecord}
                                            userId={userId}
                                            viewingUserId={viewingUserId}
                                        />
                                    }
                                />
                            )}

                            {activeTab === Tab.STATS && <StatsView records={collectionRecords} />}
                        </>
                    )
                )}
            </main>

            {/* Mobile bottom-tab navigation */}
            {activeTab !== Tab.SHOWCASE && (
                <BottomNav
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                        setActiveTab(tab);
                        requestMotionPermission();
                    }}
                />
            )}

            {isSettingsOpen && currentUser && (
                <SettingsScreen
                    user={currentUser}
                    email={userEmail}
                    recordCount={collectionRecords.length}
                    onClose={() => setIsSettingsOpen(false)}
                    onOpenShare={() => setIsShareOpen(true)}
                    onEditAvatar={() => setIsPickerOpen(true)}
                    onChangePassword={handleChangePassword}
                    onUpdatePrefs={handleUpdatePrefs}
                    onChangeUsername={handleChangeUsername}
                    onDeleteAccount={handleDeleteAccount}
                    onLogout={() => {
                        setIsShareOpen(false);
                        setIsSettingsOpen(false);
                        handleLogout();
                    }}
                />
            )}

            {isShareOpen && currentUser && (
                <ShareSheet
                    user={currentUser}
                    records={collectionRecords}
                    onClose={() => setIsShareOpen(false)}
                    onToggleLive={() => handleUpdatePrefs({ is_public: currentUser.is_public === false })}
                />
            )}

            <AddRecordModal
                isOpen={isModalOpen || !!editingRecord}
                onClose={() => { setIsModalOpen(false); setEditingRecord(null); }}
                onSave={handleAddRecord}
                editingRecord={editingRecord}
                onUpdate={handleUpdateRecord}
                defaultStatus={activeTab === Tab.WISHLIST ? 'wishlist' : 'collection'}
            />

            <NowPlayingModal
                album={playingRecord}
                onClose={() => setPlayingRecord(null)}
            />

            {isScannerOpen && (
                <BarcodeScanner
                    onScan={handleScanResult}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}

            {isPickerOpen && (
                <AvatarPicker
                    currentSeed={currentUser?.avatar_icon || currentUser?.username || 'vinyl-fan'}
                    onClose={() => setIsPickerOpen(false)}
                    onSave={handleUpdateAvatar}
                />
            )}

            {isResetOpen && (
                <ResetPasswordModal
                    onClose={() => setIsResetOpen(false)}
                    onSuccess={() => {
                        setIsResetOpen(false);
                        toast.success('Password updated!');
                    }}
                />
            )}

            {showLoginModal && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                    onLogin={(user) => {
                        setUserId(user.id);
                        setIsLoggedIn(true);
                        setCurrentUser(user);
                        setShowLoginModal(false);
                        setViewingUserId(user.id);
                        toast.success(`Welcome back, ${user.username}!`);
                    }}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                danger={confirmModal.danger}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />

            <Toast toasts={toasts} onRemove={removeToast} />

        </div>
    );
};