"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Variables globales
  let vehiclesData = [];
  let cart = [];
  let favorites = [];
  let userName = null;

  let selectedVehicle = null;
  let currentGalleryIndex = 0;

  // Selectores
  const productsContainer = document.getElementById("productsContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const searchInput = document.getElementById("searchInput");
  const cartCount = document.getElementById("cartCount");
  const cartItemsContainer = document.getElementById("cartItems");
  const cartTotalSpan = document.getElementById("cartTotal");
  const filterCategoria = document.getElementById("filterCategoria");
  const filterMarca = document.getElementById("filterMarca");
  const filterTipo = document.getElementById("filterTipo");
  const favoritesContainer = document.getElementById("favoritesContainer");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Modales bootstrap
  const quantityModalEl = document.getElementById("quantityModal");
  const quantityModal = new bootstrap.Modal(quantityModalEl);
  const addToCartBtn = document.getElementById("addToCartBtn");
  const quantityInput = document.getElementById("quantityInput");

  const cartModalEl = document.getElementById("cartModal");
  const cartModal = new bootstrap.Modal(cartModalEl);

  const paymentModalEl = document.getElementById("paymentModal");
  const paymentModal = new bootstrap.Modal(paymentModalEl);
  const paymentForm = document.getElementById("paymentForm");

  const vehicleDetailModalEl = document.getElementById("vehicleDetailModal");
  const vehicleDetailModal = new bootstrap.Modal(vehicleDetailModalEl);
  const galleryContainer = document.getElementById("gallery");
  const vehicleDetailList = document.getElementById("vehicleDetailList");
  const detailAddToCartBtn = document.getElementById("detailAddToCartBtn");

  // Contacto form
  const contactForm = document.getElementById("contactForm");

  // Mapa
  let map;

  // Cargar vehículos JSON
  async function loadVehicles() {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json"
      );
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      vehiclesData = await res.json();
      fillFilterOptions();
      displayVehicles(vehiclesData);
    } catch (e) {
      productsContainer.innerHTML = `<p class="text-danger text-center">Error cargando vehículos: ${e.message}</p>`;
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  // Llenar selects con valores únicos
  function fillFilterOptions() {
    const categorias = [...new Set(vehiclesData.map(v => v.categoria))].sort();
    const marcas = [...new Set(vehiclesData.map(v => v.marca))].sort();
    const tiposRaw = vehiclesData.map(v => v.tipo);
    const tiposClean = tiposRaw.map(t => t.replace(/([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu, "").trim());
    const tipos = [...new Set(tiposClean)].sort();

    categorias.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat; opt.textContent = cat;
      filterCategoria.appendChild(opt);
    });
    marcas.forEach(marca => {
      const opt = document.createElement("option");
      opt.value = marca; opt.textContent = marca;
      filterMarca.appendChild(opt);
    });
    tipos.forEach(tipo => {
      const opt = document.createElement("option");
      opt.value = tipo; opt.textContent = tipo;
      filterTipo.appendChild(opt);
    });
  }

  // Mostrar vehículos filtrados
  function displayVehicles(vehiclesArray) {
    productsContainer.innerHTML = "";
    if (vehiclesArray.length === 0) {
      productsContainer.innerHTML = "<p class='text-center text-muted'>No hay vehículos que coincidan con el filtro.</p>";
      return;
    }
    vehiclesArray.forEach(vehicle => {
      const tipoSinEmojis = vehicle.tipo.replace(/([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu,"").trim();
      const divCol = document.createElement('div');
      divCol.className = "col-md-4 col-sm-6 mb-4";

      divCol.innerHTML = `
        <div class="card h-100" tabindex="0" aria-label="Vehículo ${vehicle.marca} ${vehicle.modelo}">
          <img class="card-img-top" src="${vehicle.imagen}" alt="Foto de ${vehicle.marca} ${vehicle.modelo}" loading="lazy" />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
            <p class="card-text category"><strong>Categoría:</strong> ${vehicle.categoria}</p>
            <p class="card-text type"><strong>Tipo:</strong> ${tipoSinEmojis}</p>
            <p class="card-text price text-primary">$${vehicle.precio_venta.toLocaleString("es-ES")}</p>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-info viewDetailsBtn flex-grow-1" data-codigo="${vehicle.codigo}">Detalle</button>
              <button class="btn btn-primary addToCartBtn flex-grow-1" data-codigo="${vehicle.codigo}">Añadir</button>
              <button class="btn btn-outline-danger favoriteBtn" data-codigo="${vehicle.codigo}" aria-label="Añadir a favoritos"><i class="fa-regular fa-heart"></i></button>
            </div>
          </div>
        </div>
      `;
      productsContainer.appendChild(divCol);
    });
    attachCardsListeners();
  }

  // Adjuntar eventos a botones de tarjetas
  function attachCardsListeners() {
    document.querySelectorAll(".addToCartBtn").forEach(btn=>{
      btn.onclick = e=>{
        const codigo= parseInt(e.target.dataset.codigo);
        selectedVehicle = vehiclesData.find(v => v.codigo === codigo);
        if(selectedVehicle) showQuantityModal(selectedVehicle);
      }
    });
    document.querySelectorAll(".viewDetailsBtn").forEach(btn=>{
      btn.onclick = e=>{
        const codigo= parseInt(e.target.dataset.codigo);
        const vehicle = vehiclesData.find(v => v.codigo === codigo);
        if(vehicle) showVehicleDetailModal(vehicle);
      }
    });
    document.querySelectorAll(".favoriteBtn").forEach(btn=>{
      btn.onclick = e=>{
        const codigo= parseInt(e.target.dataset.codigo);
        toggleFavorite(codigo);
      }
    });
  }

  // Filtros
  function filterVehicles() {
    let filtered = [...vehiclesData];
    const searchText = searchInput.value.trim().toLowerCase();
    const cat = filterCategoria.value;
    const marca = filterMarca.value;
    const tipo = filterTipo.value;

    if(searchText){
      filtered = filtered.filter(v => (v.marca+" "+v.modelo+" "+v.categoria).toLowerCase().includes(searchText));
    }
    if(cat) filtered = filtered.filter(v => v.categoria === cat);
    if(marca) filtered = filtered.filter(v => v.marca === marca);
    if(tipo) filtered = filtered.filter(v => v.tipo.replace(/([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu,"").trim() === tipo);

    displayVehicles(filtered);
  }

  // Modal Cantidad
  function showQuantityModal(vehicle){
    quantityInput.value = 1;
    quantityModal.show();
    addToCartBtn.onclick = () => {
      const qty = parseInt(quantityInput.value);
      if(qty > 0){
        addItemToCart(vehicle, qty);
        quantityModal.hide();
      } else {
        quantityInput.focus();
      }
    };
  }

  // Carrito
  function addItemToCart(vehicle, qty){
    const item = cart.find(i => i.codigo === vehicle.codigo);
    if(item){
      item.quantity += qty;
    } else {
      cart.push({
        codigo: vehicle.codigo,
        imagen: vehicle.imagen,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        precio: vehicle.precio_venta,
        quantity: qty
      });
    }
    updateCartUI();
  }

  function updateCartUI(){
    cartItemsContainer.innerHTML = "";
    if(cart.length===0){
      cartItemsContainer.innerHTML = "<p>El carrito está vacío.</p>";
      cartTotalSpan.textContent = "0";
      cartCount.textContent = "0";
      return;
    }
    let total = 0;
    cart.forEach(item => {
      const sub = item.precio * item.quantity;
      total += sub;
      const p = document.createElement("p");
      p.className = "d-flex align-items-center gap-3 border rounded p-2 mb-2";
      p.innerHTML = `<img src="${item.imagen}" alt="Auto ${item.marca} ${item.modelo}" width="60" height="40" style="object-fit: cover;" />
      <span><strong>${item.marca} ${item.modelo}</strong></span>
      <span>Cantidad: ${item.quantity}</span>
      <span>Subtotal: $${sub.toLocaleString("es-ES")}</span>`;
      cartItemsContainer.appendChild(p);
    });
    cartTotalSpan.textContent = total.toLocaleString("es-ES");
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    cartCount.textContent = totalItems;
  }

  // Modal detalle vehículo con galería
  function showVehicleDetailModal(vehicle){
    selectedVehicle = vehicle;
    galleryContainer.innerHTML = "";
    // Suponemos vehicle.imagenes es un array, si no está se simula con vehicle.imagen
    const images = vehicle.imagenes || [vehicle.imagen];

    images.forEach((imgSrc, idx) => {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = `Imagen ${idx+1} de ${vehicle.marca} ${vehicle.modelo}`;
      if(idx === 0) img.classList.add("selected");
      img.onclick = () => {
        document.querySelectorAll("#gallery img").forEach(i=>i.classList.remove("selected"));
        img.classList.add("selected");
      };
      galleryContainer.appendChild(img);
    });

    vehicleDetailList.innerHTML = `
      <li class="list-group-item"><strong>Marca:</strong> ${vehicle.marca}</li>
      <li class="list-group-item"><strong>Modelo:</strong> ${vehicle.modelo}</li>
      <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
      <li class="list-group-item"><strong>Tipo:</strong> ${vehicle.tipo.replace(/([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu,"").trim()}</li>
      <li class="list-group-item"><strong>Precio:</strong> $${vehicle.precio_venta.toLocaleString("es-ES")}</li>
    `;

    detailAddToCartBtn.onclick = () => {
      vehicleDetailModal.hide();
      showQuantityModal(vehicle);
    };

    vehicleDetailModal.show();
  }

  // Proceso de pago
  document.getElementById("checkoutBtn").onclick = () => {
    if(cart.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    cartModal.hide();
    paymentModal.show();
  };

  paymentForm.addEventListener("submit", e => {
    e.preventDefault();
    if(!paymentForm.checkValidity()){
      paymentForm.classList.add("was-validated");
      return;
    }
    alert("Pago realizado con éxito. Se generará la factura.");
    generateInvoice();
    cart = [];
    updateCartUI();
    paymentModal.hide();
  });

  function generateInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const date = new Date().toLocaleString("es-ES");
    const clientName = document.getElementById("customerName").value || "Cliente";

    doc.setFontSize(16);
    doc.text("Factura GarageOnline", 14, 20);
    doc.setFontSize(12);
    doc.text(`Cliente: ${clientName}`, 14, 30);
    doc.text(`Fecha: ${date}`, 14, 38);
    doc.text("Detalles de compra:", 14, 48);

    let y = 56;
    let total = 0;
    cart.forEach((item, idx) => {
      const subtotal = item.precio * item.quantity;
      total += subtotal;
      doc.text(
        `${idx+1}. ${item.marca} ${item.modelo} x${item.quantity} = $${subtotal.toLocaleString("es-ES")}`,
        14,
        y
      );
      y += 8;
      if(y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.text(`Total: $${total.toLocaleString("es-ES")}`, 14, y + 10);
    doc.save(`Factura_GarageOnline_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // Perfil usuario y favoritos

  function loadUser() {
    const savedUser = localStorage.getItem("garageonline_user");
    if (savedUser) {
      userName = savedUser;
      userNameDisplay.textContent = userName;
      loginBtn.classList.add("d-none");
      logoutBtn.classList.remove("d-none");
      loadFavorites();
    }
  }

  loginBtn.onclick = () => {
    const name = prompt("Ingrese su nombre de usuario:");
    if(name && name.trim() !== "") {
      userName = name.trim();
      localStorage.setItem("garageonline_user", userName);
      userNameDisplay.textContent = userName;
      loginBtn.classList.add("d-none");
      logoutBtn.classList.remove("d-none");
      loadFavorites();
    }
  };

  logoutBtn.onclick = () => {
    userName = null;
    localStorage.removeItem("garageonline_user");
    userNameDisplay.textContent = "Invitado";
    favorites = [];
    renderFavorites();
    loginBtn.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
  };

  // Manejo favoritos
  function toggleFavorite(codigo) {
    if (!userName) {
      alert("Inicie sesión para usar favoritos.");
      return;
    }
    const index = favorites.indexOf(codigo);
    if(index === -1) {
      favorites.push(codigo);
    } else {
      favorites.splice(index, 1);
    }
    saveFavorites();
    renderFavorites();
    updateFavoriteButtons();
  }

  function saveFavorites() {
    localStorage.setItem(`garageonline_favorites_${userName}`, JSON.stringify(favorites));
  }

  function loadFavorites() {
    const favs = localStorage.getItem(`garageonline_favorites_${userName}`);
    favorites = favs ? JSON.parse(favs) : [];
    renderFavorites();
    updateFavoriteButtons();
  }

  function renderFavorites() {
    favoritesContainer.innerHTML = "";
    if(favorites.length===0) {
      favoritesContainer.innerHTML = "<p>No hay vehículos favoritos.</p>";
      return;
    }
    favorites.forEach(codigo => {
      const vehicle = vehiclesData.find(v => v.codigo === codigo);
      if(vehicle){
        const tipoSinEmojis = vehicle.tipo.replace(/([\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/gu,"").trim();
        const div = document.createElement("div");
        div.className = "col-md-4 col-sm-6 mb-3";
        div.innerHTML = `
          <div class="card shadow-sm">
            <img src="${vehicle.imagen}" alt="Foto de ${vehicle.marca} ${vehicle.modelo}" class="card-img-top" />
            <div class="card-body">
              <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
              <p class="card-text category"><strong>Categoría:</strong> ${vehicle.categoria}</p>
              <p class="card-text type"><strong>Tipo:</strong> ${tipoSinEmojis}</p>
              <p class="card-text price text-primary">$${vehicle.precio_venta.toLocaleString("es-ES")}</p>
              <button class="btn btn-primary addToCartBtn w-100" data-codigo="${vehicle.codigo}">Añadir al carrito</button>
            </div>
          </div>`;
        favoritesContainer.appendChild(div);
      }
    });
    favoritesContainer.querySelectorAll(".addToCartBtn").forEach(btn=>{
      btn.onclick = e=>{
        const codigo= parseInt(e.target.dataset.codigo);
        const vehicle = vehiclesData.find(v=>v.codigo === codigo);
        if(vehicle) showQuantityModal(vehicle);
      };
    });
  }

  function updateFavoriteButtons() {
    document.querySelectorAll(".favoriteBtn").forEach(btn => {
      const codigo = parseInt(btn.dataset.codigo);
      if (favorites.includes(codigo)) {
        btn.innerHTML = '<i class="fa-solid fa-heart text-danger"></i>';
      } else {
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      }
    });
  }

  // Contacto y mapa Leaflet
  contactForm.addEventListener("submit", e=>{
    e.preventDefault();
    alert("Formulario enviado, muchas gracias.");
    contactForm.reset();
  });

  function initMap(){
    map = L.map('map').setView([-34.6037, -58.3816], 13); // Buenos Aires coords
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([-34.6037, -58.3816]).addTo(map).bindPopup('GarageOnline - Oficina Central').openPopup();
  }

  // Eventos filtros y búsquedas
  searchInput.addEventListener("input", filterVehicles);
  filterCategoria.addEventListener("change", filterVehicles);
  filterMarca.addEventListener("change", filterVehicles);
  filterTipo.addEventListener("change", filterVehicles);

  // Inicialización
  loadVehicles();
  loadUser();
  initMap();
  updateCartUI();
});
