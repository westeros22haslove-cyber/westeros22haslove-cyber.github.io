// 1. FIREBASE CONFIG
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

// เริ่มต้นระบบ
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. CONFIG & VARIABLES
const AUTH = { u: "UmFpemVu", p: "UmFpemVuYWRtaW5TaW5z" };
let members = [];
let isAdmin = false;
let currentFilter = 'all';
let pendingDeleteKey = null;
let sortableInstance = null; // ตัวแปรเก็บพลัง Drag Drop Grid
let onCancelDelete = null;   // *** เพิ่ม: ตัวแปรเก็บคำสั่งยกเลิกการลบ (สำหรับกรณีลากลงนรกแล้วเปลี่ยนใจ) ***

// 3. LOAD MEMBERS
function loadMembers() {
    db.ref('members').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            members = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            
            // เรียงลำดับตามค่า 'order'
            members.sort((a, b) => (a.order || 0) - (b.order || 0));
            
        } else {
            members = [];
        }
        renderMembers();
    });
}

// 4. RENDER MEMBERS
function renderMembers() {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;
    const search = document.getElementById('memberSearch').value.toLowerCase();
    
    // เงื่อนไขการลาก: ต้องเป็น Admin, ไม่ได้ค้นหา, และเลือกดูทั้งหมด
    // (เพราะถ้าดูแยกกลุ่มแล้วลากข้ามกลุ่ม ลำดับจะงง)
    const isSearching = search.length > 0 || currentFilter !== 'all';
    
    const filtered = members.filter(m => 
        (currentFilter === 'all' || m.type === currentFilter) && 
        m.name.toLowerCase().includes(search)
    );

    // Toggle Mode
    if (isAdmin && !isSearching) {
        grid.classList.add('draggable-mode');
    } else {
        grid.classList.remove('draggable-mode');
    }

    grid.innerHTML = filtered.map((m) => {
        let iconClass = m.type === 'Westeros' ? 'fa-dragon' : 'fa-skull';
        let colorStyle = m.type === 'Westeros' ? 'color: #ffb700;' : 'color: #ff0000;';

        return `
        <div class="swipe-wrapper" data-id="${m.id}">
            <div class="delete-zone"><i class="fa-solid fa-trash-can"></i></div>
            
            <div class="member-card">
                <div class="member-avatar">
                    <i class="fa-solid ${iconClass}" style="${colorStyle}"></i>
                </div>
                <div class="info">
                    <div>${m.name}</div>
                    <div style="font-size:0.8rem; color:#666; margin-bottom:5px;">${m.type}</div>
                    <a href="${m.fb}" target="_blank" class="fb-link">
                        <i class="fa-brands fa-facebook-f"></i> Contact Soul
                    </a>
                </div>
            </div>
        </div>
    `}).join('');

    // เรียก Sortable (ลากลงนรก & จัดลำดับ)
    initSortable(isAdmin && !isSearching);
    
    // เรียก Swipe System (ปัดซ้ายลบ)
    if (isAdmin) initSwipeSystem();
}

