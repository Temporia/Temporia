/* ========================================================================= */
/* ENGINE QUẢN LÝ QUIZ - AUTO SYNC LỘ TRÌNH & ĐẤU TRƯỜNG                     */
/* ========================================================================= */

let currentQuizMode = 'lesson'; 
let currentActiveTargetId = null; 

document.addEventListener('DOMContentLoaded', () => {
    // Không tải ngay, chờ khi nào user bấm sang tab Quiz mới tải cho nhẹ web
});

// ==============================================================
// 1. CHUYỂN ĐỔI CHẾ ĐỘ (ÉP VỀ CHUẨN 'ARENA' ĐỂ ĐỒNG BỘ BACKEND)
// ==============================================================
function switchQuizMode(mode) {
    // Chuyển đổi 'contest' thành 'arena' để đồng bộ với Database
    currentQuizMode = (mode === 'contest') ? 'arena' : mode; 
    
    document.getElementById('tabQuizLesson').classList.remove('active');
    document.getElementById('tabQuizContest').classList.remove('active');
    
    document.getElementById('quizEmptyState').style.display = 'flex';
    document.getElementById('quizEditorPanel').style.display = 'none';
    currentActiveTargetId = null;

    if (currentQuizMode === 'lesson') {
        document.getElementById('tabQuizLesson').classList.add('active');
        document.getElementById('btnCreateContest').style.display = 'none';
        document.querySelectorAll('.contest-only').forEach(el => el.style.display = 'none');
        document.getElementById('lblQuizTitle').innerText = 'Tiêu đề Bài tập';
        fetchLessonsForQuizSidebar(); // Tự động đồng bộ từ Lộ trình
    } else {
        document.getElementById('tabQuizContest').classList.add('active');
        document.getElementById('btnCreateContest').style.display = 'block';
        document.querySelectorAll('.contest-only').forEach(el => el.style.display = 'block');
        document.getElementById('lblQuizTitle').innerText = 'Tên Cuộc thi';
        loadContestsForSidebar(); // Tải danh sách cuộc thi thực tế từ DB
    }
}

// ==============================================================
// 2. TẢI DANH SÁCH BÊN TRÁI (LỘ TRÌNH & ĐẤU TRƯỜNG)
// ==============================================================
async function fetchLessonsForQuizSidebar() {
    const list = document.getElementById('quizSidebarList');
    list.innerHTML = '<div style="text-align:center; padding: 20px; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/roadmap`);
        const data = await response.json();
        list.innerHTML = '';

        data.chapters.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                list.innerHTML += `
                    <div class="quiz-list-item" onclick="openQuizEditor(${lesson.id}, '${lesson.title}')">
                        <i class="fa-solid fa-file-lines"></i>
                        <span style="flex:1;">${lesson.title}</span>
                    </div>
                `;
            });
        });
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; color:#dc2626;">Lỗi đồng bộ dữ liệu</div>';
    }
}

// ĐÃ SỬA: Gọi API quét Database để hiển thị danh sách thật
async function loadContestsForSidebar() {
    const list = document.getElementById('quizSidebarList');
    list.innerHTML = '<div style="text-align:center; padding: 20px; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/arena/battles`);
        const data = await response.json();
        
        list.innerHTML = '';
        if (data.status === 'success' && data.battles.length > 0) {
            data.battles.forEach(battle => {
                list.innerHTML += `
                    <div class="quiz-list-item" onclick="openQuizEditor('${battle.target_id}', '${battle.title}')">
                        <i class="fa-solid fa-trophy" style="color: #f59e0b;"></i>
                        <span style="flex:1;">${battle.title}</span>
                    </div>
                `;
            });
        } else {
            list.innerHTML = '<div style="text-align:center; padding: 20px; color:#94a3b8;">Chưa có cuộc thi nào. Hãy tạo mới!</div>';
        }
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; color:#dc2626;">Lỗi kết nối máy chủ</div>';
    }
}

// ĐÃ SỬA: Tạo mã ID độc nhất khi thêm cuộc thi mới để tránh lưu đè
function createNewContest() {
    // ĐÃ SỬA: Tạo ID là một con số nguyên (INT) để tương thích 100% với Database
    const uniqueId = Math.floor(Math.random() * 2000000000); 
    openQuizEditor(uniqueId, 'Cuộc thi chưa đặt tên');
    document.getElementById('quizTitle').value = '';
    document.getElementById('quizQCount').value = 5;
    document.getElementById('quizStartDate').value = '';
    document.getElementById('quizEndDate').value = '';
    generateQuestionBlocks();
}

