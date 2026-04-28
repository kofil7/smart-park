// ============================================================
// SmartPark - Authentication Module
// ============================================================

function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const loginCard = document.getElementById('login-card');
  const registerCard = document.getElementById('register-card');

  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginCard.classList.add('slide-out-left');
      setTimeout(() => {
        loginCard.style.display = 'none';
        loginCard.classList.remove('slide-out-left');
        registerCard.style.display = 'flex';
        registerCard.classList.add('slide-in-right');
        setTimeout(() => registerCard.classList.remove('slide-in-right'), 400);
      }, 300);
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerCard.classList.add('slide-out-right');
      setTimeout(() => {
        registerCard.style.display = 'none';
        registerCard.classList.remove('slide-out-right');
        loginCard.style.display = 'flex';
        loginCard.classList.add('slide-in-left');
        setTimeout(() => loginCard.classList.remove('slide-in-left'), 400);
      }, 300);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Demo credential auto-fill buttons
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (role === 'user') {
        document.getElementById('login-email').value = 'user@demo.com';
        document.getElementById('login-password').value = 'demo123';
      } else {
        document.getElementById('login-email').value = 'admin@demo.com';
        document.getElementById('login-password').value = 'admin123';
      }
      showToast('Demo credentials filled! Click Login.', 'info');
    });
  });
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!email || !password) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  // Loading state
  btn.innerHTML = '<span class="spinner"></span> Signing In...';
  btn.disabled = true;

  setTimeout(() => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      setCurrentUser(user);
      showToast(`Welcome back, ${user.name}! 🎉`, 'success');
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 800);
    } else {
      btn.innerHTML = '<i class="icon">🔐</i> Sign In';
      btn.disabled = false;
      showToast('Invalid email or password.', 'error');
      document.getElementById('login-password').classList.add('shake');
      setTimeout(() => document.getElementById('login-password').classList.remove('shake'), 500);
    }
  }, 900);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm').value;
  const btn = document.getElementById('register-btn');

  // Validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    document.getElementById('reg-confirm').classList.add('shake');
    setTimeout(() => document.getElementById('reg-confirm').classList.remove('shake'), 500);
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('An account with this email already exists.', 'error');
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> Creating Account...';
  btn.disabled = true;

  setTimeout(() => {
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      password,
      role: 'user',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      joinDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    showToast(`Account created! Welcome, ${name}! 🚀`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 800);
  }, 1000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'auth.html';
    return null;
  }
  return user;
}
