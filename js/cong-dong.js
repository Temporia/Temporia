/* ========================================================================= */
/* CỘNG ĐỒNG JS - HỆ SINH THÁI TƯƠNG TÁC (ĐỒNG BỘ DỮ LIỆU THẬT & API)        */
/* ========================================================================= */

const API_BASE_URL = 'https://temporia-api.onrender.com/api';
const defaultAvatar = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23cbd5e1%22%3e%3cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z%22/%3e%3c/svg%3e";
/* ========================================================================= */
/* HỘP THOẠI XÁC NHẬN CUSTOM (DÙNG CHO XÓA BÀI)                              */
/* ========================================================================= */
window.showConfirm = function(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; backdrop-filter: blur(5px);';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background: #fff; padding: 24px; border-radius: 20px; width: 320px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); transform: scale(0.9); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); text-align: center;';
    
    modal.innerHTML = `
        <div style="font-size: 3rem; color: #dc2626; margin-bottom: 10px;"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 style="margin: 0 0 10px; font-size: 1.1rem; color: #1d1d1f;">Xác nhận</h3>
        <p style="margin: 0 0 20px; color: #86868b; font-size: 0.95rem; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 10px;">
            <button id="btn-cancel-confirm" style="flex: 1; padding: 10px; border-radius: 12px; border: none; background: #f2f2f7; color: #1d1d1f; font-weight: 600; cursor: pointer;">Hủy</button>
            <button id="btn-ok-confirm" style="flex: 1; padding: 10px; border-radius: 12px; border: none; background: #dc2626; color: #fff; font-weight: 600; cursor: pointer;">Xóa</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'scale(1)'; }, 10);

    const close = () => {
        overlay.style.opacity = '0'; modal.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('btn-cancel-confirm').onclick = close;
    document.getElementById('btn-ok-confirm').onclick = () => { close(); onConfirm(); };
};

/* ========================================================================= */
/* KHỞI TẠO DỮ LIỆU & GIAO DIỆN CHÍNH                                        */
/* ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    let currentUser = {
        id: null,
        name: "Nhà thám hiểm",
        avatar: defaultAvatar,
        badges: 0, streak: 0, rank: "Tập Sự", progressPercent: 0
    };

    const userDataRaw = localStorage.getItem('temporia_user');
    if (userDataRaw) {
        const parsedUser = JSON.parse(userDataRaw);
        currentUser.id = parsedUser.id; 
        currentUser.name = parsedUser.full_name || currentUser.name;
        currentUser.avatar = parsedUser.avatar_url || defaultAvatar;
        currentUser.badges = parseInt(parsedUser.badges_count) || 0;
        currentUser.streak = parseInt(parsedUser.streak_count) || 0;
        currentUser.rank = parsedUser.rank_name || "Tập Sự";
        currentUser.progressPercent = Math.min(((currentUser.badges * 50 + currentUser.streak * 10) / 2000) * 100, 100);
    }

    const createName = document.getElementById('createPostName');
    const createAvatar = document.getElementById('createPostAvatar');
    if (createName) createName.innerText = currentUser.name;
    if (createAvatar) createAvatar.src = currentUser.avatar;

    const imageUpload = document.getElementById("imageUpload");
    const fileUpload = document.getElementById("fileUpload");
    const previewArea = document.getElementById("previewArea");
    const publishBtn = document.getElementById("publishBtn");
    const postInput = document.getElementById("postInput");

    let uploadedImage = null; let uploadedFile = null;

    postInput.addEventListener("input", function () {
        this.style.height = "auto"; this.style.height = this.scrollHeight + "px";
    });

    function compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.8)); 
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }

    imageUpload.addEventListener("change", function () {
        const file = this.files[0]; if (!file) return;
        compressImage(file, (compressedBase64) => { uploadedImage = compressedBase64; renderPreview(); });
    });

    fileUpload.addEventListener("change", function () {
        const file = this.files[0]; if (!file) return;
        uploadedFile = file.name; renderPreview();
    });

    function renderPreview() {
        previewArea.innerHTML = "";
        if (uploadedImage) previewArea.innerHTML += `<img src="${uploadedImage}" class="preview-image">`;
        if (uploadedFile) previewArea.innerHTML += `<div class="file-preview"><i class="fas fa-paperclip"></i> ${uploadedFile}</div>`;
    }

    function timeAgo(dateString) {
        const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const postDate = new Date(safeDateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return 'Vừa xong';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} ngày trước`;
        return `${postDate.getDate().toString().padStart(2, '0')}/${(postDate.getMonth()+1).toString().padStart(2, '0')}/${postDate.getFullYear()}`;
    }

    window.loadPosts = async function() {
        try {
            const token = localStorage.getItem('temporia_token') || "";
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.status === "success") {
                const feedContainer = document.querySelector(".feed-container");
                const createPostCard = document.querySelector('.create-post-card');
                
                document.querySelectorAll('.dynamic-post').forEach(p => p.remove());
                let referenceNode = createPostCard.nextSibling;

                data.posts.forEach(post => {
                    const postEl = document.createElement("article");
                    postEl.className = "post-card premium-card dynamic-post"; 
                    const pId = post.post_id; 
                    const authorId = post.author_id; // ĐỂ MỞ TRANG CÁ NHÂN
                    
                    const avatar = post.avatar_url || defaultAvatar;
                    const badges = post.badges_count || 0;
                    const streak = post.streak_count || 0;
                    const rank = post.rank_name || "Tập Sự";
                    const progress = Math.min(((badges * 50 + streak * 10) / 2000) * 100, 100);
                    const timeString = timeAgo(post.created_at);

                    const heartClass = post.is_liked ? "fas liked text-red" : "far";
                    const btnLikeClass = post.is_liked ? "action-btn btn-like liked" : "action-btn btn-like";

                    let commentsHTML = "";
                    if(post.comments && post.comments.length > 0) {
                        post.comments.forEach(c => {
                            commentsHTML += `
                            <div class="comment-item" style="display: flex; gap: 10px; margin-top: 10px;">
                                <img src="${c.avatar_url || defaultAvatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                                <div style="background: #f2f2f7; padding: 8px 12px; border-radius: 12px; font-size: 0.9rem; max-width: 85%;">
                                    <strong style="color: #1d1d1f;">${c.full_name}</strong><br>
                                    <span style="color: #3f3f46; display: block; word-break: break-word; white-space: pre-wrap;">${c.content}</span>
                                </div>
                            </div>`;
                        });
                    }

                    let optionsMenuHTML = "";
                    if (currentUser.id === post.author_id || currentUser.name === post.full_name) {
                        optionsMenuHTML = `
                            <div class="post-options-dropdown" style="position: relative; margin-left: auto;">
                                <button onclick="togglePostOptions(${pId})" style="background:none; border:none; color:#86868b; cursor:pointer; font-size:1.2rem; padding: 5px;">
                                    <i class="fas fa-ellipsis-h"></i>
                                </button>
                                <div id="post-options-${pId}" style="display:none; position:absolute; right:0; top:100%; background:#fff; box-shadow:0 5px 15px rgba(0,0,0,0.1); border-radius:12px; z-index:10; min-width: 140px; border: 1px solid #f2f2f7;">
                                    <button onclick="deletePostAPI(${pId})" style="width:100%; text-align:left; padding:12px 16px; background:none; border:none; color:#dc2626; cursor:pointer; font-weight:600; transition:0.2s; border-radius:12px;">
                                        <i class="fas fa-trash-alt" style="margin-right:8px;"></i> Xóa bài
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    // TÍCH HỢP ONCLICK MỞ TRANG CÁ NHÂN VÀO AVATAR VÀ TÊN
                    postEl.innerHTML = `
                        <div class="premium-header">
                            <div class="premium-avatar-wrap" onclick="openProfileModal(${authorId})" style="cursor:pointer;">
                                <img src="${avatar}" class="premium-avatar" alt="Avatar">
                            </div>
                            <div class="premium-user-info" style="width: 100%;">
                                <div class="user-top-row" style="display: flex; align-items: center;">
                                    <h4 class="user-name" onclick="openProfileModal(${authorId})" style="cursor:pointer;">${post.full_name} <i class="fas fa-circle-check verified-badge"></i></h4>
                                    <span class="post-date" style="margin-left: 10px;"><i class="far fa-clock"></i> ${timeString}</span>
                                    ${optionsMenuHTML}
                                </div>
                                <div class="user-stats-row">
                                    <span class="stat-item"><i class="fas fa-medal text-red"></i> ${badges}/200 Huy hiệu</span>
                                    <span class="stat-item"><i class="fas fa-fire text-red"></i> Chuỗi ${streak} ngày</span>
                                </div>
                                <div class="user-progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%;"></div>
                                </div>
                            </div>
                        </div>

                        <div class="rank-badge-container">
                            <span class="rank-badge legend-badge"><i class="fas fa-trophy"></i> ${rank}</span>
                        </div>

                        <div class="post-body">
                            ${post.content ? `<p class="post-text" style="word-break: break-word; white-space: pre-wrap;">${post.content}</p>` : ""}
                            ${post.image_url ? `<img class="post-image" src="${post.image_url}">` : ""}
                            ${post.file_url ? `<div class="file-preview"><i class="fas fa-paperclip"></i> ${post.file_url}</div>` : ""}
                        </div>

                        <div class="post-actions-full">
                            <button class="${btnLikeClass}" onclick="toggleLikeAPI(this, ${pId})">
                                <i class="fa-heart heart-icon ${heartClass}"></i> <span class="like-count">${post.likes_count}</span>
                            </button>
                            <button class="action-btn btn-comment" onclick="toggleComments('comments-${pId}')">
                                <i class="far fa-comment"></i> <span id="comment-count-${pId}">${post.comments_count}</span>
                            </button>
                            <div class="share-wrapper">
                                <button class="action-btn btn-share" onclick="toggleShare('share-${pId}')">
                                    <i class="fas fa-share"></i> <span>Chia sẻ</span>
                                </button>
                                <div class="share-dropdown" id="share-${pId}">
                                    <button><i class="fas fa-link"></i> Sao chép liên kết</button>
                                </div>
                            </div>
                        </div>

                        <div class="comments-section" id="comments-${pId}">
                            <div class="comment-list" id="comment-list-${pId}" style="margin-bottom: 15px;">${commentsHTML}</div>
                            <div class="comment-input-box">
                                <img src="${currentUser.avatar}" class="comment-avatar">
                                <input type="text" placeholder="Viết bình luận của bạn..." id="input-cmt-${pId}" class="comment-input" onkeypress="if(event.key === 'Enter') sendCommentAPI(${pId}, this)">
                                <button class="btn-send-comment" onclick="sendCommentAPI(${pId}, this)"><i class="fas fa-paper-plane"></i></button>
                            </div>
                        </div>
                    `;
                    feedContainer.insertBefore(postEl, referenceNode);
                });
            }
        } catch (error) { console.error("Lỗi tải bài viết:", error); }
    }

    loadPosts();

    publishBtn.addEventListener("click", async function () {
        const text = postInput.value.trim();
        const token = localStorage.getItem('temporia_token');

        if (!token) { 
            if(typeof showToast === 'function') showToast("Vui lòng đăng nhập để đăng bài!", "error");
            setTimeout(() => window.location.href = "auth.html#login", 1500); return; 
        }
        if (!text && !uploadedImage && !uploadedFile) { 
            if(typeof showToast === 'function') showToast("Vui lòng nhập nội dung hoặc đính kèm ảnh!", "error");
            return; 
        }

        const originalText = publishBtn.innerText;
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải lên...';
        publishBtn.disabled = true;

        const postData = { content: text, image_url: uploadedImage || null, file_url: uploadedFile ? `Tệp: ${uploadedFile}` : null };

        try {
            const res = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(postData)
            });
            if (!res.ok) throw new Error("Lỗi máy chủ");
            
            if(typeof showToast === 'function') showToast("Đăng bài thành công!", "success");
            await window.loadPosts(); 
            postInput.value = ""; postInput.style.height = "auto";
            uploadedImage = null; uploadedFile = null; previewArea.innerHTML = "";
            imageUpload.value = ""; fileUpload.value = "";
        } catch (error) { 
            if(typeof showToast === 'function') showToast("Lỗi kết nối khi đăng bài!", "error");
        } finally { 
            publishBtn.innerText = originalText; publishBtn.disabled = false; 
        }
    });
});

/* ========================================================================= */
/* TRANG CÁ NHÂN (PROFILE MODAL) & HỆ THỐNG KẾT BẠN                          */
/* ========================================================================= */

// Khởi tạo HTML cho Modal nếu chưa có
function createProfileModalElement() {
    if(document.getElementById('solviaProfileModal')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'solviaProfileModal';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.3s; backdrop-filter: blur(5px); padding: 20px;';
    
    // Khung giao diện Profile
    overlay.innerHTML = `
        <div style="background: #fff; width: 100%; max-width: 500px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); transform: translateY(20px); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);" id="profileModalContent">
            
            <div style="height: 120px; background: linear-gradient(135deg, #d97706, #f59e0b); position: relative;">
                <button onclick="closeProfileModal()" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.3); border: none; width: 32px; height: 32px; border-radius: 50%; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="padding: 0 20px 20px; text-align: center; margin-top: -50px;">
                <img id="pm-avatar" src="${defaultAvatar}" style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                
                <h2 id="pm-name" style="margin: 10px 0 5px; font-size: 1.4rem; color: #1d1d1f;">Tên Người Dùng <i class="fas fa-circle-check" style="color:#2563eb; font-size: 1rem;"></i></h2>
                <p id="pm-rank" style="margin: 0; color: #d97706; font-weight: 600; font-size: 0.9rem;"><i class="fas fa-trophy"></i> Hạng Tập Sự</p>
                <p id="pm-bio" style="margin: 10px 0 15px; color: #86868b; font-size: 0.95rem; line-height: 1.4;"></p>

                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; background: #f2f2f7; padding: 15px; border-radius: 16px;">
                    <div style="text-align: center;">
                        <div id="pm-posts" style="font-size: 1.2rem; font-weight: 700; color: #1d1d1f;">0</div>
                        <div style="font-size: 0.8rem; color: #86868b; text-transform: uppercase;">Bài viết</div>
                    </div>
                    <div style="width: 1px; background: #d1d1d6;"></div>
                    <div style="text-align: center;">
                        <div id="pm-friends" style="font-size: 1.2rem; font-weight: 700; color: #1d1d1f;">0</div>
                        <div style="font-size: 0.8rem; color: #86868b; text-transform: uppercase;">Bạn bè</div>
                    </div>
                    <div style="width: 1px; background: #d1d1d6;"></div>
                    <div style="text-align: center;">
                        <div id="pm-likes" style="font-size: 1.2rem; font-weight: 700; color: #1d1d1f;">0</div>
                        <div style="font-size: 0.8rem; color: #86868b; text-transform: uppercase;">Lượt tim</div>
                    </div>
                </div>

                <div id="pm-action-buttons" style="display: flex; gap: 10px;">
                    </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Đóng khi click bên ngoài khung
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeProfileModal();
    });
}

window.openProfileModal = async function(targetUserId) {
    createProfileModalElement();
    const modal = document.getElementById('solviaProfileModal');
    const content = document.getElementById('profileModalContent');
    const token = localStorage.getItem('temporia_token');
    
    if(!token) return showToast("Vui lòng đăng nhập để xem hồ sơ!", "error");

    try {
        // Gọi API lấy thông tin
        const response = await fetch(`${API_BASE_URL}/users/${targetUserId}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if(!response.ok) throw new Error("Không tìm thấy người dùng");

        const p = data.profile;

        // Đổ dữ liệu vào Modal
        document.getElementById('pm-avatar').src = p.avatar_url || defaultAvatar;
        document.getElementById('pm-name').innerHTML = `${p.full_name} <i class="fas fa-circle-check" style="color:#2563eb; font-size: 1rem;"></i>`;
        document.getElementById('pm-rank').innerHTML = `<i class="fas fa-trophy"></i> ${p.rank_name || 'Tập Sự'} • Đích đến: ${p.hometown || 'Chưa cập nhật'}`;
        document.getElementById('pm-bio').innerText = p.bio || "Người dùng này chưa có tiểu sử.";
        
        document.getElementById('pm-posts').innerText = p.total_posts || 0;
        document.getElementById('pm-likes').innerText = p.total_likes || 0;
        document.getElementById('pm-friends').innerText = p.total_friends || 0;

        // Cập nhật Nút dựa vào Trạng thái bạn bè
        const btnContainer = document.getElementById('pm-action-buttons');
        let btns = '';

        if(p.friend_status === 'self') {
            btns = `<button onclick="closeProfileModal(); window.location.href='tai-khoan.html'" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #e5e5ea; color: #1d1d1f; font-weight: 600; cursor: pointer; transition: 0.2s;"><i class="fas fa-pen"></i> Chỉnh sửa hồ sơ</button>`;
        } 
        else if (p.friend_status === 'accepted') {
            btns = `
                <button onclick="handleFriendAction(${targetUserId}, 'remove')" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #e5e5ea; color: #1d1d1f; font-weight: 600; cursor: pointer;"><i class="fas fa-user-check"></i> Bạn bè</button>
                <button onclick="openChatBox('${p.full_name}', '${p.avatar_url || defaultAvatar}')" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #d97706; color: #fff; font-weight: 600; cursor: pointer;"><i class="fab fa-facebook-messenger"></i> Nhắn tin</button>
            `;
        }
        else if (p.friend_status === 'sent_pending') {
            btns = `<button onclick="handleFriendAction(${targetUserId}, 'cancel')" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #e5e5ea; color: #1d1d1f; font-weight: 600; cursor: pointer;"><i class="fas fa-user-times"></i> Hủy yêu cầu</button>`;
        }
        else if (p.friend_status === 'received_pending') {
            btns = `
                <button onclick="acceptFriendAPI(${targetUserId})" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #34c759; color: #fff; font-weight: 600; cursor: pointer;"><i class="fas fa-check"></i> Chấp nhận</button>
                <button onclick="handleFriendAction(${targetUserId}, 'decline')" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #e5e5ea; color: #1d1d1f; font-weight: 600; cursor: pointer;">Từ chối</button>
            `;
        }
        else {
            // none
            btns = `<button onclick="handleFriendAction(${targetUserId}, 'add')" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer;"><i class="fas fa-user-plus"></i> Thêm bạn bè</button>`;
        }

        btnContainer.innerHTML = btns;

        // Hiện Modal lên
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        content.style.transform = 'translateY(0)';

    } catch (e) {
        if(typeof showToast === 'function') showToast("Lỗi khi tải thông tin!", "error");
    }
};

window.closeProfileModal = function() {
    const modal = document.getElementById('solviaProfileModal');
    const content = document.getElementById('profileModalContent');
    if(modal && content) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        content.style.transform = 'translateY(20px)';
    }
};

