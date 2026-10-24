# 🗺️ 05: MAPA DEL PROYECTO (Estructura y Flujo)

Esta es la guía definitiva para entender cómo está construido Muvior. **Toda IA debe mapear su contexto mental con esta estructura antes de sugerir cambios.**

---

## 📂 Directorios Principales

El proyecto usa una arquitectura cliente-servidor dividida en dos ecosistemas distintos:

### 1. `/frontend` (Expo / React Native)

Aplicación multiplataforma (iOS, Android, Web) basada en `expo-router`.

* **Gestión de Estado:** `React.useState`, `React.useEffect`. Sin Redux/Zustand por ahora. Persistencia mediante `@react-native-async-storage/async-storage`.
* **Enrutamiento:** Basado en sistema de archivos (`app/`).
  * `app/(tabs)/index.tsx`: **Home Screen** (Mapa principal, categorías, negocios recomendados).
  * `app/business/[id].tsx`: **Business Detail** (Detalles del negocio, lógica crítica de colas: tomar/salir de turno).
  * `app/index.tsx`: **Login**.
  * `app/register.tsx` & `onboarding.tsx`: **Registro y Onboarding** (Recopilación de datos y creación final en DB).
* **Estilos:** Definidos globalmente en `constants/theme.ts` (Referirse al doc *01: Diseño y Estética*). Componentes atómicos de UI en `components/`.

### 2. `/backend` (FastAPI / Python)

API REST ligera que maneja la lógica de negocio y la base de datos sqlite local.

* **Archivo Principal:** `main.py` (Contiene todos los endpoints (`/login`, `/register`, `/turn`, `/turn/{user_id}`)).
* **Base de Datos:** `database.db` (SQLite).
  * *Tablas Core:* `users`, `businesses`, `appointments`.
* **Modelos Pydantic:** Definen la estructura de los datos esperados (ej. `class User(...)`).

---

## 🔄 Flujos Críticos de Datos (El "Core" de Muvior)

Cualquier alteración a estos flujos requiere extrema precaución y pruebas de regresión comprobadas en el historial (Ver *03: Historial de Fallos*).

### Flujo de Autenticación

1. Frontend envía credenciales (`/login` o `/register`).
2. Backend devuelve un `user_id` único y un `role`.
3. **Frontend guarda esto OBLIGATORIAMENTE en `AsyncStorage`.** El resto de la app depende de que este ID exista en el dispositivo.

### Flujo de Colas (Queue System)

1. **Entrar:** `POST /turn` con `user_id` y `business_id`.
2. **Verificar:** El Frontend realiza polling visual en el cliente o pide el estado al `GET /business/{id}`.
3. **Salir:** `DELETE /turn/{user_id}`.

* *Nota de Consistencia:* La UI en `business/[id].tsx` debe manejar inteligentemente el estado de carga (`hasTurn === null`) para no mostrar botones incorrectos mientras la promesa del fetch se resuelve.

---

## 🔗 Entornos y Despliegue

* **Local (Desarrollo Web):** Tráfico directo sobre `http://localhost:8081` (front) y `http://127.0.0.1:8000` (back).
* **Mobile (Expo Go):** Requiere **LocalTunnel** (ej. `loca.lt`) para exponer el backend local a la red. Por esto, TODA petición `fetch` del frontend debe incluir el Header `'Bypass-Tunnel-Reminder': 'true'`.
