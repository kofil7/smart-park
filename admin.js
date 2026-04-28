// ============================================================
// SmartPark - Admin Module
// ============================================================

let adminUser = null;

document.addEventListener('DOMContentLoaded', () => {
  adminUser = requireAdmin();
  if (!adminUser) return;

  initializeData();
  document.getElementById('admin-name').textContent = adminUser.name;
  document.getElementById('admin-avatar').textContent = adminUser.avatar;

  renderAdminStats();
  renderAdminLots();
  renderAllBookings();
  renderUsersTable();
  initAdminNav();
  initAddLotModal();
});

function renderAdminStats() {
  const data = getData();
  const bookings = getBookings();

  const totalSlots = data.lots.reduce((sum, l) => sum + l.totalSlots, 0);
  const availableSlots = data.lots.reduce((sum, l) => sum + getAvailableCount(l), 0);
  const activeBookings = bookings.filter(b => b.status === 'active').length;
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  animateCount(document.getElementById('admin-stat-lots'), data.lots.length);
  animateCount(document.getElementById('admin-stat-slots'), totalSlots);
  animateCount(document.getElementById('admin-stat-available'), availableSlots);
  animateCount(document.getElementById('admin-stat-bookings'), activeBookings);
  animateCount(document.getElementById('admin-stat-revenue'), totalRevenue);
  animateCount(document.getElementById('admin-stat-users'), getUsers().filter(u => u.role === 'user').length);
}

function renderAdminLots() {
  const container = document.getElementById('admin-lots-container');
  if (!container) return;
  const data = getData();

  container.innerHTML = data.lots.map(lot => {
    const available = getAvailableCount(lot);
    const occupancy = getOccupancyPercent(lot);

    return `
      <div class="admin-lot-card">
        <div class="admin-lot-header">
          <div class="lot-icon-sm">${lot.image}</div>
          <div>
            <h4>${lot.name}</h4>
            <p class="lot-addr-sm">📍 ${lot.address}</p>
          </div>
          <div class="admin-lot-actions">
            <button class="icon-btn" onclick="editLot('${lot.id}')" title="Edit">✏️</button>
            <button class="icon-btn danger" onclick="deleteLot('${lot.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="admin-lot-stats">
          <div class="admin-slot-stat">
            <span class="stat-val available-col">${available}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="admin-slot-stat">
            <span class="stat-val occupied-col">${lot.totalSlots - available}</span>
            <span class="stat-label">Occupied</span>
          </div>
          <div class="admin-slot-stat">
            <span class="stat-val">${lot.totalSlots}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="admin-slot-stat">
            <span class="stat-val">৳${lot.pricePerHour}</span>
            <span class="stat-label">Per Hour</span>
          </div>
        </div>
        <div class="occupancy-bar-wrap">
          <div class="occupancy-bar">
            <div class="occupancy-fill ${getOccupancyClass(occupancy)}" style="width:${occupancy}%"></div>
          </div>
          <span class="occupancy-label">${occupancy}% full</span>
        </div>
        <div class="admin-features">
          ${lot.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm mt-8" onclick="manageSlots('${lot.id}')">
          🔧 Manage Slots
        </button>
      </div>
    `;
  }).join('');
}

function renderAllBookings() {
  const tbody = document.getElementById('all-bookings-tbody');
  if (!tbody) return;

  const bookings = getBookings().sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
  const users = getUsers();

  tbody.innerHTML = bookings.map(booking => {
    const user = users.find(u => u.id === booking.userId);
    return `
      <tr class="booking-row ${booking.status}">
        <td><span class="booking-id-badge">${booking.id}</span></td>
        <td>${user ? user.name : 'Unknown'}</td>
        <td>${booking.lotName}</td>
        <td><strong>${booking.slotNumber}</strong></td>
        <td>${booking.duration} hrs</td>
        <td>৳${booking.totalAmount}</td>
        <td>${formatDateTime(booking.bookedAt)}</td>
        <td>${getStatusBadge(booking.status)}</td>
        <td>
          ${booking.status === 'active' ? 
            `<button class="btn btn-danger btn-xs" onclick="adminCancelBooking('${booking.id}')">Cancel</button>` : 
            '<span class="text-muted">—</span>'}
        </td>
      </tr>
    `;
  }).join('');

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No bookings found</td></tr>`;
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  const users = getUsers().filter(u => u.role === 'user');
  const bookings = getBookings();

  tbody.innerHTML = users.map(user => {
    const userBookings = bookings.filter(b => b.userId === user.id);
    const totalSpent = userBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalAmount, 0);
    return `
      <tr>
        <td>
          <div class="user-row">
            <div class="user-avatar-sm">${user.avatar}</div>
            <div>
              <strong>${user.name}</strong>
              <div class="text-muted text-sm">${user.email}</div>
            </div>
          </div>
        </td>
        <td>${user.phone}</td>
        <td>${userBookings.length}</td>
        <td>৳${totalSpent}</td>
        <td>${formatDate(user.joinDate)}</td>
        <td><span class="badge badge-success">Active</span></td>
      </tr>
    `;
  }).join('');

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No users registered</td></tr>`;
  }
}

function adminCancelBooking(bookingId) {
  if (!confirm('Cancel this booking?')) return;

  const bookings = getBookings();
  const bIdx = bookings.findIndex(b => b.id === bookingId);
  if (bIdx === -1) return;

  const booking = bookings[bIdx];
  bookings[bIdx].status = 'cancelled';

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
  renderAllBookings();
  renderAdminStats();
  renderAdminLots();
  showToast('Booking cancelled.', 'success');
}

