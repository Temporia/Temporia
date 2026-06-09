/* ========================================================================= */
/* TEMPORIA LỘ TRÌNH JS - SCROLLYTELLING & LƯU DỮ LIỆU THẬT VÀO DATABASE     */
/* ========================================================================= */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

let mainMapInstance = null;
let miniMapInstance = null;
let finishObserver = null;
let isForcedSidebarOpen = false;

// BIẾN LƯU TRỮ TIẾN ĐỘ NGƯỜI CHƠI (DỮ LIỆU THẬT TỪ DB)
let currentUserData = { username: null };
let userCompletedLessons = []; // Chứa danh sách ID bài đã học
let userCollectedBadges = []; // Chứa Tên nhân vật đã lấy huy chương
let currentLoadedLessonId = null; 

// BIẾN CHO BÀI HỌC ĐỘNG
let currentDynamicMapData = {};
let currentDynamicCharData = {};
let activeGeoId = null;
let dynamicFeatureGroup = null;

// Hàm tạo Icon Marker có màu
function createColoredIcon(color) {
    return L.divIcon({
        className: 'custom-colored-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; margin-top: -7px; margin-left: -7px;"></div>`,
        iconSize: [0, 0] 
    });
}

const solviaIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#b91c1c; width:14px; height:14px; border-radius:50%; border:3px solid white; box-shadow: 0 0 10px rgba(185,28,28,0.8);'></div>",
    iconSize: [20, 20], iconAnchor: [10, 10]
});

document.addEventListener('DOMContentLoaded', () => {
    const reader = document.getElementById('readerArea');
    const layout = document.getElementById('appLayout');

    // 1. NHẬN DIỆN NGƯỜI CHƠI TỪ LOCAL STORAGE
    const session = localStorage.getItem('temporia_user');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            currentUserData.username = parsed.username || parsed.email || parsed.id || 'guest';
        } catch(e) { currentUserData.username = session; }
    }

    // 2. KHỞI TẠO BẢN ĐỒ
    const safeTileUrl = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=vi&gl=VN';
    const miniMapEl = document.getElementById('miniMockupMap');
    if (miniMapEl) {
        miniMapInstance = L.map('miniMockupMap', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false }).setView([16.0, 106.0], 5);
        L.tileLayer(safeTileUrl, { maxZoom: 20 }).addTo(miniMapInstance);
    }
    mainMapInstance = L.map('mainRealtimeMap', { zoomControl: false, attributionControl: false }).setView([20.0, 110.0], 5);
    L.tileLayer(safeTileUrl, { maxZoom: 20 }).addTo(mainMapInstance);

    // Bắt đầu tải lộ trình và thành tựu
    fetchAndRenderRoadmap();

    // 3. HIỆU ỨNG MOCKUP BÀI 0
    const mockupObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                if (id === 'mockup1') {
                    setTimeout(() => {
                        const item = document.getElementById('autoTickItem');
                        if(item && !item.classList.contains('is-ticked')) {
                            item.classList.add('is-ticked');
                            item.querySelector('.m-icon').innerHTML = '<i class="fa-solid fa-check"></i>';
                            item.querySelector('.m-sub').innerText = 'Đã hoàn thành';
                        }
                    }, 800); 
                }
                if (id === 'mockup2') {
                    const achBox = document.querySelector('.mockup-achievements');
                    if(achBox && !achBox.classList.contains('is-active')) {
                        achBox.classList.add('is-active');
                        setTimeout(() => {
                            document.getElementById('rankBarFill').style.width = '85%';
                            document.getElementById('rankPercent').innerText = '85%';
                            const rankTitle = document.getElementById('rankTitleName');
                            if(rankTitle) { rankTitle.innerText = "Rank: Huyền thoại"; rankTitle.style.color = "#b91c1c"; }
                        }, 500);
                        let streak = 0; const streakEl = document.getElementById('streakCounter');
                        const interval = setInterval(() => { streak++; if(streakEl) streakEl.innerText = streak; if(streak >= 14) clearInterval(interval); }, 80);
                    }
                }
                if (id === 'mockup3' && miniMapInstance) {
                    setTimeout(() => {
                        miniMapInstance.flyTo([21.394, 103.020], 12, { animate: true, duration: 2.5 });
                        setTimeout(() => { L.marker([21.394, 103.020], {icon: solviaIcon}).addTo(miniMapInstance).bindPopup('<b style="color:#b91c1c;">Điện Biên Phủ</b>').openPopup(); }, 2500);
                    }, 600);
                }
                mockupObserver.unobserve(entry.target);
            }
        });
    }, { root: reader, threshold: 0.6 });
    document.querySelectorAll('.card-image-placeholder').forEach(el => mockupObserver.observe(el));

    // 4. HIỆU ỨNG CUỘN CHUỘT CHUNG
    reader.addEventListener('scroll', () => {
        const scrollTop = reader.scrollTop;
        const isIntroActive = document.getElementById('intro-section').style.display !== 'none';

        if (!isForcedSidebarOpen) {
            if (scrollTop > 200 && !isIntroActive) {
                if (!layout.classList.contains('is-reading-mode')) {
                    layout.classList.add('is-reading-mode'); 
                    setTimeout(() => mainMapInstance.invalidateSize(), 600);
                }
            } else { layout.classList.remove('is-reading-mode'); }
        }

        document.querySelectorAll('.reveal-item').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add('visible');
        });
    });
});

