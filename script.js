const databaseURL = "https://portofolio-3293e-default-rtdb.asia-southeast1.firebasedatabase.app/.json"; 
const PASSWORD_ADMIN = window.PASSWORD_ADMIN;

let currentData = [];
let editIndex = -1;
let currentMediaIndex = 0;   
let currentProjectIndex = 0; 
let statusAdmin = false; 

document.addEventListener('DOMContentLoaded', tampilkanProyek);

// Fungsi cek format Video
function isVideoFile(url) {
    if (!url || typeof url !== 'string') return false;
    return url.toLowerCase().match(/\.(mp4|webm|mov|ogg)/i);
}

// Fungsi cek format Dokumen (PDF, Word, PPT, Excel, dll)
function isDocumentFile(url) {
    if (!url || typeof url !== 'string') return false;
    return url.toLowerCase().match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)/i);
}

// --- AMBIL DATA DARI FIREBASE ---
async function ambilDataCloud() {
    try {
        const res = await fetch(databaseURL);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        
        if (!data) return [];
        
        // Jika data dari Firebase berbentuk Array bersih
        if (Array.isArray(data)) {
            return data.filter(item => item !== null); 
        } 
        
        // Jika data berbentuk Objek, diubah menjadi Array
        return Object.keys(data).map(key => ({
            idFirebase: key,
            ...data[key]
        }));
    } catch (e) { 
        console.error("Error ambil data:", e);
        return []; 
    }
}

// --- FUNGSI MASUK MODE ADMIN ---
function aksesAdmin() {
    if (statusAdmin) {
        statusAdmin = false;
        document.getElementById("admin-panel").style.display = "none";
        document.getElementById("btn-lock").innerText = "🔓 Masuk Mode Admin";
        document.getElementById("btn-lock").style.background = "#21262d";
        document.getElementById("btn-lock").style.color = "#58a6ff";
        alert("Mode Admin dinonaktifkan.");
        tampilkanProyek(); 
        return;
    }

    const pass = prompt("Masukkan Password Admin:");
    if (pass === null) return; 
    if (pass === PASSWORD_ADMIN) {
        statusAdmin = true;
        document.getElementById("admin-panel").style.display = "block"; 
        document.getElementById("btn-lock").innerText = "🔒 Keluar Mode Admin (Aktif)";
        document.getElementById("btn-lock").style.background = "#238636"; 
        document.getElementById("btn-lock").style.color = "white";
        alert("Akses diterima!");
        tampilkanProyek(); 
    } else {
        alert("Password Salah! Akses ditolak.");
    }
}

