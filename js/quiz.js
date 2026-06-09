/* ========================================================================= */
/* TEMPORIA QUIZ - HIGH-FIDELITY DASHBOARD LOGIC (ADDED MORE DETAILS)        */
/* ========================================================================= */

const announcements = [
    { 
        badge: '<i class="fa-solid fa-fire"></i> SỰ KIỆN MỚI', 
        title: 'Cuộc thi: Hào khí Đông A sắp diễn ra', 
        desc: 'Tham gia ngay để tranh tài kiến thức về 3 lần kháng chiến chống Mông Nguyên và nhận Huy hiệu Độc quyền từ Temporia.', 
        image: 'test/tc1.jpg' // <--- ĐƯỜNG DẪN ẢNH NỀN SỰ KIỆN 1
    },
    { 
        badge: '<i class="fa-solid fa-bullhorn"></i> THÔNG BÁO', 
        title: 'Cập nhật 50 bài tập mới vào Lộ trình', 
        desc: 'Đã bổ sung thêm hệ thống câu hỏi siêu khó cho Kỷ nguyên Độc Lập. Hoàn thành để cày điểm XP ngay hôm nay!', 
        image: 'test/tc2x.png' // <--- ĐƯỜNG DẪN ẢNH NỀN SỰ KIỆN 2
    }
];
let currentAnnounce = 0;

document.addEventListener('DOMContentLoaded', () => {
    
    initHeroDots();
  
    renderGeneralLeaderboard();
    renderContestHorizontal();
    initSafeScrollReveal();
    loadPracticeStats();
});

function initHeroDots() { document.getElementById('heroDots').innerHTML = announcements.map((_, i) => `<div class="h-dot ${i === 0 ? 'active' : ''}"></div>`).join(''); }
window.nextAnnouncement = function() {
    const content = document.getElementById('heroContent');
    const banner = document.getElementById('heroBanner');
    content.classList.add('fade-out');
    
    setTimeout(() => {
        currentAnnounce = (currentAnnounce + 1) % announcements.length;
        const data = announcements[currentAnnounce];
        
        document.getElementById('heroBadge').innerHTML = data.badge;
        document.getElementById('heroTitle').innerText = data.title;
        document.getElementById('heroDesc').innerText = data.desc;
        
        // ĐỔI HÌNH NỀN TRỰC TIẾP CHO KHUNG BANNER
        banner.style.backgroundImage = `url('${data.image}')`;
        
        document.querySelectorAll('.h-dot').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.h-dot')[currentAnnounce].classList.add('active');
        content.classList.remove('fade-out');
    }, 400);
}
setInterval(nextAnnouncement, 8000);



// BẢNG VÀNG DANH NHÂN
const generalData = [
    { rank: '01', name: 'Thiên Sinh', date: '15/05/2004', badges: 198, streak: 45, tag: 'Huyền Thoại', tagIcon: 'fa-trophy', colorClass: 'c1', avatar: 'https://i.pinimg.com/736x/d2/d2/db/d2d2db96bc55ab06f74a11064024bae5.jpg', trend: 'up', trendVal: '2' },
    { rank: '02', name: 'Lê Minh Tú', date: '22/09/2005', badges: 182, streak: 31, tag: 'Đại Sư', tagIcon: 'fa-star', colorClass: 'c2', avatar: 'https://i.pinimg.com/1200x/07/b8/f8/07b8f8645c0a29934001c00be80380c6.jpg', trend: 'down', trendVal: '1' },
    { rank: '03', name: 'Trần Bảo Ngọc', date: '08/11/2006', badges: 165, streak: 28, tag: 'Cao Thủ', tagIcon: 'fa-bolt', colorClass: 'c3', avatar: 'https://i.pinimg.com/736x/ec/18/f8/ec18f8b5284783fde871f5de62b68a47.jpg', trend: 'up', trendVal: '4' }
];