// --- XỬ LÝ NÚT KẾT BẠN / HỦY KẾT BẠN ---
window.handleFriendAction = async function(targetUserId, actionType) {
    const token = localStorage.getItem('temporia_token');
    
    // Hiển thị hộp thoại xác nhận nếu người dùng muốn Hủy kết bạn
    if(actionType === 'remove' || actionType === 'cancel') {
        window.showConfirm("Bạn chắc chắn muốn hủy kết bạn/yêu cầu này?", async () => {
            await toggleFriendRequest(targetUserId, token);
        });
    } else {
        // Nếu là "Thêm bạn" hoặc "Từ chối" thì gọi thẳng
        await toggleFriendRequest(targetUserId, token);
    }
};

async function toggleFriendRequest(targetUserId, token) {
    try {
        const res = await fetch(`${API_BASE_URL}/friends/request/${targetUserId}`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            // Cập nhật lại giao diện ngay lập tức
            openProfileModal(targetUserId);
        }
    } catch(e) {
        if(typeof showToast === 'function') showToast("Lỗi kết nối", "error");
    }
}

window.acceptFriendAPI = async function(targetUserId) {
    const token = localStorage.getItem('temporia_token');
    try {
        const res = await fetch(`${API_BASE_URL}/friends/accept/${targetUserId}`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            if(typeof showToast === 'function') showToast("Đã trở thành bạn bè!", "success");
            openProfileModal(targetUserId);
        }
    } catch(e) {
        if(typeof showToast === 'function') showToast("Lỗi kết nối", "error");
    }
};


