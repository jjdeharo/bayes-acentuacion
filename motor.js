/*
 * Motor bayesiano combinado: nivel ordinal global + diagnóstico
 * multifactorial de errores. Demostración: acentuación gráfica
 * (Lengua Castellana, 1.º–2.º ESO).
 *
 * El estado del alumno es una distribución conjunta exacta sobre
 * nivel × perfil de errores (3 niveles × 2^3 perfiles = 24 estados):
 *  - el nivel es ordinal y su verosimilitud de acierto la genera la
 *    función IRT 3PL;
 *  - los errores diagnosticables pueden coexistir (perfiles completos),
 *    con verosimilitudes explícitas por opción: el distractor
 *    característico de cada error atrae al alumno que lo comete.
 *
 * Mantener la conjunta (y no dos distribuciones independientes que se
 * re-factorizan tras cada respuesta) es lo que permite atribuir bien
 * cada fallo: si el alumno elige el distractor característico, la masa
 * de probabilidad se desplaza hacia «tiene ese error» sin arrastrar
 * indebidamente el nivel, porque la correlación entre ambas cosas se
 * conserva. Al exterior se exponen las marginales: P(nivel) y
 * P(presente) por error.
 */

const NIVELES = [
  {
    id: 'INICIANDO',
    nombre: 'Iniciando',
    theta: -2,
    descripcion:
      'Todavía está adquiriendo las reglas básicas de acentuación: le ' +
      'cuesta localizar la sílaba tónica y aplicar las reglas de agudas, ' +
      'llanas y esdrújulas.',
    recomendacion:
      'Empezar por la sílaba tónica (dar palmas, alargar la sílaba fuerte) ' +
      'y automatizar la clasificación aguda / llana / esdrújula antes de ' +
      'memorizar las reglas de la tilde.'
  },
  {
    id: 'AVANZANDO',
    nombre: 'Avanzando',
    theta: 0,
    descripcion:
      'Conoce las reglas generales y las aplica en los casos más ' +
      'frecuentes, pero aún duda en palabras menos comunes o en los casos ' +
      'especiales (hiatos, tilde diacrítica).',
    recomendacion:
      'Practicar con dictados breves y corrección razonada: ante cada ' +
      'palabra, verbalizar la regla que se aplica. Insistir en los casos ' +
      'especiales que el diagnóstico haya señalado.'
  },
  {
    id: 'DOMINANDO',
    nombre: 'Dominando',
    theta: 2,
    descripcion:
      'Aplica con seguridad las reglas generales y los casos especiales ' +
      'más frecuentes de la acentuación.',
    recomendacion:
      'Avanzar hacia casos límite: adverbios en -mente, palabras ' +
      'compuestas, extranjerismos adaptados y los cambios de la ' +
      'Ortografía de 2010 (solo, guion, este).'
  }
];

/*
 * Errores diagnosticables. No son excluyentes: un alumno puede
 * presentar varios a la vez, así que cada uno mantiene su propia
 * probabilidad P(presente), con prior 0,25.
 */
