@echo off
REM ============================================
REM  Abre la web con el chat funcionando
REM ============================================
echo Arrancando Ollama...

REM Permite que la web hable con Ollama
set OLLAMA_ORIGINS=*

REM Arranca Ollama en segundo plano
start "" /B ollama serve

REM Espera a que encienda
timeout /t 3 /nobreak >nul

REM Descarga el modelo si falta (solo la primera vez)
echo Comprobando el modelo llama3.2...
ollama pull llama3.2

REM Sirve la web en http (sin bloqueo del navegador)
echo.
echo Abre esta direccion en tu navegador:
echo   http://localhost:8000
echo.
start "" http://localhost:8000
python -m http.server 8000 --bind 127.0.0.1
