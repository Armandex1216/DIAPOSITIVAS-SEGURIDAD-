"""Voz natural de Lucho: convierte texto en audio con las voces neurales de Microsoft (las mismas de Edge "Natural").
Gratis, sin cuenta ni clave. GET /api/tts?t=texto&v=es-PE-AlexNeural&r=+10%&p=+0Hz
Responde JSON {a: mp3 en base64, w: [[inicio_ms, dur_ms, palabra], ...]}. Vercel guarda la respuesta en su caché:
el mismo texto no se vuelve a generar."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import asyncio, base64, json, re
import edge_tts

VOZ = re.compile(r"^es-[A-Z]{2}-[A-Za-z]+Neural$")
RATE = re.compile(r"^[+-]\d{1,3}%$")
PITCH = re.compile(r"^[+-]\d{1,3}Hz$")


async def sintetizar(texto, voz, rate, pitch):
    c = edge_tts.Communicate(texto, voz, rate=rate, pitch=pitch, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append([round(ch["offset"] / 1e4), round(ch["duration"] / 1e4), ch["text"]])
    return bytes(audio), words


class handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json", cache=False):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable" if cache else "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.end_headers()

    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        g = lambda k, d: (q.get(k) or [d])[0]
        texto = g("t", "").strip()[:1500]
        voz, rate, pitch = g("v", "es-PE-AlexNeural"), g("r", "+0%"), g("p", "+0Hz")
        if not texto or not VOZ.match(voz) or not RATE.match(rate) or not PITCH.match(pitch):
            return self._send(400, b'{"error":"parametros"}')
        try:
            audio, words = asyncio.run(sintetizar(texto, voz, rate, pitch))
            if not audio:
                raise RuntimeError("sin audio")
        except Exception as e:  # el navegador usa su propia voz si esto falla
            return self._send(502, json.dumps({"error": str(e)[:200]}).encode())
        body = json.dumps({"a": base64.b64encode(audio).decode(), "w": words}, ensure_ascii=False).encode()
        self._send(200, body, cache=True)