/* ========================================================================= */
/* CÁC HÀM XỬ LÝ TƯƠNG TÁC CƠ BẢN CÒN LẠI                                    */
/* ========================================================================= */

window.toggleLike = function(btn) {
    const icon = btn.querySelector('.heart-icon');
    const countSpan = btn.querySelector('.like-count');
    let count = parseInt(countSpan.innerText);
    if (btn.classList.contains('liked')) {
        btn.classList.remove('liked'); icon.className = "fa-heart heart-icon far"; countSpan.innerText = count - 1;
    } else {
        btn.classList.add('liked'); icon.className = "fa-heart heart-icon fas text-red"; countSpan.innerText = count + 1;
    }
};

window.toggleLikeAPI = async function(btn, postId) {
    const token = localStorage.getItem('temporia_token');
    if(!token) {
        if(typeof showToast === 'function') showToast("Vui lòng đăng nhập để thả tim!", "error");
        return;
    }
    window.toggleLike(btn); 
    try {
        await fetch(`${API_BASE_URL}/posts/${postId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (e) { console.error("Lỗi thả tim:", e); }
};

window.sendCommentAPI = async function(postId, element) {
    const token = localStorage.getItem('temporia_token');
    if(!token) {
        if(typeof showToast === 'function') showToast("Vui lòng đăng nhập để bình luận!", "error");
        return;
    }
    
    const inputBox = document.getElementById(`input-cmt-${postId}`);
    const text = inputBox.value.trim();
    if(!text) return;

    const btnSend = inputBox.nextElementSibling;
    const originalIcon = btnSend.innerHTML;

    inputBox.disabled = true; btnSend.disabled = true; btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: text })
        });
        
        if(response.ok) {
            const currentUserData = JSON.parse(localStorage.getItem('temporia_user')) || {};
            const avatar = currentUserData.avatar_url || defaultAvatar;
            const name = currentUserData.full_name || "Nhà thám hiểm";

            const commentList = document.getElementById(`comment-list-${postId}`);
            const newCmt = document.createElement('div');
            newCmt.className = 'comment-item';
            newCmt.style.cssText = "display: flex; gap: 10px; margin-top: 10px; animation: fadeIn 0.3s;";
            newCmt.innerHTML = `
                <img src="${avatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                <div style="background: #f2f2f7; padding: 8px 12px; border-radius: 12px; font-size: 0.9rem; max-width: 85%;">
                    <strong style="color: #1d1d1f;">${name}</strong><br>
                    <span style="color: #3f3f46; display: block; word-break: break-word; white-space: pre-wrap;">${text}</span>
                </div>
            `;
            commentList.appendChild(newCmt);

            const countSpan = document.getElementById(`comment-count-${postId}`);
            if(countSpan) countSpan.innerText = parseInt(countSpan.innerText) + 1;
            inputBox.value = '';
            
            if(typeof showToast === 'function') showToast("Đã gửi bình luận!", "success");
        }
    } catch(e) {
        if(typeof showToast === 'function') showToast("Có lỗi xảy ra khi gửi bình luận!", "error");
    } finally { 
        inputBox.disabled = false; btnSend.disabled = false; btnSend.innerHTML = originalIcon; inputBox.focus(); 
    }
};

window.togglePostOptions = function(postId) {
    const menu = document.getElementById(`post-options-${postId}`);
    if(menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window.deletePostAPI = function(postId) {
    window.showConfirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn không?", async () => {
        const token = localStorage.getItem('temporia_token');
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                if(typeof showToast === 'function') showToast("Đã xóa bài viết thành công!", "success");
                await window.loadPosts();
            } else {
                if(typeof showToast === 'function') showToast("Bạn không có quyền xóa bài viết này!", "error");
            }
        } catch(e) { if(typeof showToast === 'function') showToast("Lỗi kết nối khi xóa bài!", "error"); }
    });
};

window.toggleComments = function(commentSectionId) {
    const section = document.getElementById(commentSectionId);
    if (section) section.classList.toggle('show');
};

window.toggleShare = function(shareMenuId) {
    const menu = document.getElementById(shareMenuId);
    if (menu) menu.classList.toggle('show');
};

document.addEventListener('click', function(event) {
    if (!event.target.closest('.share-wrapper')) {
        document.querySelectorAll('.share-dropdown.show').forEach(dropdown => { dropdown.classList.remove('show'); });
    }
    if (!event.target.closest('.post-options-dropdown')) {
        document.querySelectorAll('div[id^="post-options-"]').forEach(menu => { menu.style.display = 'none'; });
    }
});

window.openMessagePanel = function() {
    document.getElementById('messagePanel').classList.add('open');
    document.getElementById('msgOverlay').classList.add('show');
};
window.closeMessagePanel = function() {
    document.getElementById('messagePanel').classList.remove('open');
    document.getElementById('msgOverlay').classList.remove('show');
};
window.openChatBox = function(name, avatarUrl) {
    const chatBox = document.getElementById('chatBox');
    document.getElementById('chatBoxName').innerText = name;
    document.getElementById('chatBoxAvatar').src = avatarUrl;
    document.querySelectorAll('.target-avatar').forEach(img => img.src = avatarUrl);

    chatBox.classList.remove('minimized');
    chatBox.classList.add('open');
    closeMessagePanel(); 
    
    const chatBody = document.getElementById('chatBoxBody');
    chatBody.scrollTop = chatBody.scrollHeight;
};
window.closeChatBox = function(event) {
    event.stopPropagation();
    document.getElementById('chatBox').classList.remove('open');
};
window.toggleChatBoxMinimize = function() {
    document.getElementById('chatBox').classList.toggle('minimized');
};
window.handleChatEnter = function(event) {
    if (event.key === 'Enter') sendChatMsg();
};
window.sendChatMsg = function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const chatBody = document.getElementById('chatBoxBody');
    const newBubble = document.createElement('div');
    newBubble.className = 'chat-bubble right';
    newBubble.innerHTML = `<div class="bubble-text">${text}</div>`;
    chatBody.appendChild(newBubble);
    
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
};

/* ========================================================================= */
/* HỆ THỐNG SLIDE PANEL VÀ API TƯƠNG TÁC BÊN NGOÀI                           */
/* ========================================================================= */

// --- 1. ĐIỀU KHIỂN BẢNG TRƯỢT ---
window.openPanel = function(panelId) {
    closeAllPanels(); // Đóng các bảng khác trước khi mở
    document.getElementById('globalOverlay').classList.add('show');
    document.getElementById(panelId).classList.add('open');

    // Kích hoạt API tải dữ liệu tùy theo bảng
    if(panelId === 'messagePanel') loadChatFriends();
    if(panelId === 'notificationPanel') loadNotifications();
};

window.closeAllPanels = function() {
    document.getElementById('globalOverlay').classList.remove('show');
    document.getElementById('searchPanel').classList.remove('open');
    document.getElementById('messagePanel').classList.remove('open');
    document.getElementById('notificationPanel').classList.remove('open');
};

// --- 2. TÌM KIẾM NGƯỜI DÙNG (KÍNH LÚP) ---
let searchTimeout;
window.debounceSearch = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(executeSearch, 500); // Chờ 0.5s sau khi gõ xong mới tìm
};

async function executeSearch() {
    const q = document.getElementById('searchInput').value.trim();
    const resultBox = document.getElementById('searchResults');
    
    if(!q) { resultBox.innerHTML = '<p style="text-align:center; color:#86868b;">Gõ tên để tìm kiếm...</p>'; return; }

    resultBox.innerHTML = '<p style="text-align:center; color:#86868b;"><i class="fas fa-spinner fa-spin"></i> Đang tìm...</p>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if(data.results.length === 0) {
            resultBox.innerHTML = '<p style="text-align:center; color:#86868b;">Không tìm thấy ai.</p>';
            return;
        }

        resultBox.innerHTML = data.results.map(u => `
            <div class="panel-item" onclick="window.location.href='ho-so.html?id=${u.id}'">
                <img src="${u.avatar_url || defaultAvatar}" class="panel-item-avatar">
                <div class="panel-item-info">
                    <h4>${u.full_name}</h4>
                    <p><i class="fas fa-trophy" style="color:#d97706"></i> ${u.rank_name || 'Tập Sự'}</p>
                </div>
            </div>
        `).join('');
    } catch (e) { resultBox.innerHTML = '<p style="text-align:center; color:red;">Lỗi tìm kiếm.</p>'; }
}

// --- 3. TẢI DANH SÁCH BẠN BÈ ĐỂ CHAT (TIN NHẮN) ---
async function loadChatFriends() {
    const token = localStorage.getItem('temporia_token');
    const listBox = document.getElementById('friendChatList');
    if(!listBox) return;
    listBox.innerHTML = '<p style="text-align:center; color:#86868b;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';
    if(!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/chat/friends`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if(!data.friends || data.friends.length === 0) { listBox.innerHTML = '<p style="text-align:center; color:#86868b;">Bạn chưa kết bạn với ai.</p>'; return; }
        
        listBox.innerHTML = data.friends.map(f => {
            // Lọc tên đề phòng có người đặt tên chứa dấu nháy đơn (VD: D'Arcy)
            const safeName = f.full_name.replace(/'/g, "\\'");
            const avatar = f.avatar_url || defaultAvatar;
            
            return `
            <div class="panel-item" onclick="openChatBox('${safeName}', '${avatar}', ${f.id})">
                <div style="position:relative;">
                    <img src="${avatar}" class="panel-item-avatar">
                    <div style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:#34c759; border:2px solid #fff; border-radius:50%;"></div>
                </div>
                <div class="panel-item-info">
                    <h4>${f.full_name}</h4><p>Nhấn để gửi tin nhắn...</p>
                </div>
            </div>
            `;
        }).join('');
    } catch (e) { listBox.innerHTML = '<p style="text-align:center; color:red;">Lỗi hệ thống.</p>'; }
}
// --- 4. TẢI VÀ XỬ LÝ THÔNG BÁO (TRÁI TIM) ---
// --- 4. TẢI VÀ XỬ LÝ THÔNG BÁO (TRÁI TIM) ---
async function loadNotifications() {
    const token = localStorage.getItem('temporia_token');
    const listBox = document.getElementById('notificationList');
    listBox.innerHTML = '<p style="text-align:center; color:#86868b;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';
    
    if(!token) { listBox.innerHTML = '<p style="text-align:center;">Vui lòng đăng nhập!</p>'; return; }

    try {
        const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        if(!data.notifications || data.notifications.length === 0) {
            listBox.innerHTML = '<p style="text-align:center; color:#86868b; margin-top:20px;">Không có thông báo mới.</p>';
            return;
        }

        listBox.innerHTML = data.notifications.map(n => {
            // Hàm tính thời gian tương đối
            const dateObj = new Date(n.created_at.endsWith('Z') ? n.created_at : n.created_at + 'Z');
            const diffInMins = Math.floor((new Date() - dateObj) / 60000);
            const timeText = diffInMins < 1 ? 'Vừa xong' : (diffInMins < 60 ? `${diffInMins} phút trước` : (diffInMins < 1440 ? `${Math.floor(diffInMins/60)} giờ trước` : `${Math.floor(diffInMins/1440)} ngày trước`));

            if(n.type === 'friend_request') {
                return `
                    <div class="panel-item" style="align-items: flex-start; background: #eff6ff;">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4>
                            <p>Đã gửi cho bạn một lời mời kết bạn.</p>
                            <span style="font-size: 0.75rem; color: #2563eb; font-weight: 600;">${timeText}</span>
                            <div class="notif-actions">
                                <button class="btn-notif-acc" onclick="acceptFriendAPI(${n.user_id}, this)">Chấp nhận</button>
                            </div>
                        </div>
                    </div>`;
            } else if (n.type === 'friend_accepted') {
                 return `
                    <div class="panel-item">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4>
                            <p>Các bạn đã trở thành bạn bè.</p>
                            <span style="font-size: 0.75rem; color: #86868b;">${timeText}</span>
                        </div>
                        <i class="fas fa-user-check" style="color: #34c759; font-size: 1.2rem;"></i>
                    </div>`;
            } else if (n.type === 'comment') {
                return `
                    <div class="panel-item">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4>
                            <p>Đã bình luận: <span style="color:#1d1d1f; font-weight:500;">"${n.content}"</span></p>
                            <span style="font-size: 0.75rem; color: #86868b;">${timeText}</span>
                        </div>
                        <i class="fas fa-comment-dots" style="color: #2563eb; font-size: 1.2rem;"></i>
                    </div>`;
            } else if (n.type === 'like') {
                 return `
                    <div class="panel-item">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4>
                            <p>Đã yêu thích bài viết của bạn.</p>
                            <span style="font-size: 0.75rem; color: #86868b;">${timeText}</span>
                        </div>
                        <i class="fas fa-heart" style="color: #dc2626; font-size: 1.2rem;"></i>
                    </div>`;
            }
        }).join('');
    } catch (e) { listBox.innerHTML = '<p style="text-align:center; color:red;">Lỗi hệ thống.</p>'; }
}

window.acceptFriendAPI = async function(targetUserId, btnElement) {
    const token = localStorage.getItem('temporia_token');
    btnElement.innerText = "Đang xử lý...";
    try {
        const res = await fetch(`${API_BASE_URL}/friends/accept/${targetUserId}`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            btnElement.parentElement.innerHTML = '<span style="color:#34c759; font-weight:600; font-size:0.85rem;"><i class="fas fa-check"></i> Đã là bạn bè</span>';
        }
    } catch(e) { alert("Lỗi"); }
};

/* ========================================================================= */
/* HỆ THỐNG KHUNG CHAT (CHAT BOX) CHUẨN                                      */
/* ========================================================================= */
window.openChatBox = function(name, avatarUrl) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    document.getElementById('chatBoxName').innerText = name;
    document.getElementById('chatBoxAvatar').src = avatarUrl;
    document.querySelectorAll('.target-avatar').forEach(img => img.src = avatarUrl);

    // Ép hiển thị đề phòng CSS bị ẩn
    chatBox.style.display = 'flex';
    chatBox.classList.remove('minimized');
    chatBox.classList.add('open');
    
    closeAllPanels(); 
    
    const chatBody = document.getElementById('chatBoxBody');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
};

window.closeChatBox = function(event) {
    if(event) event.stopPropagation();
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.classList.remove('open');
};

window.toggleChatBoxMinimize = function() {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.classList.toggle('minimized');
};

window.handleChatEnter = function(event) {
    if (event.key === 'Enter') sendChatMsg();
};

window.sendChatMsg = function() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const chatBody = document.getElementById('chatBoxBody');
    const newBubble = document.createElement('div');
    newBubble.className = 'chat-bubble right';
    newBubble.innerHTML = `<div class="bubble-text">${text}</div>`;
    
    if (chatBody) {
        chatBody.appendChild(newBubble);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    input.value = '';
};

/* ========================================================================= */
/* HỆ THỐNG KHUNG CHAT (ĐỒNG BỘ DATABASE)                                    */
/* ========================================================================= */

let currentChatUserId = null; // Biến ghi nhớ người đang chat

window.openChatBox = async function(name, avatarUrl, targetId) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    currentChatUserId = targetId; // Lưu ID lại để lát gõ tin nhắn biết gửi cho ai
    
    document.getElementById('chatBoxName').innerText = name;
    document.getElementById('chatBoxAvatar').src = avatarUrl;
    document.querySelectorAll('.target-avatar').forEach(img => img.src = avatarUrl);

    chatBox.style.display = 'flex';
    chatBox.classList.remove('minimized');
    chatBox.classList.add('open');
    if (typeof closeAllPanels === 'function') closeAllPanels(); 
    
    const chatBody = document.getElementById('chatBoxBody');
    chatBody.innerHTML = '<p style="text-align:center; color:#86868b; margin-top:20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải tin nhắn...</p>';

    // TẢI LỊCH SỬ TIN NHẮN TỪ DATABASE
    const token = localStorage.getItem('temporia_token');
    if(!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/chat/messages/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if(data.messages.length === 0) {
            chatBody.innerHTML = '<p style="text-align:center; color:#86868b; margin-top: 20px; font-size: 0.85rem;">Bắt đầu cuộc trò chuyện.</p>';
            return;
        }

        const myId = data.my_id;
        chatBody.innerHTML = data.messages.map(m => {
            if(m.sender_id === myId) {
                // Tin nhắn của mình (Nằm bên phải)
                return `<div class="chat-bubble right"><div class="bubble-text">${m.content}</div></div>`;
            } else {
                // Tin nhắn của bạn bè (Nằm bên trái, kèm Avatar)
                return `<div class="chat-bubble left"><img src="${avatarUrl}" class="chat-bubble-avatar"><div class="bubble-text">${m.content}</div></div>`;
            }
        }).join('');
        
        chatBody.scrollTop = chatBody.scrollHeight; // Cuộn xuống dưới cùng
    } catch(e) {
        chatBody.innerHTML = '<p style="text-align:center; color:red;">Lỗi tải tin nhắn.</p>';
    }
};