/* ========================================================================= */
/* KẾT NỐI API VÀ LƯU DỮ LIỆU TIẾN ĐỘ THẬT                                   */
/* ========================================================================= */

async function fetchAndRenderRoadmap() {
    const listContainer = document.getElementById('dynamicRoadmapList');
    if(!listContainer) return;
    
    // BƯỚC 1: LẤY TIẾN ĐỘ NGƯỜI CHƠI TỪ DATABASE TRƯỚC
    // BƯỚC 1: LẤY TIẾN ĐỘ NGƯỜI CHƠI TỪ DATABASE TRƯỚC
    if (currentUserData.username) {
        try {
            // Dùng encodeURIComponent để biến email thành định dạng an toàn khi gửi qua mạng
            const safeUsername = encodeURIComponent(currentUserData.username);
            const progRes = await fetch(`${API_BASE_URL}/progress/${safeUsername}`);
            const progData = await progRes.json();
            
            if (progData.status === 'success') {
                userCompletedLessons = progData.completed_lessons || [];
                userCollectedBadges = (progData.collected_badges || []).map(b => b.char_name);
            }
        } catch(e) { console.error("Lỗi lấy tiến độ", e); }
    }

    // BƯỚC 2: RÁP LỘ TRÌNH VÀ TÍCH XANH NHỮNG BÀI ĐÃ HỌC
    try {
        const response = await fetch(`${API_BASE_URL}/roadmap`);
        const data = await response.json();
        if(data.status === "success" && data.chapters) {
            data.chapters.forEach(chapter => {
                let lessonsHTML = '';
                chapter.lessons.forEach(lesson => {
                    // Kiểm tra xem bài này nằm trong danh sách đã học chưa
                    // Ép tất cả về dạng chuỗi (String) trước khi so sánh
const isDone = userCompletedLessons.map(String).includes(lesson.id.toString());
                    const iconClass = isDone ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
                    const doneClass = isDone ? 'is-completed' : '';

                    lessonsHTML += `
                        <div class="nav-item ${doneClass}" onclick="loadDynamicLesson(${lesson.id}, this)">
                            <i class="${iconClass}"></i>
                            <span>${lesson.title}</span>
                        </div>
                    `;
                });
                listContainer.innerHTML += `
                    <div class="nav-group expanded">
                        <div class="nav-group-title" onclick="toggleNavGroup(this)">
                            ${chapter.name} <i class="fa-solid fa-chevron-up"></i>
                        </div>
                        <div class="nav-group-items">${lessonsHTML}</div>
                    </div>
                `;
            });
        }
    } catch (e) { console.error("Lỗi:", e); }
}

