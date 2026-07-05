import React from 'react';
import { Album } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Disc, Mic2, Music2 } from 'lucide-react';

interface StatsViewProps {
  records: Album[];
}

const COLORS = ['#D2691E', '#CD853F', '#8B4513', '#A0522D', '#DEB887', '#5e3f28'];

const StatsView: React.FC<StatsViewProps> = ({ records }) => {
  
  // Calculate Genre Data
  const genreCounts = records.reduce((acc, record) => {
    acc[record.genre] = (acc[record.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genreData = Object.keys(genreCounts).map(key => ({
    name: key,
    value: genreCounts[key]
  })).sort((a, b) => b.value - a.value);

  // Calculate Decade Data
  const decadeCounts = records.reduce((acc, record) => {
    const decade = Math.floor(record.year / 10) * 10;
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const decadeData = Object.keys(decadeCounts).map(key => ({
    name: `${key}s`,
    count: decadeCounts[Number(key)]
  })).sort((a, b) => Number(a.name.slice(0, 4)) - Number(b.name.slice(0, 4)));

  if (records.length === 0) {
    return (
        <div className="flex items-center justify-center h-[50vh] text-[#8B5E3C]">
            <p className="text-xl">Add some records to see your stats!</p>
        </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* Overview Cards */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-[#fdf6e3] p-6 rounded-lg border-2 border-[#5e3f28] shadow-md flex items-center justify-between">
           <div>
              <p className="text-[#8B5E3C] text-sm uppercase font-bold tracking-wider">Total Records</p>
              <p className="text-4xl font-bold text-[#5e3f28]">{records.length}</p>
           </div>
           <div className="p-3 bg-[#e3dcd2] rounded-full text-[#5e3f28]"><Disc size={24} /></div>
        </div>
        <div className="bg-[#fdf6e3] p-6 rounded-lg border-2 border-[#5e3f28] shadow-md flex items-center justify-between">
           <div>
              <p className="text-[#8B5E3C] text-sm uppercase font-bold tracking-wider">Unique Artists</p>
              <p className="text-4xl font-bold text-[#5e3f28]">{new Set(records.map(r => r.artist)).size}</p>
           </div>
           <div className="p-3 bg-[#e3dcd2] rounded-full text-[#5e3f28]"><Mic2 size={24} /></div>
        </div>
        <div className="bg-[#fdf6e3] p-6 rounded-lg border-2 border-[#5e3f28] shadow-md flex items-center justify-between">
           <div>
              <p className="text-[#8B5E3C] text-sm uppercase font-bold tracking-wider">Top Genre</p>
              <p className="text-2xl font-bold text-[#5e3f28] truncate max-w-[150px]">{genreData[0]?.name || 'N/A'}</p>
           </div>
           <div className="p-3 bg-[#e3dcd2] rounded-full text-[#5e3f28]"><Music2 size={24} /></div>
        </div>
      </div>

      {/* Genre Distribution Chart */}
      <div className="bg-[#fdf6e3] p-6 rounded-lg border-2 border-[#5e3f28] shadow-md min-h-[400px]">
        <h3 className="text-xl font-bold text-[#5e3f28] mb-6 flex items-center gap-2">
            <Music2 className="text-[#D2691E]" /> Genre Breakdown
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genreData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fdf6e3" strokeWidth={2} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Eras/Decades Chart */}
      <div className="bg-[#fdf6e3] p-6 rounded-lg border-2 border-[#5e3f28] shadow-md min-h-[400px]">
        <h3 className="text-xl font-bold text-[#5e3f28] mb-6 flex items-center gap-2">
            <Disc className="text-[#D2691E]" /> Collection by Era
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={decadeData}>
              <XAxis dataKey="name" stroke="#8B5E3C" />
              <YAxis stroke="#8B5E3C" allowDecimals={false} />
              <Tooltip 
                 cursor={{fill: '#e3dcd2', opacity: 0.5}}
                 contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', color: '#333' }}
              />
              <Bar dataKey="count" fill="#D2691E" radius={[4, 4, 0, 0]} barSize={40}>
                {decadeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsView;