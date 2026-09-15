/**
 * Configuración única de la aplicación.
 * NO contiene secretos: clientId y tenantId son identificadores públicos.
 *
 * OJO: esta configuración apunta al tenant appdemo1945 (entorno de Jesus).
 * La entrega final va contra el tenant gozalo23:
 *   clientId    74966acc-6d78-4632-b650-b92f1c792bf9
 *   tenantId    a6a0c27e-18a7-4209-bd1b-32338be5cb66
 *   apiClientId 8e5e408b-c101-4bc1-a5d3-01f702720462
 */
export const environment = {
  production: false,

  azure: {
    // App Registration de la SPA "DigitalFix-Frontend"
    clientId: '3925d7ba-75af-4c56-ad08-fc0c999298fb',

    // Tenant appdemo1945
    tenantId: '6e49fdba-8435-41ac-8074-7b1a04cfd543',
    authority: 'https://login.microsoftonline.com/6e49fdba-8435-41ac-8074-7b1a04cfd543',

    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',

    // App Registration de la API "DigitalFix-API"
    apiClientId: '13a645a9-ea0e-498e-96b8-55a3d56f10eb',

    // Claim "aud" que llevara el access token
    apiAudience: 'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb',

    // Scopes delegados expuestos por la API
    apiScopes: [
      'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb/OT.Read',
      'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb/OT.Create',
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