function generateLBHTML(dataList) {
    return dataList.map(user => {
        const trendHTML = user.trend === 'up' 
            ? `<span class="trend up"><i class="fa-solid fa-caret-up"></i> ${user.trendVal}</span>`
            : `<span class="trend down"><i class="fa-solid fa-caret-down"></i> ${user.trendVal}</span>`;
            
        return `
        <div class="vip-card">
            <div class="vip-rank rank-${user.colorClass}">${user.rank}</div>
            <img src="${user.avatar}" class="vip-avatar" alt="${user.name}">
            <div class="vip-info">
                <div class="vip-header-row">
                    <span class="vip-name">${user.name} ${trendHTML}</span>
                    <span class="vip-date"><i class="fa-regular fa-calendar"></i> ${user.date}</span>
                </div>
                <div class="vip-stats-row">
                    <span><i class="fa-solid fa-medal"></i> ${user.badges}/200 Huy hiệu</span>
                    <span><i class="fa-solid fa-fire"></i> Chuỗi ${user.streak} ngày</span>
                </div>
                <div class="vip-progress-bg"><div class="vip-progress-fill fill-${user.colorClass}"></div></div>
            </div>
            <div class="vip-tag tag-${user.colorClass}"><i class="fa-solid ${user.tagIcon}"></i> ${user.tag}</div>
        </div>
    `}).join('');
}

function renderGeneralLeaderboard() {
    const generalList = document.getElementById('generalLeaderboardList');
    const fullList = document.getElementById('fullLeaderboardList');

    if (generalList) generalList.innerHTML = generateLBHTML(generalData);
    
    if (fullList) {
        const expandedData = [...generalData, 
            { rank: '04', name: 'Nguyễn Văn Anh', date: '01/01/2007', badges: 150, streak: 20, tag: 'Tinh Anh', tagIcon: 'fa-shield', colorClass: 'c3', avatar: 'https://i.pinimg.com/736x/f5/c8/47/f5c84788fe4030d474c8ba1067c3110f.jpg', trend: 'down', trendVal: '1' },
            { rank: '05', name: 'Lê Hoàng Bảo', date: '12/10/2006', badges: 142, streak: 15, tag: 'Cao Thủ', tagIcon: 'fa-bolt', colorClass: 'c3', avatar: 'https://i.pinimg.com/736x/51/d0/81/51d081259619391ecaf1ed5b74ca73b5.jpg', trend: 'up', trendVal: '2' },
            { rank: '06', name: 'Phạm Thị Châu', date: '05/03/2005', badges: 130, streak: 10, tag: 'Cao Thủ', tagIcon: 'fa-bolt', colorClass: 'c3', avatar: 'https://i.pinimg.com/736x/82/48/b7/8248b74f7d5ac340fdb200ce349c20de.jpg', trend: 'down', trendVal: '2' }
        ];
        fullList.innerHTML = generateLBHTML(expandedData);
    }
}

window.openLeaderboardModal = () => document.getElementById('lbModalOverlay').classList.add('show');
window.closeLeaderboardModal = () => document.getElementById('lbModalOverlay').classList.remove('show');