const FACTORES = [
  {
    id: 'TONICA',
    nombre: 'Reglas generales (aguda, llana, esdrújula)',
    resumen:
      'no localiza con seguridad la sílaba tónica o no aplica las reglas ' +
      'de agudas, llanas y esdrújulas',
    descripcion:
      'No identifica con seguridad la sílaba tónica o no aplica las ' +
      'reglas generales: pone tilde donde no toca («exámen») o la omite ' +
      'donde es obligatoria («carcel», «cancion»).',
    recomendacion:
      'Volver a la sílaba tónica: separar en sílabas, marcar la fuerte y ' +
      'clasificar la palabra antes de decidir la tilde. Después, ' +
      'practicar cada regla por separado con listas contrastadas ' +
      '(examen/exámenes, cárcel/carceles inventadas, etc.).'
  },
  {
    id: 'HIATO',
    nombre: 'Hiatos con vocal cerrada tónica',
    resumen:
      'no reconoce que la vocal cerrada tónica junto a una abierta rompe ' +
      'el diptongo y lleva tilde siempre (María, país, oído)',
    descripcion:
      'Aplica las reglas generales pero trata «María», «país» u «oído» ' +
      'como si tuvieran diptongo: no ve que la vocal cerrada tónica (i, u) ' +
      'junto a una abierta forma hiato y lleva tilde siempre, aunque la ' +
      'palabra incumpla las reglas generales.',
    recomendacion:
      'Contrastar pares diptongo/hiato pronunciándolos despacio ' +
      '(peine/reído, causa/baúl): si la i o la u suenan fuertes y en ' +
      'sílaba propia, hay hiato y la tilde es obligatoria.'
  },
  {
    id: 'DIACRITICA',
    nombre: 'Tilde diacrítica',
    resumen:
      'confunde los monosílabos que se distinguen por la tilde ' +
      '(tú/tu, él/el, sé/se, más/mas, sí/si, dé/de, qué/que)',
    descripcion:
      'Confunde los pares que solo se distinguen por la tilde diacrítica: ' +
      'tú/tu, él/el, sé/se, más/mas, sí/si, dé/de, té/te y los ' +
      'interrogativos qué, quién, cómo, cuándo.',
    recomendacion:
      'Trabajar cada par en frases donde aparezcan los dos usos («Tu ' +
      'hermano y tú...») y aplicar la prueba de sustitución: si puede ' +
      'cambiarse por «a mí», «él», «todavía»..., lleva tilde.'
  }
];

/*
 * Banco de preguntas. Cada ítem ataca un factor (`factor`), tiene tres
 * opciones, una dificultad IRT `b` y un `distractor`: la opción que
 * elige característicamente el alumno que comete ese error. La tercera
 * opción es un error genérico que no captura ningún factor.
 */
