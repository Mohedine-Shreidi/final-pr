import { useJsApiLoader } from '@react-google-maps/api';
import { createContext, useContext, type ReactNode } from 'react';

const libraries: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry'];

interface MapContextType {
  isLoaded: boolean;
  hasKey: boolean;
}

const MapContext = createContext<MapContextType>({ isLoaded: false, hasKey: false });

export function useMapContext() {
  return useContext(MapContext);
}

export function MapProvider({ children }: { children: ReactNode }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasKey = apiKey.length > 0;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  return (
    <MapContext.Provider value={{ isLoaded: hasKey && isLoaded, hasKey }}>
      {children}
    </MapContext.Provider>
  );
}
