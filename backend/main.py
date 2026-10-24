from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from database import get_db_connection, init_db
from security import hash_password, verify_password

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Muvior API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "¡Hola desde Python (FastAPI)! Backend conectado a SQLite."}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = "Nuevo Usuario"
    role: str

class BusinessModel(BaseModel):
    id: int
    owner_id: int
    username: str
    name: str
    description: str
    location: str
    category: str
    image_url: Optional[str] = None
    distance: str
    queue_size: int = 0
    queue_type: str = 'LINEAL'
    open_time: str = '09:00'
    close_time: str = '18:00'
    days_open: str = '1,2,3,4,5,6'
    phone: Optional[str] = None

class EmployeeModel(BaseModel):
    id: int
    business_id: int
    name: str
    status: str

class ServiceModel(BaseModel):
    id: int
    business_id: int
    name: str
    average_duration_minutes: int
    is_autonomous: bool
    capacity: int

@app.post("/login")
def login(user: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, role, password FROM users WHERE email=?", (user.email,))
    row = cursor.fetchone()
    conn.close()

    if row and verify_password(user.password, row["password"]):
        return {"message": "Login exitoso", "role": row["role"], "user_id": row["id"], "name": row["name"]}
    
    raise HTTPException(status_code=400, detail="Credenciales inválidas")

@app.post("/register")
def register(user: RegisterRequest):
    if not user.email or not user.password or not user.role:
        raise HTTPException(status_code=400, detail="Datos incompletos")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        hashed_pw = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
            (user.email, hashed_pw, user.name, user.role)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="El correo ya está registrado o error de BD.")
    return {"message": f"Usuario {user.role} creado exitosamente.", "user_id": new_id, "role": user.role}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role FROM users WHERE id=?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    raise HTTPException(status_code=404, detail="Usuario no encontrado")

