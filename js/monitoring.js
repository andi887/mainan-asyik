// =========================================
// FIREBASE INITIALIZATION
// =========================================
const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;
let currentPlanningType = null;

// =========================================
// NOTIFICATION SYSTEM
// =========================================
function showNotification(message, type = 'success') {
  const notif = document.getElementById('saveNotification');
  notif.textContent = message;
  notif.className = `save-notification ${type}`;
  notif.style.display = 'block';
  notif.style.animation = 'slideIn 0.3s ease-out';
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      notif.style.display = 'none';
    }, 300);
  }, 3000);
}

// =========================================
// AUTHENTICATION CHECK
// =========================================
let authReady = !!localStorage.getItem('currentUser');

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    authReady = true;
    loadAllData();
  } else {
    if (!localStorage.getItem('currentUser')) {
      authReady = false;
      showNotification('⚠️ Anda belum login!', 'error');
      setTimeout(() => {
        window.location.href = './pageawal.html';
      }, 2000);
    }
  }
});

// =========================================
// NAVIGATION
// =========================================
function showSection(id) {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// =========================================
// BERANDA (HOME)
// =========================================
async function saveHome() {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  const note = document.getElementById('home-note').value;
  try {
    await db.ref(`monitoring/${currentUser.uid}/home/note`).set(note);
    showNotification('✅ Catatan disimpan!', 'success');
    loadHome();
  } catch (error) {
    showNotification('❌ Gagal simpan: ' + error.message, 'error');
  }
}

async function loadHome() {
  if (!authReady) return;
  
  try {
    const snap = await db.ref(`monitoring/${currentUser.uid}/home/note`).once('value');
    const note = snap.val() || '';
    document.getElementById('home-note').value = note;
    document.getElementById('home-display').innerText = note || 'Belum ada catatan.';
  } catch (error) {
    console.error('Load home error:', error);
  }
}

// =========================================
// LINKS
// =========================================
async function saveLink() {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  const name = document.getElementById('new-link-name').value;
  if (!name) return showNotification('⚠️ Nama link harus diisi!', 'error');
  
  const data = {
    name: name,
    user: document.getElementById('new-link-user').value || '',
    pass: document.getElementById('new-link-pass').value || '',
    desc: document.getElementById('new-link-desc').value || '',
    timestamp: Date.now()
  };
  
  try {
    await db.ref(`monitoring/${currentUser.uid}/links`).push(data);
    resetLinkForm();
    loadLinks();
    showNotification('✅ Link disimpan!', 'success');
  } catch (error) {
    showNotification('❌ Gagal simpan: ' + error.message, 'error');
  }
}

function resetLinkForm() {
  document.getElementById('new-link-name').value = '';
  document.getElementById('new-link-user').value = '';
  document.getElementById('new-link-pass').value = '';
  document.getElementById('new-link-desc').value = '';
}

async function loadLinks() {
  if (!authReady) return;
  
  try {
    const snap = await db.ref(`monitoring/${currentUser.uid}/links`).once('value');
    const tbody = document.getElementById('links-body');
    tbody.innerHTML = '';
    const data = snap.val();
    if (!data) return;

    Object.keys(data).forEach(key => {
      const item = data[key];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.user || '-'}</td>
        <td>${item.pass ? '****' : '-'}</td>
        <td>${item.desc || '-'}</td>
        <td>
          <button class="btn btn-edit" style="padding:6px;font-size:14px;" onclick='editLink("${key}")'>Edit</button>
          <button class="btn btn-delete" style="padding:6px;font-size:14px;" onclick='deleteLink("${key}")'>Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Load links error:', error);
  }
}

async function editLink(key) {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  try {
    const snap = await db.ref(`monitoring/${currentUser.uid}/links/${key}`).once('value');
    const item = snap.val();
    if (!item) return;
    
    document.getElementById('new-link-name').value = item.name || '';
    document.getElementById('new-link-user').value = item.user || '';
    document.getElementById('new-link-pass').value = item.pass || '';
    document.getElementById('new-link-desc').value = item.desc || '';
    
    if (confirm('Edit link ini? Data lama akan dihapus dan Anda bisa simpan dengan data baru.')) {
      await db.ref(`monitoring/${currentUser.uid}/links/${key}`).remove();
      showNotification('✅ Silakan simpan dengan data baru', 'info');
    } else {
      resetLinkForm();
    }
  } catch (error) {
    showNotification('❌ Gagal edit: ' + error.message, 'error');
  }
}

async function deleteLink(key) {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  if (!confirm('Yakin ingin menghapus link ini?')) return;
  
  try {
    await db.ref(`monitoring/${currentUser.uid}/links/${key}`).remove();
    loadLinks();
    showNotification('🗑️ Link dihapus!', 'success');
  } catch (error) {
    showNotification('❌ Gagal hapus: ' + error.message, 'error');
  }
}

// =========================================
// AGENDA
// =========================================
async function saveAgenda() {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  const date = document.getElementById('agenda-date').value;
  const time = document.getElementById('agenda-time').value;
  const activity = document.getElementById('agenda-activity').value;
  
  if (!date || !time || !activity) return showNotification('⚠️ Isi semua field!', 'error');
  
  try {
    await db.ref(`monitoring/${currentUser.uid}/agenda/${date}`).push({ 
      time, 
      activity,
      timestamp: Date.now()
    });
    showNotification('✅ Agenda disimpan!', 'success');
    loadAgenda();
    
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
    
    if (Notification.permission === "granted") {
      const [h, m] = time.split(':').map(Number);
      const alarmDate = new Date(date);
      alarmDate.setHours(h, m, 0, 0);
      const now = new Date();
      const diff = alarmDate - now;
      
      if (diff > 0) {
        setTimeout(() => {
          new Notification("🔔 Agenda", { body: activity });
        }, diff);
      }
    }
  } catch (error) {
    showNotification('❌ Gagal simpan: ' + error.message, 'error');
  }
}

async function loadAgenda() {
  if (!authReady) return;
  
  const dateInput = document.getElementById('agenda-date');
  const date = dateInput.value || new Date().toISOString().split('T')[0];
  
  if (!dateInput.value) {
    dateInput.value = date;
  }
  
  try {
    const snap = await db.ref(`monitoring/${currentUser.uid}/agenda/${date}`).once('value');
    const container = document.getElementById('agenda-list');
    container.innerHTML = `<h3>Agenda ${new Date(date).toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</h3>`;
    
    const data = snap.val();
    if (!data) {
      container.innerHTML += '<p style="margin-top:10px;">Belum ada agenda.</p>';
      return;
    }

    const sortedData = Object.entries(data).sort((a, b) => a[1].time.localeCompare(b[1].time));

    sortedData.forEach(([key, item]) => {
      const div = document.createElement('div');
      div.className = 'agenda-item';
      div.innerHTML = `
        <strong>🕐 ${item.time}</strong><br>
        ${item.activity}
        <button class="btn btn-delete" style="margin-top:8px;padding:6px;font-size:14px;width:100%;" 
          onclick='deleteAgenda("${date}", "${key}")'>Hapus</button>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Load agenda error:', error);
  }
}

async function deleteAgenda(dateKey, key) {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  
  if (!confirm('Yakin ingin menghapus agenda ini?')) return;
  
  try {
    await db.ref(`monitoring/${currentUser.uid}/agenda/${dateKey}/${key}`).remove();
    loadAgenda();
    showNotification('🗑️ Agenda dihapus!', 'success');
  } catch (error) {
    showNotification('❌ Gagal hapus: ' + error.message, 'error');
  }
}

// =========================================
// PLANNING
// =========================================
function showPlanning(type) {
  currentPlanningType = type;
  document.getElementById('planning-form').style.display = 'block';
  loadPlanning(type);
}

async function loadPlanning(type) {
  if (!authReady) return;
  
  try {
    const snap = await db.ref(`monitoring/${currentUser.uid}/planning/${type}`).once('value');
    const text = snap.val() || '';
    document.getElementById('planning-text').value = text;
    const titles = { past: 'Masa Lalu', present: 'Masa Sekarang', future: 'Masa Depan' };
    document.getElementById('planning-display').innerHTML = 
      `<h3>${titles[type]}</h3><p style="margin-top:8px;">${text || 'Belum ada rencana.'}</p>`;
  } catch (error) {
    console.error('Load planning error:', error);
  }
}

async function savePlanning() {
  if (!authReady) return showNotification('⚠️ Anda belum login!', 'error');
  if (!currentPlanningType) return showNotification('⚠️ Pilih dulu jenis planning!', 'error');
  
  const text = document.getElementById('planning-text').value;
  
  try {
    await db.ref(`monitoring/${currentUser.uid}/planning/${currentPlanningType}`).set(text);
    showNotification('✅ Rencana disimpan!', 'success');
    loadPlanning(currentPlanningType);
  } catch (error) {
    showNotification('❌ Gagal simpan: ' + error.message, 'error');
  }
}

// =========================================
// LOAD ALL DATA
// =========================================
async function loadAllData() {
  loadHome();
  loadLinks();
  loadAgenda();
}

// =========================================
// INITIALIZATION
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('agenda-date').value = today;
  
  document.getElementById('agenda-date').addEventListener('change', loadAgenda);
  
  const waitForAuth = setInterval(() => {
    if (authReady && currentUser) {
      clearInterval(waitForAuth);
      loadAllData();
    }
  }, 100);
});