window.closeChatBox = function(event) {
    if(event) event.stopPropagation();
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.classList.remove('open');
    currentChatUserId = null;
};

window.toggleChatBoxMinimize = function() {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.classList.toggle('minimized');
};

window.handleChatEnter = function(event) {
    if (event.key === 'Enter') sendChatMsg();
};

window.sendChatMsg = async function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatUserId) return;

    const chatBody = document.getElementById('chatBoxBody');
    
    // Hiển thị tin nhắn lên màn hình trước cho mượt (Giao diện ảo)
    const newBubble = document.createElement('div');
    newBubble.className = 'chat-bubble right';
    newBubble.innerHTML = `<div class="bubble-text" style="opacity: 0.7;">${text}</div>`; // Nhạt màu xíu chờ gửi
    if (chatBody) { 
        chatBody.appendChild(newBubble); 
        chatBody.scrollTop = chatBody.scrollHeight; 
    }
    input.value = '';

    // LƯU TIN NHẮN VÀO DATABASE
    const token = localStorage.getItem('temporia_token');
    try {
        const res = await fetch(`${API_BASE_URL}/chat/messages/${currentChatUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: text })
        });
        
        if(res.ok) {
            newBubble.querySelector('.bubble-text').style.opacity = '1'; // Gửi xong thì đậm lên
        } else {
            newBubble.querySelector('.bubble-text').style.background = '#dc2626'; // Lỗi thì đỏ lên
        }
    } catch(e) {
        newBubble.querySelector('.bubble-text').style.background = '#dc2626';
    }
};
/* ========================================================================= */
/* MỞ TRANG CÁ NHÂN (XỬ LÝ DỮ LIỆU BẢO MẬT)                                  */
/* ========================================================================= */
/* ========================================================================= */
/* CHUYỂN HƯỚNG ĐẾN TRANG HỒ SƠ RIÊNG (HO-SO.HTML)                           */
/* ========================================================================= */
window.goToMyProfile = function() {
    try {
        const userRaw = localStorage.getItem('temporia_user');
        if (!userRaw) {
            if(typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
            setTimeout(() => window.location.href = 'auth.html#login', 1000);
            return;
        }

        const user = JSON.parse(userRaw);
        
        if (user && user.id) {
            // Chuyển hướng thẳng sang trang ho-so.html kèm theo ID của mình
            window.location.href = 'ho-so.html?id=' + user.id;
        } else {
            if(typeof showToast === 'function') showToast("Phiên đăng nhập cũ, vui lòng đăng nhập lại!", "error");
            localStorage.removeItem('temporia_user');
            localStorage.removeItem('temporia_token');
            setTimeout(() => window.location.href = 'auth.html#login', 1500);
        }
    } catch (error) {
        console.error("Lỗi khi mở hồ sơ:", error);
    }
};