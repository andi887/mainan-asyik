// ✅ Gunakan Firebase yang sudah diinisialisasi oleh config-firebase.js
const auth = firebase.auth();
const rtdb = firebase.database();

// === PROTEKSI HALAMAN: CEK LOGIN STATUS ===
function checkAuth() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser) {
    console.log('⚠️ User belum login, redirect ke pageawal.html');
    window.location.href = './pageawal.html';
    return false;
  }
  
  // Tampilkan info user
  document.getElementById('userName').textContent = currentUser.displayName || currentUser.email;
  document.getElementById('userRole').textContent = currentUser.role || 'user';
  
  // ✅ Tampilkan tombol Control Center HANYA untuk admin
  const adminBtn = document.getElementById('adminBtn');
  if (currentUser.role === 'admin') {
    adminBtn.style.display = 'block';
  } else {
    adminBtn.style.display = 'none';
  }
  
  return true;
}

// === LOGOUT FUNCTION ===
async function handleLogout() {
  if (!confirm('Apakah Anda yakin ingin logout?')) return;
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const deviceId = localStorage.getItem('deviceId');
    
    // Hapus session di RTDB
    if (currentUser.uid && deviceId) {
      try {
        const sessionRef = rtdb.ref(`sessions/${currentUser.uid}/${deviceId}`);
        await sessionRef.remove();
      } catch (e) {
        console.warn('⚠️ Gagal hapus session:', e);
      }
    }
    
    // Sign out dari Firebase
    await auth.signOut();
    
    // Hapus semua data dari localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('marketAktif');
    
    console.log('✅ Logout berhasil');
    
    // Redirect ke pageawal.html
    window.location.href = './pageawal.html';
  } catch (error) {
    console.error('❌ Logout error:', error);
    alert('Gagal logout: ' + error.message);
  }
}

// === AUTH STATE LISTENER ===
auth.onAuthStateChanged((user) => {
  if (!user) {
    console.log('⚠️ Firebase auth state: not logged in');
    window.location.href = './pageawal.html';
  }
});

// === DATA RUMAH ===
const houseNames = {
  1: 'data statistik',
  2: 'dasar',
  3: 'kamar',
  4: 'jalur',
  5: 'kontrol',
  6: 'besar/kecil',
  7: 'rampa40',
  8: 'kalkulator',
  9: 'PERAMUAN',
  10: 'lemari',
  11: 'rata muncul',
  12: 'ranjang',
  13: 'tv',
  14: 'ganjil/genap',
  15: 'T@RD@L',
  16: 'beting show',
  17: 'pustaka',
  18: 'jarak lemah',
  19: 'RES HARIAN',
  20: 'KHUSUS NYA',
  21: 'tabel',
  22: 'sketsa bil',
  23: 'BBFS',
  24: 'percobaan',
  25: 'coming soon',
  26: 'coming soon',
  27: 'mau dihapus2',
  28: 'mau dihapus1',
  29: 'mau di lempar',
  30: 'masuk'
};

let activeMarket = null;
const statusEl = document.getElementById('status');

// === ✅ BARU: Event Listener Tombol Admin ===
document.getElementById('adminBtn').addEventListener('click', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.role === 'admin') {
    window.location.href = './control-center.html';
  } else {
    alert(' Akses ditolak! Hanya admin yang bisa masuk.');
  }
});

// === MUAT MARKET AKTIF SAAT HALAMAN DIMUAT ===
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  
  const savedMarket = localStorage.getItem('marketAktif');
  if (savedMarket) {
    document.getElementById('period').value = savedMarket;
    activeMarket = savedMarket;
    statusEl.textContent = `✅ Market aktif: ${savedMarket}`;
    renderChildHouses();
  }
});

// === SIMPAN MARKET KE LOCALSTORAGE ===
document.getElementById('savePeriod').addEventListener('click', () => {
  const selected = document.getElementById('period').value;
  if (!selected) {
    statusEl.textContent = '⚠️ Pilih market terlebih dahulu.';
    statusEl.className = 'error';
    return;
  }
  activeMarket = selected;
  localStorage.setItem('marketAktif', selected);
  statusEl.textContent = `✅ Market aktif: ${selected}`;
  statusEl.className = '';
  renderChildHouses();
});

// === RESET ===
document.getElementById('resetBtn').addEventListener('click', () => {
  activeMarket = null;
  localStorage.removeItem('marketAktif');
  document.getElementById('period').value = '';
  document.getElementById('childHouses').style.display = 'none';
  statusEl.textContent = '';
});

// === RENDER DAFTAR "ANAK RUMAH" ===
function renderChildHouses() {
  const container = document.getElementById('houseList');
  container.innerHTML = '';

  for (const num in houseNames) {
    const a = document.createElement('a');
    a.href = `rumah${num}.html?market=${encodeURIComponent(activeMarket)}`;
    a.className = 'house-btn';
    a.textContent = `Rumah${num}\n(${houseNames[num]})`;
    a.style.whiteSpace = 'pre-line';
    container.appendChild(a);
  }

  document.getElementById('childHouses').style.display = 'block';
}

// === LOGOUT BUTTON EVENT ===
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
