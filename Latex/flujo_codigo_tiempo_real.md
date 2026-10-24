# Flujo Técnico: Conexión Código y Base de Datos (Muvior App)

Este documento detalla, con extractos exactos del código fuente, cómo Muvior transporta la información de la fila desde los registros estáticos de la base de datos (SQLite) hasta la interfaz brillante del teléfono (React Native).

## 1. El Backend: Extrayendo la fila (`main.py`)

El servidor Muvior está escrito en **Python** usando el framework **FastAPI**. El punto de conexión (Endpoint) donde el teléfono pide la lista de negocios es `/businesses`.

Cuando la aplicación móvil entra a esa dirección, FastAPI entra a la base de datos y ejecuta el siguiente bloque de código:

```python
@app.get("/businesses", response_model=List[BusinessModel])
def get_businesses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # LA MAGIA ESTÁ AQUÍ: Sub-Query para obtener la fila real.
    query = """
        SELECT b.*, 
        (SELECT COUNT(*) FROM appointments a WHERE a.business_id = b.id AND a.status = 'waiting') as queue_size
        FROM businesses b WHERE 1=1
    """
    params = []

    # ... Lógica de filtrado (por categoría, búsqueda o ubicación) ...

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
```

**Mecanismo:**
En lugar de almacenar estáticamente en la base de datos el valor "5", SQLite ejecuta de forma anidada `SELECT COUNT(*)` en la tabla `appointments`. El backend empaqueta esa operación de la base de datos en un objeto JSON y se lo pasa por Internet al dispositivo móvil del cliente.

## 2. El Frontend: React Native Consumiendo el Arreglo (`index.tsx`)

La aplicación móvil está construida con **React Native (Expo)**. Usa `useEffect` para hacer la petición HTTP al servidor de Python y traer los negocios junto a esa súper columna llamada `queue_size` autocalculada.

```typescript
// fetchBusinesses() ejecutado al cargar la pantalla
const fetchBusinesses = async () => {
    setLoading(true);
    try {
        let url = `${API_URL}/businesses?category=${encodeURIComponent(selCategory)}&location=${encodeURIComponent(selectedLocation)}`;
        
        // Petición HTTP al Backend
        const res = await fetch(url);
        // Desempaquetado del JSON (Incluye b.* y el contador queue_size calculado en SQL)
        const data = await res.json();
        
        // Se guarda en la memoria (Estado de React)
        setBusinesses(data); 

    } catch (error) {
        console.log('Error fetching businesses:', error);
    } finally {
        setLoading(false);
    }
};
```

## 3. Renderizado Visual (JSX)

Finalmente, ese número viaja hasta el código de la tarjeta en pantalla (`dealCard` o `recCard`). React Native decide inteligentemente cómo pintar el DOM utilizando un operador ternario lógico `? :`:

```tsx
<View style={s.statusBadge}>
    {/* Icono (Si es 0 pinta color Verde, si es mayor, pinta el color de Texto por defecto) */}
    <Ionicons name="people" size={14} color={deal.queue_size === 0 ? '#4CAF50' : Colors.core.text} />
    
    {/* Texto (Si es 0, escribe "Sin fila". Si es >0, escribe "X en cola") */}
    <Text style={[s.badgeTxt, { color: deal.queue_size === 0 ? '#4CAF50' : Colors.core.text }]}>
        {deal.queue_size === 0 ? 'Sin fila' : `${deal.queue_size} en cola`}
    </Text>
</View>
```

## Resumen del Viaje de Datos

1. Hay **3 usuarios** en la tabla de citas (`appointments`) con estado `waiting` para el negocio #25.
2. La app react native pregunta por los negocios a `/businesses`.
3. SQLite hace el `COUNT()` de esas tres filas y dice: `"queue_size": 3`.
4. Python lo transforma a un JSON legible y lo retorna al teléfono.
5. React actualiza su estado.
6. El código de interfaz ve que `3` NO es cero, y escribe **"3 en cola"**.
