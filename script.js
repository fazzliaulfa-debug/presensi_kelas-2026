// ============================================================
// ⚙️ KONFIGURASI — URL APPS SCRIPT TERBARU
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbwBeM_REPIXyfwq3GIh6aRnFlxuhFx5CmtU3tIJRvDvbi-PCiCzmDGsFudi97ZldCGP/exec';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bKZdEl3egxhoBC0YmVOPEWSKjb0yiubPEprMdkU_ib4/edit';

// ============================================================
// STATE
// ============================================================
let students = [];
let html5QrCode = null;
let isScanning = false;
let lastScanned = { nim: '', time: 0 };

// ============================================================
// DOM
// ============================================================
const $ = id => document.getElementById(id);
const qrDisplay = $('qrDisplay');
const refreshBtn = $('refreshBtn');// ============================================================
// ⚙️ KONFIGURASI — URL APPS SCRIPT TERBARU
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbwBeM_REPIXyfwq3GIh6aRnFlxuhFx5CmtU3tIJRvDvbi-PCiCzmDGsFudi97ZldCGP/exec';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bKZdEl3egxhoBC0YmVOPEWSKjb0yiubPEprMdkU_ib4/edit';

// ============================================================
// STATE
// ============================================================
let students = [];
let html5QrCode = null;
let isScanning = false;
let lastScanned = { nim: '', time: 0 };

// ============================================================
// DOM
// ============================================================
const $ = id => document.getElementById(id);
const qrDisplay = $('qrDisplay');
const refreshBtn = $('refreshBtn');
const downloadQrBtn = $('downloadQrBtn');
const openSheetBtn = $('openSheetBtn');
const resetBtn = $('resetBtn');
const generateQrBtn = $('generateQrBtn');
const nimInput = $('nimInput');
const scannerContainer = $('scannerContainer');
const scanBtn = $('scanBtn');
const stopScanBtn = $('stopScanBtn');
const scanStatus = $('scanStatus');
const studentCount = $('studentCount');
const studentTableBody = $('studentTableBody');
const connectionDot = $('connectionDot');
const connectionMsg = $('connectionMsg');
const toast = $('toast');

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;
function showToast(msg, type = 'info') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// CONNECTION STATUS
// ============================================================
function setConnection(state, msg) {
  connectionDot.className = 'dot ' + state;
  connectionMsg.textContent = msg;
}

// ============================================================
// FETCH DATA DARI GOOGLE SHEETS
// ============================================================
async function loadStudents() {
  setConnection('loading', 'Memuat data dari Google Sheets...');
  try {
    const res = await fetch(`${API_URL}?action=getStudents&t=${Date.now()}`);
    const json = await res.json();

    if (json.status === 'success') {
      students = json.data;
      renderStudents();
      setConnection('', `Terhubung • ${students.length} mahasiswa`);
    } else {
      throw new Error(json.message);
    }

  } catch (err) {
    console.error(err);
    setConnection('offline', 'Gagal terhubung: ' + err.message);
    showToast('Gagal memuat data', 'error');
  }
}

// ============================================================
// RENDER TABEL (TERMASUK MATA KULIAH)
// ============================================================
function renderStudents() {
  const total = students.length;
  const hadir = students.filter(s => s.Status === 'Hadir').length;

  studentCount.textContent = `${hadir}/${total} hadir`;

  if (total === 0) {
    studentTableBody.innerHTML =
      `<tr><td colspan="7" class="empty-state">Belum ada data mahasiswa</td></tr>`;
    return;
  }

  studentTableBody.innerHTML = students.map(s => {

    // Mengecek berbagai variasi nama properti JSON dari Apps Script
    const mataKuliah =
      s['Mata Kuliah'] ||
      s.MataKuliah ||
      s.matakuliah ||
      s.mata_kuliah ||
      '-';

    // Format Waktu Hadir
    const waktuHadir = formatWaktuHadir(s['Waktu Hadir']);

    return `
      <tr>
        <td>${escapeHtml(s.NIM)}</td>

        <td>${escapeHtml(s.Nama)}</td>

        <td>${escapeHtml(s.Kelas)}</td>

        <td>${escapeHtml(s.Jurusan)}</td>

        <td>
          <span class="status-badge ${
            s.Status === 'Hadir'
              ? 'status-hadir'
              : 'status-menunggu'
          }">
            ${escapeHtml(s.Status || 'Menunggu')}
          </span>
        </td>

        <td>${escapeHtml(waktuHadir)}</td>

        <td>${escapeHtml(mataKuliah)}</td>
      </tr>
    `;

  }).join('');
}

