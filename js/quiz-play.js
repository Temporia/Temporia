/* ========================================================================= */
/* TEMPORIA QUIZ ENGINE - FIX SIDEBAR LOADING & INSTANT FEEDBACK             */
/* ========================================================================= */

const API_BASE_URL = 'https://temporia-api.onrender.com/api';
let currentQuizData = null;
let currentQuestions = [];
let userAnswers = {}; 
let isQuestionLocked = {}; 
let currentScore = 0;
let activeQIndex = 0;
let quizTimer = null;
let secondsRemaining = 0;
let targetExitUrl = ''; // Lưu trữ URL mà người dùng muốn tới
let currentLessonId = null;


window.showCustomAlert = function(title, message) {
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMsg').innerHTML = message; 
    
    const overlay = document.getElementById('customAlertOverlay');
    const modal = document.getElementById('customAlertModal');
    
    if(overlay && modal) {
        // 1. Xóa trạng thái ẩn cứng
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        
        // 2. ÉP BUỘC THÊM CLASS 'show' ĐỂ KÍCH HOẠT HIỆU ỨNG HIỆN LÊN
        // Cần dùng setTimeout rất nhỏ để trình duyệt kịp nhận diện CSS
        setTimeout(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        }, 10);
    }
};

window.closeCustomAlert = function() {
    const overlay = document.getElementById('customAlertOverlay');
    const modal = document.getElementById('customAlertModal');
    
    if(overlay && modal) {
        // 1. Gỡ class 'show' để nó từ từ mờ đi và thu nhỏ lại
        overlay.classList.remove('show');
        modal.classList.remove('show');
        
        // 2. Đợi 400 mili-giây cho hiệu ứng mờ chạy xong thì mới ẩn hẳn
        setTimeout(() => {
            overlay.classList.add('hidden');
            modal.classList.add('hidden');
        }, 400);
    }
};
// Thay thế hàm handleExitQuiz cũ
window.handleExitQuiz = function() {
    targetExitUrl = 'quiz.html'; // Mặc định nút "Rời phòng" sẽ về quiz.html
    document.getElementById('exitConfirmOverlay').classList.remove('hidden');
}

// Bấm Đồng ý -> Chuyển trang
window.confirmExit = function() {
    window.location.href = targetExitUrl;
}

// Bấm Hủy -> Tắt Modal
window.cancelExit = function() {
    document.getElementById('exitConfirmOverlay').classList.add('hidden');
    targetExitUrl = '';
}

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarRoadmap();
    runIntroAnimations(); // Khởi chạy hoạt ảnh
});

document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const isDoingQuiz = document.querySelector('.quiz-play-layout').classList.contains('focus-mode');
            const href = this.getAttribute('href');
            
            // Nếu đang làm bài, và link đó không phải là hàm JS (# hoặc javascript:...)
            if (isDoingQuiz && href && !href.startsWith('javascript') && !href.startsWith('#')) {
                e.preventDefault(); // Chặn chuyển trang
                targetExitUrl = href; // Lưu lại link người dùng vừa bấm
                document.getElementById('exitConfirmOverlay').classList.remove('hidden'); // Bật bảng cảnh báo
            }
        });
    });

