// Character data
const characters = [
  {
    id: 1,
    name: "Iron Man",
    species: "Human (Enhanced)",
    gender: "Male",
    image: "https://i.imgur.com/wUrvk9Y.jpg",
  },
  {
    id: 2,
    name: "Wonder Woman",
    species: "Amazon",
    gender: "Female",
    image: "https://i.imgur.com/rQYTrvZ.jpg",
  },
  {
    id: 3,
    name: "Groot",
    species: "Flora Colossus",
    gender: "Male",
    image: "https://i.imgur.com/Aex86g2.jpg",
  },
  {
    id: 4,
    name: "Black Widow",
    species: "Human",
    gender: "Female",
    image: "https://i.imgur.com/cVj81Ep.jpg",
  },
  {
    id: 5,
    name: "Superman",
    species: "Kryptonian",
    gender: "Male",
    image: "https://i.imgur.com/PdvLyH2.jpg",
  },
  {
    id: 6,
    name: "Captain Marvel",
    species: "Human (Enhanced)",
    gender: "Female",
    image: "https://i.imgur.com/BYUiNPh.jpg",
  },
  {
    id: 7,
    name: "Thanos",
    species: "Eternal-Deviant Hybrid",
    gender: "Male",
    image: "https://i.imgur.com/DkBXvNJ.jpg",
  },
  {
    id: 8,
    name: "Gamora",
    species: "Zen-Whoberi",
    gender: "Female",
    image: "https://i.imgur.com/7Jh9Syl.jpg",
  },
  {
    id: 9,
    name: "Hulk",
    species: "Human (Enhanced)",
    gender: "Male",
    image: "https://i.imgur.com/XnPXpWG.jpg",
  },
  {
    id: 10,
    name: "Thor",
    species: "Asgardian",
    gender: "Male",
    image: "https://i.imgur.com/ObYOA5i.jpg",
  },
  {
    id: 11,
    name: "Black Panther",
    species: "Human (Enhanced)",
    gender: "Male",
    image: "https://i.imgur.com/ckYvSNk.jpg",
  },
  {
    id: 12,
    name: "Scarlet Witch",
    species: "Human (Enhanced)",
    gender: "Female",
    image: "https://i.imgur.com/J1TGWib.jpg",
  },
];

// Function to filter characters based on search query
function filterCharacters(query) {
  if (!query) {
    return characters;
  }

  const searchTerm = query.toLowerCase();
  return characters.filter(
    (character) =>
      character.name.toLowerCase().includes(searchTerm) ||
      character.species.toLowerCase().includes(searchTerm) ||
      character.gender.toLowerCase().includes(searchTerm)
  );
}

// Function to load character gallery
function loadGallery(searchQuery = "") {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = ""; // Clear existing content

  const filteredCharacters = filterCharacters(searchQuery);

  if (filteredCharacters.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = "No characters found matching your search.";
    gallery.appendChild(noResults);
    return;
  }

  filteredCharacters.forEach((character) => {
    const characterElement = document.createElement("div");
    characterElement.className = "character";
    characterElement.dataset.id = character.id;

    characterElement.innerHTML = `
        <img src="${character.image}" alt="${character.name}">
        <div class="character-name">${character.name}</div>
    `;

    characterElement.addEventListener("click", () =>
      showCharacterDetails(character)
    );

    gallery.appendChild(characterElement);
  });
}

// Function to show character details
function showCharacterDetails(character) {
  const modal = document.getElementById("characterModal");
  const details = document.getElementById("characterDetails");

  details.innerHTML = `
      <h2>${character.name}</h2>
      <p><span class="detail-label">Species:</span> ${character.species}</p>
      <p><span class="detail-label">Gender:</span> ${character.gender}</p>
  `;

  modal.style.display = "flex";
}

// Initialize the page
function initPage() {
  // Load gallery when page loads
  loadGallery();

  // Setup search functionality
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      loadGallery(event.target.value);
    });
  }

  // Close modal when clicking the close button
  const closeModal = document.getElementById("closeModal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      document.getElementById("characterModal").style.display = "none";
    });
  }

  // Close modal when clicking outside the content
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("characterModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initPage);
