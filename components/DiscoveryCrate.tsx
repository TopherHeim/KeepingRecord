
import React, { useState } from 'react';
import { Loader2, Plus, Disc, Music, Calendar } from 'lucide-react';
import { Recommendation, NewAlbumInput } from '../types';
import { getAIRecommendations } from '../services/geminiService';

interface DiscoveryCrateProps {
  ownedAlbums: {title: string, artist: string}[];
  onAddToWishlist: (input: NewAlbumInput) => void;
  userId?: string;
  viewingUserId?: string;
}

const DiscoveryCrate: React.FC<DiscoveryCrateProps> = ({ ownedAlbums, onAddToWishlist, userId, viewingUserId }) => {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDig = async () => {
    setLoading(true);
    const results = await getAIRecommendations(ownedAlbums);
    setRecs(results);
    setLoading(false);
  };

  const handleQuickAdd = (rec: Recommendation) => {
    onAddToWishlist({
      title: rec.title,
      artist: rec.artist,
      genre: rec.genre,
      year: rec.year.toString(),
      spineColor: rec.spineColor,
      status: 'wishlist'
    });
    setRecs(prev => prev.filter(r => r.title !== rec.title));
  };

  return (
    <div className="mt-16 mb-12">
      <div className="flex items-center justify-between mb-6 border-b-2 border-[#5e3f28]/10 pb-4">
        <h2 className="text-2xl font-bold text-[#5e3f28]">
          Recommendations
        </h2>
        <button 
          onClick={handleDig}
          disabled={loading || ownedAlbums.length === 0}
          className="bg-[#D2691E] hover:bg-[#A0522D] text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 text-xs disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Disc size={14} />}
          {recs.length > 0 ? "Refresh Suggestions" : "Get AI Suggestions"}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 bg-[#e3dcd2]/50 rounded-xl border-2 border-dashed border-[#8B5E3C]/20">
          <Loader2 size={32} className="text-[#D2691E] animate-spin" />
          <p className="text-[#5e3f28] text-sm font-medium">Analyzing your collection...</p>
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recs.map((rec, i) => (
            <div 
              key={i} 
              className="group relative bg-[#e3dcd2] bg-clip-padding rounded-lg shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] border-2 border-[#5e3f28] overflow-hidden transition-all duration-200"
            >
              <div className="flex h-32">
                <div className="w-1/3 bg-[#d4c5a9] relative flex items-center justify-center border-r-2 border-[#5e3f28] overflow-hidden">
                  <div className="relative w-20 h-20 bg-black rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: rec.spineColor }}></div>
                    <div className="w-1 h-1 bg-white rounded-full absolute"></div>
                  </div>
                </div>

                <div className="w-2/3 p-4 flex flex-col justify-center bg-[#fdf6e3]">
                  <h3 className="font-bold text-lg leading-tight text-[#3e2b1c] line-clamp-2 capitalize">{rec.title}</h3>
                  <p className="text-[#8B5E3C] font-medium text-sm mt-1 truncate capitalize">{rec.artist}</p>
                </div>
              </div>

              <div className="relative z-20 bg-[#dccfb9] px-4 py-2 border-t-2 border-[#5e3f28] flex justify-between items-center text-xs text-[#5e3f28] font-mono">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1"><Music size={12} /> {rec.genre}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {rec.year}</span>
                </div>
                  {userId && viewingUserId && userId === viewingUserId && (
                      <button
                          onClick={() => handleQuickAdd(rec)}
                          className="bg-[#D2691E] hover:bg-[#A0522D] text-white p-2 rounded-full shadow transition-colors"
                          title="Add to Wishlist"
                      >
                          <Plus size={16} />
                      </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && recs.length === 0 && ownedAlbums.length > 0 && (
          <p className="text-center py-6 text-[#8B5E3C] italic text-sm">Click "Get AI Suggestions" To View Recommendations</p>
      )}
    </div>
  );
};

export default DiscoveryCrate;
