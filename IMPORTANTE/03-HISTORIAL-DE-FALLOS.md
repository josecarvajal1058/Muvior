# 📜 03: HISTORIAL DE FALLOS CRÍTICOS

Registro de "Lecciones Aprendidas" para evitar que bugs antiguos regresen al código.

---

## 1. El Error del ID Fantasma (Persistence Fail)

- **Síntoma:** El usuario no podía salir de la cola; el contador de negocios no bajaba.
- **Causa:** El `user_id` se perdía al navegar fuera del login/onboarding. El frontend intentaba borrar turnos sin un ID válido.
- **Lección:** La persistencia es la base de la lógica de negocio. Si el ID no está en `AsyncStorage`, la app debe redirigir al login.

## 2. El Parpadeo del Botón "Tomar Turno" (State Sync)

- **Síntoma:** Al entrar a un negocio donde ya tenías turno, se veía el botón naranja de "Tomar turno" por un instante antes de cambiar a rojo/salir.
- **Causa:** El estado `hasTurn` se inicializaba en `false` de forma optimista.
- **Lección:** Los estados booleanos que vienen de una API deben ser `null` mientras cargan para evitar el parpadeo de la UI (Flash of Incorrect State).

## 3. El Error del Túnel Bloqueado (Header Miss)

- **Síntoma:** Error de conexión solo en dispositivos Android/iOS vía Expo Go.
- **Causa:** LocalTunnel muestra una pantalla de aviso que bloquea el `fetch` si no se envía el header `Bypass-Tunnel-Reminder`.
- **Lección:** Mantener una configuración global de headers para todos los servicios de red.

## 4. Inconsistencia de Color en Web vs Mobile

- **Síntoma:** Algunos spinners eran blancos, otros grises. En web, aparecía un borde amarillo feo alrededor del buscador.
- **Causa:** Olvido de las propiedades específicas de la web (`outlineStyle`) y de aplicar el tema `Colors.core.tint`.
- **Lección:** Siempre probar cambios visuales en ambos entornos (Navegador y Móvil).