// ENGINE TỰ ĐỘNG CHẠY HIỆU ỨNG CHO TRANG GIỚI THIỆU
let introAnimTimer;
function runIntroAnimations() {
    clearInterval(introAnimTimer);
    
    // Lấy tất cả các Element cần tương tác
    const clock = document.getElementById('mockClockText');
    const pFill = document.getElementById('mockBarFill');
    const pScore = document.getElementById('mockScore');
    
    const tickItem = document.getElementById('mockTickItem');
    const tickIcon = document.getElementById('mockTickIcon');
    
    const rankTop = document.getElementById('mockRankTop');
    const rankBot = document.getElementById('mockRankBot');
    const rankScore = document.getElementById('mockRankScore');

    function playCycle() {
        // 1. TRẠNG THÁI RESET BAN ĐẦU
        let time = 10; 
        let score = 0; 
        let rScore = 1150;
        
        clock.innerText = `00:${time}`;
        pFill.style.width = '0%'; 
        pScore.innerText = '0';
        
        tickIcon.className = 'fa-regular fa-circle'; 
        tickItem.style.background = '#fff'; 
        tickItem.style.color = '#64748b'; 
        tickItem.style.borderColor = '#e2e8f0';
        
        rankTop.style.transform = 'translateY(0)'; 
        rankBot.style.transform = 'translateY(0)'; 
        rankScore.innerText = '1150';

        // 2. KÍCH HOẠT CHUỖI CHUYỂN ĐỘNG SAU 0.5S
        setTimeout(() => {
            // A. Đếm ngược đồng hồ (10 -> 7)
            const t = setInterval(() => {
                time--; clock.innerText = `00:0${time}`;
                if(time <= 7) clearInterval(t);
            }, 1000);

            // B. Chạy thanh tiến trình và điểm số (0 -> 50)
            pFill.style.width = '100%';
            let sInt = setInterval(() => { 
                score+=5; pScore.innerText = score; 
                if(score>=50) clearInterval(sInt); 
            }, 80);

            // C. Sau 1 giây: Đổi Icon thành Tick xanh vinh quang
            setTimeout(() => {
                tickIcon.className = 'fa-solid fa-circle-check text-green';
                tickItem.style.background = '#f0fdf4'; 
                tickItem.style.color = '#10b981'; 
                tickItem.style.borderColor = '#a7f3d0';
            }, 1000);

            // D. Bảng vàng: Cộng điểm và hoán đổi vị trí (Trượt lên/xuống)
            let rsInt = setInterval(() => { 
                rScore+=5; rankScore.innerText = rScore; 
                if(rScore>=1250) clearInterval(rsInt); 
            }, 50);
            
            setTimeout(() => {
                rankBot.style.transform = 'translateY(calc(-100% - 8px))'; // Bạn trượt lên Top 1
                rankTop.style.transform = 'translateY(calc(100% + 8px))';  // Top 1 rớt xuống
            }, 1500);

        }, 500);
    }

    // Chạy ngay lần đầu tiên
    playCycle();
    // Lặp lại chu kỳ mỗi 4.5 giây
    introAnimTimer = setInterval(playCycle, 4500);
}
// 1. TẢI SIDEBAR & BỌC THÉP CHỐNG LỖI 404 KHI LẤY TIẾN ĐỘ
// THAY THẾ TOÀN BỘ HÀM loadSidebarRoadmap TRONG QUIZ-PLAY.JS
async function loadSidebarRoadmap() {
    const list = document.getElementById('quizSidebarList');
    const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
    const rawUser = user.email || user.username || '';
    const safeUser = rawUser ? encodeURIComponent(rawUser) : '';

    let readLessons = [];      // Danh sách bài đã đọc bên lộ trình lý thuyết
    let passedQuizzes = [];    // Danh sách bài tập đã làm xong (đạt >= 50%)
    
    if (safeUser) {
        try {
            const progRes = await fetch(`${API_BASE_URL}/progress/${safeUser}`);
            if (progRes.ok) {
                const progData = await progRes.json();
                // Phân tách rõ ràng 2 luồng dữ liệu từ API progress
                readLessons = progData.completed_lessons || []; // Tiến độ đọc bài
                passedQuizzes = progData.completed_quizzes || []; // Tiến độ làm bài tập
            }
        } catch (e) { console.warn("Chế độ khách hoặc lỗi nạp tiến độ học.", e); }
    }

    try {
        const roadRes = await fetch(`${API_BASE_URL}/roadmap`);
        const roadData = await roadRes.json();

        if (roadData.status === 'success') {
            list.innerHTML = '';
            
            // Biến cờ hỗ trợ luôn luôn mở khóa Bài đầu tiên của Chương 1 cho cơ chế bắt đầu
            let isFirstLesson = true;

            roadData.chapters.forEach(chapter => {
                let itemsHTML = '';
                chapter.lessons.forEach(lesson => {
                    // Kiểm tra trạng thái của bài hiện tại
                    // Kiểm tra trạng thái của bài hiện tại (Ép về String)
                    const hasReadTheory = readLessons.map(String).includes(lesson.id.toString());
                    const hasPassedQuiz = passedQuizzes.map(String).includes(lesson.id.toString());
                    
                    // Điều kiện ĐƯỢC PHÉP LÀM: Đã đọc lý thuyết HOẶC là bài đầu tiên
                    const isUnlocked = hasReadTheory || isFirstLesson;
                    isFirstLesson = false; // Tắt cờ sau khi quét qua bài đầu tiên

                    let statusClass = '';
                    let iconClass = 'fa-regular fa-circle';

                    // BIỆN PHÁP PHÂN CHIA LOGIC:
                    if (!isUnlocked) {
                        // 1. Chưa học lý thuyết bên lộ trình -> Khóa lại và làm mờ
                        statusClass = 'disabled';
                        iconClass = 'fa-solid fa-lock';
                    } else if (hasPassedQuiz) {
                        // 2. Đã vượt qua bài tập trắc nghiệm -> Hiện tick xanh hoàn thành
                        statusClass = 'is-completed';
                        iconClass = 'fa-solid fa-circle-check';
                    } else {
                        // 3. Đã đọc lý thuyết nhưng chưa làm xong bài tập -> Hiện sáng bình thường để làm bài
                        statusClass = '';
                        iconClass = 'fa-regular fa-circle';
                    }

                    itemsHTML += `
                        <div class="nav-item ${statusClass}" onclick="${isUnlocked ? `showLessonWaitingCard(${lesson.id}, '${lesson.title}', this)` : ''}">
                            <i class="${iconClass}"></i>
                            <span>${lesson.title}</span>
                        </div>
                    `;
                });
                list.innerHTML += `
                    <div class="nav-group expanded">
                        <div class="nav-group-title" onclick="this.parentElement.classList.toggle('collapsed')">
                            ${chapter.name} <i class="fa-solid fa-chevron-up"></i>
                        </div>
                        <div class="nav-group-items">${itemsHTML}</div>
                    </div>
                `;
            });
        }
    } catch (e) { 
        console.error(e);
        list.innerHTML = '<div style="color:#dc2626; padding: 20px; text-align:center;">Lỗi tải dữ liệu lộ trình.</div>';
    }
}