window.loadDynamicLesson = async function(lessonId, clickedElement) {
    if (!currentUserData.username) { if(typeof showAuthGateToast === 'function') showAuthGateToast(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
        const lesson = await response.json();
        currentLoadedLessonId = lessonId; // Lưu ID bài hiện tại để tẹo nữa tích xanh

        let medalCount = 0;
        let parsedMedals = [];
        try {
            parsedMedals = JSON.parse(lesson.medal_url);
            if (!Array.isArray(parsedMedals)) parsedMedals = lesson.medal_url ? [lesson.medal_url] : [];
        } catch(e) { parsedMedals = lesson.medal_url ? [lesson.medal_url] : []; }
        medalCount = parsedMedals.length;
        window.currentLessonMedalsList = parsedMedals;

        document.getElementById('dynamicLessonContent').innerHTML = `
            <div class="hero-title-section reveal-item visible">
                <div class="lesson-ribbon"><span class="ribbon-txt">Bài</span><span class="ribbon-num">${lesson.order_num || 'X'}</span></div>
                <div class="title-meta-block">
                    <h1>${lesson.title}</h1>
                </div>
            </div>

            <div class="stats-pills-row reveal-item visible">
                <div class="stat-pill pill-red"><i class="fa-solid fa-bookmark"></i> <span>${lesson.sections_count || 0} mục học</span></div>
                <div class="stat-pill pill-orange" onclick="openLessonMedalsModal()" style="cursor: pointer;" title="Xem các huy chương">
                    <i class="fa-solid fa-medal"></i> <span>${medalCount} Huy chương</span>
                </div>
                <div class="stat-pill pill-blue"><i class="fa-solid fa-layer-group"></i> <span>Độ khó: ${lesson.difficulty || 'Trung bình'}</span></div>
            </div>

            ${lesson.recap_text ? `
            <div class="lesson-recap-zone reveal-item visible" style="margin-bottom: 30px;">
                <div class="recap-header"><span class="recap-badge"><i class="fa-solid fa-scroll"></i> Tóm tắt trước khi bắt đầu</span></div>
                <p class="recap-desc">${lesson.recap_text}</p>
            </div>
            ` : ''}

            <div class="prose-reading-zone reveal-item visible">
                ${lesson.html_content}
            </div>
        `;

        currentDynamicMapData = lesson.geojson_data ? JSON.parse(lesson.geojson_data) : {};
        currentDynamicCharData = lesson.characters_data ? JSON.parse(lesson.characters_data) : {};
        activeGeoId = null;

        switchContent('dynamic-lesson-section', clickedElement);

        // =========================================================
        // RADAR CHỐNG GIAN LẬN & THEO DÕI ĐỌC BÀI
        // =========================================================
        if (window.scrollyGeoObserver) window.scrollyGeoObserver.disconnect();
        if (window.scrollyCharObserver) window.scrollyCharObserver.disconnect();
        let charReadTimers = {}; 

        window.scrollyGeoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.classList.contains('geo-keyword')) {
                    activateDynamicGeoMap(entry.target.getAttribute('data-geo-id'), entry.target);
                }
            });
        }, { root: document.getElementById('readerArea'), rootMargin: '-40% 0px -40% 0px' });

        window.scrollyCharObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                if (el.classList.contains('char-keyword')) {
                    const charId = el.getAttribute('data-char-id');
                    const charData = currentDynamicCharData[charId];
                    if (!charData) return;
                    
                    const charName = charData.name || 'Nhân vật bí ẩn';

                    if (entry.isIntersecting) {
                        // NẾU DATABASE BÁO LÀ ĐÃ TỪNG NHẬN RỒI -> BỎ QUA KHÔNG ĐẾM GIỜ NỮA
                        if (userCollectedBadges.includes(charName)) return; 
                        
                        if (!charReadTimers[charId]) {
                            charReadTimers[charId] = setTimeout(() => {
                                activateDynamicCharBadge(charId); // Kích hoạt xếp hàng cấp huy chương
                                delete charReadTimers[charId];
                            }, 2500); 
                        }
                    } else {
                        if (charReadTimers[charId]) {
                            clearTimeout(charReadTimers[charId]); 
                            delete charReadTimers[charId];
                        }
                    }
                }
            });
        }, { root: document.getElementById('readerArea'), rootMargin: '0px' });

        setTimeout(() => {
            document.querySelectorAll('#dynamicLessonContent .geo-keyword').forEach(el => {
                window.scrollyGeoObserver.observe(el);
                el.addEventListener('click', (e) => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    activateDynamicGeoMap(el.getAttribute('data-geo-id'), el);
                });
            });

            document.querySelectorAll('#dynamicLessonContent .char-keyword').forEach(el => {
                window.scrollyCharObserver.observe(el);
                el.addEventListener('mouseenter', handleCharHoverEnter);
                el.addEventListener('mouseleave', handleCharHoverLeave);
            });
        }, 100);

    } catch (e) { console.error("Lỗi:", e); }
};

