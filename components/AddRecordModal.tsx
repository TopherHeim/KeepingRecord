import React, { useState, useEffect, useRef } from 'react';
import { Album, NewAlbumInput } from '../types';
import { X, Loader2, Save, Disc, Heart } from 'lucide-react';
import { getDominantColor } from '../services/dominantColor';
import { API_BASE } from '../services/apiBase';

interface AddRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (album: NewAlbumInput) => void;
    defaultStatus?: 'collection' | 'wishlist';
    editingRecord?: Album | null;
    onUpdate?: (id: string, album: NewAlbumInput) => void;
}

const fetchDiscogsMetadata = async (
    artist: string,
    title: string,
    barcode?: string // Added barcode support
): Promise<{
    year?: string;
    genre?: string;
    coverUrl?: string;
    artist?: string;
    title?: string;
} | null> => {
    try {
        // Build the query: barcode gets the dedicated Discogs barcode search,
        // otherwise search by artist/album
        const query = barcode
            ? `barcode=${encodeURIComponent(barcode)}`
            : `artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(title)}`;

        const res = await fetch(`${API_BASE}/.netlify/functions/discogs-proxy?${query}`);
        if (!res.ok) return null;

        const data = await res.json();

        // FIX: Your proxy now returns the record directly at the top level,
        // not inside a 'results' array.
        if (data.results && data.results.length === 0) return null;

        const coverUrl = data.cover_image && !data.cover_image.includes('spacer.gif')
            ? data.cover_image
            : undefined;

        return {
            artist: data.canonicalArtist || data.artist || artist,
            title: data.canonicalAlbum || data.title || title,
            year: data.year?.toString() || '',
            genre: Array.isArray(data.genre) ? data.genre[0] : (data.genre || data.style?.[0] || ''),
            coverUrl,
        };
    } catch (error) {
        console.error("Metadata fetch error:", error);
        return null;
    }
};