// --- TAMPILKAN DAFTAR PROYEK DI HALAMAN UTAMA ---
async function tampilkanProyek() {
    const container = document.getElementById('project-list');
    if (!container) return;

    currentData = await ambilDataCloud();
    container.innerHTML = ""; 

    if (currentData.length === 0) {
        container.innerHTML = "<p style='color:#8b949e; text-align:center;'>Belum ada proyek.</p>";
        return;
    }

    currentData.forEach((item, index) => {
        if (!item || !item.judul || !item.sumber || !Array.isArray(item.sumber)) return;

        const sampulUrl = item.sumber[0] || "";
        let sampulTag = "";
        
        if (isVideoFile(sampulUrl)) {
            sampulTag = `<video src="${sampulUrl}" class="folder-cover" onclick="toggleFolder(${index})" muted playsinline></video>`;
        } else if (isDocumentFile(sampulUrl)) {
            sampulTag = `
                <div class="folder-cover" onclick="toggleFolder(${index})" style="background:#1f242c; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; border: 3px solid #30363d;">
                    <span style="font-size:60px;">📄</span>
                    <span style="color:#58a6ff; font-size:12px; font-weight:bold;">Dokumen Portfolio</span>
                </div>`;
        } else if (sampulUrl) {
            sampulTag = `<img src="${sampulUrl}" class="folder-cover" onclick="toggleFolder(${index})" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">`;
        } else {
            sampulTag = `<div class="folder-cover" onclick="toggleFolder(${index})" style="background:#30363d; display:flex; align-items:center; justify-content:center;">No Media</div>`;
        }

        const linkTag = item.link ? `<a href="${item.link}" target="_blank" class="project-link">🔗 Kunjungi Proyek</a>` : '';

        let tombolAdminTag = "";
        if (statusAdmin) {
            tombolAdminTag = `
                <div style="display:flex; gap:5px;">
                    <button onclick="editProyek(${index})" style="background:#238636; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Edit</button>
                    <button onclick="hapusProyek(${index})" style="background:#da3633; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">X</button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="project-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="color:#58a6ff; font-size:16px; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📁 ${item.judul}</h3>
                    ${tombolAdminTag}
                </div>
                ${sampulTag}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 10px;">
                    <p style="font-size:11px; color:#8b949e; margin:0; cursor:pointer; user-select:none;" onclick="toggleFolder(${index})">▶ Klik sampul untuk isi folder</p>
                    ${linkTag}
                </div>
            </div>`;
    });
}

// --- ISI FOLDER KETIKA DIKLIK ---
function toggleFolder(index) {
    currentProjectIndex = index;
    const project = currentData[index];
    if (!project) return;

    const modalFolder = document.getElementById("folderModal");
    const modalTitle = document.getElementById("modalFolderTitle");
    const modalGrid = document.getElementById("modalFolderGrid");

    if (modalFolder && modalTitle && modalGrid) {
        modalTitle.innerText = `📁 Isi Folder: ${project.judul}`;
        modalGrid.innerHTML = ""; 

        project.sumber.forEach((s, mediaIndex) => {
            if (!s) return;
            
            if (isVideoFile(s)) {
                modalGrid.innerHTML += `
                    <div class="grid-item-full">
                        <video src="${s}" onclick="openModal(${index}, ${mediaIndex})" preload="metadata" muted playsinline></video>
                    </div>`;
            } else if (isDocumentFile(s)) {
                const ekstensi = s.split('.').pop().toUpperCase();
                modalGrid.innerHTML += `
                    <div class="grid-item-full" onclick="openModal(${index}, ${mediaIndex})" style="background: #21262d; border: 2px solid #30363d; border-radius: 8px; height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                        <span style="font-size: 50px;">📄</span>
                        <span style="color: #58a6ff; font-weight: bold; margin-top: 10px; font-size: 14px;">${ekstensi} Document</span>
                        <span style="color: #8b949e; font-size: 11px; padding: 0 10px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">${s.split('/').pop()}</span>
                    </div>`;
            } else {
                modalGrid.innerHTML += `
                    <div class="grid-item-full">
                        <img src="${s}" onclick="openModal(${index}, ${mediaIndex})" onerror="this.parentElement.style.display='none'">
                    </div>`;
            }
        });

        modalFolder.style.display = "block";
        document.body.style.overflow = "hidden"; 
    }
}

function closeFolderModal() {
    const modalFolder = document.getElementById("folderModal");
    if (modalFolder) {
        modalFolder.style.display = "none";
        document.body.style.overflow = ""; 
    }
}

// --- ZOOM MODAL (GAMBAR, VIDEO, ATAU DOKUMEN) ---
function openModal(projectIndex, mediaIndex) {
    currentProjectIndex = projectIndex;
    currentMediaIndex = mediaIndex;
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "block";
        updateModalMedia();
    }
}

// --- PERBARUI MEDIA MODAL ---
function updateModalMedia() {
    const imgFull = document.getElementById("imgFull");
    const videoFull = document.getElementById("videoFull");
    const project = currentData[currentProjectIndex];
    if (!project || !project.sumber || !project.sumber[currentMediaIndex]) { closeModal(); return; }
    const src = project.sumber[currentMediaIndex];

    // Bersihkan view box dokumen lama agar tidak menumpuk
    const dokumenLama = document.getElementById("docViewBox");
    if (dokumenLama) dokumenLama.remove();

    if (isVideoFile(src)) {
        if (imgFull) imgFull.style.display = "none";
        if (videoFull) {
            videoFull.style.display = "block";
            videoFull.src = src;
            videoFull.muted = false; 
            videoFull.play().catch(() => {});
        }
    } else if (isDocumentFile(src)) {
        if (imgFull) imgFull.style.display = "none";
        if (videoFull) { videoFull.pause(); videoFull.style.display = "none"; videoFull.src = ""; }

        const bodyContent = document.querySelector(".modal-body-content");
        const docBox = document.createElement("div");
        docBox.id = "docViewBox";
        docBox.style.textAlign = "center";
        docBox.style.color = "white";

        if (src.toLowerCase().endsWith('.pdf')) {
            docBox.innerHTML = `
                <embed src="${src}" type="application/pdf" width="700px" height="450px" style="border-radius:8px; border:1px solid #30363d; max-width:90%; max-height:55vh;" />
                <br><br>
                <a href="${src}" target="_blank" style="background:#238636; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📥 Buka / Download PDF</a>
            `;
        } else {
            docBox.innerHTML = `
                <span style="font-size: 80px;">📂</span>
                <h3 style="margin-top:20px;">File Dokumen: ${src.split('/').pop()}</h3>
                <p style="color:#8b949e;">Format ini tidak bisa dipreview langsung di browser.</p>
                <br>
                <a href="${src}" download style="background:#58a6ff; color:#0d1117; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">📥 Download File</a>
            `;
        }
        bodyContent.appendChild(docBox);

    } else {
        if (videoFull) { videoFull.pause(); videoFull.style.display = "none"; videoFull.src = ""; }
        if (imgFull) { imgFull.style.display = "block"; imgFull.src = src; }
    }
}

