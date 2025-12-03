// src/pages/Ayuda/ayudaData.js

export const ayudaData = {
    empezar: {
        titulo: "Empezando con Alef",
        articulos: [
            {
                id: "configuracion-restaurante",
                titulo: "Configurar la información del restaurante",
                descripcion: "Ajusta la identidad visual, los colores del TPV, las funcionalidades de tu plan y los datos fiscales.",
                contenido: [
                    `Desde esta pantalla puedes definir la identidad visual y el comportamiento general de tu TPV Alef.  
Es lo primero que recomendamos configurar al comenzar.

---

## 🔹 1) Identidad del restaurante

- Escribe el nombre comercial que aparecerá en el TPV, la carta online y las facturas.  
- Sube tu logotipo en formato **PNG** o **JPG** arrastrando la imagen o pulsando sobre el recuadro.

---

## 🔹 2) Apariencia del TPV

Aquí puedes personalizar los colores que verán tus trabajadores (caja, cocina y barra):

- **Color principal:** cabeceras, barra lateral y acentos importantes.  
- **Color secundario:** botones secundarios y etiquetas.  
- **Fondo general:** color de fondo del TPV.  
- **Color del texto:** claro u oscuro.  
- **Fondo de tarjetas:** color de las mesas y pedidos.  
- **Borde de tarjetas:** grosor y color.  
- **Color de botones + hover.**

Los cambios se muestran en tiempo real en la vista previa del panel.

---

## 🔹 3) Funcionalidades del plan

Puedes activar o desactivar las funciones incluidas en tu plan:

- TPV básico, pedidos de comida y bebida.  
- Impresión en cocina y barra.  
- Reservas online.  
- Alérgenos, valoraciones, confirmación desde la carta.  
- Panel de cocina, panel de barra, modo compacto.  
- Funciones avanzadas: comandos por voz, estadísticas, informes PRO.

Las opciones no disponibles aparecerán bloqueadas según tu plan.

---

## 🔹 4) Secciones de la carta

Sirven para organizar tus productos (Entrantes, Carnes, Postres, Bebidas…).

Puedes:

- Escribir nombre y slug.  
- Elegir la estación correspondiente (cocina o barra).  
- Pulsar **Crear sección**.

---

## 🔹 5) Estaciones de cocina / barra

Define dónde se preparan los productos:

- Frío  
- Plancha  
- Frito  
- Barra  
- Postres  
- Etc.

Puedes marcar una estación como **Central**, que ve todos los productos.

---

## 🔹 6) Estilo general del panel

- Elige la fuente principal (Inter, Roboto, etc.).  
- Este ajuste afecta únicamente al **panel del restaurante**, no al TPV.

---

## 🔹 7) Configuración SIF / VeriFactu

Antes de activar VeriFactu debes completar:

- CIF  
- Razón social  
- Dirección completa  
- Municipio, provincia y país  

Después pulsa **Guardar configuración SIF**.

VeriFactu garantizará cumplimiento con la **Ley Antifraude 11/2021**.

---

## 🔹 Guardar cambios

Cuando termines de ajustar colores, funcionalidades y datos fiscales, pulsa:

### **Guardar configuración general**

Esto aplicará todos los cambios.`
                ],
                imagen: "/ayuda/configuracion-restaurante.png"
            },
            {
                id: "configurar-carta",
                titulo: "Configurar la carta y la página principal",
                descripcion: "Edita la información pública del restaurante, las imágenes del home y las opciones visuales.",
                contenido: [
                    `En esta sección configuras todo lo que verán tus clientes al entrar a tu carta digital: horarios, imágenes, textos, idiomas y apariencia.

---

## 🔹 1) Información del restaurante

Estos datos aparecen en la cabecera de la carta:

- Teléfono  
- Dirección exacta  
- Días de apertura  
- Horario de comida y cena  

Mantenerlos actualizados evita confusiones.

---

## 🔹 2) Imágenes del home

Puedes subir y organizar:

- **Carrusel:** grandes imágenes del inicio.  
- **Secciones:** imágenes para bloques de contenido.

Acciones disponibles:

- Arrastrar una imagen  
- Hacer clic en **+ Añadir**  
- Eliminar con el icono de papelera  

---

## 🔹 3) Textos del home

Define mensajes para el carrusel y las secciones:

- Textos principales  
- Subtítulos  
- Mensajes comerciales  
- Bloques de “¿Por qué elegirnos?”

Puedes añadir o editar textos en cualquier momento.

---

## 🔹 4) Opciones de la carta digital

Controla qué ve el cliente:

- Mostrar **fotos**  
- Mostrar **alérgenos**  
- Mostrar **valoraciones**  
- Tamaño de imágenes  
- Orden: por categorías o personalizado  
- Idiomas disponibles: 'es, en, fr, ...'

---

## 🔹 5) Apariencia general de la carta

Puedes personalizar:

- Color principal (botones, títulos, acentos)  
- Color secundario  
- Fondo de página  
- Fondo de tarjetas  
- Color del texto  
- Hover y estilo de botones  

Incluye vista previa en tiempo real.

---

## 🔹 6) Productos destacados y en promoción

Sirven para destacar platos importantes o en oferta.

Puedes:

- Seleccionar destacados  
- Seleccionar productos en promoción  
- Ordenar su aparición

---

## 🔹 Guardar cambios

Pulsa **Guardar todos los cambios** para aplicar la configuración visual, textual y de producto.`
                ],
                imagen: "/ayuda/configurar-carta.png"
            },
            {
                id: "acceder-tpv-carta",
                titulo: "Acceder al TPV y a la carta desde la barra superior",
                descripcion: "Dónde encontrar los accesos directos al TPV y a la carta digital.",
                contenido: [
                    `Una vez configurado tu restaurante, puedes acceder directamente al TPV y a la carta digital desde la barra superior de Alef.

---

## 🔹 ¿Dónde están los accesos?

En la parte superior verás los botones:

- **Dashboard**  
- **TPV**  
- **Carta**  
- **Perfil**  
- **Ayuda**  
- **Soporte**

### Accesos principales:

- **TPV:** abre el terminal de punto de venta (caja, cocina y barra).  
- **Carta:** abre la carta digital tal como la ven tus clientes.

---

## 🔹 ¿Qué hacen estos accesos?

- **TPV** → abre el TPV en una nueva pestaña, listo para trabajar.  
- **Carta** → abre la carta pública del restaurante, ideal para compartir o revisar.

---

## 🔹 ¿Se puede acceder desde cualquier página?

Sí.  
La barra superior siempre está visible mientras navegues dentro del área del restaurante.

---

## 🔹 ¿Quién puede ver estos accesos?

- Administradores y dueños → siempre ven TPV y Carta.  
- Camareros y cocineros → ven solo lo necesario según su rol.

---

Acceder rápidamente al TPV o la carta mejora enormemente el flujo de trabajo.`
                ],
                imagen: "/ayuda/acceso-navbar.png"
            },
        ],
    },

    tpv: {
        titulo: "TPV • Uso Diario",
        articulos: [
            {
                id: "tpv-dashboard",
                titulo: "Usar el Dashboard del TPV (vista de mesas)",
                descripcion: "Aprende a gestionar mesas, abrir pedidos, controlar comensales y usar todas las funciones principales del TPV.",
                contenido: [
                    `Al entrar al TPV, la primera pantalla que verás es el **Dashboard**.  
Desde aquí gestionas todas las mesas del restaurante y accedes al flujo completo de trabajo: barra, cocina, eliminaciones y más.

---

## 🔹 1) Vista general de mesas

La pantalla muestra un **mapa visual del restaurante**, totalmente personalizable desde:

**Configuración → Mapa del restaurante**

En el mapa verás:

- **Mesas blancas:** mesas libres  
- **Mesas coloreadas:** mesas abiertas, mostrando el total consumido  
- **Mesas auxiliares:** a la derecha, ideales para pedidos rápidos o zonas sin numeración fija  

---

## 🔹 2) Abrir una mesa

Para abrir una mesa:

1. Pulsa sobre ella.  
2. Si está cerrada, se pedirá el número de comensales.  
3. Si ya estaba abierta, entrarás directamente al panel de pedido.

Una vez abierta, podrás añadir platos, bebidas y gestionar la cuenta.

---

## 🔹 3) Editar el número de comensales

Si necesitas modificarlo:

- Mantén pulsada la mesa durante **1 segundo**  
- Se abrirá un diálogo para editar la cantidad  

Esto es útil para corregir errores o cambios de última hora.

---

## 🔹 4) Cambiar entre zonas

En la parte superior izquierda verás un selector para cambiar la zona:

- Interior  
- Terraza  
- Cualquier zona personalizada  

El mapa cambia automáticamente según la zona seleccionada.

---

## 🔹 5) Mesas auxiliares

Se encuentran en el lateral derecho:

- Numeradas (8, 10, 11, 12, etc.)  
- Útiles para barras secundarias o zonas sin mesa física  

Funcionan exactamente igual que una mesa normal.

---

## 🔹 6) Navegación entre pantallas del TPV

En la barra superior tienes accesos directos a:

- **Barra** → preparación y entrega de bebidas  
- **Cocina** → preparación de platos  

Puedes cambiar de vista sin afectar los pedidos en curso.

---

## 🔹 7) Control de pedidos desde el móvil del cliente

En la parte superior hay dos interruptores:

- **Comida ON / OFF**  
- **Bebida ON / OFF**

Si los desactivas:

- Los botones de “añadir” desaparecen en la carta online  
- Es ideal en momentos de saturación o cuando no deseas recibir pedidos móviles

---

## 🔹 8) Acceso a funciones adicionales (menú “Ir a”)

En la parte superior verás el desplegable **Ir a**, que permite ir rápidamente a:

- **Eliminaciones** — productos cancelados del TPV  
- **Contraseña de carta** — clave que introduce el cliente antes de pedir  
- **Cerrar caja** — finaliza turno con resumen automático  

Siempre accesibles sin salir del Dashboard.

---

## 🔹 9) Buscar una mesa rápidamente

En la parte superior hay un buscador:

1. Escribe el número de mesa  
2. Selecciónala  
3. El TPV te llevará directamente a su panel  

Perfecto para restaurantes con muchas mesas.

---

## 🔹 10) Cerrar sesión del TPV

El botón **Cerrar Sesión**:

- Te saca del TPV  
- Te devuelve al Dashboard general de Alef  
- Útil para cambios de turno o finalizar jornada

---

## 🔹 Resumen

El Dashboard del TPV es el **centro de trabajo del restaurante**:

- Abres mesas  
- Editas comensales  
- Cambias zonas  
- Controlas pedidos desde el móvil  
- Accedes a barra y cocina  
- Gestionas eliminaciones y cierre de caja  

Todo desde una sola pantalla, rápida e intuitiva.
`
                ],
                imagen: "/ayuda/tpv-dashboard.png"
            },
            {
                id: "tpv-agregar-productos",
                categoria: "TPV",
                titulo: "Cómo agregar productos a una mesa en el TPV",
                contenido: [
                    `En Alef, todo comienza seleccionando una mesa. Una vez abierta, el sistema presenta una interfaz clara dividida en dos zonas principales: las categorías de productos y el detalle del producto. Aquí te guiamos paso a paso.

---

## 1. Selecciona una mesa
Pulsa sobre cualquier mesa del mapa para abrirla.  
- Si la mesa estaba cerrada, se pedirá el número de comensales.  
- Si ya estaba abierta, accederás directamente al panel de pedido.

---

## 2. Vista principal de la mesa

### **A) Categorías de productos (columna izquierda)**
Aquí aparecen todas las categorías configuradas desde **Configuración del restaurante**.  
Puedes alternar entre:
- Platos  
- Bebidas  

Cada categoría muestra solo los productos correspondientes.

---

### **B) Información y acciones de la mesa (columna derecha)**
Incluye:
- Total de la mesa  
- Pestañas: Platos, Bebidas, Cuenta, Factura y Acciones  
- Botón “Cerrar mesa”  
- Lista de productos agregados (carrito)

---

## 3. Selecciona una categoría
Al pulsar una categoría, se abrirá un listado de todos los productos asociados.  
Cada producto muestra su nombre, imagen (si tiene), precio y variaciones disponibles.

---

## 4. Elige un producto
Al seleccionarlo, se abrirá el **modal de personalización**, donde podrás:

- Ajustar cantidad  
- Elegir variaciones de precio (tapa, ración, botella, etc.)  
- Seleccionar extras o complementos  
- Añadir un mensaje opcional para cocina/barra  
  (ej.: "sin cebolla", "muy hecho", "entregar junto al segundo plato")

Al pulsar **Agregar**, el producto se añade a la mesa, pero aún no se envía a cocina/barra.

---

## 5. Datos totalmente editables
Todos los datos del producto (nombre, precio, fotos, extras, secciones de cocina, descripción, alérgenos, variaciones…) son completamente configurables desde el panel de administración.

Esto te permite adaptar Alef a cualquier tipo de restaurante.`
                ]
            },
            {
                id: "tpv-carrito-y-gestion-productos",
                categoria: "TPV",
                titulo: "Cómo funciona el carrito y la gestión de productos agregados",
                contenido: [
                    `Cada producto que se agrega a una mesa aparece en el **carrito**, donde podrás revisarlo, editarlo o enviarlo a cocina/barra. Aquí te explicamos cómo funciona este proceso.

---

## 1. ¿Dónde está el carrito?
En la parte derecha de la pantalla verás una lista con todos los productos pendientes o enviados de la mesa.  
Alef agrupa automáticamente los productos por **sección de cocina/barra**, como:

- Plancha  
- Frito  
- Barra fría  
- Postres  

Estas secciones pueden crearse y modificarse desde **Configuración del restaurante → Estaciones de cocina/barra**.

---

## 2. Opciones disponibles dentro del carrito

### ✔ Editar un producto
Pulsa sobre un producto para reabrir su modal y modificar:
- Cantidad  
- Extras  
- Tipo de precio  
- Mensaje a cocina/barra  
- Acompañante (bebidas)  

### ✔ Eliminar
Puedes eliminar un producto antes de enviarlo.

### ✔ Subtotales por sección
El TPV muestra subtotales de productos por cada área de producción.

---

## 3. Enviar pedido a cocina/barra
Cuando termines de preparar el pedido:

1. Revisa los productos  
2. Pulsa **Enviar**  
3. Alef enviará cada producto a su estación correspondiente  

El personal verá:
- Producto  
- Cantidad  
- Extras  
- Mensaje  
- Alergias (si están activadas)  
- Nombre del comensal (si está activo)

---

## 4. Productos enviados vs. productos pendientes
Alef diferencia automáticamente:
- **Pendientes**: aún sin enviar  
- **Enviados**: ya están en cocina/barra  

Esto ayuda a evitar errores y duplicaciones.

---

## 5. Edición de productos enviados
Por normativa antifraude:
- Un producto enviado **no puede editarse**  
- Debe **cancelarse**, registrándose en *Eliminaciones*  
- Luego puede agregarse otro nuevo con los cambios correctos  

Este proceso garantiza trazabilidad total del pedido.`
                ]
            },
            {
                id: "cocina-funcionamiento",
                categoria: "TPV",
                titulo: "Cómo usar la pantalla de Cocina",
                contenido: [
                    `La pantalla de Cocina es uno de los módulos más importantes de Alef. Aquí llegan los productos que los camareros han enviado desde el TPV, organizados por estaciones de trabajo y listos para preparar. A continuación se detalla su funcionamiento completo.

---

## 1. ¿Qué muestra la pantalla de cocina?

Cada pedido aparece con la siguiente información clave:

- **Número de mesa**
- **Número de comensales**
- **Tiempo transcurrido desde que se envió**
- **Alergias del comensal**, si están activadas en el plan
- **Nombre del comensal**, si está habilitado
- **Productos clasificados por secciones**

Los productos se mostrarán únicamente en la **estación de cocina** asignada a cada uno (plancha, frío, medio, postres…), excepto la **estación central**, que puede ver todo.

---

## 2. Estaciones de cocina (configurables)

Desde *Configuración del restaurante* puedes crear tantas estaciones como necesites:

- Plancha  
- Frito  
- Frío  
- Barra caliente  
- Postres  
- Etc.

Cada producto del menú está asociado a una estación. Esto hace que cada cocinero reciba **solo los productos que debe preparar**, evitando confusiones.

---

## 3. Estación central

La estación **Central** (marcada manualmente en configuración) tiene privilegios especiales:

- Puede ver **todos los pedidos completos**, sin importar la estación.
- Puede **solicitar productos** (pide al sistema que un producto vuelva al estado de preparación).
- Administra la coordinación general de la cocina.

Es ideal para un jefe de cocina o para un puesto de control.

---

## 4. Acciones sobre los productos

Cada línea de producto cuenta con acciones rápidas:

### ✔ **“Solicitar”**
Vuelve a poner un producto en estado de preparación.  
Útil si algo se retrasó o debe volverse a montar.

### ✔ **“Listo”**
Marca un producto como terminado.  
Si la opción está activada en la configuración, Alef **imprimirá automáticamente el ticket de producto listo** en la impresora correspondiente.

Cuando **todos los productos del pedido** estén marcados como “Listos”, el sistema permitirá marcar **el pedido completo como listo**.

---

## 5. Estados de los productos en cocina

Cada estación podrá ver:

- **Pendientes**: Productos recién llegados, aún no preparados.
- **Solicitados**: Productos que se han vuelto a pedir (central).
- **Finalizados**: Productos marcados como listos.

Además, cada estación tiene un **resumen de estados** con contadores automáticos.

---

## 6. Ver pedidos finalizados

En la parte superior encontrarás el botón **“Ver Pedidos Finalizados”**, donde se muestra el historial reciente de pedidos completados.

Es muy útil para verificar que todo salió correctamente o para reemitir algún ticket.

---

## 7. Funcionalidad de Voz (si tu plan lo incluye)

La cocina incluye un sistema de voz inteligente:

### 🔊 **Lectura automática**
Al llegar una nueva comanda, el sistema puede **leerla en voz alta** indicando:

- Mesa  
- Cantidad  
- Nombre del producto  
- Alergias  
- Comensal (si está activado)

### 🎤 **Control por micrófono**
La cocina también puede usar comandos como:

- “¿Qué hay en la mesa 12?”  
- “Marca el pulpo como listo”  
- “Lee de nuevo la comanda”  
- “Solicitar ensalada mesa 4”

El asistente de voz está disponible solo para los planes que incluyen Voz en Cocina.

---

## 8. Funcionamiento general del pedido

1. El camarero envía los productos desde el TPV.  
2. Cada estación recibe solo los productos que debe preparar.  
3. El cocinero marca cada producto como **listo**.  
4. Si está activado, el ticket se imprime automáticamente.  
5. Cuando todos los productos están listos, se puede marcar el **pedido completo como finalizado**.  

Este flujo asegura una cocina organizada, rápida y sin confusiones.

  `
                ]
            },
            {
                id: "barra-funcionamiento",
                categoria: "TPV",
                titulo: "Cómo usar la pantalla de Barra",
                contenido: [
                    `
La pantalla de Barra está diseñada para que el personal encargado de bebidas pueda trabajar de forma rápida, ordenada y sin confusiones. Aquí llegan únicamente los productos clasificados como bebidas, o aquellos platos que pertenezcan a la estación “barra” según la configuración del restaurante.

---

## 1. ¿Qué muestra la pantalla de barra?

Cada tarjeta corresponde a una mesa e incluye:

- Número de mesa  
- Número de comensales  
- Tiempo transcurrido desde que entró el pedido  
- Lista de bebidas asignadas a barra  
- Tipo de bebida (copa, pinta, botella, etc.)  
- Acompañante seleccionado (tónica, refresco, zumo… o “Sin acompañante”)  

Toda esta información llega directamente desde el TPV al enviar el pedido.

---

## 2. Organización de los pedidos

Alef muestra de manera clara los productos según su estado:

- **Pendientes** → bebidas aún no preparadas  
- **Finalizadas** → bebidas marcadas como listas  

En la pantalla de barra **no existe la acción “Solicitar”**, ya que las bebidas no pueden volver a pedirse desde barra.

Cada estación ve únicamente los productos que debe preparar, evitando confusiones con cocina u otras áreas.

---

## 3. Acompañantes y variaciones de bebida

Cuando el camarero elige un acompañante o tipo de servicio, se mostrará en la tarjeta:

Ejemplos:
- “Copa”  
- “Botella”  
- “Pinta”  
- “+ Tónica Zero”  
- “+ Fanta de Limón”  
- “+ Sin acompañante”  

Esto permite a barra preparar exactamente lo solicitado sin necesidad de preguntar nuevamente.

---

## 4. Acciones disponibles

En barra existe una única acción directa sobre cada producto:

### ✔ **Marcar como finalizada**
Cuando la bebida está preparada, se marca como lista.

Si el restaurante tiene activada la impresión automática en configuración, Alef imprimirá un **ticket de bebida lista** en la impresora correspondiente.

---

## 5. Finalizar un pedido completo

Cuando **todas las bebidas** de una mesa estén marcadas como finalizadas, el botón **“Terminar Pedido”** se habilita.

Esto:

- Cierra la preparación de la mesa para barra  
- La elimina de la vista de pendientes  
- Mantiene ordenado el flujo de trabajo  

---

## 6. Pedidos finalizados

Desde el botón **“Ver Finalizados”**, el personal de barra puede ver:

- Historial de bebidas finalizadas  
- Hora de finalización  
- Detalles por mesa  

Muy útil para reconfirmar pedidos ya atendidos.

---

## 7. Funcionalidad de Voz (si está incluida en el plan)

La barra cuenta con un sistema de voz que puede:

### 🔊 **Leer las comandas al entrar**
El sistema anuncia:

- Número de mesa  
- Cantidad  
- Nombre de la bebida  
- Tipo (copa, pinta, botella…)  
- Acompañante  

### 🎤 **Responder a consultas**
Se pueden realizar acciones por voz como:

- “¿Qué hay en la mesa 5?”  
- “Lee de nuevo la comanda de la mesa 12.”  
- “Ver pedidos finalizados.”  

Es especialmente útil cuando el personal tiene las manos ocupadas.

---

## 8. Resumen general

La pantalla de barra permite:

- Procesar bebidas de manera clara y ordenada  
- Ver acompañantes, variaciones y cantidades sin confusiones  
- Mantener un flujo rápido marcando productos como finalizados  
- Trabajar con voz para agilizar la operación  
- Evitar errores al filtrar solo bebidas correspondientes a la estación  

Es un módulo pensado para la rapidez, claridad y eficiencia del personal de barra.

        `
                ]
            }
        ],
    },

    // ⬇️⬇️⬇️ A PARTIR DE AQUÍ AGREGO LA SECCIÓN CARTA ⬇️⬇️⬇️

    carta: {
        articulos: [

            /* -----------------------------------------------------
             * 1) HOME DE LA CARTA DIGITAL
             * ----------------------------------------------------- */
            {
                id: "carta-home-funcionamiento",
                titulo: "Cómo funciona la página principal de la Carta Digital",
                descripcion: "Explicación completa del home de la carta digital: imágenes, textos, productos destacados y secciones principales.",
                contenido: [
                    `La página principal de la **Carta Digital** es lo primero que ven tus clientes al acceder.

Está diseñada para ser visual, atractiva y totalmente configurable desde:

**Dashboard → Configuración → Carta**

---

## 🔹 1) Imagen principal y texto destacado

En la parte superior aparece:

- Una **imagen grande de portada**
- Un **mensaje principal** (slogan o texto comercial)

Ambos se configuran desde:

- **Imágenes del home**
- **Textos del home**

Puedes añadir varias imágenes al carrusel para que roten automáticamente.

---

## 🔹 2) Botones principales

Debajo del encabezado se muestran dos botones:

- **¡Reserva mesa!** → aparece solo si el módulo de reservas está activado  
- **Ver Carta** → abre directamente la carta completa

Estos botones dependen de la configuración del restaurante.

---

## 🔹 3) Productos recomendados

Aquí se muestran productos destacados seleccionados por ti.

- Pueden ser platos o bebidas  
- Se configuran en: **Carta → Productos destacados**  
- Cada tarjeta incluye:
  - Imagen
  - Nombre
  - Descripción
  - Precio
  - Categoría

La sección se rellena automáticamente una vez seleccionados.

---

## 🔹 4) Bloque “¿Por qué elegirnos?”

Un bloque visual editable donde puedes mostrar:

- Ambiente del local  
- Calidad de la cocina  
- Ubicación  
- Servicio  
- Cualquier mensaje promocional  

Sus imágenes y textos se editan también desde:

**Imágenes del home** y **Textos del home**

---

## 🔹 5) Mapa interactivo

Al final del home aparece un **mapa con la ubicación del restaurante**.

- La dirección se obtiene de: **Configuración del restaurante → Información del restaurante**  
- El cliente puede ampliar, navegar o solicitar indicaciones

---

## 🔹 6) Sección de contacto

Se muestran datos clave:

- Teléfono  
- Dirección  
- Horario de comida y cena  

Todo configurable desde el panel del restaurante.

---

## 🔹 Resumen general

La portada de la Carta Digital es:

- Totalmente **personalizable**
- Visual y orientada a conversión
- Sin necesidad de conocimientos técnicos

Cada restaurante puede adaptarla a su identidad y estilo.
`
                ],
                imagen: "/ayuda/carta-home.png",
            },

            /* -----------------------------------------------------
             * 2) RESERVAS DESDE LA CARTA DIGITAL
             * ----------------------------------------------------- */
            {
                id: "carta-reservas-funcionamiento",
                titulo: "Cómo funcionan las reservas desde la Carta Digital",
                descripcion: "Explicación del sistema de reservas online que los clientes pueden usar si tienes activado el módulo de reservas.",
                contenido: [
                    `Si tienes activado el módulo de **reservas online**, los clientes podrán reservar directamente desde la Carta Digital usando el botón:

**“Reserva mesa”**

---

## 🔹 1) Activación del sistema de reservas

Puedes activar o desactivar reservas desde:

**Dashboard → Configuración → Reservas**

Opciones configurables:

- Horarios de comida y cena  
- Límites por franja horaria  
- Días abiertos o cerrados  
- Políticas de reserva  
- Mensajes informativos  

Cuando el módulo está activado, el botón **¡Reserva mesa!** aparece en la portada.

---

## 🔹 2) Formulario de reserva del cliente

El cliente completa:

- Fecha  
- Nombre y teléfono  
- Correo electrónico  
- Número de personas  
- Alergias (opcional)  
- Mensaje al restaurante (opcional)  
- Selección del horario disponible  

Las franjas horarias se generan automáticamente según la configuración.

Alef también muestra cuántas reservas quedan disponibles por franja.

---

## 🔹 3) Validación y aceptación de reservas

Dos modos disponibles:

### ✔ **Reservas automáticas**
Si cumplen los límites, quedan confirmadas al instante.

### ✔ **Reservas manuales**
Quedan pendientes y deben ser aceptadas desde el TPV.

Las reservas con demasiados comensales siempre requieren confirmación manual.

---

## 🔹 4) Correos automáticos

Alef envía notificaciones por email:

- **Al cliente:** confirmación o rechazo  
- **Al restaurante:** aviso de nueva reserva  

Los textos de los correos pueden personalizarse.

---

## 🔹 5) Gestión de reservas desde el TPV

En:

**TPV → Reservas**

Puedes:

- Ver reservas por fecha  
- Aceptarlas o rechazarlas  
- Crear reservas manuales  
- Añadir notas internas  
- Revisar el historial completo  

---

## 🔹 6) Políticas visibles para el cliente

Debajo del formulario se muestran políticas configurables, como:

- Tiempo máximo que se mantiene la mesa  
- Duración estándar de la reserva  
- Política de cancelación  
- Información legal  

---

## 🔹 Resumen general

El módulo de reservas permite:

- Automatizar la gestión  
- Reducir llamadas al restaurante  
- Control total desde el Dashboard  
- Flexibilidad para configurar horarios, límites y políticas  
`
                ],
                imagen: "/ayuda/carta-reservas.png",
            },

            /* -----------------------------------------------------
             * 3) MODO LECTURA — NAVEGAR LA CARTA
             * ----------------------------------------------------- */
            {
                id: "carta-modo-lectura",
                titulo: "Cómo navegar la Carta Digital del restaurante",
                descripcion: "Explica la visualización de la carta digital: productos, categorías, idiomas, imágenes y valoraciones. (Este modo no permite pedir todavía).",
                contenido: [
                    `Cuando un cliente pulsa **“Ver Carta”**, accede al modo **solo lectura** de la carta digital.

👉 En este modo **no se pueden hacer pedidos**.  
Es únicamente informativo.

---

## 🔹 1) Categorías y navegación superior

Incluye:

- Filtro por categorías (Entrantes, Carnes, Postres, Bebidas…)  
- Selector Platos / Bebidas  
- Cambio de idioma  

Todo se configura desde:

**Dashboard → Configuración → Carta → Secciones**

---

## 🔹 2) Productos destacados

La primera sección muestra los productos marcados como:

**Destacados** → configurables desde **Productos destacados**

- Sección opcional  
- Orden totalmente editable  

---

## 🔹 3) Secciones de la carta

Cada sección puede mostrar:

- Título  
- Descripción  
- Productos con imagen, precio y valoración  
- Número total de productos  

El orden de las secciones es personalizable.

---

## 🔹 4) Información de producto

Cada ficha puede mostrar:

- Imagen  
- Nombre y descripción  
- Precio  
- Valoraciones  
- Etiquetas (“Nuevo”, “Especial”, etc.)

Todo se edita desde:

**Dashboard → Productos**

---

## 🔹 5) Idiomas disponibles

Si has configurado varios idiomas en el panel:

- Español  
- Inglés  
- Francés  
- Otros  

El cliente puede cambiar el idioma en cualquier momento.

---

## 🔹 6) Modo lectura (sin pedidos)

No aparecerán botones de “Añadir”.

Ideal para:

- Ver precios  
- Revisar alérgenos  
- Consultar descripciones  
- Comparar productos  

---

## 🔹 Resumen general

La carta digital en modo lectura es:

- Clara  
- Organizada  
- Totalmente editable  

Es perfecta para que el cliente explore tu oferta antes de pedir.
`
                ],
                imagen: "/ayuda/carta-lectura.png",
            },

            /* -----------------------------------------------------
             * 4) CARTA QR – PEDIDOS INTERACTIVOS
             * ----------------------------------------------------- */
            {
                id: "carta-cliente-qr",
                titulo: "Cómo funciona la Carta Digital cuando el cliente escanea el QR",
                descripcion: "Cómo los clientes usan la carta digital desde el QR: filtros, idiomas, carrito, orden de servicio y petición de cuenta.",
                contenido: [
                    `Cuando el cliente escanea el **QR de la mesa**, entra en la Carta Digital en modo **interactivo**, donde sí puede realizar pedidos.

---

## 🔹 1) Configuración inicial del cliente

Antes de ver la carta, el cliente introduce:

- Nombre  
- Alergias  
- Número de comensales  
- Contraseña del día (si está activada)

Esto permite identificar correctamente cada pedido y sus alergias.

---

## 🔹 2) Acceso completo a la Carta Digital

La carta interactiva incluye:

- Botones de **Añadir al carrito**  
- Filtro por categorías  
- Cambio de idioma  
- Visualización de valoraciones  
- Fotos, descripciones y precios  

Todo el contenido se gestiona desde:

**Dashboard → Configuración de Carta**

---

## 🔹 3) Carrito del cliente

Desde el carrito pueden:

- Aumentar o reducir cantidades  
- Eliminar productos  
- Añadir notas para cocina  
- Ver subtotales  

Al pulsar **Enviar Pedido**, el TPV recibe el pedido en tiempo real.

---

## 🔹 4) Orden de servicio (muy importante)

El cliente elige cómo quiere que se sirva su comida:

- Entrante  
- Principal  
- Postre  
- Bebidas  
- O “**Servir todo junto**”

La cocina recibe el pedido exactamente en el orden que el cliente selecciona.

---

## 🔹 5) Notificaciones al cliente

Cuando cocina marca un pedido como **Listo**:

- El cliente ve un aviso  
- También puede sonar una alerta (si está activado)

---

## 🔹 6) Botón “Pedir cuenta”

Una vez todo el pedido está preparado:

- La Carta muestra el botón **Pedir cuenta**  
- El camarero recibe una notificación en el TPV  
- La mesa aparece como “Solicita cuenta”

---

## 🔹 7) Todo es configurable desde el Dashboard

Puedes modificar:

- Textos  
- Idiomas  
- Colores  
- Fotos  
- Productos  
- Alergias  
- Orden de la carta  
- Contraseña del día  

---

## 🔹 Resumen general

La experiencia QR permite:

- Pedir sin esperar al camarero  
- Ordenar los platos al gusto  
- Recibir notificaciones  
- Pedir la cuenta con un clic  

Todo el proceso es automático, rápido y profesional.
`
                ],
                imagen: "/ayuda/carta-qr.png",
            }

        ]
    },
    dashboard: {
        articulos: [
            {
                id: "dashboard-general",
                categoria: "Dashboard",
                titulo: "Cómo usar el Dashboard General de tu restaurante",
                descripcion:
                    "Aprende a gestionar tu restaurante desde un único lugar: perfil, plan, facturas, carta digital, datos de negocio y sistema de reservas.",
                contenido: [
                    `
El **Dashboard General** es el punto central desde donde administras todas las funciones de tu restaurante en Alef.  
Desde aquí podrás acceder a tu información personal, gestionar tu suscripción, configurar tu carta digital, revisar tus facturas, administrar reservas y actualizar los datos del restaurante.

A continuación te explicamos cada módulo del Dashboard:

---

## 1. Perfil del usuario

En esta sección puedes:

- Editar tu nombre
- Cambiar tu correo
- Modificar preferencias del usuario
- Gestionar tu contraseña (si no usas login con Google)

Es tu espacio personal dentro de Alef y no afecta a la configuración del restaurante.

---

## 2. Mi Cuenta – Suscripción, facturación y VeriFactu

Aquí gestionas toda la parte legal y de pago del sistema.

Incluye varias tarjetas:

### 🔹 **Plan y Suscripción**
- Ver el estado de tu plan (Activo / Inactivo)
- Ver el tipo de plan contratado (Básico, Pro o Avanzado)
- Ver la fecha de renovación
- Acceder al panel para gestionar métodos de pago y facturación automática

### 🔹 **Firma Digital (.p12)**
Para activar **VeriFactu**, debes subir tu certificado digital.

Podrás:
- Cargar el archivo .p12
- Introducir tu contraseña de certificado
- Activar o desactivar el módulo de firma

### 🔹 **Cumplimiento Legal – Ley 11/2021**
Aquí encontrarás:

- **Declaración Responsable** (descargable en PDF)
- Estado del sistema **VeriFactu** (Activado / Desactivado)

Alef está diseñado para cumplir con la Ley Antifraude, generando facturas encadenadas y firmadas.

### 🔹 **Tu Usuario**
Información básica del perfil:

- Nombre
- Email utilizado para tu cuenta
- Estado del usuario dentro del sistema

---

## 3. Facturas Encadenadas

La sección de facturas te permite controlar tu historial fiscal de forma segura y transparente.

Incluye:

### 🔹 **Filtros de búsqueda**
Puedes filtrar tus facturas por:

- Fecha
- Año
- Cliente
- Número de factura
- Hash
- Estado

### 🔹 **Listado completo**
Cada factura muestra:

- Estado (Correcto, Pendiente, Enviado, Error…)
- Número de factura
- Fecha
- Importe
- Hash encadenado
- Acciones:  
  **Rectificar**, **Anular**, ver respuesta AEAT, descargar XML, etc.

### 🔹 **Exportación**
Puedes exportar tus facturas:

- En formato **CSV**
- En formato **PDF**

Es una herramienta esencial para auditorías y control fiscal.

---

## 4. Carta – Configura tu carta digital

Desde este módulo podrás gestionar **toda la experiencia del cliente en la carta online**, incluyendo:

- Crear / editar categorías
- Crear / editar platos y bebidas
- Añadir fotos, descripciones, precios, variaciones y alérgenos
- Marcar productos como destacados o en promoción
- Controlar visibilidad de productos
- Elegir orden personalizado o por categorías

Toda esta configuración se refleja **de inmediato en la carta digital**.

---

## 5. Datos del restaurante

Aquí defines la identidad visual y operativa del restaurante.

Podrás editar:

- Logo e imagen pública
- Dirección completa
- Teléfono
- Horarios de comida y cena
- Colores del TPV (barra, cocina, caja)
- Configuraciones generales del restaurante
- Apariencia del entorno Alef
- Idiomas habilitados
- Funciones activas del plan (reservas, valoración, alérgenos, fotos, voz en cocina/barra, etc.)

Es el primer paso recomendado al usar Alef por primera vez.

---

## 6. Reservas – Gestión completa del sistema de reservas

Este apartado permite administrar todas las reservas que llegan desde la carta digital.

### 🔹 Desde la tabla de reservas podrás:

- Ver reservas por fecha
- Filtrar por estado (pendiente, confirmada, rechazada)
- Confirmar o rechazar reservas manualmente
- Eliminar reservas
- Crear una reserva manual en nombre de un cliente

### 🔹 Configuración de reservas
En el panel de ajustes puedes definir:

- Días de la semana habilitados
- Franjas horarias para comida y cena
- Máximo de reservas por franja
- Fechas especiales con horarios diferentes
- Mensajes informativos para clientes
- Capacidad del restaurante
- Límite de personas por reserva
- Tiempo de retención automática antes de liberar la mesa

### 🔹 Notificaciones automáticas
Alef envía correos automáticamente para:

- Confirmación de reservas
- Rechazo
- Modificaciones importantes

El cliente siempre estará informado en tiempo real.

---

## 7. Resumen general

El Dashboard General te ofrece un control total sobre tu restaurante:

- Gestionas tu identidad, facturas y cumplimiento legal  
- Configuras la carta y la experiencia del cliente  
- Controlas reservas y disponibilidad  
- Editas tus datos personales  
- Administra tu suscripción y sistema fiscal  

Todo **desde un único lugar**, claro y accesible.
`
                ],
                imagen: "/ayuda/dashboard-general.png"
            },
            {
                id: "panel-control-modulos",
                titulo: "Módulos del Panel de Control",
                descripcion:
                    "Explora cada una de las herramientas administrativas disponibles en Alef: estadísticas, caja diaria, usuarios, mapa del restaurante y gestor de productos. La profundidad de cada módulo depende del plan contratado.",
                contenido: [
                    `El **Panel de Control de Alef** reúne todas las funciones avanzadas para administrar el restaurante.  
Según tu plan contratado (**Básico, Pro, Ultra Pro**), tendrás acceso a distintas herramientas, niveles de estadísticas y capacidades administrativas.

---

## 🔹 1) Estadísticas de ventas

Este módulo permite analizar el rendimiento del restaurante desde múltiples perspectivas.

### Incluye estadísticas como:
- Ventas por categoría (platos, bebidas, especiales…)  
- Unidades vendidas  
- Ingresos totales  
- Precio medio por unidad  
- Hora punta del día  
- Producto estrella  
- Comparativa entre fechas  

### Según el plan, se añaden estadísticas avanzadas:
- Estadísticas por mesa (tickets, ingresos, ticket medio)  
- Distribución de pedidos por horas  
- Ranking de productos más vendidos  

Estas herramientas permiten identificar patrones de consumo y mejorar la carta, horarios y estrategias comerciales.

---

## 🔹 2) Caja Diaria Ultra PRO

Disponible para planes avanzados, ofrece control financiero completo del restaurante.

### Incluye:
- Ingresos totales del día o rango seleccionado  
- Número total de tickets  
- Ticket medio  
- Mejores y peores días por ingresos  
- Gráficas dinámicas de facturación  
- Exportación en PDF  

Una herramienta clave para la supervisión contable profesional.

---

## 🔹 3) Gestión de usuarios

Desde este módulo puedes administrar a todo el personal:

- Crear usuarios  
- Asignar roles (camarero, cocina, barra, administrador…)  
- Dar permisos específicos  
- Editar o eliminar usuarios  
- Mantener el control del acceso al sistema  

### Funciones adicionales según el plan:
- Estadísticas por usuario  
- Actividad y desempeño  
- Tickets generados  

---

## 🔹 4) Mapa del restaurante

Una herramienta visual para diseñar el plano del local.

### Permite:
- Organizar ubicación de mesas  
- Crear mesas auxiliares  
- Cambiar entre zonas (interior, terraza, salón…)  
- Mantener pulsado sobre una mesa para editar número o eliminarla  

📌 **IMPORTANTE:**  
El mapa configurado aquí es exactamente el que verán los camareros en el TPV.  
Los cambios se sincronizan al instante en todos los dispositivos.

---

## 🔹 5) Carta y productos

Aquí se gestiona toda la información visible en la Carta Digital y en el TPV.

### Puedes:
- Crear, editar y eliminar productos  
- Organizar platos y bebidas por categorías  
- Subir imágenes  
- Añadir alérgenos, traducciones y descripciones  
- Definir precios, variaciones y suplementos  
- Controlar visibilidad del producto  

Los cambios se reflejan **en tiempo real** en la carta pública y en el TPV.

📌 *La creación de productos se detalla en un artículo propio.*

---

## 🔹 6) Profundidad según el plan contratado

Alef adapta las funciones del panel al nivel de suscripción:

### **Plan Básico**
- Estadísticas simples  
- Edición esencial de carta  
- Mapa básico de mesas  

### **Plan Pro**
- Estadísticas ampliadas  
- Mejores herramientas de administración  
- Más opciones de configuración  

### **Plan Ultra Pro**
- Caja Diaria avanzada  
- Gráficas financieras completas  
- Estadísticas profundas  
- Funciones administrativas exclusivas  

Esto permite que cada restaurante use Alef exactamente al nivel que necesita, pagando solo por lo que realmente usa.

---

## 🔹 Resumen general

Los módulos del Panel de Control convierten a Alef en una herramienta:

- **Profesional**  
- **Centralizada**  
- **Flexible según el plan**  
- **Actualizada en tiempo real**  

Ideal para gestionar el restaurante día a día con claridad y eficiencia.
`
                ]
            },
            {
                id: "productos-crear-editar",
                categoria: "Dashboard",
                titulo: "Crear y editar productos",
                descripcion:
                    "Aprende qué significa cada campo del formulario de productos y cómo se usan en la carta digital, el TPV y el reconocimiento por voz.",
                contenido: [
                    `El formulario **Crear producto** define toda la información que se mostrará en la carta digital y en las pantallas del TPV (camareros, cocina y barra).  
Nada de lo que rellenes aquí es definitivo: absolutamente todos los datos se pueden editar más adelante.

---

## 1. Datos que verá el cliente y el personal

Los campos de la columna izquierda (nombre, descripción e idiomas) son los textos que se mostrarán:

- En la carta digital cuando un cliente consulte el producto.
- En el TPV al tomar una comanda.
- En cocina y barra cuando se envía el pedido.

Puedes rellenar:

- Nombre del producto en el idioma principal.
- Nombre en inglés y francés (si usas varios idiomas).
- Descripciones en cada idioma.
- Lista de ingredientes (opcional).

Estos textos ayudan al cliente a entender el plato y al personal a evitar errores.

---

## 2. Categoría, Tipo, Sección y Estación

En la columna derecha eliges cómo se organiza el producto dentro del sistema.

### Tipo

- PLATO: productos de comida.
- BEBIDA: productos de barra.

Según el tipo, verás un bloque de precios diferente (Precios plato o Precios bebida).

### Categoría

Agrupa productos similares (por ejemplo: Pizzas, Entrantes, Postres, Vinos…).  
Se usa principalmente para organizar la carta y los listados del TPV.

### Sección

La sección es el grupo en el que aparecerá el producto **dentro de los carritos antes de enviar el pedido**, tanto:

- En el TPV de los camareros.
- Como en la carta digital cuando el cliente prepara su pedido.

Las secciones se pueden **crear, editar y eliminar** desde:

- Configuración del restaurante → Carta / Secciones.

### Estación

La estación indica **a qué área se envía el producto** cuando se manda a producción:

- Plancha, Frito, Frío, Barra, Postres, etc.
- También puedes tener una estación Central que vea todo.

Las estaciones se gestionan desde:

- Configuración del restaurante → Estaciones de cocina / barra.

Elegir bien la estación es clave para que cada pedido llegue al panel correcto (cocina o barra).

---

## 3. Precios de platos

En productos de tipo PLATO verás el bloque "Precios plato":

- Precio base
- Precio tapa
- Precio ración
- Precio del adicional (unidad extra)

Puedes usarlo así:

### Un solo precio

Si el plato solo tiene un precio (por ejemplo, una hamburguesa que siempre vale lo mismo):

- Rellena **solo "Precio base"**.
- Deja vacíos **"Precio tapa"** y **"Precio ración"**.

### Dos precios (tapa y ración)

Si el plato tiene varios tamaños, por ejemplo:

- Tapa de croquetas
- Ración de croquetas

Entonces:

- Rellena **"Precio tapa"** y **"Precio ración"**.
- Deja **"Precio base" vacío**.

El TPV y la carta mostrarán las dos opciones y el camarero o el cliente elegirán cuál añadir.

### Precio del adicional (unidad extra)

Este campo sirve para casos como:

- Una tapa de tacos incluye 2 unidades, pero en la mesa son 3 personas.
- En vez de apuntar "2 tapas de tacos" (4 unidades), puedes apuntar:
  - 1 tapa normal.
  - 1 adicional.

De este modo:

- Cobras la tapa al precio normal.
- Cobras una unidad extra al precio que hayas definido en "Precio del adicional".

Esto hace que las cuentas cuadren sin inventar combinaciones raras de tapas.

---

## 4. Precios de bebidas

En productos de tipo BEBIDA verás el bloque "Precios bebida":

- Precio base
- Precio copa
- Precio botella

Puedes usarlo así:

### Bebida con un solo precio

Si la bebida solo tiene un precio (por ejemplo, un refresco o una cerveza de caña):

- Rellena **"Precio base"**.
- Deja vacíos **"Precio copa"** y **"Precio botella"**.

### Bebida con varios formatos (copa y botella)

Si vendes la misma referencia en varios formatos, por ejemplo un vino:

- Rellena **"Precio copa"** y **"Precio botella"**.
- Deja **"Precio base" vacío**.

En el TPV y en la carta aparecerán las dos opciones para elegir fácilmente.

---

## 5. Aliases (nombres para pedidos por voz)

El campo **Aliases** sirve para el módulo de reconocimiento de voz (si tu plan lo incluye).

Son palabras o frases alternativas que el sistema entiende como este producto.  
Por ejemplo, para una cerveza:

- Nombre del producto: Cerveza de barril.
- Aliases: caña, cañita, birra.

Así, cuando el camarero diga al asistente de voz "anótame dos cañas", el sistema sabrá que se refiere a este producto.

Escribe varios aliases separados por comas.

---

## 6. Stock

El campo **Stock** define cuántas unidades tienes disponibles.

- A medida que se venden productos, el stock se puede ir actualizando.
- Cuando se agote, el sistema puede evitar que se siga vendiendo (según la configuración que tengas).

Si por ahora no quieres controlar stock, puedes dejarlo en cero o en un valor alto y ajustarlo más adelante.

---

## 7. Alérgenos

En **Alérgenos** puedes indicar los alérgenos que contiene el producto, separados por comas:

- Ejemplo: gluten, lactosa, huevo.

Esta información:

- Aparece en la carta digital para el cliente.
- Puede mostrarse también en las pantallas de TPV, cocina y barra.

Es muy importante mantenerla actualizada por motivos legales y de seguridad alimentaria.

---

## 8. Imagen del producto

En la parte inferior puedes subir una foto:

- Arrastrando la imagen al recuadro.
- O haciendo clic para seleccionar un archivo.

La imagen se mostrará:

- En la carta digital (muy recomendable para productos destacados).
- En algunos listados internos del TPV, según la configuración.

Puedes cambiar la imagen en cualquier momento.

---

## 9. Todo es editable

Aunque este formulario es muy completo, nada queda bloqueado:

- Puedes editar nombre, descripciones, precios, categorías, secciones, estaciones, stock, alérgenos, aliases e imagen siempre que quieras.
- Los cambios se aplican de forma inmediata tanto en la carta digital como en el TPV.

La idea es que definas aquí cómo quieres que se vea y se cobre el producto, y luego puedas ir afinando los detalles con el tiempo.`
                ],
                imagen: "/ayuda/producto-crear.png"
            }
        ]
    },

};