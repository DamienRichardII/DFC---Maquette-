/* ===================================================
   DFC — Boutique
   Consomme assets/data/products.js (DFC_PRODUCTS / DFC_CATEGORIES).
   Fichier additif et indépendant de js/app.js (aucune modification de app.js).
=================================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '33600000000'; // à remplacer par le vrai numéro avant mise en ligne
  var CART_KEY = 'dfc_cart_v1';

  var CATEGORY_INTROS = {
    'accessoires': {
      title: 'Bijoux',
      text: 'Découvrez une sélection de bijoux inspirés de l’Afrique, de ses matières, de ses traditions et de ses savoir-faire. Chaque pièce est choisie pour son caractère, son authenticité et son élégance, avec ce mélange subtil entre héritage et modernité. Des bijoux pensés pour sublimer chaque style et apporter une touche unique à chaque tenue.'
    },
    'maison-decoration': {
      title: 'Décoration',
      text: 'Découvrez un univers de décoration inspiré de l’Afrique et de ses richesses artisanales. Des pièces ethniques, chaleureuses et pleines de caractère, choisies pour apporter une touche d’authenticité, d’élégance et d’ailleurs à votre intérieur.'
    },
    'secrets-de-femme': {
      title: 'Secrets de femmes',
      text: 'Entrez dans un univers inspiré des secrets de femmes ancestraux, transmis de génération en génération par nos mères et nos grand-mères. Des traditions, des rituels et des produits naturels puisés dans des savoir-faire d’autrefois, pour prendre soin de soi, de sa féminité et de son bien-être, tout simplement et au naturel.'
    }
  };

  var state = {
    activeCategory: 'all',
    cart: loadCart(),
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof DFC_PRODUCTS === 'undefined') return; // sécurité si data non chargée

    renderFilters();
    renderGrid();
    initModal();
    initCart();
    updateCartBadge();

    var hash = (window.location.hash || '').replace('#', '');
    if (hash) setActiveCategory(hash, false);

    window.addEventListener('hashchange', function () {
      var h = (window.location.hash || '').replace('#', '') || 'all';
      setActiveCategory(h, false);
    });
  });

  /* ---------------- Panier : persistance ---------------- */
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) {}
  }

  /* ---------------- Filtres catégories ---------------- */
  function renderFilters() {
    var wrap = document.getElementById('shopFilters');
    if (!wrap) return;

    var totalCount = DFC_PRODUCTS.length;
    var tabs = ['<button class="shop-filters__tab is-active" data-cat="all">Tous les produits <span class="count">(' + totalCount + ')</span></button>'];

    DFC_CATEGORIES.forEach(function (c) {
      tabs.push(
        '<button class="shop-filters__tab" data-cat="' + c.slug + '">' +
        escapeHtml(c.name) + ' <span class="count">(' + c.productCount + ')</span></button>'
      );
    });
    wrap.innerHTML = tabs.join('');

    wrap.querySelectorAll('.shop-filters__tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.cat;
        window.location.hash = cat === 'all' ? '' : cat;
        setActiveCategory(cat, true);
      });
    });
  }

  function setActiveCategory(cat, fromClick) {
    var valid = cat === 'all' || DFC_CATEGORIES.some(function (c) { return c.slug === cat; });
    state.activeCategory = valid ? cat : 'all';

    document.querySelectorAll('.shop-filters__tab').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.cat === state.activeCategory);
    });
    renderCategoryIntro();
    renderGrid();
  }

  /* ---------------- Intro éditoriale par catégorie ---------------- */
  function renderCategoryIntro() {
    var wrap = document.getElementById('shopCategoryIntro');
    if (!wrap) return;
    var intro = CATEGORY_INTROS[state.activeCategory];
    if (!intro) {
      wrap.innerHTML = '';
      return;
    }
    wrap.innerHTML = '<h2>' + escapeHtml(intro.title) + '</h2><p>' + escapeHtml(intro.text) + '</p>';
  }

  /* ---------------- Grille produits ---------------- */
  function renderGrid() {
    var grid = document.getElementById('shopGrid');
    if (!grid) return;

    var products = state.activeCategory === 'all'
      ? DFC_PRODUCTS
      : DFC_PRODUCTS.filter(function (p) { return p.category.slug === state.activeCategory; });

    if (!products.length) {
      var catInfo = DFC_CATEGORIES.find(function (c) { return c.slug === state.activeCategory; });
      grid.innerHTML =
        '<div class="shop-empty">' +
        '<h3>' + escapeHtml(catInfo ? catInfo.name : 'Cette catégorie') + ' — bientôt disponible</h3>' +
        '<p>Aucun produit n\'est actuellement publié dans cette catégorie sur notre catalogue. ' +
        'De nouvelles pièces arrivent prochainement — contactez-nous sur WhatsApp pour être informée en priorité.</p>' +
        '</div>';
      return;
    }

    grid.innerHTML = products.map(cardTemplate).join('');

    grid.querySelectorAll('[data-open-product]').forEach(function (el) {
      el.addEventListener('click', function () {
        openModal(el.getAttribute('data-open-product'));
      });
    });
    grid.querySelectorAll('[data-add-cart]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        addToCart(el.getAttribute('data-add-cart'));
      });
    });

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      grid.querySelectorAll('.product-card').forEach(function (c) { obs.observe(c); });
    } else {
      grid.querySelectorAll('.product-card').forEach(function (c) { c.classList.add('is-visible'); });
    }
  }

  function cardTemplate(p) {
    var outOfStock = p.stockStatus === 'out_of_stock';
    var img = p.images.main || 'assets/logo/dieynissa-google-thumbnail.png';
    return (
      '<article class="product-card">' +
        '<div class="product-card__media" data-open-product="' + p.id + '">' +
          (outOfStock ? '<span class="product-card__badge product-card__badge--out">Indisponible</span>' : '') +
          '<img src="' + img + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="product-card__body">' +
          '<span class="product-card__cat">' + escapeHtml(p.category.name) + '</span>' +
          '<h3 class="product-card__name" data-open-product="' + p.id + '">' + escapeHtml(p.name) + '</h3>' +
          '<div class="product-card__price">' + formatPrice(p) + '</div>' +
          '<div class="product-card__actions">' +
            (outOfStock
              ? '<button class="btn btn--outline-dark" disabled>Indisponible</button>'
              : '<button class="btn btn--outline-dark" data-add-cart="' + p.id + '">Ajouter</button>' +
                '<button class="btn btn--gold" data-open-product="' + p.id + '">Voir</button>') +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function formatPrice(p) {
    if (p.price == null) return 'Prix sur demande';
    var txt = p.price.toFixed(2).replace('.', ',') + ' €';
    if (p.onSale && p.regularPrice && p.regularPrice > p.price) {
      txt = '<span class="old">' + p.regularPrice.toFixed(2).replace('.', ',') + ' €</span>' + txt;
    }
    return txt;
  }

  /* ---------------- Modal fiche produit ---------------- */
  function initModal() {
    var modal = document.getElementById('productModal');
    if (!modal) return;
    modal.querySelector('.product-modal__close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(id) {
    var p = DFC_PRODUCTS.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var modal = document.getElementById('productModal');
    if (!modal) return;

    var outOfStock = p.stockStatus === 'out_of_stock';
    modal.querySelector('.product-modal__media img').src = p.images.main || 'assets/logo/dieynissa-google-thumbnail.png';
    modal.querySelector('.product-modal__media img').alt = p.name;
    modal.querySelector('.product-modal__cat').textContent = p.category.name;
    modal.querySelector('.product-modal__name').textContent = p.name;
    modal.querySelector('.product-modal__price').innerHTML = formatPrice(p);
    modal.querySelector('.product-modal__desc').textContent = p.description || p.shortDescription || '';
    var stockEl = modal.querySelector('.product-modal__stock');
    stockEl.textContent = outOfStock ? 'Actuellement indisponible' : 'En stock';
    stockEl.className = 'product-modal__stock ' + (outOfStock ? 'out' : 'in');

    var actions = modal.querySelector('.product-modal__actions');
    actions.innerHTML = outOfStock
      ? '<button class="btn btn--outline-dark" disabled>Indisponible</button>'
      : '<button class="btn btn--outline-dark" id="modalAddCart">Ajouter au panier</button>' +
        '<a class="btn btn--gold" target="_blank" rel="noopener" href="' + whatsappLink(p) + '">Commander sur WhatsApp</a>';

    if (!outOfStock) {
      document.getElementById('modalAddCart').addEventListener('click', function () { addToCart(p.id); });
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function whatsappLink(p) {
    var msg = 'Bonjour, je souhaite commander : ' + p.name + ' (' + (p.price != null ? p.price.toFixed(2).replace('.', ',') + ' €' : 'prix sur demande') + '). Merci !';
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  /* ---------------- Panier ---------------- */
  function addToCart(id) {
    var p = DFC_PRODUCTS.find(function (x) { return String(x.id) === String(id); });
    if (!p || p.stockStatus === 'out_of_stock') return;
    var line = state.cart.find(function (l) { return String(l.id) === String(id); });
    if (line) line.qty += 1;
    else state.cart.push({ id: p.id, qty: 1 });
    saveCart();
    updateCartBadge();
    renderCart();
    openCart();
  }

  function updateCartBadge() {
    var badge = document.getElementById('cartCount');
    if (!badge) return;
    var total = state.cart.reduce(function (s, l) { return s + l.qty; }, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }

  function initCart() {
    var fab = document.getElementById('cartFab');
    var drawer = document.getElementById('cartDrawer');
    if (!fab || !drawer) return;

    fab.addEventListener('click', openCart);
    drawer.querySelector('.cart-drawer__overlay').addEventListener('click', closeCart);
    drawer.querySelector('.cart-drawer__close').addEventListener('click', closeCart);

    renderCart();
  }

  function openCart() {
    var drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
  }
  function closeCart() {
    var drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
  }

  function renderCart() {
    var itemsWrap = document.getElementById('cartItems');
    var footer = document.getElementById('cartFooter');
    if (!itemsWrap) return;

    if (!state.cart.length) {
      itemsWrap.innerHTML = '<div class="cart-drawer__empty">Votre panier est vide.</div>';
      if (footer) footer.style.display = 'none';
      return;
    }

    var total = 0;
    itemsWrap.innerHTML = state.cart.map(function (line) {
      var p = DFC_PRODUCTS.find(function (x) { return String(x.id) === String(line.id); });
      if (!p) return '';
      var lineTotal = (p.price || 0) * line.qty;
      total += lineTotal;
      return (
        '<div class="cart-item">' +
          '<img src="' + (p.images.main || 'assets/logo/dieynissa-google-thumbnail.png') + '" alt="' + escapeHtml(p.name) + '">' +
          '<div class="cart-item__info">' +
            '<div class="cart-item__name">' + escapeHtml(p.name) + '</div>' +
            '<div class="cart-item__price">' + (p.price != null ? p.price.toFixed(2).replace('.', ',') + ' € x ' + line.qty : '') + '</div>' +
            '<div class="cart-item__qty">' +
              '<button data-qty="-1" data-id="' + p.id + '">−</button>' +
              '<span>' + line.qty + '</span>' +
              '<button data-qty="1" data-id="' + p.id + '">+</button>' +
            '</div>' +
            '<span class="cart-item__remove" data-remove="' + p.id + '">Retirer</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    itemsWrap.querySelectorAll('[data-qty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeQty(btn.dataset.id, parseInt(btn.dataset.qty, 10));
      });
    });
    itemsWrap.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeFromCart(btn.dataset.remove); });
    });

    if (footer) {
      footer.style.display = 'block';
      footer.querySelector('.cart-drawer__total-value').textContent = total.toFixed(2).replace('.', ',') + ' €';
      footer.querySelector('.cart-drawer__whatsapp').href = buildCartWhatsappLink(total);
    }
  }

  function changeQty(id, delta) {
    var line = state.cart.find(function (l) { return String(l.id) === String(id); });
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) state.cart = state.cart.filter(function (l) { return l !== line; });
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(function (l) { return String(l.id) !== String(id); });
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function buildCartWhatsappLink(total) {
    var lines = state.cart.map(function (line) {
      var p = DFC_PRODUCTS.find(function (x) { return String(x.id) === String(line.id); });
      if (!p) return '';
      return line.qty + 'x ' + p.name + (p.price != null ? ' (' + p.price.toFixed(2).replace('.', ',') + ' €)' : '');
    }).filter(Boolean);
    var msg = 'Bonjour, je souhaite commander :\n' + lines.join('\n') +
      '\nTotal estimé : ' + total.toFixed(2).replace('.', ',') + ' €\nMerci !';
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  /* ---------------- Utils ---------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

})();