// *** ระบบ Drag & Drop และ Hell Gate (อัปเกรดใหม่) ***
function initSortable(enable) {
    const grid = document.getElementById('memberGrid');
    const hellGate = document.getElementById('hellGate'); // อย่าลืมใส่ HTML div id="hellGate" ด้วยนะ
    
    // ทำลาย Instance เก่าทิ้งก่อน (กันบั๊ก)
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
    
    // ทำลาย Instance ของประตูด้วย
    if (window.hellGateInstance) {
        window.hellGateInstance.destroy();
        window.hellGateInstance = null;
    }

    if (enable) {
        // 1. ตั้งค่า Main Grid (รายชื่อสมาชิก)
        sortableInstance = new Sortable(grid, {
            group: 'souls', // ชื่อกลุ่มต้องตรงกันกับประตู
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.member-card', // จับที่การ์ด
            delay: 100, // กดค้างนิดนึงค่อยลาก (กันชนกับ swipe)
            delayOnTouchOnly: true,
            
            // เมื่อเริ่มลาก -> เรียกประตูนรกออกมา
            onStart: function() {
                if(hellGate) hellGate.classList.add('active');
            },
            
            // เมื่อเลิก/ปล่อย -> เก็บประตู
            onEnd: function() {
                if(hellGate) {
                    hellGate.classList.remove('active');
                    hellGate.classList.remove('drag-over');
                }
            },
            
            // เมื่อมีการเปลี่ยนลำดับภายใน Grid เอง
            onUpdate: function() {
                saveNewOrder();
            },

            // เช็คตอนลากผ่านประตู (เพื่อเปลี่ยนสีประตู)
            onMove: function(evt) {
                if (hellGate && evt.to === hellGate) {
                    hellGate.classList.add('drag-over');
                } else if (hellGate) {
                    hellGate.classList.remove('drag-over');
                }
            }
        });

        // 2. ตั้งค่า Hell Gate (โซนรับของ)
        if (hellGate) {
            window.hellGateInstance = new Sortable(hellGate, {
                group: 'souls', // รับของจาก Grid ได้
                
                // เมื่อมีการโยนของลงมาในนี้ (onAdd)
                onAdd: function (evt) {
                    const itemEl = evt.item; // การ์ดที่ถูกโยนมา
                    const id = itemEl.getAttribute('data-id');
                    
                    // ลบการ์ดออกจากหน้าจอทันที (UI)
                    itemEl.remove();
                    
                    // เรียก Modal ยืนยันการลบ พร้อมส่งวิธีกู้คืนถ้ากดยกเลิก
                    openDeleteModal(id, () => {
                        // Callback: ถ้ากดยกเลิก ให้โหลดรายชื่อใหม่กลับมา
                        renderMembers();
                    });
                }
            });
        }
    }
}

// ฟังก์ชันบันทึกลำดับลง Firebase
function saveNewOrder() {
    if(!sortableInstance) return;

    const newOrderIds = sortableInstance.toArray(); // จะได้ ID ของ swipe-wrapper
    
    // อัปเดตทีละตัว
    newOrderIds.forEach((id, index) => {
        db.ref('members/' + id).update({
            order: index
        });
    });
    
    showToast("Formation Updated!", "success");
}

// 5. ADD MEMBER
function addNewMember() {
    const name = document.getElementById('newMemberName').value;
    const fb = document.getElementById('newMemberFB').value;
    const type = document.getElementById('newMemberGroup').value;

    if (name && fb) {
        // ให้สมาชิกใหม่ไปต่อท้ายสุด
        const maxOrder = members.length > 0 ? Math.max(...members.map(m => m.order || 0)) : 0;
        
        db.ref('members').push({ 
            name: name, 
            fb: fb, 
            type: type,
            order: maxOrder + 1 
        }).then(() => {
            showToast(`Summoned "${name}" successfully!`, "success");
            document.getElementById('newMemberName').value = "";
            document.getElementById('newMemberFB').value = "";
        });
    } else {
        showToast("Fill all runes!", "delete");
    }
}

