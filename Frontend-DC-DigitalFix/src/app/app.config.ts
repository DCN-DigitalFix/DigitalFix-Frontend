import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication,
} from '@azure/msal-browser';

import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService,
} from '@azure/msal-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environments';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azure.clientId,
      authority: environment.azure.authority,
      redirectUri: environment.azure.redirectUri,
      postLogoutRedirectUri: environment.azure.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [...environment.azure.apiScopes],
    },
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();

  // El interceptor hace match por prefijo de URL.
  // En EP2 apiBaseUrl pasa a ser la URL del API Gateway.
  protectedResourceMap.set(`${environment.apiBaseUrl}/api`, [
    ...environment.azure.apiScopes,
  ]);

  return { interactionType: InteractionType.Redirect, protectedResourceMap };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },

    // initialize() y handleRedirectPromise() deben correr sobre la instancia
    // registrada en el DI, antes del primer render.
    provideAppInitializer(async () => {
      const msalInstance = inject(MSAL_INSTANCE) as IPublicClientApplication;
      await msalInstance.initialize();
      await msalInstance.handleRedirectPromise();
    }),

    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },

    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
