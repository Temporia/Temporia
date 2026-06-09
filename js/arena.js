const API_BASE_URL = 'http://127.0.0.1:8000/api';

function formatDateTime(dateObj) {
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const xM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${hh}:${mm} - ${dd}/${xM}/${yyyy}`;
}

async function loadArenaBattles() {
    const container = document.getElementById('arena-battles-container');
    // Hiển thị trạng thái đang tải
    container.innerHTML = '<div style="text-align:center; color: #64748b; padding: 50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang nạp dữ liệu Đấu trường...</div>';
    
    try {
        // LẤY TIẾN ĐỘ USER
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
            } catch(e) { console.warn("Chưa đăng nhập hoặc lỗi tải tiến độ", e); }
        }
        
        // LẤY DANH SÁCH CUỘC THI TỪ API
        const res = await fetch(`${API_BASE_URL}/arena/battles`);
        const data = await res.json();
        
        if(data.status === 'success') {
            const now = new Date();
            const battles = data.battles;
            
            if(battles.length === 0) {
                container.innerHTML = '<div style="text-align:center; color: #64748b; padding: 50px;">Hiện chưa có cuộc thi nào được lên lịch trên hệ thống.</div>';
                return;
            }
            
            battles.forEach(b => {
                if (b.start_time) b.start_time = b.start_time.replace('Z', '').replace('+00:00', '');
                if (b.end_time) b.end_time = b.end_time.replace('Z', '').replace('+00:00', '');
            });
            battles.sort((a, b) => {
                const aLive = now >= new Date(a.start_time) && now <= new Date(a.end_time);
                const bLive = now >= new Date(b.start_time) && now <= new Date(b.end_time);
                const aEnded = now > new Date(a.end_time);
                const bEnded = now > new Date(b.end_time);

                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                if (aEnded && !bEnded) return 1;  // Thằng nào End rồi thì vứt xuống dưới
                if (!aEnded && bEnded) return -1; 
                return new Date(a.start_time) - new Date(b.start_time);
            });
            
            let delay = 100;
            container.innerHTML = battles.map(b => {
                const startTime = new Date(b.start_time);
                const endTime = new Date(b.end_time);
                
                const startTimeStr = formatDateTime(startTime);
                const endTimeStr = formatDateTime(endTime);
                
                let statusClass = 'upcoming';
                let statusText = 'SẮP KHỞI TRANH';
                let icon = 'fa-clock';
                let btnText = 'CHƯA MỞ CỔNG';
                let btnDisabled = 'disabled';
                let actionButtonsHTML = '';
                
                const isCompleted = passedQuizzes.map(String).includes(b.target_id.toString());

                // KIỂM TRA TRẠNG THÁI HIỆN TẠI
                if (now > endTime) {
                    statusClass = 'ended'; 
                    statusText = 'ĐÃ KẾT THÚC'; 
                    icon = 'fa-flag-checkered';
                    
                    // THUẬT TOÁN DELAY 3 NGÀY MỞ BẢNG XẾP HẠNG
                    const unlockTime = new Date(endTime.getTime() + (3 * 24 * 60 * 60 * 1000));
                    
                    if (now >= unlockTime) {
                        // Đã qua 3 ngày -> Cho xem bảng xếp hạng
                        actionButtonsHTML = `
                            <button class="btn-enter-battle" style="width: 100%; background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0;" onclick="openLeaderboard('${b.target_id}')">
                                <i class="fa-solid fa-ranking-star" style="color: #f59e0b;"></i> XEM BẢNG XẾP HẠNG
                            </button>
                        `;
                    } else {
                        // Chưa qua 3 ngày -> Khóa nút, báo đang tổng hợp
                        const hoursLeft = Math.ceil((unlockTime - now) / (1000 * 60 * 60));
                        actionButtonsHTML = `
                            <button class="btn-enter-battle disabled" style="width: 100%; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; cursor: not-allowed;">
                                <i class="fa-solid fa-lock"></i> KẾT QUẢ MỞ SAU ${hoursLeft} GIỜ
                            </button>
                        `;
                    }
                } else if (now >= startTime && now <= endTime) {
                    statusClass = 'live'; 
                    statusText = 'ĐANG DIỄN RA'; 
                    icon = 'fa-fire'; 
                    
                    if (isCompleted) {
                        actionButtonsHTML = `
                            <div style="display: flex; gap: 15px; width: 100%;">
                                <button class="btn-enter-battle" style="flex: 1; background: #10b981; color: #fff; border: none; cursor: default;">
                                    <i class="fa-solid fa-circle-check"></i> ĐÃ HOÀN THÀNH
                                </button>
                                <button class="btn-enter-battle" style="flex: 1; background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0;" onclick="openLeaderboard('${b.target_id}')">
                                    <i class="fa-solid fa-ranking-star" style="color: #f59e0b;"></i> BXH TẠM THỜI
                                </button>
                            </div>
                        `;
                    } else {
                        actionButtonsHTML = `
                            <button class="btn-enter-battle" onclick="enterBattle('${b.target_type}', '${b.target_id}')">
                                THAM CHIẾN NGAY <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        `;
                    }
                } else {
                    // Sắp diễn ra
                    actionButtonsHTML = `
                        <button class="btn-enter-battle disabled" style="cursor: not-allowed;">
                            CHƯA MỞ CỔNG <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    `;
                }
                
                return `
                <div class="battle-card ${statusClass === 'ended' ? 'is-expired' : ''} ${statusClass === 'live' ? 'is-live' : ''} anim-fade-up" style="animation-delay: ${delay}ms">
                    <div class="bc-header">
                        <div>
                            <h2 class="bc-title">${b.title}</h2>
                            <p class="bc-desc"><i class="fa-solid fa-trophy" style="color: #f59e0b;"></i> Đấu trường sinh tử chính thức</p>
                        </div>
                        <div class="bc-status ${statusClass}"><i class="fa-solid ${icon}"></i> ${statusText}</div>
                    </div>
                    
                    <div class="bc-extended-info">
                        <div class="bc-extended-row"><span class="bc-ext-label"><i class="fa-solid fa-bullseye"></i> Mục đích cuộc thi:</span><span class="bc-ext-val">Hệ thống khảo thí độc lập mô phỏng các chiến dịch cam go, giúp người học tự đánh giá năng lực ghi nhớ và vận dụng kiến thức lịch sử.</span></div>
                        <div class="bc-extended-row"><span class="bc-ext-label"><i class="fa-solid fa-circle-info"></i> Ý nghĩa cốt lõi:</span><span class="bc-ext-val">Tôn vinh các giá trị truyền thống, khơi dậy tinh thần yêu nước và lòng tự hào dân tộc thông qua việc thấu hiểu sâu sắc các quyết sách chiến lược của cha ông.</span></div>
                    </div>
                    
                    <div class="bc-info-grid">
                        <div class="bc-info-item"><small>SỐ CÂU HỎI</small><strong><i class="fa-solid fa-list-ol"></i> ${b.total_questions} Câu</strong></div>
                        <div class="bc-info-item"><small>THỜI GIAN</small><strong><i class="fa-regular fa-clock"></i> ${b.time_limit} Phút</strong></div>
                        <div class="bc-info-item"><small>MỨC ĐỘ</small><strong><i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> ${b.difficulty}</strong></div>
                        <div class="bc-info-item"><small>GIỜ MỞ CỔNG</small><strong><i class="fa-regular fa-calendar-check"></i> ${startTimeStr}</strong></div>
                        <div class="bc-info-item"><small>GIỜ ĐÓNG CỔNG</small><strong><i class="fa-regular fa-calendar-xmark"></i> ${endTimeStr}</strong></div>
                    </div>
                    
                    ${actionButtonsHTML}
                </div>
                `;
                delay += 100;
            }).join('');
        }
    } catch(e) {}
}


// Thay thế nội dung bên trong hàm openLeaderboard của file js/arena.js
async function openLeaderboard(id) {
    document.getElementById('leaderboardModal').classList.remove('hidden');
    const content = document.getElementById('leaderboardContent');
    content.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu Bảng Vàng...</div>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/arena/leaderboard/${id}`);
        const data = await res.json();
        
        if (data.status === 'success' && data.leaderboard.length > 0) {
            content.innerHTML = data.leaderboard.map((lb, idx) => {
                let rankClass = '';
                if(idx === 0) rankClass = 'top-1';
                else if(idx === 1) rankClass = 'top-2';
                else if(idx === 2) rankClass = 'top-3';
                
                // Lấy thông tin thực tế từ Backend
                const badges = lb.real_badges_count || 0;
                const streak = lb.streak_count || 0;
                
                // Logic tính toán Danh hiệu chuẩn xác dựa trên Tổng XP
                let rankName = lb.rank_name;
                if (!rankName) {
                    const xp = lb.total_xp || 0;
                    if(xp >= 1500) rankName = 'Truyền Thuyết';
                    else if(xp >= 500) rankName = 'Hào Kiệt';
                    else if(xp >= 200) rankName = 'Cao Thủ';
                    else rankName = 'Tập Sự';
                }
                
                const progressPercent = Math.min(100, Math.max(10, lb.score * 5)); 

                return `
                <div class="lb-pro-card ${rankClass}">
                    <div class="lb-pro-rank">${String(idx + 1).padStart(2, '0')}</div>
                    <img src="${lb.avatar_url || 'https://ui-avatars.com/api/?name='+lb.full_name}" class="lb-pro-avatar">
                    
                    <div class="lb-pro-info">
                        <h3 class="lb-pro-name">${lb.full_name} <i class="fa-solid fa-circle-check verify-tick"></i></h3>
                        <div class="lb-pro-stats">
                            <span class="stat-tag badge"><i class="fa-solid fa-medal"></i> ${badges}/200 Huy hiệu</span>
                            <span class="stat-tag streak"><i class="fa-solid fa-fire"></i> Chuỗi ${streak} ngày</span>
                            <span class="stat-tag rank"><i class="fa-solid fa-bolt"></i> ${rankName}</span>
                        </div>
                        <div class="lb-pro-bar-bg"><div class="lb-pro-bar-fill" style="width: ${progressPercent}%;"></div></div>
                    </div>

                    <div class="lb-pro-score-box">
                        <span class="score-label">ĐIỂM SỐ</span>
                        <span class="score-val">${lb.score}</span>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            content.innerHTML = '<div style="text-align:center; color: #64748b; padding: 20px;">Chưa có cao thủ nào ghi danh!</div>';
        }
    } catch(e) {
        content.innerHTML = '<div style="text-align:center; color: #dc2626; padding: 20px;">Lỗi tải bảng xếp hạng!</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadArenaBattles);
/* ========================================================================= */
/* ENGINE PHÒNG THI ĐẤU TRƯỜNG (CHẠY TRỰC TIẾP TRÊN TRANG, KHÔNG ĐỔI URL)    */
/* ========================================================================= */

let arenaCurrentQuestions = [];
let arenaUserAnswers = {};
let arenaIsLocked = {};
let arenaScore = 0;
let arenaActiveQIndex = 0;
let arenaTimerInterval = null;
let arenaCurrentId = null;
let isArenaQuizActive = false;

// GHI ĐÈ HÀM BẤM NÚT "THAM CHIẾN NGAY" (ÉP HIỆN PHÒNG THI)
async function enterBattle(type, id) {
    arenaCurrentId = id;
    
    // 1. Tắt sảnh ngoài, bật thao trường bên trong
    document.getElementById('arenaLobby').style.display = 'none';
    document.getElementById('arenaBattlefield').style.display = 'block';
    
    // 2. Ép hiển thị Thẻ Chờ
    document.getElementById('state-waiting').style.display = 'block';
    document.getElementById('state-quiz').style.display = 'none';

    // 3. Gọi Data từ máy chủ đắp vào Thẻ Chờ
    try {
        const res = await fetch(`${API_BASE_URL}/quiz/${type}/${id}`);
        const result = await res.json();

        if (result.status === 'success' && result.data) {
            window.arenaQuizData = result.data;
            arenaCurrentQuestions = typeof result.data.questions_data === 'string' ? JSON.parse(result.data.questions_data) : (result.data.questions_data || []);

            document.getElementById('qscTitle').innerText = result.data.title;
            document.getElementById('qscCount').innerText = arenaCurrentQuestions.length + " Câu";
            document.getElementById('qscTime').innerText = result.data.time_limit + " Phút";
            document.getElementById('qscDiff').innerText = result.data.difficulty;
            
            const diffIcon = document.getElementById('qscDiffIcon');
            const diffBox = document.getElementById('qscDiffBox');
            if(result.data.difficulty === 'Dễ') { diffIcon.style.color = '#10b981'; diffBox.style.background = '#d1fae5'; }
            else if(result.data.difficulty === 'Khó' || result.data.difficulty === 'Siêu khó') { diffIcon.style.color = '#dc2626'; diffBox.style.background = '#fef2f2'; }
            else { diffIcon.style.color = '#f59e0b'; diffBox.style.background = '#fffbeb'; }
        }
    } catch (e) { alert("Lỗi tải bài thi từ máy chủ!"); }
}

// Bấm nút "Quay lại" từ Thẻ Chờ để thoát ra Sảnh
window.exitArenaBattlefield = function() {
    // NẾU ĐANG LÀM BÀI MÀ BẤM QUAY LẠI -> HIỆN CẢNH BÁO
    if (isArenaQuizActive) {
        if (confirm("⚠️ CẢNH BÁO: Rời khỏi phòng thi?\n\nToàn bộ dữ liệu làm bài sẽ BỊ HỦY và KHÔNG ĐƯỢC LƯU LẠI. Bạn có chắc chắn muốn thoát?")) {
            isArenaQuizActive = false;
            clearInterval(arenaTimerInterval);
        } else {
            return; // Nếu bấm Cancel thì ở lại phòng thi
        }
    }
    
    // Đóng phòng thi, trở về sảnh chờ
    document.getElementById('arenaBattlefield').style.display = 'none';
    document.getElementById('arenaLobby').style.display = 'block';
}

// ==========================================
// VẬN HÀNH BÀI THI TRẮC NGHIỆM
// ==========================================
function startActiveArenaQuiz() {
    if (!arenaCurrentQuestions.length) return;
    
    document.getElementById('state-waiting').style.display = 'none';
    document.getElementById('state-quiz').style.display = 'block';
    
    isArenaQuizActive = true; // <--- BẬT CỜ: ĐANG TRONG PHÒNG THI
    arenaUserAnswers = {}; 
    arenaIsLocked = {}; 
    arenaScore = 0; 
    arenaActiveQIndex = 0;
    
    updateArenaProgress(); 
    renderArenaQuestion(); 
    renderArenaNav();
    startArenaTimer(window.arenaQuizData.time_limit);
}

function renderArenaQuestion() {
    const q = arenaCurrentQuestions[arenaActiveQIndex];
    document.getElementById('currentQNumber').innerText = arenaActiveQIndex + 1;
    document.getElementById('questionText').innerText = q.question_text;
    
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    const options = q.options || {};
    const hasAnswered = arenaIsLocked[arenaActiveQIndex];
    const userChoice = arenaUserAnswers[arenaActiveQIndex];
    const correctAns = q.correct_ans;

    ['A', 'B', 'C', 'D'].forEach(key => {
        if (options[key]) {
            let stateClass = '';
            if (hasAnswered) {
                if (key === correctAns) stateClass = 'correct'; 
                else if (key === userChoice && userChoice !== correctAns) stateClass = 'wrong'; 
            }
            container.innerHTML += `
                <div class="opt-item ${stateClass}" onclick="handleArenaSelect('${key}')">
                    <div class="opt-prefix">${key}</div>
                    <div class="opt-label">${options[key]}</div>
                </div>
            `;
        }
    });

    const expBox = document.getElementById('explanationBox');
    if (hasAnswered) {
        document.getElementById('explanationText').innerText = q.explanation || "Chưa có lời giải chi tiết cho câu này.";
        expBox.classList.remove('hidden');
    } else {
        expBox.classList.add('hidden');
    }
}

window.handleArenaSelect = function(choice) {
    if (arenaIsLocked[arenaActiveQIndex]) return; 

    arenaUserAnswers[arenaActiveQIndex] = choice;
    arenaIsLocked[arenaActiveQIndex] = true; 

    if (choice === arenaCurrentQuestions[arenaActiveQIndex].correct_ans) arenaScore++; 

    updateArenaProgress();
    renderArenaQuestion();
    renderArenaNav();
}

function renderArenaNav() {
    const grid = document.getElementById('qNavGrid');
    grid.innerHTML = arenaCurrentQuestions.map((q, i) => {
        let stateClass = '';
        if (arenaIsLocked[i]) {
            stateClass = (arenaUserAnswers[i] === q.correct_ans) ? 'correct' : 'wrong';
        }
        const activeClass = (arenaActiveQIndex === i) ? 'active' : '';
        return `<div class="q-nav-dot ${stateClass} ${activeClass}" onclick="jumpToArenaQ(${i})">${i + 1}</div>`;
    }).join('');
}

window.jumpToArenaQ = function(index) { arenaActiveQIndex = index; renderArenaQuestion(); renderArenaNav(); }
window.nextArenaQ = function() { if (arenaActiveQIndex < arenaCurrentQuestions.length - 1) jumpToArenaQ(arenaActiveQIndex + 1); }
window.prevArenaQ = function() { if (arenaActiveQIndex > 0) jumpToArenaQ(arenaActiveQIndex - 1); }

function updateArenaProgress() {
    const answeredCount = Object.keys(arenaIsLocked).length;
    const total = arenaCurrentQuestions.length;
    document.getElementById('progressText').innerText = `${answeredCount}/${total}`;
    document.getElementById('liveScoreText').innerHTML = `<i class="fa-solid fa-fire"></i> Điểm: ${arenaScore}`;
    document.getElementById('progressBarFill').style.width = `${(answeredCount / total) * 100}%`;
}

function startArenaTimer(durationInMinutes) {
    clearInterval(arenaTimerInterval);
    let secondsRemaining = (parseInt(durationInMinutes) || 15) * 60;
    
    arenaTimerInterval = setInterval(() => {
        let mins = Math.floor(secondsRemaining / 60);
        let secs = secondsRemaining % 60;
        document.getElementById('timerText').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (secondsRemaining <= 0) {
            clearInterval(arenaTimerInterval);
            alert("Đã hết thời gian! Hệ thống tự động nộp bài.");
            submitArenaQuizFinal();
        }
        secondsRemaining--;
    }, 1000);
}

// THAY THẾ TOÀN BỘ HÀM NÀY Ở CUỐI FILE JS/ARENA.JS
window.submitArenaQuizFinal = async function() {
    isArenaQuizActive = false; // <--- TẮT CỜ: ĐÃ NỘP BÀI AN TOÀN
    clearInterval(arenaTimerInterval);
    const percent = Math.round((arenaScore / arenaCurrentQuestions.length) * 100);
    
    alert(`Nộp bài thành công!\n\nKết quả: ${arenaScore}/${arenaCurrentQuestions.length} câu đúng.\nTỷ lệ chính xác: ${percent}%`);

    const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
    const safeUser = user.email || user.username || '';
    
    if (safeUser && arenaCurrentId) {
        try {
            await fetch(`${API_BASE_URL}/progress/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: safeUser, 
                    lesson_id: arenaCurrentId.toString(), 
                    score: parseInt(arenaScore)
                })
            });
        } catch(e) { console.error(e); }
    }
    
    document.getElementById('arenaBattlefield').style.display = 'none';
    document.getElementById('arenaLobby').style.display = 'block';
    loadArenaBattles(); // Tải lại để hiện Bảng xếp hạng
}

// BỌC THÉP 1: Cảnh báo khi người dùng tắt Tab hoặc bấm F5
window.addEventListener('beforeunload', function (e) {
    if (isArenaQuizActive) {
        e.preventDefault();
        e.returnValue = ''; // Yêu cầu bắt buộc của trình duyệt để hiện popup
    }
});

// BỌC THÉP 2: Chặn khi người dùng bấm vào các đường link trên thanh Menu
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (isArenaQuizActive) {
            const href = this.getAttribute('href');
            // Nếu link hợp lệ (không phải link ảo #)
            if (href && !href.startsWith('javascript') && !href.startsWith('#')) {
                e.preventDefault(); // Chặn chuyển trang ngay lập tức
                if (confirm("⚠️ CẢNH BÁO: Bạn đang trong thời gian làm bài!\n\nRời đi bây giờ sẽ HỦY TOÀN BỘ KẾT QUẢ. Bạn có chắc chắn?")) {
                    isArenaQuizActive = false;
                    clearInterval(arenaTimerInterval);
                    window.location.href = href; // Cho phép đi tiếp (Hủy kết quả)
                }
            }
        }
    });
});