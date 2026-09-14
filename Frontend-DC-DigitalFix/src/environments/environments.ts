export const environment = {

 production: false,



 azure: {

  clientId: '3925d7ba-75af-4c56-ad08-fc0c999298fb',

  tenantId: '6e49fdba-8435-41ac-8074-7b1a04cfd543',

  authority: 'https://login.microsoftonline.com/6e49fdba-8435-41ac-8074-7b1a04cfd543',

  redirectUri: 'http://localhost:4200', // Debe coincidir con lo configurado en Entra



  // Sólo si usarás API con scopes:

  protectedResourceScopes: ['api://3925d7ba-75af-4c56-ad08-fc0c999298fb/read',
                            'api://3925d7ba-75af-4c56-ad08-fc0c999298fb/Crear.OT',]

 },



 // En caso de tener backend:

 apiBaseUrl: 'http://localhost:8080'

};