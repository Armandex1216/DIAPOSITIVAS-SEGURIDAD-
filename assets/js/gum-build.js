/* Calcula cifras y arma el contenido de la presentación GUM a partir de data/gum-data.js */
(function () {
  const G = window.GUM, $ = s => document.querySelector(s);
  const sum = a => a.reduce((s, x) => s + x, 0), pct = (a, b) => b ? a / b * 100 : 0;
  const f0 = v => Math.round(v).toLocaleString('es-PE'), f1 = v => v.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const Z = ['Presa', 'Selene', 'Pallancata'], ZL = { Presa: 'Presa de relaves', Selene: 'Selene', Pallancata: 'Pallancata' };
  const n = G.total, camp = sum(Z.map(z => G.zonaSitio[z].Campamento)), palN = sum(Object.values(G.zonaSitio.Pallancata));
  const same = G.retraso['Mismo día'], late = n - same, late2 = n - same - G.retraso['1 día'];
  const ab = G.abiertos, abHM = sum(Z.map(z => ab.zonaNivel[z].MEDIO + ab.zonaNivel[z].ALTO));
  const prog = G.programa, cOk = prog.comp.filter(p => p.e >= 1).length, eOk = prog.contr.filter(p => p.e >= 1).length;
  const progPct = pct(cOk + eOk, prog.comp.length + prog.contr.length);
  const var_ = pct(n - G.sepMismoPeriodo, G.sepMismoPeriodo);
  const meta = G.metaIAH, mOk = meta.filter(m => m[1] >= 4).length, mZero = meta.filter(m => !m[1]).length;
  G.calc = { n, camp, palN, same, late, ab, abHM, cOk, eOk, progPct, mOk, mZero };
  $('#g-corte').textContent = 'Hallazgos al ' + G.corte;
  $('#g-foot1').textContent = 'Hallazgos: 01–' + G.diasOct + '/10/2026 (corte del archivo) · OTO: mes completo';

  const K = [
    ['Hallazgos reportados', n, '', `${var_ >= 0 ? '+' : ''}${f1(var_)} % vs. los mismos ${G.diasOct} días de setiembre (${G.sepMismoPeriodo})`, '#c39531'],
    ['En frentes de trabajo', pct(G.frentes, n), '%', `${f0(G.frentes)} de ${n} fuera de campamento y servicios`, '#2f6db5'],
    ['Riesgo medio o alto', pct(G.medioAlto, n), '%', `${G.medioAlto} hallazgos · ${G.alto} de riesgo alto`, '#e6a316'],
    ['Abiertos en el sistema', ab.total, '', `${abHM} de riesgo medio/alto · el más antiguo: ${ab.max} días`, '#d23c3c'],
    ['Registrados el mismo día', pct(same, n), '%', `${late} ingresaron 1 o más días después`, '#7a5bd6'],
    ['Cumplimiento programa OTO', progPct, '%', `${cOk + eOk} de ${prog.comp.length + prog.contr.length} supervisores · ${G.oto.total} OTO`, '#1f9d5c']];
  $('#kpis').innerHTML = K.map(([k, v, s, d, c], i) => `<div class="card kpi" data-a="up" style="--c:${c}"><div class="sub">${k}</div><div class="big" data-count="${v}" data-dec="0" data-suf="${s}" data-cd="${.5 + i * .12}">0</div><div class="d">${d}</div></div>`).join('');

  const T = G.tendencia.series, tot = G.tendencia.labels.map((_, i) => sum(Z.map(z => T[z][i]))), L = tot.length - 1, pk = tot.indexOf(Math.max(...tot));
  $('#ins-tend').innerHTML = `<ul><li>El volumen tocó su máximo en <b>${G.tendencia.labels[pk]}</b> (${tot[pk]}) y desde julio viene bajando.</li><li>La <b>presa de relaves</b> pasó de ${f0(pct(T.Presa[0], tot[0]))} % del total en enero a ${f0(pct(T.Presa[L], tot[L]))} % en octubre, al ritmo del proyecto de recrecimiento.</li><li>Octubre va en <b>${n}</b> al día ${G.diasOct}: al mismo ritmo cerraría en ~${f0(n / G.diasOct * 31)}.</li></ul>`;
  $('#ins-donde').innerHTML = `<ul><li><b>${f0(pct(camp, n))} %</b> de los hallazgos (${camp}) se reporta en campamento y servicios.</li><li>En <b>Pallancata</b>, ${f0(pct(G.zonaSitio.Pallancata.Campamento, palN))} % de sus reportes son de campamento: es lo más fácil de reportar, no donde está el riesgo operativo.</li><li>La presa reporta casi todo en el frente (${G.zonaSitio.Presa.Frente} de ${sum(Object.values(G.zonaSitio.Presa))}).</li><li><b>Propuesta:</b> de los 4 hallazgos mensuales, al menos 3 en frentes de trabajo.</li></ul>`;
  const hmZ = Z.map(z => { const t = G.zonaNivel[z]; const nn = t.BAJO + t.MEDIO + t.ALTO; return [z, pct(t.MEDIO + t.ALTO, nn), nn]; });
  $('#ins-riesgo').innerHTML = `<ul>${hmZ.map(([z, p]) => `<li>${ZL[z]}: <b>${f0(p)} %</b> medio/alto</li>`).join('')}<li>La presa concentra la mayor severidad, que es lo esperado en el frente con más exposición.</li><li>Pallancata aporta ${f0(pct(palN, n))} % del volumen pero solo ${f0(pct(G.zonaNivel.Pallancata.MEDIO + G.zonaNivel.Pallancata.ALTO, G.medioAlto))} % del riesgo medio/alto: suma volumen con hallazgos de bajo riesgo.</li></ul>`;
  const over = sum(Object.values(ab.edad['>20']));
  $('#ins-ab').innerHTML = `<ul><li><b>${ab.total}</b> abiertos al ${G.corte}; <b>${abHM}</b> son medio/alto.</li><li>La presa concentra ${sum(Object.values(ab.zonaNivel.Presa))} (${f0(pct(sum(Object.values(ab.zonaNivel.Presa)), ab.total))} %).</li><li>Mediana de antigüedad: ${ab.mediana} días. <b>${over}</b> superan 20 días.</li><li>Priorizar el cierre de los medio/alto con fecha comprometida.</li></ul>`;
  $('#ins-ret').innerHTML = `<ul><li><b>${f1(pct(late, n))} %</b> se registró después del día de detección (${late} de ${n}).</li><li>${late2} hallazgos (${f1(pct(late2, n))} %) tardaron <b>2 días o más</b>.</li><li>Mientras no se registra, el hallazgo no tiene responsable ni seguimiento.</li><li><b>Meta propuesta:</b> 90 % registrado el mismo día, desde el celular en campo.</li></ul>`;
  const D = G.diario, mean = sum(D) / D.length, zeros = D.map((v, i) => v ? null : i + 1).filter(Boolean), top3 = [...D].sort((a, b) => b - a).slice(0, 3);
  G.calc.mean = mean;
  $('#ins-dia').innerHTML = `Promedio de <b>${f1(mean)} hallazgos por día</b>. ${zeros.length ? `Días sin reportes: ${zeros.join(', ')}.` : 'Todos los días tuvieron al menos un reporte.'} Los 3 días con más reportes suman <b>${f0(pct(sum(top3), sum(D)))} %</b> del mes: la reportabilidad depende de picos, no de un hábito diario.`;
  $('#ins-meta').innerHTML = `<ul><li><b>${mOk} de ${meta.length}</b> responsables alcanzan los 4 hallazgos (al ${G.corte}).</li><li><b>${mZero}</b> no registran ninguno.</li><li>Los 5 que más reportan aportan ${f0(pct(sum(meta.slice(0, 5).map(m => m[1])), sum(meta.map(m => m[1]))))} % del grupo.</li><li>La lista de control incluye personas que ya no figuran en la fuerza laboral: <b>depurarla cada mes</b>.</li></ul>`;

  const C = 2 * Math.PI * 50, ring = (p, c) => `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#efe7d6" stroke-width="16"/><circle class="arc" data-p="${p}" cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-dasharray="0 ${C}"/></svg>`;
  const cMiss = prog.comp.filter(p => !p.e).map(p => p.n), eMiss = prog.contr.filter(p => !p.e).map(p => `${p.n} (${p.emp})`);
  const cP = pct(cOk, prog.comp.length), eP = pct(eOk, prog.contr.length);
  $('#prog').innerHTML = `<div class="card" data-a="up"><div class="donut">${ring(cP, '#1f9d5c')}<div class="c"><div><b data-count="${cP}" data-suf="%">0</b><span>COMPAÑÍA</span></div></div></div><div><h3 style="font-size:40px">Compañía</h3><div class="lead"><b data-count="${cOk}">0</b> de ${prog.comp.length} supervisores cumplieron</div><div class="sub" style="margin-top:18px">No cumplieron</div><div class="names">${cMiss.map(x => `<span>${x}</span>`).join('')}</div></div></div>
  <div class="card" data-a="up" data-d=".15"><div class="donut">${ring(eP, '#d23c3c')}<div class="c"><div><b data-count="${eP}" data-suf="%">0</b><span>CONTRATISTAS</span></div></div></div><div><h3 style="font-size:40px">Contratistas</h3><div class="lead"><b data-count="${eOk}">0</b> de ${prog.contr.length} supervisores cumplieron</div><div class="sub" style="margin-top:18px">No cumplieron</div><div class="names">${eMiss.map(x => `<span>${x}</span>`).join('')}</div></div></div>`;
  $('#ins-prog').innerHTML = `Programa corregido: se retiraron <b>${prog.retirados.length}</b> supervisores que ya no figuran en la fuerza laboral (${prog.retirados.join(', ')}) y se incorporaron <b>${prog.comp.filter(p => p.nuevo).length}</b> que ya hacían OTO, entre ellos los de Selene. <b>AMBIPAR no registró ninguna OTO.</b>`;

  const oz = G.oto.zona, desv = G.oto.desvio;
  $('#ins-otoz').innerHTML = `<ul><li><b>${G.oto.total} OTO</b> en octubre: ${G.oto.seguro} seguras y <b>${desv} con desvío</b> (${f0(pct(desv, G.oto.total))} %).</li><li>La presa concentra ${oz.Presa.desvio} de los ${desv} desvíos.</li><li>El volumen cayó desde julio (102) a ${G.oto.mensual[8]}–${G.oto.total} por mes.</li><li>Orientar las OTO a tareas críticas del frente de presa.</li></ul>`;
  const od = G.oto.diario, oz0 = od.map((v, i) => v ? null : i + 1).filter(Boolean);
  let best = 0, cur = 0, bs = 0; od.forEach((v, i) => { if (!v) { cur++; if (cur > best) { best = cur; bs = i - cur + 2; } } else cur = 0; });
  const first = new Date(2026, 9, 1).getDay(), off = (first + 6) % 7;
  $('#cal').innerHTML = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => `<div class="dn">${d}</div>`).join('') + Array(off).fill('<div class="day empty"></div>').join('') +
    od.map((v, i) => `<div class="day ${v ? '' : 'z'}" data-a="pop" data-gap=".025" style="${v ? `background:rgba(31,157,92,${.12 + Math.min(1, v / 7) * .75});color:${v >= 4 ? '#fff' : ''}` : ''}"><small style="${v >= 4 ? 'color:#e6fff0' : ''}">${i + 1}</small><b style="${v >= 4 ? 'color:#fff' : ''}">${v}</b></div>`).join('');
  $('#ins-cal').innerHTML = `<ul><li><b>${oz0.length} días sin OTO</b> de 31 (${oz0.join(', ')}).</li><li>Racha más larga sin observaciones: <b>${best} días</b> (del ${bs} al ${bs + best - 1} de octubre).</li><li>La última semana concentró ${sum(od.slice(24))} OTO (${f0(pct(sum(od.slice(24)), G.oto.total))} %): se dejan para fin de mes.</li><li>Programar la OTO de cada supervisor en una semana fija.</li></ul>`;

  const Q = [[G.mediaAltoSinCritico, 'medio/alto sin riesgo crítico', 'el nivel y el riesgo crítico no son coherentes'], [pct(G.sinDesignado, n), '% sin usuario designado', 'nadie es responsable nominal del cierre', '%'], [late2, 'registrados con 2+ días de retraso', 'riesgo sin seguimiento formal'], [G.topTipos[0][1] + G.topTipos[1][1], 'de orden/limpieza y señalización', 'los dos tipos más fáciles de reportar']];
  $('#q4').innerHTML = Q.map(([v, k, d, s], i) => `<div class="card" data-a="up"><div class="big badc" data-count="${v}" data-suf="${s || ''}" data-cd="${.5 + i * .12}">0</div><h3 style="font-size:26px;margin-top:14px">${k}</h3><div class="muted" style="font-size:20px;font-weight:600">${d}</div></div>`).join('');

  const P = [['Reportar donde está el riesgo', '3 de cada 4 hallazgos en frentes de trabajo', `Campamento ${f0(pct(camp, n))} % → ≤ 25 %`, 'Jefes de área'], ['Registro el mismo día', 'Registro desde el celular en campo; revisión al cierre de guardia', `${f0(pct(same, n))} % → 90 %`, 'Supervisores'], ['Cierre según riesgo', 'Medio/alto ≤ 7 días, bajo ≤ 15 días, ninguno > 20 días', `${abHM} medio/alto abiertos`, 'Áreas responsables'], ['Programa OTO depurado cada mes', 'Base: fuerza laboral del mes; OTO fija por semana; seguimiento a AMBIPAR', `${f0(progPct)} % → 100 %`, 'Seguridad · EECC'], ['Calidad del registro', 'Zona, usuario designado y riesgo crítico obligatorios en Safety HOC', `${G.sinDesignado} sin designado`, 'Seguridad · TI']];
  $('#plan').innerHTML = P.map(([a, d, m, r], i) => `<div class="row" data-a="right" data-gap=".1"><b class="n">${String(i + 1).padStart(2, '0')}</b><div class="a">${a}<small>${d}</small></div><div class="m">${m}</div><div class="pill">${r}</div></div>`).join('');
})();
