// =========================================================================
// HỆ THỐNG THÔNG BÁO APPLE-STYLE (SOLVIA TOAST) - GLOBAL
// =========================================================================
window.showToast = function(message, type = 'info') {
    // 1. Dọn dẹp thông báo cũ
    const existingToast = document.getElementById('solvia-toast');
    if (existingToast) existingToast.remove();

    // 2. Tạo hình hài kính mờ
    const toast = document.createElement('div');
    toast.id = 'solvia-toast';
    toast.className = 'solvia-toast-container';

    let iconHtml = '';
    if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check toast-success"></i>';
    else if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-exclamation toast-error"></i>';
    else iconHtml = '<i class="fa-solid fa-bell toast-info"></i>';

    toast.innerHTML = `
        <div class="solvia-toast-icon">${iconHtml}</div>
        <div class="solvia-toast-message">${message}</div>
    `;

    document.body.appendChild(toast);
    void toast.offsetWidth; // Ép render CSS
    toast.classList.add('show'); // Nảy xuống

    // 3. Tự động tắt
    let hideTimeout = setTimeout(() => { closeToast(toast); }, 3500);
    toast.addEventListener('click', () => { closeToast(toast); });

    // 4. Vật lý vuốt/kéo
    let startY = 0, startX = 0, currentY = 0, currentX = 0, isDragging = false;
    const onDragStart = (e) => {
        isDragging = true; toast.classList.add('dragging'); clearTimeout(hideTimeout);
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };
    const onDragMove = (e) => {
        if (!isDragging) return;
        currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let diffY = currentY - startY; let diffX = currentX - startX;
        if (diffY > 0) diffY = diffY * 0.15; // Lực cản khi kéo xuống
        toast.style.transform = `translateX(calc(-50% + ${diffX}px)) translateY(${diffY}px) scale(0.98)`;
    };
    const onDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false; toast.classList.remove('dragging');
        let diffY = currentY - startY; let mathDiffX = Math.abs(currentX - startX);
        if (diffY < -20 || mathDiffX > 50) { closeToast(toast, diffY, currentX - startX); } 
        else { toast.style.transform = ''; hideTimeout = setTimeout(() => { closeToast(toast); }, 3500); }
    };

    toast.addEventListener('mousedown', onDragStart); window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
    toast.addEventListener('touchstart', onDragStart, {passive: true}); window.addEventListener('touchmove', onDragMove, {passive: true}); window.addEventListener('touchend', onDragEnd);
};

// Hàm tắt bay vút ra ngoài
function closeToast(toast, velocityY = -150, velocityX = 0) {
    toast.classList.remove('show');
    toast.style.transform = `translateX(calc(-50% + ${velocityX * 1.5}px)) translateY(${velocityY}px) scale(0.9)`;
    toast.style.opacity = '0';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
}

/* ========================================================================= */
/* 1. HERO SLIDER (VÒNG LẶP VÔ TẬN - INFINITE LOOP)                          */
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById('heroSlider');
    if (!track) return;

    const dots = document.querySelectorAll('.slider-dots .dot');
    let originalSlides = document.querySelectorAll('.slider-track img');
    
    // Copy ảnh đầu và cuối gài vào 2 mép
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
    firstClone.id = 'first-clone';
    lastClone.id = 'last-clone';
    
    track.appendChild(firstClone);
    track.insertBefore(lastClone, originalSlides[0]);
    
    let slides = document.querySelectorAll('.slider-track img');
    let currentIndex = 1; // Vì index 0 bây giờ là ảnh copy ảo
    let isTransitioning = false;
    let slideInterval;
    
    // Đặt vị trí xuất phát
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    function updateSlider() {
        // Hiệu ứng trượt 0.8s
        track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Xử lý sáng đèn Dots
        let dotIndex = currentIndex - 1;
        if (currentIndex === slides.length - 1) dotIndex = 0;
        if (currentIndex === 0) dotIndex = dots.length - 1;
        
        dots.forEach(dot => dot.classList.remove('active'));
        if(dots[dotIndex]) dots[dotIndex].classList.add('active');
    }

    function nextSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        updateSlider();
    }

    // Kỹ thuật đánh lừa thị giác (khi chạy hết vòng)
    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        if (slides[currentIndex].id === 'first-clone') {
            track.style.transition = 'none'; // Tắt hiệu ứng để dịch chuyển tức thời
            currentIndex = 1; 
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
        if (slides[currentIndex].id === 'last-clone') {
            track.style.transition = 'none';
            currentIndex = slides.length - 2; 
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    });

    function startAutoSlide() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 3500); // Tự lướt sau 3.5s
    }

    window.goToSlide = function(index) {
        if (isTransitioning) return;
        currentIndex = index + 1;
        updateSlider();
        startAutoSlide();
    };

    startAutoSlide();
});

