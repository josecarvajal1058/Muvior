# ⚙️ 02: ARQUITECTURA Y BACKEND

Este documento asegura que la comunicación entre el cliente (React Native/Expo) y el servidor (FastAPI/SQLite) sea segura y coherente.

---

## 🌐 Comunicación API

### 🛡️ Bypass de Túnel (LocalTunnel)

Debido al uso de LocalTunnel para desarrollo móvil, todas las peticiones `fetch` deben incluir el siguiente header:

```javascript
headers: {
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json'
}
```

### 📍 URL Dinámica (API_URL)

No hardcodear `127.0.0.1`. Usar la lógica de detección de plataforma:

```javascript
const API_URL = Platform.OS === 'web' 
    ? 'http://127.0.0.1:8000' 
    : 'TU_URL_DE_LOCALTUNNEL';
```

---

### Autenticación y Cuentas (Modo Desarrollo)

- **Bypass de Desarrollo:** Muvior está configurado temporalmente en `frontend/app/index.tsx` (Login) para que al pulsar **"Iniciar sesión"** con los campos de correo y contraseña **completamente vacíos**, se ejecute un bypass de autenticación.
- Esto inicia sesión instantáneamente con un ID de usuario Mock (ej. ID 1) y salta directamente al Home (`/(tabs)`).
- **Regla Estricta:** Durante el desarrollo, los agentes y subagentes de pruebas E2E (Playwright/Browser) **DEBEN** utilizar este bypass haciendo clic directamente en "Iniciar sesión" en blanco. NUNCA se debe perder tiempo navegando por el flujo de "Regístrate" o tecleando credenciales de prueba.

---

## 👤 Gestión de Identidad (Auth)

### Persistencia del `user_id`

1. **Login/Register:** El backend debe retornar el `user_id`.
2. **Almacenamiento:** El frontend **DEBE** guardar el ID inmediatamente usando `AsyncStorage`.
3. **Uso:** Todas las acciones de cola (`POST /turn`, `DELETE /turn`) requieren el `user_id` persistido para ser válidas. **Nunca asumir que el usuario es ID 1 por defecto.**

---

## 💾 Base de Datos (SQLite)

- **Integridad:** Los nombres de los negocios y categorías deben ser reales y reflejar locales dominicanos (Barbería VIP, Salón Rossy, etc.).
- **Estado de Cola:** El campo `status` en `appointments` debe respetarse escrupulosamente (`waiting`, `active`, `cancelled`).
- **Nombres de Tablas:** Siempre en minúsculas y plural (`users`, `businesses`, `appointments`).
