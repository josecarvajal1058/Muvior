# Instrucciones para iniciar Muvior

Sigue estos pasos para encender los servidores de desarrollo:

## 1. Entrar a la carpeta del proyecto

Abre tu terminal y asegúrate de estar en la raíz:

```bash
cd ~/Documents/Muvior
```

## 2. Iniciar el Backend (Terminal 1)

Copia y pega esto en la primera terminal:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

## 3. Iniciar el Frontend (Terminal 2)

Abre una **nueva terminal**, entra a la carpeta del proyecto y ejecuta:

```bash
cd ~/Documents/Muvior
cd frontend
npm start
```