// ==============================================================
// 3. MỞ EDITOR & RENDER CÂU HỎI
// ==============================================================
window.openQuizEditor = async function(targetId, title) {
    currentActiveTargetId = targetId;
    document.getElementById('quizEmptyState').style.display = 'none';
    document.getElementById('quizEditorPanel').style.display = 'flex';
    document.getElementById('quizBreadcrumb').innerHTML = currentQuizMode === 'lesson' ? `<i class="fa-solid fa-book-open"></i> Bài học: ${title}` : `<i class="fa-solid fa-trophy"></i> Đấu trường: ${title}`;
    
    // Reset trắng form
    document.getElementById('quizTitle').value = currentQuizMode === 'lesson' ? "Bài tập: " + title : title;
    document.getElementById('quizQCount').value = 5;
    document.getElementById('quizTimeLimit').value = 15;
    document.getElementById('quizDifficulty').value = 'Trung bình';
    document.getElementById('quizStartDate').value = '';
    document.getElementById('quizEndDate').value = '';
    
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '<div style="text-align:center; padding: 30px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Đang tải dữ liệu Quiz...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/quiz/${currentQuizMode}/${targetId}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            const data = result.data;
            
            document.getElementById('quizTitle').value = data.title || '';
            document.getElementById('quizTimeLimit').value = data.time_limit || 15;
            document.getElementById('quizDifficulty').value = data.difficulty || 'Trung bình';
            
            if (data.start_time) document.getElementById('quizStartDate').value = data.start_time.slice(0, 16); 
            if (data.end_time) document.getElementById('quizEndDate').value = data.end_time.slice(0, 16);

            let questions = [];
            try {
                questions = typeof data.questions_data === 'string' ? JSON.parse(data.questions_data) : data.questions_data;
            } catch (e) { questions = []; }

            if (questions && questions.length > 0) {
                document.getElementById('quizQCount').value = questions.length;
                renderSavedQuestions(questions);
            } else {
                generateQuestionBlocks();
            }
            
        } else {
            // Bài mới tinh -> tạo khung trống
            document.getElementById('quizQCount').value = 5;
            generateQuestionBlocks();
        }
    } catch (error) {
        container.innerHTML = '<div style="text-align:center; padding: 30px; color: #dc2626;"><i class="fa-solid fa-triangle-exclamation fa-2x"></i><p>Lỗi kết nối đến máy chủ!</p></div>';
    }
};

function renderSavedQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    let html = '';

    questions.forEach((q, index) => {
        const i = index + 1;
        const opts = q.options || {A:'', B:'', C:'', D:''};
        
        html += `
            <div class="q-card" id="qBlock_${i}">
                <div class="q-card-header">
                    <span>Câu hỏi số ${i}</span>
                    <button class="btn-icon" style="color: #dc2626;" onclick="document.getElementById('qBlock_${i}').remove(); updateQuestionCount();"><i class="fa-solid fa-trash"></i></button>
                </div>
                
                <input type="text" class="apple-input q-main-input" placeholder="Nhập nội dung câu hỏi ${i}..." value="${escapeHTML(q.question_text || '')}">
                <input type="text" class="apple-input" style="margin-bottom: 20px;" placeholder="🔗 URL Hình ảnh minh họa (Để trống nếu không có)..." value="${escapeHTML(q.image_url || '')}">
                
                <div class="answers-grid">
                    <label class="answer-item">
                        <input type="radio" name="correct_ans_${i}" value="A" ${q.correct_ans === 'A' ? 'checked' : ''}>
                        <input type="text" placeholder="Đáp án A" value="${escapeHTML(opts.A || '')}">
                    </label>
                    <label class="answer-item">
                        <input type="radio" name="correct_ans_${i}" value="B" ${q.correct_ans === 'B' ? 'checked' : ''}>
                        <input type="text" placeholder="Đáp án B" value="${escapeHTML(opts.B || '')}">
                    </label>
                    <label class="answer-item">
                        <input type="radio" name="correct_ans_${i}" value="C" ${q.correct_ans === 'C' ? 'checked' : ''}>
                        <input type="text" placeholder="Đáp án C" value="${escapeHTML(opts.C || '')}">
                    </label>
                    <label class="answer-item">
                        <input type="radio" name="correct_ans_${i}" value="D" ${q.correct_ans === 'D' ? 'checked' : ''}>
                        <input type="text" placeholder="Đáp án D" value="${escapeHTML(opts.D || '')}">
                    </label>
                </div>
                
                <textarea class="apple-input explanation-box" rows="2" placeholder="💡 Giải thích đáp án (Học sinh sẽ thấy sau khi nộp bài)...">${escapeHTML(q.explanation || '')}</textarea>
            </div>
        `;
    });
    container.innerHTML = html;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function generateQuestionBlocks() {
    const container = document.getElementById('questionsContainer');
    const count = parseInt(document.getElementById('quizQCount').value) || 0;
    
    if (count <= 0 || count > 100) {
        if(typeof showAdminToast === 'function') showAdminToast("Số lượng câu hỏi phải từ 1 đến 100!", "error");
        return;
    }

    let html = '';
    for(let i = 1; i <= count; i++) {
        html += `
            <div class="q-card" id="qBlock_${i}">
                <div class="q-card-header">
                    <span>Câu hỏi số ${i}</span>
                    <button class="btn-icon" style="color: #dc2626;" onclick="document.getElementById('qBlock_${i}').remove(); updateQuestionCount();"><i class="fa-solid fa-trash"></i></button>
                </div>
                
                <input type="text" class="apple-input q-main-input" placeholder="Nhập nội dung câu hỏi ${i}...">
                <input type="text" class="apple-input" style="margin-bottom: 20px;" placeholder="🔗 URL Hình ảnh minh họa (Để trống nếu không có)...">
                
                <div class="answers-grid">
                    <label class="answer-item"><input type="radio" name="correct_ans_${i}" value="A" checked><input type="text" placeholder="Đáp án A"></label>
                    <label class="answer-item"><input type="radio" name="correct_ans_${i}" value="B"><input type="text" placeholder="Đáp án B"></label>
                    <label class="answer-item"><input type="radio" name="correct_ans_${i}" value="C"><input type="text" placeholder="Đáp án C"></label>
                    <label class="answer-item"><input type="radio" name="correct_ans_${i}" value="D"><input type="text" placeholder="Đáp án D"></label>
                </div>
                
                <textarea class="apple-input explanation-box" rows="2" placeholder="💡 Giải thích đáp án..."></textarea>
            </div>
        `;
    }
    container.innerHTML = html;
}

