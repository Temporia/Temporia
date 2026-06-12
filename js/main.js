
// =========================================================================
// HỆ THỐNG THÔNG BÁO APPLE-STYLE (SOLVIA TOAST) - GLOBAL FUNCTION
// =========================================================================
window.showToast = function(message, type = 'info') {
    // 1. DIỆT GỌN THÔNG BÁO CŨ (Không xếp hàng, đè lên tức thì)
    const existingToast = document.getElementById('solvia-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 2. TẠO THÔNG BÁO MỚI
    const toast = document.createElement('div');
    toast.id = 'solvia-toast';
    toast.className = 'solvia-toast-container';

    // Xác định icon theo loại
    let iconHtml = '';
    if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check toast-success"></i>';
    else if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-exclamation toast-error"></i>';
    else iconHtml = '<i class="fa-solid fa-bell toast-info"></i>';

    toast.innerHTML = `
        <div class="solvia-toast-icon">${iconHtml}</div>
        <div class="solvia-toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    // Kích hoạt nảy xuống
    void toast.offsetWidth; 
    toast.classList.add('show');

    // 3. TỰ ĐỘNG TẮT SAU 3.5 GIÂY
    let hideTimeout = setTimeout(() => { closeToast(toast); }, 3500);

    // 4. BẤM VÀO ĐỂ TẮT LUÔN
    toast.addEventListener('click', () => { closeToast(toast); });

    // ==========================================
    // 5. VẬT LÝ HỌC: VUỐT & KÉO THẢ (MOUSE & TOUCH)
    // ==========================================
    let startY = 0, startX = 0, currentY = 0, currentX = 0, isDragging = false;

    const onDragStart = (e) => {
        isDragging = true;
        toast.classList.add('dragging');
        clearTimeout(hideTimeout); // Đang cầm thì không tự tắt
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        
        let diffY = currentY - startY;
        let diffX = currentX - startX;

        // Nếu kéo xuống dưới, tạo lực cản (vuốt xuống thì đi chậm lại)
        if (diffY > 0) diffY = diffY * 0.15; 

        toast.style.transform = `translateX(calc(-50% + ${diffX}px)) translateY(${diffY}px) scale(0.98)`;
    };

    const onDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        toast.classList.remove('dragging');

        let diffY = currentY - startY;
        let mathDiffX = Math.abs(currentX - startX);

        // THUẬT TOÁN: Nếu vuốt ngược lên trên 20px HOẶC hất sang ngang 50px -> Tắt
        if (diffY < -20 || mathDiffX > 50) {
            closeToast(toast, diffY, currentX - startX);
        } else {
            // Nhả ra không đủ lực -> Nảy đàn hồi về giữa
            toast.style.transform = '';
            hideTimeout = setTimeout(() => { closeToast(toast); }, 3500);
        }
    };

    toast.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    toast.addEventListener('touchstart', onDragStart, {passive: true});
    window.addEventListener('touchmove', onDragMove, {passive: true});
    window.addEventListener('touchend', onDragEnd);
};

// HÀM ĐÓNG THÔNG BÁO (Bay vút ra ngoài mượt mà)
function closeToast(toast, velocityY = -150, velocityX = 0) {
    toast.classList.remove('show');
    // Nếu bị hất văng, bay tiếp theo hướng hất
    toast.style.transform = `translateX(calc(-50% + ${velocityX * 1.5}px)) translateY(${velocityY}px) scale(0.9)`;
    toast.style.opacity = '0';
    
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
}





document.addEventListener("DOMContentLoaded", function() {
    console.log("Temporia Core System Loaded.");

    // ==========================================
    // 1. HIỆU ỨNG XUẤT HIỆN KHI CUỘN TRANG (FADE IN)
    // ==========================================
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.2
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => {
        scrollObserver.observe(el);
    });

    

    // ==========================================
    // 2. HIỆU ỨNG TIMELINE LƯỚT CONG (CURVED SCROLL)
    // ==========================================
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    const timelineItems = document.querySelectorAll('.timeline-item');

    if (timelineWrapper && timelineItems.length > 0) {
        
        // HÀM VẼ ĐƯỜNG CONG V VẶN TRỤC
        function updateTimelineCurve() {
            const wrapperCenter = window.innerWidth / 2;
            const itemData = [];

            // Bước 1: Tính toán độ võng cho thẻ
            timelineItems.forEach(item => {
                const rect = item.getBoundingClientRect();
                const itemCenter = rect.left + rect.width / 2;
                const distFromCenter = itemCenter - wrapperCenter;
                
                // Độ võng êm ái
                const yOffset = Math.pow(distFromCenter, 2) / 6000; 
                
                itemData.push({ item, itemCenter, yOffset });
            });

            // Bước 2: Ép quỹ đạo và nối trục
            itemData.forEach((data, index) => {
                data.item.style.transform = `translateY(${data.yOffset}px)`;

                const connector = data.item.querySelector('.timeline-connector');
                if (connector && index < itemData.length - 1) {
                    const nextData = itemData[index + 1];
                    const dx = nextData.itemCenter - data.itemCenter;
                    const dy = nextData.yOffset - data.yOffset;
                    
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    connector.style.width = `${distance}px`;
                    connector.style.transform = `rotate(${angle}deg)`;
                } else if (connector) {
                    connector.style.display = 'none';
                }
            });
        }

        // Lắng nghe sự kiện scroll mặc định để cập nhật đường cong
        timelineWrapper.addEventListener('scroll', () => {
            requestAnimationFrame(updateTimelineCurve);
        });
        window.addEventListener('resize', () => {
            requestAnimationFrame(updateTimelineCurve);
        });
        
        
        // ==========================================
        // STICKY SCROLL: BIẾN CUỘN DỌC THÀNH TRƯỢT NGANG
        // ==========================================
        const section3 = document.getElementById('section3');
        const timelineTrack = document.querySelector('.timeline-track');

        window.addEventListener('scroll', () => {
            if (!section3 || !timelineTrack) return;
            
            // Lấy tọa độ của toàn bộ khu vực 300vh
            const rect = section3.getBoundingClientRect();
            
            // Khoảng cách cuộn tối đa (300vh - 100vh của màn hình = 200vh)
            const scrollableDistance = section3.offsetHeight - window.innerHeight;
            
            // Nếu mép trên của section bắt đầu chạm nóc màn hình (rect.top <= 0)
            // Và chưa vượt quá đáy (rect.top >= -scrollableDistance)
            if (rect.top <= 0 && rect.top >= -scrollableDistance) {
                
                // Tính toán tiến độ cuộn từ 0 đến 1
                let progress = Math.abs(rect.top) / scrollableDistance;
                
                // Tính quãng đường cần trượt ngang
                const maxTranslate = timelineTrack.scrollWidth - window.innerWidth;
                const translateX = progress * maxTranslate;
                
                // Đẩy xấp thẻ bài trượt ngang
                timelineTrack.style.transform = `translateX(-${translateX}px)`;
                
                // Gọi lại hàm vẽ đường cong để cập nhật độ võng liên tục
                requestAnimationFrame(updateTimelineCurve);
                
            } else if (rect.top > 0) {
                // Nếu chưa cuộn tới, trả về vị trí 0
                timelineTrack.style.transform = `translateX(0px)`;
            } else {
                // Nếu đã cuộn vượt qua, giữ thẻ bài ở điểm cuối cùng
                const maxTranslate = timelineTrack.scrollWidth - window.innerWidth;
                timelineTrack.style.transform = `translateX(-${maxTranslate}px)`;
            }
        });
        // ==========================================
        // TÍNH NĂNG MỚI: NHẤN GIỮ VÀ KÉO BẰNG CHUỘT (DRAG TO SCROLL)
        // ==========================================
        let isDown = false;
        let startX;
        let scrollLeft;

        timelineWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            timelineWrapper.style.cursor = 'grabbing'; // Hiện hình bàn tay nắm lại
            startX = e.pageX - timelineWrapper.offsetLeft;
            scrollLeft = timelineWrapper.scrollLeft;
        });

        timelineWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            timelineWrapper.style.cursor = 'default';
        });

        timelineWrapper.addEventListener('mouseup', () => {
            isDown = false;
            timelineWrapper.style.cursor = 'default';
        });

        timelineWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault(); // Tránh lỗi bôi đen chữ khi đang kéo
            const x = e.pageX - timelineWrapper.offsetLeft;
            const walk = (x - startX) * 2; // Tốc độ trượt khi kéo (nhân 2 cho lướt nhanh)
            timelineWrapper.scrollLeft = scrollLeft - walk;
        });

        // Kích hoạt tính toán đường cong ngay khi tải trang xong
        updateTimelineCurve();
    }

    // ==========================================
        // 4. HIỆU ỨNG ĐÓNG MỞ RÈM & CHỌN THẺ BÀI
        // ==========================================
        const genCards = Array.from(document.querySelectorAll('.gen-card'));
        const genSection = document.getElementById('section4');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const panelContentEl = document.querySelector('.panel-content');
        
        // Element của Khung thông tin
        const heroNameEl = document.getElementById('heroName');
        const heroQuoteEl = document.getElementById('heroQuote');

        let currentIndex = 0; 
        const visibleCount = 4;
        const totalCards = genCards.length;
        
        // CHỐT AN TOÀN: Khóa click khi đang chạy hiệu ứng để không bị lỗi
        let isAnimating = false; 

        // Hàm cập nhật lại xấp bài (Bản nâng cấp: Tự động lấp chỗ trống)
        function updateCardDeck() {
            let stackPosition = 0; // Biến đếm vị trí thực tế trong xấp bài (từ 0 đến 3)

            for (let i = 0; i < totalCards; i++) {
                // Tính toán vị trí xoay vòng của thẻ bài
                let actualIndex = (currentIndex + i) % totalCards;
                let card = genCards[actualIndex];

                // Xóa sạch các trạng thái cũ để chia bài lại từ đầu
                card.classList.remove('stacked', 'passed', 'hidden');

                // BÍ QUYẾT LẤP CHỖ TRỐNG: 
                // Nếu thẻ này đang được lật ra giữa màn hình (active) -> Bỏ qua nó không xếp vào xấp,
                // Không tăng stackPosition để nhường vị trí đó cho lá bài tiếp theo đôn lên!
                if (card.classList.contains('active')) {
                    continue; 
                }

                // Lá bài nằm ngay trước currentIndex sẽ bị đẩy về trạng thái passed (bay xuống góc)
                if (i === totalCards - 1) {
                    card.classList.add('passed');
                } 
                // Nhét các lá bài còn lại vào xấp cho đến khi đủ số lượng visibleCount (4 lá)
                else if (stackPosition < visibleCount) {
                    card.classList.add('stacked');
                    card.style.setProperty('--i', stackPosition);
                    stackPosition++; // Tăng đếm để thẻ tiếp theo biết đường lùi ra sau thêm 1 nấc
                } 
                // Nếu xấp bài đã no nê đủ 4 lá rồi, giấu cất các lá dư đi
                else {
                    card.classList.add('hidden');
                }
            }
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(isAnimating) return; // Đang chạy hiệu ứng thì không cho lướt
                currentIndex = (currentIndex + 1) % totalCards; 
                updateCardDeck();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(isAnimating) return;
                currentIndex = (currentIndex - 1 + totalCards) % totalCards; 
                updateCardDeck();
            });
        }

        // Hàm ẩn bài và cất Khung thông tin đi
        function resetActiveCard() {
            genCards.forEach(c => c.classList.remove('active'));
            genSection.classList.remove('has-active-card');
        }

        // Click Lật Bài
        genCards.forEach((card) => {
            card.addEventListener('click', function(e) {
                e.stopPropagation(); 
                
                // Chặn click loạn xạ khi thẻ bài và khung đang di chuyển
                if (isAnimating) return;
                
                // Nếu bấm vào chính lá bài đang lật -> Đóng lại
                if (this.classList.contains('active')) {
                    resetActiveCard();
                    updateCardDeck(); 
                } else {
                    // Lấy dữ liệu của thẻ bài vừa bấm
                    const name = this.getAttribute('data-name') || 'Tên Tướng';
                    const quote = this.getAttribute('data-quote') || 'Câu nói lịch sử...';

                    // KIỂM TRA: CÓ ĐANG MỞ KHUNG SẴN KHÔNG?
                    if (genSection.classList.contains('has-active-card')) {
                        
                        // ===============================================
                        // KỊCH BẢN 1: ĐỔI BÀI (ĐÓNG RÈM -> ĐỔI BÀI -> MỞ RÈM)
                        // ===============================================
                        isAnimating = true; // Bật khóa an toàn
                        
                        // Bước 1: Gỡ lệnh active để Rèm tự thu lại và Bài tự bay về
                        resetActiveCard();
                        updateCardDeck();

                        // Bước 2: Bấm đồng hồ đợi 500ms cho Rèm đóng xong hẳn
                        setTimeout(() => {
                            // Cập nhật chữ mới vào khung (lúc này khung đang tàng hình)
                            if (heroNameEl) heroNameEl.textContent = name;
                            if (heroQuoteEl) heroQuoteEl.textContent = `"${quote}"`;
                            
                            // Phóng lá bài mới ra và Mở rèm lại
                            this.classList.add('active');
                            genSection.classList.add('has-active-card');
                            updateCardDeck();
                            
                            // Mở khóa an toàn sau khi hiệu ứng mở rèm (0.6s) hoàn tất
                            setTimeout(() => { isAnimating = false; }, 600);
                        }, 500);

                    } else {
                        // ===============================================
                        // KỊCH BẢN 2: LẦN ĐẦU LẬT BÀI (CHỈ MỞ RÈM RA)
                        // ===============================================
                        isAnimating = true;
                        
                        resetActiveCard();
                        this.classList.add('active');
                        genSection.classList.add('has-active-card'); 
                        
                        if (heroNameEl) heroNameEl.textContent = name;
                        if (heroQuoteEl) heroQuoteEl.textContent = `"${quote}"`;
                        
                        updateCardDeck();
                        
                        // Đợi mở xong thì gỡ khóa
                        setTimeout(() => { isAnimating = false; }, 600);
                    }
                }
            });
        });

        // Click ra nền đen để thu bài
        genSection.addEventListener('click', function(e) {
            if (!e.target.closest('.gen-card') && 
                !e.target.closest('.card-navigation') && 
                !e.target.closest('.hero-details')) {
                resetActiveCard();
                updateCardDeck();
            }
        });

        // Khởi chạy lần đầu
        updateCardDeck();


        // ==========================================
        // 5. KỊCH BẢN MODAL KHÁM PHÁ CHI TIẾT (FLIP ANIMATION - BAY TỪ THẺ BÀI)
        // ==========================================
        const heroModal = document.getElementById('heroModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalImage = document.getElementById('modalImage');
        const modalImageContainer = document.querySelector('.modal-image-container'); // Khối chứa hình

        let isModalAnimating = false; // Khóa an toàn chống click spam

        document.body.addEventListener('click', (e) => {
            const exploreBtn = e.target.closest('.explore-btn');
            
            if (exploreBtn) {
                e.preventDefault(); 
                
                // Khóa không cho bấm lung tung khi đang chiếu hiệu ứng bay
                if (isModalAnimating) return;
                isModalAnimating = true;

                const activeCard = document.querySelector('.gen-card.active');
                if (!activeCard || !modalImageContainer) {
                    isModalAnimating = false;
                    return;
                }
                
                const activeCardImg = activeCard.querySelector('img');
                if (activeCardImg && modalImage) {
                    modalImage.src = activeCardImg.src; 
                }

                // ========================================================
                // BƯỚC 1: TÍNH TOÁN TỌA ĐỘ CỦA THẺ BÀI ĐANG NẰM TRÊN WEB
                // ========================================================
                const rect = activeCard.getBoundingClientRect();
                const sourceCenterX = rect.left + rect.width / 2;
                const sourceCenterY = rect.top + rect.height / 2;
                
                const viewportCenterX = window.innerWidth / 2;
                const viewportCenterY = window.innerHeight / 2;

                // Tính quãng đường cần bay từ Thẻ bài ra Giữa màn hình
                const deltaX = sourceCenterX - viewportCenterX;
                const deltaY = sourceCenterY - viewportCenterY;
                const scale = rect.width / 360; // Thu nhỏ lại cho bằng đúng kích thước thẻ bài gốc

                // ========================================================
                // BƯỚC 2: CHUẨN BỊ BAY (Ép hình chui về đúng vị trí thẻ bài)
                // ========================================================
                modalImageContainer.style.transition = 'none'; // Tạm tắt hiệu ứng để dịch chuyển tức thời
                modalImageContainer.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`;

                // Bật phông nền mờ đen lên
                if (heroModal) {
                    heroModal.classList.add('active');
                    document.body.style.overflow = 'hidden';

                    // Cú lừa thị giác: Ép trình duyệt ghi nhận vị trí xuất phát
                    modalImageContainer.offsetHeight; 

                    // ========================================================
                    // BƯỚC 3: THẢ XÍCH CHO HÌNH BAY RA GIỮA
                    // ========================================================
                    modalImageContainer.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                    modalImageContainer.style.transform = ''; // Xóa vị trí cũ, hình tự động bay về trung tâm màn hình

                    // ========================================================
                    // BƯỚC 4: BAY RA GIỮA XONG -> TRƯỢT SANG TRÁI VÀ HIỆN CHỮ
                    // ========================================================
                    setTimeout(() => {
                        heroModal.classList.add('step2');
                        isModalAnimating = false; // Hoàn tất mở khóa an toàn
                    }, 800); // 0.8s bằng đúng thời gian bay ra giữa
                }
            }
        });

        // NÚT ĐÓNG MODAL (TUA NGƯỢC KỊCH BẢN VÀ BAY VỀ CHỖ CŨ)
        if (closeModalBtn && heroModal) {
            closeModalBtn.addEventListener('click', () => {
                if (isModalAnimating) return;
                isModalAnimating = true;

                // Nhịp 1: Xóa chữ, kéo hình từ bên trái trượt về lại chính giữa
                heroModal.classList.remove('step2');
                
                // Nhịp 2: Đợi nó về giữa xong (0.8s), tính toán lại tọa độ và bay ngược về thẻ bài
                setTimeout(() => {
                    const activeCard = document.querySelector('.gen-card.active');
                    if (activeCard && modalImageContainer) {
                        const rect = activeCard.getBoundingClientRect();
                        const deltaX = (rect.left + rect.width / 2) - window.innerWidth / 2;
                        const deltaY = (rect.top + rect.height / 2) - window.innerHeight / 2;
                        const scale = rect.width / 360;

                        // Ra lệnh bay vút về lại đúng vị trí thẻ bài
                        modalImageContainer.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`;
                    }
                    
                    // Cùng lúc đó từ từ tắt phông nền mờ đi
                    heroModal.classList.remove('active');
                    document.body.style.overflow = '';
                    
                    // Nhịp 3: Dọn dẹp tàn cuộc sau khi bay xong (0.8s)
                    setTimeout(() => {
                        if(modalImage) modalImage.src = ""; 
                        modalImageContainer.style.transform = ''; 
                        modalImageContainer.style.transition = ''; 
                        isModalAnimating = false; // Hoàn tất dọn dẹp, sẵn sàng cho lần sau
                    }, 800); 

                }, 800); 
            });
        }
        
});
// ==========================================
// 7. BẢN ĐỒ SCROLLYTELLING VỚI LEAFLET API
// ==========================================

// --- THÊM HÀM MỞ/ĐÓNG MODAL (Để phục vụ cho nút Khám phá) ---
window.openBattleModal = function(index) {
    const battle = window.battleData[index];
    document.getElementById('modal-battle-title').innerHTML = battle.title;
    document.getElementById('modal-battle-media').innerHTML = `<img src="${battle.detailImg}" alt="Chi tiết">`;
    document.getElementById('modal-battle-desc').innerHTML = battle.detailText;
    document.getElementById('battleDetailModal').classList.add('active');
};

window.closeBattleModal = function() {
    document.getElementById('battleDetailModal').classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const section5 = document.getElementById('section5');
    if (!section5) return;

    // 1. LẤY DỮ LIỆU TỪ HTML (Thay vì viết cứng mảng battleData như trước)
    window.battleData = [];
    const dataItems = document.querySelectorAll('.map-data-item');
    
    dataItems.forEach(item => {
        window.battleData.push({
            lat: parseFloat(item.getAttribute('data-lat')),
            lng: parseFloat(item.getAttribute('data-lng')),
            vid: item.getAttribute('data-vid'), // Lấy link video
            detailImg: item.getAttribute('data-detail-img'),
            title: item.querySelector('.data-title').innerHTML,
            desc: item.querySelector('.data-desc').innerHTML,
            detailText: item.querySelector('.data-detail-text').innerHTML
        });
    });

    // 2. KHỞI TẠO BẢN ĐỒ (MỞ KHÓA TƯƠNG TÁC - Giữ nguyên code của bạn)
    const map = L.map('vnMap', {
        zoomControl: false,       
        scrollWheelZoom: false,   
        dragging: true,           
        doubleClickZoom: true,    
        touchZoom: true           
    }).setView([16.047, 108.206], 6); 

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

   // THAY BẰNG BẢN ĐỒ GOOGLE MAPS (Chuẩn chủ quyền Việt Nam)
    L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=vi&gl=VN', {
        attribution: '&copy; Google Maps',
        keepBuffer: 30,           
        updateWhenZooming: false, 
        updateWhenIdle: true
    }).addTo(map);

    const markers = []; 

    // 3. Bơm dữ liệu vào bản đồ (Đổi img thành video, gắn sự kiện onclick)
 // 3. Bơm dữ liệu vào bản đồ
  window.battleData.forEach((battle, index) => {
        const htmlContent = `
            <div class="event-wrapper" id="map-step-${index}">
                <div class="pulse-dot"></div>
                <div class="line-diag"></div>
                <div class="line-horiz"></div>
                <div class="event-content">
                    
                    <!-- BỌC IFRAME VÀO HỘP KÍNH (MASK) ĐỂ CẮT VIỀN -->
                    <div class="video-mask">
                        <iframe data-src="${battle.vid}" class="preview-video" frameborder="0" allow="autoplay; fullscreen" tabindex="-1"></iframe>
                    </div>

                    <h3>${battle.title}</h3>
                    <p>${battle.desc}</p>
                    <button class="map-btn explore-btn" onclick="openBattleModal(${index})">Khám phá</button>
                </div>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-leaflet-icon',
            html: htmlContent,
            iconSize: [0, 0], 
            iconAnchor: [0, 0] 
        });

        const marker = L.marker([battle.lat, battle.lng], { icon: customIcon }).addTo(map);
        markers.push(`map-step-${index}`);
    });


    // =========================================================================
    // 4. XỬ LÝ THAO TÁC SCROLLYTELLING (FIX LỖI TRÔI TRANG Ở BƯỚC CUỐI CÙNG)
    // =========================================================================
   // =========================================================================
    // 4. XỬ LÝ THAO TÁC SCROLLYTELLING (STICKY SCROLL - BẢN FIX MƯỢT MÀ)
    // =========================================================================
    const timeNodes = document.querySelectorAll('.time-node');
    const s5Wrapper = document.getElementById('section5-wrapper');
    const s5Sticky = document.getElementById('section5');
    
    let lastStepIndex = -1; 
    let cameraTimer; 
    let contentTimer;

    window.addEventListener('scroll', () => {
        if (!s5Wrapper || !s5Sticky) return;

        const rect = s5Wrapper.getBoundingClientRect();
        // Quãng đường có thể cuộn = Tổng độ cao wrapper (500vh) - chiều cao 1 màn hình
        const scrollDistance = s5Wrapper.offsetHeight - window.innerHeight;

        // Nếu bản đồ đã chạm mép trên màn hình và đang được ghim
        if (rect.top <= 0 && rect.top >= -scrollDistance) {
            
            s5Sticky.classList.add('is-in-view'); // Kích hoạt làm tối nền bản đồ

            // Tính tỷ lệ cuộn từ 0.0 đến 1.0
            const progress = Math.abs(rect.top) / scrollDistance;

            // Chia 500vh làm 5 chặng (1 chặng nhìn toàn cảnh, 4 chặng cho 4 trận đánh)
            let currentStep = -1; // Mặc định: Nhìn toàn cảnh
            if (progress > 0.05 && progress <= 0.25) currentStep = 0; // Trận 1
            else if (progress > 0.25 && progress <= 0.50) currentStep = 1; // Trận 2
            else if (progress > 0.50 && progress <= 0.75) currentStep = 2; // Trận 3
            else if (progress > 0.75) currentStep = 3; // Trận 4

            // CHỈ GỌI LEAFLET BAY ĐI KHI CHUYỂN SANG TRẬN KHÁC (Chống giật lag)
            if (currentStep !== lastStepIndex) {
                lastStepIndex = currentStep;
                
                if (currentStep === -1) {
                    resetToOverview();
                } else {
                    runKichBan(currentStep);
                }
            }
        } else if (rect.top > 0) {
            s5Sticky.classList.remove('is-in-view');
            if (lastStepIndex !== -1) {
                lastStepIndex = -1;
                resetToOverview();
            }
        }
    });


    function resetToOverview() {
        clearTimeout(cameraTimer);
        clearTimeout(contentTimer);

        // Tắt hết popup và Dọn dẹp link video
        markers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
                const iframe = el.querySelector('iframe');
                // Dùng removeAttribute thay vì set rỗng
                if (iframe) iframe.removeAttribute('src'); 
            }
        });
        timeNodes.forEach(t => t.classList.remove('active'));

        map.flyTo([16.047, 108.206], 5.5, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    }

   // HÀM: ĐÁP MÁY QUAY XUỐNG TRẬN ĐÁNH VÀ ÉP CHẠY VIDEO
    function runKichBan(currentStep) {
        clearTimeout(cameraTimer);
        clearTimeout(contentTimer);

        // Tắt nội dung cũ & Dừng video cũ
        markers.forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
                const iframe = el.querySelector('iframe');
                if (iframe && index !== currentStep) {
                    iframe.removeAttribute('src'); // Hủy link cũ
                }
            }
        });
        
        // Bật mốc thời gian
        timeNodes.forEach(t => t.classList.remove('active'));
        if (timeNodes[currentStep]) timeNodes[currentStep].classList.add('active');

        // ÉP BAY TỚI TỌA ĐỘ
        cameraTimer = setTimeout(() => {
            const targetLat = window.battleData[currentStep].lat + 0.8; 
            const targetLng = window.battleData[currentStep].lng + 0.6; 
            
            map.flyTo([targetLat, targetLng], 8.3, { animate: true, duration: 1.5, easeLinearity: 0.25 });

            // BẬT POPUP VÀ ÉP PHÁT YOUTUBE
            contentTimer = setTimeout(() => {
                const currentEl = document.getElementById(markers[currentStep]);
                if (currentEl) {
                    currentEl.classList.add('active');
                    
                    const activeIframe = currentEl.querySelector('iframe');
                    // KIỂM TRA CHUẨN XÁC: Nếu chưa có thuộc tính src thì mới bơm link vào
                    if (activeIframe && !activeIframe.hasAttribute('src')) {
                        activeIframe.setAttribute('src', activeIframe.getAttribute('data-src'));
                    }
                }
            }, 1400); 

        }, 100); 
    }
    // 5. OBSERVER (Giữ nguyên của bạn)
    const mapObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in-view');
            }
        });
    }, { threshold: 0.1 });
    mapObserver.observe(section5);
});