// =======================================================
// TRÌNH ĐẠO DIỄN BẢN ĐỒ
// =======================================================
function activateDynamicGeoMap(geoId, element) {
    if (activeGeoId === geoId) return; 
    activeGeoId = geoId;

    document.querySelectorAll('.geo-keyword').forEach(el => el.classList.remove('active-keyword'));
    if(element) element.classList.add('active-keyword');

    const geoData = currentDynamicMapData[geoId];
    if (!geoData) return;

    const layout = document.getElementById('appLayout');
    if (!layout.classList.contains('is-reading-mode') && !isForcedSidebarOpen) {
        layout.classList.add('is-reading-mode');
        setTimeout(() => mainMapInstance.invalidateSize(), 600);
    }

    if (dynamicFeatureGroup) mainMapInstance.removeLayer(dynamicFeatureGroup);

    dynamicFeatureGroup = L.geoJSON(geoData, {
        pointToLayer: function (feature, latlng) {
            const color = feature.properties.themeColor || '#dc2626';
            return L.marker(latlng, { icon: createColoredIcon(color) });
        },
        style: function(feature) {
            const color = feature.properties.themeColor || '#dc2626';
            return { color: color, fillColor: color, fillOpacity: 0.35, weight: 2.5, dashArray: '5, 8' };
        },
        onEachFeature: function (feature, layer) { 
            if (feature.properties && (feature.properties.regionName || feature.properties.regionNote)) {
                const name = feature.properties.regionName || 'Cứ điểm';
                const note = feature.properties.regionNote || '';
                layer.bindPopup(`<b style="color:${feature.properties.themeColor}; font-size: 1.15rem;">${name}</b><br>${note}`, { className: 'territory-popup' });
            }
        }
    }).addTo(mainMapInstance);

    if (dynamicFeatureGroup.getLayers().length > 0) {
        const bounds = dynamicFeatureGroup.getBounds();
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
            mainMapInstance.flyTo(bounds.getCenter(), 8, { duration: 1.5 });
        } else {
            mainMapInstance.flyToBounds(bounds, { padding: [30, 30], duration: 1.5 });
        }
    }
    dynamicFeatureGroup.eachLayer(layer => { if (layer.getPopup()) layer.openPopup(); });
}

// =======================================================
// HÀNG ĐỢI THÔNG BÁO HUY CHƯƠNG & LƯU VÀO DATABASE THẬT
// =======================================================
let badgeQueue = [];
let isBadgeShowing = false;

