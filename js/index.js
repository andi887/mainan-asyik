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
  
  // ✅ Tampilkan section Pilih Layanan HANYA untuk admin
  const layananSection = document.getElementById('layananSection');
  if (currentUser.role === 'admin') {
    layananSection.style.display = 'block';
  } else {
    layananSection.style.display = 'none';
  }
  
  return true;
}

// === LOGOUT FUNCTION ===
async function handleLogout() {
  if (!confirm('Apakah Anda yakin ingin logout?')) return;
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const deviceId = localStorage.getItem('deviceId');
    
    if (currentUser.uid && deviceId) {
      try {
        const sessionRef = rtdb.ref(`sessions/${currentUser.uid}/${deviceId}`);
        await sessionRef.remove();
      } catch (e) {
        console.warn('⚠️ Gagal hapus session:', e);
      }
    }
    
    await auth.signOut();
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('marketAktif');
    
    console.log('✅ Logout berhasil');
    window.location.href = './pageawal.html';
  } catch (error) {
    console.error(' Logout error:', error);
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

// === ✅ BARU: LOGIC PILIH LAYANAN ===

// Simpan layanan yang dipilih
document.getElementById('saveLayananBtn').addEventListener('click', () => {
  const layanan = document.getElementById('layananSelect').value;
  const statusEl = document.getElementById('layananStatus');
  
  if (!layanan) {
    statusEl.textContent = '⚠️ Pilih layanan terlebih dahulu!';
    statusEl.className = 'status-error';
    statusEl.style.display = 'block';
    return;
  }
  
  if (layanan === 'control-center') {
    document.getElementById('controlCenterPanel').style.display = 'block';
    statusEl.textContent = '✅ Layanan "🛡️ Control Center (Admin)" berhasil disimpan dan ditampilkan.';
    statusEl.className = 'status-success';
    statusEl.style.display = 'block';
    
    // Load existing announcements
    loadAnnouncements();
    
    // Scroll ke panel
    document.getElementById('controlCenterPanel').scrollIntoView({ behavior: 'smooth' });
  }
});

// Reset layanan
document.getElementById('resetLayananBtn').addEventListener('click', () => {
  document.getElementById('layananSelect').value = '';
  document.getElementById('controlCenterPanel').style.display = 'none';
  document.getElementById('layananStatus').style.display = 'none';
});

// === ✅ BARU: LOGIC CONTROL CENTER ===

// Tambah pengumuman baru
function addAnnouncementCard(title = '', content = '', index = 0) {
  const container = document.getElementById('announcementsContainer');
  const card = document.createElement('div');
  card.className = 'announcement-card';
  card.innerHTML = `
    <h4>Pengumuman #${index + 1}</h4>
    <button type="button" class="remove-announcement" onclick="removeAnnouncement(this)">✕</button>
    <label>Judul Pengumuman</label>
    <input type="text" class="announcement-title" placeholder="Contoh:  Jadwal libur" value="${title}">
    <label>Isi Pengumuman</label>
    <textarea class="announcement-content" placeholder="Masukkan isi pengumuman...">${content}</textarea>
  `;
  container.appendChild(card);
}

// Hapus pengumuman
window.removeAnnouncement = function(btn) {
  const card = btn.closest('.announcement-card');
  card.remove();
  updateAnnouncementNumbers();
};

// Update nomor pengumuman
function updateAnnouncementNumbers() {
  const cards = document.querySelectorAll('.announcement-card');
  cards.forEach((card, index) => {
    const h4 = card.querySelector('h4');
    h4.textContent = `Pengumuman #${index + 1}`;
  });
}

// Tambah pengumuman baru (tombol)
document.getElementById('addAnnouncementBtn').addEventListener('click', () => {
  const cards = document.querySelectorAll('.announcement-card');
  addAnnouncementCard('', '', cards.length);
});

// Simpan pengumuman
document.getElementById('saveAnnouncementsBtn').addEventListener('click', async () => {
  const cards = document.querySelectorAll('.announcement-card');
  const announcements = [];
  
  cards.forEach(card => {
    const title = card.querySelector('.announcement-title').value.trim();
    const content = card.querySelector('.announcement-content').value.trim();
    
    if (title && content) {
      announcements.push({ title, content });
    }
  });
  
  const statusEl = document.getElementById('announcementStatus');
  
  if (announcements.length === 0) {
    statusEl.textContent = '⚠️ Tambahkan minimal 1 pengumuman!';
    statusEl.className = 'status-error';
    statusEl.style.display = 'block';
    return;
  }
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    await rtdb.ref('infoBox').set({
      announcements: announcements,
      updatedAt: Date.now(),
      updatedBy: currentUser.uid || 'unknown'
    });
    
    statusEl.textContent = `✅ ${announcements.length} pengumuman berhasil disimpan!`;
    statusEl.className = 'status-success';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
    
  } catch (error) {
    console.error('❌ Gagal simpan pengumuman:', error);
    statusEl.textContent = '❌ Gagal menyimpan: ' + error.message;
    statusEl.className = 'status-error';
    statusEl.style.display = 'block';
  }
});

// Preview pengumuman
document.getElementById('previewBtn').addEventListener('click', () => {
  const cards = document.querySelectorAll('.announcement-card');
  let preview = '📋 PREVIEW PENGUMUMAN:\n\n';
  
  cards.forEach((card, index) => {
    const title = card.querySelector('.announcement-title').value.trim();
    const content = card.querySelector('.announcement-content').value.trim();
    
    if (title && content) {
      preview += `${index + 1}. ${title}\n   ${content}\n\n`;
    }
  });
  
  if (preview === '📋 PREVIEW PENGUMUMAN:\n\n') {
    alert('Tidak ada pengumuman untuk di-preview.');
  } else {
    alert(preview);
  }
});

// Load pengumuman yang sudah ada
async function loadAnnouncements() {
  try {
    const snapshot = await rtdb.ref('infoBox').once('value');
    const data = snapshot.val();
    
    if (data && data.announcements) {
      document.getElementById('announcementsContainer').innerHTML = '';
      data.announcements.forEach((announcement, index) => {
        addAnnouncementCard(announcement.title, announcement.content, index);
      });
    }
  } catch (error) {
    console.error('❌ Gagal load pengumuman:', error);
  }
}

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
