import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { filter, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environments';

/** Decodifica el payload de un JWT sin validar la firma (solo para leer claims en la UI). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

/**
 * Estado de autenticacion expuesto con signals.
 * Obligatorio usar signals: la app corre con provideZonelessChangeDetection(),
 * asi que una propiedad plana modificada desde un callback async NO refresca la vista.
 *
 * Los App Roles estan definidos en el registro de la API, por lo que viajan en el
 * claim "roles" del ACCESS TOKEN (aud = api://<API_CLIENT_ID>), no en el ID token.
 * La decodificacion de aqui es solo para pintar la UI: la autorizacion real la hacen
 * el API Gateway y el BFF, que si validan la firma.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private msal = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);

  readonly account = signal<AccountInfo | null>(null);
  readonly isLoggedIn = computed(() => this.account() !== null);
  readonly displayName = computed(() => this.account()?.name ?? '');

  private readonly accessToken = signal<string | null>(null);

  readonly roles = computed<string[]>(() => {
    const token = this.accessToken();
    if (!token) return [];
    const claims = decodeJwtPayload(token);
    return (claims?.['roles'] as string[]) ?? [];
  });

  /** Scopes concedidos (claim "scp"), util para diagnosticar 403 del Gateway. */
  readonly scopes = computed<string[]>(() => {
    const token = this.accessToken();
    if (!token) return [];
    const claims = decodeJwtPayload(token);
    return ((claims?.['scp'] as string) ?? '').split(' ').filter(Boolean);
  });

  constructor() {
    this.broadcast.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.INITIALIZE_END ||
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
            msg.eventType === EventType.LOGOUT_SUCCESS
        )
      )
      .subscribe((msg: EventMessage) => {
        if (msg.eventType === EventType.LOGIN_SUCCESS) {
          const payload = msg.payload as AuthenticationResult;
          this.msal.instance.setActiveAccount(payload.account);
        }
        void this.refresh();
      });

    this.broadcast.inProgress$.subscribe(() => void this.refresh());

    void this.refresh();
  }

  /** Relee la cuenta activa desde MSAL y actualiza el signal. */
  syncAccount(): void {
    try {
      let active = this.msal.instance.getActiveAccount();

      if (!active) {
        const all = this.msal.instance.getAllAccounts();
        if (all.length > 0) {
          this.msal.instance.setActiveAccount(all[0]);
          active = all[0];
        }
      }

      this.account.set(active ?? null);
    } catch {
      this.account.set(null);
    }
  }

  /** Asegura un access token vigente para la API y actualiza los roles. */
  async refresh(): Promise<void> {
    this.syncAccount();

    const account = this.account();
    if (!account) {
      this.accessToken.set(null);
      return;
    }

    try {
      const result = await firstValueFrom(
        this.msal.acquireTokenSilent({
          scopes: [...environment.azure.apiScopes],
          account,
        })
      );
      this.accessToken.set(result.accessToken);
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        this.msal.acquireTokenRedirect({ scopes: [...environment.azure.apiScopes] });
      }
      this.accessToken.set(null);
    }
  }

  hasAnyRole(allowed: readonly string[]): boolean {
    if (allowed.length === 0) return true;
    const mine = this.roles();
    return allowed.some((role) => mine.includes(role));
  }

  login(): void {
    this.msal.loginRedirect({ scopes: [...environment.azure.apiScopes] });
  }

  logout(): void {
    this.accessToken.set(null);
    this.msal.logoutRedirect();
  }
}