const AddRecordModal: React.FC<AddRecordModalProps> = ({ isOpen, onClose, onSave, defaultStatus = 'collection', editingRecord = null, onUpdate }) => {
    const [formData, setFormData] = useState<NewAlbumInput>({
        title: '',
        artist: '',
        genre: '',
        year: '',
        spineColor: '#222222',
        status: defaultStatus,
        coverUrl: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (editingRecord) {
            setFormData({
                title: editingRecord.title,
                artist: editingRecord.artist,
                genre: editingRecord.genre || '',
                year: editingRecord.year ? String(editingRecord.year) : '',
                spineColor: editingRecord.spineColor || '#222222',
                status: editingRecord.status === 'wishlist' ? 'wishlist' : 'collection',
                coverUrl: editingRecord.coverUrl || '',
            });
        } else {
            setFormData({
                title: '',
                artist: '',
                genre: '',
                year: '',
                spineColor: '#222222',
                status: defaultStatus,
                coverUrl: '',
            });
        }
    }, [isOpen, editingRecord, defaultStatus]);

    useEffect(() => {
        // Don't auto-canonicalize while editing — the user is deliberately
        // correcting fields, and a Discogs lookup would overwrite their input
        if (editingRecord) return;
        if (!formData.artist.trim() || !formData.title.trim()) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setIsAutoFilling(true);
            const result = await fetchDiscogsMetadata(formData.artist.trim(), formData.title.trim());
            setIsAutoFilling(false);

            if (result) {
                setFormData(prev => ({
                    ...prev,
                    artist: result.artist || prev.artist, // This fixes the typos in the UI
                    title: result.title || prev.title,
                    year: prev.year || result.year || '',
                    genre: prev.genre || result.genre || '',
                    coverUrl: prev.coverUrl || result.coverUrl || '',
                }));
            }
        }, 1200);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [formData.artist, formData.title, editingRecord]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        let finalData = { ...formData };

        if (editingRecord && onUpdate) {
            const identityChanged =
                finalData.artist.trim().toLowerCase() !== editingRecord.artist.trim().toLowerCase() ||
                finalData.title.trim().toLowerCase() !== editingRecord.title.trim().toLowerCase();

            // If it's now a different album, the old cover art and spine
            // color are wrong — look everything up fresh
            if (identityChanged) {
                const result = await fetchDiscogsMetadata(finalData.artist.trim(), finalData.title.trim());
                finalData = {
                    ...finalData,
                    artist: result?.artist || finalData.artist,
                    title: result?.title || finalData.title,
                    year: finalData.year || result?.year || '',
                    genre: finalData.genre || result?.genre || '',
                    coverUrl: result?.coverUrl || '',
                };
                finalData.spineColor = finalData.coverUrl
                    ? await getDominantColor(finalData.coverUrl)
                    : '#222222';
            }

            onUpdate(editingRecord.id, finalData);

            setIsLoading(false);
            onClose();
            return;
        }

        if (!finalData.year || !finalData.genre || !finalData.coverUrl) {
            const result = await fetchDiscogsMetadata(finalData.artist, finalData.title);
            if (result) {
                finalData = {
                    ...finalData,
                    year: finalData.year || result.year || '',
                    genre: finalData.genre || result.genre || '',
                    coverUrl: finalData.coverUrl || result.coverUrl || '',
                };
            }
        }

        if (finalData.coverUrl) {
            const dominantColor = await getDominantColor(finalData.coverUrl);
            finalData = { ...finalData, spineColor: dominantColor };
        }

        onSave(finalData);

        setFormData({
            title: '',
            artist: '',
            genre: '',
            year: '',
            spineColor: '#222222',
            status: 'collection',
            coverUrl: ''
        });

        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#fdf6e3] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-[#5e3f28]">

                {/* Header */}
                <div className="bg-[#5e3f28] text-[#FDF6E3] px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-wide">{editingRecord ? 'Edit Record' : 'Add New Record'}</h2>
                    <button onClick={onClose} className="hover:text-[#D2691E] transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Status Toggle */}
                    <div className="flex bg-[#e3dcd2] p-1 rounded-lg border border-[#d4c5a9]">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 'collection'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${formData.status === 'collection' ? 'bg-[#D2691E] text-white font-bold shadow-md' : 'text-[#5e3f28]'}`}
                        >
                            <Disc size={16} /> Collection
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 'wishlist'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${formData.status === 'wishlist' ? 'bg-[#D2691E] text-white font-bold shadow-md' : 'text-[#5e3f28]'}`}
                        >
                            <Heart size={16} /> Wishlist
                        </button>
                    </div>

                    {/* Cover + inputs — cover height matches the two stacked inputs exactly */}
                    <div className="flex gap-4 items-stretch">

                        {/* Cover preview — stretches to match input column height */}
                        <div className="rounded-lg border-2 border-[#5e3f28] bg-[#d4c5a9] flex items-center justify-center flex-shrink-0 overflow-hidden w-[88px] self-stretch">
                            {formData.coverUrl ? (
                                <img
                                    src={formData.coverUrl}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                                    <div className="w-5 h-5 bg-[#D2691E] rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Artist + Title stacked */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-bold text-[#5e3f28] mb-1">Artist / Band</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.artist}
                                    onChange={(e) => setFormData({...formData, artist: e.target.value})}
                                    className="w-full px-3 py-2 rounded border-2 border-[#d4c5a9] bg-white text-[#5e3f28] focus:border-[#D2691E] outline-none text-sm"
                                    placeholder="e.g. Led Zeppelin"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5e3f28] mb-1">Album Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full px-3 py-2 rounded border-2 border-[#d4c5a9] bg-white text-[#5e3f28] focus:border-[#D2691E] outline-none text-sm"
                                    placeholder="e.g. IV"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Discogs status — only renders when there's something to show, no reserved space */}
                    {isAutoFilling && (
                        <p className="text-xs text-[#8B5E3C] flex items-center gap-1 animate-pulse">
                            <Loader2 size={11} className="animate-spin" /> Looking up on Discogs...
                        </p>
                    )}
                    {!isAutoFilling && formData.coverUrl && (
                        <p className="text-xs text-green-700 flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                            Cover art and metadata found
                        </p>
                    )}

                    {/* Genre + Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#5e3f28] mb-1">Genre</label>
                            <input
                                type="text"
                                value={formData.genre}
                                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                                className="w-full px-3 py-2 rounded border-2 border-[#d4c5a9] bg-white text-[#5e3f28] focus:border-[#D2691E] outline-none text-sm"
                                placeholder="Genre"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5e3f28] mb-1">Year</label>
                            <input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({...formData, year: e.target.value})}
                                className="w-full px-3 py-2 rounded border-2 border-[#d4c5a9] bg-white text-[#5e3f28] focus:border-[#D2691E] outline-none text-sm"
                                placeholder="Year"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-[#d4c5a9]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg font-medium text-[#5e3f28] hover:bg-[#e3dcd2] transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#D2691E] text-white rounded-lg font-bold hover:bg-[#A0522D] shadow-md flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {editingRecord
                                ? 'Save Changes'
                                : formData.status === 'collection' ? 'Add to Vault' : 'Add to Wishlist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRecordModal;