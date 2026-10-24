# 📱 07: DESARROLLO DE UI Y COMPONENTES

Este documento establece el flujo de trabajo estándar para traducir diseños conceptuales (Mockups/Imágenes) en código funcional para Muvior, asegurando que la calidad se mantenga en el nivel Premium exigido.

---

## 🏗️ 1. Análisis del Diseño

Antes de escribir cualquier componente de la UI, el desarrollador o la IA debe:

- **Identificar Componentes Atómicos:** Descomponer la pantalla en contenedores, iconos, textos y botones.
- **Mapear Tokens de Diseño:** Traducir los colores del diseño a los tokens de `Colors.core` (ej: negro profundo a `Colors.core.background` o `Colors.core.card`, naranja a `Colors.core.tint`).
- **Estados de la UI:** Considerar qué sucede si los datos están vacíos, si están cargando (`isLoading === true`) o si hay un error.

## 🛠️ 2. Implementación de Estados y Datos

Muvior depende de la verificación en tiempo real de los datos del usuario.

- **Carga de Datos:** Siempre que se necesite información del usuario (como en tarjetas de perfil interactivo), se debe hacer un fetch inicial.

```typescript
const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null);

// Patrón utilizado: Validar que el userId esté disponible (recuperado de AsyncStorage)
if (userId) {
    fetchUserInfo();
}
```

- **Flickering (Parpadeo) en Promesas:** Nunca usar `false` como estado inicial de variables lógicas críticas si la validación es asíncrona. Usar `null` y mostrar un `<ActivityIndicator size="small" color={Colors.core.text} />`.

## 🎨 3. Construcción del Componente (Styling)

Se debe utilizar siempre `StyleSheet.create` al final del archivo.

- **Containers (Tarjetas):** Usar `Colors.core.card` con bordes redondeados amplios (ej. `borderRadius: 24`), y un borde muy sutil (`borderColor: Colors.core.border`, `borderWidth: 1`).
- **Botones Primarios (Acento):** Usar `Colors.core.tint` para confirmar acciones (Tomar turno principal de la app).
- **Botones Dinámicos / Premium:** Si el diseño requiere un botón que contraste radicalmente (como el botón blanco de "Unirse a la fila" en vistas oscuras), se puede usar backgroundColor sólido (`#FFFFFF`) y texto oscuro (`#000000`), manteniendo un borde totalmente redondeado (`borderRadius: 100`).
- **Iconografía:** Usar SIEMPRE `@expo/vector-icons` (predominantemente `Ionicons`).

## 🚷 4. Funcionalidad de Respaldo (Fallback)

Si el diseño actual requiere que el usuario esté logueado (como ver su tarjeta de perfil), siempre debe haber un diseño de respaldo (Fallback) para cuando no hay sesión.

- Debe mantener la coherencia (Ejemplo: Un botón simple de "Iniciar sesión para tomar turno" en lugar del componente interactivo completo).

---
*NOTA: Para cualquier cambio global de temas, referirse a `01-DISEÑO-Y-ESTETICA.md` antes de crear excepciones aquí.*
