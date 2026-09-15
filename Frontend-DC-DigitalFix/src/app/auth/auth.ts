import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { filter } from 'rxjs';

/**
 * Estado de autenticación expuesto con signals.
 * Es obligatorio usar signals: la app corre con provideZonelessChangeDetection(),
 * así que una propiedad plana modificada desde un callback async NO refresca la vista.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private msal = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);

  readonly account = signal<AccountInfo | null>(null);
  readonly isLoggedIn = computed(() => this.account() !== null);

  /** Roles de aplicación entregados por Entra ID en el claim "roles". */
  readonly roles = computed<string[]>(() => {
    const claims = this.account()?.idTokenClaims as Record<string, unknown> | undefined;
    return (claims?.['roles'] as string[]) ?? [];
  });

  readonly displayName = computed(() => this.account()?.name ?? '');

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
        this.sync();
      });

    // inProgress$ cubre el retorno del redirect, donde msalSubject$ puede no emitir.
    this.broadcast.inProgress$.subscribe(() => this.sync());

    this.sync();
  }

  /** Relee la cuenta activa desde MSAL y actualiza el signal. */
  sync(): void {
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
      // Consulta antes de que initialize() termine: aún no hay sesión conocida.
      this.account.set(null);
    }
  }

  hasAnyRole(allowed: readonly string[]): boolean {
    if (allowed.length === 0) return true;
    const mine = this.roles();
    return allowed.some((role) => mine.includes(role));
  }

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
  }
}
