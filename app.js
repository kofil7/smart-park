// ============================================================
// SmartPark - App Utilities (shared across pages)
// ============================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function generateBookingId() {
  return 'BK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function getStatusBadge(status) {
  const badges = {
    active: '<span class="badge badge-success">Active</span>',
    cancelled: '<span class="badge badge-danger">Cancelled</span>',
    completed: '<span class="badge badge-info">Completed</span>',
    pending: '<span class="badge badge-warning">Pending</span>'
  };
  return badges[status] || `<span class="badge">${status}</span>`;
}

function navigateToLocation(lat, lng, name) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  showToast(`Opening navigation to ${name}...`, 'info');
  setTimeout(() => window.open(url, '_blank'), 500);
}

function getAvailableCount(lot) {
  return lot.slots.filter(s => s.status === 'available').length;
}

function getOccupancyPercent(lot) {
  return Math.round(((lot.totalSlots - getAvailableCount(lot)) / lot.totalSlots) * 100);
}

function getOccupancyClass(percent) {
  if (percent < 50) return 'low';
  if (percent < 80) return 'medium';
  return 'high';
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '☆';
  for (let i = full + half; i < 5; i++) stars += '☆';
  return stars;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Animate number count up
function animateCount(el, target, duration = 1000) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start);
  }, 16);
}
