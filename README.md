# DigitalFix — Frontend

SPA en **Angular 21** que actúa como interfaz de usuario del sistema de **órdenes de trabajo de mantención eléctrica** de DigitalFix. La autenticación y autorización se delegan a **Microsoft Entra ID** mediante MSAL, y las llamadas a la API se enrutan a través de un API Gateway en AWS.

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura general](#arquitectura-general)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Roles y permisos](#roles-y-permisos)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Configuración del entorno](#configuración-del-entorno)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue en AWS](#despliegue-en-aws)
- [Convenciones de estilo](#convenciones-de-estilo)
- [Estado del proyecto](#estado-del-proyecto)
- [Problemas conocidos](#problemas-conocidos)

---

## Tecnologías

| Paquete | Versión | Propósito |
|---|---|---|
| Angular | ^21.2.0 | Framework principal (standalone components) |
| @azure/msal-angular | ^6.2.1 | Integración MSAL con Angular (guards, interceptors) |
| @azure/msal-browser | ^5.22.0 | Flujo de autenticación OAuth 2.0 / OIDC |
| RxJS | ~7.8.0 | Programación reactiva |
| TypeScript | ~5.9.2 | Lenguaje tipado |
| Vitest | ^4.0.8 | Runner de tests unitarios |
| Prettier | ^3.8.1 | Formateo de código |

> **Change Detection:** la app corre con `provideZonelessChangeDetection()`. Todo el estado reactivo usa **Angular Signals** (`signal`, `computed`). No se usan `Subject` ni `BehaviorSubject` para estado de UI.

---

## Arquitectura general

```
Browser (Angular SPA)
    │
    │  Login redirect (Authorization Code + PKCE)
    ▼
Microsoft Entra ID
    │  Access token — claims: roles, scp, aud, iss
    │
    ▼
Angular App
    │  HTTP con Authorization: Bearer <token>
    │  (lo adjunta MsalInterceptor, no el servicio)
    ▼
nginx (EC2)  ──  sirve la SPA y hace proxy de /api/*
    │
    ▼
AWS API Gateway  ──  JWT Authorizer: firma, iss, aud, exp
    │
    ▼
BFF Spring Boot  ──  segunda validación + @PreAuthorize por rol y scope
```

El token se valida **dos veces**, en el Gateway y en el BFF. Es deliberado: el Gateway filtra tráfico no autenticado en el borde, y el BFF aplica la autorización por rol, que el Gateway no conoce.

### El frontend nunca llama al BFF directamente

En producción, `apiBaseUrl` es una cadena vacía: las peticiones salen relativas (`/api/workorders`) y nginx las reenvía al API Gateway. Para el navegador todo es el mismo origen, así que no hay CORS de por medio.

En desarrollo local, `proxy.conf.json` cumple exactamente esa misma función, de modo que el entorno local se comporta igual que el desplegado.

---

## Estructura del proyecto

```
Frontend-DC-DigitalFix/
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css                  # Design tokens (variables CSS globales)
│   ├── environments/
│   │   └── environments.ts         # Config de Entra ID, scopes, apiBaseUrl y ROLES
│   └── app/
│       ├── app.ts / app.html / app.css
│       ├── app.config.ts           # DI: MSAL, router, HttpClient, interceptor
│       ├── app.routes.ts           # Tabla de rutas con guards
│       ├── auth/
│       │   ├── auth.ts             # Servicio Auth (signals: account, roles, scopes)
│       │   └── role-guard.ts       # Guard funcional de autorización por rol
│       ├── workorders/
│       │   ├── workorder.model.ts  # WorkOrder, EstadoOT, DTOs
│       │   └── workorder.service.ts# Cliente HTTP (/api/workorders)
│       ├── audit/
│       │   ├── audit.model.ts      # AuditEvent (espeja ms-digitalfix-audit)
│       │   └── audit.service.ts    # Cliente HTTP (/api/audit)
│       ├── catalog/
│       │   ├── catalog.model.ts    # Servicio, Repuesto, DTOs (espeja ms-digitalfix-catalog)
│       │   └── catalog.service.ts  # Cliente HTTP (/api/catalog)
│       ├── pages/
│       │   ├── home.ts             # Pública
│       │   ├── dashboard.ts        # Mensaje adaptado por rol
│       │   ├── workorders.ts       # CRUD completo
│       │   ├── catalog.ts          # Servicios y repuestos, con descuento de stock
│       │   ├── reports.ts          # Placeholder (depende de ms-digitalfix-report)
│       │   ├── audit.ts            # Timeline de eventos y búsqueda por orden
│       │   └── forbidden.ts        # 403
│       └── profile/
│           └── profile.ts          # Perfil del usuario autenticado
├── proxy.conf.json                 # Proxy dev: /api → AWS API Gateway
├── angular.json
├── tsconfig.json
├── package.json
└── .prettierrc
```

---

## Roles y permisos

Los roles son **App Roles definidos en el registro de la API** en Entra ID. Viajan en el claim `roles` del **access token**, no del ID token — si se decodifica el ID token, el claim no aparece.

La UI usa los roles para adaptar la vista, pero **ocultar un control no es seguridad**: cualquiera puede llamar al endpoint desde Postman. La autorización real la aplican el API Gateway y el `@PreAuthorize` del BFF.

| Rol | Inicio | Dashboard | Órdenes | Catálogo | Reportería | Auditoría | Perfil |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | ✅ | ✅ | ✅ (CRUD + eliminar) | ✅ | ✅ | ✅ | ✅ |
| **Supervisor** | ✅ | ✅ | ✅ (CRUD, sin eliminar) | ✅ | ❌ | ❌ | ✅ |
| **Cliente** | ✅ | ✅ | ✅ (crear y ver) | ❌ | ❌ | ❌ | ✅ |
| **Auditor** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Sin rol** | ✅ | ✅ (mensaje informativo) | ❌ | ❌ | ❌ | ❌ | ✅ |

> Las asignaciones de App Roles **se acumulan**: agregar un rol en Aplicaciones empresariales no reemplaza el anterior, y el claim `roles` los trae todos. En la práctica gana el más permisivo, así que hay que quitar la asignación antigua a mano.

### Estados de una Orden de Trabajo

```
INGRESADA → ASIGNADA → EN_EJECUCION → CERRADA
                                    ↘ ANULADA
```

---

## Rutas de la aplicación

| Ruta | Componente | Guards |
|---|---|---|
| `/` | `Home` | — (pública) |
| `/dashboard` | `Dashboard` | `MsalGuard` |
| `/workorders` | `WorkOrders` | `MsalGuard` + `roleGuard(Admin, Supervisor, Cliente)` |
| `/catalog` | `Catalog` | `MsalGuard` + `roleGuard(Admin, Supervisor)` |
| `/reports` | `Reports` | `MsalGuard` + `roleGuard(Admin)` |
| `/audit` | `Audit` | `MsalGuard` + `roleGuard(Admin, Auditor)` |
| `/profile` | `Profile` | `MsalGuard` |
| `/forbidden` | `Forbidden` | — (pública) |
| `**` | — | Redirige a `/` |

El `roleGuard` opera **después** de `MsalGuard`: primero garantiza sesión, luego evalúa el claim `roles`. Si el rol no alcanza, redirige a `/forbidden`.

---

## Configuración del entorno

`src/environments/environments.ts`:

```typescript
export const environment = {
  production: false,

  azure: {
    clientId: '...',       // App Registration de la SPA
    tenantId: '...',       // Tenant de Entra ID
    authority: 'https://login.microsoftonline.com/<tenantId>',

    // Se resuelve en tiempo de ejecución según dónde corra la app:
    //   local        → http://localhost:4200
    //   EC2 (nginx)  → https://<ip-de-la-instancia>
    // Ambas URI deben estar registradas en el App Registration.
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,

    apiClientId: '...',    // App Registration de la API backend
    apiAudience: 'api://<apiClientId>',
    apiScopes: [
      'api://<apiClientId>/OT.Read',
      'api://<apiClientId>/OT.Create',
    ],
  },

  // Vacío: las peticiones salen relativas y nginx (o el proxy de dev)
  // las reenvía al API Gateway.
  apiBaseUrl: '',
};
```

`window.location.origin` evita tener que editar el archivo cada vez que se pasa de desarrollo a despliegue, que es una fuente frecuente de builds subidos con la configuración equivocada.

### El comodín del `protectedResourceMap`

En `app.config.ts`, el mapa que le dice a MSAL qué URLs llevan token **necesita el `/*`**:

```typescript
protectedResourceMap.set(`${environment.apiBaseUrl}/api/*`, [
  ...environment.azure.apiScopes,
]);
```

Sin el comodín, MSAL no hace match con `/api/workorders` y la petición sale **sin el header `Authorization`**, sin lanzar ningún error. El síntoma aparece del otro lado como un 401 que parece problema del backend.

> ⚠️ **No subir credenciales reales al repositorio.** Los identificadores de Entra ID no son secretos, pero el archivo cambia según el tenant y subirlo con los valores de un entorno de pruebas rompe el del resto del equipo.

---

## Instalación y desarrollo local

### Prerrequisitos

- **Node.js** ≥ 20 y **npm** ≥ 11
- Un usuario del tenant de Entra ID con rol asignado en la API
- `http://localhost:4200` registrado como URI de redirección en el App Registration de la SPA

### Pasos

```bash
git clone <url-del-repo>
cd Frontend-DC-DigitalFix
npm install
npm start
```

La app queda en `http://localhost:4200`.

`npm start` levanta el servidor con `proxy.conf.json`, que redirige `/api/*` al API Gateway. No hace falta tener el BFF corriendo localmente.

`proxy.conf.json`:

```json
{
  "/api": {
    "target": "https://<api-id>.execute-api.us-east-1.amazonaws.com",
    "secure": true,
    "changeOrigin": true
  }
}
```

El `changeOrigin: true` es necesario: sin él, el Gateway recibe un header `Origin` que no le corresponde y responde `403 Invalid CORS request`.

### Desarrollo contra un BFF local

Ajustar `apiBaseUrl` en `environments.ts` y arrancar sin proxy:

```typescript
apiBaseUrl: 'http://localhost:8080',
```

```bash
npx ng serve
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor dev con proxy en `localhost:4200` |
| `npm run build` | Build de producción en `dist/` |
| `npm run watch` | Build en modo watch |
| `npm test` | Tests unitarios con Vitest |

---

## Despliegue en AWS

Los archivos estáticos se generan con `npm run build` y quedan en `dist/frontend-dc-digitalfix/browser/`. Se sirven con **nginx** en la instancia EC2.

### Por qué HTTPS es obligatorio

Hay dos razones, y la segunda es la que suele sorprender:

1. **Entra ID solo acepta `https://` en el `redirectUri`**, con `localhost` como única excepción.
2. **MSAL necesita la Web Crypto API para PKCE.** Los navegadores solo exponen `window.crypto.subtle` en contextos seguros. Servida por HTTP plano, la aplicación **no arranca**: MSAL lanza `BrowserAuthError: crypto_nonexistent` durante el bootstrap y la pantalla queda en blanco.

En el laboratorio no se puede obtener un certificado válido (Let's Encrypt no emite para direcciones IP y CloudFront está bloqueado), así que se usa uno autofirmado. El navegador muestra una advertencia de sitio no seguro que hay que aceptar una vez; es esperable y no indica un error de configuración.

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/digitalfix.key \
  -out /etc/nginx/digitalfix.crt \
  -subj "/CN=<ip-de-la-instancia>"
```

### Configuración de nginx

`/etc/nginx/conf.d/digitalfix.conf`:

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;
    root /usr/share/nginx/html;

    ssl_certificate     /etc/nginx/digitalfix.crt;
    ssl_certificate_key /etc/nginx/digitalfix.key;

    location /api/ {
        proxy_pass https://<api-id>.execute-api.us-east-1.amazonaws.com/api/;
        proxy_set_header Host <api-id>.execute-api.us-east-1.amazonaws.com;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Content-Type $http_content_type;
        proxy_set_header Origin "";
        proxy_ssl_server_name on;
        proxy_http_version 1.1;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Cada directiva del bloque `/api/` está ahí por una razón concreta:

| Directiva | Sin ella |
|---|---|
| `try_files … /index.html` | Recargar `/workorders` devuelve 404: nginx busca un archivo con ese nombre |
| `proxy_set_header Origin ""` | El Gateway responde `403 Invalid CORS request` en POST, PATCH y DELETE |
| `proxy_set_header Content-Type` | El BFF no puede deserializar el JSON del cuerpo |
| `proxy_ssl_server_name on` | AWS rechaza el handshake TLS |

El `Origin ""` merece explicación: el navegador incluye el header `Origin` en las peticiones con método no simple, aunque vayan al mismo origen. Si nginx lo reenvía, el Gateway lo interpreta como una petición cross-origin que no coincide con su host y la rechaza. Vaciarlo hace que la llamada le llegue como lo que realmente es: una petición de servidor a servidor.

### Subir una versión nueva

```bash
npm run build
```

```bash
scp -i <clave>.pem -r dist/frontend-dc-digitalfix/browser ec2-user@<ip>:~/frontend
```

```bash
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r ~/frontend/* /usr/share/nginx/html/
ls /usr/share/nginx/html | head
```

El `ls` debe mostrar `index.html` en la raíz. Si aparece una carpeta `browser`, el directorio de destino ya existía y `scp` anidó los archivos: usar `~/frontend/browser/*` en la copia, o borrar el destino antes de subir.

Al probar, recargar con `Ctrl+Shift+R` o usar una ventana de incógnito: el `index.html` conserva el mismo nombre entre compilaciones y el navegador suele servir el anterior desde la caché.

---

## Convenciones de estilo

- **Código:** Prettier. `npm run build` no formatea; usar la extensión del editor o `npx prettier --write .`
- **CSS:** variables globales en `src/styles.css`. Paleta oscura con acento ámbar (`--ambar: #ffb000`) y tipografía monoespaciada (JetBrains Mono / IBM Plex Mono) para todo lo que sea dato.
- **Componentes:** standalone, sin NgModules. Estilos inline en la propiedad `styles` del decorador.
- **Estado:** Signals (`signal`, `computed`). Sin Zone.js ni `async` pipe para estado de UI.
- **HTTP:** convertir Observables a Promises con `firstValueFrom()` en los servicios. El `MsalInterceptor` adjunta el token; los servicios no manipulan headers.

---

## Estado del proyecto

**Implementado:**

- Login con Authorization Code + PKCE contra Entra ID
- Lectura de roles y scopes desde el access token
- Guard de autorización por rol y menú adaptado
- CRUD completo de órdenes de trabajo contra el API Gateway
- Auditoría: tabla de últimos eventos, búsqueda de línea de tiempo por orden
  y refresco automático opcional, vía ms-digitalfix-audit (solo lectura)
- Catálogo: servicios y repuestos con stock, alta de ambos y descuento de
  stock con mensaje legible cuando no alcanza, vía ms-digitalfix-catalog
- Manejo de errores 401, 403 y 409 con mensajes legibles en pantalla
- Despliegue en EC2 con nginx y HTTPS

**Pendiente:**

- Reportería sigue siendo un placeholder: depende de ms-digitalfix-report
- El BFF almacena las órdenes **en memoria**: se pierden al reiniciarlo
- Autorregistro de usuarios (hoy las cuentas las crea el administrador del tenant)
- Microservicios de dominio con persistencia real

---

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| Pantalla en blanco, `crypto_nonexistent` en consola | El sitio se sirve por HTTP plano | Configurar HTTPS: PKCE necesita contexto seguro |
| `AADSTS50011` al iniciar sesión | El origen actual no está registrado como URI de redirección | Agregarlo en Autenticación → Aplicación de página única |
| `AADSTS65001` al iniciar sesión | Falta el consentimiento de administrador | Concederlo en Permisos de API del registro de la SPA |
| La petición sale sin `Authorization` | Falta el comodín `/*` en el `protectedResourceMap` | Corregir `app.config.ts` y recompilar |
| 403 `Invalid CORS request` en POST/PATCH/DELETE | nginx reenvía el header `Origin` | Agregar `proxy_set_header Origin ""` |
| 404 al recargar `/workorders` | Falta `try_files` en nginx | Agregarlo al bloque `location /` |
| 401 con un token aparentemente válido | Se está usando el ID token, cuya audiencia es el Client ID de la SPA | Tomar la entrada del localStorage cuyo `credentialType` es `AccessToken` |
| Roles vacíos tras cambiarlos en Azure | El rol viaja firmado dentro del token en caché | Cerrar sesión, limpiar el localStorage y volver a entrar |
| Los cambios no se ven tras redesplegar | El navegador sirve el `index.html` desde la caché | `Ctrl+Shift+R` o incógnito |