# Bluetooth Printer HTTPS Server
# PowerShell script to run HTTPS server for Web Bluetooth API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Bluetooth Printer HTTPS Server" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting HTTPS server for Web Bluetooth..." -ForegroundColor Green
Write-Host "URL: https://localhost:8443" -ForegroundColor Yellow
Write-Host ""
Write-Host "CTRL+C to stop server" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available (preferred method)
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "Using Node.js: $nodeVersion" -ForegroundColor Green
        
        # Check if http-server is installed
        $httpServerCheck = npm list -g http-server 2>$null
        if (-not $httpServerCheck -or $httpServerCheck -match "empty") {
            Write-Host "Installing http-server globally..." -ForegroundColor Yellow
            npm install -g http-server
        }
        
        Write-Host "Starting HTTPS server with Node.js..." -ForegroundColor Green
        # Start HTTPS server with self-signed certificate
        http-server . -p 8443 -S -C cert.pem -K key.pem --cors
        exit
    }
} catch {
    Write-Host "Node.js not found, trying Python..." -ForegroundColor Yellow
}

# Check if Python is available (fallback method)
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "Using Python: $pythonVersion" -ForegroundColor Green
        
        Write-Host "Starting HTTPS server with Python..." -ForegroundColor Green
        
        # Python HTTPS server script
        $pythonScript = @"
import http.server
import ssl
import socketserver
import os

PORT = 8443
web_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler

class CORSRequestHandler(Handler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

with socketserver.TCPServer(('', PORT), CORSRequestHandler) as httpd:
    try:
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.check_hostname = False
        context.load_cert_chain('server.crt', 'server.key')
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print(f'HTTPS Server running at https://localhost:{PORT}/')
        print('Press Ctrl+C to stop...')
        httpd.serve_forever()
    except FileNotFoundError:
        print('SSL certificate not found. Generating self-signed certificate...')
        print('Please install OpenSSL or use Node.js method.')
        print(f'Running HTTP server at http://localhost:{PORT}/ (Bluetooth won\'t work)')
        httpd.serve_forever()
    except Exception as e:
        print(f'Error: {e}')
        httpd.serve_forever()
"@
        
        python -c $pythonScript
        exit
    }
} catch {
    Write-Host "Python not found either." -ForegroundColor Red
}

# If neither Node.js nor Python found
Write-Host "ERROR: Neither Node.js nor Python found!" -ForegroundColor Red
Write-Host ""
Write-Host "Please install one of the following:" -ForegroundColor Yellow
Write-Host "1. Node.js (Recommended): https://nodejs.org" -ForegroundColor Cyan
Write-Host "2. Python: https://python.org" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternative solutions:" -ForegroundColor Yellow
Write-Host "- Use Live Server extension in VS Code with HTTPS" -ForegroundColor Cyan
Write-Host "- Deploy to GitHub Pages or Netlify (HTTPS by default)" -ForegroundColor Cyan
Write-Host "- Use localhost tunnel services like ngrok" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
