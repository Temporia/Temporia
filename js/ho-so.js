/* ========================================================================= */
/* JS XỬ LÝ TRANG HỒ SƠ CÁ NHÂN (HO-SO.HTML) - ĐÃ DỌN SẠCH LỖI NULL          */
/* ========================================================================= */

const API_BASE_URL = 'https://temporia-api.onrender.com/api';
const defaultAvatar = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23cbd5e1%22%3e%3cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z%22/%3e%3c/svg%3e";

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

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id');
    const token = localStorage.getItem('temporia_token');
    
    // Nếu mất ID hoặc mất token thì đá về Cộng đồng
    if (!targetUserId || !token) { 
        window.location.href = 'cong-dong.html'; 
        return; 
    }

    // Hiển thị thông tin Navbar góc trên bên phải
    const userDataRaw = localStorage.getItem('temporia_user');
    if (userDataRaw) {
        const parsedUser = JSON.parse(userDataRaw);
        const navName = document.getElementById('navUserName');
        const navAvatar = document.getElementById('navAvatar');
        if(navName) navName.innerText = parsedUser.full_name;
        if(navAvatar) navAvatar.src = parsedUser.avatar_url || defaultAvatar;
    }

    async function loadProfileInfo() {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if(!res.ok) {
                console.error("Lỗi từ server:", data.error);
                return;
            }

            const p = data.profile;
            
            document.getElementById('p-avatar').src = p.avatar_url || defaultAvatar;
            document.getElementById('p-name').innerHTML = `${p.full_name} <i class="fas fa-circle-check" style="color:#2563eb; font-size: 1.1rem;"></i>`;
            document.getElementById('p-rank').innerHTML = `<i class="fas fa-trophy"></i> ${p.rank_name || 'Tập Sự'}`;
            document.getElementById('p-bio').innerText = p.bio || "Người dùng này chưa có tiểu sử.";
            document.getElementById('p-posts').innerText = p.total_posts || 0;
            document.getElementById('p-friends').innerText = p.total_friends || 0;
            document.getElementById('p-likes').innerText = p.total_likes || 0;

            document.getElementById('p-streak').innerText = p.streak_count || 0;
            document.getElementById('p-badges').innerText = p.badges_count || 0;

            const btnContainer = document.getElementById('p-action-btns');
            let btns = '';

            if(p.friend_status === 'self') {
                btns = `<button class="profile-btn btn-edit" onclick="window.location.href='tai-khoan.html'"><i class="fas fa-pen"></i> Chỉnh sửa hồ sơ</button>`;
            } else if (p.friend_status === 'accepted') {
                const safeName = p.full_name.replace(/'/g, "\\'");
                const ava = p.avatar_url || defaultAvatar;
                btns = `
                    <button class="profile-btn btn-edit" onclick="handleFriendAction('remove')"><i class="fas fa-user-check"></i> Bạn bè</button>
                    <button class="profile-btn btn-chat" onclick="openChatBox('${safeName}', '${ava}', ${targetUserId})"><i class="fab fa-facebook-messenger"></i> Nhắn tin</button>
                `;
            } else if (p.friend_status === 'sent_pending') {
                btns = `<button class="profile-btn btn-pending" onclick="handleFriendAction('cancel')"><i class="fas fa-user-times"></i> Hủy yêu cầu</button>`;
            } else if (p.friend_status === 'received_pending') {
                btns = `
                    <button class="profile-btn btn-accept" onclick="acceptFriendAPI(${targetUserId}, this)"><i class="fas fa-check"></i> Chấp nhận</button>
                    <button class="profile-btn btn-pending" onclick="handleFriendAction('decline')">Từ chối</button>
                `;
            } else {
                btns = `<button class="profile-btn btn-add" onclick="handleFriendAction('add')"><i class="fas fa-user-plus"></i> Thêm bạn bè</button>`;
            }
            btnContainer.innerHTML = btns;
            
        } catch (e) { console.error("Lỗi mạng:", e); }
    }

    async function loadUserPosts() {
        try {
            const res = await fetch(`${API_BASE_URL}/posts?author_id=${targetUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const feedContainer = document.getElementById("user-feed-container");
            if(!feedContainer) return;

            feedContainer.innerHTML = '';

            if(!data.posts || data.posts.length === 0) {
                feedContainer.innerHTML = '<p style="text-align:center; color:#86868b; margin-top:40px; font-size: 1.1rem;">Chưa có bài đăng nào.</p>';
                return;
            }

            data.posts.forEach(post => {
                const postEl = document.createElement("article");
                postEl.className = "post-card premium-card dynamic-post"; 
                
                const avatar = post.avatar_url || defaultAvatar;
                const badges = post.badges_count || 0;
                const streak = post.streak_count || 0;
                const rank = post.rank_name || "Tập Sự";
                const progress = Math.min(((badges * 50 + streak * 10) / 2000) * 100, 100);
                const timeString = timeAgo(post.created_at);
                const heartClass = post.is_liked ? "fas liked text-red" : "far";

                postEl.innerHTML = `
                    <div class="premium-header">
                        <div class="premium-avatar-wrap">
                            <img src="${avatar}" class="premium-avatar" alt="Avatar">
                        </div>
                        <div class="premium-user-info" style="width: 100%;">
                            <div class="user-top-row" style="display: flex; align-items: center;">
                                <h4 class="user-name">${post.full_name} <i class="fas fa-circle-check verified-badge"></i></h4>
                                <span class="post-date" style="margin-left: 10px;"><i class="far fa-clock"></i> ${timeString}</span>
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
                    </div>

                    <div class="post-actions-full">
                        <button class="action-btn btn-like">
                            <i class="fa-heart heart-icon ${heartClass}"></i> <span class="like-count">${post.likes_count}</span>
                        </button>
                        <button class="action-btn btn-comment">
                            <i class="far fa-comment"></i> <span>${post.comments_count}</span>
                        </button>
                    </div>
                `;
                feedContainer.appendChild(postEl);
            });
        } catch (e) { console.error("Lỗi tải bài viết:", e); }
    }

    // GỌI CÁC API TƯƠNG TÁC
    window.handleFriendAction = async function(actionType) {
        if((actionType === 'remove' || actionType === 'cancel') && !confirm("Chắc chắn thực hiện thao tác này?")) return;
        try {
            await fetch(`${API_BASE_URL}/friends/request/${targetUserId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            loadProfileInfo(); 
        } catch(e) { alert("Lỗi kết nối."); }
    };

    window.acceptFriendAPI = async function(userId = targetUserId, btnElement = null) {
        if(btnElement) btnElement.innerText = "Đang xử lý...";
        try {
            const res = await fetch(`${API_BASE_URL}/friends/accept/${userId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                if(btnElement) {
                    btnElement.parentElement.innerHTML = '<span style="color:#34c759; font-weight:600;"><i class="fas fa-check"></i> Đã là bạn bè</span>';
                }
                loadProfileInfo();
            }
        } catch(e) { console.error("Lỗi"); }
    };

    // Chạy các hàm tải dữ liệu khi trang vừa mở
    loadProfileInfo();
    loadUserPosts();
});

/* ========================================================================= */
/* HỆ THỐNG ĐIỀU KHIỂN BẢNG TRƯỢT VÀ CHAT DÀNH CHO TRANG HỒ SƠ               */
/* ========================================================================= */

window.openPanel = function(panelId) {
    closeAllPanels();
    const overlay = document.getElementById('globalOverlay');
    const panel = document.getElementById(panelId);
    if(overlay) overlay.classList.add('show');
    if(panel) panel.classList.add('open');

    if(panelId === 'messagePanel') loadChatFriends();
    if(panelId === 'notificationPanel') loadNotifications();
};

window.closeAllPanels = function() {
    const overlay = document.getElementById('globalOverlay');
    if(overlay) overlay.classList.remove('show');
    ['searchPanel', 'messagePanel', 'notificationPanel'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('open');
    });
};

// Tìm kiếm
let searchTimeout;
window.debounceSearch = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(executeSearch, 500);
};

async function executeSearch() {
    const q = document.getElementById('searchInput').value.trim();
    const resultBox = document.getElementById('searchResults');
    if(!resultBox) return;

    if(!q) { resultBox.innerHTML = '<p style="text-align:center; color:#86868b;">Gõ tên để tìm kiếm...</p>'; return; }
    resultBox.innerHTML = '<p style="text-align:center; color:#86868b;"><i class="fas fa-spinner fa-spin"></i> Đang tìm...</p>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if(data.results.length === 0) { resultBox.innerHTML = '<p style="text-align:center; color:#86868b;">Không tìm thấy ai.</p>'; return; }
        resultBox.innerHTML = data.results.map(u => `
            <div class="panel-item" onclick="window.location.href='ho-so.html?id=${u.id}'">
                <img src="${u.avatar_url || defaultAvatar}" class="panel-item-avatar">
                <div class="panel-item-info">
                    <h4>${u.full_name}</h4><p><i class="fas fa-trophy" style="color:#d97706"></i> ${u.rank_name || 'Tập Sự'}</p>
                </div>
            </div>
        `).join('');
    } catch (e) { resultBox.innerHTML = '<p style="text-align:center; color:red;">Lỗi tìm kiếm.</p>'; }
}

// Tải bạn bè để chat
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
            const safeName = f.full_name.replace(/'/g, "\\'");
            const avatar = f.avatar_url || defaultAvatar;
            return `
            <div class="panel-item" onclick="openChatBox('${safeName}', '${avatar}', ${f.id})">
                <div style="position:relative;">
                    <img src="${avatar}" class="panel-item-avatar">
                    <div style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:#34c759; border:2px solid #fff; border-radius:50%;"></div>
                </div>
                <div class="panel-item-info"><h4>${f.full_name}</h4><p>Nhấn để nhắn tin...</p></div>
            </div>
            `;
        }).join('');
    } catch (e) { listBox.innerHTML = '<p style="text-align:center; color:red;">Lỗi hệ thống.</p>'; }
}

// Tải thông báo
async function loadNotifications() {
    const token = localStorage.getItem('temporia_token');
    const listBox = document.getElementById('notificationList');
    if(!listBox) return;
    listBox.innerHTML = '<p style="text-align:center; color:#86868b;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';
    if(!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if(!data.notifications || data.notifications.length === 0) { listBox.innerHTML = '<p style="text-align:center; color:#86868b;">Không có thông báo mới.</p>'; return; }

        listBox.innerHTML = data.notifications.map(n => {
            const dateObj = new Date(n.created_at.endsWith('Z') ? n.created_at : n.created_at + 'Z');
            const diffInMins = Math.floor((new Date() - dateObj) / 60000);
            const timeText = diffInMins < 1 ? 'Vừa xong' : (diffInMins < 60 ? `${diffInMins} phút trước` : (diffInMins < 1440 ? `${Math.floor(diffInMins/60)} giờ trước` : `${Math.floor(diffInMins/1440)} ngày trước`));

            if(n.type === 'friend_request') {
                return `
                    <div class="panel-item" style="align-items: flex-start; background: #eff6ff;">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4><p>Đã gửi lời mời kết bạn.</p><span style="font-size: 0.75rem; color: #2563eb;">${timeText}</span>
                            <div class="notif-actions"><button class="btn-notif-acc" onclick="acceptFriendAPI(${n.user_id}, this)">Chấp nhận</button></div>
                        </div>
                    </div>`;
            } else {
                let content = '', icon = '';
                if (n.type === 'friend_accepted') { content = 'Đã trở thành bạn bè.'; icon = '<i class="fas fa-user-check" style="color:#34c759;"></i>'; }
                else if (n.type === 'comment') { content = `Đã bình luận: "${n.content}"`; icon = '<i class="fas fa-comment-dots" style="color:#2563eb;"></i>'; }
                else if (n.type === 'like') { content = 'Đã yêu thích bài viết.'; icon = '<i class="fas fa-heart" style="color:#dc2626;"></i>'; }
                
                return `
                    <div class="panel-item">
                        <img src="${n.avatar_url || defaultAvatar}" class="panel-item-avatar" onclick="window.location.href='ho-so.html?id=${n.user_id}'">
                        <div class="panel-item-info">
                            <h4>${n.full_name}</h4><p>${content}</p><span style="font-size: 0.75rem; color: #86868b;">${timeText}</span>
                        </div>
                        ${icon}
                    </div>`;
            }
        }).join('');
    } catch (e) { }
}

// Khung Chat
let currentChatUserId = null;

window.openChatBox = async function(name, avatarUrl, targetId) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    currentChatUserId = targetId;
    document.getElementById('chatBoxName').innerText = name;
    document.getElementById('chatBoxAvatar').src = avatarUrl;
    
    chatBox.style.display = 'flex';
    chatBox.classList.remove('minimized');
    chatBox.classList.add('open');
    closeAllPanels(); 
    
    const chatBody = document.getElementById('chatBoxBody');
    chatBody.innerHTML = '<p style="text-align:center; color:#86868b; margin-top:20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';

    const token = localStorage.getItem('temporia_token');
    if(!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/chat/messages/${targetId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        if(data.messages.length === 0) {
            chatBody.innerHTML = '<p style="text-align:center; color:#86868b; margin-top:20px;">Bắt đầu cuộc trò chuyện.</p>';
            return;
        }

        chatBody.innerHTML = data.messages.map(m => {
            if(m.sender_id === data.my_id) return `<div class="chat-bubble right"><div class="bubble-text">${m.content}</div></div>`;
            return `<div class="chat-bubble left"><img src="${avatarUrl}" class="chat-bubble-avatar"><div class="bubble-text">${m.content}</div></div>`;
        }).join('');
        chatBody.scrollTop = chatBody.scrollHeight;
    } catch(e) { chatBody.innerHTML = '<p style="text-align:center; color:red;">Lỗi tải tin nhắn.</p>'; }
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

window.handleChatEnter = function(event) { if (event.key === 'Enter') sendChatMsg(); };

window.sendChatMsg = async function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatUserId) return;

    const chatBody = document.getElementById('chatBoxBody');
    const newBubble = document.createElement('div');
    newBubble.className = 'chat-bubble right';
    newBubble.innerHTML = `<div class="bubble-text" style="opacity:0.7;">${text}</div>`;
    if (chatBody) { chatBody.appendChild(newBubble); chatBody.scrollTop = chatBody.scrollHeight; }
    input.value = '';

    const token = localStorage.getItem('temporia_token');
    try {
        const res = await fetch(`${API_BASE_URL}/chat/messages/${currentChatUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: text })
        });
        if(res.ok) newBubble.querySelector('.bubble-text').style.opacity = '1';
        else newBubble.querySelector('.bubble-text').style.background = '#dc2626';
    } catch(e) { newBubble.querySelector('.bubble-text').style.background = '#dc2626'; }
};