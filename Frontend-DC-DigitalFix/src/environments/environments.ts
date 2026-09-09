export const environment = {

 production: false,



 azure: {

  clientId: 'b2b09eef-fef9-4b63-9c40-3811bd8a6208',

  tenantId: '6e49fdba-8435-41ac-8074-7b1a04cfd543',

  authority: 'https://login.microsoftonline.com/6e49fdba-8435-41ac-8074-7b1a04cfd543',

  redirectUri: 'http://localhost:4200', // Debe coincidir con lo configurado en Entra



  // Sólo si usarás API con scopes:

  protectedResourceScopes: ['api://b2b09eef-fef9-4b63-9c40-3811bd8a6208']

 },



 // En caso de tener backend:

 apiBaseUrl: 'http://localhost:8080'

};