/**
 * Configuración única de la aplicación.
 * NO contiene secretos: clientId y tenantId son identificadores públicos.
 * El client secret vive sólo en Azure y se usa para pruebas desde Postman.
 */
export const environment = {
  production: false,

  azure: {
    // App Registration de la SPA (plataforma "SPA", redirect http://localhost:4200)
    clientId: '3925d7ba-75af-4c56-ad08-fc0c999298fb',

    // Tenant de Entra ID
    tenantId: '6e49fdba-8435-41ac-8074-7b1a04cfd543',
    authority: 'https://login.microsoftonline.com/6e49fdba-8435-41ac-8074-7b1a04cfd543',

    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',

    /**
     * App Registration de la API (registro DISTINTO al de la SPA).
     * Mientras no lo separes, deja aquí el mismo GUID de arriba.
     */
    apiClientId: '3925d7ba-75af-4c56-ad08-fc0c999298fb',

    /** Scopes delegados expuestos por la API y consentidos por la SPA. */
    apiScopes: [
      'api://3925d7ba-75af-4c56-ad08-fc0c999298fb/OT.Read',
      'api://3925d7ba-75af-4c56-ad08-fc0c999298fb/OT.Create',
    ],
  },

  /**
   * Base de las llamadas al backend.
   * EP1: apunta al BFF local.  EP2: reemplazar por la URL del API Gateway.
   */
  apiBaseUrl: 'http://localhost:8080',
};

/** App Roles definidos en el App Registration (claim "roles" del token). */
export const ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  CLIENTE: 'Cliente',
  AUDITOR: 'Auditor',
} as const;
