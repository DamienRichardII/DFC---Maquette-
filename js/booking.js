/* ===================================================
   DFC — Calendrier de réservation (page Contact)
   Fichier additif et indépendant de js/app.js et js/shop.js.
   Aucun backend : sélection date + créneau -> message WhatsApp pré-rempli.
=================================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '33600000000'; // à remplacer par le vrai numéro avant mise en ligne

  // Créneaux proposés — à ajuster selon les horaires réels de la boutique.
  var TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  var MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MONTH_NAMES_LOWER = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  var state = {
    viewYear: null,
    viewMonth: null,
    selectedDate: null,
    selectedTime: null
  };

  document.addEventListener('DOMContentLoaded', function () {
    var daysWrap = document.getElementById('bookingDays');
    if (!daysWrap) return; // widget absent de cette page : on ne fait rien

    var today = new Date();
    state.viewYear = today.getFullYear();
    state.viewMonth = today.getMonth();

    renderCalendar();
    renderTimes();
    updateConfirmState();

    var prevBtn = document.getElementById('bookingPrev');
    var nextBtn = document.getElementById('bookingNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { changeMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { changeMonth(1); });

    var confirmBtn = document.getElementById('bookingConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function (e) {
        if (confirmBtn.getAttribute('aria-disabled') === 'true') e.preventDefault();
      });
    }
  });

  function changeMonth(delta) {
    state.viewMonth += delta;
    if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear -= 1; }
    if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear += 1; }
    renderCalendar();
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function renderCalendar() {
    var label = document.getElementById('bookingMonthLabel');
    if (label) label.textContent = MONTH_NAMES[state.viewMonth] + ' ' + state.viewYear;

    var daysWrap = document.getElementById('bookingDays');
    if (!daysWrap) return;
    daysWrap.innerHTML = '';

    var firstOfMonth = new Date(state.viewYear, state.viewMonth, 1);
    var startOffset = (firstOfMonth.getDay() + 6) % 7; // semaine commence le lundi
    var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    var today = startOfToday();

    for (var i = 0; i < startOffset; i++) {
      var pad = document.createElement('span');
      pad.className = 'booking__day booking__day--pad';
      daysWrap.appendChild(pad);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      (function (dayNum) {
        var cellDate = new Date(state.viewYear, state.viewMonth, dayNum);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'booking__day';
        btn.textContent = String(dayNum);

        var isPast = cellDate < today;
        var isSunday = cellDate.getDay() === 0;

        if (isPast || isSunday) {
          btn.disabled = true;
          btn.classList.add('booking__day--disabled');
        } else {
          btn.addEventListener('click', function () { selectDate(cellDate); });
        }

        if (state.selectedDate && sameDay(state.selectedDate, cellDate)) {
          btn.classList.add('is-selected');
        }

        daysWrap.appendChild(btn);
      })(d);
    }

    var prevBtn = document.getElementById('bookingPrev');
    if (prevBtn) {
      prevBtn.disabled = (state.viewYear === today.getFullYear() && state.viewMonth === today.getMonth());
    }
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function selectDate(dateObj) {
    state.selectedDate = dateObj;
    state.selectedTime = null;
    renderCalendar();
    renderTimes();
    updateConfirmState();
  }

  function renderTimes() {
    var wrap = document.getElementById('bookingTimes');
    var title = document.getElementById('bookingSelectedDate');
    if (!wrap || !title) return;

    if (!state.selectedDate) {
      wrap.innerHTML = '';
      title.textContent = 'Sélectionnez une date';
      return;
    }

    title.textContent = formatDateFr(state.selectedDate);
    wrap.innerHTML = '';

    TIME_SLOTS.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking__time' + (state.selectedTime === t ? ' is-selected' : '');
      btn.textContent = t;
      btn.addEventListener('click', function () {
        state.selectedTime = t;
        renderTimes();
        updateConfirmState();
      });
      wrap.appendChild(btn);
    });
  }

  function formatDateFr(d) {
    return DAY_NAMES_FR[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_NAMES_LOWER[d.getMonth()] + ' ' + d.getFullYear();
  }

  function updateConfirmState() {
    var confirmBtn = document.getElementById('bookingConfirm');
    if (!confirmBtn) return;

    if (state.selectedDate && state.selectedTime) {
      var msg = 'Bonjour, je souhaite prendre rendez-vous le ' + formatDateFr(state.selectedDate) +
        ' à ' + state.selectedTime + '. Merci de me confirmer la disponibilité !';
      confirmBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      confirmBtn.classList.add('is-active');
      confirmBtn.setAttribute('aria-disabled', 'false');
    } else {
      confirmBtn.href = '#';
      confirmBtn.classList.remove('is-active');
      confirmBtn.setAttribute('aria-disabled', 'true');
    }
  }

})();