// ==========================================
// ĐIỀU KHIỂN SLIDER PHẦN 1
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('section1');
    if(!heroSection) return;

    const prevBtn = heroSection.querySelector('.prev-btn');
    const nextBtn = heroSection.querySelector('.next-btn');
    const dashes = heroSection.querySelectorAll('.dash');
    
    let isSlide2 = false;

    function toggleHeroSlide() {
        isSlide2 = !isSlide2;
        
        // Thêm/Xóa class để kích hoạt CSS bay lượn
        if(isSlide2) {
            heroSection.classList.add('show-slide-2');
            dashes[0].classList.remove('active');
            dashes[1].classList.add('active');
        } else {
            heroSection.classList.remove('show-slide-2');
            dashes[1].classList.remove('active');
            dashes[0].classList.add('active');
        }
    }

    // Gắn sự kiện cho 2 nút trái/phải
    nextBtn.addEventListener('click', toggleHeroSlide);
    prevBtn.addEventListener('click', toggleHeroSlide);

    // Gắn sự kiện cho 2 vạch gạch ngang
    dashes[0].addEventListener('click', () => { if(isSlide2) toggleHeroSlide(); });
    dashes[1].addEventListener('click', () => { if(!isSlide2) toggleHeroSlide(); });
});
// ==========================================
// ==========================================
// ĐIỀU KHIỂN HERO SECTION: 3 SLIDE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tìm khu vực Phần 1
    const heroSection = document.getElementById('section1');
    if(!heroSection) return; // Nếu không có thì dừng lại ngay để không lỗi

    // 2. Khai báo các nút bấm và trạng thái
    let currentSlide = 1;
    const totalSlides = 3;
    const mainDashes = heroSection.querySelectorAll('.dash');
    const mainNextBtn = heroSection.querySelector('.next-btn');
    const mainPrevBtn = heroSection.querySelector('.prev-btn');

    // 3. Hàm xử lý chuyển Slide đa năng
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;

        // Xóa tất cả các class show-slide cũ trước khi thêm mới
        heroSection.classList.remove('show-slide-2', 'show-slide-3');

        // Bật class tương ứng với slide hiện tại
        if(currentSlide === 2) heroSection.classList.add('show-slide-2');
        if(currentSlide === 3) heroSection.classList.add('show-slide-3');

        // Cập nhật vạch Dash (Sáng/tối)
        mainDashes.forEach(dash => dash.classList.remove('active'));
        mainDashes[currentSlide - 1].classList.add('active');
    }

    // 4. Bắt sự kiện click cho Nút Tới (Next)
    mainNextBtn.addEventListener('click', () => {
        let next = currentSlide < totalSlides ? currentSlide + 1 : 1;
        goToSlide(next);
    });

    // 5. Bắt sự kiện click cho Nút Lùi (Prev)
    mainPrevBtn.addEventListener('click', () => {
        let prev = currentSlide > 1 ? currentSlide - 1 : totalSlides;
        goToSlide(prev);
    });

    // 6. Cho phép bấm trực tiếp vào các vạch ngang
    mainDashes.forEach((dash, index) => {
        dash.addEventListener('click', () => { 
            goToSlide(index + 1); 
        });
    });
});
// 1. HÀM THẢ TOAST VÀ VẬT LÝ VUỐT
window.showAuthGateToast = function() {
    const toast = document.getElementById('authGateToast');
    const overlay = document.getElementById('agtOverlay');
    const closeBtn = document.getElementById('agtCloseBtn');
    
    if (!toast || !overlay) return;
    
    toast.classList.add('show'); overlay.classList.add('show');
    
    const closeAuthToast = () => {
        toast.classList.remove('show'); overlay.classList.remove('show');
        setTimeout(() => { toast.style.transform = ''; }, 400); 
    };

    overlay.onclick = closeAuthToast;
    if (closeBtn) closeBtn.onclick = closeAuthToast;

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
            toast.classList.remove('show'); overlay.classList.remove('show'); 
            toast.style.transform = `translateX(calc(-50% + ${currentX - startX}px)) translateY(${diffY - 100}px) scale(0.9)`;
            setTimeout(() => { toast.style.transform = ''; }, 400); 
        } else { toast.style.transform = ''; }
    };

    toast.addEventListener('mousedown', onDragStart); window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
    toast.addEventListener('touchstart', onDragStart, {passive: true}); window.addEventListener('touchmove', onDragMove, {passive: true}); window.addEventListener('touchend', onDragEnd);
};

