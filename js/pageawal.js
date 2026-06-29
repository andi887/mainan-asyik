const auth = firebase.auth();
const rtdb = firebase.database();

// ✅ Flag untuk mencegah race condition
let isLoggingIn = false; 
let hasRedirected = false; // ✅ BARU: Cegah multiple redirect

let currentCaptcha = '';

function generateCaptcha() {
  let captcha = '';
  for (let i = 0; i < 5; i++) captcha += Math.floor(Math.random() * 10);
  currentCaptcha = captcha;
  document.getElementById('captchaDisplay').textContent = captcha;
}

function refreshCaptcha() {
  generateCaptcha();
  document.getElementById('captchaInput').value = '';
}

async function registerSession(userId, deviceId) {
  try {
    const sessionRef = rtdb.ref(`sessions/${userId}/${deviceId}`);
    await sessionRef.set({
      lastActive: Date.now(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    sessionRef.onDisconnect().remove();
  } catch (error) { console.error('Session error:', error); }
}

async function getUserRole(uid) {
  try {
    const snapshot = await rtdb.ref(`users/${uid}`).once('value');
    if (snapshot.exists()) return snapshot.val().role || "user";
    return "user";
  } catch (error) { return "user"; }
}

async function forgotPassword() {
  const email = document.getElementById('email').value.trim();
  if (!email) return document.getElementById('errorMsg').textContent = '❌ Masukkan email dulu.';
  try {
    await auth.sendPasswordResetEmail(email);
    document.getElementById('successMsg').textContent = '✅ Email reset dikirim!';
  } catch (error) {
    document.getElementById('errorMsg').textContent = '❌ ' + error.message;
  }
}

// ✅ Event Listener pada tombol, BUKAN pada form submit
document.getElementById('btnSignIn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const captcha = document.getElementById('captchaInput').value.trim();
  
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const loading = document.getElementById('loading');
  const btn = document.getElementById('btnSignIn');

  errorMsg.textContent = '';
  successMsg.textContent = '';

  if (captcha !== currentCaptcha) {
    errorMsg.textContent = '❌ Captcha salah!';
    refreshCaptcha();
    return;
  }

  loading.classList.add('active');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  // ✅ Aktifkan flag agar onAuthStateChanged TIDAK mengganggu
  isLoggingIn = true; 
  hasRedirected = true; // ✅ BARU: Tandai bahwa kita akan redirect

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const userRole = await getUserRole(user.uid);
    
    // Simpan ke localStorage DULU sebelum redirect
    localStorage.setItem('currentUser', JSON.stringify({
      uid: user.uid, 
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      role: userRole
    }));
    localStorage.setItem('userRole', userRole);
    
    const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
    await registerSession(user.uid, deviceId);

    successMsg.textContent = '✅ Login berhasil!';
    
    // ✅ Redirect manual HANYA setelah semua data siap
    setTimeout(() => {
      window.location.href = './index.html';
    }, 500); // Delay sedikit agar UI update
    
  } catch (error) {
    errorMsg.textContent = '❌ ' + (error.message || 'Login gagal.');
    btn.disabled = false;
    btn.textContent = 'Sign In';
    refreshCaptcha();
    isLoggingIn = false;
    hasRedirected = false; // ✅ Reset flag jika gagal
  } finally {
    loading.classList.remove('active');
  }
});

// Navigation
document.getElementById('navDaftar').addEventListener('click', (e) => { e.preventDefault(); alert('Fitur pendaftaran segera tersedia.'); });
document.getElementById('navEksplor').addEventListener('click', (e) => { e.preventDefault(); alert('Silakan login untuk eksplorasi.'); });

// ✅ Initialize - DIPERBAIKI: Cek localStorage dulu, jangan langsung redirect
window.addEventListener('DOMContentLoaded', () => {
  generateCaptcha();
  
  // ✅ Cek awal: jika sudah login, tunggu Firebase Auth restore dulu
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    console.log('✅ User sudah login, menunggu Firebase Auth restore...');
    // Jangan langsung redirect! Biarkan onAuthStateChanged yang handle
  }
});

// ✅ onAuthStateChanged - DIPERBAIKI: Lebih robust
auth.onAuthStateChanged((user) => {
  // ✅ Skip jika sedang dalam proses login manual
  if (isLoggingIn) {
    console.log('⏳ Sedang dalam proses login, skip redirect');
    return;
  }
  
  // ✅ Skip jika sudah pernah redirect
  if (hasRedirected) {
    console.log('⏳ Sudah pernah redirect, skip');
    return;
  }
  
  const currentUser = localStorage.getItem('currentUser');
  
  if (user && currentUser) {
    // ✅ User login DAN localStorage ada → redirect ke index
    console.log('✅ Auth restored + localStorage ada → redirect ke index.html');
    hasRedirected = true;
    window.location.href = './index.html';
  } else if (!user && currentUser) {
    // ✅ User TIDAK login TAPI localStorage ada → logout paksa
    console.log('⚠️ Auth null tapi localStorage ada → clear localStorage');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    // Jangan redirect, biarkan user di halaman login
  } else if (user && !currentUser) {
    // ✅ User login TAPI localStorage kosong → sinkronkan
    console.log('⚠️ Auth ada tapi localStorage kosong → sinkronkan');
    getUserRole(user.uid).then(role => {
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: role
      }));
      localStorage.setItem('userRole', role);
      hasRedirected = true;
      window.location.href = './index.html';
    });
  }
  // else: user tidak login dan localStorage kosong → biarkan di halaman login
});

console.log('🔐 pageawal.js ready');
