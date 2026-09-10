/* ============================================================
   AP MOTORS — Login (Firebase Auth)
   ============================================================ */

'use strict';

const $ = (s, r = document) => r.querySelector(s);

const form = $('#loginForm');
const emailEl = $('#loginEmail');
const passEl = $('#loginPassword');
const errorEl = $('#loginError');
const successEl = $('#loginSuccess');
const btn = $('#loginBtn');
const googleBtn = $('#loginGoogleBtn');
const resetBtn = $('#resetPassBtn');

function showError(msg) {
  if (successEl) successEl.hidden = true;
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function showSuccess(msg) {
  if (errorEl) errorEl.hidden = true;
  successEl.textContent = msg;
  successEl.hidden = false;
}

function clearMessages() {
  if (errorEl) errorEl.hidden = true;
  if (successEl) successEl.hidden = true;
}

/* Si ya hay sesión, ir directo al panel */
if (window.FB && window.FB.auth) {
  window.FB.auth.onAuthStateChanged((user) => {
    if (user) window.location.replace('admin.html');
  });
}

// Iniciar sesión con Correo y Contraseña
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    showError('Ingresa tu correo y contraseña.');
    return;
  }

  if (!window.FB || !window.FB.auth) {
    showError('Firebase no está disponible. Verifica la conexión a internet.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  try {
    await window.FB.auth.signInWithEmailAndPassword(email, password);
    window.location.replace('admin.html');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
    const code = err && err.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      showError('Correo o contraseña incorrectos.');
    } else if (code === 'auth/invalid-email') {
      showError('El correo no tiene un formato válido.');
    } else if (code === 'auth/too-many-requests') {
      showError('Demasiados intentos. Espera un momento y vuelve a intentarlo.');
    } else {
      showError('No se pudo iniciar sesión: ' + (err.message || 'error desconocido.'));
    }
  }
});

// Iniciar sesión con Google (Popup oficial)
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    clearMessages();
    if (!window.FB || !window.FB.auth) {
      showError('Firebase no está disponible.');
      return;
    }

    googleBtn.disabled = true;
    const origText = googleBtn.innerHTML;
    googleBtn.textContent = 'Conectando con Google…';

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await window.FB.auth.signInWithPopup(provider);
      window.location.replace('admin.html');
    } catch (err) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = origText;
      const code = err && err.code;
      if (code === 'auth/popup-closed-by-user') {
        showError('Ventana de Google cerrada. Intenta de nuevo.');
      } else if (code === 'auth/cancelled-popup-request') {
        // Ignorar
      } else if (code === 'auth/operation-not-allowed') {
        showError('El proveedor Google aún no está habilitado en la consola de Firebase.');
      } else {
        showError('Error con Google: ' + (err.message || code));
      }
    }
  });
}

// Restablecer contraseña por correo
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    clearMessages();
    const email = emailEl.value.trim();
    if (!email) {
      showError('Escribe primero tu correo electrónico en la casilla superior para enviarte el enlace de restablecimiento.');
      emailEl.focus();
      return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = 'Enviando enlace…';

    try {
      await window.FB.auth.sendPasswordResetEmail(email);
      showSuccess(`✔ Hemos enviado un enlace de recuperación a "${email}". Revisa tu bandeja de entrada o spam.`);
    } catch (err) {
      const code = err && err.code;
      if (code === 'auth/user-not-found') {
        showError('No existe ninguna cuenta registrada con este correo.');
      } else if (code === 'auth/invalid-email') {
        showError('El formato del correo no es válido.');
      } else {
        showError('No se pudo enviar el correo: ' + (err.message || err.code));
      }
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = '¿Olvidaste tu contraseña?';
    }
  });
}
