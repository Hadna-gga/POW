function agregarcurso() {
    let curso = document.getElementById("curso").value;
    if (curso != ""){
        let nuevocurso = document.createElement("p");
        nuevocurso.textContent = curso;
        document.getElementById("listacursos").appendChild(nuevocurso);
        document.getElementById("curso").value = "";
    }
}
function agregarlabor() {
    let labor = document.getElementById("labor").value;
    if (labor != ""){
        let nuevalabor = document.createElement("p");
        nuevalabor.textContent = labor;
        document.getElementById("listalabores").appendChild(nuevalabor);
        document.getElementById("labor").value = "";
    }
}