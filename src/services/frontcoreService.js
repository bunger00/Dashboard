import { frontcoreConfig } from '../config/frontcoreConfig';

// Enkel cache implementasjon
let courseCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutter
};

export const frontcoreService = {
  async hentNesteKurs() {
    try {
      // Sjekk cache først
      if (courseCache.data && courseCache.timestamp && 
          (Date.now() - courseCache.timestamp < courseCache.CACHE_DURATION)) {
        console.log('Returnerer cachet kursdata');
        return courseCache.data;
      }

      console.log('Starter API-kall til Frontcore...');
      
      const response = await fetch('/api/frontcore/nextcoursedates', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers));

      const text = await response.text();
      console.log('Raw API Response:', text);

      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${text}`);
      }

      const data = JSON.parse(text);
      console.log('Parsed API Response:', data);

      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      // Filtrer og sorter kursene
      const aktiveKurs = Array.isArray(data) ? data : [];
      console.log('Antall aktive kurs funnet:', aktiveKurs.length);

      const filtrerte = aktiveKurs
        .filter(kurs => new Date(kurs.start_at) >= new Date())
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
        .slice(0, 10);

      console.log('Antall filtrerte kurs:', filtrerte.length);

      // Oppdater cache
      courseCache.data = filtrerte;
      courseCache.timestamp = Date.now();

      return filtrerte;
    } catch (error) {
      console.error('Detaljert feil ved henting av kurs:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }
}; 