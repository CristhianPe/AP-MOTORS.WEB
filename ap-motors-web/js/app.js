function renderStockItems(items) {
    const grid = document.getElementById('stock-grid');
    grid.innerHTML = '';

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = "stock-card bg-brand-card border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between transition-all hover:border-brand-blue/30";
        card.setAttribute('data-category', product.category);
        card.innerHTML = `
            <div>
                <div class="relative h-48 bg-slate-950 overflow-hidden">
                    <img src="${product.img}" alt="${product.name}" class="w-full h-full object-cover">
                    <span class="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-sm text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded border border-brand-blue/20">${product.tag}</span>
                </div>
                <div class="p-5 space-y-2">
                    <h3 class="text-lg font-bold text-white leading-snug">${product.name}</h3>
                </div>
            </div>
            <div class="p-5 pt-0 flex items-center justify-between gap-4 mt-4">
                <div>
                    <span class="text-[10px] text-slate-500 block uppercase font-semibold">Precio</span>
                    <span class="text-lg font-montserrat font-black text-white">S/ ${product.price.toFixed(2)}</span>
                </div>
                <button onclick="addToCart(${product.id})" class="px-3.5 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
                    <i class="fa-solid fa-cart-plus"></i> Añadir
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterStock(category) {
    if (category === 'todos') {
        renderStockItems(STOCK_DB);
    } else {
        const filtered = STOCK_DB.filter(p => p.category === category);
        renderStockItems(filtered);
    }
}

// Inicialización de Event Listeners globales
document.addEventListener('DOMContentLoaded', () => {
    renderStockItems(STOCK_DB);
    
    document.getElementById('cart-toggle-btn').addEventListener('click', toggleCartDrawer);
    document.getElementById('cart-close-btn').addEventListener('click', toggleCartDrawer);
    document.getElementById('checkout-btn').addEventListener('click', checkoutToWhatsApp);
});