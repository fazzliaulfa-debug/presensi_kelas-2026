// ============================================================
// ⚙️ KONFIGURASI
// ============================================================

const API_URL =
  'https://script.google.com/macros/s/AKfycbwBeM_REPIXyfwq3GIh6aRnFlxuhFx5CmtU3tIJRvDvbi-PCiCzmDGsFudi97ZldCGP/exec';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1bKZdEl3egxhoBC0YmVOPEWSKjb0yiubPEprMdkU_ib4/edit';


// ============================================================
// STATE
// ============================================================

let students = [];

let html5QrCode = null;

let isScanning = false;

let lastScanned = {
  nim: '',
  time: 0
};

let toastTimer = null;


// ============================================================
// FUNGSI AMBIL ELEMENT
// ============================================================

function $(id) {
  return document.getElementById(id);
}


// ============================================================
// TOAST
// ============================================================

function showToast(message, type = 'info') {

  const toast = $('toast');

  if (!toast) return;

  toast.textContent = message;

  toast.className =
    'toast show ' + type;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove('show');

  }, 3000);
}


// ============================================================
// CONNECTION STATUS
// ============================================================

function setConnection(state, message) {

  const dot =
    $('connectionDot');

  const msg =
    $('connectionMsg');

  if (dot) {

    dot.className =
      'dot ' + state;

  }

  if (msg) {

    msg.textContent =
      message;

  }
}


// ============================================================
// LOAD DATA GOOGLE SHEETS
// ============================================================

async function loadStudents() {

  setConnection(
    'loading',
    'Memuat data dari Google Sheets...'
  );

  try {

    const url =
      API_URL +
      '?action=getStudents&t=' +
      Date.now();

    const response =
      await fetch(url);

    if (!response.ok) {

      throw new Error(
        'HTTP ' + response.status
      );

    }

    const json =
      await response.json();

    console.log(
      'Data Google Sheets:',
      json
    );

    if (
      json.status === 'success'
    ) {

      students =
        Array.isArray(json.data)
          ? json.data
          : [];

      renderStudents();

      setConnection(
        '',
        'Terhubung • ' +
        students.length +
        ' mahasiswa'
      );

      if (
        students.length > 0
      ) {

        generateQrCode(
          students[0].Nama
        );

      }

    } else {

      throw new Error(
        json.message ||
        'Data tidak berhasil dimuat'
      );

    }

  } catch (error) {

    console.error(
      'ERROR LOAD DATA:',
      error
    );

    setConnection(
      'offline',
      'Gagal terhubung: ' +
      error.message
    );

    showToast(
      'Gagal memuat data',
      'error'
    );

  }

}


// ============================================================
// RENDER DATA MAHASISWA
// ============================================================

function renderStudents() {

  const table =
    $('studentTableBody');

  const count =
    $('studentCount');

  if (!table || !count) {
    return;
  }

  const total =
    students.length;

  const hadir =
    students.filter(student => {

      return String(
        student.Status || ''
      )
        .trim()
        .toLowerCase() === 'hadir';

    }).length;


  count.textContent =
    hadir + '/' + total + ' hadir';


  if (total === 0) {

    table.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-state"
        >
          Belum ada data mahasiswa
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    students.map(student => {

      const mataKuliah =
        student['Mata Kuliah'] ||
        student.MataKuliah ||
        student.matakuliah ||
        student.mata_kuliah ||
        '-';


      const waktuHadir =
        formatWaktuHadir(
          student['Waktu Hadir']
        );


      const status =
        student.Status ||
        'Menunggu';


      const statusClass =
        String(status)
          .trim()
          .toLowerCase() === 'hadir'
          ? 'status-hadir'
          : 'status-menunggu';


      return `
        <tr>

          <td>
            ${escapeHtml(student.NIM)}
          </td>

          <td>
            ${escapeHtml(student.Nama)}
          </td>

          <td>
            ${escapeHtml(student.Kelas)}
          </td>

          <td>
            ${escapeHtml(student.Jurusan)}
          </td>

          <td>

            <span
              class="status-badge ${statusClass}"
            >
              ${escapeHtml(status)}
            </span>

          </td>

          <td>
            ${escapeHtml(waktuHadir)}
          </td>

          <td>
            ${escapeHtml(mataKuliah)}
          </td>

        </tr>
      `;

    }).join('');

}


// ============================================================
// FORMAT WAKTU HADIR
// ============================================================

function formatWaktuHadir(waktu) {

  if (
    !waktu ||
    waktu === '-'
  ) {

    return '-';

  }


  const teks =
    String(waktu).trim();


  const cocok =
    teks.match(
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


    return (
      String(cocok[2])
        .padStart(2, '0') +
      '/' +
      bulan[cocok[1]] +
      '/' +
      cocok[3] +
      ' ' +
      cocok[4] +
      ':' +
      cocok[5] +
      ':' +
      cocok[6]
    );

  }


  const date =
    new Date(teks);


  if (
    !isNaN(
      date.getTime()
    )
  ) {

    const tanggal =
      String(
        date.getDate()
      ).padStart(2, '0');


    const bulan =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');


    const tahun =
      date.getFullYear();


    const jam =
      String(
        date.getHours()
      ).padStart(2, '0');


    const menit =
      String(
        date.getMinutes()
      ).padStart(2, '0');


    const detik =
      String(
        date.getSeconds()
      ).padStart(2, '0');


    return (
      tanggal +
      '/' +
      bulan +
      '/' +
      tahun +
      ' ' +
      jam +
      ':' +
      menit +
      ':' +
      detik
    );

  }


  return teks;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    character => {

      const entities = {

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

      };

      return entities[
        character
      ];

    }
  );

}


