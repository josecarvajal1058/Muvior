import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "muvior.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        distance TEXT,
        queue_type TEXT DEFAULT 'LINEAL',
        open_time TEXT DEFAULT '09:00',
        close_time TEXT DEFAULT '18:00',
        days_open TEXT DEFAULT '1,2,3,4,5,6',
        phone TEXT,
        FOREIGN KEY (owner_id) REFERENCES users (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'DISPONIBLE',
        FOREIGN KEY (business_id) REFERENCES businesses (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        average_duration_minutes INTEGER DEFAULT 20,
        is_autonomous BOOLEAN DEFAULT 0,
        capacity INTEGER DEFAULT 1,
        FOREIGN KEY (business_id) REFERENCES businesses (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        user_id INTEGER,
        guest_name TEXT,
        status TEXT DEFAULT 'waiting',
        current_service_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (current_service_id) REFERENCES services (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointment_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (appointment_id) REFERENCES appointments (id),
        FOREIGN KEY (service_id) REFERENCES services (id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
