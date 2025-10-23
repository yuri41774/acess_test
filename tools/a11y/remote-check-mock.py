#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path != '/api/check':
            self._set_headers(404)
            self.wfile.write(json.dumps({'error':'not found'}).encode())
            return
        length = int(self.headers.get('content-length', '0'))
        body = self.rfile.read(length).decode('utf-8') if length>0 else ''
        try:
            payload = json.loads(body) if body else {}
        except Exception:
            payload = {}
        # Return a canned response mimicking axe result structure
        response = {
            'url': payload.get('url'),
            'result': {
                'axe': {
                    'violations': [],
                    'passes': [],
                    'incomplete': []
                },
                'pixels': []
            }
        }
        self._set_headers(200)
        self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv)>1 else 3001
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"mock remote-check-server listening on {port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
        print('shutting down')
