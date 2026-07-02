/* ================================================================
 * Audit Progress Tracker — KAP KBS (v2) — Frontend
 * ================================================================ */

// ---------- KONFIGURASI (WAJIB DIISI) ----------
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz2F8HMgvLfFbttjtcc4x1KOoxfsbtavBj_NV2JQXKBdbv5W2Etzut4EgLD_ezYBAtVBw/exec'; // https://script.google.com/macros/s/.../exec
const GOOGLE_CLIENT_ID = '331125203639-vatl2f5456jq27i86hctknpjvnscltmi.apps.googleusercontent.com';

// ---------- State ----------
let session = null;          // { sessionToken, nama, role, email }
let currentClientId = null;  // klien yang sedang dibuka
let currentTaskData = null;  // hasil getTasks terakhir
let pendingReject = null;    // { taskId, level }
let pendingAssign = null;    // { taskId }

// ---------- Util ----------
const $ = (sel) => document.querySelector(sel);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(msg, type = 'danger') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.innerHTML = `<div class="d-flex">
    <div class="toast-body">${esc(msg)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
  </div>`;
  $('#toast-container').appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 4000 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function spinner(text = 'Memuat...') {
  return `<div class="text-center text-muted py-5">
    <div class="spinner-border text-primary mb-2"></div>
    <div>${esc(text)}</div>
  </div>`;
}

function relativeTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  if (s < 2592000) return Math.floor(s / 86400) + ' hari lalu';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return esc(String(v));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(s) {
  const map = { 'Belum': 'secondary', 'Proses': 'warning text-dark', 'Selesai': 'info text-dark' };
  return `<span class="badge bg-${map[s] || 'secondary'}">${esc(s)}</span>`;
}

function reviewBadge(s) {
  if (s === 'Approved') return '<span class="badge bg-success">Approved</span>';
  if (s === 'Rejected') return '<span class="badge bg-danger">Rejected</span>';
  if (s === 'Menunggu Review') return '<span class="badge bg-warning text-dark">Menunggu Review</span>';
  return '<span class="badge bg-light text-muted border">-</span>';
}

// ---------- Fetch wrapper ----------
async function api(action, payload = {}, opts = {}) {
  const body = { action, payload };
  if (session) body.sessionToken = session.sessionToken;
  let res;
  try {
    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // hindari preflight CORS
      body: JSON.stringify(body)
    });
    res = await r.json();
  } catch (err) {
    throw new Error('Gagal terhubung ke server: ' + err.message);
  }
  if (!res.ok) {
    if (String(res.error || '').startsWith('Sesi berakhir')) {
      logout('Sesi berakhir, silakan login ulang.');
      throw new Error(res.error);
    }
    throw new Error(res.error || 'Terjadi kesalahan');
  }
  return res.data;
}

// ---------- Login / logout ----------
function gisLoaded() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onGoogleCredential
  });
  google.accounts.id.renderButton($('#gsi-button'), {
    theme: 'filled_blue', size: 'large', text: 'signin_with', shape: 'pill'
  });
}

async function onGoogleCredential(resp) {
  $('#login-status').textContent = 'Memverifikasi akun...';
  try {
    const data = await api('login', { credential: resp.credential });
    session = data;
    sessionStorage.setItem('kbs_session', JSON.stringify(session));
    showApp();
  } catch (err) {
    $('#login-status').textContent = '';
    toast(err.message);
  }
}

function logout(msg) {
  session = null;
  sessionStorage.removeItem('kbs_session');
  $('#view-app').classList.add('d-none');
  $('#view-login').classList.remove('d-none');
  $('#login-status').textContent = msg || '';
}

// ---------- Shell aplikasi ----------
const TABS_BY_ROLE = {
  Admin: [
    { id: 'clients', label: 'Klien & Task', icon: 'bi-briefcase' },
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-bar-chart' },
    { id: 'users', label: 'Users', icon: 'bi-people' },
    { id: 'logs', label: 'Log Aktivitas', icon: 'bi-journal-text' }
  ],
  Partner: [{ id: 'dashboard', label: 'Dashboard', icon: 'bi-bar-chart' }],
  Manager: [{ id: 'clients', label: 'Klien & Task', icon: 'bi-briefcase' }],
  Ketua: [{ id: 'clients', label: 'Klien & Task', icon: 'bi-briefcase' }],
  Anggota: [{ id: 'clients', label: 'Task Saya', icon: 'bi-list-check' }]
};

