document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el carrito desde el almacenamiento local
    let carrito = JSON.parse(localStorage.getItem('carrito-tienda')) || [];
    
    actualizarBadgeCarrito();

    if (document.getElementById('lista-productos-carrito')) {
        renderizarCarrito();
    }

    /* ==========================================================================
       CAPTURAR BOTONES "AGREGAR" EN LOS PASILLOS
       ========================================================================== */
    const botonesAgregar = document.querySelectorAll('.btn-agregar');
    botonesAgregar.forEach((boton) => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            const tarjeta = boton.closest('.tarjeta-producto');
            let nombre = "";
            let precio = 0;
            let imagenSrc = "";

            // Caso A: Atributos HTML data-* (Como en bebidas.html)
            if (boton.hasAttribute('data-nombre') && boton.hasAttribute('data-precio')) {
                nombre = boton.getAttribute('data-nombre').trim();
                precio = parseFloat(boton.getAttribute('data-precio'));
            } 
            // Caso B: Leer del texto de la tarjeta (Como en abarrotes, desayunos, etc.)
            else if (tarjeta) {
                const elementoNombre = tarjeta.querySelector('.nombre');
                const elementoPrecio = tarjeta.querySelector('.precio-actual');
                
                if (elementoNombre) nombre = elementoNombre.innerText.trim();
                if (elementoPrecio) {
                    // Extrae únicamente los números y el punto decimal del texto del precio
                    let texto = elementoPrecio.innerText;
                    let soloNumeros = texto.replace(/[^0-9.]/g, ''); 
                    precio = parseFloat(soloNumeros);
                }
            }

            // Capturar imagen
            if (tarjeta) {
                const imgElemento = tarjeta.querySelector('.producto-imagen img');
                if (imgElemento) imagenSrc = imgElemento.src;
            }

            if (nombre && !isNaN(precio) && precio > 0) {
                agregarAlCarrito(nombre, precio, imagenSrc);
            }
        });
    });

    function agregarAlCarrito(nombre, precio, imagen) {
        const itemExistente = carrito.find(item => item.nombre.toLowerCase() === nombre.toLowerCase());
        
        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({
                nombre: nombre,
                precio: precio,
                imagen: imagen,
                cantidad: 1
            });
        }
        
        guardarYActualizar();
        alert(`¡${nombre} se añadió a tu cesta!`);
    }

    /* ==========================================================================
       RENDERIZAR LISTA EN LA INTERFAZ
       ========================================================================== */
    function renderizarCarrito() {
        const mensajeVacio = document.getElementById('carrito-vacio-mensaje');
        const layoutLleno = document.getElementById('bloque-carrito-lleno-layout');
        const listaContenedor = document.getElementById('lista-productos-carrito');

        if (!listaContenedor) return;

        if (carrito.length === 0) {
            if (mensajeVacio) mensajeVacio.style.display = 'block';
            if (layoutLleno) layoutLleno.style.display = 'none';
            // Forzar visualmente los totales a 0 si está vacío
            document.getElementById('resumen-subtotal').innerText = "s/ 0.00";
            document.getElementById('resumen-total').innerText = "s/ 0.00";
            return;
        }

        if (mensajeVacio) mensajeVacio.style.display = 'none';
        if (layoutLleno) layoutLleno.style.display = 'flex';

        listaContenedor.innerHTML = '';

        carrito.forEach((item, index) => {
            const filaHTML = `
                <div class="tarjeta-producto-carrito">
                    <div class="carrito-producto-info">
                        <img src="${item.imagen || '/static/img/default.png'}" alt="${item.nombre}">
                        <div class="carrito-producto-detalles">
                            <h4>${item.nombre}</h4>
                            <span>s/ ${item.precio.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="carrito-controles">
                        <div class="carrito-selector-cantidad">
                            <button class="btn-restar" data-index="${index}">-</button>
                            <span>${item.cantidad}</span>
                            <button class="btn-sumar" data-index="${index}">+</button>
                        </div>
                        
                        <button class="btn-eliminar-carrito" data-index="${index}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            listaContenedor.innerHTML += filaHTML;
        });

        asignarEventosBotones();
        calcularTotalesCarrito();
    }

    function asignarEventosBotones() {
        // Incrementar cantidad (+)
        document.querySelectorAll('.btn-sumar').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                carrito[idx].cantidad += 1;
                guardarYActualizar();
                renderizarCarrito();
            };
        });

        // Restar cantidad (-)
        document.querySelectorAll('.btn-restar').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                if (carrito[idx].cantidad > 1) {
                    carrito[idx].cantidad -= 1;
                } else {
                    carrito.splice(idx, 1);
                }
                guardarYActualizar();
                renderizarCarrito();
            };
        });

        // Eliminar producto por completo (Tachito)
        document.querySelectorAll('.btn-eliminar-carrito').forEach(btn => {
            btn.onclick = (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                carrito.splice(idx, 1);
                guardarYActualizar();
                renderizarCarrito();
            };
        });

        const btnWhatsapp = document.querySelector('.btn-confirmar-whatsapp');
        if (btnWhatsapp) {
            btnWhatsapp.onclick = enviarPedidoWhatsApp;
        }
    }

    function guardarYActualizar() {
        localStorage.setItem('carrito-tienda', JSON.stringify(carrito));
        actualizarBadgeCarrito();
    }

    function actualizarBadgeCarrito() {
        const badge = document.getElementById('contador-items-carrito-badge');
        if (badge) {
            const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
            badge.innerText = totalItems;
        }
    }

    /* ==========================================================================
       CÁLCULO MATEMÁTICO PURO
       ========================================================================== */
    function calcularTotalesCarrito() {
        const subtotalElemento = document.getElementById('resumen-subtotal');
        const totalElemento = document.getElementById('resumen-total');

        if (!subtotalElemento || !totalElemento) return;

        // Suma basada en los objetos puros del almacenamiento, sin tocar textos de la interfaz
        let totalCalculado = 0;
        carrito.forEach(item => {
            totalCalculado += item.precio * item.cantidad;
        });
        
        subtotalElemento.innerText = `s/ ${totalCalculado.toFixed(2)}`;
        totalElemento.innerText = `s/ ${totalCalculado.toFixed(2)}`;
    }

    function enviarPedidoWhatsApp() {
        if (carrito.length === 0) return;

        const tuNumero = "51999999999"; // Tu número real de atención
        let mensaje = `🛒 *NUEVO PEDIDO - MINIMARKET DAMIR*\n\n`;
        
        carrito.forEach((item) => {
            mensaje += `▪️ *${item.cantidad}x* ${item.nombre} *(s/ ${item.precio.toFixed(2)} c/u)* → s/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
        });

        let totalFinal = 0;
        carrito.forEach(item => { totalFinal += item.precio * item.cantidad; });

        mensaje += `\n💰 *Total a pagar:* s/ ${totalFinal.toFixed(2)}\n`;
        mensaje += `🚚 *Envío:* Gratis\n\n📌 _Espero la confirmación del pedido._`;

        window.open(`https://api.whatsapp.com/send?phone=${tuNumero}&text=${encodeURIComponent(mensaje)}`, '_blank');
    }
});