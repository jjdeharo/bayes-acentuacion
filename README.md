# ¿Con tilde o sin tilde? — demostración de recurso adaptativo bayesiano (modelo combinado)

Recurso web estático que estima a la vez el **nivel global de acentuación**
del alumno (Lengua Castellana, 1.º–2.º ESO) y si comete alguno de **tres
errores concretos que pueden coexistir**. Sirve como ejemplo de trabajo del
**modelo combinado** de la metodología de
[recursos adaptativos bayesianos](https://github.com/jjdeharo/recursos-adaptativos):
una distribución ordinal global (tipo A, con IRT 3PL) combinada con factores
diagnósticos nominales que pueden coexistir (tipo D), tal como indica la
especificación operativa cuando «el recurso debe estimar nivel y diagnosticar
errores».

Acceso: **https://jjdeharo.github.io/bayes-acentuacion/**

## Qué estima

**Nivel global** (hipótesis ordinales, `theta` = −2 / 0 / +2):

| Nivel | Descripción |
|---|---|
| Iniciando | Aún adquiere las reglas básicas (sílaba tónica, aguda/llana/esdrújula) |
| Avanzando | Aplica las reglas generales pero duda en los casos especiales |
| Dominando | Aplica con seguridad reglas generales y casos especiales |

**Errores diagnosticables** (factores no excluyentes, prior 25 % cada uno):

| Id | Error | Comportamiento característico |
|---|---|---|
| `TONICA` | Reglas generales | Escribe «exámen», «carcel», «cancion» |
| `HIATO` | Hiatos con vocal cerrada tónica | Escribe «Maria», «pais», «oido» |
| `DIACRITICA` | Tilde diacrítica | Confunde tú/tu, él/el, sé/se, qué/que… |

## Cómo funciona el modelo combinado

- El estado del alumno es una **distribución conjunta exacta** sobre
  nivel × perfil de errores (3 × 2³ = 24 estados). Al exterior se muestran
  las marginales: P(nivel) y P(presente) por error.
- La verosimilitud de cada respuesta depende del nivel y del error que la
  pregunta ataca: **sin el error**, la probabilidad de acierto la da la
  **IRT 3PL** (`a ≈ 1,875`, derivado de una discriminación efectiva objetivo
  `a_ef = 1,25` y `c = 1/3` mediante `a = a_ef / (1 − c)`; `b` ∈ {−1, 0, +1}), recortada
  por un **techo de dominio de 0,95** que modela el descuido (*slip*) e impide que un
  fallo en un ítem fácil produzca una actualización casi determinista, y el resto se
  reparte entre las opciones erróneas; **con el error**, el **distractor
  característico** atrae al alumno (≈ 0,70) y el acierto cae por debajo del
  suelo de azar (≈ 0,15), sea cual sea el nivel. Se usa la opción elegida,
  no solo acierto/fallo.
- Mantener la conjunta (en lugar de dos distribuciones que se re-factorizan
  tras cada respuesta) conserva la correlación entre nivel y errores: un
  fallo hacia el distractor característico se atribuye al error sin
  arrastrar indebidamente el nivel, y viceversa.
- **Selección adaptativa**: primero cobertura mínima (2 preguntas por
  bloque) priorizando los bloques con menos evidencia; después, máxima
  ganancia esperada de información calculada solo sobre los **componentes
  aún no resueltos** (sin ese filtro, la selección seguiría afinando errores
  ya clasificados a costa de las preguntas que faltan para decidir el
  nivel). Empates al azar y primera pregunta variable entre las casi
  mejores.
- **Parada**: mínimo 6 y máximo 14 preguntas (banco de 24: 8 por bloque).
  Cierre **firme** solo si el nivel alcanza `max p ≥ 0,80` con entropía
  `≤ H_stop` **y** cada error queda clasificado como presente (`p ≥ 0,80`)
  o ausente (`p ≤ 0,20`) con la cobertura mínima cumplida; en caso
  contrario el resultado se presenta como **provisional**. Los errores sin
  decidir se reportan como **indeterminados**, no se fuerzan. Sesión
  diagnóstica corta: sin olvido exponencial (`lambda = 1`).
- **Resultado**: nivel MAP con su confianza y distribución completa, perfil
  de errores (presente / ausente / indeterminado con su probabilidad),
  recomendación pedagógica por nivel y por cada error detectado, y
  recorrido de la sesión.
- **Person-fit (índice `l_z`)**: al cerrar la sesión se comprueba si el
  patrón de respuestas es coherente con el estado MAP diagnosticado
  (generalización politómica del `l_z`, calculada sobre la opción elegida
  en cada ítem). Si `l_z < −2`, el resultado se acompaña de un aviso de
  fiabilidad: puede haber descuidos, azar o un error no contemplado por el
  modelo. Con respondentes sintéticos coherentes el aviso salta en menos
  del 1 % de sesiones (falsas alarmas); con 6–14 preguntas es una señal de
  cautela orientativa, no una prueba formal, y solo detecta patrones muy
  incoherentes. El valor se muestra en directo en el panel docente.

## En qué se diferencia de los otros ejemplos

[bayes-test](https://github.com/jjdeharo/bayes-test) estima solo un nivel
ordinal; [bayes-temperatura](https://github.com/jjdeharo/bayes-temperatura)
identifica solo una concepción excluyente (tipo C);
[bayes-nominal](https://github.com/jjdeharo/bayes-nominal) diagnostica solo
errores coexistentes (tipo D). Este recurso combina las dos preguntas en una
misma sesión: *¿cuánto domina?* y *¿qué errores concretos comete?* — el
cuarto caso de «Elección del modelo» de la especificación operativa.

## Archivos

- `index.html` — recurso del alumno. Incluye un panel docente plegable con
  el estado bayesiano en directo (marginales de nivel y errores, entropía y
  verosimilitudes de la última respuesta), pensado para usar la página como
  demostración.
- `motor.js` — niveles, errores, banco de preguntas, verosimilitudes,
  actualización de la conjunta, selección adaptativa y criterio de parada.
- `validacion.html` — **herramienta del autor** (no del alumnado):
  validación Monte Carlo con respondentes sintéticos de nivel y perfil de
  errores conocidos; comprueba si el diseño recupera ambos y la tasa de
  falsas alarmas del aviso de person-fit.

El recurso funciona sin servidor: basta abrir `index.html` en un navegador
(con `motor.js` en la misma carpeta).

## Qué muestra la validación

Con respondentes sintéticos (fiabilidad bajo el modelo, no validez
empírica), los cierres firmes aciertan el nivel y el perfil en torno al
85–90 % global, coherente con la confianza del 80 % exigida a cada
conclusión por separado. Las limitaciones aparecen donde deben: con un
alumno de nivel bajo, sus errores sistemáticos quedan a menudo
**indeterminados** (si falla casi todo, no se puede distinguir el error
sistemático del desconocimiento); y con dos errores simultáneos el nivel
pierde apoyo (quedan pocas preguntas «limpias») y la sesión suele cerrarse
como **provisional**. El sistema no oculta esa incertidumbre: la reporta.

## Licencia

© [Juan José de Haro](https://bilateria.org) · Contenido:
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · Código:
[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
