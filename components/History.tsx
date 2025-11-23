import React from 'react';
import { MeterReading } from '../types';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

interface HistoryProps {
  readings: MeterReading[];
}

export const History: React.FC<HistoryProps> = ({ readings }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-4">Recent Scans</h2>
      
      {readings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No readings yet. Tap Scan to start.
        </div>
      ) : (
        <div className="space-y-3">
          {readings.map((reading) => (
            <div key={reading.id} className="bg-surface border border-slate-700 rounded-xl p-4 flex items-center space-x-4">
              {/* Thumbnail */}
              <div className="h-16 w-16 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-slate-600">
                {reading.imageUrl ? (
                  <img src={reading.imageUrl} alt="Meter" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-600">No Img</div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-mono font-bold text-white tracking-widest">{reading.value}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${reading.confidence > 90 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {reading.confidence}%
                  </span>
                </div>
                
                <div className="flex items-center text-slate-400 text-xs mt-2 space-x-3">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {formatDate(reading.timestamp)}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={12} className="mr-1" />
                    {reading.location || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Sync Status */}
              <div className="text-primary">
                <CheckCircle size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};