// 6. DELETE SYSTEM (อัปเกรดให้รองรับ Callback)
function openDeleteModal(key, cancelCallback = null) {
    pendingDeleteKey = key;
    onCancelDelete = cancelCallback; // เก็บคำสั่งกู้คืนไว้ใช้

    const member = members.find(m => m.id === key);
    const memberName = member ? member.name : "Unknown Soul";

    const modalHTML = `
        <div id="customModal" class="modal-overlay">
            <div class="modal-content">
                <i class="fa-solid fa-fire" style="color:var(--blood); font-size:3rem; margin-bottom:15px; animation:burn 0.5s infinite alternate;"></i>
                <h3>BANISH TO HELL?</h3>
                <p>Cast <strong>"${memberName}"</strong> into the abyss?</p>
                <div class="modal-btns">
                    <button onclick="confirmDelete()" class="confirm-btn">YES, BURN</button>
                    <button onclick="closeModal()" class="cancel-btn">MERCY</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmDelete() {
    if (pendingDeleteKey) {
        db.ref('members/' + pendingDeleteKey).remove().then(() => {
            showToast("Soul Banished.", "delete");
            closeModal(); // ปิด Modal ปกติ
            
            // เคลียร์ Callback เพราะลบไปแล้ว ไม่ต้องกู้คืน
            onCancelDelete = null;
        });
    }
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.remove();

    // ถ้ามีการฝากคำสั่งกู้คืนไว้ (กรณีลากลงนรกแล้วเปลี่ยนใจ) ให้ทำงาน
    if (onCancelDelete) {
        onCancelDelete();
        onCancelDelete = null;
    }
}

// --- NAVIGATION & AUTH ---
function enterSite() {
    const landing = document.getElementById('landingPage');
    landing.style.opacity = '0';
    landing.style.visibility = 'hidden';
    setTimeout(() => {
        document.getElementById('mainNav').style.display = 'block';
        document.getElementById('memberPage').style.display = 'block';
        loadMembers(); 
    }, 800);
}
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(pageId === 'adminPage') document.getElementById('nav-adm').classList.add('active');
    
    if(pageId === 'memberPage') renderMembers();
}
function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderMembers();
}
function handleAuth(e) {
    e.preventDefault();
    const u = btoa(document.getElementById('userInp').value);
    const p = btoa(document.getElementById('passInp').value);
    if (u === AUTH.u && p === AUTH.p) {
        isAdmin = true;
        document.getElementById('loginFormSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        showToast("Welcome, Gate Keeper.", "success");
        renderMembers();
    } else {
        showToast("Wrong Spell!", "delete");
    }
}
function handleLogout() {
    isAdmin = false;
    document.getElementById('loginFormSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('userInp').value = "";
    document.getElementById('passInp').value = "";
    showToast("Gate Closed.", "success");
    renderMembers();
}
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'delete' ? 'delete' : ''}`;
    const icon = type === 'delete' ? '<i class="fa-solid fa-skull"></i>' : '<i class="fa-solid fa-check"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)'; 
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// *** Swipe to Delete Logic (ระบบปัดซ้ายลบ - ยังคงอยู่) ***
function initSwipeSystem() {
    const cards = document.querySelectorAll('.member-card');

    cards.forEach(card => {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        const startEvents = ['mousedown', 'touchstart'];
        const moveEvents = ['mousemove', 'touchmove'];
        const endEvents = ['mouseup', 'mouseleave', 'touchend'];

        startEvents.forEach(evt => {
            card.addEventListener(evt, (e) => {
                if (e.target.closest('a')) return;
                isSwiping = true;
                card.classList.add('swiping');
                startX = e.pageX || e.touches[0].pageX;
            });
        });

        moveEvents.forEach(evt => {
            card.addEventListener(evt, (e) => {
                if (!isSwiping) return;
                const x = e.pageX || e.touches[0].pageX;
                const walk = x - startX;
                if (walk < 0) {
                    card.style.transform = `translateX(${Math.max(-120, walk)}px)`;
                    currentX = walk;
                }
            });
        });

        endEvents.forEach(evt => {
            card.addEventListener(evt, () => {
                if (!isSwiping) return;
                isSwiping = false;
                card.classList.remove('swiping');
                if (currentX < -80) {
                    const wrapper = card.closest('.swipe-wrapper');
                    const id = wrapper.getAttribute('data-id');
                    openDeleteModal(id); // เรียก Modal แบบปกติ (ไม่ต้อง Callback เพราะ Swipe ไม่ได้ลบ Element ทิ้งทันที)
                    card.style.transform = `translateX(0)`;
                } else {
                    card.style.transform = `translateX(0)`;
                }
                currentX = 0;
            });
        });
    });
}