function showApp() {
  $('#view-login').classList.add('d-none');
  $('#view-app').classList.remove('d-none');
  $('#nav-nama').textContent = session.nama;
  $('#nav-role').textContent = session.role;

  const tabs = TABS_BY_ROLE[session.role] || TABS_BY_ROLE.Anggota;
  $('#main-tabs').innerHTML = tabs.map((t, i) => `
    <li class="nav-item">
      <button class="nav-link ${i === 0 ? 'active' : ''}" data-tab="${t.id}">
        <i class="bi ${t.icon} me-1"></i>${t.label}
      </button>
    </li>`).join('');
  $('#main-tabs').querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#main-tabs').querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      openTab(btn.dataset.tab);
    });
  });
  openTab(tabs[0].id);
}

function openTab(tab) {
  currentClientId = null;
  if (tab === 'clients') return renderClientList();
  if (tab === 'dashboard') return renderDashboard();
  if (tab === 'users') return renderUsers();
  if (tab === 'logs') return renderLogs();
}

// ---------- View: daftar klien ----------
async function renderClientList() {
  const c = $('#main-content');
  c.innerHTML = spinner('Memuat daftar klien...');
  let clients;
  try {
    clients = await api('getClients');
  } catch (err) { c.innerHTML = errorBox(err.message); return; }

  const addBtn = session.role === 'Admin'
    ? `<button class="btn btn-primary btn-sm" onclick="openClientModal()">
         <i class="bi bi-plus-lg"></i> Tambah Klien</button>`
    : '';

  if (!clients.length) {
    c.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Daftar Klien</h5>${addBtn}</div>
      <div class="alert alert-secondary">Belum ada klien yang bisa Anda akses.</div>`;
    return;
  }

  c.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Daftar Klien</h5>${addBtn}
    </div>
    <div class="row g-3">
      ${clients.map(cl => clientCard(cl)).join('')}
    </div>`;
}

function clientCard(cl) {
  const st = cl.stats;
  const adminBtns = session.role === 'Admin' ? `
    <button class="btn btn-sm btn-outline-secondary" title="Edit klien"
      onclick='openClientModal(${JSON.stringify(cl).replace(/'/g, "&#39;")})'>
      <i class="bi bi-pencil"></i></button>
    <button class="btn btn-sm btn-outline-danger" title="Hapus klien"
      onclick="deleteClient('${esc(cl.ID_Client)}','${esc(cl.Nama_Perusahaan)}')">
      <i class="bi bi-trash"></i></button>` : '';
  const statusColor = { 'Aktif': 'success', 'Selesai': 'primary', 'Nonaktif': 'secondary' }[cl.Status_Klien] || 'secondary';

  return `
  <div class="col-12 col-md-6 col-xl-4">
    <div class="card h-100 shadow-sm client-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="mb-0">${esc(cl.Nama_Perusahaan)}</h6>
            <small class="text-muted">Tahun Buku ${esc(cl.Tahun_Buku)}</small>
          </div>
          <span class="badge bg-${statusColor}">${esc(cl.Status_Klien)}</span>
        </div>
        <div class="progress my-3" style="height:10px">
          <div class="progress-bar bg-success" style="width:${st.persen}%"></div>
        </div>
        <div class="small text-muted mb-3">
          <strong>${st.persen}%</strong> final (${st.final}/${st.total})
          · Selesai (menunggu review): ${st.selesai} · Proses: ${st.proses} · Belum: ${st.belum}
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-primary flex-grow-1"
            onclick="renderTasks('${esc(cl.ID_Client)}')">
            <i class="bi bi-list-check me-1"></i>Lihat Task
            <span class="badge bg-light text-primary ms-1">${esc(cl.clientRole)}</span>
          </button>
          ${adminBtns}
        </div>
      </div>
    </div>
  </div>`;
}

// ---------- View: task per klien ----------
async function renderTasks(clientId) {
  currentClientId = clientId;
  const c = $('#main-content');
  c.innerHTML = spinner('Memuat task...');
  let data;
  try {
    data = await api('getTasks', { clientId });
  } catch (err) { c.innerHTML = errorBox(err.message); return; }
  currentTaskData = data;

  const grouped = { Planning: [], Execution: [], Reporting: [] };
  data.tasks.forEach(t => (grouped[t.Tahapan] = grouped[t.Tahapan] || []).push(t));

  c.innerHTML = `
    <button class="btn btn-link btn-sm ps-0 mb-2" onclick="renderClientList()">
      <i class="bi bi-arrow-left"></i> Kembali ke daftar klien
    </button>
    <div class="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
      <div>
        <h5 class="mb-0">${esc(data.client.Nama_Perusahaan)}</h5>
        <small class="text-muted">
          Tahun Buku ${esc(data.client.Tahun_Buku)} ·
          Peran Anda: <strong>${esc(data.clientRole)}</strong>
        </small>
      </div>
      <small class="text-muted">
        Manager: ${esc(data.team.manager || '-')} · Ketua: ${esc(data.team.ketua || '-')}
      </small>
    </div>
    ${Object.keys(grouped).map(tahapan => grouped[tahapan].length ? `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white fw-semibold">
          <i class="bi bi-folder2-open me-1 text-primary"></i>${esc(tahapan)}
          <span class="badge bg-secondary ms-1">${grouped[tahapan].length}</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 task-table">
            <thead class="table-light">
              <tr>
                <th>Pekerjaan</th><th>Ditugaskan Ke</th><th>Status</th>
                <th>Review Ketua</th><th>Review Manager</th>
                <th>Due Date</th><th>Update</th><th class="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>${grouped[tahapan].map(taskRow).join('')}</tbody>
          </table>
        </div>
      </div>` : '').join('')}`;
}

function taskRow(t) {
  const final = t.Status_Review_Manager === 'Approved';
  const catatan = t.Catatan
    ? `<div class="small text-danger mt-1"><i class="bi bi-chat-left-text"></i> ${esc(t.Catatan)}</div>`
    : '';
  return `
    <tr class="${final ? 'table-success-subtle task-final' : ''}">
      <td>
        <div class="fw-medium">${esc(t.Nama_Pekerjaan)}
          ${final ? ' <i class="bi bi-lock-fill text-success" title="Final — terkunci"></i>' : ''}
        </div>
        ${catatan}
      </td>
      <td class="small">${esc(t.Ditugaskan_Ke_Email || '-')}</td>
      <td>${statusBadge(t.Status_Pekerjaan)}</td>
      <td>${reviewBadge(t.Status_Review_Ketua)}</td>
      <td>${reviewBadge(t.Status_Review_Manager)}</td>
      <td class="small">${fmtDate(t.Due_Date)}</td>
      <td class="small text-muted" title="oleh ${esc(t.Diupdate_Oleh || '-')}">
        ${relativeTime(t.Tanggal_Update)}</td>
      <td class="text-end"><div class="btn-group-vertical btn-group-sm d-inline-flex gap-1">
        ${taskActions(t)}</div></td>
    </tr>`;
}

function taskActions(t) {
  const role = currentTaskData.clientRole;
  const me = session.email;
  const isOwner = (t.Ditugaskan_Ke_Email || '').toLowerCase() === me;
  const isAdmin = role === 'Admin';
  const final = t.Status_Review_Manager === 'Approved';
  const btns = [];
  const id = esc(t.ID_Task);

  // Pemilik task: ubah Status_Pekerjaan
  if ((isOwner || isAdmin) && !final) {
    if (t.Status_Pekerjaan === 'Belum') {
      btns.push(`<button class="btn btn-warning" onclick="setStatus('${id}','Proses')">
        <i class="bi bi-play-fill"></i> Mulai</button>`);
    } else if (t.Status_Pekerjaan === 'Proses') {
      btns.push(`<button class="btn btn-info" onclick="setStatus('${id}','Selesai')">
        <i class="bi bi-check-lg"></i> Selesai</button>`);
      if (t.Status_Review_Ketua === '-' && t.Status_Review_Manager === '-') {
        btns.push(`<button class="btn btn-outline-secondary" onclick="setStatus('${id}','Belum')">
          <i class="bi bi-arrow-counterclockwise"></i> Ke Belum</button>`);
      }
    }
  }

  // Ketua: review task anggota
  if ((role === 'Ketua' || isAdmin) && t.Status_Review_Ketua === 'Menunggu Review') {
    btns.push(`<button class="btn btn-success" onclick="review('${id}','ketua','Approved')">
      <i class="bi bi-hand-thumbs-up"></i> Approve (Ketua)</button>`);
    btns.push(`<button class="btn btn-outline-danger" onclick="openReject('${id}','ketua','${esc(t.Nama_Pekerjaan)}')">
      <i class="bi bi-hand-thumbs-down"></i> Reject (Ketua)</button>`);
  }

  // Manager: review setelah Ketua approve
  if (role === 'Manager' || isAdmin) {
    if (t.Status_Review_Ketua === 'Approved' && t.Status_Review_Manager === 'Menunggu Review') {
      btns.push(`<button class="btn btn-success" onclick="review('${id}','manager','Approved')">
        <i class="bi bi-hand-thumbs-up"></i> Approve (Manager)</button>`);
      btns.push(`<button class="btn btn-outline-danger" onclick="openReject('${id}','manager','${esc(t.Nama_Pekerjaan)}')">
        <i class="bi bi-hand-thumbs-down"></i> Reject (Manager)</button>`);
    }
    if (final) {
      btns.push(`<button class="btn btn-outline-danger" onclick="openReject('${id}','manager','${esc(t.Nama_Pekerjaan)}')">
        <i class="bi bi-unlock"></i> Buka Kembali</button>`);
    }
    if (!final) {
      btns.push(`<button class="btn btn-outline-primary"
        onclick="openAssign('${id}','${esc(t.Ditugaskan_Ke_Email || '')}','${esc(t.Due_Date || '')}','${esc(t.Nama_Pekerjaan)}')">
        <i class="bi bi-person-plus"></i> Tugaskan</button>`);
    }
  }

  return btns.join('') || '<span class="text-muted small">—</span>';
}

async function setStatus(taskId, status) {
  try {
    await api('updateTaskStatus', { taskId, status });
    toast('Status diperbarui', 'success');
    renderTasks(currentClientId);
  } catch (err) { toast(err.message); }
}

async function review(taskId, level, decision, catatan) {
  try {
    await api('reviewTask', { taskId, level, decision, catatan: catatan || '' });
    toast(decision === 'Approved' ? 'Task di-approve' : 'Task ditolak', 'success');
    renderTasks(currentClientId);
  } catch (err) { toast(err.message); }
}

// --- Reject modal ---
function openReject(taskId, level, taskName) {
  pendingReject = { taskId, level };
  $('#reject-task-name').textContent = taskName;
  $('#reject-catatan').value = '';
  bootstrap.Modal.getOrCreateInstance($('#modal-reject')).show();
}

// --- Assign modal ---
function openAssign(taskId, currentEmail, currentDue, taskName) {
  pendingAssign = { taskId };
  $('#assign-task-name').textContent = taskName;
  const team = currentTaskData.team;
  const options = ['<option value="">— (belum ditugaskan) —</option>'];
  const all = [team.ketua, ...team.anggota].filter(Boolean);
  all.forEach(e => {
    const sel = e === (currentEmail || '').toLowerCase() ? 'selected' : '';
    options.push(`<option value="${esc(e)}" ${sel}>${esc(e)}${e === team.ketua ? ' (Ketua)' : ''}</option>`);
  });
  $('#assign-email').innerHTML = options.join('');
  let due = '';
  if (currentDue) {
    const d = new Date(currentDue);
    if (!isNaN(d)) due = d.toISOString().slice(0, 10);
  }
  $('#assign-due').value = due;
  bootstrap.Modal.getOrCreateInstance($('#modal-assign')).show();
}

// ---------- View: dashboard (Partner/Admin) ----------
async function renderDashboard() {
  const c = $('#main-content');
  c.innerHTML = spinner('Memuat dashboard...');
  let clients;
  try {
    clients = await api('getDashboard');
  } catch (err) { c.innerHTML = errorBox(err.message); return; }

  if (!clients.length) {
    c.innerHTML = '<div class="alert alert-secondary">Belum ada klien.</div>';
    return;
  }

  c.innerHTML = `
    <h5 class="mb-3">Dashboard Progres Audit</h5>
    <div class="row g-3">
      ${clients.map(cl => {
        const st = cl.stats;
        return `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <h6 class="mb-0">${esc(cl.Nama_Perusahaan)}</h6>
                <span class="badge bg-secondary">${esc(cl.Tahun_Buku)}</span>
              </div>
              <div class="progress my-3" style="height:14px">
                <div class="progress-bar bg-success" style="width:${st.persen}%">${st.persen}%</div>
              </div>
              <div class="small text-muted mb-2">
                Final: <strong>${st.final}/${st.total}</strong>
                · Selesai (menunggu review): ${st.selesai}
                · Proses: ${st.proses} · Belum: ${st.belum}
              </div>
              <div class="d-flex gap-2 flex-wrap">
                ${['Planning', 'Execution', 'Reporting'].map(th => {
                  const p = st.perTahapan[th] || { total: 0, final: 0 };
                  return `<span class="badge bg-light text-dark border">
                    ${th}: ${p.final}/${p.total}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ---------- View: users (Admin) ----------
async function renderUsers() {
  const c = $('#main-content');
  c.innerHTML = spinner('Memuat users...');
  let users;
  try {
    users = await api('adminListUsers');
  } catch (err) { c.innerHTML = errorBox(err.message); return; }

  c.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Master User</h5>
      <button class="btn btn-primary btn-sm" onclick="openUserModal()">
        <i class="bi bi-plus-lg"></i> Tambah User</button>
    </div>
    <div class="card shadow-sm"><div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light"><tr>
          <th>Email</th><th>Nama</th><th>Role</th><th>Status</th><th class="text-end">Aksi</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td>${esc(u.Email)}</td>
            <td>${esc(u.Nama)}</td>
            <td><span class="badge bg-primary">${esc(u.Role)}</span></td>
            <td><span class="badge bg-${u.Status === 'Aktif' ? 'success' : 'secondary'}">${esc(u.Status)}</span></td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-secondary"
                onclick="openUserModal('${esc(u.Email)}','${esc(u.Nama)}','${esc(u.Role)}','${esc(u.Status)}')">
                <i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger"
                onclick="deleteUser('${esc(u.Email)}')">
                <i class="bi bi-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>`;
}

function openUserModal(email, nama, role, status) {
  $('#user-modal-title').textContent = email ? 'Edit User' : 'Tambah User';
  $('#user-email').value = email || '';
  $('#user-email').readOnly = !!email;
  $('#user-nama').value = nama || '';
  $('#user-role').value = role || 'Anggota';
  $('#user-status').value = status || 'Aktif';
  bootstrap.Modal.getOrCreateInstance($('#modal-user')).show();
}

async function deleteUser(email) {
  if (!confirm('Hapus user ' + email + '?')) return;
  try {
    await api('adminDeleteUser', { email });
    toast('User dihapus', 'success');
    renderUsers();
  } catch (err) { toast(err.message); }
}

// ---------- View: klien modal (Admin) ----------
function openClientModal(cl) {
  $('#client-modal-title').textContent = cl ? 'Edit Klien' : 'Tambah Klien';
  $('#client-id').value = cl ? cl.ID_Client : '';
  $('#client-nama').value = cl ? cl.Nama_Perusahaan : '';
  $('#client-tahun').value = cl ? cl.Tahun_Buku : '';
  $('#client-manager').value = cl ? cl.Email_Manager : '';
  $('#client-ketua').value = cl ? cl.Email_Ketua : '';
  $('#client-anggota').value = cl ? cl.Email_Anggota : '';
  $('#client-status').value = cl ? cl.Status_Klien : 'Aktif';
  $('#client-new-hint').classList.toggle('d-none', !!cl);
  bootstrap.Modal.getOrCreateInstance($('#modal-client')).show();
}

async function deleteClient(idClient, nama) {
  if (!confirm('Hapus klien "' + nama + '" beserta seluruh task-nya?')) return;
  try {
    await api('adminDeleteClient', { idClient });
    toast('Klien dihapus', 'success');
    renderClientList();
  } catch (err) { toast(err.message); }
}

// ---------- View: log aktivitas (Admin) ----------
async function renderLogs() {
  const c = $('#main-content');
  c.innerHTML = spinner('Memuat log...');
  let logs;
  try {
    logs = await api('adminGetLogs');
  } catch (err) { c.innerHTML = errorBox(err.message); return; }

  c.innerHTML = `
    <h5 class="mb-3">Log Aktivitas <small class="text-muted fs-6">(200 terakhir)</small></h5>
    <div class="card shadow-sm"><div class="table-responsive">
      <table class="table table-sm table-hover align-middle mb-0 small">
        <thead class="table-light"><tr>
          <th>Waktu</th><th>Email</th><th>Action</th><th>ID</th><th>Detail</th>
        </tr></thead>
        <tbody>
          ${logs.map(l => `
          <tr>
            <td class="text-nowrap" title="${esc(l.Timestamp)}">${relativeTime(l.Timestamp)}</td>
            <td>${esc(l.Email)}</td>
            <td><span class="badge bg-light text-dark border">${esc(l.Action)}</span></td>
            <td class="text-truncate" style="max-width:120px">${esc(l['ID_Task/ID_Client'])}</td>
            <td>${esc(l.Detail)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div></div>`;
}

function errorBox(msg) {
  return `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-1"></i>${esc(msg)}</div>`;
}

// ---------- Event binding ----------
document.addEventListener('DOMContentLoaded', () => {
  $('#btn-logout').addEventListener('click', () => logout());

  $('#reject-submit').addEventListener('click', async () => {
    const catatan = $('#reject-catatan').value.trim();
    if (!catatan) { toast('Catatan wajib diisi saat reject'); return; }
    bootstrap.Modal.getInstance($('#modal-reject')).hide();
    await review(pendingReject.taskId, pendingReject.level, 'Rejected', catatan);
  });

  $('#assign-submit').addEventListener('click', async () => {
    bootstrap.Modal.getInstance($('#modal-assign')).hide();
    try {
      await api('assignTask', {
        taskId: pendingAssign.taskId,
        email: $('#assign-email').value,
        dueDate: $('#assign-due').value
      });
      toast('Penugasan disimpan', 'success');
      renderTasks(currentClientId);
    } catch (err) { toast(err.message); }
  });

  $('#user-submit').addEventListener('click', async () => {
    try {
      await api('adminSaveUser', {
        email: $('#user-email').value,
        nama: $('#user-nama').value,
        role: $('#user-role').value,
        status: $('#user-status').value
      });
      bootstrap.Modal.getInstance($('#modal-user')).hide();
      toast('User disimpan', 'success');
      renderUsers();
    } catch (err) { toast(err.message); }
  });

  $('#client-submit').addEventListener('click', async () => {
    try {
      const res = await api('adminSaveClient', {
        idClient: $('#client-id').value || null,
        namaPerusahaan: $('#client-nama').value,
        tahunBuku: $('#client-tahun').value,
        emailManager: $('#client-manager').value,
        emailKetua: $('#client-ketua').value,
        emailAnggota: $('#client-anggota').value,
        statusKlien: $('#client-status').value
      });
      bootstrap.Modal.getInstance($('#modal-client')).hide();
      toast(res.tasksGenerated
        ? `Klien disimpan, ${res.tasksGenerated} task di-generate`
        : 'Klien disimpan', 'success');
      renderClientList();
    } catch (err) { toast(err.message); }
  });

  // Restore sesi dari sessionStorage bila ada
  const saved = sessionStorage.getItem('kbs_session');
  if (saved) {
    session = JSON.parse(saved);
    showApp();
  } else {
    $('#view-login').classList.remove('d-none');
  }
});
