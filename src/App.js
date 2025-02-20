import React, { useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { msalConfig } from "./config/authConfig";
import ResourceCalendar from './components/ResourceCalendar';
import './styles/ResourceCalendar.css';
import ConfettiButton from './components/ConfettiButton';

const msalInstance = new PublicClientApplication(msalConfig);

// Graph API scopes
const scopes = [
  'User.Read',
  'Calendars.Read',
  'Calendars.Read.Shared'
];

// Retry configuration
const retryDelay = 1000; // 1 second
const maxRetries = 3;

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <MainContent />
    </MsalProvider>
  );
}

function MainContent() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [graphClient, setGraphClient] = useState(null);

  const getToken = async () => {
    try {
      const account = msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account! Verify a user has been signed in and setActiveAccount has been called.');
      }
      
      const response = await msalInstance.acquireTokenSilent({
        scopes: scopes,
        account: account
      });
      
      return response.accessToken;
    } catch (error) {
      console.error('Error getting token:', error);
      if (error instanceof InteractionRequiredAuthError) {
        try {
          await msalInstance.acquireTokenRedirect({
            scopes: scopes
          });
        } catch (redirectError) {
          console.error('Error during redirect:', redirectError);
          throw redirectError;
        }
      }
      throw error;
    }
  };

  const authProvider = async (callback) => {
    let attempts = 0;
    
    const tryRequest = async () => {
      try {
        const token = await getToken();
        return callback(token);
      } catch (error) {
        attempts++;
        if (attempts < maxRetries) {
          console.log(`Retry attempt ${attempts} after ${retryDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return tryRequest();
        }
        throw error;
      }
    };
    
    return tryRequest();
  };

  useEffect(() => {
    if (isAuthenticated && accounts[0]) {
      const client = Client.init({
        authProvider: async (done) => {
          try {
            const response = await getToken();
            done(null, response);
          } catch (error) {
            done(error, null);
          }
        }
      });
      setGraphClient(client);
    }
  }, [isAuthenticated, accounts, getToken]);

  const handleLogin = () => {
    try {
      console.log('Starter innlogging...');
      instance.loginRedirect({
        scopes: [
          "User.Read",
          "Calendars.Read",
          "Calendars.Read.Shared"
        ],
        prompt: "consent"
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  if (!isAuthenticated) {
    return (
      <button onClick={handleLogin}>
        Logg inn
      </button>
    );
  }

  return (
    <>
      <ConfettiButton />
      <div>
        <button onClick={handleLogout} style={{ position: 'absolute', top: '10px', right: '10px' }}>
          Logg ut
        </button>
        {graphClient ? <ResourceCalendar graphClient={graphClient} /> : <div>Laster...</div>}
      </div>
    </>
  );
}

export default App; 