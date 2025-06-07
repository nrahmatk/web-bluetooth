@echo off
echo ========================================
echo   Bluetooth Printer HTTPS Server
echo ========================================
echo.
echo Starting HTTPS server for Web Bluetooth...
echo URL: https://localhost:8443
echo.
echo CTRL+C to stop server
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python tidak ditemukan! Instalasi Python terlebih dahulu.
    echo Download dari: https://python.org
    pause
    exit /b 1
)

REM Generate self-signed certificate if not exists
if not exist server.crt (
    echo Generating self-signed SSL certificate...
    openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"
    if %errorlevel% neq 0 (
        echo OpenSSL tidak ditemukan. Menggunakan alternatif...
        echo Silakan generate SSL certificate manual atau gunakan development server lain.
    )
)

REM Start HTTPS server with Python
python -c "
import http.server
import ssl
import socketserver
import os

PORT = 8443
web_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('server.crt', 'server.key')
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print(f'HTTPS Server running at https://localhost:{PORT}/')
        print('Press Ctrl+C to stop...')
        httpd.serve_forever()
    except FileNotFoundError:
        print('SSL certificate not found. Running HTTP server instead...')
        print(f'HTTP Server running at http://localhost:{PORT}/')
        print('WARNING: Web Bluetooth requires HTTPS!')
        httpd.serve_forever()
    except Exception as e:
        print(f'Error: {e}')
        print('Trying alternative method...')
        # Fallback to HTTP
        httpd.serve_forever()
"

pause
