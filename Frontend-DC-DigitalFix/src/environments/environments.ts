/**
 * Configuración única de la aplicación.
 * NO contiene secretos: clientId y tenantId son identificadores públicos.
 * El client secret vive sólo en Azure y se usa para pruebas desde Postman.
 */
export const environment = {
  production: false,

  azure: {
    // App Registration de la SPA "frontend"
    clientId: '74966acc-6d78-4632-b650-b92f1c792bf9',

    // Tenant gozalo23
    tenantId: 'a6a0c27e-18a7-4209-bd1b-32338be5cb66',
    authority: 'https://login.microsoftonline.com/a6a0c27e-18a7-4209-bd1b-32338be5cb66',

    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',

    // App Registration de la API "DigitalFix_api_backend"
    apiClientId: '8e5e408b-c101-4bc1-a5d3-01f702720462',

    // Claim "aud" que llevara el access token
    apiAudience: 'api://8e5e408b-c101-4bc1-a5d3-01f702720462',

    // Scopes delegados expuestos por la API
    apiScopes: [
      'api://8e5e408b-c101-4bc1-a5d3-01f702720462/OT.Read',
      'api://8e5e408b-c101-4bc1-a5d3-01f702720462/OT.Create',
    ],
  },

  // EP1: BFF local. EP2: reemplazar por la URL del API Gateway.
  apiBaseUrl: 'http://localhost:8080',
};

/**
 * App Roles definidos en el registro de la API.
 * Llegan en el claim "roles" del ACCESS TOKEN, no del ID token.
 */
export const ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  CLIENTE: 'Cliente',
  AUDITOR: 'Auditor',
} as const;