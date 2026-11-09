/* Construye el contenido repetitivo de la presentación CSST antes de iniciar el motor.
   Todo lo que se genera aquí se puede editar luego en modo edición (tecla E). */
(function () {
  const $ = s => document.querySelector(s);

  // --- rol mensual del momento de seguridad (NOW = mes de la reunión, 0 = enero)
  const roles = ['Seguridad Industrial', 'Salud e Higiene', 'Gestión Humana', 'Representantes de los Trabajadores', 'Mantenimiento', 'GUM', 'Seguridad Industrial', 'Salud e Higiene', 'Gestión Humana', 'Representantes de los Trabajadores', 'Mantenimiento', 'GUM'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const NOW = 10;
  $('#months').innerHTML = meses.map((m, i) => `<div class="mo ${i < NOW ? 'past' : ''} ${i === NOW ? 'now' : ''}" data-a="${i === NOW ? 'pop' : 'up'}" data-gap=".05"><div class="n" data-noedit>${String(i + 1).padStart(2, '0')}</div><div class="m">${m}</div><div class="r">${roles[i]}</div></div>`).join('');

  // --- eventos: [nombre, color, mes, acumulado]
  const EV = [
    ['Accidente mortal', '#4b86d9', 0, 0],
    ['Accidente con tiempo perdido', '#33b2d9', 1, 1],
    ['Accidentes leves', '#ee7448', 0, 2],
    ['Incidentes', '#f2b61c', 2, 10],
    ['Incidentes peligrosos', '#d9534f', 0, 0],
    ['Daño a la propiedad', '#a67be0', 0, 0],
    ['Enfermedades ocupacionales leves', '#7cbd4a', 0, 0],
    ['Enfermedades ocupacionales', '#3fa58e', 0, 0]
  ];
  // Pallancata: [mes, acumulado]; Selene: todo en 0
  const SEL = EV.map(() => [0, 0]);
  const hx = (c, v, d, dim) => `<div class="hx" style="background:${c}${dim ? ';filter:saturate(.85) brightness(.92)' : ''}" data-a="pop" data-gap=".02"><span data-count="${v}" data-pad="1" data-cd="${d}">0</span></div>`;
  $('#evt').innerHTML = `<span></span><p class="grp p">Pallancata</p><p class="grp s">Selene</p>` +
    `<p class="h" style="text-align:left">Evento</p><p class="h">Octubre</p><p class="h">Acum. 2026</p><p class="h">Octubre</p><p class="h">Acum. 2026</p>` +
    EV.map((e, i) => { const [n, c, a, b] = e, [sa, sb] = SEL[i];
      return `<div class="row ${a || b || sa || sb ? '' : 'zero'}"><div class="lab" style="background:${c}" data-a="left" data-gap=".05"><span class="edit">${n}</span></div>` +
        hx(c, a, .6 + i * .07) + hx(c, b, .75 + i * .07, 1) + hx(c, sa, .9 + i * .07) + hx(c, sb, 1.05 + i * .07, 1) + '</div>'; }).join('');

  // --- pedidos del CSST (acta anterior)
  const AC = [
    ['Zona Virgen del Carmen', 'Protocolo de ingreso a mina con deficiencias de comunicación', 'MEDIO', 'Evaluación del protocolo de ingreso a mina; verificar cumplimiento y efectividad', 'Henry Meza', '28/10/2026', 100],
    ['Zona Virgen del Carmen', 'Deficiente comunicación radial entre el óvalo y la subestación', 'MEDIO', 'Evaluación física del cable', 'José Flores / Gonzalo Condo', '20/10/2026', 100],
    ['Grifo Pallancata', 'Acumulación de vehículos móviles durante el abastecimiento de combustible', 'BAJO', 'Evaluación de los horarios de abastecimiento del grifo', 'Jim Jove', '25/10/2026', 100],
    ['Selene · cruce de Huallunca', 'Equipos transitan a velocidad en el ingreso', 'MEDIO', 'Implementar badén para reducir la velocidad', 'Elvis Cordova', '20/10/2026', 100],
    ['Comedor Selene', 'Deficiente cantidad de jabón líquido', 'BAJO', 'Implementar jabón líquido', 'Victor Guillén', '15/10/2026', 100],
    ['Comedor Selene', 'Deficiente cantidad de mesas', 'BAJO', 'Evaluar implementación de mesas', 'Victor Guillén', '20/10/2026', 100]
  ];
  $('#acuerdos').innerHTML = `<div class="ac h"><p>N°</p><p>Lugar</p><p>Peligro / preocupación</p><p>Riesgo</p><p>Control</p><p>Responsable</p><p>Fecha</p><p style="text-align:right">Avance</p></div>` +
    AC.map(([l, p, r, c, resp, f, pc], i) => `<div class="ac" data-a="right" data-gap=".08"><div class="no" data-noedit>${String(i + 1).padStart(2, '0')}</div><div class="loc">${l}</div><div class="tx">${p}</div><span class="risk edit ${r}">${r}</span><div class="tx">${c}</div><div class="resp">${resp}</div><div class="fe">${f}</div><div><div class="bar"><i></i></div><div class="pct">${pc}%</div></div></div>`).join('');
})();
