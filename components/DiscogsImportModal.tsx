import React, { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Album } from '../types';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';

interface DiscogsImportModalProps {
    records: Album[];
    userId: string;
    onClose: () => void;
    onImported: (count: number) => void;
}

interface ParsedRow {
    artist: string;
    title: string;
    year: string;
    addedAt: string;
}

// Minimal RFC-4180 CSV parser — handles quoted fields containing commas,
// escaped quotes, and newlines (album titles are full of all three)
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += c;
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.length > 1 || row[0] !== '') rows.push(row);
            row = [];
        } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

const dedupeKey = (artist: string, title: string) =>
    `${artist.toLowerCase().trim()}|${title.toLowerCase().trim()}`;

const CHUNK_SIZE = 100;

const DiscogsImportModal: React.FC<DiscogsImportModalProps> = ({ records, userId, onClose, onImported }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [newRows, setNewRows] = useState<ParsedRow[] | null>(null);
    const [skipped, setSkipped] = useState(0);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFile = async (file: File) => {
        setError(null);
        try {
            const rows = parseCsv(await file.text());
            if (rows.length < 2) {
                setError('That file looks empty.');
                return;
            }

            const header = rows[0].map(h => h.trim().toLowerCase());
            const artistIdx = header.indexOf('artist');
            const titleIdx = header.indexOf('title');
            const releasedIdx = header.indexOf('released');
            const dateAddedIdx = header.indexOf('date added');
            if (artistIdx === -1 || titleIdx === -1) {
                setError("This doesn't look like a Discogs export — no Artist/Title columns found.");
                return;
            }

            const existing = new Set(records.map(r => dedupeKey(r.artist, r.title)));
            const seen = new Set<string>();
            const parsed: ParsedRow[] = [];
            let dupes = 0;

            for (const row of rows.slice(1)) {
                // Discogs disambiguates artists as "Prince (2)" — strip the suffix
                const artist = (row[artistIdx] ?? '').replace(/\s*\(\d+\)$/, '').trim();
                const title = (row[titleIdx] ?? '').trim();
                if (!artist || !title) continue;

                const key = dedupeKey(artist, title);
                if (existing.has(key) || seen.has(key)) { dupes++; continue; }
                seen.add(key);

                const released = (row[releasedIdx] ?? '').trim();
                const year = /^\d{4}$/.test(released) ? released : 'Unknown';

                // Preserve the original "Date Added" so "since YYYY" stays honest
                const rawDate = (row[dateAddedIdx] ?? '').trim();
                const date = new Date(rawDate.replace(' ', 'T'));
                const addedAt = rawDate && !isNaN(date.getTime())
                    ? date.toISOString()
                    : new Date().toISOString();

                parsed.push({ artist, title, year, addedAt });
            }

            if (parsed.length === 0) {
                setError(dupes > 0
                    ? `All ${dupes} records in the file are already in your collection.`
                    : 'No records found in the file.');
                return;
            }

            setSkipped(dupes);
            setNewRows(parsed);
        } catch {
            setError("Couldn't read that file. Make sure it's the CSV from Discogs.");
        }
    };

    const runImport = async () => {
        if (!newRows) return;
        setImporting(true);
        setError(null);

        let inserted = 0;
        for (let i = 0; i < newRows.length; i += CHUNK_SIZE) {
            const chunk = newRows.slice(i, i + CHUNK_SIZE).map(r => ({
                title: r.title,
                artist: r.artist,
                genre: null,               // not in Discogs exports
                year: r.year,
                spine_color: '#222222',    // real color extracted once cover art arrives
                status: 'collection',
                added_at: r.addedAt,
                user_id: userId,
                cover_url: null,           // backfilled by the cover pipeline
            }));

            const { error: insertError } = await supabase.from('albums').insert(chunk);
            if (insertError) {
                setError(`Import stopped after ${inserted} records: ${insertError.message}`);
                setImporting(false);
                if (inserted > 0) onImported(inserted);
                return;
            }
            inserted += chunk.length;
            setProgress(inserted);
        }

        onImported(inserted);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[80] p-4 animate-fade-in-fast">
            <div className="bg-[#FDF6E3] bg-clip-padding p-6 rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#5e3f28]">
                <h2 className="text-xl font-black tracking-tight text-[#5e3f28] mb-1">Import from Discogs</h2>

                {!newRows ? (
                    <>
                        <p className="text-xs text-[#8B5E3C] mb-4">Bring your whole collection over in one go.</p>

                        <ol className="text-sm text-[#3e2b1c] mb-4 flex flex-col gap-2 list-decimal ml-5">
                            <li>On Discogs, open <span className="font-mono text-[13px] bg-[#e3dcd2] px-1.5 py-0.5 rounded">discogs.com/users/export</span></li>
                            <li>Choose <strong>Collection</strong> and request the export</li>
                            <li>Download the <strong>.csv</strong> when it's ready and drop it below</li>
                        </ol>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFile(file);
                            }}
                            className="border-2 border-dashed border-[#8B5E3C] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#e3dcd2]/50 transition-colors text-center"
                        >
                            <Upload size={28} strokeWidth={2} className="text-[#8B5E3C]" />
                            <p className="text-sm font-bold text-[#5e3f28]">Drop your Discogs CSV here</p>
                            <p className="text-xs text-[#8B5E3C]">or click to choose the file</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                                e.target.value = '';
                            }}
                        />
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2.5 bg-[#e3dcd2] border-2 border-[#5e3f28] rounded-xl p-3.5 my-4">
                            <FileText size={20} className="text-[#8B5E3C] flex-shrink-0" />
                            <div className="text-sm text-[#3e2b1c]">
                                <p className="font-bold">{newRows.length} record{newRows.length === 1 ? '' : 's'} ready to import</p>
                                {skipped > 0 && (
                                    <p className="text-xs text-[#8B5E3C] mt-0.5">{skipped} already in your collection — skipped</p>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-[#8B5E3C] mb-4">
                            Cover art and spine colors fill in automatically over the next few minutes.
                        </p>

                        {importing && (
                            <div className="mb-4">
                                <div className="h-2.5 rounded-full border border-[#5e3f28] overflow-hidden bg-[#e3dcd2]">
                                    <div
                                        className="h-full bg-[#D2691E] transition-all duration-300"
                                        style={{ width: `${Math.round((progress / newRows.length) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs font-mono text-[#8B5E3C] mt-1.5 text-center">
                                    {progress} / {newRows.length}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {error && <p className="text-red-600 text-sm mt-3 font-semibold">{error}</p>}

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={onClose}
                        disabled={importing}
                        className="px-4 py-2 rounded-lg border-2 border-[#5e3f28] font-bold text-sm text-[#5e3f28] hover:bg-[#e3dcd2] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    {newRows && (
                        <button
                            onClick={runImport}
                            disabled={importing}
                            className="px-4 py-2 rounded-lg bg-[#D2691E] hover:bg-[#A0522D] text-white font-bold text-sm border-2 border-[#5e3f28] shadow-[2px_2px_0px_0px_rgba(94,63,40,0.6)] transition-colors flex items-center gap-2 disabled:opacity-60"
                        >
                            <CheckCircle2 size={16} />
                            {importing ? 'Importing…' : `Import ${newRows.length}`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscogsImportModal;
