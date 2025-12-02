import React, { useState } from 'react';
import { MeterReading } from '../types';
import { Clock, MapPin, CheckCircle, X, Save, Trash2, ChevronLeft, User } from 'lucide-react';

interface DateFilter {
  start: number;
  end: number;
  label: string;
}

interface HistoryProps {
  readings: MeterReading[];
  onEdit?: (id: string, updates: Partial<MeterReading>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  dateFilter?: DateFilter | null;
  onClearFilter?: () => void;
}

export const History: React.FC<HistoryProps> = ({ readings, onEdit, onDelete, dateFilter, onClearFilter }) => {
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter readings by date if filter is set
  const filteredReadings = dateFilter
    ? readings.filter(r => r.timestamp >= dateFilter.start && r.timestamp <= dateFilter.end)
    : readings;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenEdit = (reading: MeterReading) => {
    setEditingReading(reading);
    setEditValue(reading.value);
    setEditLocation(reading.location || '');
  };

  const handleSave = async () => {
    if (!editingReading || !onEdit) return;
    setSaving(true);
    await onEdit(editingReading.id, { value: editValue, location: editLocation });
    setSaving(false);
    setEditingReading(null);
  };

  const handleDelete = async () => {
    if (!editingReading || !onDelete) return;
    if (confirm('Delete this reading?')) {
      setSaving(true);
      await onDelete(editingReading.id);
      setSaving(false);
      setEditingReading(null);
    }
  };

  return (
    <div className="p-4">
      {/* Header with filter info */}
      <div className="flex items-center justify-between mb-4">
        {dateFilter ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearFilter}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{dateFilter.label}</h2>
              <p className="text-sm text-slate-400">{filteredReadings.length} reading{filteredReadings.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ) : (
          <h2 className="text-xl font-bold text-white">Recent Scans</h2>
        )}
      </div>

      {/* Edit Modal */}
      {editingReading && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Edit Reading</h3>
              <button onClick={() => setEditingReading(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {editingReading.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={editingReading.imageUrl} alt="Meter" className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reading Value</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono text-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
                {editLocation && editLocation.includes(',') && (
                  <a
                    href={`https://www.google.com/maps?q=${editLocation}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary text-sm mt-2 hover:underline"
                  >
                    <MapPin size={14} className="mr-1" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 bg-red-500/20 text-red-400 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-500/30"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-primaryDark disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredReadings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {dateFilter ? 'No readings for this day.' : 'No readings yet. Tap Scan to start.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReadings.map((reading) => (
            <div
              key={reading.id}
              onClick={() => handleOpenEdit(reading)}
              className="bg-surface border border-slate-700 rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:border-slate-600 active:scale-[0.98] transition-all"
            >
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
                
                <div className="flex flex-wrap items-center text-slate-400 text-xs mt-2 gap-x-3 gap-y-1">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {formatDate(reading.timestamp)}
                  </div>
                  {reading.location && reading.location.includes(',') ? (
                    <a
                      href={`https://www.google.com/maps?q=${reading.location}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center text-primary hover:underline"
                    >
                      <MapPin size={12} className="mr-1" />
                      View Map
                    </a>
                  ) : (
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {reading.location || 'Unknown'}
                    </div>
                  )}
                  {reading.recordedBy && (
                    <div className="flex items-center">
                      <User size={12} className="mr-1" />
                      {reading.recordedBy.displayName || reading.recordedBy.email.split('@')[0]}
                    </div>
                  )}
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