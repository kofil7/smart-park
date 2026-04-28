// ============================================================
// SmartPark - Dashboard Module (User)
// ============================================================

let selectedLot = null;
let selectedSlot = null;
let bookingDuration = 1;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  initializeData();
  renderUserInfo();
  renderStats();
  renderParkingLots(getData().lots);
  initSearch();
  initBookingModal();
  initSlotModal();
  renderMyBookings();
  initNavigation();
});

function renderUserInfo() {
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-avatar').textContent = currentUser.avatar;
  const greetingEl = document.getElementById('greeting');
  const hour = new Date().getHours();
  const greet = hour < 12 ? '🌅 Good Morning' : hour < 18 ? '☀️ Good Afternoon' : '🌙 Good Evening';
  greetingEl.textContent = `${greet}, ${currentUser.name.split(' ')[0]}!`;
}

function renderStats() {
  const data = getData();
  const bookings = getBookings().filter(b => b.userId === currentUser.id);
  const totalAvailable = data.lots.reduce((sum, lot) => sum + getAvailableCount(lot), 0);
  const activeBookings = bookings.filter(b => b.status === 'active').length;

  const statsAvail = document.getElementById('stat-available');
  const statsLots = document.getElementById('stat-lots');
  const statsBookings = document.getElementById('stat-bookings');

  if (statsAvail) animateCount(statsAvail, totalAvailable);
  if (statsLots) animateCount(statsLots, data.lots.length);
  if (statsBookings) animateCount(statsBookings, activeBookings);
}

function renderParkingLots(lots) {
  const grid = document.getElementById('lots-grid');
  if (!grid) return;

  if (lots.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No parking areas found</p></div>`;
    return;
  }

  grid.innerHTML = lots.map(lot => {
    const available = getAvailableCount(lot);
    const occupancy = getOccupancyPercent(lot);
    const occClass = getOccupancyClass(occupancy);

    return `
      <div class="lot-card" data-lot-id="${lot.id}" onclick="openLotModal('${lot.id}')">
        <div class="lot-card-header">
          <div class="lot-icon">${lot.image}</div>
          <div class="lot-badge ${occClass}">${available} slots free</div>
        </div>
        <div class="lot-card-body">
          <h3 class="lot-name">${lot.name}</h3>
          <p class="lot-address">📍 ${lot.address}</p>
          <div class="lot-meta">
            <span class="lot-distance">🚗 ${lot.distance}</span>
            <span class="lot-rating">⭐ ${lot.rating}</span>
            <span class="lot-price">৳${lot.pricePerHour}/hr</span>
          </div>
          <div class="occupancy-bar-wrap">
            <div class="occupancy-bar">
              <div class="occupancy-fill ${occClass}" style="width: ${occupancy}%"></div>
            </div>
            <span class="occupancy-label">${occupancy}% full</span>
          </div>
          <div class="lot-features">
            ${lot.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
          </div>
        </div>
        <div class="lot-card-footer">
          <button class="btn btn-nav btn-sm" onclick="event.stopPropagation(); navigateToLocation(${lot.lat}, ${lot.lng}, '${lot.name}')">
            🗺️ Navigate
          </button>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openLotModal('${lot.id}')">
            View Slots
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Animate cards in
  setTimeout(() => {
    document.querySelectorAll('.lot-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('card-visible'), i * 80);
    });
  }, 50);
}

function initSearch() {
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      filterAndRender();
    }, 300));
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndRender();
    });
  });
}

function filterAndRender() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  let lots = getData().lots;

  if (query) {
    lots = lots.filter(l =>
      l.name.toLowerCase().includes(query) ||
      l.address.toLowerCase().includes(query)
    );
  }

  if (activeFilter === 'available') {
    lots = lots.filter(l => getAvailableCount(l) > 0);
  } else if (activeFilter === 'ev') {
    lots = lots.filter(l => l.features.includes('EV Charging'));
  } else if (activeFilter === 'covered') {
    lots = lots.filter(l => l.features.includes('Covered'));
  }

  renderParkingLots(lots);
}