// DANH SÁCH THẺ CUỘC THI - THÊM EMAIL (MOCK BRAND SOLVIA) VÀ NGÀY SINH
// DATABASE MOCK MỚI (Bỏ trường, thêm Vai trò và Kỷ nguyên)
const contestDatabase = {
    'q2': [ 
        { rank: 1, name: 'Vũ Hải Quân', role: 'Nhà thám hiểm', era: 'Kỷ Hồng Bàng', score: '25.500', avatar: 'https://i.pinimg.com/736x/a4/ba/d7/a4bad72167200d19f5a54e3c36169efe.jpg', time: '12p 30s', acc: '98%', dob: '15/08/2005', email: 'quan.vu@solvia.vn' }, 
        { rank: 2, name: 'Đặng Ngọc', role: 'Học sinh', era: 'Thời Bắc Thuộc', score: '24.100', avatar: 'https://i.pinimg.com/736x/7d/cc/a4/7dcca42342bbc30b92df018b74422c16.jpg', time: '14p 10s', acc: '95%', dob: '02/11/2006', email: 'ngoc.dang@solvia.vn' }, 
        { rank: 3, name: 'Bùi Anh', role: 'Sinh viên', era: 'Thời Phong Kiến', score: '22.850', avatar: 'https://i.pinimg.com/736x/e3/90/0e/e3900e29625c3c1038ef6cfd88c337a3.jpg', time: '15p 05s', acc: '92%', dob: '22/01/2007', email: 'anh.bui@solvia.vn' }
    ],
    'q1': [ 
        { rank: 1, name: 'Thiên Sinh', role: 'Chỉ huy', era: 'Thời Cận Đại', score: '30.200', avatar: 'https://i.pinimg.com/1200x/2b/c7/8a/2bc78ada6efb0115b1a7c31755e2350f.jpg', time: '10p 15s', acc: '100%', dob: '15/05/2004', email: 'thiensinh@solvia.vn' }
    ]
};

// LOGIC CUSTOM DROPDOWN
let currentSelectedContest = 'q2';

window.toggleContestDropdown = function(event) {
    event.stopPropagation();
    document.getElementById('contestDropdown').classList.toggle('open');
}

window.selectContestOption = function(value, text) {
    document.getElementById('contestDropdownText').innerText = text;
    currentSelectedContest = value;
    renderContestHorizontal();
}

// Bấm ra ngoài thì đóng dropdown
document.addEventListener('click', () => {
    const dropdown = document.getElementById('contestDropdown');
    if (dropdown) dropdown.classList.remove('open');
});

