const formulario = document.getElementById('form-reporte');
const lugar = document.getElementById('lugar');
const descripcion = document.getElementById('descripcion');
const botonTema = document.getElementById('boton-tema');

const contenedorCasos = document.getElementById('contenedor-casos');
const busqueda = document.getElementById('busqueda');
const filtroAutoridad = document.getElementById('filtro-autoridad');

let casos = JSON.parse(localStorage.getItem('casos')) || [];

botonTema.addEventListener('click', function (){
  console.log('Se hizo click en el boton de tema');
  alert("Vamos a cambiar a modo oscuro")
})

if (lugar) {

    lugar.addEventListener('input', function () {

        if (lugar.validity.tooShort) {

            lugar.setCustomValidity(
                'El lugar debe tener al menos 3 caracteres.'
            );

        } else if (lugar.validity.patternMismatch) {

            lugar.setCustomValidity(
                'El lugar solo puede contener letras, números y espacios.'
            );

        } else {

            lugar.setCustomValidity('');
        }
    });
}

if (descripcion) {

    descripcion.addEventListener('input', function () {

        if (descripcion.validity.tooShort) {

            descripcion.setCustomValidity(
                'La descripción debe tener al menos 10 caracteres.'
            );

        } else {

            descripcion.setCustomValidity('');
        }
    });
}


function crearTarjetaCaso(caso) {

    const tarjeta = document.createElement('article');

    tarjeta.className = 'tarjeta-caso';

    tarjeta.innerHTML = `
        <h3>${caso.lugar}</h3>

        <p class="meta">
            ${caso.fecha} · ${caso.autoridad}
        </p>

        <p>
            ${caso.descripcion}
        </p>
    `;
    return tarjeta;
}
function actualizarContador() {

  const contador = 

document.getElementById('contador-casos');

    if (contador) {

        contador.textContent =
            `Casos registrados: ${casos.length}`;

    }
}
function renderizarCasos(listaCasos = casos) {

    if (!contenedorCasos) {
        return;
    }

    contenedorCasos.innerHTML = '';

    if (listaCasos.length === 0) {

        contenedorCasos.innerHTML =
            '<p>No se encontraron casos registrados.</p>';

        return;
    }

    listaCasos.forEach(function (caso) {

        const tarjeta = crearTarjetaCaso(caso);

        contenedorCasos.appendChild(tarjeta);

    });
}


if (formulario) {

    formulario.addEventListener('submit', function (evento) {


        evento.preventDefault();

        const nuevoCaso = {

            fecha: document.getElementById('fecha').value,

            lugar: document.getElementById('lugar').value,

            descripcion: document.getElementById('descripcion').value,

            autoridad: document.getElementById('autoridad').value

        };

        casos.push(nuevoCaso);

        localStorage.setItem(
            'casos',
            JSON.stringify(casos)
        );
        formulario.reset();

        alert('El caso fue registrado correctamente.');

    });

}

function filtrarCasos() {


    if (!contenedorCasos) {
        return;
    }

    const textoBusqueda = busqueda
        ? busqueda.value.toLowerCase().trim()
        : '';

    const autoridadSeleccionada = filtroAutoridad
        ? filtroAutoridad.value
        : 'todas';


    const casosFiltrados = casos.filter(function (caso) {


        const coincideBusqueda =
            caso.lugar.toLowerCase().includes(textoBusqueda) ||
            caso.descripcion.toLowerCase().includes(textoBusqueda);


        const coincideAutoridad =
            autoridadSeleccionada === 'todas' ||
            caso.autoridad === autoridadSeleccionada;

        return coincideBusqueda && coincideAutoridad;

    });

    renderizarCasos(casosFiltrados);
}

if (busqueda) {

    busqueda.addEventListener('input', filtrarCasos);

}

if (filtroAutoridad) {

    filtroAutoridad.addEventListener('change', filtrarCasos);

}

if (contenedorCasos) {

    renderizarCasos()
    actualizarContador();

}