// ---- Lot Modal (Slot Grid) ----
function openLotModal(lotId) {
  const data = getData();
  const lot = data.lots.find(l => l.id === lotId);
  if (!lot) return;
  selectedLot = lot;

  document.getElementById('modal-lot-name').textContent = lot.name;
  document.getElementById('modal-lot-address').textContent = lot.address;
  document.getElementById('modal-lot-price').textContent = `৳${lot.pricePerHour}/hr`;
  document.getElementById('modal-lot-rating').textContent = `⭐ ${lot.rating}`;

  renderSlotGrid(lot);
  document.getElementById('lot-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLotModal() {
  document.getElementById('lot-modal').classList.remove('active');
  document.body.style.overflow = '';
  selectedLot = null;
  selectedSlot = null;
}

function renderSlotGrid(lot) {
  const grid = document.getElementById('slot-grid');
  const available = getAvailableCount(lot);
  document.getElementById('slot-count-info').textContent = `${available} of ${lot.totalSlots} slots available`;

  const typeIcons = { handicap: '♿', ev: '⚡', standard: '🚗' };

  grid.innerHTML = lot.slots.map(slot => `
    <div class="slot-cell ${slot.status} ${slot.type}"
         ${slot.status === 'available' ? `onclick="selectSlot('${slot.id}')"` : ''}
         title="${slot.type.toUpperCase()} - ${slot.status}">
      <span class="slot-icon">${typeIcons[slot.type]}</span>
      <span class="slot-num">${slot.number}</span>
      ${slot.status === 'occupied' ? '<span class="slot-taken">●</span>' : ''}
    </div>
  `).join('');
}

function selectSlot(slotId) {
  if (!selectedLot) return;
  const slot = selectedLot.slots.find(s => s.id === slotId);
  if (!slot || slot.status !== 'available') return;
  selectedSlot = slot;

  // Highlight
  document.querySelectorAll('.slot-cell').forEach(c => c.classList.remove('selected'));
  const el = document.querySelector(`.slot-cell[onclick*="${slotId}"]`);
  if (el) el.classList.add('selected');

  // Open booking panel
  openBookingPanel();
}

function openBookingPanel() {
  if (!selectedSlot || !selectedLot) return;
  bookingDuration = 1;

  document.getElementById('book-slot-num').textContent = selectedSlot.number;
  document.getElementById('book-lot-name').textContent = selectedLot.name;
  document.getElementById('book-price-per-hr').textContent = selectedLot.pricePerHour;
  updateBookingTotal();

  document.getElementById('booking-panel').classList.add('active');
}

function closeBookingPanel() {
  document.getElementById('booking-panel').classList.remove('active');
  selectedSlot = null;
  document.querySelectorAll('.slot-cell').forEach(c => c.classList.remove('selected'));
}

function updateDuration(delta) {
  bookingDuration = Math.max(1, Math.min(24, bookingDuration + delta));
  document.getElementById('duration-val').textContent = bookingDuration;
  updateBookingTotal();
}

function updateBookingTotal() {
  const total = bookingDuration * selectedLot.pricePerHour;
  document.getElementById('book-total').textContent = total;
  document.getElementById('book-duration-display').textContent = bookingDuration;
}

function initBookingModal() {
  const overlay = document.getElementById('lot-modal');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLotModal();
  });
}

function initSlotModal() {
  // handled in openLotModal
}