// ============================================================
// GENERATE QR BERDASARKAN NAMA
// ============================================================

function generateQrCode(nama) {

  const input =
    $('nimInput');

  const display =
    $('qrDisplay');


  const targetNama =
    String(
      nama ||
      (input ? input.value : '') ||
      ''
    ).trim();


  if (!targetNama) {

    showToast(
      'Ketik nama mahasiswa terlebih dahulu',
      'error'
    );

    return;

  }


  const student =
    students.find(item => {

      return String(
        item.Nama || ''
      )
        .trim()
        .toLowerCase() ===
        targetNama.toLowerCase();

    });


  if (!student) {

    showToast(
      'Nama "' +
      targetNama +
      '" tidak ditemukan',
      'error'
    );

    return;

  }


  const targetNim =
    String(
      student.NIM || ''
    ).trim();


  if (!targetNim) {

    showToast(
      'NIM mahasiswa tidak ditemukan',
      'error'
    );

    return;

  }


  if (
    typeof QRCode ===
    'undefined'
  ) {

    showToast(
      'Library QR Code belum termuat',
      'error'
    );

    return;

  }


  QRCode.toDataURL(

    targetNim,

    {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    },

    function(error, url) {

      if (error) {

        console.error(
          error
        );

        showToast(
          'Gagal generate QR',
          'error'
        );

        return;

      }


      display.innerHTML =
        '<img src="' +
        url +
        '" alt="QR Code">';


      display.dataset.currentNim =
        targetNim;


      showToast(
        'QR untuk ' +
        student.Nama +
        ' berhasil dibuat',
        'success'
      );

    }

  );

}


// ============================================================
// DOWNLOAD QR
// ============================================================

function downloadQr() {

  const display =
    $('qrDisplay');


  const img =
    display
      ? display.querySelector('img')
      : null;


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
    'QR-' +
    (
      display.dataset.currentNim ||
      'presensi'
    ) +
    '.png';


  link.href =
    img.src;


  link.click();

}


// ============================================================
// MULAI SCAN
// ============================================================

async function startScan() {

  if (isScanning) {
    return;
  }


  if (
    typeof Html5Qrcode ===
    'undefined'
  ) {

    showToast(
      'Library scanner belum termuat',
      'error'
    );

    return;

  }


  const scannerContainer =
    $('scannerContainer');

  const scanBtn =
    $('scanBtn');

  const stopScanBtn =
    $('stopScanBtn');

  const scanStatus =
    $('scanStatus');


  scannerContainer.style.display =
    'block';


  scanBtn.classList.add(
    'hidden'
  );


  stopScanBtn.classList.remove(
    'hidden'
  );


  scanStatus.textContent =
    'Arahkan kamera ke QR Code...';


  try {

    html5QrCode =
      new Html5Qrcode(
        'qrReader'
      );


    await html5QrCode.start(

      {
        facingMode:
          'environment'
      },

      {
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
        }

      },

      onScanSuccess,

      function() {}

    );


    isScanning =
      true;


  } catch (error) {

    console.error(
      'ERROR CAMERA:',
      error
    );


    scanStatus.textContent =
      '❌ Gagal akses kamera: ' +
      error.message;


    showToast(
      'Gagal akses kamera. Pastikan HTTPS & izin kamera.',
      'error'
    );


    await stopScan();

  }

}


// ============================================================
// QR BERHASIL DIBACA
// ============================================================

async function onScanSuccess(
  decodedText
) {

  const nim =
    String(
      decodedText || ''
    ).trim();


  const now =
    Date.now();


  if (
    lastScanned.nim === nim &&
    now -
      lastScanned.time <
      3000
  ) {

    return;

  }


  lastScanned = {

    nim: nim,

    time: now

  };


  const scanStatus =
    $('scanStatus');


  if (scanStatus) {

    scanStatus.textContent =
      '📷 Terdeteksi: ' +
      nim;

  }


  await sendPresensi(
    nim
  );

}


// ============================================================
// KIRIM PRESENSI
// ============================================================

