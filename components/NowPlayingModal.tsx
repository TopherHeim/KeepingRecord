import React, { useState, useEffect } from 'react';
import { Album } from '../types';
import { X, Music, Calendar, Disc } from 'lucide-react';

interface NowPlayingModalProps {
    album: Album | null;
    onClose: () => void;
}

const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ album, onClose }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (!album) return;

        const preventDefault = (e: TouchEvent) => e.preventDefault();

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.addEventListener('touchmove', preventDefault, { passive: false });

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.removeEventListener('touchmove', preventDefault);
        };
    }, [album]);

    if (!album) return null;

    const hasCover = !!album.coverUrl && !imgError;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-[#fdf6e3] bg-clip-padding rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-8 border-[#5e3f28] flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-[#5e3f28]/10 hover:bg-[#5e3f28] text-[#5e3f28] hover:text-[#FDF6E3] rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                {/* ── Left side: turntable ── */}
                <div className="w-full md:w-1/2 p-8 flex items-center justify-center relative overflow-hidden" style={{ minHeight: '220px' }}>

                    {hasCover ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${album.coverUrl})` }}
                            />
                            <div className="absolute inset-0 bg-black/60" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-[#4a3b2a]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.3),_rgba(0,0,0,0.1))]" />
                        </div>
                    )}

                    {/* Spinning record */}
                    <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-black shadow-2xl flex items-center justify-center animate-[spin_3s_linear_infinite] border-2 border-[#111] z-10">
                        <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#222_0,#222_2px,#111_3px,#111_4px)] opacity-90" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                        <div
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] border-black/20 relative z-10 flex items-center justify-center shadow-inner overflow-hidden"
                            style={hasCover ? {} : { backgroundColor: album.spineColor }}
                        >
                            {hasCover ? (
                                <img
                                    src={album.coverUrl!}
                                    alt={`${album.title} cover`}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="text-[8px] font-mono text-white/60 text-center leading-tight opacity-80 transform rotate-180 mix-blend-overlay">
                                    SIDE A <br /> STEREO
                                </div>
                            )}
                        </div>

                        <div className="w-3 h-3 rounded-full absolute z-20 shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-gradient-to-br from-white to-gray-500" />
                    </div>
                </div>

                {/* ── Right side: info ── */}
                <div className="w-full md:w-1/2 p-6 md:p-7 flex flex-col justify-center bg-[#fdf6e3] relative">
                    <Disc className="absolute -right-10 -bottom-10 text-[#5e3f28]/5 w-56 h-56 pointer-events-none" />

                    <div className="space-y-1 mb-5 relative z-10">
                        <div className="inline-block px-3 py-1 bg-[#D2691E] text-white text-[10px] font-bold tracking-widest uppercase rounded-full mb-2">
                            Now Playing
                        </div>
                        <h2 className="text-3xl font-black text-[#3e2b1c] leading-none capitalize tracking-tight line-clamp-3">
                            {album.title}
                        </h2>
                        <p className="text-lg font-medium text-[#8B5E3C] capitalize border-b-2 border-[#5e3f28]/10 pb-3">
                            {album.artist}
                        </p>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3 text-[#5e3f28]">
                            <Music size={18} className="text-[#D2691E]" />
                            <span className="font-bold text-base tracking-tight">{album.genre}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#5e3f28]">
                            <Calendar size={18} className="text-[#D2691E]" />
                            <span className="font-bold text-base tracking-tight">{album.year}</span>
                        </div>

                        {album.description && (
                            <div className="mt-3 p-3 bg-[#f4ebd6] rounded-lg border border-[#d4c5a9] text-[#5e3f28] text-xs italic leading-relaxed line-clamp-3">
                                "{album.description}"
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NowPlayingModal;