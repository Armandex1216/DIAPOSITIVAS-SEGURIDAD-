/* Carpetas, plantillas y presentaciones fijas de la página de inicio.
   Las presentaciones creadas con «+ Nueva» se guardan en la nube (tabla diapo_decks). */
window.PLANTILLAS = {
  diario: { nombre: 'Reporte diario de seguridad', archivo: 'diario.html', dia: 'm', titulo: 'Reporte diario de seguridad', laminas: 6 },
  gum: { nombre: 'Reunión GUM (martes)', archivo: 'gum.html', dia: 2, titulo: 'Reunión GUM', laminas: 11 },
  'riesgos-opt': { nombre: 'Análisis de eventos y riesgos críticos · OPT (sábados)', archivo: 'riesgos-opt.html', dia: 6, titulo: 'Análisis de eventos y riesgos críticos', laminas: 7 },
  'riesgos-corp': { nombre: 'Riesgos críticos corporativo', archivo: 'riesgos-corp.html', titulo: 'Riesgos críticos corporativo', laminas: 5 },
  csst: { nombre: 'Reunión ordinaria CSST', archivo: 'csst-noviembre-2026.html', titulo: 'Reunión ordinaria CSST', laminas: 16 },
  blanco: { nombre: 'En blanco', archivo: 'blanco.html', titulo: 'Nueva presentación', laminas: 3 }
};
window.CATALOGO = [
  { id: 'reporte-diario', nombre: 'REPORTE DIARIO', plantilla: 'diario', anual: true, portada: 'assets/img/diario/portada-diario.jpg', items: [] },
  { id: 'riesgos-opt', nombre: 'RIESGOS CRÍTICOS OPT', plantilla: 'riesgos-opt', portada: 'assets/img/portada.jpg', items: [] },
  { id: 'gum', nombre: 'REUNIÓN GUM', plantilla: 'gum', portada: 'assets/img/portada.jpg', items: [
    { titulo: 'Reunión GUM · hallazgos y OTO', fecha: 'Octubre 2026', archivo: 'gum-octubre-2026.html', deck: 'gum-2026-10', laminas: 15, portada: 'assets/img/portada.jpg' }
  ] },
  { id: 'gerencia-co', nombre: 'REUNIÓN GERENCIA CORPORATIVA', plantilla: 'blanco', portada: 'assets/img/portada.jpg', items: [] },
  { id: 'riesgos-cor', nombre: 'RIESGOS CRÍTICOS CORPORATIVOS', plantilla: 'riesgos-corp', portada: 'assets/img/portada.jpg', items: [] },
  { id: 'mensaje', nombre: 'MENSAJE DE SEGURIDAD', plantilla: 'blanco', portada: '', items: [] },
  { id: 'certificados', nombre: 'Certificados', plantilla: 'blanco', portada: '', items: [] },
  { id: 'csst', nombre: 'REUNIÓN CSST', plantilla: 'csst', portada: 'assets/img/portada.jpg', items: [
    { titulo: 'Reunión ordinaria CSST', fecha: 'Noviembre 2026 · resultados de octubre', archivo: 'csst-noviembre-2026.html', deck: 'csst-2026-11', laminas: 16, portada: 'assets/img/portada.jpg' }
  ] },
  { id: 'gerencial-ec', nombre: 'Reunión Gerencial E.C.', plantilla: 'blanco', portada: '', items: [] },
  { id: 'reconocimiento-oto', nombre: 'RECONOCIMIENTO OTO', plantilla: 'blanco', portada: '', items: [] },
  { id: 'jornada', nombre: 'JORNADA DE SEGURIDAD', plantilla: 'blanco', portada: '', items: [] },
  { id: 'benchmarking', nombre: 'BENCHMARKING 2026', plantilla: 'blanco', portada: '', items: [] },
  { id: 'csst-2026', nombre: 'CSST 2026', plantilla: 'csst', portada: '', items: [] },
  { id: 'dia-mundial', nombre: 'DÍA MUNDIAL DE LA SEGURIDAD', plantilla: 'blanco', portada: '', items: [] },
  { id: 'panel', nombre: 'PANEL DE SEGURIDAD', plantilla: 'blanco', portada: '', items: [] }
];
