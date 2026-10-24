import sqlite3
import os
from database import get_db_connection, init_db

def seed():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS appointment_services")
    cursor.execute("DROP TABLE IF EXISTS appointments")
    cursor.execute("DROP TABLE IF EXISTS services")
    cursor.execute("DROP TABLE IF EXISTS employees")
    cursor.execute("DROP TABLE IF EXISTS businesses")
    cursor.execute("DROP TABLE IF EXISTS users")
    conn.commit()
    conn.close()

    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    print("Seeding database with real relational turns...")

    # USERS
    owners_data = [
        ("carlos.perez@example.com", "123456", "Carlos Perez", "dueño"),
        ("sofia.nails@example.com", "123456", "Sofia Ramirez", "dueño"),
        ("jorge.tattoo@example.com", "123456", "Jorge Gonzalez", "dueño")
    ]
    cursor.executemany("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", owners_data)

    clients_data = [
        ("user1@test.com", "123456", "Juan Duarte", "cliente"),
        ("user2@test.com", "123456", "Pedro Martinez", "cliente"),
        ("user3@test.com", "123456", "Ana Rodriguez", "cliente")
    ]
    cursor.executemany("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", clients_data)

    cursor.execute("SELECT id, email FROM users")
    user_map = {row['email']: row['id'] for row in cursor.fetchall()}

    # BUSINESSES
    businesses_data = [
        (user_map["carlos.perez@example.com"], "barberiavip", "Super Barbería VIP", "El mejor recorte de la zona con aire full.", "Santo Domingo", "Barbería", "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800", "1.2 km", "LINEAL", "08:00", "20:00", "1,2,3,4,5,6", "809-555-1234"),
        (user_map["sofia.nails@example.com"], "sofia_nails", "Sofía Nails Studio", "Especialistas en acrílicas y gel, estamos frente al parque.", "Santo Domingo", "Uñas", "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800", "3.5 km", "ESTACIONES", "09:00", "19:00", "1,2,3,4,5,6", "829-444-5678"),
        (user_map["jorge.tattoo@example.com"], "tinta_negra_rd", "Estudio Tinta Negra", "Tatuajes personalizados y piercings con higiene garantizada.", "Santo Domingo", "Tatuajes", "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&q=80&w=800", "5.1 km", "LINEAL", "11:00", "20:00", "1,2,3,4,5,6", "809-999-0000")
    ]
    cursor.executemany(
        "INSERT INTO businesses (owner_id, username, name, description, location, category, image_url, distance, queue_type, open_time, close_time, days_open, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        businesses_data
    )

    cursor.execute("SELECT id, username FROM businesses")
    biz_map = {row['username']: row['id'] for row in cursor.fetchall()}

    # EMPLOYEES
    employees_data = [
        (biz_map["barberiavip"], "Pedro (Barbero)", "DISPONIBLE"),
        (biz_map["barberiavip"], "Juan (Barbero)", "OCUPADO"),
        (biz_map["sofia_nails"], "Ana (Lavado)", "DISPONIBLE"),
        (biz_map["sofia_nails"], "Maria (Uñas)", "OCUPADO"),
        (biz_map["tinta_negra_rd"], "Jorge", "DISPONIBLE"),
    ]
    cursor.executemany("INSERT INTO employees (business_id, name, status) VALUES (?, ?, ?)", employees_data)

    # SERVICES
    services_data = [
        (biz_map["barberiavip"], "Corte de Pelo", 25, 0, 2),
        (biz_map["barberiavip"], "Barba", 15, 0, 2),
        (biz_map["sofia_nails"], "Lavado de Cabello", 15, 0, 2), # 2 lavamanos
        (biz_map["sofia_nails"], "Secado a Máquina", 30, 1, 4),  # 4 secadoras (autonomo)
        (biz_map["sofia_nails"], "Manicura", 45, 0, 3), # 3 manicuristas
        (biz_map["tinta_negra_rd"], "Tatuaje Pequeño", 60, 0, 1),
    ]
    cursor.executemany("INSERT INTO services (business_id, name, average_duration_minutes, is_autonomous, capacity) VALUES (?, ?, ?, ?, ?)", services_data)

    conn.commit()
    conn.close()
    print("Database seeded completely with new dynamic routing schema!")

if __name__ == "__main__":
    seed()
