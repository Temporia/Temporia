/* ========================================================================= */
/* JS TRANG AUTH - TÍCH HỢP ĐẦY ĐỦ 5 LUỒNG & THÔNG BÁO TOAST APPLE-STYLE     */
/* ========================================================================= */

window.switchAuthTab = function(targetMode, isInitialLoad = false) {
    const forms = {
        login: document.getElementById('formLogin'),
        register: document.getElementById('formRegister'),
        verifyReg: document.getElementById('formVerifyReg'),
        forgot: document.getElementById('formForgot'),
        reset: document.getElementById('formReset')
    };

    const badge = document.getElementById('authBadge');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const navAuthBox = document.querySelector('.nav-auth');

    if (!isInitialLoad) history.pushState(null, null, `#${targetMode}`);

    const homeLink = document.querySelector('.nav-menu li a[href*="trang-chu"]');
    if (homeLink) homeLink.classList.remove('active');

    const updateStaticContent = () => {
        if (targetMode === 'register') {
            if (badge) badge.innerText = "Tham gia sảnh đường";
            if (title) title.innerText = "Khởi Tạo Tài Khoản";
            if (subtitle) subtitle.innerText = "Thiết lập định danh để lưu trữ thành tích sử học";
            if (navAuthBox) navAuthBox.classList.add('slide-active');
        } else if (targetMode === 'verifyReg') {
            if (badge) badge.innerText = "Bảo mật";
            if (title) title.innerText = "Xác Thực Email";
            if (subtitle) subtitle.innerText = "Vui lòng nhập mã OTP để kích hoạt tài khoản";
            if (navAuthBox) navAuthBox.classList.add('slide-active');
        } else if (targetMode === 'forgot') {
            if (badge) badge.innerText = "Hỗ trợ";
            if (title) title.innerText = "Khôi Phục Mật Khẩu";
            if (subtitle) subtitle.innerText = "Hệ thống sẽ gửi mã xác thực về email của bạn";
            if (navAuthBox) navAuthBox.classList.remove('slide-active');
        } else if (targetMode === 'reset') {
            if (badge) badge.innerText = "Bảo mật";
            if (title) title.innerText = "Mật Khẩu Mới";
            if (subtitle) subtitle.innerText = "Nhập mã OTP từ email và thiết lập mật khẩu mới";
            if (navAuthBox) navAuthBox.classList.remove('slide-active');
        } else {
            if (badge) badge.innerText = "Cổng kết nối";
            if (title) title.innerText = "Đăng Nhập";
            if (subtitle) subtitle.innerText = "Truy cập dữ liệu cá nhân và tiếp tục hành trình";
            if (navAuthBox) navAuthBox.classList.remove('slide-active');
        }
    };

    let activeForm = null;
    for (const key in forms) {
        if (forms[key] && !forms[key].classList.contains('hidden')) {
            activeForm = forms[key]; break;
        }
    }

    const formToShow = forms[targetMode];
    if (!formToShow) return;

    if (isInitialLoad) {
        if (activeForm) activeForm.classList.add('hidden');
        formToShow.classList.remove('hidden');
        updateStaticContent(); return;
    }

    if (activeForm && activeForm !== formToShow) {
        activeForm.classList.add('form-fade');
        setTimeout(() => {
            activeForm.classList.add('hidden');
            activeForm.classList.remove('form-fade');
            updateStaticContent();
            formToShow.classList.remove('hidden');
            formToShow.classList.add('form-fade');
            void formToShow.offsetWidth; 
            formToShow.classList.remove('form-fade');
        }, 250);
    } else if (!activeForm) {
        formToShow.classList.remove('hidden');
        updateStaticContent();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const initialMode = window.location.hash.replace('#', '') || 'login';
    const navAuthBox = document.querySelector('.nav-auth');
    switchAuthTab(initialMode, true);
    setTimeout(() => { if (navAuthBox) navAuthBox.classList.add('animation-ready'); }, 50);

    const API_BASE_URL = 'https://temporia-api.onrender.com/api';
    
    // Biến lưu tạm email để qua form OTP dùng
    let currentRegEmail = ""; 
    let recoveryEmail = ""; 

    // 1. ĐĂNG KÝ
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formRegister.querySelector('.auth-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Đang gửi OTP..."; submitBtn.disabled = true;

            const payload = {
                full_name: document.getElementById('regFullname').value.trim(),
                dob: document.getElementById('regDob').value,
                hometown: document.getElementById('regHometown').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                password: document.getElementById('regPassword').value
            };

            try {
                const res = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (res.ok) {
                    currentRegEmail = payload.email; 
                    showToast("Đăng ký thành công! Vui lòng kiểm tra email.", "success");
                    switchAuthTab('verifyReg'); 
                } else {
                    showToast("Lỗi: " + (data.error || "Không thể đăng ký"), "error");
                }
            } catch (err) { 
                showToast("Không thể kết nối Máy chủ Solvia.", "error"); 
            } 
            finally { submitBtn.innerText = originalText; submitBtn.disabled = false; }
        });
    }

    // 2. XÁC THỰC OTP ĐĂNG KÝ
    const formVerifyReg = document.getElementById('formVerifyReg');
    if (formVerifyReg) {
        formVerifyReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formVerifyReg.querySelector('.auth-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Đang xác thực..."; submitBtn.disabled = true;

            const otp_code = document.getElementById('regOtpInput').value.trim();

            try {
                const res = await fetch(`${API_BASE_URL}/verify-otp`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentRegEmail, otp_code })
                });
                const data = await res.json();
                
                if (res.ok) {
                    showToast("Kích hoạt thành công! Mời bạn đăng nhập.", "success");
                    formRegister.reset(); formVerifyReg.reset();
                    switchAuthTab('login'); 
                } else {
                    showToast("Lỗi: " + (data.error || "Mã OTP không đúng."), "error");
                }
            } catch (err) { 
                showToast("Lỗi kết nối máy chủ!", "error"); 
            } 
            finally { submitBtn.innerText = originalText; submitBtn.disabled = false; }
        });
    }

    // 3. ĐĂNG NHẬP
    // 3. ĐĂNG NHẬP
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formLogin.querySelector('.auth-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Đang xác thực mã định danh..."; 
            submitBtn.disabled = true;

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                // Đón dữ liệu từ Python trả về (Biến tên là "data")
                const data = await res.json(); 
                
                if (res.ok) {
                    showToast("Đăng nhập thành công!", "success");
                    
                    // ĐÃ FIX LỖI: Sửa "result" thành "data"
                    localStorage.setItem('temporia_user', JSON.stringify(data.user));
                    localStorage.setItem('temporia_token', data.user.email);
                    
                    setTimeout(() => { window.location.href = 'trang-chu.html'; }, 800);
                } else {
                    showToast("Đăng nhập thất bại: " + (data.error || "Sai thông tin"), "error");
                }
            } catch (err) { 
                showToast("Lỗi kết nối máy chủ xác thực.", "error"); 
                console.error("Lỗi Đăng nhập:", err);
            } 
            finally { 
                submitBtn.innerText = originalText; 
                submitBtn.disabled = false; 
            }
        });
    }

    // 4. GỬI MÃ QUÊN MẬT KHẨU
    const formForgot = document.getElementById('formForgot');
    if (formForgot) {
        formForgot.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formForgot.querySelector('.auth-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Đang Gửi mã..."; submitBtn.disabled = true;

            const email = document.getElementById('forgotEmail').value.trim();

            try {
                const res = await fetch(`${API_BASE_URL}/forgot-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                
                if (res.ok) {
                    recoveryEmail = email; 
                    showToast("Mã OTP đã được gửi đến email của bạn!", "info");
                    switchAuthTab('reset'); 
                } else {
                    showToast("Lỗi: " + (data.error || "Không thể gửi mã."), "error");
                }
            } catch (err) { 
                showToast("Lỗi kết nối máy chủ!", "error"); 
            } 
            finally { submitBtn.innerText = originalText; submitBtn.disabled = false; }
        });
    }

    // 5. ĐỔI MẬT KHẨU MỚI
    const formReset = document.getElementById('formReset');
    if (formReset) {
        formReset.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formReset.querySelector('.auth-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Đang cập nhật..."; submitBtn.disabled = true;

            const otp_code = document.getElementById('resetOtp').value.trim();
            const new_password = document.getElementById('resetPassword').value;

            try {
                const res = await fetch(`${API_BASE_URL}/reset-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: recoveryEmail, otp_code, new_password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
                    formReset.reset(); formForgot.reset();
                    switchAuthTab('login'); 
                } else {
                    showToast("Lỗi: " + (data.error || "Mã OTP không đúng."), "error");
                }
            } catch (err) { 
                showToast("Lỗi kết nối máy chủ!", "error"); 
            } 
            finally { submitBtn.innerText = originalText; submitBtn.disabled = false; }
        });
    }
});