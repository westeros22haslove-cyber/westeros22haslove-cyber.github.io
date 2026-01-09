// สมาชิก
const members = [
    { name: "Whiteshark Westeros", fb: "https://www.facebook.com/whiteshark.lamoonboy" },
    { name: "Ralph Westeros", fb: "https://www.facebook.com/ralph.winterfell" },
    { name: "Sunny Westeros", fb: "https://www.facebook.com/profile.php?id=100077895669164" },
    { name: "Tyga Westeros", fb: "https://www.facebook.com/profile.php?id=100080619094803" },
    { name: "Nolan Westeros", fb: "https://www.facebook.com/nolan.powell.359" },
    { name: "Juju Westeros", fb: "https://www.facebook.com/p1sdontbreakmyheart" },
    { name: "Snow Westeros", fb: "https://www.facebook.com/snow.horifly" },
    { name: "Thai Westeros", fb: "https://www.facebook.com/profile.php?id=61583037603144" },
    { name: "June Westeros", fb: "https://www.facebook.com/june.i.917375" },
    { name: "ter Westeros", fb: "https://www.facebook.com/nonix.lynx?locale=th_TH" },
    { name: "tea Westeros", fb: "https://www.facebook.com/profile.php?id=61584451264327&locale=th_TH" },
    { name: "Grey Westeros", fb: "https://www.facebook.com/grey.safesides?rdid=7XcKXprvpi2zURWW&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1BR9YfQY3s%2F#" },
];

const membersPerPage = 10; // feed grid สวยไม่เยอะเกิน
let currentPageIndex = 0;
let totalPages = Math.ceil(members.length / membersPerPage);

const memberListDiv = document.querySelector("#memberlist .list");
const pageInfo = document.querySelector(".page-info");

// Enter site
function enterSite() {
    document.getElementById("welcome").classList.remove("active");
    document.getElementById("memberlist").classList.add("active");
    currentPageIndex = 0;
    renderPage(currentPageIndex);
}

// Render feed page
function renderPage(index) {
    memberListDiv.innerHTML = ""; // ล้างหน้าเก่า
    const start = index * membersPerPage;
    const end = Math.min(start + membersPerPage, members.length);
    const pageMembers = members.slice(start, end);

    pageMembers.forEach(member => {
        const card = document.createElement("div");
        card.className = "card";

        const name = document.createElement("span");
        name.textContent = member.name;

        const btnDiv = document.createElement("div");
        const fbBtn = document.createElement("button");
        fbBtn.className = "mini";
        fbBtn.textContent = "Facebook";
        fbBtn.onclick = () => window.open(member.fb, "_blank");

        const copyBtn = document.createElement("button");
        copyBtn.className = "mini";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(member.fb);
            alert("Copied: " + member.fb);
        };

        btnDiv.appendChild(fbBtn);
        btnDiv.appendChild(copyBtn);

        card.appendChild(name);
        card.appendChild(btnDiv);

        memberListDiv.appendChild(card);
    });

    pageInfo.textContent = `${index + 1} / ${totalPages}`;
}

// NEXT / BACK
function goNext() {
    if (currentPageIndex < totalPages - 1) {
        currentPageIndex++;
        renderPage(currentPageIndex);
    }
}

function goBack() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        renderPage(currentPageIndex);
    }
}

// Search
function searchMember(value) {
    value = value.toLowerCase();
    const listDiv = document.querySelector("#memberlist .list");
    listDiv.innerHTML = ""; // ล้าง feed ปัจจุบัน

    // Filter สมาชิกทั้งหมด
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(value)
    );

    // แสดงผล filter แบบ feed grid
    filteredMembers.forEach(member => {
        const card = document.createElement("div");
        card.className = "card";

        const name = document.createElement("span");
        name.textContent = member.name;

        const btnDiv = document.createElement("div");
        const fbBtn = document.createElement("button");
        fbBtn.className = "mini";
        fbBtn.textContent = "Facebook";
        fbBtn.onclick = () => window.open(member.fb, "_blank");

        const copyBtn = document.createElement("button");
        copyBtn.className = "mini";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(member.fb);
            alert("Copied: " + member.fb);
        };

        btnDiv.appendChild(fbBtn);
        btnDiv.appendChild(copyBtn);

        card.appendChild(name);
        card.appendChild(btnDiv);

        listDiv.appendChild(card);
    });

    // ปิด pagination ถ้ามีคำค้น
    const pageInfo = document.querySelector(".page-info");
    const buttons = document.querySelectorAll(".btn.nav");
    if (value.trim() !== "") {
        pageInfo.style.display = "none";
        buttons.forEach(btn => btn.style.display = "none");
    } else {
        pageInfo.style.display = "inline";
        buttons.forEach(btn => btn.style.display = "inline-block");
        renderPage(currentPageIndex); // แสดงหน้าปกติ
    }
}

