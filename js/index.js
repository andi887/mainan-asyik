// ============================================
// INDEX.JS - DENGAN FITUR CONTROL CENTER
// ============================================

console.log('🚀 index.js dimuat...');

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
  
  console.log('👤 User login:', currentUser.email);
  console.log('🏷️ Role:', currentUser.role);
  
  // Tampilkan info user
  document.getElementById('userName').textContent = currentUser.displayName || currentUser.email;
  document.getElementById('userRole').textContent = currentUser.role || 'user';
  
  // ✅ Tampilkan opsi Control Center HANYA untuk admin
  const controlCenterOption = document.getElementById('controlCenterOption');
  if (controlCenterOption) {
    if (currentUser.role === 'admin') {
      controlCenterOption.style.display = 'block';
      console.log('✅ Opsi Control Center ditampilkan untuk admin');
    } else {
      controlCenterOption.style.display = 'none';
      console.log('⚠️ Opsi Control Center disembunyikan untuk user biasa');
    }
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
  1: 'data statistik', 2: 'dasar', 3: 'kamar', 4: 'jalur', 5: 'kontrol',
  6: 'besar/kecil', 7: 'rampa40', 8: 'kalkulator', 9: 'PERAMUAN', 10: 'lemari',
  11: 'rata muncul', 12: 'ranjang', 13: 'tv', 14: 'ganjil/genap', 15: 'T@RD@L',
  16: 'beting show', 17: 'pustaka', 18: 'jarak lemah', 19: 'RES HARIAN', 20: 'KHUSUS NYA',
  21: 'tabel', 22: 'sketsa bil', 23: 'BBFS', 24: 'percobaan', 25: 'coming soon',
  26: 'coming soon', 27: 'mau dihapus2', 28: 'mau dihapus1', 29: 'mau di lempar', 30: 'masuk'
};

let activeMarket = null;
const statusEl = document.getElementById('status');

// ============================================
// LOGIC CONTROL CENTER
// ============================================

// Tambah card pengumuman
function addAnnouncementCard(title = '', content = '', index = 0) {
  const container = document.getElementById('announcementsContainer');
  if (!container) return;
  
  const card = document.createElement('div');
  card.className = 'announcement-card';
  card.innerHTML = `
    <h4>Pengumuman #${index + 1}</h4>
    <button type="button" class="remove-announcement" onclick="removeAnnouncement(this)">✕</button>
    <label>Judul Pengumuman</label>
    <input type="text" class="announcement-title" placeholder="Contoh: 📢 Jadwal libur" value="${title}">
    <label>Isi Pengumuman</label>
    <textarea class="announcement-content" placeholder="Masukkan isi pengumuman...">${content}</textarea>
  `;
  container.appendChild(card);
}

// Hapus pengumuman
window.removeAnnouncement = function(btn) {
  const card = btn.closest('.announcement-card');
  if (card) {
    card.remove();
    updateAnnouncementNumbers();
  }
};

function updateAnnouncementNumbers() {
  const cards = document.querySelectorAll('.announcement-card');
  cards.forEach((card, index) => {
    const h4 = card.querySelector('h4');
    if (h4) h4.textContent = `Pengumuman #${index + 1}`;
  });
}

// Load pengumuman dari Firebase
async function loadAnnouncements() {
  console.log('📥 Memuat pengumuman dari Firebase...');
  try {
    const snapshot = await rtdb.ref('infoBox').once('value');
    const data = snapshot.val();
    
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (data && data.announcements && Array.isArray(data.announcements)) {
      data.announcements.forEach((ann, index) => {
        addAnnouncementCard(ann.title || '', ann.content || '', index);
      });
      console.log('✅', data.announcements.length, 'pengumuman dimuat');
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

// === SIMPAN MARKET / CONTROL CENTER ===
document.getElementById('savePeriod').addEventListener('click', () => {
  const selected = document.getElementById('period').value;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (!selected) {
    statusEl.textContent = '⚠️ Pilih market/layanan terlebih dahulu.';
    statusEl.className = 'error';
    return;
  }
  
  // ✅ Jika yang dipilih adalah "control-center"
  if (selected === 'control-center') {
    // Validasi: hanya admin yang bisa akses
    if (currentUser.role !== 'admin') {
      alert('⛔ Akses ditolak! Hanya admin yang bisa menggunakan Control Center.');
      return;
    }
    
    // Tampilkan panel Control Center
    document.getElementById('controlCenterPanel').style.display = 'block';
    statusEl.textContent = '✅ Control Centre aktif! Silakan kelola pengumuman.';
    statusEl.className = '';
    
    // Scroll ke panel
    document.getElementById('controlCenterPanel').scrollIntoView({ behavior: 'smooth' });
    
    // Load pengumuman yang sudah ada
    loadAnnouncements();
    
    // Jangan simpan ke localStorage sebagai market
    return;
  }
  
  // Jika market biasa, simpan seperti biasa
  activeMarket = selected;
  localStorage.setItem('marketAktif', selected);
  statusEl.textContent = `✅ Market aktif: ${selected}`;
  statusEl.className = '';
  
  // Sembunyikan panel control center jika sebelumnya ditampilkan
  document.getElementById('controlCenterPanel').style.display = 'none';
  
  renderChildHouses();
});

// === RESET ===
document.getElementById('resetBtn').addEventListener('click', () => {
  activeMarket = null;
  localStorage.removeItem('marketAktif');
  document.getElementById('period').value = '';
  document.getElementById('childHouses').style.display = 'none';
  document.getElementById('controlCenterPanel').style.display = 'none';
  statusEl.textContent = '';
});

// === RENDER ANAK RUMAH ===
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

// === EVENT LISTENER: TAMBAH PENGUMUMAN ===
document.getElementById('addAnnouncementBtn').addEventListener('click', () => {
  const cards = document.querySelectorAll('.announcement-card');
  addAnnouncementCard('', '', cards.length);
});

// === EVENT LISTENER: SIMPAN PENGUMUMAN ===
document.getElementById('saveAnnouncementsBtn').addEventListener('click', async () => {
  // Validasi: hanya admin yang bisa simpan
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.role !== 'admin') {
    alert('⛔ Akses ditolak! Hanya admin yang bisa menyimpan pengumuman.');
    return;
  }
  
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
    await rtdb.ref('infoBox').set({
      announcements: announcements,
      updatedAt: Date.now(),
      updatedBy: currentUser.uid || 'unknown'
    });
    
    statusEl.textContent = `✅ ${announcements.length} pengumuman berhasil disimpan!`;
    statusEl.className = 'status-success';
    statusEl.style.display = 'block';
    
    setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
  } catch (error) {
    console.error('❌ Gagal simpan:', error);
    statusEl.textContent = '❌ Gagal: ' + error.message;
    statusEl.className = 'status-error';
    statusEl.style.display = 'block';
  }
});

// === EVENT LISTENER: PREVIEW ===
document.getElementById('previewBtn').addEventListener('click', () => {
  const cards = document.querySelectorAll('.announcement-card');
  let preview = '📋 PREVIEW PENGUMUMAN:\n\n';
  let count = 0;
  
  cards.forEach((card, index) => {
    const title = card.querySelector('.announcement-title').value.trim();
    const content = card.querySelector('.announcement-content').value.trim();
    if (title && content) {
      preview += `${index + 1}. ${title}\n   ${content}\n\n`;
      count++;
    }
  });
  
  alert(count === 0 ? 'Tidak ada pengumuman untuk di-preview.' : preview);
});

// === LOGOUT BUTTON ===
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

console.log('✅ index.js siap');
