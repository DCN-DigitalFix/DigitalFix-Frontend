/**
 * Configuración única de la aplicación.
 *
 * Esta configuración apunta al tenant gozalo23:
 *   clientId    74966acc-6d78-4632-b650-b92f1c792bf9
 *   tenantId    a6a0c27e-18a7-4209-bd1b-32338be5cb66
 *   apiClientId 8e5e408b-c101-4bc1-a5d3-01f702720462
 */
export const environment = {
  production: false,

  azure: {
    // App Registration de la SPA "frontend"
    clientId: '74966acc-6d78-4632-b650-b92f1c792bf9',

    // Tenant gozalo23
    tenantId: 'a6a0c27e-18a7-4209-bd1b-32338be5cb66',
    authority: 'https://login.microsoftonline.com/a6a0c27e-18a7-4209-bd1b-32338be5cb66',

    // Se resuelve en tiempo de ejecucion segun donde corra la app:
    //   en local          -> http://localhost:4200
    //   en la EC2 (nginx) -> https://44.206.195.117
    // Ambas URI deben estar registradas en el App Registration.
    // Azure no acepta http salvo localhost, por eso la EC2 va por https con nginx.
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,

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

  // EP1: BFF local. EP2: vacio a proposito — las llamadas salen relativas
  // y nginx las intercepta en /api/ y las reenvia al API Gateway.
  // apiBaseUrl: 'http://localhost:8080',
  apiBaseUrl: '',
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