/* ========================================================================= */
/* 2. QUAN SÁT CUỘN TRANG (INTERSECTION OBSERVER - REVEAL ANIMATION)         */
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", function() {
    // Cài đặt: Khối HTML phải lộ ra ít nhất 15% trên màn hình thì mới kích hoạt
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Nếu khối đã đi vào tầm nhìn
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // Kích hoạt CSS nổi lên
                observer.unobserve(entry.target);     // Chỉ chạy 1 lần duy nhất
            }
        });
    }, observerOptions);

    // Tìm tất cả các khối có class "reveal" và bắt đầu theo dõi
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
});

/* ========================================================================= */
/* 3. SLIDER TRÍCH DẪN DANH NHÂN (QUOTE SLIDER VỚI ẢNH NỔI 3D)               */
/* ========================================================================= */
/* ========================================================================= */
/* 3. SLIDER TRÍCH DẪN DANH NHÂN (QUOTE SLIDER VỚI ẢNH NỔI 3D)               */
/* ========================================================================= */
/* ========================================================================= */
/* 3. QUOTE SHOWCASE (VÒNG LẶP VÔ TẬN - INFINITE LOOP + AUTO-PLAY)           */
/* ========================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    const track = document.getElementById('cleanQuoteTrack');
    if (!track) return;

    const dots = document.querySelectorAll('.quote-bottom-controls .c-dot');
    const totalActualSlides = dots.length; // Số slide gốc (3)
    let currentIdx = 0;
    let isTransitioning = false;
    let autoTimer;

    function updateCleanSlider(withTransition = true) {
        if (withTransition) {
            track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        } else {
            track.style.transition = 'none'; // Tắt hiệu ứng để nhảy ngầm
        }
        
        track.style.transform = `translateX(-${currentIdx * 100}%)`;
        
        // Bật sáng Dot tương ứng (Nếu trượt vào slide ảo số 3, Dot số 0 sẽ sáng)
        let activeDotIdx = currentIdx;
        if (activeDotIdx >= totalActualSlides) activeDotIdx = 0;
        
        dots.forEach(d => d.classList.remove('active'));
        if (dots[activeDotIdx]) {
            dots[activeDotIdx].classList.add('active');
        }
    }

    window.manualMoveSlide = function(direction) {
        if (isTransitioning) return;
        
        currentIdx += direction;

        // Xử lý khi bấm nút [<] lúc đang ở slide đầu: Lùi ngầm về slide ảo cuối rồi trượt về slide gốc cuối
        if (currentIdx < 0) {
            isTransitioning = true;
            currentIdx = totalActualSlides; 
            updateCleanSlider(false); // Nhảy ngầm không trượt
            
            track.offsetHeight; // Ép trình duyệt cập nhật lại khung hình ngay lập tức
            
            currentIdx = totalActualSlides - 1;
            updateCleanSlider(true); // Bật trượt lùi về slide số 2
        } else {
            isTransitioning = true;
            updateCleanSlider(true);
        }
        
        resetAutoPlay();
    };

    window.manualJumpTo = function(targetIndex) {
        if (isTransitioning || currentIdx === targetIndex) return;
        isTransitioning = true;
        currentIdx = targetIndex;
        updateCleanSlider(true);
        resetAutoPlay();
    };

    // ĐÁNH LỪA THỊ GIÁC: Xử lý ngầm khi hiệu ứng lướt kết thúc
    track.addEventListener('transitionend', function() {
        isTransitioning = false;
        
        // Nếu vừa trượt hoàn tất vào Slide Ảo (ở cuối cùng)
        if (currentIdx >= totalActualSlides) {
            currentIdx = 0; // Ngắt transition, nhảy tức thời về Slide Gốc số 0
            updateCleanSlider(false);
        }
    });

    // --- LOGIC TỰ ĐỘNG LƯỚT ---
    function startAutoPlay() {
        autoTimer = setInterval(() => {
            if (!isTransitioning) {
                isTransitioning = true;
                currentIdx++;
                updateCleanSlider(true);
            }
        }, 4500);
    }

    function resetAutoPlay() {
        clearInterval(autoTimer);
        startAutoPlay();
    }

    updateCleanSlider(true);
    startAutoPlay();
});

/* ========================================================================= */
/* 4. FEEDBACK CAROUSEL (TỰ ĐỘNG CHUYỂN COMMENT TRONG BENTO BOX)             */
/* ========================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    const commentItems = document.querySelectorAll('.feedback-carousel .comment-item');
    if (commentItems.length === 0) return;
    
    let currentCmtIdx = 0;
    
    setInterval(() => {
        // Gỡ trạng thái active của comment hiện tại
        commentItems.forEach(cmt => cmt.classList.remove('active'));
        
        // Chuyển sang comment tiếp theo
        currentCmtIdx++;
        if (currentCmtIdx >= commentItems.length) {
            currentCmtIdx = 0;
        }
        
        // Kích hoạt comment mới
        if (commentItems[currentCmtIdx]) {
            commentItems[currentCmtIdx].classList.add('active');
        }
    }, 4500); // Thời gian luân phiên: 4.5 giây
});

/* ========================================================================= */
/* 5. HERO ANIMATION MODAL CONTROL (TÍNH TOÁN TỌA ĐỘ VÀ BAY RA GIỮA)         */
/* ========================================================================= */