async function sendPresensi(nim) {

  try {

    setConnection(
      'loading',
      'Memproses NIM ' +
      nim +
      '...'
    );


    const url =
      API_URL +
      '?action=presensi&nim=' +
      encodeURIComponent(nim) +
      '&t=' +
      Date.now();


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        'HTTP ' +
        response.status
      );

    }


    const json =
      await response.json();


    if (
      json.status ===
      'success'
    ) {

      showToast(
        '✅ ' +
        json.nama +
        ' — Hadir (' +
        json.waktu +
        ')',
        'success'
      );


      $('scanStatus').textContent =
        '✅ ' +
        json.nama +
        ' berhasil presensi';


    } else if (
      json.status ===
      'info'
    ) {

      showToast(
        'ℹ️ ' +
        json.nama +
        ' sudah presensi (' +
        json.waktu +
        ')',
        'info'
      );


      $('scanStatus').textContent =
        'ℹ️ ' +
        json.nama +
        ' sudah presensi';


    } else {

      showToast(
        '❌ ' +
        (
          json.message ||
          'Presensi gagal'
        ),
        'error'
      );


      $('scanStatus').textContent =
        '❌ ' +
        (
          json.message ||
          'Presensi gagal'
        );

    }


    await loadStudents();


  } catch (error) {

    console.error(
      'ERROR PRESENSI:',
      error
    );


    showToast(
      'Gagal kirim presensi: ' +
      error.message,
      'error'
    );


    setConnection(
      'offline',
      'Gagal kirim presensi'
    );

  }

}


// ============================================================
// STOP SCANNER
// ============================================================

async function stopScan() {

  if (html5QrCode) {

    try {

      await html5QrCode.stop();

      await html5QrCode.clear();

    } catch (error) {

      console.log(
        'Scanner ditutup.'
      );

    }


    html5QrCode =
      null;

  }


  const scannerContainer =
    $('scannerContainer');

  const scanBtn =
    $('scanBtn');

  const stopScanBtn =
    $('stopScanBtn');


  if (scannerContainer) {

    scannerContainer.style.display =
      'none';

  }


  if (scanBtn) {

    scanBtn.classList.remove(
      'hidden'
    );

  }


  if (stopScanBtn) {

    stopScanBtn.classList.add(
      'hidden'
    );

  }


  isScanning =
    false;

}


// ============================================================
// RESET PRESENSI
// ============================================================

async function resetPresensi() {

  const yakin =
    confirm(
      'Yakin reset semua status presensi ke "Menunggu"?'
    );


  if (!yakin) {
    return;
  }


  try {

    setConnection(
      'loading',
      'Mereset presensi...'
    );


    const response =
      await fetch(
        API_URL +
        '?action=reset&t=' +
        Date.now()
      );


    if (!response.ok) {

      throw new Error(
        'HTTP ' +
        response.status
      );

    }


    const json =
      await response.json();


    if (
      json.status ===
      'success'
    ) {

      showToast(
        '✅ Presensi berhasil direset',
        'success'
      );


      await loadStudents();


    } else {

      throw new Error(
        json.message ||
        'Reset gagal'
      );

    }


  } catch (error) {

    console.error(
      'ERROR RESET:',
      error
    );


    showToast(
      'Gagal reset: ' +
      error.message,
      'error'
    );


    setConnection(
      'offline',
      'Gagal reset'
    );

  }

}


// ============================================================
// INIT
// ============================================================

function init() {

  console.log(
    '✅ script.js berhasil dijalankan'
  );


  const refreshBtn =
    $('refreshBtn');

  const downloadQrBtn =
    $('downloadQrBtn');

  const openSheetBtn =
    $('openSheetBtn');

  const resetBtn =
    $('resetBtn');

  const generateQrBtn =
    $('generateQrBtn');

  const nimInput =
    $('nimInput');

  const scanBtn =
    $('scanBtn');

  const stopScanBtn =
    $('stopScanBtn');

  const qrDisplay =
    $('qrDisplay');


  if (!refreshBtn) {

    console.error(
      'index.html tidak terbaca dengan benar.'
    );

    return;

  }


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
    function() {

      window.open(
        SHEET_URL,
        '_blank'
      );

    }
  );


  resetBtn.addEventListener(
    'click',
    resetPresensi
  );


  generateQrBtn.addEventListener(
    'click',
    function() {

      generateQrCode();

    }
  );


  scanBtn.addEventListener(
    'click',
    startScan
  );


  stopScanBtn.addEventListener(
    'click',
    stopScan
  );


  nimInput.addEventListener(
    'keypress',
    function(event) {

      if (
        event.key ===
        'Enter'
      ) {

        generateQrCode();

      }

    }
  );


  qrDisplay.addEventListener(
    'click',
    function() {

      generateQrCode();

    }
  );


  // LANGSUNG LOAD DATA

  loadStudents();

}


// ============================================================
// JALANKAN PROGRAM
// ============================================================

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    init
  );

} else {

  init();

}
