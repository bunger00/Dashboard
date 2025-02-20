export const msalConfig = {
  auth: {
    clientId: "3c505e57-4b6c-4118-9dd5-566660ff3bd9",
    authority: "https://login.microsoftonline.com/leancommunications.no",
    redirectUri: "https://lean-dashboard.netlify.app"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/users"
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "Calendars.Read",
    "Calendars.Read.Shared"
  ]
}; 