window.renderContestHorizontal = function() {
    const data = contestDatabase[currentSelectedContest];
    const container = document.getElementById('contestHorizontalList');
    if(!container) return;

    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        container.innerHTML = data.map(user => {
            const rankClass = user.rank === 1 ? 'hc-rank-1' : user.rank === 2 ? 'hc-rank-2' : user.rank === 3 ? 'hc-rank-3' : '';
            const rankLabel = user.rank === 1 ? '<i class="fa-solid fa-crown"></i> TOP 1' : `TOP ${user.rank}`;
            return `
                <div class="hc-card">
                    <div class="hc-rank-badge ${rankClass}">${rankLabel}</div>
                    <img src="${user.avatar}" class="hc-avatar">
                    <span class="hc-name">${user.name}</span>
                    <span class="hc-meta"><i class="fa-solid fa-user-astronaut"></i> ${user.role} | <i class="fa-solid fa-hourglass-half"></i> ${user.era}</span>
                    
                    <div class="hc-personal-info">
                        <span><i class="fa-regular fa-envelope"></i> ${user.email}</span>
                        <span><i class="fa-regular fa-calendar-days"></i> ${user.dob}</span>
                    </div>

                    <div class="hc-detail-grid">
                        <div class="hc-detail-item"><i class="fa-regular fa-clock"></i> <span>Thời gian</span> ${user.time}</div>
                        <div class="hc-detail-item"><i class="fa-solid fa-bullseye"></i> <span>Chính xác</span> ${user.acc}</div>
                    </div>

                    <div class="hc-score-box">${user.score} XP</div>
                </div>
            `;
        }).join('');
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
        container.scrollTo({ left: 0, behavior: 'smooth' });
    }, 300);
}
function initSafeScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach(el => el.classList.add('will-reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('will-reveal');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
    
    reveals.forEach(el => observer.observe(el));
    setTimeout(() => { reveals.forEach(el => el.classList.remove('will-reveal')); }, 1500);
}

const API_BASE_URL = 'https://temporia-api.onrender.com/api'; // Thay bằng URL thực tế của API
let dashboardCountdownTimer = null;

async function loadDynamicContestCard() {
    const card = document.getElementById('dynamicContestCard');
    if (!card) return;

    try {
        // 1. LẤY TIẾN ĐỘ ĐỂ XEM ĐÃ THI CHƯA
        const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
        const safeUser = user.email || user.username || '';
        let passedQuizzes = [];
        if (safeUser) {
            try {
                const progRes = await fetch(`${API_BASE_URL}/progress/${safeUser}`);
                if (progRes.ok) {
                    const progData = await progRes.json();
                    passedQuizzes = progData.completed_quizzes || [];
                }
            } catch(e) {}
        }

        // 2. LẤY DỮ LIỆU ĐẤU TRƯỜNG TỪ DATABASE
        const res = await fetch(`${API_BASE_URL}/arena/battles`);
        const data = await res.json();

        if (data.status === 'success' && data.battles.length > 0) {
            const now = new Date();
            
            // Xóa múi giờ Z để lấy đúng giờ Việt Nam
            let battles = data.battles.map(b => {
                if (b.start_time) b.start_time = b.start_time.replace('Z', '').replace('+00:00', '');
                if (b.end_time) b.end_time = b.end_time.replace('Z', '').replace('+00:00', '');
                return b;
            });

            // Lọc ra các cuộc thi CHƯA KẾT THÚC
            let activeBattles = battles.filter(b => now <= new Date(b.end_time));

            // NẾU HẾT HẠN TẤT CẢ -> HIỆN TRẠNG THÁI TRỐNG
            if (activeBattles.length === 0) {
                renderEmptyState(card);
                return;
            }

            // Ưu tiên lấy cuộc thi gần nhất (hoặc đang diễn ra)
            activeBattles.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            const currentContest = activeBattles[0];
            const isCompleted = passedQuizzes.map(String).includes(currentContest.target_id.toString());

            // 3. XỬ LÝ TRẠNG THÁI VÀ RENDER HTML
            renderContestHTML(card, currentContest, isCompleted, now);

        } else {
            renderEmptyState(card);
        }
    } catch (error) {
        card.innerHTML = `<div style="text-align:center; padding: 40px; color:#dc2626;"><i class="fa-solid fa-bug"></i> Lỗi kết nối hệ thống</div>`;
    }
}

// ==========================================
// HÀM VẼ GIAO DIỆN THEO TỪNG TRẠNG THÁI (ĐÃ FIX FULL THÔNG TIN)
// ==========================================
function renderContestHTML(card, contest, isCompleted, now) {
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    // Hàm định dạng ngày tháng gọn gàng
    const formatD = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const timeString = `${formatD(startTime)} đến ${formatD(endTime)}`;
    
    let stateClass = '';
    let countdownLabel = '';
    let targetDate = null;
    let buttonHTML = '';
    let headerIcon = '<i class="fa-solid fa-book-open"></i> <span>Đấu Trường Lịch Sử</span>';
    let liveStatusText = 'Hãy chuẩn bị tinh thần và trí tuệ tốt nhất!';
    let pulseHtml = '<div class="pulse-dot"></div>';

    // Xác định mốc thời gian thực tế
    const isLive = now >= startTime && now <= endTime;

    // KIỂM TRA LOGIC TRẠNG THÁI
    if (isCompleted) {
        // TRẠNG THÁI 4: ĐÃ HOÀN THÀNH
      stateClass = 'state-completed';
        headerIcon = '<i class="fa-solid fa-medal"></i> <span>Đã Vinh Danh</span>';
        liveStatusText = 'Bạn đã hoàn thành xuất sắc cuộc thi này!';
        pulseHtml = '<i class="fa-solid fa-circle-check" style="color: #16a34a; font-size: 1.1rem; margin-right: 5px;"></i>';
        
        // ĐÃ SỬA DÒNG NÀY:
        buttonHTML = `<button class="btn-primary-red" style="background: #16a34a; box-shadow: 0 5px 20px rgba(22, 163, 74, 0.3);" onclick="handleAuthNavigation(event, 'arena.html')">Vào Sảnh Đấu Trường <i class="fa-solid fa-arrow-right"></i></button>`;
        
        // Vẫn giữ đồng hồ đếm ngược nếu cuộc thi đang diễn ra
        if (isLive) {
            stateClass = 'state-live';
        headerIcon = '<i class="fa-solid fa-fire"></i> <span style="font-weight:800;">SỰ KIỆN ĐANG MỞ CỔNG</span>';
        countdownLabel = '<i class="fa-solid fa-triangle-exclamation"></i> Thời gian còn lại để nộp bài:';
        targetDate = endTime;
        
        // ĐÃ SỬA DÒNG NÀY:
        buttonHTML = `<button class="btn-primary-red" onclick="handleAuthNavigation(event, 'arena.html')">Tham Chiến Ngay <i class="fa-solid fa-arrow-right"></i></button>`;
        liveStatusText = 'Đang có rất nhiều sĩ tử tham gia tranh tài!';
        } else {
            stateClass = 'state-upcoming';
        countdownLabel = 'Đếm ngược khai mạc:';
        targetDate = startTime;
        
        // ĐÃ SỬA DÒNG NÀY:
        buttonHTML = `<button class="btn-primary-red" style="background:#1e293b;" onclick="handleAuthNavigation(event, 'arena.html')">Vào Sảnh Chờ <i class="fa-solid fa-arrow-right"></i></button>`;
        }
    } 
    else if (isLive) {
        // TRẠNG THÁI 3: ĐANG DIỄN RA
        stateClass = 'state-live';
        headerIcon = '<i class="fa-solid fa-fire"></i> <span style="font-weight:800;">SỰ KIỆN ĐANG MỞ CỔNG</span>';
        countdownLabel = '<i class="fa-solid fa-triangle-exclamation"></i> Thời gian còn lại để nộp bài:';
        targetDate = endTime;
        buttonHTML = `<button class="btn-primary-red" style="background:#f1f5f9; color:#1e293b; box-shadow:none;" onclick="handleAuthNavigation(event, 'arena.html')">
                Xem Lịch Sử Đấu Trường <i class="fa-solid fa-arrow-right"></i>
            </button>`;
        liveStatusText = 'Đang có rất nhiều sĩ tử tham gia tranh tài!';
    } 
    else {
        // TRẠNG THÁI 2: SẮP TỚI
        stateClass = 'state-upcoming';
        countdownLabel = 'Đếm ngược khai mạc:';
        targetDate = startTime;
        buttonHTML = `<button class="btn-primary-red" style="background:#1e293b;" onclick="window.location.href='arena.html'">Vào Sảnh Chờ <i class="fa-solid fa-arrow-right"></i></button>`;
    }

    // ĐỔ HTML VỚI ĐẦY ĐỦ THÔNG SỐ (Ngày giờ, giải thưởng)
    card.className = `bento-card card-contest ${stateClass}`;
    card.innerHTML = `
        <i class="fa-solid fa-khanda card-bg-icon"></i>
        <div class="card-head">${headerIcon}</div>
        <h3 class="contest-title">${contest.title}</h3>
        
        <div class="contest-meta">
            <div class="c-meta-item"><i class="fa-solid fa-list-ol"></i> ${contest.total_questions} Câu</div>
            <div class="c-meta-item"><i class="fa-regular fa-clock"></i> ${contest.time_limit} Phút</div>
            <div class="c-meta-item text-orange"><i class="fa-solid fa-bolt"></i> ${contest.difficulty}</div>
        </div>

        <div class="contest-details-box" style="margin-top: 20px; background: rgba(255,255,255,0.6); padding: 15px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
            <div class="c-detail-row" style="margin-bottom: 8px; font-size: 0.9rem; color: #475569;"><i class="fa-solid fa-gift text-orange" style="width: 20px;"></i> <b>Phần thưởng:</b> Điểm XP & Huy hiệu Đấu trường</div>
            <div class="c-detail-row" style="font-size: 0.9rem; color: #475569;"><i class="fa-regular fa-calendar-check" style="width: 20px;"></i> <b>Thời gian:</b> ${timeString}</div>
        </div>

        <div class="contest-live-status" style="margin-top: 15px; display: flex; align-items: center;">
            ${pulseHtml} <span style="font-weight: 600; color: #475569;">${liveStatusText}</span>
        </div>

        <p class="countdown-label" style="margin-top: 20px; margin-bottom:10px; font-weight: 700;">${countdownLabel}</p>
        <div class="countdown-wrapper" id="dynCountdownTimer" style="${!targetDate ? 'display:none;' : ''}">
            <div class="time-block"><span id="c-days">00</span><small>NGÀY</small></div><div class="time-divider">:</div>
            <div class="time-block"><span id="c-hours">00</span><small>GIỜ</small></div><div class="time-divider">:</div>
            <div class="time-block"><span id="c-mins">00</span><small>PHÚT</small></div><div class="time-divider">:</div>
            <div class="time-block"><span id="c-secs">00</span><small>GIÂY</small></div>
        </div>

        <div style="margin-top:25px;">${buttonHTML}</div>
    `;

    // Kích hoạt đồng hồ nếu cần
    if (targetDate) {
        startDashboardCountdown(targetDate);
    }
}
// TRẠNG THÁI 1: KHÔNG CÓ CUỘC THI NÀO
function renderEmptyState(card) {
    card.className = `bento-card card-contest state-empty`;
    card.innerHTML = `
        <i class="fa-solid fa-mug-hot card-bg-icon" style="opacity:0.03;"></i>
        <div class="card-head"><span>Đấu Trường Lịch Sử</span></div>
        
        <div style="text-align: center; padding: 40px 10px;">
            <div style="width: 80px; height:80px; background:#f1f5f9; color:#94a3b8; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; margin: 0 auto 20px auto;">
                <i class="fa-solid fa-calendar-xmark"></i>
            </div>
            <h3 class="contest-title" style="margin:0 0 10px 0; color:#475569;">Đang nghỉ ngơi dưỡng sức</h3>
            <p style="color:#64748b; font-size:0.9rem; line-height:1.6; margin-bottom:25px;">Hiện tại hệ thống chưa có sự kiện nào được lên lịch. Hãy tận dụng thời gian này để rèn luyện trong phòng tập nhé!</p>
            <button class="btn-primary-red" style="background:#f1f5f9; color:#1e293b; box-shadow:none;" onclick="window.location.href='arena.html'">
                Xem Lịch Sử Đấu Trường <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `;
}

// ĐỘNG CƠ ĐẾM NGƯỢC THỜI GIAN THỰC
function startDashboardCountdown(targetDate) {
    clearInterval(dashboardCountdownTimer);
    
    function update() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            clearInterval(dashboardCountdownTimer);
            loadDynamicContestCard(); // Hết giờ tự động Load lại để chuyển trạng thái!
            return;
        }

        document.getElementById("c-days").innerText = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        document.getElementById("c-hours").innerText = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        document.getElementById("c-mins").innerText = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        document.getElementById("c-secs").innerText = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
    }
    
    update();
    dashboardCountdownTimer = setInterval(update, 1000);
}

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', loadDynamicContestCard);