// 2. RADAR ĐÁNH CHẶN MENU
document.addEventListener('DOMContentLoaded', () => {
    const vipFeatures = document.querySelectorAll('.locked-feature');

    vipFeatures.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault(); 
            
            const destinationUrl = this.getAttribute('href');
            const userSession = localStorage.getItem('temporia_user');

            if (!userSession) {
                if (typeof showAuthGateToast === "function") showAuthGateToast();
            } else {
                if (!destinationUrl || destinationUrl === '#' || destinationUrl.startsWith('#')) {
                    alert("Tính năng này đang được Temporia hoàn thiện, bạn quay lại sau nhé!");
                } else {
                    document.body.style.transition = "opacity 0.3s ease";
                    document.body.style.opacity = "0";
                    setTimeout(() => { window.location.href = destinationUrl; }, 300);
                }
            }
        });
    });
});
/* ========================================================================= */
/* RADAR ĐÁNH CHẶN THANH MENU VIP (SƠ ĐỒ & PODCAST)                          */
/* ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Tìm tất cả các nút bấm được gắn nhãn VIP
    const vipFeatures = document.querySelectorAll('.locked-feature');

    vipFeatures.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault(); // Phanh gấp, không cho nhảy trang
            
            const destinationUrl = this.getAttribute('href');
            const userSession = localStorage.getItem('temporia_user');

            if (!userSession) {
                // KỊCH BẢN 1: KẺ ĐỘT NHẬP -> Thả thẻ Toast Apple xuống chặn lại
                if (typeof showAuthGateToast === "function") {
                    showAuthGateToast();
                }
            } else {
                // KỊCH BẢN 2: NGƯỜI NHÀ (Đã đăng nhập)
                if (!destinationUrl || destinationUrl === '#' || destinationUrl.startsWith('#')) {
                    // Nếu link đang rỗng (chưa làm xong trang) -> Hiện thông báo hệ thống
                    alert("Tính năng này đang được Temporia hoàn thiện, bạn quay lại sau nhé!");
                } else {
                    // Nếu link hợp lệ -> Chuyển trang với hiệu ứng tan biến mờ ảo
                    document.body.style.transition = "opacity 0.3s ease";
                    document.body.style.opacity = "0";
                    setTimeout(() => { window.location.href = destinationUrl; }, 300);
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // HỆ THỐNG MENU TÀI KHOẢN THÔNG MINH (Áp dụng toàn trang)
    // =========================================================================
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    
    // Kiểm tra xem có thẻ định danh không
    const token = localStorage.getItem('temporia_token');
    const userDataRaw = localStorage.getItem('temporia_user');
    
    if (token && userDataRaw) {
        const user = JSON.parse(userDataRaw);
        
        // Ẩn nút Đăng nhập/Đăng ký
        if(guestMenu) guestMenu.classList.add('hidden');
        
        // Hiện khung Avatar
        if(userMenu) {
            userMenu.classList.remove('hidden');
            
            // Lấy tên đầu tiên để hiển thị cho gọn (Tùy chọn)
            const fullName = user.full_name || 'Người dùng';
            const shortName = fullName.split(" ").slice(-2).join(" "); // Lấy 2 chữ cuối của tên
            document.getElementById('navUserName').innerText = shortName;
            
            // Icon Avatar Xám mặc định
            const defaultAvatar = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3e%3cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3e%3c/svg%3e";
            
            document.getElementById('navAvatar').src = user.avatar_url || defaultAvatar;
        }
    } else {
        // Chưa đăng nhập -> Hiện nút Đăng nhập/Đăng ký
        if(guestMenu) guestMenu.classList.remove('hidden');
        if(userMenu) userMenu.classList.add('hidden');
    }

    // Xử lý nút Đăng xuất từ Navbar
    const navBtnLogout = document.getElementById('navBtnLogout');
    if (navBtnLogout) {
        navBtnLogout.addEventListener('click', () => {
            localStorage.removeItem('temporia_token');
            localStorage.removeItem('temporia_user');
            window.location.href = 'index.html'; // Đá văng ra trang bìa
        });
    }
});
