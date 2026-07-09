import React, { useState } from 'react';
import { Album } from '../types';
import {
    Search,
    Plus,
    Trash2,
    FolderInput,
    Barcode,
    Pencil,
} from 'lucide-react';

interface TileViewProps {
    records: Album[];
    title: string;
    meta?: string;
    onAddClick: () => void;
    onScanClick: () => void;
    onDelete: (id: string) => void;
    onRecordClick: (album: Album) => void;
    isAdmin: boolean;
    onLoginClick: () => void;
    userId: string | null;
    viewingUserId: string | null;
    onMoveToCollection?: (album: Album) => void;
    onEdit?: (album: Album) => void;
    beforeGridContent?: React.ReactNode;
    afterGridContent?: React.ReactNode;
}

// ─── Single card ──────────────────────────────────────────────────────────────

interface RecordCardProps {
    record: Album;
    isAdmin: boolean;
    onRecordClick: (album: Album) => void;
    onDelete: (id: string) => void;
    onMoveToCollection?: (album: Album) => void;
    onEdit?: (album: Album) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({
                                                   record,
                                                   isAdmin,
                                                   onRecordClick,
                                                   onDelete,
                                                   onMoveToCollection,
                                                   onEdit,
                                               }) => {
    const [imgError, setImgError] = useState(false);
    const hasCover = !!record.coverUrl && !imgError;

    return (
        <div
            onClick={() => onRecordClick(record)}
            className="group relative rounded-xl border-2 border-[#5e3f28] shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(94,63,40,0.9)] transition-all duration-200"
            style={{ aspectRatio: '0.78' }}
        >
            {/* ── Background: cover art or spine color fallback ── */}
            {hasCover ? (
                <img
                    src={record.coverUrl!}
                    alt={record.title}
                    onError={() => setImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: record.spineColor }}
                />
            )}

            {/* ── Gradient overlay ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* ── Year badge ── */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/20 text-[10px] font-mono text-white/80 z-10">
                {record.year}
            </div>

            {/* ── Admin buttons — appear on hover ── */}
            {isAdmin && (
                <div className="absolute top-2.5 left-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    {onMoveToCollection && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveToCollection(record); }}
                            className="p-1.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-[#D2691E] hover:border-[#D2691E] transition-colors"
                            title="Add to Collection"
                        >
                            <FolderInput size={12} />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(record); }}
                            className="p-1.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-[#8B5E3C] hover:border-[#8B5E3C] transition-colors"
                            title="Edit Record"
                        >
                            <Pencil size={12} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(record.id); }}
                        className="p-1.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-red-700 hover:border-red-700 transition-colors"
                        title="Remove Record"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {/* ── Text info over gradient ── */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                {/* Imported records may have no genre yet — skip the empty pill */}
                {record.genre && (
                    <div className="mb-1.5">
                        <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border border-white/20 text-white/65 bg-black/30">
                            {record.genre}
                        </span>
                    </div>
                )}
                <h3
                    className="font-black text-white leading-tight line-clamp-2 capitalize mb-1"
                    style={{ fontSize: '15px', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
                >
                    {record.title}
                </h3>
                <p
                    className="font-medium text-white/70 truncate capitalize"
                    style={{ fontSize: '12px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                    {record.artist}
                </p>
            </div>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TileView: React.FC<TileViewProps> = ({
                                               records,
                                               onAddClick,
                                               onScanClick,
                                               onDelete,
                                               onRecordClick,
                                               onMoveToCollection,
                                               onEdit,
                                               beforeGridContent,
                                               afterGridContent,
                                               title,
                                               meta,
                                               isAdmin,
                                               onLoginClick,
                                               userId,
                                               viewingUserId,
                                           }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecords = records.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">

            {/* Top bar */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B5E3C]">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search your collection..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#8B5E3C]/30 bg-[#FDF6E3] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-[#5e3f28] placeholder-[#8B5E3C]/50 shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={userId && viewingUserId === userId ? onScanClick : onLoginClick}
                        title={userId ? 'Scan Barcode' : 'Log in to scan barcodes'}
                        className={`p-3 rounded-lg font-bold shadow-md border-2 border-[#5e3f28] transition-transform flex items-center justify-center
                            ${userId && viewingUserId === userId
                            ? 'bg-[#D2691E] hover:bg-[#A0522D] text-white hover:scale-105 active:scale-95'
                            : 'bg-[#d4c5a9] text-[#8B5E3C] cursor-not-allowed opacity-60'
                        }`}
                    >
                        <Barcode size={24} />
                    </button>

                    <button
                        onClick={userId && viewingUserId === userId ? onAddClick : onLoginClick}
                        title={userId ? 'Add Record' : 'Log in to add records'}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold border-2 border-[#5e3f28] transition-all flex items-center justify-center gap-2
                            ${userId && viewingUserId === userId
                            ? 'bg-[#D2691E] hover:bg-[#A0522D] text-white shadow-[2px_2px_0px_0px_rgba(94,63,40,1)] hover:scale-105 active:scale-95'
                            : 'bg-[#d4c5a9] text-[#8B5E3C] cursor-not-allowed opacity-60 shadow-none'
                        }`}
                    >
                        <Plus size={20} />
                        Add Record
                    </button>
                </div>
            </div>

            {beforeGridContent}

            {title && (
                <div className="mb-6 mt-8 border-b-2 border-[#5e3f28]/10 pb-4">
                    <h2 className="text-2xl font-bold text-[#5e3f28]">{title}</h2>
                    {meta && (
                        <p className="text-xs font-mono text-[#8B5E3C] mt-1">{meta}</p>
                    )}
                </div>
            )}

            {filteredRecords.length === 0 ? (
                <div className="text-center py-10 text-[#8B5E3C]/60 italic">
                    {onMoveToCollection ? 'Your wishlist is empty.' : 'No records found.'}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredRecords.map((record) => (
                        <RecordCard
                            key={record.id}
                            record={record}
                            isAdmin={isAdmin}
                            onRecordClick={onRecordClick}
                            onDelete={onDelete}
                            onMoveToCollection={onMoveToCollection}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}

            {afterGridContent}
        </div>
    );
};

export default TileView;