const BANCO = [
  /* --- Reglas generales --- */
  {
    id: 't1', factor: 'TONICA', b: -1, corto: 'canción',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['cancion', 'canción', 'cánción'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Canción» es aguda (can-CIÓN) y acaba en -n: lleva tilde por la ' +
      'regla de las agudas.'
  },
  {
    id: 't2', factor: 'TONICA', b: -1, corto: 'jóvenes',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['jóvenes', 'jovenes', 'jovénes'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Jóvenes» es esdrújula (JÓ-ve-nes), y las esdrújulas llevan tilde ' +
      'siempre.'
  },
  {
    id: 't3', factor: 'TONICA', b: 0, corto: 'examen',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['exámen', 'examen', 'examén'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Examen» es llana acabada en -n: no lleva tilde. Su plural ' +
      '«exámenes» sí la lleva, porque pasa a ser esdrújula.'
  },
  {
    id: 't4', factor: 'TONICA', b: 0, corto: 'cárcel',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['carcel', 'cárcel', 'carcél'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Cárcel» es llana y no acaba en vocal, -n ni -s: lleva tilde por ' +
      'la regla de las llanas.'
  },
  {
    id: 't5', factor: 'TONICA', b: 1, corto: 'dieciséis',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['dieciséis', 'dieciseis', 'diecíseis'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Dieciséis» es aguda acabada en -s: lleva tilde. Va sobre la e, ' +
      'la vocal abierta del diptongo éi.'
  },
  {
    id: 't6', factor: 'TONICA', b: 1, corto: 'sutil',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['sútil', 'sutil', 'sutíl'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Sutil» es aguda (su-TIL) y no acaba en vocal, -n ni -s: no lleva ' +
      'tilde, aunque a menudo se pronuncie mal como llana.'
  },
  {
    id: 't7', factor: 'TONICA', b: 0, corto: 'árbol',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['arbol', 'árbol', 'arból'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Árbol» es llana y no acaba en vocal, -n ni -s: lleva tilde por ' +
      'la regla de las llanas.'
  },
  {
    id: 't8', factor: 'TONICA', b: 0, corto: 'inglés',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['inglés', 'ingles', 'íngles'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Inglés» es aguda acabada en -s: lleva tilde por la regla de las ' +
      'agudas.'
  },

  /* --- Hiatos --- */
  {
    id: 'h1', factor: 'HIATO', b: -1, corto: 'país',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['pais', 'país', 'páis'],
    correcta: 1, distractor: 0,
    explicacion:
      'En «país» la i es vocal cerrada tónica junto a una abierta: se ' +
      'rompe el diptongo (pa-ís) y la tilde es obligatoria siempre.'
  },
  {
    id: 'h2', factor: 'HIATO', b: -1, corto: 'María',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['María', 'Maria', 'Mária'],
    correcta: 0, distractor: 1,
    explicacion:
      '«María» tiene hiato (Ma-rí-a): la i cerrada tónica junto a la a ' +
      'abierta lleva tilde siempre, sin excepciones.'
  },
  {
    id: 'h3', factor: 'HIATO', b: 0, corto: 'oído',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['oido', 'oído', 'óido'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Oído» es hiato (o-í-do): la í cerrada tónica se acentúa aunque ' +
      'la palabra sea llana acabada en vocal.'
  },
  {
    id: 'h4', factor: 'HIATO', b: 0, corto: 'raíz',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['raíz', 'raiz', 'ráiz'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Raíz» es hiato (ra-íz): la í tónica lleva tilde siempre, aunque ' +
      'como aguda acabada en -z no la llevaría por la regla general.'
  },
  {
    id: 'h5', factor: 'HIATO', b: 1, corto: 'sonríe',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['sonrie', 'sonríe', 'sónrie'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Sonríe» es hiato (son-rí-e): la í cerrada tónica junto a la e ' +
      'abierta lleva tilde obligatoria.'
  },
  {
    id: 'h6', factor: 'HIATO', b: 1, corto: 'egoísta',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['egoísta', 'egoista', 'egóista'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Egoísta» es hiato (e-go-ís-ta): la í tónica se acentúa aunque la ' +
      'palabra sea llana acabada en vocal.'
  },
  {
    id: 'h7', factor: 'HIATO', b: 0, corto: 'tío',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['tio', 'tío', 'tió'],
    correcta: 1, distractor: 0,
    explicacion:
      '«Tío» es hiato (tí-o): la í cerrada tónica junto a la o abierta ' +
      'lleva tilde siempre.'
  },
  {
    id: 'h8', factor: 'HIATO', b: 0, corto: 'grúa',
    enunciado: 'Elige la palabra escrita correctamente:',
    opciones: ['grúa', 'grua', 'gruá'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Grúa» es hiato (grú-a): la ú cerrada tónica junto a la a abierta ' +
      'lleva tilde siempre.'
  },

  /* --- Tilde diacrítica --- */
  {
    id: 'd1', factor: 'DIACRITICA', b: -1, corto: 'qué interrogativo',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: ['¿Qué hora es?', '¿Que hora es?', '¿Qué hora és?'],
    correcta: 0, distractor: 1,
    explicacion:
      '«Qué» interrogativo lleva tilde diacrítica para distinguirse del ' +
      '«que» conjunción («dice que viene»).'
  },
  {
    id: 'd2', factor: 'DIACRITICA', b: -1, corto: 'él / el',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'El llegó tarde a clase.',
      'Él llegó tarde a clase.',
      'Él llégó tarde a clase.'
    ],
    correcta: 1, distractor: 0,
    explicacion:
      '«Él» pronombre lleva tilde diacrítica; «el» artículo («el libro»), ' +
      'no.'
  },
  {
    id: 'd3', factor: 'DIACRITICA', b: 0, corto: 'tú / tu',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'Tú tienes mi libro.',
      'Tu tienes mi libro.',
      'Tú tiénes mi libro.'
    ],
    correcta: 0, distractor: 1,
    explicacion:
      '«Tú» pronombre lleva tilde diacrítica; «tu» posesivo («tu casa»), ' +
      'no. «Mi» posesivo tampoco (solo «mí» pronombre: «a mí»).'
  },
  {
    id: 'd4', factor: 'DIACRITICA', b: 0, corto: 'sé / se',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'No se la respuesta.',
      'No sé la respuesta.',
      'No sé la respúesta.'
    ],
    correcta: 1, distractor: 0,
    explicacion:
      '«Sé» del verbo saber lleva tilde diacrítica; «se» pronombre («se ' +
      'fue»), no.'
  },
  {
    id: 'd5', factor: 'DIACRITICA', b: 1, corto: 'dé / de',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'Quiero que me dé el cambio.',
      'Quiero que me de el cambio.',
      'Quiéro que me dé el cambio.'
    ],
    correcta: 0, distractor: 1,
    explicacion:
      '«Dé» del verbo dar lleva tilde diacrítica para distinguirse de la ' +
      'preposición «de» («la mesa de madera»).'
  },
  {
    id: 'd6', factor: 'DIACRITICA', b: 1, corto: 'sí afirmativo',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'Si, quiero más café.',
      'Sí, quiero más café.',
      'Sí, quiéro más café.'
    ],
    correcta: 1, distractor: 0,
    explicacion:
      '«Sí» afirmativo lleva tilde diacrítica; «si» condicional («si ' +
      'llueve»), no. «Más» de cantidad también la lleva.'
  },
  {
    id: 'd7', factor: 'DIACRITICA', b: 0, corto: 'té / te',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'Me apetece un té.',
      'Me apetece un te.',
      'Me apétece un té.'
    ],
    correcta: 0, distractor: 1,
    explicacion:
      '«Té» (la bebida) lleva tilde diacrítica; «te» pronombre («te ' +
      'espero»), no.'
  },
  {
    id: 'd8', factor: 'DIACRITICA', b: 0, corto: 'mí / mi',
    enunciado: 'Elige la frase escrita correctamente:',
    opciones: [
      'A mi me gusta el cine.',
      'A mí me gusta el cine.',
      'A mí me gústa el cine.'
    ],
    correcta: 1, distractor: 0,
    explicacion:
      '«Mí» pronombre («a mí») lleva tilde diacrítica; «mi» posesivo ' +
      '(«mi casa»), no.'
  }
];

const PARAMETROS = {
  a: 1.5,             // discriminación IRT
  numOpciones: 3,
  c: 1 / 3,           // pseudoazar: tres opciones
  pMin: 0.80,
  priorError: 0.25,   // prior P(presente) de cada error
  minPreguntas: 6,
  maxPreguntas: 14,
  minPorCategoria: 2  // cobertura mínima antes de selección libre
};

/*
 * Umbral de entropía asociado a pMin con n hipótesis:
 * H_stop = -p·log2(p) - (1-p)·log2((1-p)/(n-1))
 */
function hStop(pMin, n) {
  return -pMin * Math.log2(pMin)
    - (1 - pMin) * Math.log2((1 - pMin) / (n - 1));
}

const H_STOP = hStop(PARAMETROS.pMin, NIVELES.length);

function indiceFactor(idFactor) {
  for (let j = 0; j < FACTORES.length; j++) {
    if (FACTORES[j].id === idFactor) return j;
  }
  return -1;
}

function pIrt(theta, b) {
  return PARAMETROS.c +
    (1 - PARAMETROS.c) / (1 + Math.exp(-PARAMETROS.a * (theta - b)));
}

/*
 * P(R = r | nivel i, estado del error atacado por el ítem).
 *  - Error presente: el distractor característico atrae (0.70) y el
 *    acierto cae por debajo del suelo de azar (0.15), sea cual sea el
 *    nivel: el error es sistemático. Valores por tramos, no afinados.
 *  - Error ausente: el acierto lo da la IRT 3PL según el nivel; el
 *    resto se reparte por igual entre las opciones erróneas.
 */
function probOpcion(item, iNivel, presente, r) {
  if (presente) {
    return r === item.distractor ? 0.70 : 0.15;
  }
  const p = pIrt(NIVELES[iNivel].theta, item.b);
  return r === item.correcta ? p : (1 - p) / 2;
}

const N_PERFILES = 1 << FACTORES.length;

function nivelDeIndice(idx) { return Math.floor(idx / N_PERFILES); }
function perfilDeIndice(idx) { return idx % N_PERFILES; }
function perfilTieneError(m, j) { return ((m >> j) & 1) === 1; }

/* Deriva las marginales P(nivel) y P(presente) por error. */
function conMarginales(conjunto) {
  const global = NIVELES.map(function () { return 0; });
  const factores = FACTORES.map(function () { return 0; });
  conjunto.forEach(function (p, idx) {
    global[nivelDeIndice(idx)] += p;
    const m = perfilDeIndice(idx);
    FACTORES.forEach(function (_, j) {
      if (perfilTieneError(m, j)) factores[j] += p;
    });
  });
  return { conjunto: conjunto, global: global, factores: factores };
}

/* Prior: uniforme en niveles, priorError independiente por error. */
function estadoInicial() {
  const conjunto = [];
  for (let i = 0; i < NIVELES.length; i++) {
    for (let m = 0; m < N_PERFILES; m++) {
      let p = 1 / NIVELES.length;
      FACTORES.forEach(function (_, j) {
        p *= perfilTieneError(m, j)
          ? PARAMETROS.priorError
          : 1 - PARAMETROS.priorError;
      });
      conjunto.push(p);
    }
  }
  return conMarginales(conjunto);
}

/*
 * Actualización bayesiana exacta de la conjunta tras observar la
 * respuesta r al ítem. La verosimilitud de cada estado (nivel, perfil)
 * depende del nivel y de si el perfil contiene el error que el ítem
 * ataca; los errores no atacados no aportan verosimilitud (la pregunta
 * no es informativa sobre ellos), pero sus marginales pueden moverse
 * por la correlación acumulada en la conjunta.
 */
function actualizar(estado, item, r) {
  const jf = indiceFactor(item.factor);
  let suma = 0;
  const nuevo = estado.conjunto.map(function (p, idx) {
    const w = p * probOpcion(
      item, nivelDeIndice(idx),
      perfilTieneError(perfilDeIndice(idx), jf), r
    );
    suma += w;
    return w;
  });
  return conMarginales(nuevo.map(function (x) { return x / suma; }));
}

function entropia(p) {
  return p.reduce(function (h, pi) {
    return pi > 0 ? h - pi * Math.log2(pi) : h;
  }, 0);
}

function entropiaBinaria(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/* Incertidumbre total: nivel global + un bit potencial por error. */
function entropiaTotal(estado) {
  return entropia(estado.global) + estado.factores.reduce(function (h, p) {
    return h + entropiaBinaria(p);
  }, 0);
}

/*
 * Incertidumbre útil para la selección: solo cuentan los componentes
 * aún no resueltos. Sin este filtro, la selección seguiría afinando
 * errores ya clasificados (la entropía binaria en p = 0,85 sigue
 * siendo alta) a costa de las preguntas que faltan para decidir el
 * nivel. Para darse por resuelto en la selección se exige un margen
 * mayor (0,90) que en la parada (0,80): así los factores que quedan
 * justo sobre el umbral siguen recibiendo preguntas mientras la
 * sesión continúe.
 */
function entropiaUtil(estado) {
  const margen = 0.90;
  const hGlobal = entropia(estado.global);
  const maxP = Math.max.apply(null, estado.global);
  let h = (maxP >= margen && hGlobal <= H_STOP) ? 0 : hGlobal;
  estado.factores.forEach(function (p) {
    if (p > 1 - margen && p < margen) h += entropiaBinaria(p);
  });
  return h;
}

/* P(R = r) marginal bajo el estado actual. */
function probMarginal(estado, item, r) {
  const jf = indiceFactor(item.factor);
  let pr = 0;
  estado.conjunto.forEach(function (p, idx) {
    pr += p * probOpcion(
      item, nivelDeIndice(idx),
      perfilTieneError(perfilDeIndice(idx), jf), r
    );
  });
  return pr;
}

/*
 * Verosimilitudes marginales de una respuesta bajo un estado dado
 * (para el panel docente): por nivel, marginando el error atacado, y
 * por estado de ese error, marginando el nivel. Debe llamarse con el
 * estado ANTERIOR a la actualización.
 */
function verosimilitudesMarginales(estado, item, r) {
  const jf = indiceFactor(item.factor);
  const porNivel = NIVELES.map(function () { return 0; });
  const porError = [0, 0];
  estado.conjunto.forEach(function (p, idx) {
    const presente = perfilTieneError(perfilDeIndice(idx), jf);
    const l = p * probOpcion(item, nivelDeIndice(idx), presente, r);
    porNivel[nivelDeIndice(idx)] += l;
    porError[presente ? 0 : 1] += l;
  });
  const pF = estado.factores[jf];
  return {
    porNivel: porNivel.map(function (l, i) {
      return estado.global[i] > 0 ? l / estado.global[i] : 0;
    }),
    porError: [
      pF > 0 ? porError[0] / pF : 0,
      pF < 1 ? porError[1] / (1 - pF) : 0
    ]
  };
}

/*
 * Ganancia esperada de información del ítem sobre la incertidumbre
 * útil (nivel + errores pendientes), promediando sobre las tres
 * respuestas posibles: el modelo define una distribución por opción,
 * no solo acierto/fallo.
 */
function gananciaEsperada(estado, item) {
  const h0 = entropiaUtil(estado);
  let hEsperada = 0;
  for (let r = 0; r < PARAMETROS.numOpciones; r++) {
    const pr = probMarginal(estado, item, r);
    if (pr === 0) continue;
    hEsperada += pr * entropiaUtil(actualizar(estado, item, r));
  }
  return h0 - hEsperada;
}

/*
 * Selección adaptativa. Mientras alguna categoría no tenga la muestra
 * mínima, se restringe a las categorías con menos evidencia; dentro de
 * las candidatas se maximiza la ganancia esperada de información. Los
 * empates (diferencia < 1e-6) se rompen al azar; en la primera pregunta
 * se elige al azar entre las casi mejores (≥ 90 % de la mejor ganancia)
 * para variar la apertura entre sesiones.
 */
function seleccionar(estado, restantes, contadores, esPrimera, rng) {
  rng = rng || Math.random;
  let candidatos = restantes;
  const pendientes = [];
  FACTORES.forEach(function (fac, j) {
    if (contadores[j] < PARAMETROS.minPorCategoria) pendientes.push(j);
  });
  if (pendientes.length > 0) {
    let minCuenta = Infinity;
    pendientes.forEach(function (j) {
      if (contadores[j] < minCuenta) minCuenta = contadores[j];
    });
    const objetivo = pendientes.filter(function (j) {
      return contadores[j] === minCuenta;
    });
    const filtrados = restantes.filter(function (idx) {
      return objetivo.indexOf(indiceFactor(BANCO[idx].factor)) !== -1;
    });
    if (filtrados.length > 0) candidatos = filtrados;
  }
  const evaluados = candidatos.map(function (idx) {
    return { idx: idx, ig: gananciaEsperada(estado, BANCO[idx]) };
  });
  const mejor = Math.max.apply(null, evaluados.map(function (e) { return e.ig; }));
  const umbral = esPrimera ? mejor * 0.9 : mejor - 1e-6;
  const empatados = evaluados.filter(function (e) { return e.ig >= umbral; });
  return empatados[Math.floor(rng() * empatados.length)];
}

/* presente / ausente / indeterminado según la confianza exigida. */
function clasificarFactor(p) {
  if (p >= PARAMETROS.pMin) return 'presente';
  if (p <= 1 - PARAMETROS.pMin) return 'ausente';
  return 'indeterminado';
}

/*
 * Criterio de parada. Cierre firme: mínimo de preguntas cumplido,
 * cobertura mínima por categoría, nivel global resuelto
 * (max p >= pMin y H <= H_stop) y cada error clasificado como presente
 * o ausente. Si se alcanza el máximo práctico o se agota el banco sin
 * cumplirlo todo, se cierra como provisional.
 */
function estadoParada(estado, nRespondidas, nRestantes, contadores) {
  const h = entropia(estado.global);
  const maxP = Math.max.apply(null, estado.global);
  const globalFirme = maxP >= PARAMETROS.pMin && h <= H_STOP;
  const factoresFirmes = estado.factores.every(function (p) {
    return clasificarFactor(p) !== 'indeterminado';
  });
  const cobertura = contadores.every(function (n) {
    return n >= PARAMETROS.minPorCategoria;
  });
  const firme = globalFirme && factoresFirmes && cobertura;
  if (nRespondidas >= PARAMETROS.minPreguntas && firme) {
    return { parar: true, firme: true, h: h, maxP: maxP };
  }
  if (nRespondidas >= PARAMETROS.maxPreguntas || nRestantes === 0) {
    return { parar: true, firme: false, h: h, maxP: maxP };
  }
  return { parar: false, firme: false, h: h, maxP: maxP };
}

function nivelMap(global) {
  let mejor = 0;
  for (let i = 1; i < global.length; i++) {
    if (global[i] > global[mejor]) mejor = i;
  }
  return mejor;
}
