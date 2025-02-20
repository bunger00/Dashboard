export const TRIPLETEX_CONFIG = {
  BASE_URL: 'https://tripletex.no/v2',
  CONSUMER_TOKEN: 'din_consumer_token',
  EMPLOYEE_TOKEN: 'din_employee_token',
  // Legg til andre nødvendige konfigurasjonsverdier
};

export const tripletexConfig = {
  baseUrl: 'https://tripletex.no/v2',
  consumerToken: 'LIMER_INN_CONSUMER_TOKEN_HER',
  employeeToken: 'LIMER_INN_EMPLOYEE_TOKEN_HER',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Hjelpefunksjon for å hente session token
export const hentTripletexToken = async () => {
  try {
    const response = await fetch(`${tripletexConfig.baseUrl}/token/session/:create`, {
      method: 'PUT',
      headers: {
        ...tripletexConfig.headers,
        'Authorization': `Basic ${btoa(`${tripletexConfig.consumerToken}:${tripletexConfig.employeeToken}`)}`
      }
    });

    if (!response.ok) {
      throw new Error('Feil ved henting av token');
    }

    const data = await response.json();
    return data.value.token;
  } catch (error) {
    console.error('Feil ved autentisering:', error);
    throw error;
  }
}; 