function activateDynamicCharBadge(charId) {
    const charData = currentDynamicCharData[charId];
    if (!charData) return;
    const charName = charData.name || 'Nhân vật bí ẩn';

    if (userCollectedBadges.includes(charName)) return; 
    userCollectedBadges.push(charName); 

    // QUÉT TÌM LINK ẢNH BẰNG MỌI TÊN BIẾN PHỔ BIẾN NHẤT
    const realMedalUrl = charData.medalUrl || charData.medal_url || charData.avatar || charData.image || '';

    // BẮN API LƯU VÀO DATABASE VĨNH VIỄN
    if (currentUserData.username) {
        fetch(`${API_BASE_URL}/progress/badge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUserData.username,
                char_name: charName,
                medal_url: realMedalUrl
            })
        });
    }

    badgeQueue.push(charData); 
    processBadgeQueue(); 
}

function processBadgeQueue() {
    if (isBadgeShowing || badgeQueue.length === 0) return; 

    isBadgeShowing = true; 
    const charData = badgeQueue.shift(); 
    
    // TÌM ĐÚNG LINK ẢNH ADMIN ĐÃ SET, NẾU KHÔNG CÓ MỚI DÙNG ẢNH MẶC ĐỊNH
    const realMedalUrl = charData.medalUrl || charData.medal_url || charData.avatar || charData.image || 'https://placehold.co/100x100/b91c1c/ffffff?text=Huy+Hiệu';

    document.getElementById('dynamicToastName').innerText = charData.name || 'Nhân vật bí ẩn';
    document.getElementById('dynamicToastImg').src = realMedalUrl;
    
    const toast = document.getElementById('badge-toast');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            isBadgeShowing = false; 
            processBadgeQueue(); 
        }, 600);
    }, 4000); 
}

/* ========================================================================= */
/* MODAL XEM TRƯỚC HUY CHƯƠNG TRONG BÀI HỌC                                  */
/* ========================================================================= */
window.openLessonMedalsModal = function() {
    const grid = document.getElementById('lessonMedalsGrid');
    if (window.currentLessonMedalsList && window.currentLessonMedalsList.length > 0) {
        grid.innerHTML = window.currentLessonMedalsList.map(url => `
            <div style="text-align: center; width: 85px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #fef2f2; border: 2px solid #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; box-shadow: 0 4px 10px rgba(185,28,28,0.1);">
                    <img src="${url}" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.src='https://placehold.co/100x100/b91c1c/ffffff?text=Huy+Hiệu'">
                </div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = '<p style="color: #86868b; font-size: 0.95rem; grid-column: 1/-1;">Chưa có huy chương nào trong bài này.</p>';
    }
    document.getElementById('lessonMedalsOverlay').classList.add('show');
    document.getElementById('lessonMedalsModal').classList.add('show');
};

window.closeLessonMedalsModal = function() {
    document.getElementById('lessonMedalsOverlay').classList.remove('show');
    document.getElementById('lessonMedalsModal').classList.remove('show');
};

// =======================================================
// QUẢN LÝ CHUYỂN TRANG VÀ LƯU DATABASE HOÀN THÀNH BÀI
// =======================================================
// =======================================================
// QUẢN LÝ CHUYỂN TRANG VÀ LƯU DATABASE HOÀN THÀNH BÀI
// =======================================================
function switchContent(sectionId, clickedElement) {
    const reader = document.getElementById('readerArea');
    const layout = document.getElementById('appLayout');
    
    layout.classList.remove('is-reading-mode');
    layout.classList.remove('manual-show-sidebar');
    isForcedSidebarOpen = false;
    
    if (finishObserver) finishObserver.disconnect();
    if (dynamicFeatureGroup) mainMapInstance.removeLayer(dynamicFeatureGroup);

    document.querySelectorAll('.content-segment').forEach(seg => { seg.style.display = 'none'; });
    const target = document.getElementById(sectionId);
    
    if (target) {
        target.style.display = 'block';
        reader.scrollTo({ top: 0, behavior: 'instant' });

        const marker = target.querySelector('.completion-marker');
        if (marker && clickedElement && !clickedElement.classList.contains('is-completed')) {
            
            // ĐÃ ĐỔI THRESHOLD XUỐNG 0.1 (Chỉ cần chạm nhẹ vào vạch đích là tính hoàn thành!)
            finishObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    
                    // 1. Đổi UI ngay lập tức sang màu đỏ Solvia để mắt thấy tai nghe
                    const icon = clickedElement.querySelector('i');
                    if (icon) {
                        icon.className = 'fa-solid fa-circle-check';
                        icon.style.color = '#b91c1c'; // Ép màu đỏ cho chắc chắn
                    }
                    clickedElement.classList.add('is-completed');

                    // 2. Ngắt cảm biến để không bắn API 2 lần
                    finishObserver.disconnect();

                    // 3. BẮN API LƯU VÀO DATABASE
                    if (currentUserData.username && currentLoadedLessonId) {
                        if (!userCompletedLessons.includes(currentLoadedLessonId)) {
                            userCompletedLessons.push(currentLoadedLessonId); // Lưu tạm vào RAM
                        }
                        
                        fetch(`${API_BASE_URL}/progress/lesson`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: currentUserData.username,
                                lesson_id: currentLoadedLessonId.toString() // <--- THÊM .toString() VÀO ĐÂY
                            })
                        }).then(res => {
                            if(res.ok) console.log("✅ Đã lưu tiến độ bài " + currentLoadedLessonId + " vào Database!");
                        });
                    }
                }
            }, { root: reader, threshold: 0.1 }); 
            
            finishObserver.observe(marker);
        }
    }

    if (clickedElement) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        clickedElement.classList.add('active');
    }
}