function updateQuestionCount() {
    document.getElementById('quizQCount').value = document.querySelectorAll('.q-card').length;
}

function filterQuizList() {
    const q = document.getElementById('searchQuizList').value.toLowerCase();
    document.querySelectorAll('.quiz-list-item').forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
    });
}

// ==============================================================
// 4. LƯU DỮ LIỆU & LÀM MỚI DANH SÁCH BÊN TRÁI
// ==============================================================
async function saveQuizData() {
    if(!currentActiveTargetId) return;
    
    const btn = document.querySelector('#quizEditorPanel .apple-btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;

    const payload = {
        target_type: currentQuizMode, // Sẽ gửi 'lesson' hoặc 'arena' lên server
        target_id: currentActiveTargetId.toString(),
        title: document.getElementById('quizTitle').value.trim(),
        time_limit: parseInt(document.getElementById('quizTimeLimit').value) || 15,
        difficulty: document.getElementById('quizDifficulty').value,
        start_time: document.getElementById('quizStartDate').value || null,
        end_time: document.getElementById('quizEndDate').value || null,
        questions_data: []
    };

    const qCards = document.querySelectorAll('.q-card');
    qCards.forEach((card, index) => {
        const inputs = card.querySelectorAll('input[type="text"]');
        const radios = card.querySelectorAll('input[type="radio"]');
        let correctAns = 'A';
        radios.forEach(r => { if(r.checked) correctAns = r.value; });

        payload.questions_data.push({
            id: index + 1,
            question_text: inputs[0].value.trim(),
            image_url: inputs[1].value.trim(),
            options: { A: inputs[2].value.trim(), B: inputs[3].value.trim(), C: inputs[4].value.trim(), D: inputs[5].value.trim() },
            correct_ans: correctAns,
            explanation: card.querySelector('.explanation-box').value.trim()
        });
    });

    try {
        const response = await fetch(`${API_BASE_URL}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã lưu thành công';
            if(typeof showAdminToast === 'function') showAdminToast("Dữ liệu đã được lưu!");
            
            // ĐÃ SỬA: Refresh lại danh sách bên trái ngay lập tức để hiện cuộc thi vừa tạo
            if (currentQuizMode === 'lesson') {
                fetchLessonsForQuizSidebar();
            } else {
                loadContestsForSidebar();
            }
        } else {
            throw new Error("Lỗi API");
        }
    } catch(e) {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Lỗi máy chủ';
        if(typeof showAdminToast === 'function') showAdminToast("Không thể lưu Quiz!", "error");
    }

    setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
}