function nextMedia() {
    const project = currentData[currentProjectIndex];
    if (!project || !project.sumber) return;
    currentMediaIndex = (currentMediaIndex < project.sumber.length - 1) ? currentMediaIndex + 1 : 0;
    updateModalMedia();
}

function prevMedia() {
    const project = currentData[currentProjectIndex];
    if (!project || !project.sumber) return;
    currentMediaIndex = (currentMediaIndex > 0) ? currentMediaIndex - 1 : project.sumber.length - 1;
    updateModalMedia();
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    const videoFull = document.getElementById("videoFull");
    if (modal) modal.style.display = "none";
    if (videoFull) { videoFull.pause(); videoFull.src = ""; }
    const dokumenLama = document.getElementById("docViewBox");
    if (dokumenLama) dokumenLama.remove();
}

window.onclick = function(event) {
    if (event.target == document.getElementById("imageModal")) closeModal();
    if (event.target == document.getElementById("folderModal")) closeFolderModal();
}

document.addEventListener('keydown', function(e) {
    const modal = document.getElementById("imageModal");
    if (modal && modal.style.display === "block") {
        if (e.key === "ArrowRight") nextMedia();
        if (e.key === "ArrowLeft") prevMedia();
        if (e.key === "Escape") closeModal();
    }
});

// --- PROSES CRUD DATABASE (DEEP CLONE AMAN) ---
async function tambahProyek() {
    if (!statusAdmin) return;

    const judulInput = document.getElementById('judul');
    const sumberInput = document.getElementById('sumber');
    const linkInput = document.getElementById('link');

    if (!judulInput || !sumberInput || judulInput.value.trim() === "" || sumberInput.value.trim() === "") {
        alert("Judul dan Sumber tidak boleh kosong!");
        return;
    }

    const judul = judulInput.value.trim();
    const sumberRaw = sumberInput.value.trim();
    const link = linkInput ? linkInput.value.trim() : ""; 
    const daftarSumber = sumberRaw.split(',').map(s => s.trim()).filter(s => s !== "");
    
    const dataProyek = { judul, sumber: daftarSumber, link };

    try {
        let db = await ambilDataCloud();
        
        // Deep Clone data agar isi array 'sumber' tersalin utuh sempurna
        const dbUntukSimpan = JSON.parse(JSON.stringify(db));
        
        dbUntukSimpan.forEach(item => {
            if (item) delete item.idFirebase;
        });

        if (editIndex === -1) { 
            dbUntukSimpan.push(dataProyek); 
        } else { 
            dbUntukSimpan[editIndex] = dataProyek; 
            editIndex = -1; 
        }
        
        const res = await fetch(databaseURL, { method: "PUT", body: JSON.stringify(dbUntukSimpan) });
        if (res.ok) {
            alert("Berhasil disimpan!");
            judulInput.value = "";
            sumberInput.value = "";
            if (linkInput) linkInput.value = "";
            document.querySelector(".btn-simpan").innerText = "Simpan ke Website";
            tampilkanProyek();
        }
    } catch (e) { 
        console.error(e);
        alert("Gagal menyimpan data."); 
    }
}

function editProyek(index) {
    if (!statusAdmin) return;

    const p = currentData[index];
    if (!p) return;
    document.getElementById('judul').value = p.judul || "";
    document.getElementById('sumber').value = p.sumber ? p.sumber.join(', ') : "";
    if (document.getElementById('link')) document.getElementById('link').value = p.link || ""; 
    editIndex = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector(".btn-simpan").innerText = "Perbarui Proyek";
}

async function hapusProyek(index) {
    if (!statusAdmin) return;

    const p = currentData[index];
    if (!p) return;

    if (!confirm(`Apakah kamu yakin ingin menghapus proyek "${p.judul}"?`)) return;
    
    try {
        let db = await ambilDataCloud();
        const dbUntukSimpan = JSON.parse(JSON.stringify(db));
        
        dbUntukSimpan.forEach(item => {
            if (item) delete item.idFirebase;
        });

        dbUntukSimpan.splice(index, 1); 
        
        const res = await fetch(databaseURL, { method: "PUT", body: JSON.stringify(dbUntukSimpan) });
        if (res.ok) {
            alert("Proyek berhasil dihapus.");
            tampilkanProyek();
        }
    } catch (e) { 
        console.error(e);
        alert("Gagal menghapus data."); 
    }
}