function toggleNavGroup(element) {
    const group = element.closest('.nav-group');
    if (group) group.classList.toggle('collapsed');
}

function forceToggleSidebar() {
    const layout = document.getElementById('appLayout');
    layout.classList.toggle('manual-show-sidebar');
    isForcedSidebarOpen = layout.classList.contains('manual-show-sidebar');
}

function closeBadgeToast() {
    document.getElementById('badge-toast').classList.remove('show');
}

/* ========================================================================= */
/* BẢNG THÔNG TIN (NOTE) NHÂN VẬT KHI DI CHUỘT (HOVER)                       */
/* ========================================================================= */
function handleCharHoverEnter(e) {
    const charId = e.target.getAttribute('data-char-id');
    const data = currentDynamicCharData[charId];
    if (!data) return;

    const tooltip = document.getElementById('charHoverTooltip');
    
    document.getElementById('chtName').innerText = data.name || 'Nhân vật bí ẩn';
    
    const metaArr = [];
    if (data.years) metaArr.push(data.years);
    if (data.hometown) metaArr.push(data.hometown);
    document.getElementById('chtMeta').innerText = metaArr.length > 0 ? metaArr.join(' | ') : 'Chưa rõ lai lịch';
    
    document.getElementById('chtInfo').innerText = data.info || 'Chưa có thông tin ghi chép về nhân vật này.';
    
    // TÌM LINK ẢNH AVATAR
    const realMedalUrl = data.medalUrl || data.medal_url || data.avatar || data.image;
    const avatar = document.getElementById('chtAvatar');
    if (realMedalUrl) {
        avatar.src = realMedalUrl;
        avatar.style.display = 'block';
    } else {
        avatar.style.display = 'none';
    }

    const rects = e.target.getClientRects();
    const rect = rects[0]; 

    const top = rect.top - tooltip.offsetHeight - 12; 
    const left = rect.left + (rect.width / 2); 

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    
    tooltip.classList.add('show');
}

function handleCharHoverLeave(e) {
    document.getElementById('charHoverTooltip').classList.remove('show');
}