// ==========================================
// HÀM TẢI DỮ LIỆU RÈN LUYỆN CÁ NHÂN (THỰC TẾ 100%)
// ==========================================
async function loadPracticeStats() {
    const card = document.querySelector('.card-practice');
    if (!card) return;

    // 1. Lấy thông tin User và Tiến độ làm bài
    const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
    const safeUser = user.email || user.username || '';
    let passedQuizzes = [];
    let streak = user.streak_count || 0; // Lấy chuỗi ngày rèn luyện

    if (safeUser) {
        try {
            const progRes = await fetch(`${API_BASE_URL}/progress/${safeUser}`);
            if (progRes.ok) {
                const progData = await progRes.json();
                passedQuizzes = progData.completed_quizzes || [];
            }
        } catch(e) { console.warn("Lỗi tải tiến độ"); }
    }

    // 2. Quét Lộ trình học: Đếm Tổng bài & Tìm bài chưa học gần nhất
    let totalLessons = 0;
    let completedCount = 0;
    let nextLessonId = null;
    let nextLessonTitle = "Bạn đã hoàn thành tất cả!";

    try {
        const roadRes = await fetch(`${API_BASE_URL}/roadmap`);
        const roadData = await roadRes.json();

        if (roadData.status === 'success') {
            let foundNext = false;
            roadData.chapters.forEach(chapter => {
                chapter.lessons.forEach(lesson => {
                    totalLessons++;
                    // Kiểm tra xem bài này đã có trong mảng hoàn thành chưa
                    const isDone = passedQuizzes.map(String).includes(lesson.id.toString());
                    
                    if (isDone) {
                        completedCount++;
                    } else if (!foundNext) {
                        // Bắt trúng bài đầu tiên chưa làm -> Gán làm Đề xuất tiếp theo
                        nextLessonId = lesson.id;
                        nextLessonTitle = lesson.title;
                        foundNext = true;
                    }
                });
            });
        }

        // 3. Gọi API để moi thông số chi tiết của Bài Đề Xuất
        let nextMetaHTML = `<span><i class="fa-solid fa-check-double"></i> Chúc mừng bạn đã hoàn thành Lộ trình!</span>`;
        
        if (nextLessonId) {
            try {
                const quizRes = await fetch(`${API_BASE_URL}/quiz/lesson/${nextLessonId}`);
                const quizData = await quizRes.json();
                
                if (quizData.status === 'success' && quizData.data) {
                    let qCount = 0;
                    try {
                        const qData = typeof quizData.data.questions_data === 'string' ? JSON.parse(quizData.data.questions_data) : quizData.data.questions_data;
                        qCount = qData ? qData.length : 0;
                    } catch(e){}
                    
                    nextMetaHTML = `
                        <span><i class="fa-solid fa-folder-open"></i> ${qCount} Câu</span>
                        <span><i class="fa-regular fa-clock"></i> ${quizData.data.time_limit} Phút</span>
                        <span class="text-orange"><i class="fa-solid fa-bolt"></i> ${quizData.data.difficulty}</span>
                    `;
                } else {
                    nextMetaHTML = `<span><i class="fa-solid fa-hammer"></i> Bài tập đang được nâng cấp...</span>`;
                }
            } catch(e) {
                nextMetaHTML = `<span><i class="fa-solid fa-bug"></i> Lỗi lấy dữ liệu bài tập</span>`;
            }
        }

        // 4. Vẽ mô phỏng Chuỗi ngày (Streak)
        let daysHtml = '';
        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        for(let i = 0; i < 7; i++) {
            if (i < streak) { // Những ngày trong chuỗi sẽ sáng lên và có dấu Tick
                daysHtml += `<div class="ws-day done"><i class="fa-solid fa-check"></i></div>`;
            } else {
                daysHtml += `<div class="ws-day">${dayNames[i]}</div>`;
            }
        }

        // 5. BƠM GIAO DIỆN (HTML) VÀO TRONG THẺ
        card.innerHTML = `
            <i class="fa-solid fa-graduation-cap card-bg-icon"></i>
            <div class="card-head">
                <i class="fa-solid fa-crosshairs"></i> <span>Rèn Luyện Cá Nhân</span>
            </div>
            <p class="practice-desc">Hệ thống bài tập trắc nghiệm được phân bổ khoa học, bám sát nội dung từng giai đoạn của Lộ trình học. Bạn cần hoàn thành các bài tập này để mở khóa chương mới và thu thập kinh nghiệm (XP).</p>
            
            <div class="weekly-streak-container">
                <div class="ws-header">
                    <span>Chuỗi học tập</span>
                    <span class="text-orange" style="font-weight: 800;"><i class="fa-solid fa-fire"></i> ${streak} ngày</span>
                </div>
                <div class="ws-days">
                    ${daysHtml}
                </div>
            </div>

            <div class="recommend-box">
                <p class="rc-title">Đề xuất tiếp theo: <b>${nextLessonTitle}</b></p>
                <div class="rc-meta">
                    ${nextMetaHTML}
                </div>
            </div>

            <div class="practice-stats" style="display: flex; gap: 15px; margin-top: 20px;">
                <div class="stat-col" style="flex: 1; background: #f8fafc; padding: 15px 20px; border-radius: 16px; border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 5px;">
                    <small style="color: #64748b; font-weight: 700; font-size: 0.85rem;">Tổng số bài</small>
                    <strong style="font-size: 2.2rem; color: #1e293b; font-weight: 800; line-height: 1;">${totalLessons}</strong>
                </div>
                <div class="stat-col" style="flex: 1; background: #f0fdf4; padding: 15px 20px; border-radius: 16px; border: 1px solid #dcfce3; display: flex; flex-direction: column; gap: 5px;">
                    <small style="color: #64748b; font-weight: 700; font-size: 0.85rem;">Đã hoàn thành</small>
                    <strong class="text-green" style="font-size: 2.2rem; color: #10b981; font-weight: 800; line-height: 1;">${completedCount}</strong>
                </div>
            </div>

            <a href="#" onclick="handleAuthNavigation(event, 'quiz-play.html')" class="btn-secondary-gray" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 25px; padding: 16px; background: #f1f5f9; color: #1e293b; border-radius: 16px; font-weight: 800; text-decoration: none; transition: 0.3s; border: 1px solid #e2e8f0;">
                Vào Phòng Tập <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        `;

    } catch (error) {
        console.error("Lỗi tổng quát:", error);
    }
}

