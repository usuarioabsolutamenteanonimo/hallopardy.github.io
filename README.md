# 🎵 <span style="color:#FFD700">Jeoparty Music — Edición Musical</span>

> Una versión moderna y musical del clásico **Jeopardy!**, creada para desafiar tus conocimientos en un tablero interactivo lleno de audio, vídeo y estilo.

---

## ✨ <span style="color:#00BFFF">Características principales</span>

- 🎶 **7 categorías musicales únicas:**
  1. Anime  
  2. Cultura popular  
  3. Rock / Metal  
  4. Cultura digital / memes  
  5. Videojuegos  
  6. <span style="color:#ff69b4">Musicales</span> *(¡nueva!)*  
  7. ??? *(aleatoria o impredecible)*  

- 💰 Puntuaciones clásicas: *200 – 400 – 600 – 800 – 1000 puntos*  
- 🎧 **Dos pistas por pregunta:**
  - Principal (gratuita)
  - Secundaria (−100 puntos, ilimitada por turno)
- ⏹ Botones para **detener la música** fácilmente  
- 🏁 Pantalla de **victoria automática** al completar el tablero  
- ⚙️ Herramientas de control:
  - Ajustar puntos manualmente  
  - Resetear preguntas por error  
  - Reiniciar partida completa  
- 💾 Guardado automático en *localStorage*  
- 🔊 Animaciones y efectos de sonido al cambiar de turno  

---

## 🕹️ <span style="color:#FF7F50">Cómo jugar</span>

1. Abre la página en tu navegador o en GitHub Pages.  
2. Configura los equipos y pulsa **Crear juego**.  
3. Selecciona una categoría y puntuación.  
4. Escucha la pista principal y, si lo deseas, paga 100 pts por la pista secundaria.  
5. Pulsa **Resolver** para ver el vídeo de respuesta.  
6. El turno cambiará automáticamente al siguiente equipo.  
7. Al finalizar todas las preguntas, se mostrará la **pantalla de victoria**.  

---

## 📁 <span style="color:#DA70D6">Estructura de archivos</span>

```
Jeoparty-Music/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
├── assets/
│   ├── audio/
│   │   ├── anime/
│   │   ├── culturapopular/
│   │   ├── rockmetal/
│   │   ├── memeoculturadigital/
│   │   ├── videojuegos/
│   │   ├── musicales/
│   │   └── random/
│   │
│   ├── videos/
│   └── cambiarturno.mp3
│
└── favicon.ico (opcional)
```

---

> Cada pregunta debe incluir dos clips (`main` y `secondary`) y un vídeo (`X-[puntos].mp4`).

---

## 💡 <span style="color:#F0E68C">Consejos</span>

- Usa clips de **5–10 segundos** para mantener el ritmo.  
- Los nombres de archivo deben seguir este formato:  
  - `assets/audio/[categoria]/[valor]-main.mp3`  
  - `assets/audio/[categoria]/[valor]-secondary.mp3`  
  - `assets/videos/[categoria]-[valor].mp4`  
- El sonido **cambiarturno.mp3** se reproduce entre turnos.

---

## 🏆 <span style="color:#ADFF2F">Créditos</span>

Creado con ❤️ en HTML, CSS y JavaScript.  
Diseñado para partidas musicales entre amigos.  
Inspirado en el espíritu competitivo de *Jeopardy!* y el amor por la música 🎶

---

## 📜 <span style="color:#FFA07A">Licencia</span>

Uso libre para fines personales y educativos.  
Evita compartir clips con derechos de autor sin permiso de sus creadores.