// ============================================================
// FORMAT WAKTU HADIR
// ============================================================
function formatWaktuHadir(waktu) {

  if (!waktu || waktu === '-') {
    return '-';
  }

  const teks = String(waktu).trim();

  // Jika data berbentuk:
  // Wed Sep 16 2026 21:29:58 GMT+0700 (Western Indonesia Time)
  const cocok = teks.match(
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/
  );

  if (cocok) {

    const bulan = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12'
    };

    return `${String(cocok[2]).padStart(2, '0')}/${bulan[cocok[1]]}/${cocok[3]} ${cocok[4]}:${cocok[5]}:${cocok[6]}`;
  }

  // Jika format tanggal berbeda, coba menggunakan Date
  const date = new Date(teks);

  if (!isNaN(date.getTime())) {

    const tanggal = String(date.getDate()).padStart(2, '0');
    const bulan = String(date.getMonth() + 1).padStart(2, '0');
    const tahun = date.getFullYear();

    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');
    const detik = String(date.getSeconds()).padStart(2, '0');

    return `${tanggal}/${bulan}/${tahun} ${jam}:${menit}:${detik}`;
  }

  return teks;
}

// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// ============================================================
// GENERATE QR CODE
// ============================================================
function generateQrCode(nama) {

  const targetNama =
    (nama || nimInput.value || '').trim();

  if (!targetNama) {
    showToast(
      'Ketik nama mahasiswa terlebih dahulu',
      'error'
    );
    return;
  }

  // Cari mahasiswa berdasarkan Nama
  const student = students.find(s =>
    String(s.Nama || '')
      .trim()
      .toLowerCase() === targetNama.toLowerCase()
  );

  if (!student) {
    showToast(
      `Nama "${targetNama}" tidak ditemukan`,
      'error'
    );
    return;
  }

  // QR tetap berisi NIM
  const targetNim =
    String(student.NIM || '').trim();

  if (!targetNim) {
    showToast(
      'NIM mahasiswa tidak ditemukan',
      'error'
    );
    return;
  }

  QRCode.toDataURL(
    String(targetNim),
    {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    },
    (err, url) => {

      if (err) {
        showToast(
          'Gagal generate QR',
          'error'
        );
        return;
      }

      qrDisplay.innerHTML =
        `<img src="${url}" alt="QR ${targetNama}">`;

      qrDisplay.dataset.currentNim =
        targetNim;

      showToast(
        `QR untuk ${student.Nama} berhasil dibuat`,
        'success'
      );
    }
  );
}

// ============================================================
// DOWNLOAD QR
// ============================================================
function downloadQr() {

  const img =
    qrDisplay.querySelector('img');

  if (!img) {
    showToast(
      'Generate QR terlebih dahulu',
      'error'
    );
    return;
  }

  const link =
    document.createElement('a');

  link.download =
    `QR-${qrDisplay.dataset.currentNim || 'presensi'}.png`;

  link.href = img.src;

  link.click();
}

// ============================================================
// SCAN QR
// ============================================================
async function startScan() {

  if (isScanning) return;

  scannerContainer.style.display = 'block';

  scanBtn.classList.add('hidden');

  stopScanBtn.classList.remove('hidden');

  scanStatus.textContent =
    'Arahkan kamera ke QR Code...';

  try {

    html5QrCode =
      new Html5Qrcode('qrReader');

    await html5QrCode.start(

      // KAMERA BELAKANG
      { facingMode: 'environment' },

      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        }
      },

      onScanSuccess,

      () => {} // abaikan error frame
    );

    isScanning = true;

  } catch (err) {

    console.error(err);

    scanStatus.textContent =
      '❌ Gagal akses kamera: ' +
      err.message;

    showToast(
      'Gagal akses kamera. Pastikan HTTPS & izin kamera.',
      'error'
    );

    stopScan();
  }
}

