// 1. Firebase Configuration (กุญแจของมึง)
const firebaseConfig = {
  apiKey: "AIzaSyBWsk0sESIJ8Fpmms7HkC80N5_Dlclb5pY",
  authDomain: "westeros-sins.firebaseapp.com",
  databaseURL: "https://westeros-sins-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "westeros-sins",
  storageBucket: "westeros-sins.firebasestorage.app",
  messagingSenderId: "342241772938",
  appId: "1:342241772938:web:435ae53e457e58ac39f473",
  measurementId: "G-6V4DPSKHMS"
};

// 2. เริ่มต้นระบบ Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 3. ตั้งค่าระบบ Admin (Username/Password ของมึง)
const AUTH = { u: "UmFpemVu", p: "UmFpemVuYWRtaW5TaW5z" };
let members = []; 
let currentFilter = 'all';
let isAdmin = false;
let pendingDeleteKey = null;

// 4. ดึงข้อมูลสมาชิกจาก Database
function loadMembers() {
    db.ref('members').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            members = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            members = [];
        }
        renderMembers();
    });
}

// 5. วาดตารางสมาชิกบนหน้าจอ
function renderMembers() {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;
    const search = document.getElementById('memberSearch').value.toLowerCase();
    const filtered = members.filter(m => 
        (currentFilter === 'all' || m.type === currentFilter) && 
        m.name.toLowerCase().includes(search)
    );
    grid.innerHTML = filtered.map((m) => `
        <div class="member-card">
            <div class="member-avatar"><img src="image/newlogo.png" alt="logo"></div>
            <div class="info">
                <div style="font-weight:bold; color:#fff;">${m.name}</div>
                <a href="${m.fb}" target="_blank" class="fb-link"><i class="fa-brands fa-facebook"></i> Facebook</a>
            </div>
            ${isAdmin ? `<button onclick="openDeleteModal('${m.id}')" class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
    `).join('');
}

// 6. ระบบเพิ่มสมาชิก
function addNewMember() {
    const name = document.getElementById('newMemberName').value;
    const fb = document.getElementById('newMemberFB').value;
    const type = document.getElementById('newMemberGroup').value;
    if (name && fb) {
        db.ref('members').push({ name, fb, type }).then(() => {
            showToast(`เพิ่มรายชื่อ "${name}" เรียบร้อย!`, "success");
            document.getElementById('newMemberName').value = "";
            document.getElementById('newMemberFB').value = "";
        });
    } else {
        showToast("กรอกข้อมูลให้ครบด้วยมึง!", "delete");
    }
}

// 7. ระบบลบสมาชิก
function openDeleteModal(key) {
    pendingDeleteKey = key;
    const member = members.find(m => m.id === key);
    const modalHTML = `
        <div id="customModal" class="modal-overlay">
            <div class="modal-content">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#ff4444; margin-bottom:1rem;"></i>
                <h3>ยืนยันการลบ?</h3>
                <p>แน่ใจนะว่าจะลบ <strong>"${member.name}"</strong></p>
                <div class="modal-btns">
                    <button onclick="confirmDelete()" class="confirm-btn">ใช่, ลบเลย</button>
                    <button onclick="closeModal()" class="cancel-btn">ยกเลิก</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
function confirmDelete() {
    if (pendingDeleteKey) {
        db.ref('members/' + pendingDeleteKey).remove().then(() => {
            showToast("ลบข้อมูลแล้ว", "delete");
            closeModal();
        });
    }
}

// --- ฟังก์ชันเสริมและ UI ---
function enterSite() {
    document.getElementById('landingPage').style.opacity = '0';
    document.getElementById('landingPage').style.visibility = 'hidden';
    setTimeout(() => {
        document.getElementById('mainNav').style.display = 'block';
        document.getElementById('memberPage').style.display = 'block';
        document.getElementById('memberPage').classList.add('active');
        document.body.classList.remove('no-scroll');
        loadMembers(); 
    }, 500);
}
function handleAuth(e) {
    e.preventDefault();
    const u = btoa(document.getElementById('userInp').value);
    const p = btoa(document.getElementById('passInp').value);
    if (u === AUTH.u && p === AUTH.p) {
        isAdmin = true;
        document.getElementById('loginFormSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        showToast("ยินดีต้อนรับท่านแอดมิน!", "success");
        renderMembers();
    } else {
        showToast("รหัสผิดนะมึง", "delete");
    }
}
function handleLogout() {
    isAdmin = false;
    document.getElementById('loginFormSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    showToast("ออกจากระบบแล้ว", "success");
    renderMembers();
}
function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderMembers();
}
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container') || document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'delete' ? 'delete' : ''}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}
function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.remove();
}
function showPage(p) {
    document.querySelectorAll('.page').forEach(x => x.style.display = 'none');
    document.getElementById(p).style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(p === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(p === 'adminPage') document.getElementById('nav-adm').classList.add('active');
}
window.onload = () => { document.body.classList.add('no-scroll'); };