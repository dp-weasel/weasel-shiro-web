# Mensajes de GW2


Cada archivo de [`src/content/gw2/mensajes/`](../src/content/gw2/mensajes/) es **una pestaña**: agregar un
archivo `.yaml` agrega una pestaña y borrarlo la quita. El nombre del archivo es el que aparece en
la URL (`/gw2/mensajes/#fractales`).

```yaml
nombre: Fractales          # Texto de la pestaña
orden: 2                   # Posición (opcional; sin él, van al final por nombre)
mensajes:
  lfg-t4: "LFG T4 diarios + recomendados, busco healer…"
  jefe-final: "En el jefe final: stackeen en la marca…"
```

- La **clave** de cada mensaje (`lfg-t4`) va en minúsculas, sin espacios ni tildes, y no debe
  cambiar si solo corriges el texto: es lo que permite conservar los cambios que cada persona hizo
  en su navegador. Si cambias la clave, para el navegador es un mensaje nuevo.
- El **texto** va entre comillas dobles (así no fallan los `:` del medio). Para usar comillas
  dentro del texto, escríbelas como `\"`.
- `personalizado` es un nombre reservado: esa pestaña la llena cada persona en su navegador.

Al hacer push a `master`, Cloudflare valida los archivos, compila y publica. Si un archivo tiene un
error, la compilación falla con un mensaje claro y la versión publicada no cambia. Los mensajes de
más de 199 caracteres (límite del chat de GW2) generan un aviso. Con la extensión de YAML de VS Code
se autocompletan los campos y se marcan los errores al escribir (el esquema lo genera
`npm run dev`/`build` en `.astro/`).

## Cambios de cada persona (en su navegador)

En la página, cada persona puede **editar**, **eliminar** (con «Deshacer» y «Restaurar
eliminados») y **agregar** mensajes en cualquier pestaña, y tener los suyos en **Personalizado**.
El editor no deja guardar textos vacíos ni de más de 199 caracteres.

Se guarda en `localStorage` (clave `gw2-mensajes:v1`) solo la diferencia con lo publicado:
textos editados, claves eliminadas y mensajes agregados. Por eso los mensajes nuevos que publiques
le aparecen a todo el mundo, y si una persona editó un mensaje, conserva su versión aunque cambies
el original. Ver `src/scripts/mensajes/messages-store.ts` y `src/scripts/mensajes/messages-editor.ts`.

## Exportar e importar

Al lado de «Ocultar a EDM» están **Exportar** e **Importar**. Exportar descarga en YAML lo que la
persona ve en cada pestaña (Personalizado incluido). El formato es el mismo para importar:

```yaml
version: 1
pestanas:
  fractales:                 # id de la pestaña (nombre del archivo en src/content/gw2/mensajes/)
    nombre: "Fractales"      # opcional
    mensajes:
      lfg-t4: "LFG T4 diarios…"
```

Al importar (archivo o texto pegado) primero se valida: YAML correcto, ids y claves en minúsculas,
textos no vacíos y de hasta 199 caracteres. Si está bien, se elige entre **combinar** con lo que ya
hay (no se pierde nada y no se repiten textos) o **usar solo los importados** (lo publicado que no
venga queda eliminado y se puede restaurar). Las pestañas que no existen van a Personalizado.
Siempre se puede deshacer. Ver `src/scripts/mensajes/transferencia.ts` (lógica) y
`transferencia-ui.ts` (diálogo); la librería `yaml` se carga solo al importar.