async function showLessonWaitingCard(lessonId, title, element) {
    currentLessonId = lessonId;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    switchState('state-waiting');

    try {
        const res = await fetch(`${API_BASE_URL}/quiz/lesson/${lessonId}`);
        const result = await res.json();

        if (result.status === 'success' && result.data) {
            currentQuizData = result.data;
            // Parse an toàn dữ liệu
            currentQuestions = typeof result.data.questions_data === 'string' ? JSON.parse(result.data.questions_data) : (result.data.questions_data || []);

            if (currentQuestions.length === 0) {
                showCustomAlert("Thông báo", "Bài tập này đang được cập nhật câu hỏi!");
                switchState('state-intro');
                return;
            }

            document.getElementById('qscTitle').innerText = title;
            document.getElementById('qscCount').innerText = currentQuestions.length + " Câu";
            document.getElementById('qscTime').innerText = result.data.time_limit + " Phút";
            document.getElementById('qscDiff').innerText = result.data.difficulty;
            
           // Xử lý màu sắc độ khó
            const diffIcon = document.getElementById('qscDiffIcon');
            const diffBox = document.getElementById('qscDiffBox');
            if(result.data.difficulty === 'Dễ') { 
                diffIcon.style.color = '#10b981'; 
                diffBox.style.background = '#d1fae5'; 
            }
            else if(result.data.difficulty === 'Khó' || result.data.difficulty === 'Siêu khó') { 
                diffIcon.style.color = '#dc2626'; 
                diffBox.style.background = '#fef2f2'; 
            }
            else { 
                diffIcon.style.color = '#f59e0b'; 
                diffBox.style.background = '#fffbeb'; 
            }
            }
    } catch (e) { alert("Lỗi kết nối máy chủ!"); }
}

