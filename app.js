// Datos de personajes de ejemplo
const characters = [
  {
    id: 1,
    name: "Rick Sanchez",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
  },
  {
    id: 2,
    name: "Morty Smith",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg",
  },
  {
    id: 3,
    name: "Summer Smith",
    species: "Humano",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg",
  },
  {
    id: 4,
    name: "Beth Smith",
    species: "Humano",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/4.jpeg",
  },
  {
    id: 5,
    name: "Jerry Smith",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/5.jpeg",
  },
  {
    id: 6,
    name: "Abadango Cluster Princess",
    species: "Alien",
    gender: "Femenino",
    image: "https://rickandmortyapi.com/api/character/avatar/6.jpeg",
  },
  {
    id: 7,
    name: "Abradolf Lincler",
    species: "Humano Híbrido",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/7.jpeg",
  },
  {
    id: 8,
    name: "Adjudicator Rick",
    species: "Humano",
    gender: "Masculino",
    image: "https://rickandmortyapi.com/api/character/avatar/8.jpeg",
  },
];

// Elementos del DOM
const characterGrid = document.getElementById("character-grid");
const modal = document.getElementById("character-modal");
const modalBody = document.getElementById("modal-body");
const closeButton = document.getElementById("close-modal");

// Función para crear y mostrar las tarjetas de personajes
function displayCharacters() {
  characterGrid.innerHTML = "";

  characters.forEach((character) => {
    const card = document.createElement("div");
    card.className = "character-card";
    card.dataset.id = character.id;

    card.innerHTML = `
            <img src="${character.image}" alt="${character.name}" class="character-image">
            <div class="character-name">${character.name}</div>
        `;

    card.addEventListener("click", () => showCharacterDetails(character));
    characterGrid.appendChild(card);
  });
}

// Función para mostrar los detalles del personaje en el modal
function showCharacterDetails(character) {
  modalBody.innerHTML = `
        <div class="character-info">
            <img src="${character.image}" alt="${character.name}" class="modal-image">
            <h2>${character.name}</h2>
            <p><span class="info-label">Especie:</span> ${character.species}</p>
            <p><span class="info-label">Género:</span> ${character.gender}</p>
        </div>
    `;

  modal.style.display = "flex";
}

// Cerrar el modal
closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

// Cerrar el modal al hacer clic fuera del contenido
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Cargar los personajes cuando se cargue la página
document.addEventListener("DOMContentLoaded", displayCharacters);
