import { TRIPLETEX_CONFIG } from '../config/tripletexConfig';

class TripletexService {
  constructor() {
    this.baseUrl = TRIPLETEX_CONFIG.BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${TRIPLETEX_CONFIG.CONSUMER_TOKEN}:${TRIPLETEX_CONFIG.EMPLOYEE_TOKEN}`)}`,
    };
  }

  async getSession() {
    try {
      const response = await fetch(`${this.baseUrl}/token/session`, {
        method: 'PUT',
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Feil ved opprettelse av Tripletex-sesjon:', error);
      throw error;
    }
  }

  async getResultReport(year, month) {
    try {
      const response = await fetch(`${this.baseUrl}/ledger/result/report/${year}/${month}`, {
        headers: this.headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Feil ved henting av resultatrapport:', error);
      throw error;
    }
  }

  // Legg til flere metoder for andre Tripletex API-kall
}

export default new TripletexService(); 