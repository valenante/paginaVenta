// src/pages/Ayuda/ayudaDataShop.js

export const ayudaDataShop = {
  empezar: {
    titulo: "Empezando con Alef Shop",
    articulos: [
      {
        id: "configuracion-tienda",
        titulo: "Configurar la información de la tienda",
        descripcion:
          "Define datos fiscales, apariencia del panel, impresoras y opciones base para vender con Alef Shop.",
        contenido: [
          `Desde esta pantalla puedes definir la **identidad**, los **datos fiscales** y el **comportamiento general** de Alef Shop.  
Es lo primero que recomendamos configurar.

---

## 🔹 1) Identidad de la tienda

- Nombre comercial (aparece en tickets, facturas y panel).
- Logotipo (PNG/JPG).
- Datos de contacto: teléfono, email, dirección.

---

## 🔹 2) Apariencia del panel

Puedes personalizar:

- Color principal (cabeceras y acentos).
- Color secundario (botones y etiquetas).
- Fondo general y tarjetas.
- Tipografía del panel.

Los cambios se ven de inmediato en la interfaz.

---

## 🔹 3) Configuración fiscal y VeriFactu (CIF)

Antes de activar facturación avanzada / VeriFactu completa:

- CIF/NIF
- Razón social
- Dirección completa
- Municipio, provincia, país

Pulsa **Guardar configuración fiscal**.

---

## 🔹 4) Métodos de pago

Configura qué métodos se mostrarán en caja:

- Efectivo
- Tarjeta
- Transferencia / otros
- Pago mixto (si aplica)

---

## 🔹 5) Impresión y tickets

En **Configuración → Impresión** puedes definir:

- Servidor de impresión (si usas impresión distribuida).
- Impresora de tickets.
- Apertura de cajón automática (si hay cajón).
- Doble copia, encabezado, pie, etc.

---

## 🔹 Guardar cambios

Pulsa **Guardar configuración general** para aplicar todo.`,
        ],
        imagen: "/ayuda/shop/configuracion-tienda.png",
      },

      {
        id: "primeros-pasos-productos",
        titulo: "Primeros pasos: crear categorías y productos",
        descripcion:
          "Cómo organizar tu catálogo para vender rápido: categorías, SKU, código de barras, precios, IVA y stock.",
        contenido: [
          `Antes de vender, te recomendamos preparar el catálogo.

---

## 🔹 1) Crea categorías

Ejemplos:
- Bebidas
- Snacks
- Limpieza
- Electrónica

Las categorías hacen que el TPV sea más rápido y ordenado.

---

## 🔹 2) Crea productos con datos mínimos

Un producto ideal incluye:

- **Nombre**
- **Categoría**
- **Precio**
- **IVA**
- **Stock inicial** (si controlas inventario)

---

## 🔹 3) SKU y código de barras (muy recomendado)

- **SKU**: tu código interno (opcional).
- **Código de barras**: para vender escaneando.

Si un producto tiene código de barras, el flujo de venta se acelera muchísimo.

---

## 🔹 4) Stock (si lo activas)

- Activa “Gestiona stock”.
- Define mínimo (alertas).
- Define unidad (ud/kg/l).

---

## 🔹 5) Revisión final

Cuando tengas lo básico:
- prueba una venta,
- imprime un ticket,
- ajusta el formato del ticket.`,
        ],
        imagen: "/ayuda/shop/primeros-pasos-productos.png",
      },

      {
        id: "usuarios-y-roles-shop",
        titulo: "Usuarios y roles en Shop",
        descripcion:
          "Crea usuarios de caja y administra permisos: ventas, stock, caja y administración.",
        contenido: [
          `Alef Shop permite crear usuarios con permisos para evitar errores y controlar accesos.

---

## 🔹 Roles típicos

- **Admin / Dueño**: configuración total.
- **Cajero**: ventas + devoluciones (según permisos).
- **Stock**: entradas, ajustes, inventario.
- **Supervisor**: caja diaria, reportes, auditoría.

---

## 🔹 Recomendación práctica

- No des permisos de “Eliminar” o “Modificar precios” a todos.
- Mantén “Ajustar stock” limitado a responsables.

---

## 🔹 Auditoría

El sistema puede registrar acciones para trazabilidad:
- ventas
- devoluciones
- ajustes de stock
- cambios de precio`,
        ],
        imagen: "/ayuda/shop/usuarios-roles.png",
      },
    ],
  },

  ventas: {
    titulo: "Ventas • TPV Shop",
    articulos: [
      {
        id: "venta-rapida-shop",
        titulo: "Cómo hacer una venta rápida (TPV Shop)",
        descripcion:
          "Escanea productos, ajusta cantidades, aplica descuentos y cobra con ticket automático.",
        contenido: [
          `La pantalla de **Ventas** es el centro de trabajo del día a día en Shop.

---

## 🔹 1) Agregar productos al carrito

Tienes 3 formas:

- Buscar por nombre
- Elegir por categoría
- **Escanear código de barras** (recomendado)

Cada producto se suma al carrito con cantidad y subtotal.

---

## 🔹 2) Ajustar cantidades

- Usa + / - para sumar o restar unidades
- Puedes eliminar una línea si fue un error
- Si el producto permite decimales (ej. kg), se habilita cantidad decimal

---

## 🔹 3) Descuentos (si están habilitados)

Puedes aplicar:
- descuento por línea (un producto)
- descuento global (ticket)

---

## 🔹 4) Cobro

Elige método:
- efectivo
- tarjeta
- mixto (si lo usas)

Al confirmar:
- se registra la venta
- se descuenta stock (si está activado)
- se imprime ticket (si impresión activa)

---

## 🔹 5) Reimpresión de ticket

Desde el historial de ventas puedes reimprimir un ticket reciente.`,
        ],
        imagen: "/ayuda/shop/venta-rapida.png",
      },

      {
        id: "devoluciones-y-rectificaciones",
        titulo: "Devoluciones, anulaciones y rectificaciones",
        descripcion:
          "Cómo gestionar errores de venta de forma trazable y legalmente segura.",
        contenido: [
          `Cuando hay un error o devolución, lo importante es hacerlo con trazabilidad.

---

## 🔹 1) Devolución (recomendado)

Usa **Devolver** desde el historial de ventas:

- seleccionas el ticket
- seleccionas líneas a devolver (total o parcial)
- eliges método de devolución
- se genera registro y ticket de devolución

Si gestionas stock, el sistema puede **reintegrar stock** (según configuración).

---

## 🔹 2) Anulación

Para ventas recientes, algunas tiendas permiten anular:
- solo con permisos
- quedará registrado

---

## 🔹 3) Rectificación / facturación

Si emites facturas:
- la corrección se hace con **factura rectificativa** (según configuración fiscal).

---

## 🔹 Recomendación

Evita “editar ventas” manualmente.  
Siempre devolución/rectificación = trazabilidad perfecta.`,
        ],
        imagen: "/ayuda/shop/devoluciones.png",
      },

      {
        id: "clientes-y-datos-ticket",
        titulo: "Cliente, factura y datos en el ticket",
        descripcion:
          "Cómo añadir datos del cliente para factura nominativa y mantener tickets claros.",
        contenido: [
          `En Shop puedes vender como ticket normal o con datos del cliente (si lo necesitas).

---

## 🔹 1) Venta con ticket estándar
No requiere datos del cliente.

---

## 🔹 2) Factura nominativa (si el cliente lo pide)
Puedes añadir:
- nombre/razón social
- NIF/CIF
- dirección

Esto permite generar una factura asociada a la venta.

---

## 🔹 3) Personalización del ticket
En configuración de impresión puedes definir:
- encabezado (nombre, CIF, dirección)
- pie (agradecimiento, devoluciones, web, etc.)
- mostrar IVA desglosado (si aplica)

---

## 🔹 Consejo
Mantén el ticket simple, pero con datos fiscales correctos.`,
        ],
        imagen: "/ayuda/shop/ticket-datos.png",
      },
    ],
  },

  stock: {
    titulo: "Stock • Inventario",
    articulos: [
      {
        id: "stock-alta-productos",
        titulo: "Cómo crear productos con control de stock",
        descripcion:
          "Configura stock mínimo, unidad de medida, decimales, coste y venta para tener inventario fiable.",
        contenido: [
          `Para tener inventario fiable, lo importante es crear productos con criterios claros.

---

## 🔹 1) Activar control de stock
En el producto:
- **Gestiona stock**: ON
- Stock inicial
- Stock mínimo (alertas)

---

## 🔹 2) Unidad y decimales
- unidad: ud / kg / l / etc.
- permitir decimal: ON para productos a peso/volumen

---

## 🔹 3) Precio y coste (si usas margen)
- precio de venta
- precio de coste
- IVA

Esto permite reportes más completos.

---

## 🔹 4) Códigos
- SKU interno
- Código de barras para escaneo

---

## 🔹 Recomendación
Si un producto se vende por caja/unidad y también suelto, crea productos separados para evitar líos.`,
        ],
        imagen: "/ayuda/shop/stock-alta.png",
      },

      {
        id: "ajustar-stock",
        titulo: "Ajustar stock manualmente",
        descripcion:
          "Cómo corregir diferencias de inventario con motivo y trazabilidad.",
        contenido: [
          `Si tu stock real no coincide con el del sistema, usa **Ajustar stock**.

---

## 🔹 1) Cuándo usarlo
- roturas
- pérdidas
- conteo físico
- errores de carga

---

## 🔹 2) Qué registrar siempre
- cantidad final (o diferencia, según tu UI)
- motivo: “conteo”, “rotura”, “pérdida”, “ajuste manual”, etc.
- usuario que lo realizó (auditoría)

---

## 🔹 3) Buenas prácticas
- Ajustes solo con permisos
- Haz conteos periódicos por categoría
- Revisa productos con stock mínimo`,
        ],
        imagen: "/ayuda/shop/ajustar-stock.png",
      },

      {
        id: "proveedores-y-entradas",
        titulo: "Proveedores: pedidos, recepción y entradas de stock",
        descripcion:
          "Cómo crear pedidos a proveedor, recibirlos y actualizar stock automáticamente.",
        contenido: [
          `Si usas el módulo de Proveedores, este es el flujo recomendado.

---

## 🔹 1) Crear proveedor

Desde **Configuración → Proveedores**, crea un proveedor con:

- Nombre comercial y razón social.
- Contacto (teléfono, email).
- Dirección y condiciones de pago.
- Plazo de entrega habitual.

---

## 🔹 2) Productos del proveedor

Cada proveedor tiene un catálogo de productos con:

- Nombre, precio base e IVA.
- Unidad (kg, litro, unidad, caja…).
- Asociación con productos de tu tienda.

---

## 🔹 3) Crear pedido al proveedor

1. Entra en el proveedor → pestaña **Pedidos**.
2. Pulsa **Nuevo pedido**.
3. Añade líneas con productos y cantidades.
4. Indica fecha esperada y notas.
5. Puedes **descargar el pedido en PDF** para enviárselo.

---

## 🔹 4) Recibir pedido

Al recibir la mercancía:

- Abre el pedido → pulsa **Recibir**.
- Indica cantidades realmente recibidas.
- El stock se actualiza automáticamente.

---

## 🔹 5) Facturas de proveedor

- Sube el documento de factura (PDF/imagen).
- Registra número, fechas e importe.
- Marca como pagada cuando corresponda.

---

## 🔹 Consejo

Siempre que puedas, recibe pedidos desde el sistema: inventario mucho más preciso.`,
        ],
        imagen: "/ayuda/shop/proveedores.png",
      },
    ],
  },

  caja: {
    titulo: "Caja • Turnos y arqueo",
    articulos: [
      {
        id: "apertura-caja",
        titulo: "Apertura de caja y cambio de turno",
        descripcion:
          "Cómo iniciar un turno con saldo inicial y dejar todo listo para vender.",
        contenido: [
          `Antes de empezar a vender, lo ideal es abrir caja.

---

## 🔹 1) Abrir caja
Indica:
- fecha/turno
- saldo inicial (efectivo)
- usuario responsable

---

## 🔹 2) Qué se registra
- ventas por método de pago
- devoluciones
- movimientos (entradas/salidas)
- cierre final

---

## 🔹 3) Cambios de turno
Si cambias de cajero:
- cierra turno anterior
- abre uno nuevo

Así evitas descuadres y responsabilidades mezcladas.`,
        ],
        imagen: "/ayuda/shop/apertura-caja.png",
      },

      {
        id: "movimientos-caja",
        titulo: "Movimientos de caja: entradas y salidas",
        descripcion:
          "Registra pagos, retiradas, cambio, compras rápidas y cualquier movimiento no-venta.",
        contenido: [
          `No todo lo que pasa por caja es una venta.

---

## 🔹 Movimientos comunes
- retirada para banco
- entrada de cambio
- pago a proveedor menor
- caja chica / gastos

---

## 🔹 Buenas prácticas
- registra SIEMPRE un motivo
- limita permisos
- revisa el resumen diario

Esto hace que el arqueo cuadre y te salva en auditorías.`,
        ],
        imagen: "/ayuda/shop/movimientos-caja.png",
      },

      {
        id: "cierre-caja",
        titulo: "Cierre de caja y arqueo",
        descripcion:
          "Cómo cerrar el día con resumen y detectar descuadres rápidamente.",
        contenido: [
          `Al finalizar la jornada, realiza el **cierre de caja**.

---

## 🔹 1) Recuento
Introduce:
- efectivo real contado
- total tarjeta (si aplica)
- otros métodos

---

## 🔹 2) Resumen automático
El sistema muestra:
- ventas totales
- devoluciones
- movimientos
- diferencia (descuadre)

---

## 🔹 3) Exportación (si la tienes)
Puedes exportar:
- PDF de cierre
- CSV para contabilidad

---

## 🔹 Consejo
Cierra caja SIEMPRE al final del turno, aunque sea rápido.`,
        ],
        imagen: "/ayuda/shop/cierre-caja.png",
      },
    ],
  },

  dashboard: {
    titulo: "Dashboard • Gestión y reportes",
    articulos: [
      {
        id: "dashboard-shop-general",
        titulo: "Cómo usar el Dashboard de Shop",
        descripcion:
          "Controla ventas, productos, stock, caja, proveedores y reportes desde un único lugar.",
        contenido: [
          `El Dashboard de Alef Shop centraliza la administración de la tienda.

---

## 🔹 1) Ventas e historial
- filtra por fechas
- busca tickets
- reimprime
- gestiona devoluciones

---

## 🔹 2) Productos y catálogo
- crear/editar productos
- categorías
- imágenes (si las usas)
- visibilidad / activo-inactivo

---

## 🔹 3) Stock e inventario
- alertas por stock mínimo
- entradas/salidas
- ajustes manuales
- trazabilidad

---

## 🔹 4) Caja diaria
- turnos
- movimientos
- cierres
- descuadres

---

## 🔹 5) Facturación y fiscalidad
- tickets
- facturas
- rectificaciones (si aplica)
- configuración fiscal y certificados

---

## 🔹 Resumen
Piensa el Dashboard como el “panel de control” de tu tienda: todo está ahí.`,
        ],
        imagen: "/ayuda/shop/dashboard-general.png",
      },

      {
        id: "reportes-ventas",
        titulo: "Reportes: ventas, productos más vendidos y márgenes",
        descripcion:
          "Analiza tu negocio: qué se vende más, cuándo, y cómo mejorar stock y precios.",
        contenido: [
          `Los reportes te ayudan a decidir mejor.

---

## 🔹 Qué puedes ver
- ventas por día/semana/mes
- productos más vendidos
- ventas por categoría
- ticket medio
- comparativas por fechas

Si usas coste:
- margen por producto
- margen total

---

## 🔹 Cómo usarlo bien
- revisa top ventas para reponer stock
- revisa productos lentos para promo/descatalogar
- detecta horas fuertes para optimizar turnos`,
        ],
        imagen: "/ayuda/shop/reportes.png",
      },

      {
        id: "configuracion-impresion-shop",
        titulo: "Configurar impresión: tickets, cajón y servidor",
        descripcion:
          "Ajusta impresoras, doble copia, apertura de cajón y formato del ticket.",
        contenido: [
          `En Shop, la impresión suele ser crítica para vender rápido.

---

## 🔹 1) Ticket de venta
Configura:
- encabezado fiscal
- pie del ticket
- mostrar IVA / desglose
- logo (si aplica)

---

## 🔹 2) Cajón portamonedas
Si tienes cajón:
- apertura automática al cobrar en efectivo
- test de apertura (según tu UI)

---

## 🔹 3) Servidor de impresión (si usas distribución)
Si imprimes desde un equipo local:
- defines la URL del servidor
- defines impresora por nombre

---

## 🔹 4) Doble copia
Ideal si quieres:
- copia para cliente
- copia interna

---

## 🔹 Consejo
Haz un test de impresión antes de abrir al público.`,
        ],
        imagen: "/ayuda/shop/impresion.png",
      },
    ],
  },

  facturacion: {
    titulo: "Facturación • VeriFactu",
    articulos: [
      {
        id: "facturacion-shop",
        titulo: "Facturación encadenada y VeriFactu",
        descripcion:
          "Cómo funciona la facturación encadenada, las facturas de consumidor final y las nominativas.",
        contenido: [
          `Alef Shop incluye **facturación encadenada** compatible con **VeriFactu**.

---

## 🔹 1) Facturas encadenadas

Cada factura lleva un **hash** encadenado con la anterior, garantizando integridad fiscal.

---

## 🔹 2) Tipos de factura

- **Consumidor final**: sin datos de cliente (la mayoría de ventas).
- **Nominativa**: con nombre y NIF del cliente (cuando lo solicita).

Puedes filtrar por tipo en la página de Facturas.

---

## 🔹 3) Rectificación y anulación

- **Rectificar**: genera una factura rectificativa encadenada (R1–R5).
- **Anular**: genera un registro de anulación. No se puede deshacer.

---

## 🔹 4) Exportación

Exporta facturas en **CSV** o **PDF** con los filtros que necesites (año, fechas, estado, tipo).

---

## 🔹 5) Configuración fiscal

Desde **Configuración → Tienda**, rellena CIF/NIF, razón social y dirección fiscal.`,
        ],
      },
    ],
  },
};
