const API_BASE_URL = 'http://127.0.0.1:8000/api';
let currentLessonMedals = [];

document.addEventListener('DOMContentLoaded', () => {
    initPodcastSidebar();
    setupAudioControls();
});

// 1. Khởi tạo Sidebar y hệt Lộ Trình
async function initPodcastSidebar() {
    const list = document.getElementById('podcastSidebarList');
    const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
    const username = user.email || user.username || '';

    try {
        const roadRes = await fetch(`${API_BASE_URL}/roadmap`);
        const roadData = await roadRes.json();
        
        let progLessons = [];
        if (username) {
            const progRes = await fetch(`${API_BASE_URL}/progress/${encodeURIComponent(username)}`);
            const progData = await progRes.json();
            progLessons = progData.completed_lessons || [];
        }

        if (roadData.status === 'success') {
            list.innerHTML = '';
            roadData.chapters.forEach(chapter => {
                let itemsHTML = '';
                chapter.lessons.forEach(lesson => {
                    const isDone = progLessons.map(String).includes(lesson.id.toString());
                    itemsHTML += `
                        <div class="nav-item ${isDone ? 'is-completed' : ''}" onclick="loadPodcastLesson(${lesson.id}, this)">
                            <i class="${isDone ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
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
                    </div>`;
            });
        }
    } catch (e) { list.innerHTML = 'Lỗi tải dữ liệu.'; }
}

// 2. Nạp dữ liệu Podcast khi bấm vào bài học
async function loadPodcastLesson(lessonId, element) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');

    document.getElementById('podcast-intro').style.display = 'none';
    document.getElementById('podcast-player-view').style.display = 'block';

    try {
        // A. Lấy thông tin Header (Từ bảng Lessons)
        const resLesson = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
        const lesson = await resLesson.json();

        document.getElementById('lessonNum').innerText = lesson.order_num;
        document.getElementById('lessonTitle').innerText = lesson.title;
        document.getElementById('lessonEra').innerText = "Tóm lược nội dung";
        document.getElementById('sectionCount').innerText = lesson.sections_count + " mục học";
        document.getElementById('difficulty').innerText = "Độ khó: " + lesson.difficulty;
        document.getElementById('lessonRecap').innerText = lesson.recap_text || "Đang cập nhật tóm tắt...";
        
        // TRUYỀN DỮ LIỆU RA BIẾN TOÀN CỤC CHO MODAL HUY CHƯƠNG
        const medals = lesson.medal_url ? JSON.parse(lesson.medal_url) : [];
        currentLessonMedals = medals;
        window.currentLessonMedalsList = medals; 
        document.getElementById('medalCount').innerText = medals.length + " Huy chương";
        
        document.getElementById('transcriptContainer').innerHTML = lesson.html_content || '<p>Chưa có kịch bản chi tiết.</p>';

        // B. Lấy thông tin Audio & Hình ảnh (Từ bảng Postcards)
        const resPc = await fetch(`${API_BASE_URL}/postcard/${lessonId}`);
        const pcData = await resPc.json();
        
        const audio = document.getElementById('audioElement');
        const cover = document.getElementById('podcastCoverImg');
        const playBtn = document.getElementById('playPauseBtn');

        // Reset Player trước khi nạp bài mới
        audio.pause();
        document.getElementById('pFill').style.width = '0%';
        audio.currentTime = 0;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        
        // Reset Tốc độ và Lặp lại
        audio.playbackRate = 1.0; currentSpeedIdx = 0; document.getElementById('speedBtn').innerText = '1.0x';
        audio.loop = false; document.getElementById('loopBtn').classList.remove('active-state');

       if (pcData.status === 'success' && pcData.data.video_filename) {
            audio.src = pcData.data.video_filename;
            cover.src = pcData.data.image_url || 'https://placehold.co/1200x500/b91c1c/ffffff?text=Temporia+Podcast';
            audio.load();
            // KHÔNG tự động phát nữa
        } else {
            // ĐÃ SỬA: Dùng cửa sổ Popup xịn xò thay cho alert mặc định
            showCustomAlert(
                "Chưa có âm thanh", 
                "Bài học này chưa được Admin tải lên tệp âm thanh. Vui lòng cập nhật trong Trạm Chỉ Huy!"
            );
            audio.src = "";
            cover.src = 'https://placehold.co/1200x500/f2f2f7/86868b?text=Chưa+có+Audio';
        }
    } catch (e) { console.error(e); }
}

// 3. Điều khiển Trình phát (Audio Engine)
function setupAudioControls() {
    const audio = document.getElementById('audioElement');
    const pFill = document.getElementById('pFill');
    const curText = document.getElementById('currentTime');
    const durText = document.getElementById('duration');

    audio.ontimeupdate = () => {
        if(audio.duration) {
            const per = (audio.currentTime / audio.duration) * 100;
            pFill.style.width = per + '%';
            curText.innerText = formatTime(audio.currentTime);
        }
    };

    audio.onloadedmetadata = () => { durText.innerText = formatTime(audio.duration); };

    // KHI NGHE XONG -> TỰ ĐỘNG NHẬN QUÀ (Nếu không bật Lặp lại)
    audio.onended = async () => {
        if (audio.loop) return; // Nếu đang lặp bài thì không chạy sự kiện End
        
        document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
        
        const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
        const username = user.email || user.username || '';

        if (username) {
            for(const m of currentLessonMedals) {
                await fetch(`${API_BASE_URL}/progress/badge`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, char_name: "Postcard Âm thanh", medal_url: m })
                });
            }
            await fetch(`${API_BASE_URL}/progress/lesson`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, lesson_id: audio.getAttribute('data-id') || currentLessonId.toString() })
            });
            alert("Chúc mừng! Bạn đã nghe xong và nhận trọn bộ huy hiệu bài học!");
            initPodcastSidebar(); 
        }
    };
}
function formatTime(s) {
    if (isNaN(s)) return "00:00";
    let m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

window.togglePlay = function() {
    const audio = document.getElementById('audioElement');
    const btn = document.getElementById('playPauseBtn');
    if (audio.paused) {
        audio.play(); btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        audio.pause(); btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
};

window.skipAudio = (sec) => { document.getElementById('audioElement').currentTime += sec; };
window.seekAudio = (e) => {
    const audio = document.getElementById('audioElement');
    const rect = document.getElementById('pContainer').getBoundingClientRect();
    const per = (e.clientX - rect.left) / rect.width;
    audio.currentTime = per * audio.duration;
};

// CÁC CHỨC NĂNG MỞ RỘNG
let currentSpeedIdx = 0;
const speeds = [1.0, 1.25, 1.5, 2.0];
window.toggleSpeed = function() {
    currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
    const audio = document.getElementById('audioElement');
    audio.playbackRate = speeds[currentSpeedIdx];
    document.getElementById('speedBtn').innerText = speeds[currentSpeedIdx] + 'x';
};

window.toggleLoop = function() {
    const audio = document.getElementById('audioElement');
    audio.loop = !audio.loop;
    const btn = document.getElementById('loopBtn');
    if(audio.loop) btn.classList.add('active-state');
    else btn.classList.remove('active-state');
};

let lastVolume = 1;
window.toggleMute = function() {
    const audio = document.getElementById('audioElement');
    const slider = document.getElementById('volumeSlider');
    const icon = document.querySelector('#muteBtn i');
    if (audio.volume > 0) {
        lastVolume = audio.volume; audio.volume = 0; slider.value = 0;
        icon.className = 'fa-solid fa-volume-xmark';
    } else {
        audio.volume = lastVolume; slider.value = lastVolume;
        icon.className = 'fa-solid fa-volume-high';
    }
};

window.changeVolume = function(val) {
    const audio = document.getElementById('audioElement');
    audio.volume = val;
    const icon = document.querySelector('#muteBtn i');
    if (val == 0) icon.className = 'fa-solid fa-volume-xmark';
    else if (val < 0.5) icon.className = 'fa-solid fa-volume-low';
    else icon.className = 'fa-solid fa-volume-high';
};

// ========================================================
// MODAL HUY CHƯƠNG (SAO CHÉP TỪ LỘ TRÌNH)
// ========================================================
window.openLessonMedalsModal = function() {
    const grid = document.getElementById('lessonMedalsGrid');
    if (window.currentLessonMedalsList && window.currentLessonMedalsList.length > 0) {
        grid.innerHTML = window.currentLessonMedalsList.map(url => `
            <div style="text-align: center; width: 85px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #fef2f2; border: 2px solid #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                    <img src="${url}" style="width: 50px; height: 50px; object-fit: contain;">
                </div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = '<p style="color: #86868b;">Chưa có huy chương nào trong bài này.</p>';
    }
    document.getElementById('lessonMedalsOverlay').classList.add('show');
    document.getElementById('lessonMedalsModal').classList.add('show');
};

window.closeLessonMedalsModal = function() {
    document.getElementById('lessonMedalsOverlay').classList.remove('show');
    document.getElementById('lessonMedalsModal').classList.remove('show');
};
// ========================================================
// 4. CHỨC NĂNG HẸN GIỜ TẮT NHẠC (SLEEP TIMER)
// ========================================================
// ========================================================
// HỆ THỐNG POPUP TÙY CHỈNH (THAY THẾ ALERT MẶC ĐỊNH)
// ========================================================
window.showCustomAlert = function(title, message) {
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMsg').innerText = message;
    document.getElementById('customAlertOverlay').classList.add('show');
    document.getElementById('customAlertModal').classList.add('show');
};

window.closeCustomAlert = function() {
    document.getElementById('customAlertOverlay').classList.remove('show');
    document.getElementById('customAlertModal').classList.remove('show');
};

// ========================================================
// HỆ THỐNG AUTO-PLAY VÀ HẸN GIỜ THÔNG MINH
// ========================================================
let globalFlatLessons = []; // Lưu trữ danh sách phẳng để biết bài nào tiếp theo
let currentActiveLessonIndex = -1;
let sleepTimerInterval = null;
let sleepSecondsLeft = 0;
let userPlaybackMode = 'loop'; // Mặc định lặp lại

// HACK LOGIC: Lưu danh sách bài học vào biến toàn cục ngay lúc nạp dữ liệu
// (Tìm hàm taiDuLieuDanhSachPodcast() ở trên, và đảm bảo bạn gán globalFlatLessons = lessonsData; ở chỗ nào đó, 
// nhưng để an toàn tôi sẽ quét lại các thẻ <li> trên giao diện)

window.toggleSleepTimer = function() {
    document.getElementById('timerModalOverlay').classList.add('show');
    document.getElementById('timerModal').classList.add('show');
    calculateEstimatedTracks();
    
    // Nếu đang có hẹn giờ chạy thì hiện nút Tắt
    if (sleepTimerInterval) {
        document.getElementById('btnCancelTimer').style.display = 'block';
    } else {
        document.getElementById('btnCancelTimer').style.display = 'none';
    }
};

window.closeTimerModal = function() {
    document.getElementById('timerModalOverlay').classList.remove('show');
    document.getElementById('timerModal').classList.remove('show');
};

// Thuật toán ước lượng số bài học dựa trên số phút nhập vào (Trung bình 5p/bài)
window.calculateEstimatedTracks = function() {
    const mins = parseInt(document.getElementById('timerMinsInput').value) || 0;
    const estimated = Math.max(1, Math.round(mins / 5)); // Ước tính 5 phút/bài
    
    const mode = document.querySelector('input[name="timerMode"]:checked').value;
    const textEl = document.getElementById('estimatedTracksText');
    
    if (mode === 'loop') {
        textEl.innerHTML = `<i class="fa-solid fa-repeat"></i> Bài hiện tại sẽ được lặp lại khoảng ${estimated} lần.`;
    } else {
        textEl.innerHTML = `<i class="fa-solid fa-forward-step"></i> Hệ thống ước tính bạn sẽ nghe qua khoảng ${estimated} bài học tiếp theo.`;
    }
};

// Lắng nghe thay đổi nút Radio để cập nhật text ước lượng
document.querySelectorAll('input[name="timerMode"]').forEach(radio => {
    radio.addEventListener('change', calculateEstimatedTracks);
});

window.startCustomSleepTimer = function() {
    const mins = parseInt(document.getElementById('timerMinsInput').value);
    if (isNaN(mins) || mins <= 0) {
        showCustomAlert("Lỗi nhập liệu", "Vui lòng nhập số phút lớn hơn 0!");
        return;
    }

    userPlaybackMode = document.querySelector('input[name="timerMode"]:checked').value;
    
    // Tự động thu thập toàn bộ link bài học trên giao diện để làm danh sách phát (Playlist)
    globalFlatLessons = Array.from(document.querySelectorAll('.podcast-lesson-link'));
    const currentTitle = document.getElementById('podcastTitle').innerText;
    currentActiveLessonIndex = globalFlatLessons.findIndex(link => link.querySelector('.lesson-name-text').innerText === currentTitle);

    clearInterval(sleepTimerInterval);
    sleepSecondsLeft = mins * 60;
    
    const display = document.getElementById('sleepTimerDisplay');
    display.style.display = 'block';
    document.getElementById('sleepTimerBtn').classList.add('active-state');
    
    sleepTimerInterval = setInterval(() => {
        sleepSecondsLeft--;
        let m = Math.floor(sleepSecondsLeft / 60).toString().padStart(2, '0');
        let s = (sleepSecondsLeft % 60).toString().padStart(2, '0');
        document.getElementById('sleepTimeLeft').innerText = `${m}:${s}`;

        if (sleepSecondsLeft <= 0) {
            clearInterval(sleepTimerInterval);
            document.getElementById('audioElement').pause();
            document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
            display.style.display = 'none';
            document.getElementById('sleepTimerBtn').classList.remove('active-state');
            showCustomAlert("Hết giờ", "⏰ Đã hết thời gian hẹn giờ. Podcast đã được tự động tắt để bạn an giấc!");
        }
    }, 1000);

    closeTimerModal();
    showCustomAlert("Thành công", `Đã bật Hẹn giờ. Podcast sẽ tự động tắt sau ${mins} phút nữa.`);
};

window.cancelSleepTimer = function() {
    clearInterval(sleepTimerInterval);
    sleepTimerInterval = null;
    document.getElementById('sleepTimerDisplay').style.display = 'none';
    document.getElementById('sleepTimerBtn').classList.remove('active-state');
    closeTimerModal();
    showCustomAlert("Đã tắt", "Đã hủy chế độ Hẹn giờ ngủ tự động.");
};

// ========================================================
// GHI ĐÈ HÀM AUDIO ONENDED ĐỂ CHUYỂN BÀI & CẤP QUÀ
// ========================================================
// (TÌM DÒNG audio.onended CŨ TRONG CODE VÀ THAY BẰNG KHỐI NÀY)
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioElement');
    if(audio) {
        audio.onended = async () => {
            const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
            const username = user.email || user.username || '';

            // 1. LƯU TIẾN ĐỘ VÀ CẤP HUY HIỆU
            if (username && currentLessonId) {
                // Tặng huy hiệu
                for(const m of currentLessonMedals) {
                    await fetch(`${API_BASE_URL}/progress/badge`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, char_name: "Postcard Âm thanh", medal_url: m })
                    });
                }
                // Tick xanh
                await fetch(`${API_BASE_URL}/progress/lesson`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, lesson_id: currentLessonId.toString() })
                });
              initPodcastSidebar();
            }

            // 2. LOGIC TỰ ĐỘNG CHUYỂN BÀI HOẶC LẶP LẠI
            if (userPlaybackMode === 'loop') {
                audio.currentTime = 0;
                audio.play();
            } else if (userPlaybackMode === 'next') {
                if (currentActiveLessonIndex !== -1 && currentActiveLessonIndex < globalFlatLessons.length - 1) {
                    const nextLinkElement = globalFlatLessons[currentActiveLessonIndex + 1];
                    showCustomAlert("Hoàn thành bài", "Đang tự động tải bài tiếp theo trong Lộ trình...");
                    
                    setTimeout(() => {
                        closeCustomAlert();
                        // Giả lập cú click chuột vào bài tiếp theo trên Sidebar
                        nextLinkElement.click(); 
                    }, 2500);
                } else {
                    document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
                    showCustomAlert("Chúc mừng", "Bạn đã nghe hết toàn bộ danh sách bài học có trong Lộ trình!");
                }
            }
        };
    }
});