window.openTemporiaModal = function(event, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const modalBox = modal.querySelector('.temporia-modal-box');
    
    // ĐO ĐẠC TỌA ĐỘ NẾU CÓ SỰ KIỆN CLICK
    if (event && event.currentTarget && modalBox) {
        const card = event.currentTarget;
        const rect = card.getBoundingClientRect(); // Lấy khung hình học của thẻ Bento
        
        // 1. Tâm của thẻ Bento vừa bấm
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        
        // 2. Tâm của màn hình hiển thị
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        
        // 3. Quãng đường cần dịch chuyển (Delta)
        const deltaX = cardCenterX - screenCenterX;
        const deltaY = cardCenterY - screenCenterY;
        
        // 4. Bơm tọa độ vào các biến CSS của Modal Box
        modalBox.style.setProperty('--origin-x', `${deltaX}px`);
        modalBox.style.setProperty('--origin-y', `${deltaY}px`);
        
        // Tính tỷ lệ thu nhỏ ban đầu sao cho xấp xỉ chiều rộng của thẻ Bento
        const startScale = rect.width / (window.innerWidth * 0.9);
        modalBox.style.setProperty('--origin-scale', Math.min(Math.max(startScale, 0.2), 0.35));
    }

    // KỸ THUẬT NÂNG CAO: Dùng 2 lần requestAnimationFrame để đảm bảo trình duyệt 
    // đã nạp xong tọa độ mới vào GPU trước khi kích hoạt lệnh bay (.active)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });

    document.body.style.overflow = 'hidden'; 
};

window.closeTemporiaModal = function(event, forceClose = false) {
    if (forceClose || (event && event.target && event.target.classList.contains('temporia-modal-overlay'))) {
        const modals = document.querySelectorAll('.temporia-modal-overlay');
        modals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto'; 
    }
};

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') window.closeTemporiaModal(null, true);
});

