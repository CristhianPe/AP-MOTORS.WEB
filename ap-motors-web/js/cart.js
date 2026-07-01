let cart = [];

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

function addToCart(id) {
    const product = STOCK_DB.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge');
    const totalElement = document.getElementById('cart-total');
    
    container.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-center text-xs py-8">Tu carrito está vacío.</p>`;
        badge.classList.add('hidden');
        totalElement.innerText = "S/ 0.00";
        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        totalItems += item.quantity;

        const row = document.createElement('div');
        row.className = "bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center";
        row.innerHTML = `
            <div>
                <h4 class="text-xs font-bold text-white">${item.name}</h4>
                <p class="text-xs text-brand-blue font-semibold">S/ ${item.price.toFixed(2)}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-300">Cant: ${item.quantity}</span>
                <button onclick="removeFromCart(${item.id})" class="text-slate-500 hover:text-brand-red p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(row);
    });

    badge.classList.remove('hidden');
    badge.innerText = totalItems;
    totalElement.innerText = `S/ ${total.toFixed(2)}`;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function checkoutToWhatsApp() {
    if (cart.length === 0) return;

    const phone = "51966714622"; // Tu número asignado
    let msg = `🏍️ *NUEVO PEDIDO - AP MOTORS* 🏍️%0A%0AListado de productos agregados al carrito:%0A`;
    
    cart.forEach((item, index) => {
        let subtotal = item.price * item.quantity;
        msg += `%0A*${index + 1}.* ${encodeURIComponent(item.name)}`;
        msg += `%0A   • Cantidad: ${item.quantity}`;
        msg += `%0A   • P. Unitario: S/ ${item.price.toFixed(2)}`;
        msg += `%0A   • Subtotal: S/ ${subtotal.toFixed(2)}%0A`;
    });

    let granTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    msg += `%0A----------------------------`;
    msg += `%0A*TOTAL GENERAL DE LA ORDEN:* S/ ${granTotal.toFixed(2)}`;
    msg += `%0A----------------------------%0A%0A¿Me confirman la disponibilidad en sus sedes?`;

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}