@app.get("/businesses", response_model=List[BusinessModel])
def get_businesses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT b.*, 
        (SELECT COUNT(*) FROM appointments a WHERE a.business_id = b.id AND a.status = 'waiting') as queue_size
        FROM businesses b WHERE 1=1
    """
    params = []

    if category:
        query += " AND b.category = ?"
        params.append(category)
    
    if location:
        query += " AND b.location = ?"
        params.append(location)

    if search:
        query += " AND (b.name LIKE ? OR b.username LIKE ? OR b.location LIKE ? OR b.description LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term, search_term])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@app.get("/locations", response_model=List[str])
def get_locations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT location FROM businesses ORDER BY location ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row["location"] for row in rows]

@app.get("/categories", response_model=List[str])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM businesses ORDER BY category ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row["category"] for row in rows]

@app.get("/businesses/{business_id}", response_model=BusinessModel)
def get_business(business_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.*,
        (SELECT COUNT(*) FROM appointments a WHERE a.business_id = b.id AND a.status = 'waiting') as queue_size
        FROM businesses b WHERE b.id = ?
    """, (business_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    raise HTTPException(status_code=404, detail="Negocio no encontrado")

@app.get("/businesses/{business_id}/services", response_model=List[ServiceModel])
def get_services(business_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services WHERE business_id = ?", (business_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/businesses/{business_id}/employees", response_model=List[EmployeeModel])
def get_employees(business_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees WHERE business_id = ?", (business_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/businesses/{business_id}/kanban")
def get_kanban(business_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM services WHERE business_id = ?", (business_id,))
    services = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM employees WHERE business_id = ?", (business_id,))
    employees = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT a.id, a.user_id, a.guest_name, a.status, u.name as user_name, a.current_service_id
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.business_id = ? AND a.status IN ('waiting', 'in_progress')
    """, (business_id,))
    appointments = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "services": services,
        "employees": employees,
        "active_appointments": appointments
    }

class AdvanceRequest(BaseModel):
    employee_id: Optional[int] = None

@app.post("/appointments/{appointment_id}/advance")
def advance_appointment(appointment_id: int, req: AdvanceRequest = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,))
    app_row = cursor.fetchone()
    
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Turno no encontrado")
        
    if app_row['status'] == 'completed':
        conn.close()
        raise HTTPException(status_code=400, detail="El turno ya está completado")
        
    current_service_id = app_row['current_service_id']
    if current_service_id:
        cursor.execute("""
            UPDATE appointment_services 
            SET status = 'completed' 
            WHERE appointment_id = ? AND service_id = ?
        """, (appointment_id, current_service_id))
    
    cursor.execute("""
        SELECT service_id FROM appointment_services 
        WHERE appointment_id = ? AND status = 'pending' 
        ORDER BY order_index ASC LIMIT 1
    """, (appointment_id,))
    next_service_row = cursor.fetchone()
    
    if next_service_row:
        next_service_id = next_service_row['service_id']
        cursor.execute("""
            UPDATE appointments 
            SET current_service_id = ?, status = 'in_progress' 
            WHERE id = ?
        """, (next_service_id, appointment_id))
        msg = "Avanzado al siguiente servicio"
    else:
        cursor.execute("""
            UPDATE appointments 
            SET current_service_id = NULL, status = 'completed' 
            WHERE id = ?
        """, (appointment_id,))
        msg = "Todos los servicios completados"
        
    conn.commit()
    conn.close()
    
    return {"message": msg}

class TurnRequest(BaseModel):
    user_id: Optional[int] = None
    guest_name: Optional[str] = None
    service_ids: List[int]

@app.post("/businesses/{business_id}/turn")
def take_turn(business_id: int, req: TurnRequest):
    if not req.user_id and not req.guest_name:
        raise HTTPException(status_code=400, detail="Debe proveer user_id o guest_name")
        
    if not req.service_ids:
        raise HTTPException(status_code=400, detail="Debe seleccionar al menos un servicio")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Check if user already in waiting queue (only for registered users)
    if req.user_id:
        cursor.execute("SELECT id FROM appointments WHERE business_id = ? AND user_id = ? AND status = 'waiting'", (business_id, req.user_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Ya tienes un turno en la cola de este negocio")

    # 2. Fetch business hours
    cursor.execute("SELECT days_open, open_time, close_time FROM businesses WHERE id = ?", (business_id,))
    b_row = cursor.fetchone()
    
    if not b_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    from datetime import datetime
    now = datetime.now()
    # Python weekday: Mon=0, Sun=6. JS logic in frontend: Sun=0, Sat=6.
    # Convert Python to JS format: (now.weekday() + 1) % 7
    current_js_day = (now.weekday() + 1) % 7
    
    days_open = [int(d) for d in b_row["days_open"].split(",") if d.strip()]
    is_closed = False
    
    if current_js_day not in days_open:
        is_closed = True
    else:
        current_mins = now.hour * 60 + now.minute
        open_parts = [int(p) for p in b_row["open_time"].split(":")]
        close_parts = [int(p) for p in b_row["close_time"].split(":")]
        open_mins = open_parts[0] * 60 + open_parts[1]
        close_mins = close_parts[0] * 60 + close_parts[1]
        
        if current_mins < open_mins or current_mins > close_mins:
            is_closed = True

    # 3. Insert into appointments
    cursor.execute(
        "INSERT INTO appointments (business_id, user_id, guest_name, current_service_id) VALUES (?, ?, ?, ?)", 
        (business_id, req.user_id, req.guest_name, req.service_ids[0])
    )
    appointment_id = cursor.lastrowid
    
    # 4. Insert dynamic routing path
    for idx, s_id in enumerate(req.service_ids):
        cursor.execute(
            "INSERT INTO appointment_services (appointment_id, service_id, order_index) VALUES (?, ?, ?)",
            (appointment_id, s_id, idx)
        )
        
    conn.commit()
    conn.close()
    
    return {
        "message": "Turno tomado exitosamente",
        "appointment_id": appointment_id,
        "is_closed": is_closed,
        "open_time": b_row["open_time"]
    }

@app.get("/businesses/{business_id}/turn/{user_id}")
def get_turn_status(business_id: int, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT a.id, a.status, a.current_service_id, s.name as current_service_name
        FROM appointments a
        LEFT JOIN services s ON a.current_service_id = s.id
        WHERE a.business_id = ? AND a.user_id = ? AND a.status IN ('waiting', 'in_progress')
    """, (business_id, user_id))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return {"has_turn": False, "position": 0, "status": None, "current_service_name": None}
        
    my_app_id = row['id']
    status = row['status']
    current_service_name = row['current_service_name']
    
    cursor.execute("""
        SELECT COUNT(*) as pos FROM appointments 
        WHERE business_id = ? AND status IN ('waiting', 'in_progress') AND id <= ?
    """, (business_id, my_app_id))
    position = cursor.fetchone()['pos']
    
    conn.close()
    return {
        "has_turn": True, 
        "position": position, 
        "status": status, 
        "current_service_name": current_service_name
    }

@app.delete("/businesses/{business_id}/turn/{user_id}")
def cancel_turn(business_id: int, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM appointments WHERE business_id = ? AND user_id = ? AND status = 'waiting'", (business_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No tienes un turno activo en este negocio")

    cursor.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (row["id"],))
    conn.commit()
    conn.close()
    return {"message": "Turno cancelado exitosamente"}
