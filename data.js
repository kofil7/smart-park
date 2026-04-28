// ============================================================
// SmartPark - Mock Data Layer
// ============================================================

const PARKING_DATA = {
  lots: [
    {
      id: "lot-001",
      name: "Central City Parking",
      address: "23 Main Street, Downtown",
      lat: 23.8103,
      lng: 90.4125,
      totalSlots: 20,
      pricePerHour: 50,
      rating: 4.7,
      image: "🏢",
      features: ["CCTV", "24/7 Open", "EV Charging"],
      distance: "0.3 km",
      slots: generateSlots("lot-001", 20, [2, 5, 8, 12, 15])
    },
    {
      id: "lot-002",
      name: "Metro Station Parking",
      address: "Mirpur-10, Metro Station",
      lat: 23.8223,
      lng: 90.3654,
      totalSlots: 30,
      pricePerHour: 30,
      rating: 4.3,
      image: "🚇",
      features: ["24/7 Open", "Security Guard"],
      distance: "1.2 km",
      slots: generateSlots("lot-002", 30, [1, 4, 7, 10, 13, 16, 20, 25])
    },
    {
      id: "lot-003",
      name: "Shopping Mall Parking",
      address: "Bashundhara City, Panthapath",
      lat: 23.7512,
      lng: 90.3917,
      totalSlots: 50,
      pricePerHour: 60,
      rating: 4.8,
      image: "🛍️",
      features: ["CCTV", "Covered", "Valet", "EV Charging"],
      distance: "2.1 km",
      slots: generateSlots("lot-003", 50, [3, 6, 11, 14, 18, 22, 27, 31, 35, 40, 45])
    },
    {
      id: "lot-004",
      name: "Airport Express Parking",
      address: "Hazrat Shahjalal Airport Road",
      lat: 23.8519,
      lng: 90.4073,
      totalSlots: 40,
      pricePerHour: 80,
      rating: 4.5,
      image: "✈️",
      features: ["CCTV", "24/7 Open", "Shuttle Service"],
      distance: "5.4 km",
      slots: generateSlots("lot-004", 40, [2, 5, 9, 14, 19, 24, 28, 33])
    },
    {
      id: "lot-005",
      name: "Tech Hub Parking",
      address: "Gulshan-2, Tech District",
      lat: 23.7925,
      lng: 90.4078,
      totalSlots: 25,
      pricePerHour: 45,
      rating: 4.6,
      image: "💻",
      features: ["CCTV", "Smart Entry", "EV Charging"],
      distance: "3.8 km",
      slots: generateSlots("lot-005", 25, [1, 4, 6, 10, 15, 18])
    },
    {
      id: "lot-006",
      name: "Riverside Park & Ride",
      address: "Sadarghat, River District",
      lat: 23.7104,
      lng: 90.4074,
      totalSlots: 15,
      pricePerHour: 20,
      rating: 4.1,
      image: "🌊",
      features: ["Security Guard", "Budget Friendly"],
      distance: "4.5 km",
      slots: generateSlots("lot-006", 15, [2, 7, 11])
    }
  ]
};

function generateSlots(lotId, count, occupiedIndices) {
  const slots = [];
  for (let i = 1; i <= count; i++) {
    slots.push({
      id: `${lotId}-slot-${String(i).padStart(2, '0')}`,
      number: `A${String(i).padStart(2, '0')}`,
      status: occupiedIndices.includes(i) ? 'occupied' : 'available',
      type: i <= Math.floor(count * 0.1) ? 'handicap' : i <= Math.floor(count * 0.2) ? 'ev' : 'standard',
      booking: null
    });
  }
  return slots;
}

// Initialize localStorage with default data if not present
function initializeData() {
  if (!localStorage.getItem('parkingData')) {
    localStorage.setItem('parkingData', JSON.stringify(PARKING_DATA));
  }
  if (!localStorage.getItem('users')) {
    const defaultUsers = [
      {
        id: 'user-001',
        name: 'John Driver',
        email: 'user@demo.com',
        password: 'demo123',
        phone: '01712345678',
        role: 'user',
        avatar: 'JD',
        joinDate: '2025-01-15'
      },
      {
        id: 'admin-001',
        name: 'Admin Manager',
        email: 'admin@demo.com',
        password: 'admin123',
        phone: '01812345678',
        role: 'admin',
        avatar: 'AM',
        joinDate: '2024-06-01'
      }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
  }
  if (!localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify(null));
  }
}

function getData() {
  return JSON.parse(localStorage.getItem('parkingData')) || PARKING_DATA;
}

function saveData(data) {
  localStorage.setItem('parkingData', JSON.stringify(data));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function getBookings() {
  return JSON.parse(localStorage.getItem('bookings')) || [];
}

function saveBookings(bookings) {
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
  localStorage.setItem('currentUser', JSON.stringify(null));
}
