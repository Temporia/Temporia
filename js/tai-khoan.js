/* ========================================================================= */
/* TÀI KHOẢN JS - BỌC THÉP 2 LỚP KIỂM TRA (TÍCH HỢP QUÉT MỜ FUZZY SEARCH)    */
/* ========================================================================= */

const API_BASE_URL = 'https://temporia-api.onrender.com/api'; 
const ENDPOINT_GET_PROFILE = `${API_BASE_URL}/user/profile`; 
const ENDPOINT_UPDATE_PROFILE = `${API_BASE_URL}/user/update`;

function getAuthToken() {
    return localStorage.getItem('temporia_token'); 
}

function formatDateToVN(dateString) {
    if (!dateString) return "Chưa cập nhật";
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateString;
}

document.addEventListener('DOMContentLoaded', () => {

    window.filterBadges = function(showLocked) {
        const badgeGrid = document.getElementById('badgesGrid');
        if (!badgeGrid) return;
        
        let visibleCount = 0;
        const badges = badgeGrid.querySelectorAll('.badge-card');
        
        badges.forEach(badge => {
            const isLocked = badge.classList.contains('locked');
            const shouldShow = showLocked ? isLocked : !isLocked;
            badge.style.display = shouldShow ? 'block' : 'none';
            if (shouldShow) visibleCount++;
        });

        const emptyMsg = document.getElementById('emptyBadgeMsg');
        if (emptyMsg) {
            emptyMsg.style.display = (!showLocked && visibleCount === 0) ? 'block' : 'none';
        }
    }

    async function fetchUserProfile() {
        const token = getAuthToken();
        if (!token) {
            window.location.href = 'auth.html#login';
            return;
        }

        try {
            // 1. LẤY THÔNG TIN HỒ SƠ
            const response = await fetch(ENDPOINT_GET_PROFILE, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Phiên đăng nhập hết hạn hoặc lỗi máy chủ');
            const user = await response.json(); 
            localStorage.setItem('temporia_user', JSON.stringify(user));

            document.getElementById('displayName').innerText = user.full_name || "Nhà thám hiểm";
            document.getElementById('displayEmail').innerText = user.email || "";
            document.getElementById('displayBio').innerText = user.bio || "Chưa có châm ngôn nào được thiết lập.";
            document.getElementById('displayDob').innerText = formatDateToVN(user.dob);
            document.getElementById('displayHometown').innerText = user.hometown || "Chưa cập nhật";
            document.getElementById('displayGender').innerText = user.gender || "Chưa cập nhật";
            document.getElementById('displayPhone').innerText = user.phone || "Chưa cập nhật";
            document.getElementById('displayRole').innerText = user.role || "Nhà thám hiểm";
            document.getElementById('displayEra').innerText = user.favorite_era || "Chưa chọn";
            document.getElementById('displayStreak').innerText = user.streak_count || "0";
            
            const displayAvatar = document.getElementById('displayAvatar');
            if (user.avatar_url && displayAvatar) displayAvatar.src = user.avatar_url;

            // 2. LẤY TIẾN ĐỘ TỪ DATABASE
            const username = user.username || user.email;
            const safeUsername = encodeURIComponent(username);
            let lessonsCount = 0;
            let collectedBadges = []; 

            try {
                const progRes = await fetch(`${API_BASE_URL}/progress/${safeUsername}`);
                if (progRes.ok) {
                    const progData = await progRes.json();
                    lessonsCount = progData.completed_lessons ? progData.completed_lessons.length : 0;
                    collectedBadges = progData.collected_badges || [];
                }
            } catch (e) { console.error("Không lấy được tiến độ", e); }

            document.getElementById('displayCompletedLessons').innerText = lessonsCount;
            document.getElementById('displayBadgesCount').innerText = collectedBadges.length;

            // ====================================================================
            // 3. THUẬT TOÁN ĐỔ HUY CHƯƠNG (BỌC THÉP VỚI FUZZY SEARCH)
            // ====================================================================
            const badgeGrid = document.getElementById('badgesGrid');
            if (badgeGrid) {
                const MASTER_MEDAL_LIBRARY = [
                    { name: 'Kinh Dương Vương', url: 'hinh nhân vật/KDVx.png' },
                    { name: 'Lạc Long Quân', url: 'hinh nhân vật/LLQ.png' },
                    { name: 'Hai Bà Trưng', url: 'hinh nhân vật/HBT.png' },
                    { name: 'Lý Bí', url: 'hinh nhân vật/LyBi.png' },
                    { name: 'Ngô Quyền', url: 'hinh nhân vật/NgoQuyen.png' },
                    { name: 'Đinh Tiên Hoàng', url: 'hinh nhân vật/DinhTienHoang.png' },
                    { name: 'Lê Hoàn', url: 'hinh nhân vật/LeHoan.png' },
                    { name: 'Lý Thái Tổ', url: 'hinh nhân vật/LyThaiTo.png' },
                    { name: 'Trần Hưng Đạo', url: 'hinh nhân vật/TranHungDao.png' },
                    { name: 'Lê Lợi', url: 'hinh nhân vật/LeLoi.png' },
                    { name: 'Quang Trung', url: 'hinh nhân vật/QuangTrung.png' },
                    { name: 'Võ Nguyên Giáp', url: 'hinh nhân vật/VoNguyenGiap.png' },
                    { name: 'Chiến Thắng', url: 'hinh nhân vật/ChienThang.png' },
                    { name: 'Chế Bồng Nga (Chiêm Thành)', url: 'hinh nhân vật/ChiemThanh.png' } 
                ];

                let badgesHTML = '';
                
                // LỚP 1: Lọc bằng File Ảnh
                const userOwnedFiles = collectedBadges.map(badge => {
                    try {
                        let url = badge.medal_url || '';
                        return decodeURIComponent(url).split('/').pop().toLowerCase();
                    } catch(e) { return ''; }
                }).filter(n => n !== '');

                // LỚP 2: Lọc bằng Tên Nhân Vật (Fuzzy Search - Xóa sạch dấu ngoặc, phẩy để đối chiếu)
                const userOwnedNames = collectedBadges.map(badge => {
                    return (badge.char_name || '').toLowerCase().replace(/[(),.\-]/g, '').trim();
                }).filter(n => n !== '');

                let hasOwnedBadges = false;

                MASTER_MEDAL_LIBRARY.forEach(masterBadge => {
                    const masterImgName = masterBadge.url.split('/').pop().toLowerCase();
                    const masterCharName = masterBadge.name.toLowerCase().replace(/[(),.\-]/g, '').trim();
                    
                    // KIỂM TRA FUZZY: Chỉ cần tên trong DB có một phần của tên gốc (hoặc ngược lại) là ăn điểm!
                    const matchByName = userOwnedNames.some(dbName => masterCharName.includes(dbName) || dbName.includes(masterCharName));
                    
                    const isCollected = userOwnedFiles.includes(masterImgName) || matchByName;
                    
                    const safeUrl = encodeURI(masterBadge.url);

                    if (isCollected) {
                        hasOwnedBadges = true;
                        badgesHTML += `
                            <div class="badge-card owned">
                                <img src="${safeUrl}" alt="${masterBadge.name}" class="badge-image-real" onerror="this.src='https://placehold.co/100x100/fef2f2/b91c1c?text=Loi+Anh'">
                                <h4 class="badge-title">${masterBadge.name}</h4>
                                <p class="badge-desc text-green">Đã thu thập</p>
                            </div>
                        `;
                    } else {
                        badgesHTML += `
                            <div class="badge-card locked">
                                <img src="${safeUrl}" alt="${masterBadge.name}" class="badge-image-real" style="filter: grayscale(100%) opacity(40%);" onerror="this.src='https://placehold.co/100x100/f1f5f9/94a3b8?text=Lock'">
                                <h4 class="badge-title" style="color: #64748b;">${masterBadge.name}</h4>
                                <p class="badge-desc" style="color: #94a3b8;">Chưa khám phá</p>
                            </div>
                        `;
                    }
                });

                badgesHTML += `<div id="emptyBadgeMsg" style="grid-column: 1/-1; text-align: center; color: #86868b; padding: 30px; display: none; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">Bạn chưa thu thập được huy chương nào. Hãy trở lại học bài để mở khóa nhé!</div>`;

                badgeGrid.innerHTML = badgesHTML;
                
                if (typeof window.filterBadges === 'function') {
                    window.filterBadges(false);
                }
            }

            // 4. TÍNH ĐIỂM KINH NGHIỆM VÀ RANK
            const currentXP = (lessonsCount * 50) + (collectedBadges.length * 100) + ((parseInt(user.streak_count) || 0) * 10);
            
            let rankName = "Tập Sự";
            let iconClass = 'fa-solid fa-scroll'; 
            if (currentXP >= 500) { rankName = "Hào Kiệt"; iconClass = 'fa-solid fa-shield-halved'; }
            if (currentXP >= 1500) { rankName = "Cao Thủ"; iconClass = 'fa-solid fa-gavel'; }
            if (currentXP >= 3000) { rankName = "Đại Sư"; iconClass = 'fa-solid fa-crown'; }
            if (currentXP >= 5000) { rankName = "Huyền Thoại"; iconClass = 'fa-solid fa-dragon'; }

            const rankNameDisplay = document.getElementById('displayRankName');
            const rankIconDisplay = document.getElementById('displayRankIcon');
            if (rankNameDisplay) rankNameDisplay.innerText = rankName;
            if (rankIconDisplay) rankIconDisplay.className = iconClass;

            const totalXPDisplay = document.getElementById('displayTotalXP');
            if (totalXPDisplay) {
                let start = 0;
                const duration = 1000; 
                const increment = currentXP / (duration / 16) || 1; 
                const timer = setInterval(() => {
                    start += increment;
                    if (start >= currentXP) {
                        totalXPDisplay.innerText = currentXP.toLocaleString('vi-VN');
                        clearInterval(timer);
                    } else {
                        totalXPDisplay.innerText = Math.floor(start).toLocaleString('vi-VN');
                    }
                }, 16);
            }

            const progressBar = document.getElementById('rankProgressBar');
            const MAX_ROADMAP_XP = 5000;
            if (progressBar) {
                const percent = Math.min((currentXP / MAX_ROADMAP_XP) * 100, 100);
                setTimeout(() => { progressBar.style.width = `${percent}%`; }, 300);
            }

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
    }

    fetchUserProfile();

    // Hiệu ứng nảy mượt mà
    const revealElements = document.querySelectorAll('.reveal');
    setTimeout(() => {
        revealElements.forEach((el, index) => {
            setTimeout(() => { el.classList.add('active'); }, index * 100);
        });
    }, 100);

    // Chuyển Tab
    const tabOwned = document.getElementById('tabOwned');
    const tabLocked = document.getElementById('tabLocked');
    if (tabOwned && tabLocked) {
        tabOwned.addEventListener('click', () => {
            tabOwned.classList.add('active'); tabLocked.classList.remove('active');
            window.filterBadges(false); 
        });
        tabLocked.addEventListener('click', () => {
            tabLocked.classList.add('active'); tabOwned.classList.remove('active');
            window.filterBadges(true); 
        });
    }

    // Modal Cài đặt
    const editModal = document.getElementById('editProfileModal');
    const btnEditProfile = document.getElementById('btnEditProfile');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const formEditProfile = document.getElementById('formEditProfile');

    if (btnEditProfile && editModal) {
        btnEditProfile.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('temporia_user') || '{}');
            document.getElementById('previewEditAvatar').src = document.getElementById('displayAvatar').src;
            document.getElementById('editName').value = user.full_name || "";
            document.getElementById('editBio').value = user.bio || "";
            document.getElementById('editDob').value = user.dob || ""; 
            document.getElementById('editHometown').value = user.hometown || "";
            document.getElementById('editGender').value = user.gender || "";
            document.getElementById('editPhone').value = user.phone || "";
            document.getElementById('editRole').value = user.role || "";
            document.getElementById('editEra').value = user.favorite_era || "";
            editModal.classList.add('show');
        });
    }

    const closeModal = () => { if (editModal) editModal.classList.remove('show'); };
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (editModal) editModal.addEventListener('click', (e) => { if(e.target === editModal) closeModal(); });

    // Submit form thông tin cá nhân
    if (formEditProfile) {
        formEditProfile.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const btnSave = document.querySelector('.btn-save-profile');
            const originalText = btnSave.innerText;
            btnSave.innerText = "Đang đồng bộ dữ liệu..."; 
            btnSave.disabled = true;

            const token = getAuthToken();
            if (!token) return alert("Phiên đăng nhập không hợp lệ!");

            const updatedData = {
                full_name: document.getElementById('editName').value.trim(),
                bio: document.getElementById('editBio').value.trim(),
                dob: document.getElementById('editDob').value || null, 
                hometown: document.getElementById('editHometown').value.trim(),
                gender: document.getElementById('editGender').value,
                phone: document.getElementById('editPhone').value.trim(),
                role: document.getElementById('editRole').value.trim(),
                favorite_era: document.getElementById('editEra').value,
                avatar_url: document.getElementById('previewEditAvatar').src
            };

            try {
                const response = await fetch(ENDPOINT_UPDATE_PROFILE, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatedData)
                });

                if (!response.ok) throw new Error('Lỗi cập nhật dữ liệu máy chủ');

                let currentUser = JSON.parse(localStorage.getItem('temporia_user') || '{}');
                Object.assign(currentUser, updatedData); 
                localStorage.setItem('temporia_user', JSON.stringify(currentUser));

                document.getElementById('displayName').innerText = updatedData.full_name;
                document.getElementById('displayBio').innerText = updatedData.bio || "Chưa có châm ngôn nào được thiết lập.";
                document.getElementById('displayDob').innerText = formatDateToVN(updatedData.dob); 
                document.getElementById('displayHometown').innerText = updatedData.hometown || "Chưa cập nhật";
                document.getElementById('displayGender').innerText = updatedData.gender || "Chưa cập nhật";
                document.getElementById('displayPhone').innerText = updatedData.phone || "Chưa cập nhật";
                document.getElementById('displayRole').innerText = updatedData.role || "Nhà thám hiểm";
                document.getElementById('displayEra').innerText = updatedData.favorite_era || "Chưa chọn";
                
                const displayAvatar = document.getElementById('displayAvatar');
                if (displayAvatar && updatedData.avatar_url) displayAvatar.src = updatedData.avatar_url;

                btnSave.innerText = "Cập nhật thành công! ✓";
                btnSave.style.background = "#10b981"; 
                setTimeout(() => { closeModal(); btnSave.innerText = originalText; btnSave.style.background = ""; btnSave.disabled = false; }, 1000);
            } catch (error) {
                btnSave.innerText = "Lỗi: Dữ liệu quá lớn hoặc mất kết nối!";
                btnSave.style.background = "#475569";
                setTimeout(() => { btnSave.innerText = originalText; btnSave.style.background = ""; btnSave.disabled = false; }, 2500);
            }
        });
    }

    // Đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('temporia_token');
            localStorage.removeItem('temporia_user');
            if (typeof showToast === 'function') {
                showToast("Đã đăng xuất thành công!", "success");
                setTimeout(() => { window.location.href = "index.html"; }, 800);
            } else {
                alert("Đã đăng xuất thành công!");
                window.location.href = "index.html";
            }
        });
    }

    // Đổi Avatar
    const inputAvatar = document.getElementById('inputAvatarUpload');
    const previewImg = document.getElementById('previewEditAvatar');
    if (inputAvatar && previewImg) {
        inputAvatar.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                if(file.size > 2 * 1024 * 1024) alert("Cảnh báo: Ảnh lớn hơn 2MB có thể bị từ chối bởi Server.");
                const reader = new FileReader();
                reader.onload = function(e) { previewImg.src = e.target.result; } 
                reader.readAsDataURL(file);
            }
        });
    }
});