function confirmBooking() {
  if (!selectedSlot || !selectedLot) return;

  const btn = document.getElementById('confirm-book-btn');
  btn.innerHTML = '<span class="spinner"></span> Booking...';
  btn.disabled = true;

  setTimeout(() => {
    const data = getData();
    const lotIdx = data.lots.findIndex(l => l.id === selectedLot.id);
    const slotIdx = data.lots[lotIdx].slots.findIndex(s => s.id === selectedSlot.id);

    const booking = {
      id: generateBookingId(),
      userId: currentUser.id,
      lotId: selectedLot.id,
      lotName: selectedLot.name,
      lotAddress: selectedLot.address,
      slotId: selectedSlot.id,
      slotNumber: selectedSlot.number,
      duration: bookingDuration,
      pricePerHour: selectedLot.pricePerHour,
      totalAmount: bookingDuration * selectedLot.pricePerHour,
      status: 'active',
      bookedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + bookingDuration * 3600000).toISOString(),
      lat: selectedLot.lat,
      lng: selectedLot.lng
    };

    data.lots[lotIdx].slots[slotIdx].status = 'occupied';
    data.lots[lotIdx].slots[slotIdx].booking = booking.id;

    const bookings = getBookings();
    bookings.push(booking);

    saveData(data);
    saveBookings(bookings);

    closeBookingPanel();
    closeLotModal();

    // Update UI
    renderStats();
    filterAndRender();
    renderMyBookings();

    showBookingConfirmation(booking);

    btn.innerHTML = '✅ Confirm Booking';
    btn.disabled = false;
  }, 1200);
}

function showBookingConfirmation(booking) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-booking-id').textContent = booking.id;
  document.getElementById('confirm-slot').textContent = `${booking.slotNumber} @ ${booking.lotName}`;
  document.getElementById('confirm-duration').textContent = `${booking.duration} hour(s)`;
  document.getElementById('confirm-amount').textContent = `৳${booking.totalAmount}`;
  document.getElementById('confirm-expires').textContent = formatDateTime(booking.expiresAt);
  modal.classList.add('active');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

// ---- My Bookings ----
function renderMyBookings() {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  const userBookings = getBookings()
    .filter(b => b.userId === currentUser.id)
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

  if (userBookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🅿️</div>
        <p>No bookings yet. Find a parking spot!</p>
      </div>`;
    return;
  }

  container.innerHTML = userBookings.map(booking => `
    <div class="booking-card ${booking.status}">
      <div class="booking-header">
        <div>
          <div class="booking-id">#${booking.id}</div>
          <div class="booking-lot">${booking.lotName}</div>
        </div>
        ${getStatusBadge(booking.status)}
      </div>
      <div class="booking-details">
        <div class="booking-detail"><span>🅿️ Slot</span><strong>${booking.slotNumber}</strong></div>
        <div class="booking-detail"><span>⏱️ Duration</span><strong>${booking.duration} hrs</strong></div>
        <div class="booking-detail"><span>💰 Amount</span><strong>৳${booking.totalAmount}</strong></div>
        <div class="booking-detail"><span>📅 Booked</span><strong>${formatDateTime(booking.bookedAt)}</strong></div>
        <div class="booking-detail"><span>⏰ Expires</span><strong>${formatDateTime(booking.expiresAt)}</strong></div>
      </div>
      <div class="booking-actions">
        <button class="btn btn-nav btn-sm" onclick="navigateToLocation(${booking.lat}, ${booking.lng}, '${booking.lotName}')">
          🗺️ Navigate
        </button>
        ${booking.status === 'active' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${booking.id}')">Cancel</button>` : ''}
      </div>
    </div>
  `).join('');
}

function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  const bookings = getBookings();
  const bIdx = bookings.findIndex(b => b.id === bookingId);
  if (bIdx === -1) return;

  const booking = bookings[bIdx];
  bookings[bIdx].status = 'cancelled';

  // Release slot
  const data = getData();
  const lotIdx = data.lots.findIndex(l => l.id === booking.lotId);
  if (lotIdx !== -1) {
    const slotIdx = data.lots[lotIdx].slots.findIndex(s => s.id === booking.slotId);
    if (slotIdx !== -1) {
      data.lots[lotIdx].slots[slotIdx].status = 'available';
      data.lots[lotIdx].slots[slotIdx].booking = null;
    }
  }

  saveBookings(bookings);
  saveData(data);
  renderMyBookings();
  renderStats();
  filterAndRender();
  showToast('Booking cancelled successfully.', 'success');
}

// ---- Navigation ----
function initNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${target}`)?.classList.add('active');

      if (target === 'bookings') renderMyBookings();
    });
  });
}