// ============================================================
// SAAT QR BERHASIL DIBACA
// ============================================================
async function onScanSuccess(decodedText) {

  const nim =
    decodedText.trim();

  const now =
    Date.now();

  // Cegah scan berulang dalam 3 detik
  if (
    lastScanned.nim === nim &&
    now - lastScanned.time < 3000
  ) {
    return;
  }

  lastScanned = {
    nim,
    time: now
  };

  scanStatus.textContent =
    `📷 Terdeteksi: ${nim}`;

  await sendPresensi(nim);
}

// ============================================================
// KIRIM PRESENSI
// ============================================================
async function sendPresensi(nim) {

  try {

    setConnection(
      'loading',
      `Memproses NIM ${nim}...`
    );

    const res = await fetch(
      `${API_URL}?action=presensi&nim=${encodeURIComponent(nim)}&t=${Date.now()}`
    );

    const json =
      await res.json();

    if (json.status === 'success') {

      showToast(
        `✅ ${json.nama} — Hadir (${json.waktu})`,
        'success'
      );

      scanStatus.textContent =
        `✅ ${json.nama} berhasil presensi`;

    } else if (json.status === 'info') {

      showToast(
        `ℹ️ ${json.nama} sudah presensi (${json.waktu})`,
        'info'
      );

      scanStatus.textContent =
        `ℹ️ ${json.nama} sudah presensi`;

    } else {

      showToast(
        `❌ ${json.message}`,
        'error'
      );

      scanStatus.textContent =
        `❌ ${json.message}`;
    }

    await loadStudents();

  } catch (err) {

    console.error(err);

    showToast(
      'Gagal kirim presensi: ' +
      err.message,
      'error'
    );

    setConnection(
      'offline',
      'Gagal kirim presensi'
    );
  }
}

// ============================================================
// STOP SCAN
// ============================================================
async function stopScan() {

  if (html5QrCode) {

    try {

      await html5QrCode.stop();

      html5QrCode.clear();

    } catch (e) {
      /* ignore */
    }

    html5QrCode = null;
  }

  scannerContainer.style.display =
    'none';

  scanBtn.classList.remove('hidden');

  stopScanBtn.classList.add('hidden');

  isScanning = false;
}

