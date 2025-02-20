import React, { useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { msalConfig } from "./config/authConfig";
import ResourceCalendar from './components/ResourceCalendar';
import './styles/ResourceCalendar.css';
import ConfettiButton from './components/ConfettiButton';

const msalInstance = new PublicClientApplication(msalConfig);

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
    const request = {
      scopes: [
        "User.Read",
        "Calendars.Read",
        "Calendars.Read.Shared"
      ],
      account: accounts[0]
    };

    try {
      return await instance.acquireTokenSilent(request);
    } catch (error) {
      if (error.name === "InteractionRequiredAuthError") {
        return await instance.acquireTokenPopup(request);
      }
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated && accounts[0]) {
      const client = Client.init({
        authProvider: async (done) => {
          try {
            const response = await getToken();
            done(null, response.accessToken);
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