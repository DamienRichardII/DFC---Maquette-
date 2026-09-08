/* ===================================================
   DFC — Confirmation de paiement Stripe
   Récupère ?session_id= dans l'URL, demande confirmation
   au serveur (Edge Function confirm-checkout-session),
   affiche le résultat et vide le panier local si payé.
=================================================== */
(function () {
  'use strict';

  var CONFIRM_FUNCTION_URL = 'https://zcefvvupyddhddnxifln.supabase.co/functions/v1/confirm-checkout-session';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZWZ2dnVweWRkaGRkbnhpZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjU2NTEsImV4cCI6MjEwMzUwMTY1MX0.EJDwxdHIKBWjqaGrhpiYDv1lLU3kL3NOZXhkKkaPGx4';
  var CART_KEY = 'dfc_cart_v1';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var loading = document.getElementById('paymentLoading');
    var successEl = document.getElementById('paymentSuccess');
    var errorEl = document.getElementById('paymentError');
    if (!loading || !successEl || !errorEl) return;

    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');

    if (!sessionId) {
      showError(loading, successEl, errorEl, 'Aucune référence de paiement trouvée dans le lien.');
      return;
    }

    fetch(CONFIRM_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ session_id: sessionId })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok || !result.data || !result.data.paid) {
          throw new Error((result.data && result.data.error) || 'Paiement non confirmé.');
        }
        var order = result.data.order || {};
        loading.style.display = 'none';
        successEl.style.display = 'block';
        var nameEl = document.getElementById('paymentCustomerName');
        var totalEl = document.getElementById('paymentOrderTotal');
        if (nameEl) nameEl.textContent = order.customer_name || '';
        if (totalEl && order.total_amount != null) {
          totalEl.textContent = Number(order.total_amount).toFixed(2).replace('.', ',') + ' ' + (order.currency === 'EUR' ? '€' : (order.currency || ''));
        }
        try { localStorage.removeItem(CART_KEY); } catch (e) {}
      })
      .catch(function (err) {
        showError(loading, successEl, errorEl, err.message);
      });
  }

  function showError(loading, successEl, errorEl, message) {
    loading.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.style.display = 'block';
    if (message) {
      var msgEl = document.getElementById('paymentErrorMsg');
      if (msgEl) msgEl.textContent = message;
    }
  }
})();
