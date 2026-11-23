/**
 * Configuración única de la aplicación.
 *
 * ACTIVO: tenant "jesus" (6e49fdba-8435-41ac-8074-7b1a04cfd543), apiClientId
 * 13a645a9-ea0e-498e-96b8-55a3d56f10eb. Es la misma audiencia que validan todos los microservicios
 * (bff, workorders, audit, notify, report, catalog, kafka-admin, rabbitmq-admin).
 * Un solo access token del frontend sirve para todos.
 *
 * COMENTADO MÁS ABAJO: tenant gozalo23 (a6a0c27e-18a7-4209-bd1b-32338be5cb66),
 * apiClientId 8e5e408b-c101-4bc1-a5d3-01f702720462. Se deja por si hace falta volver a ese tenant.
 */
export const environment = {
  production: false,

  azure: {
    // App Registration de la SPA "frontend"
    clientId: '3925d7ba-75af-4c56-ad08-fc0c999298fb',

    // Tenant jesus
    tenantId: '6e49fdba-8435-41ac-8074-7b1a04cfd543',
    authority: 'https://login.microsoftonline.com/6e49fdba-8435-41ac-8074-7b1a04cfd543',

    // gozalo23 (comentado)
    // clientId: '74966acc-6d78-4632-b650-b92f1c792bf9',
    // tenantId: 'a6a0c27e-18a7-4209-bd1b-32338be5cb66',
    // authority: 'https://login.microsoftonline.com/a6a0c27e-18a7-4209-bd1b-32338be5cb66',

    // Se resuelve en tiempo de ejecucion segun donde corra la app:
    //   en local          -> http://localhost:4200
    //   en la EC2 (nginx) -> https://44.206.195.117
    // Ambas URI deben estar registradas en el App Registration.
    // Azure no acepta http salvo localhost, por eso la EC2 va por https con nginx.
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,

    // App Registration de la API "DigitalFix API"
    apiClientId: '13a645a9-ea0e-498e-96b8-55a3d56f10eb',

    // Claim "aud" que llevara el access token
    apiAudience: 'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb',

    // Scopes delegados expuestos por la API
    apiScopes: [
      'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb/OT.Read',
      'api://13a645a9-ea0e-498e-96b8-55a3d56f10eb/OT.Create',
    ],
  },

  // Vacio a proposito: las llamadas salen relativas y nginx (produccion) o
  // proxy.conf.json (desarrollo con npm start) las reenvia al API Gateway.
  // Para apuntar a un BFF local sin proxy, usar 'http://localhost:8080'.
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
