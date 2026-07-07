export enum Tab {
    TILES = 'TILES',
    STATS = 'STATS',
    WISHLIST = 'WISHLIST',
    EXPLORE = 'EXPLORE',
    SHOWCASE = 'SHOWCASE'
}

export interface Album {
    id: string;
    title: string;
    artist: string;
    genre?: string;
    year?: number;
    spineColor: string;
    status?: string;
    addedAt: string;
    userId: string;
    coverUrl?: string | null;
}

export interface VaultUser {
    id: string;
    username: string;
    password_hash: string;
    created_at: string;
}

export interface User {
    id: string;
    username: string;
    avatar_icon?: string;
    record_count?: number;
    is_public?: boolean;
    pref_showcase?: boolean;
    pref_shake?: boolean;
    pref_opening_tab?: string;
}

export interface NewAlbumInput {
    title: string;
    artist: string;
    genre: string;
    year: string;
    spineColor: string;
    status: 'collection' | 'wishlist';
    coverUrl?: string | null;
}

export interface Recommendation {
    title: string;
    artist: string;
    reason: string;
    genre: string;
    year: number;
    spineColor: string;
}