// ============================================================
// RESET PRESENSI
// ============================================================
async function resetPresensi() {

  if (
    !confirm(
      'Yakin reset semua status presensi ke "Menunggu"?'
    )
  ) {
    return;
  }

  try {

    setConnection(
      'loading',
      'Mereset presensi...'
    );

    const res = await fetch(
      `${API_URL}?action=reset&t=${Date.now()}`
    );

    const json =
      await res.json();

    if (json.status === 'success') {

      showToast(
        '✅ Presensi berhasil direset',
        'success'
      );

      await loadStudents();

    } else {

      throw new Error(
        json.message
      );
    }

  } catch (err) {

    showToast(
      'Gagal reset: ' +
      err.message,
      'error'
    );

    setConnection(
      'offline',
      'Gagal reset'
    );
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
refreshBtn.addEventListener(
  'click',
  loadStudents
);

downloadQrBtn.addEventListener(
  'click',
  downloadQr
);

openSheetBtn.addEventListener(
  'click',
  () => window.open(
    SHEET_URL,
    '_blank'
  )
);

resetBtn.addEventListener(
  'click',
  resetPresensi
);

generateQrBtn.addEventListener(
  'click',
  () => generateQrCode()
);

scanBtn.addEventListener(
  'click',
  startScan
);

stopScanBtn.addEventListener(
  'click',
  stopScan
);

// Klik area QR → regenerate QR mahasiswa pertama
qrDisplay.addEventListener(
  'click',
  () => generateQrCode()
);

// Enter di input Nama → generate
nimInput.addEventListener(
  'keypress',
  e => {
    if (e.key === 'Enter') {
      generateQrCode();
    }
  }
);

// ============================================================
// INIT
// ============================================================
loadStudents().then(() => {

  if (students.length > 0) {
    generateQrCode(
      students[0].Nama
    );
  }

});
const downloadQrBtn = $('downloadQrBtn');
const openSheetBtn = $('openSheetBtn');
const resetBtn = $('resetBtn');
const generateQrBtn = $('generateQrBtn');
const nimInput = $('nimInput');
const scannerContainer = $('scannerContainer');
const scanBtn = $('scanBtn');
const stopScanBtn = $('stopScanBtn');
const scanStatus = $('scanStatus');
const studentCount = $('studentCount');
const studentTableBody = $('studentTableBody');
const connectionDot = $('connectionDot');
const connectionMsg = $('connectionMsg');
const toast = $('toast');

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;
function showToast(msg, type = 'info') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// CONNECTION STATUS
// ============================================================
function setConnection(state, msg) {
  connectionDot.className = 'dot ' + state;
  connectionMsg.textContent = msg;
}

// ============================================================
// FETCH DATA DARI GOOGLE SHEETS
// ============================================================
async function loadStudents() {
  setConnection('loading', 'Memuat data dari Google Sheets...');
  try {
    const res = await fetch(`${API_URL}?action=getStudents&t=${Date.now()}`);
    const json = await res.json();
    if (json.status === 'success') {
      students = json.data;
      renderStudents();
      setConnection('', `Terhubung • ${students.length} mahasiswa`);
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    console.error(err);
    setConnection('offline', 'Gagal terhubung: ' + err.message);
    showToast('Gagal memuat data', 'error');
  }
}

// ============================================================
// RENDER TABEL (TERMASUK MATA KULIAH)
// ============================================================
function renderStudents() {
  const total = students.length;
  const hadir = students.filter(s => s.Status === 'Hadir').length;
  studentCount.textContent = `${hadir}/${total} hadir`;

  if (total === 0) {
    studentTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada data mahasiswa</td></tr>`;
    return;
  }

  studentTableBody.innerHTML = students.map(s => {
    // Mengecek berbagai variasi nama properti JSON dari Apps Script
    const mataKuliah = s['Mata Kuliah'] || s.MataKuliah || s.matakuliah || s.mata_kuliah || '-';

    // Format Waktu Hadir menjadi tanggal + jam saja
    const waktuHadir = formatWaktuHadir(s['Waktu Hadir']);

    return `
      <tr>
        <td>${escapeHtml(s.NIM)}</td>
        <td>${escapeHtml(s.Nama)}</td>
        <td>${escapeHtml(s.Kelas)}</td>
        <td>${escapeHtml(s.Jurusan)}</td>
        <td><span class="status-badge ${s.Status === 'Hadir' ? 'status-hadir' : 'status-menunggu'}">${escapeHtml(s.Status || 'Menunggu')}</span></td>
        <td>${escapeHtml(waktuHadir)}</td>
        <td>${escapeHtml(mataKuliah)}</td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// FORMAT WAKTU HADIR
// ============================================================
function formatWaktuHadir(waktu) {
  if (!waktu) return '-';

  const date = new Date(waktu);

  if (isNaN(date.getTime())) {
    return String(waktu);
  }

  const tanggal = String(date.getDate()).padStart(2, '0');
  const bulan = String(date.getMonth() + 1).padStart(2, '0');
  const tahun = date.getFullYear();

  const jam = String(date.getHours()).padStart(2, '0');
  const menit = String(date.getMinutes()).padStart(2, '0');
  const detik = String(date.getSeconds()).padStart(2, '0');

  return `${tanggal}/${bulan}/${tahun} ${jam}:${menit}:${detik}`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// ============================================================
// GENERATE QR CODE
// ============================================================
function generateQrCode(nama) {
  const targetNama = (nama || nimInput.value || '').trim();

  if (!targetNama) {
    showToast('Ketik nama mahasiswa terlebih dahulu', 'error');
    return;
  }

  // Cari mahasiswa berdasarkan Nama
  const student = students.find(s =>
    String(s.Nama || '').trim().toLowerCase() === targetNama.toLowerCase()
  );

  if (!student) {
    showToast(`Nama "${targetNama}" tidak ditemukan`, 'error');
    return;
  }

  // QR tetap berisi NIM agar sistem presensi yang lama tetap berjalan
  const targetNim = String(student.NIM || '').trim();

  if (!targetNim) {
    showToast('NIM mahasiswa tidak ditemukan', 'error');
    return;
  }

  QRCode.toDataURL(String(targetNim), {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H'
  }, (err, url) => {
    if (err) {
      showToast('Gagal generate QR', 'error');
      return;
    }

    qrDisplay.innerHTML = `<img src="${url}" alt="QR ${targetNama}">`;
    qrDisplay.dataset.currentNim = targetNim;
    showToast(`QR untuk ${student.Nama} berhasil dibuat`, 'success');
  });
}

// ============================================================
// DOWNLOAD QR
// ============================================================
function downloadQr() {
  const img = qrDisplay.querySelector('img');
  if (!img) {
    showToast('Generate QR terlebih dahulu', 'error');
    return;
  }
  const link = document.createElement('a');
  link.download = `QR-${qrDisplay.dataset.currentNim || 'presensi'}.png`;
  link.href = img.src;
  link.click();
}

// ============================================================
// SCAN QR
// ============================================================
async function startScan() {
  if (isScanning) return;
  scannerContainer.style.display = 'block';
  scanBtn.classList.add('hidden');
  stopScanBtn.classList.remove('hidden');
  scanStatus.textContent = 'Arahkan kamera ke QR Code...';

  try {
    html5QrCode = new Html5Qrcode('qrReader');
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {} // abaikan error frame
    );
    isScanning = true;
  } catch (err) {
    console.error(err);
    scanStatus.textContent = '❌ Gagal akses kamera: ' + err.message;
    showToast('Gagal akses kamera. Pastikan HTTPS & izin kamera.', 'error');
    stopScan();
  }
}

async function onScanSuccess(decodedText) {
  const nim = decodedText.trim();
  const now = Date.now();

  // Cegah scan berulang dalam 3 detik
  if (lastScanned.nim === nim && now - lastScanned.time < 3000) return;
  lastScanned = { nim, time: now };

  scanStatus.textContent = `📷 Terdeteksi: ${nim}`;
  await sendPresensi(nim);
}

async function sendPresensi(nim) {
  try {
    setConnection('loading', `Memproses NIM ${nim}...`);
    const res = await fetch(
      `${API_URL}?action=presensi&nim=${encodeURIComponent(nim)}&t=${Date.now()}`
    );
    const json = await res.json();

    if (json.status === 'success') {
      showToast(`✅ ${json.nama} — Hadir (${json.waktu})`, 'success');
      scanStatus.textContent = `✅ ${json.nama} berhasil presensi`;
    } else if (json.status === 'info') {
      showToast(`ℹ️ ${json.nama} sudah presensi (${json.waktu})`, 'info');
      scanStatus.textContent = `ℹ️ ${json.nama} sudah presensi`;
    } else {
      showToast(`❌ ${json.message}`, 'error');
      scanStatus.textContent = `❌ ${json.message}`;
    }
    await loadStudents();
  } catch (err) {
    console.error(err);
    showToast('Gagal kirim presensi: ' + err.message, 'error');
    setConnection('offline', 'Gagal kirim presensi');
  }
}

async function stopScan() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) { /* ignore */ }
    html5QrCode = null;
  }
  scannerContainer.style.display = 'none';
  scanBtn.classList.remove('hidden');
  stopScanBtn.classList.add('hidden');
  isScanning = false;
}

// ============================================================
// RESET PRESENSI
// ============================================================
async function resetPresensi() {
  if (!confirm('Yakin reset semua status presensi ke "Menunggu"?')) return;
  try {
    setConnection('loading', 'Mereset presensi...');
    const res = await fetch(`${API_URL}?action=reset&t=${Date.now()}`);
    const json = await res.json();
    if (json.status === 'success') {
      showToast('✅ Presensi berhasil direset', 'success');
      await loadStudents();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    showToast('Gagal reset: ' + err.message, 'error');
    setConnection('offline', 'Gagal reset');
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
refreshBtn.addEventListener('click', loadStudents);
downloadQrBtn.addEventListener('click', downloadQr);
openSheetBtn.addEventListener('click', () => window.open(SHEET_URL, '_blank'));
resetBtn.addEventListener('click', resetPresensi);
generateQrBtn.addEventListener('click', () => generateQrCode());
scanBtn.addEventListener('click', startScan);
stopScanBtn.addEventListener('click', stopScan);

// Klik area QR → regenerate QR mahasiswa pertama
qrDisplay.addEventListener('click', () => generateQrCode());

// Enter di input Nama → generate
nimInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') generateQrCode();
});

// ============================================================
// INIT
// ============================================================
loadStudents().then(() => {
  if (students.length > 0) {
    generateQrCode(students[0].Nama);
  }
});