/* ========================================================================= */
/* HỆ THỐNG KHÓA NÚT YÊU CẦU ĐĂNG NHẬP (AUTH GATE)                           */
/* ========================================================================= */

window.handleAuthNavigation = function(event, url) {
    event.preventDefault(); // Dừng ngay hành động chuyển trang
    const userSession = localStorage.getItem('temporia_user');

    if (!userSession) {
        showAuthGateToast(); // Chưa đăng nhập -> Hiện sương mù + Popup
    } else {
        window.location.href = url; // Đã đăng nhập -> Cho đi tiếp
    }
};

// Hàm điều khiển Popup trượt xuống mượt mà
window.showAuthGateToast = function() {
    const toast = document.getElementById('authGateToast');
    const overlay = document.getElementById('agtOverlay');
    const closeBtn = document.getElementById('agtCloseBtn');
    
    if (!toast || !overlay) return;
    
    toast.classList.add('show');
    overlay.classList.add('show');
    
    const closeAuthToast = () => {
        toast.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => { toast.style.transform = ''; }, 400); 
    };

    overlay.onclick = closeAuthToast;
    if (closeBtn) closeBtn.onclick = closeAuthToast;

    // Hiệu ứng vật lý vuốt để tắt của Apple
    let startY = 0, startX = 0, currentY = 0, currentX = 0, isDragging = false;
    
    const onDragStart = (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return; 
        isDragging = true; toast.classList.add('dragging');
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };
    
    const onDragMove = (e) => {
        if (!isDragging) return;
        currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let diffY = currentY - startY; let diffX = currentX - startX;
        if (diffY > 0) diffY = diffY * 0.15; 
        toast.style.transform = `translateX(calc(-50% + ${diffX}px)) translateY(${diffY}px) scale(0.98)`;
    };
    
    const onDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false; toast.classList.remove('dragging');
        let diffY = currentY - startY; let mathDiffX = Math.abs(currentX - startX);
        if (diffY < -25 || mathDiffX > 50) { 
            closeAuthToast();
        } else { 
            toast.style.transform = ''; 
        }
    };

    toast.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    toast.addEventListener('touchstart', onDragStart, {passive: true});
    window.addEventListener('touchmove', onDragMove, {passive: true});
    window.addEventListener('touchend', onDragEnd);
};