function startActiveQuiz() {
    if (!currentQuestions.length) return;
    
    // 1. ÉP ẨN THANH LIST BÊN TRÁI (FOCUS MODE)
    document.querySelector('.quiz-play-layout').classList.add('focus-mode');
    
    switchState('state-quiz');
    
    userAnswers = {};
    isQuestionLocked = {};
    currentScore = 0;
    activeQIndex = 0;
    
    updateProgressBar();
    renderQuestion();
    renderNavGrid();
    startTimer(currentQuizData.time_limit);
}

// HIỂN THỊ CÂU HỎI
function renderQuestion() {
    const q = currentQuestions[activeQIndex];
    document.getElementById('currentQNumber').innerText = activeQIndex + 1;
    document.getElementById('questionText').innerText = q.question_text;
    
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    const options = q.options || {};
    const hasAnswered = isQuestionLocked[activeQIndex];
    const userChoice = userAnswers[activeQIndex];
    const correctAns = q.correct_ans;

    ['A', 'B', 'C', 'D'].forEach(key => {
        if (options[key]) {
            let stateClass = '';
            if (hasAnswered) {
                if (key === correctAns) stateClass = 'correct'; 
                else if (key === userChoice && userChoice !== correctAns) stateClass = 'wrong'; 
            }

            container.innerHTML += `
                <div class="opt-item ${stateClass}" onclick="handleSelectAnswer('${key}')">
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

// BẤM VÀO ĐÁP ÁN
window.handleSelectAnswer = function(choice) {
    if (isQuestionLocked[activeQIndex]) return; 

    userAnswers[activeQIndex] = choice;
    isQuestionLocked[activeQIndex] = true; 

    const q = currentQuestions[activeQIndex];
    if (choice === q.correct_ans) currentScore++; 

    updateProgressBar();
    renderQuestion();
    renderNavGrid();
}

// ĐIỀU HƯỚNG BẢN ĐỒ
function renderNavGrid() {
    const grid = document.getElementById('qNavGrid');
    grid.innerHTML = currentQuestions.map((q, i) => {
        let stateClass = '';
        if (isQuestionLocked[i]) {
            stateClass = (userAnswers[i] === q.correct_ans) ? 'correct' : 'wrong';
        }
        const activeClass = (activeQIndex === i) ? 'active' : '';
        return `<div class="q-nav-dot ${stateClass} ${activeClass}" onclick="jumpToQuestion(${i})">${i + 1}</div>`;
    }).join('');
}

window.jumpToQuestion = function(index) {
    activeQIndex = index;
    renderQuestion();
    renderNavGrid();
}
window.nextQuestion = function() { if (activeQIndex < currentQuestions.length - 1) jumpToQuestion(activeQIndex + 1); }
window.prevQuestion = function() { if (activeQIndex > 0) jumpToQuestion(activeQIndex - 1); }

// THANH TIẾN TRÌNH & ĐẾM NGƯỢC
function updateProgressBar() {
    const answeredCount = Object.keys(isQuestionLocked).length;
    const total = currentQuestions.length;
    const percent = (answeredCount / total) * 100;
    
    document.getElementById('progressText').innerText = `${answeredCount}/${total}`;
    document.getElementById('liveScoreText').innerHTML = `<i class="fa-solid fa-fire"></i> Điểm: ${currentScore}`;
    document.getElementById('progressBarFill').style.width = `${percent}%`;
}

function startTimer(durationInMinutes) {
    clearInterval(quizTimer);
    
    // Đảm bảo duration là một số hợp lệ, nếu lỗi (NaN) thì mặc định 15 phút
    let parsedTime = parseInt(durationInMinutes);
    if (isNaN(parsedTime) || parsedTime <= 0) parsedTime = 15;
    
    secondsRemaining = parsedTime * 60;
    
    quizTimer = setInterval(() => {
        let mins = Math.floor(secondsRemaining / 60);
        let secs = secondsRemaining % 60;
        document.getElementById('timerText').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (secondsRemaining <= 0) {
            clearInterval(quizTimer);
            // Đóng Modal Modal nếu đang mở
            document.getElementById('exitConfirmOverlay').classList.add('hidden');
           showCustomAlert("Hết giờ", "Đã hết thời gian! Hệ thống tự động nộp bài.");
            submitQuizFinal();
        }
        secondsRemaining--;
    }, 1000);
}

// NỘP BÀI
window.submitQuizFinal = async function() {
    clearInterval(quizTimer);
    document.getElementById('quizTimerDisplay').classList.add('hidden');
    
    const percent = Math.round((currentScore / currentQuestions.length) * 100);
    
    // Đóng Modal xác nhận thoát nếu đang mở
    document.getElementById('exitConfirmOverlay').classList.add('hidden');
showCustomAlert(
    "Nộp bài thành công", 
    `Kết quả: <b>${currentScore}/${currentQuestions.length}</b> câu đúng.<br>Tỷ lệ chính xác: <b>${percent}%</b>`
);
    ;

    if (percent >= 50) {
        const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
        const safeUser = user.email || user.username || '';
        
        // ĐẢM BẢO currentLessonId KHÔNG BỊ TRỐNG
        if (safeUser && currentLessonId !== null) {
            try {
                const response = await fetch(`${API_BASE_URL}/progress/quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: safeUser, 
                        lesson_id: currentLessonId.toString(), // <--- ĐỔI TỪ parseInt THÀNH .toString()
                        score: parseInt(currentScore)
                    })
                });

                if (response.ok) {
                    // Tải lại thanh list bên trái để hiện Tick Xanh
                    loadSidebarRoadmap();
                } else {
                    const err = await response.json();
                    console.error("❌ Lỗi Backend từ chối lưu:", err);
                }
            } catch(e) {
                console.error("❌ Lỗi mất kết nối khi gọi API nộp bài:", e);
            }
        } else {
            console.error("❌ Thiếu thông tin User hoặc ID Bài học (currentLessonId bị null)");
        }
    }
    switchState('state-intro');
}

// HÀM CHUYỂN TRẠNG THÁI (KÈM KÍCH HOẠT LẠI HIỆU ỨNG)
function switchState(stateId) {
    // 2. NẾU KHÔNG PHẢI ĐANG LÀM BÀI -> HIỆN LẠI THANH LIST
    if(stateId !== 'state-quiz') {
        document.querySelector('.quiz-play-layout').classList.remove('focus-mode');
    }

    // 3. TẮT TẤT CẢ VÀ GỠ CLASS HIỆU ỨNG
    document.querySelectorAll('.qp-content-state').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active-state'); 
    });
    
    // 4. BẬT THẺ MỚI LÊN
    const targetState = document.getElementById(stateId);
    targetState.style.display = 'block';
    
    // 5. KÍCH HOẠT LẠI HIỆU ỨNG XUẤT HIỆN KHI ĐỔI TRANG
    void targetState.offsetWidth; 
    targetState.classList.add('active-state');
}

window.handleExitQuiz = function() {
    if(confirm("Dữ liệu làm bài chưa nộp sẽ bị mất. Bạn chắc chắn muốn thoát?")) {
        window.location.href = 'quiz.html';
    }
}