/* ========================================================================= */
/* 6. COMMUNITY FEED ACCORDION CONTROL (MỞ RỘNG NGẦM KHỐI BÀI ĐĂNG)          */
/* ========================================================================= */
window.toggleCommunityFeed = function(event) {
    // Ngăn chặn sự kiện nổi bọt nếu click vào icon bên trong
    if (event) event.stopPropagation();
    
    const feedArea = document.getElementById('communityFeedArea');
    const bentoItem = document.querySelector('.metrics-box');
    
    if (!feedArea) return;

    const isExpanded = feedArea.classList.contains('expanded');

    if (!isExpanded) {
        // 1. MỞ RỘNG
        feedArea.classList.add('expanded');
        // Đổi hướng mũi tên của Bento Box thành hướng lên
        if (bentoItem) {
            const arrowIcon = bentoItem.querySelector('.explore-arrow i');
            if (arrowIcon) arrowIcon.className = 'fa-solid fa-arrow-up';
        }
        
        // Tự động cuộn trang êm ái xuống khu vực Feed vừa bung ra sau 300ms
        setTimeout(() => {
            feedArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        
    } else {
        // 2. THU GỌN
        feedArea.classList.remove('expanded');
        if (bentoItem) {
            const arrowIcon = bentoItem.querySelector('.explore-arrow i');
            if (arrowIcon) arrowIcon.className = 'fa-solid fa-arrow-down';
            
            // Cuộn trả ngược về khối Bento để người dùng không bị lạc hướng
            bentoItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
};

/* ========================================================================= */
/* GLOBAL PROFILE HOVERCARD CONTROL (TỰ ĐỘNG BẮT SỰ KIỆN TOÀN HỆ THỐNG)      */
/* ========================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    const popover = document.getElementById('temporiaUserPopover');
    if (!popover) return;

    let hoverTimeout;

    // Lắng nghe sự kiện di chuột (mouseover) trên toàn bộ tài liệu
    document.addEventListener('mouseover', function(event) {
        const trigger = event.target.closest('.temporia-user-trigger');
        
        if (trigger) {
            // Xóa bộ đếm cũ nếu có
            clearTimeout(hoverTimeout);
            
            // Đợi 350ms xem người dùng có thực sự muốn ngắm thông tin không
            hoverTimeout = setTimeout(() => {
                
                // 1. RÚT TRÍCH DỮ LIỆU TỪ CÁC THUỘC TÍNH DATA CỦA THẺ
                const name = trigger.getAttribute('data-name') || trigger.innerText;
                const avt = trigger.getAttribute('data-avt') || 'test/NPTx.png';
                const email = trigger.getAttribute('data-email') || 'chuacapnhat@temporia.vn';
                const dob = trigger.getAttribute('data-dob') || 'Đang cập nhật';
                const hometown = trigger.getAttribute('data-hometown') || 'Việt Nam';
                const badges = trigger.getAttribute('data-badges') || '0';
                const streak = trigger.getAttribute('data-streak') || '0';
                const rank = trigger.getAttribute('data-rank') || 'Tập Sự';
                const rankClass = trigger.getAttribute('data-rank-class') || 'static-badge';

                // 2. BƠM DỮ LIỆU VÀO POPOVER
                document.getElementById('popName').innerText = name;
                document.getElementById('popAvt').src = avt;
                document.getElementById('popEmail').innerText = email;
                document.getElementById('popDob').innerText = dob;
                document.getElementById('popHometown').innerText = hometown;
                document.getElementById('popBadges').innerText = badges;
                document.getElementById('popStreak').innerText = streak;
                
                const rankEl = document.getElementById('popRank');
                rankEl.className = `pop-tier-badge ${rankClass}`;
                rankEl.innerHTML = `<i class="fa-solid fa-trophy"></i> ${rank}`;

                // 3. TÍNH TOÁN TỌA ĐỘ HIỂN THỊ THÔNG MINH
                // Lấy tọa độ chuột hiện tại
                let left = event.clientX + 15; // Lệch sang phải chuột 15px
                let top = event.clientY + 15;  // Lệch xuống dưới chuột 15px
                
                // Thuật toán chống tràn màn hình: Nếu bảng bị lố rìa phải hoặc lố đáy thì tự động lật ngược lại
                const popWidth = 310;
                const popHeight = 220;
                
                if (left + popWidth > window.innerWidth) {
                    left = event.clientX - popWidth - 15; // Lật sang trái chuột
                }
                if (top + popHeight > window.innerHeight) {
                    top = event.clientY - popHeight - 15; // Lật lên trên chuột
                }

                popover.style.left = `${left}px`;
                popover.style.top = `${top}px`;
                
                // Kích hoạt animation hiện ra
                popover.classList.add('show');

            }, 350); // Thời gian chờ 350ms
        }
    });

    // Lắng nghe sự kiện rời chuột (mouseout) để ẩn Popover
    document.addEventListener('mouseout', function(event) {
        const trigger = event.target.closest('.temporia-user-trigger');
        if (trigger) {
            clearTimeout(hoverTimeout);
            popover.classList.remove('show');
        }
    });
});

/* ========================================================================= */
/* JS TRANG CHỦ - BẮT KÍCH HOẠT CHUYỂN TRANG SPA TAN BIẾN MƯỢT MÀ            */
/* ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Tìm chính xác các nút Đăng nhập / Đăng ký trong khu vực nav-auth
    const authNavigationLinks = document.querySelectorAll('.nav-auth a');

    authNavigationLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // 1. CHẶN ĐỨNG NGAY LẬP TỨC CÚ NHẢY TRANG MẶC ĐỊNH
            event.preventDefault(); 
            const destinationUrl = this.getAttribute('href');
            
            console.log("Đã bắt thành công sự kiện click sang:", destinationUrl);

            // 2. TÌM TOÀN BỘ NỘI DUNG NGOẠI TRỪ NAVBAR ĐỂ LÀM MỜ
            // Lấy tất cả các thẻ con trực tiếp của body, trừ navbar, overlay và script
            const elementsToFade = document.querySelectorAll('body > *:not(.navbar):not(.page-transition-overlay):not(script)');

            if (elementsToFade.length > 0) {
                elementsToFade.forEach(el => {
                    el.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                    el.style.opacity = "0";
                    el.style.transform = "scale(0.98)";
                });
            } else {
                console.warn("Không tìm thấy khối nội dung nào để làm mờ!");
            }

            // 3. ĐỢI HIỆU ỨNG TAN BIẾN XONG (350ms) RỒI MỚI CHUYỂN TRANG
            setTimeout(() => {
                window.location.href = destinationUrl;
            }, 350);
        });
    });
});

/* ========================================================================= */
/* 7. HỆ THỐNG ĐÁNH CHẶN THÔNG MINH (AUTH GATE)                              */
/* ========================================================================= */
/* ========================================================================= */
/* 7. HỆ THỐNG ĐÁNH CHẶN THÔNG MINH (AUTH GATE - TRƯỢT TỪ TRÊN XUỐNG)         */
/* ========================================================================= */

// Hàm gọi Toast Đăng nhập và cài đặt vật lý hất/vuốt
/* ========================================================================= */
/* 7. HỆ THỐNG ĐÁNH CHẶN THÔNG MINH (AUTH GATE - FULL UX)                    */
/* ========================================================================= */

window.showAuthGateToast = function() {
    const toast = document.getElementById('authGateToast');
    const overlay = document.getElementById('agtOverlay');
    const closeBtn = document.getElementById('agtCloseBtn');
    
    if (!toast || !overlay) return;
    
    // Bật cả thẻ Toast và Lớp sương mờ
    toast.classList.add('show');
    overlay.classList.add('show');
    
    // Hàm đóng đa năng (Dùng cho cả Nút X, Click ngoài, và Vuốt)
    const closeAuthToast = () => {
        toast.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => { toast.style.transform = ''; }, 400); // Reset vị trí sau khi bay mất
    };

    // 1. Cho phép bấm ra ngoài lớp sương mờ để tắt
    overlay.onclick = closeAuthToast;
    // 2. Cho phép bấm nút X để tắt
    if (closeBtn) closeBtn.onclick = closeAuthToast;

    // 3. Hệ thống vật lý vuốt (Drag & Swipe)
    let startY = 0, startX = 0, currentY = 0, currentX = 0, isDragging = false;
    
    const onDragStart = (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return; 
        isDragging = true; 
        toast.classList.add('dragging');
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };
    
    const onDragMove = (e) => {
        if (!isDragging) return;
        currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        
        let diffY = currentY - startY; 
        let diffX = currentX - startX;
        if (diffY > 0) diffY = diffY * 0.15; 
        
        toast.style.transform = `translateX(calc(-50% + ${diffX}px)) translateY(${diffY}px) scale(0.98)`;
    };
    
    const onDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false; 
        toast.classList.remove('dragging');
        
        let diffY = currentY - startY; 
        let mathDiffX = Math.abs(currentX - startX);
        
        if (diffY < -25 || mathDiffX > 50) { 
            toast.classList.remove('show');
            overlay.classList.remove('show'); // Tắt luôn sương mờ khi hất văng
            toast.style.transform = `translateX(calc(-50% + ${currentX - startX}px)) translateY(${diffY - 100}px) scale(0.9)`;
            setTimeout(() => { toast.style.transform = ''; }, 400); 
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



document.addEventListener('DOMContentLoaded', () => {
    const lockedElements = document.querySelectorAll('.detail-link-btn, .bento-tall .card-link');

    lockedElements.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault(); 
            const destinationUrl = this.getAttribute('href');
            const userSession = localStorage.getItem('temporia_user');

            if (!userSession) {
                // GỌI HÀM TOAST ĐĂNG NHẬP TRƯỢT XUỐNG
                showAuthGateToast();
            } else {
                if (!destinationUrl || destinationUrl.startsWith('#')) {
                    if (typeof showToast === "function") showToast("Khu vực này đang được Temporia hoàn thiện!", "info");
                } else {
                    document.body.style.transition = "opacity 0.3s ease";
                    document.body.style.opacity = "0";
                    setTimeout(() => { window.location.href = destinationUrl; }, 300);
                }
            }
        });
    });
});