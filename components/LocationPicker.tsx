
import React, { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  locationName?: string;
  onChange: (lat: number, lng: number, name?: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ lat = 39.9042, lng = 116.4074, locationName = '', onChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState(locationName);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    leafletMapRef.current = map;
    markerRef.current = marker;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map if parent props change externally
  useEffect(() => {
    if (leafletMapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        leafletMapRef.current.setView([lat, lng], 13);
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        onChange(newLat, newLng, result.display_name);
        setSearchQuery(result.display_name);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentPosition = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        onChange(position.coords.latitude, position.coords.longitude, '当前位置');
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#434343] dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            placeholder="搜索地点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
          />
          <i className={`fas ${isSearching ? 'fa-circle-notch animate-spin' : 'fa-search'} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}></i>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 dark:bg-[#262626] border border-gray-300 dark:border-[#434343] rounded-lg text-xs font-bold hover:bg-gray-200 dark:text-gray-200 transition-colors"
        >
          搜索
        </button>
        <button
          type="button"
          onClick={handleCurrentPosition}
          title="获取当前位置"
          className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-colors"
        >
          <i className="fas fa-location-crosshairs"></i>
        </button>
      </div>
      <div className="h-[200px] border border-gray-200 dark:border-[#434343] rounded-xl overflow-hidden relative shadow-inner">
        <div ref={mapRef} className="w-full h-full"></div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">纬度</label>
          <input readOnly type="text" className="w-full bg-gray-50 dark:bg-black/20 border border-transparent dark:text-gray-300 text-xs py-1.5 px-3 rounded font-mono" value={lat.toFixed(6)} />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">经度</label>
          <input readOnly type="text" className="w-full bg-gray-50 dark:bg-black/20 border border-transparent dark:text-gray-300 text-xs py-1.5 px-3 rounded font-mono" value={lng.toFixed(6)} />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