function deleteLot(lotId) {
  if (!confirm('Are you sure you want to delete this parking lot? All slots and bookings will be released.')) return;
  const data = getData();
  data.lots = data.lots.filter(l => l.id !== lotId);
  saveData(data);
  renderAdminLots();
  renderAdminStats();
  showToast('Parking lot deleted.', 'success');
}

function manageSlots(lotId) {
  const data = getData();
  const lot = data.lots.find(l => l.id === lotId);
  if (!lot) return;

  const modal = document.getElementById('slots-manage-modal');
  document.getElementById('manage-lot-name').textContent = lot.name;

  const grid = document.getElementById('admin-slot-grid');
  const typeIcons = { handicap: '♿', ev: '⚡', standard: '🚗' };

  grid.innerHTML = lot.slots.map(slot => `
    <div class="admin-slot-cell ${slot.status}" 
         onclick="toggleSlot('${lotId}', '${slot.id}')"
         title="Click to toggle status">
      <span class="slot-icon">${typeIcons[slot.type]}</span>
      <span class="slot-num">${slot.number}</span>
      <span class="slot-status-dot"></span>
    </div>
  `).join('');

  modal.classList.add('active');
}

function toggleSlot(lotId, slotId) {
  const data = getData();
  const lotIdx = data.lots.findIndex(l => l.id === lotId);
  const slotIdx = data.lots[lotIdx].slots.findIndex(s => s.id === slotId);
  const slot = data.lots[lotIdx].slots[slotIdx];

  if (slot.booking) {
    showToast('Cannot toggle a slot with an active booking.', 'warning');
    return;
  }

  data.lots[lotIdx].slots[slotIdx].status = slot.status === 'available' ? 'occupied' : 'available';
  saveData(data);

  manageSlots(lotId);
  renderAdminLots();
  renderAdminStats();
}

function closeManageModal() {
  document.getElementById('slots-manage-modal').classList.remove('active');
}

function editLot(lotId) {
  const data = getData();
  const lot = data.lots.find(l => l.id === lotId);
  if (!lot) return;

  document.getElementById('edit-lot-id').value = lot.id;
  document.getElementById('edit-lot-name').value = lot.name;
  document.getElementById('edit-lot-address').value = lot.address;
  document.getElementById('edit-lot-price').value = lot.pricePerHour;

  document.getElementById('edit-lot-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-lot-modal').classList.remove('active');
}

function saveEditLot() {
  const id = document.getElementById('edit-lot-id').value;
  const name = document.getElementById('edit-lot-name').value.trim();
  const address = document.getElementById('edit-lot-address').value.trim();
  const price = parseInt(document.getElementById('edit-lot-price').value);

  if (!name || !address || isNaN(price) || price <= 0) {
    showToast('Please fill in all fields correctly.', 'error');
    return;
  }

  const data = getData();
  const lotIdx = data.lots.findIndex(l => l.id === id);
  if (lotIdx === -1) return;

  data.lots[lotIdx].name = name;
  data.lots[lotIdx].address = address;
  data.lots[lotIdx].pricePerHour = price;

  saveData(data);
  closeEditModal();
  renderAdminLots();
  showToast('Parking lot updated successfully.', 'success');
}

function initAddLotModal() {
  const form = document.getElementById('add-lot-form');
  if (form) form.addEventListener('submit', handleAddLot);

  document.getElementById('add-lot-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-lot-modal') closeAddLotModal();
  });
  document.getElementById('edit-lot-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'edit-lot-modal') closeEditModal();
  });
  document.getElementById('slots-manage-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'slots-manage-modal') closeManageModal();
  });
}

function openAddLotModal() {
  document.getElementById('add-lot-modal').classList.add('active');
  document.getElementById('add-lot-form').reset();
}

function closeAddLotModal() {
  document.getElementById('add-lot-modal').classList.remove('active');
}

function handleAddLot(e) {
  e.preventDefault();

  const name = document.getElementById('new-lot-name').value.trim();
  const address = document.getElementById('new-lot-address').value.trim();
  const price = parseInt(document.getElementById('new-lot-price').value);
  const slots = parseInt(document.getElementById('new-lot-slots').value);
  const features = document.getElementById('new-lot-features').value.trim();

  if (!name || !address || isNaN(price) || isNaN(slots) || slots < 1) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const data = getData();
  const newId = `lot-${Date.now()}`;
  const featureList = features ? features.split(',').map(f => f.trim()).filter(Boolean) : ['CCTV'];

  const newLot = {
    id: newId,
    name,
    address,
    lat: 23.7800 + (Math.random() - 0.5) * 0.1,
    lng: 90.4000 + (Math.random() - 0.5) * 0.1,
    totalSlots: slots,
    pricePerHour: price,
    rating: 4.0,
    image: '🏗️',
    features: featureList,
    distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
    slots: generateSlots(newId, slots, [])
  };

  data.lots.push(newLot);
  saveData(data);

  closeAddLotModal();
  renderAdminLots();
  renderAdminStats();
  showToast(`"${name}" added successfully! 🎉`, 'success');
}

function initAdminNav() {
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`admin-tab-${target}`)?.classList.add('active');

      if (target === 'bookings') renderAllBookings();
      if (target === 'users') renderUsersTable();
      if (target === 'lots') renderAdminLots();
    });
  });
}
