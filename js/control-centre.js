// ============================================
// CONTROL CENTER.JS - ADMIN PANEL
// ============================================

console.log('🛡️ control-center.js dimuat...');

// ✅ Proteksi: Hanya admin yang bisa akses
(function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser) {
    alert('⛔ Anda harus login terlebih dahulu!');
    window.location.href = './pageawal.html';
    return;
  }
  
  if (currentUser.role !== 'admin') {
    alert('⛔ Akses ditolak! Halaman ini hanya untuk admin.');
    window.location.href = './index.html';
    return;
  }
  
  console.log('✅ Admin terverifikasi:', currentUser.email);
  initControlCenter();
})();

function initControlCenter() {
  const auth = firebase.auth();
  const rtdb = firebase.database();

  // === TOMBOL KEMBALI ===
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = './index.html';
  });

  // ============================================
  // ✅ NAVIGASI ANTAR FITUR CONTROL CENTER
  // ============================================
  
  function showPanel(panelId) {
    // Sembunyikan semua sub-panel
    document.querySelectorAll('.sub-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Hapus class active dari semua kartu
    document.querySelectorAll('.feature-card').forEach(card => {
      card.classList.remove('active');
    });
    
    // Tampilkan panel yang dipilih
    if (panelId) {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
        setTimeout(() => {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }

  // ✅ Event Listener: Kartu Pengaturan Situs
  const cardPengaturan = document.getElementById('cardPengaturan');
  if (cardPengaturan) {
    cardPengaturan.addEventListener('click', () => {
      document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
      cardPengaturan.classList.add('active');
      showPanel('subPanelPengaturan');
      loadAnnouncements();
    });
  }

  // ✅ Event Listener: Kartu Data & Statistik
  const cardDataStatistik = document.getElementById('cardDataStatistik');
  if (cardDataStatistik) {
    cardDataStatistik.addEventListener('click', () => {
      document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
      cardDataStatistik.classList.add('active');
      showPanel('subPanelStatistik');
    });
  }

  // ✅ Event Listener: Kartu Monitoring (REDIRECT)
  const cardMonitoring = document.getElementById('cardMonitoring');
  if (cardMonitoring) {
    cardMonitoring.addEventListener('click', () => {
      console.log('👁️ Kartu Monitoring diklik, redirect ke monitoring.html');
      window.location.href = './monitoring.html';
    });
  } else {
    console.error('❌ cardMonitoring tidak ditemukan di HTML!');
  }

  // ✅ Event Listener: Kartu Manajemen User
  const cardManajemenUser = document.getElementById('cardManajemenUser');
  if (cardManajemenUser) {
    cardManajemenUser.addEventListener('click', () => {
      document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
      cardManajemenUser.classList.add('active');
      showPanel('subPanelManajemen');
    });
  }

  // ✅ Event Listener: Kartu Keamanan & Log
  const cardKeamanan = document.getElementById('cardKeamanan');
  if (cardKeamanan) {
    cardKeamanan.addEventListener('click', () => {
      document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
      cardKeamanan.classList.add('active');
      showPanel('subPanelKeamanan');
    });
  }

  // ============================================
  // FITUR PENGUMUMAN (EXISTING - 100% UTUH)
  // ============================================

  function addAnnouncementCard(title = '', content = '', index = 0) {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    
    const card = document.createElement('div');
    card.className = 'announcement-card';
    card.innerHTML = `
      <h4>Pengumuman #${index + 1}</h4>
      <button type="button" class="remove-btn" onclick="removeAnnouncement(this)">✕</button>
      <label>Judul Pengumuman</label>
      <input type="text" class="announcement-title" placeholder="Contoh: 📢 Jadwal libur" value="${title}">
      <label>Isi Pengumuman</label>
      <textarea class="announcement-content" placeholder="Masukkan isi pengumuman...">${content}</textarea>
    `;
    container.appendChild(card);
  }

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

  const addBtn = document.getElementById('addAnnouncementBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.announcement-card');
      addAnnouncementCard('', '', cards.length);
    });
  }

  const saveBtn = document.getElementById('saveAnnouncementsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const cards = document.querySelectorAll('.announcement-card');
      const announcements = [];
      
      cards.forEach(card => {
        const title = card.querySelector('.announcement-title').value.trim();
        const content = card.querySelector('.announcement-content').value.trim();
        
        if (title && content) {
          announcements.push({ title, content });
        }
      });
      
      const statusEl = document.getElementById('statusMsg');
      
      if (announcements.length === 0) {
        statusEl.textContent = '⚠️ Tambahkan minimal 1 pengumuman!';
        statusEl.className = 'status-msg status-error';
        statusEl.style.display = 'block';
        return;
      }
      
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        await rtdb.ref('infoBox').set({
          announcements: announcements,
          updatedAt: Date.now(),
          updatedBy: user.uid || 'unknown'
        });
        
        statusEl.textContent = `✅ ${announcements.length} pengumuman berhasil disimpan!`;
        statusEl.className = 'status-msg status-success';
        statusEl.style.display = 'block';
        
        setTimeout(() => {
          statusEl.style.display = 'none';
        }, 5000);
        
      } catch (error) {
        console.error('❌ Gagal simpan:', error);
        statusEl.textContent = '❌ Gagal menyimpan: ' + error.message;
        statusEl.className = 'status-msg status-error';
        statusEl.style.display = 'block';
      }
    });
  }

  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
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
  }

  async function loadAnnouncements() {
    try {
      const snapshot = await rtdb.ref('infoBox').once('value');
      const data = snapshot.val();
      
      if (data && data.announcements) {
        const container = document.getElementById('announcementsContainer');
        if (container) {
          container.innerHTML = '';
          data.announcements.forEach((announcement, index) => {
            addAnnouncementCard(announcement.title, announcement.content, index);
          });
          console.log('✅', data.announcements.length, 'pengumuman dimuat');
        }
      }
    } catch (error) {
      console.error('❌ Gagal load pengumuman:', error);
    }
  }

  // Load saat halaman siap
  loadAnnouncements();
  
  console.log('🛡️ Control Center ready - Admin mode');
}
