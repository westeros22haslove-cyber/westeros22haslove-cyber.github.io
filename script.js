// 1. การตั้งค่าระบบ
const AUTH = { u: "UmFpemVu", p: "UmFpemVuYWRtaW5TaW5z" };
let members = JSON.parse(localStorage.getItem('westeros_data')) || [
    { name: "Raizen Sins", type: "Sins", fb: "https://facebook.com" },
    { name: "Westeros King", type: "Westeros", fb: "https://facebook.com" }
];
let currentFilter = 'all';
let isAdmin = false;
let pendingDeleteIdx = null; // เก็บ index ที่รอการลบ

// 2. ระบบแจ้งเตือน (Toast Notification)
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'delete' ? 'delete' : ''}`;
    const icon = type === 'delete' ? '<i class="fa-solid fa-trash-can"></i>' : '<i class="fa-solid fa-circle-check"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

// 3. ระบบยืนยันการลบ (Custom Modal)
function openDeleteModal(idx) {
    pendingDeleteIdx = idx;
    const memberName = members[idx].name;
    const modalHTML = `
        <div id="customModal" class="modal-overlay">
            <div class="modal-content">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #ff4444; margin-bottom: 1rem;"></i>
                <h3>ยืนยันการลบ?</h3>
                <p>คุณแน่ใจใช่ไหมที่จะลบรายชื่อ <br><strong>"${memberName}"</strong></p>
                <div class="modal-btns">
                    <button onclick="confirmDelete()" class="confirm-btn">ใช่, ลบเลย</button>
                    <button onclick="closeModal()" class="cancel-btn">ยกเลิก</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.remove();
    pendingDeleteIdx = null;
}

function confirmDelete() {
    if (pendingDeleteIdx !== null) {
        const name = members[pendingDeleteIdx].name;
        members.splice(pendingDeleteIdx, 1);
        localStorage.setItem('westeros_data', JSON.stringify(members));
        showToast(`ลบรายชื่อ "${name}" ออกเรียบร้อยแล้ว`, 'delete');
        renderMembers();
        closeModal();
    }
}

// 4. ฟังก์ชันจัดการหน้าหลัก
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(pageId === 'adminPage') document.getElementById('nav-adm').classList.add('active');
}

function renderMembers() {
    const grid = document.getElementById('memberGrid');
    const search = document.getElementById('memberSearch').value.toLowerCase();
    const filtered = members.filter(m => (currentFilter === 'all' || m.type === currentFilter) && m.name.toLowerCase().includes(search));

    grid.innerHTML = filtered.map((m, index) => `
        <div class="member-card">
            <div class="member-avatar">
                <img src="image/newlogo.png" alt="logo">
            </div>
            
            <div class="info">
                <div style="font-weight:bold; color:#fff;">${m.name}</div>
                <a href="${m.fb}" target="_blank" class="fb-link"><i class="fa-brands fa-facebook"></i> Facebook</a>
            </div>
            ${isAdmin ? `<button onclick="openDeleteModal(${index})" class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
    `).join('');
}
function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderMembers();
}

// 5. ระบบ Admin
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
        showToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "delete");
    }
}

function addNewMember() {
    const name = document.getElementById('newMemberName').value;
    const fb = document.getElementById('newMemberFB').value;
    const type = document.getElementById('newMemberGroup').value;
    if (name && fb) {
        members.push({ name, type, fb });
        localStorage.setItem('westeros_data', JSON.stringify(members));
        showToast(`เพิ่มรายชื่อ "${name}" เข้าระบบแล้วนะ`, "success");
        document.getElementById('newMemberName').value = "";
        document.getElementById('newMemberFB').value = "";
        renderMembers();
    } else {
        showToast("กรอกข้อมูลให้ครบด้วยมึง!", "delete");
    }
}

function handleLogout() {
    isAdmin = false;
    document.getElementById('loginFormSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('passInp').value = "";
    showToast("ออกจากระบบแล้ว", "success");
    renderMembers();
}
// ฟังก์ชันสำหรับกด Enter เข้าหน้าเว็บ
function enterSite() {
    const landing = document.getElementById('landingPage');
    const nav = document.getElementById('mainNav');
    const memberPage = document.getElementById('memberPage');

    // 1. จางหน้าแรกออก
    landing.style.opacity = '0';
    landing.style.visibility = 'hidden';

    // 2. แสดง Navbar และหน้า Member (ใช้ delay นิดหน่อยเพื่อให้เนียน)
    setTimeout(() => {
        nav.style.display = 'block';
        memberPage.style.display = 'block';
        memberPage.classList.add('active'); // บังคับให้หน้า member active
        document.body.classList.remove('no-scroll');
        renderMembers(); // โหลดรายชื่อทันที
    }, 500);
}

// แก้ไขฟังก์ชัน showPage นิดหน่อยเพื่อไม่ให้มันไปยุ่งกับหน้า Landing
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(pageId === 'adminPage') document.getElementById('nav-adm').classList.add('active');
}

// ตอนโหลดเว็บครั้งแรก ให้สั่งปิด Scroll
window.onload = () => {
    document.body.classList.add('no-scroll');
};
window.onload = renderMembers;