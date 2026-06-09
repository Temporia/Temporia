/* ========================================================================= */
/* TÂM TRÍ USER MINDMAP - AUTO SAVE NOTES & ZOOM ENGINE                      */
/* ========================================================================= */
const API_BASE_URL = 'https://temporia-api.onrender.com/api'; 
let mmScale = 1, mmPanning = false, mmPointX = 0, mmPointY = 0, mmStartX = 0, mmStartY = 0, isMapInitialized = false;

let mindmapData = [];
let expandedNodes = new Set(); 
let userNotesData = JSON.parse(localStorage.getItem('temporia_user_notes') || '{}');
let isAllExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    initMindmapViewport();
    loadMindmapFromDatabase();
});

async function loadMindmapFromDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/mindmap`);
        const result = await response.json();
        if (result.status === 'success' && result.data) {
            mindmapData = JSON.parse(result.data);
            expandedNodes.clear();
            renderMindmapDOM();
            renderAllNotes(); // Tải dữ liệu ghi chú
        }
    } catch (e) { console.error("Lỗi tải Sơ đồ"); }
}

// ---------------------------------------------------------
// 1. ENGINE RENDER SƠ ĐỒ (Không đổi, chỉ tối ưu Click Focus)
// ---------------------------------------------------------
function renderMindmapDOM() {
    const container = document.getElementById('mindmapNodesContainer');
    container.innerHTML = '';
    const roots = mindmapData.filter(n => n.parentId === null);

    roots.forEach((root, index) => {
        const side = index % 2 === 0 ? 'right' : 'left'; 
        const wrapperEl = document.createElement('div');
        wrapperEl.className = 'mm-branch-wrapper';

        const isExpanded = expandedNodes.has(root.id);
        const hasChildren = mindmapData.some(n => n.parentId === root.id);
        
        const branchEl = document.createElement('div');
        branchEl.className = `mm-branch ${side}-side ${isExpanded ? 'is-expanded' : ''}`;
        
        const rootZone = document.createElement('div');
        rootZone.className = 'mm-root-zone';
        
        rootZone.innerHTML = `
            <h2 class="mm-era-label">${root.time}</h2>
            <div class="mm-node root-node" id="${root.id}">
                <h3 class="mm-title-ro">${root.title}</h3>
                <p class="mm-desc-ro">${root.desc}</p>
                
                <div class="user-actions-bar">
                    <button class="u-btn u-btn-focus" onclick="focusNode('${root.id}')" title="Phóng tới"><i class="fa-solid fa-crosshairs"></i> Tọa độ</button>
                    <button class="u-btn u-btn-note" onclick="openNoteForNode('${root.id}')"><i class="fa-solid fa-pen-to-square"></i> Note</button>
                </div>

                ${hasChildren ? `<div class="expand-toggle-btn" onclick="toggleNodeExpand('${root.id}')"><i class="fa-solid fa-chevron-right"></i></div>` : ''}
            </div>
        `;
        branchEl.appendChild(rootZone);

        if (hasChildren) {
            const childrenGroup = document.createElement('div');
            childrenGroup.className = `mm-children-group ${isExpanded ? '' : 'collapsed-group'}`;
            mindmapData.filter(n => n.parentId === root.id).forEach(child => childrenGroup.appendChild(buildChildHTML(child)));
            branchEl.appendChild(childrenGroup);
        }

        wrapperEl.appendChild(branchEl);
        container.appendChild(wrapperEl);
    });

    setTimeout(() => { 
        drawMindmapConnections(); 
        if(isMapInitialized === false && roots.length > 0) { focusNode(roots[0].id); isMapInitialized = true; }
    }, 50);
}

function buildChildHTML(node) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mm-wrapper';
    wrapper.id = 'wrap_' + node.id;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = mindmapData.some(n => n.parentId === node.id);
    if(isExpanded) wrapper.classList.add('is-expanded');

    wrapper.innerHTML = `
        <div class="mm-node ${node.type}-node" id="${node.id}">
            <h3 class="mm-title-ro">${node.title}</h3>
            <p class="mm-desc-ro">${node.desc}</p>
            
            <div class="user-actions-bar">
                <button class="u-btn u-btn-focus" onclick="focusNode('${node.id}')"><i class="fa-solid fa-crosshairs"></i> Tọa độ</button>
                <button class="u-btn u-btn-note" onclick="openNoteForNode('${node.id}')"><i class="fa-solid fa-pen-to-square"></i> Note</button>
            </div>

            ${hasChildren ? `<div class="expand-toggle-btn" onclick="toggleNodeExpand('${node.id}')"><i class="fa-solid fa-chevron-right"></i></div>` : ''}
        </div>
    `;

    if (hasChildren) {
        const childrenGroup = document.createElement('div');
        childrenGroup.className = `mm-children-group ${isExpanded ? '' : 'collapsed-group'}`;
        mindmapData.filter(n => n.parentId === node.id).forEach(child => childrenGroup.appendChild(buildChildHTML(child)));
        wrapper.appendChild(childrenGroup);
    }
    return wrapper;
}

window.toggleNodeExpand = function(nodeId) {
    if (expandedNodes.has(nodeId)) expandedNodes.delete(nodeId);
    else expandedNodes.add(nodeId);
    isAllExpanded = false; updateGlobalBtnUI(); renderMindmapDOM();
}

window.toggleAllNodes = function() {
    isAllExpanded = !isAllExpanded;
    const btnToggleAll = document.getElementById('btnToggleAll');
    if (isAllExpanded) {
        mindmapData.forEach(node => { if (mindmapData.some(n => n.parentId === node.id)) expandedNodes.add(node.id); });
        btnToggleAll.innerHTML = '<i class="fa-solid fa-expand"></i> Mở toàn bộ';
        btnToggleAll.classList.remove('active');
    } else {
        expandedNodes.clear(); 
        btnToggleAll.innerHTML = '<i class="fa-solid fa-compress"></i> Tối giản (Mặc định)';
        btnToggleAll.classList.add('active');
    }
    renderMindmapDOM();
    setTimeout(resetZoomMindmap, 100); 
}

function updateGlobalBtnUI() {
    const btn = document.getElementById('btnToggleAll');
    if(expandedNodes.size === 0) {
        btn.innerHTML = '<i class="fa-solid fa-compress"></i> Tối giản (Mặc định)';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '<i class="fa-solid fa-expand"></i> Tự do khám phá';
        btn.classList.remove('active');
    }
}

// ---------------------------------------------------------
// 2. SỔ GHI CHÚ CUỘN LIÊN TỤC (MASTER NOTEBOOK)
// ---------------------------------------------------------
window.toggleNotePanel = function() {
    const panel = document.getElementById('sideNotePanel');
    const btn = document.getElementById('btnTogglePanel');
    if (panel.classList.contains('open')) {
        panel.classList.remove('open'); btn.classList.remove('active');
    } else {
        panel.classList.add('open'); btn.classList.add('active');
    }
}

function renderAllNotes() {
    const container = document.getElementById('snpNotesContainer');
    let html = '';
    let hasNotes = false;

    // Render tất cả những node đã có dữ liệu trong userNotesData
    for (const [nodeId, noteText] of Object.entries(userNotesData)) {
        const nodeData = mindmapData.find(n => n.id === nodeId);
        if (nodeData) {
            hasNotes = true;
            html += `
                <div class="note-block" id="noteBlock_${nodeId}">
                    <div class="note-block-ref">
                        <h4>${nodeData.title}</h4>
                        <p>${nodeData.desc}</p>
                    </div>
                    <textarea class="note-block-input" oninput="autoSaveNote('${nodeId}', this.value)" placeholder="Viết ghi chú của bạn...">${noteText}</textarea>
                </div>
            `;
        }
    }

    if (!hasNotes) {
        container.innerHTML = `
            <div class="snp-empty" id="snpEmptyState">
                <i class="fa-solid fa-book-open"></i>
                <p>Cuốn sổ đang trống.<br>Hãy bấm nút <b>Note</b> trên bất kỳ bảng sơ đồ nào để bắt đầu ghi chép nhé!</p>
            </div>
        `;
    } else {
        container.innerHTML = html;
    }
}

window.openNoteForNode = function(nodeId) {
    const panel = document.getElementById('sideNotePanel');
    const btn = document.getElementById('btnTogglePanel');
    
    // Nếu note này chưa từng tồn tại, tạo mới một chuỗi rỗng
    if (userNotesData[nodeId] === undefined) {
        userNotesData[nodeId] = '';
        renderAllNotes();
    }
    
    // Mở Panel
    if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        btn.classList.add('active');
    }
    
    // Xóa hiệu ứng highlight cũ
    document.querySelectorAll('.note-block').forEach(el => el.classList.remove('highlight'));

    // Cuộn tới đúng note đó và nháy hiệu ứng
    setTimeout(() => {
        const targetBlock = document.getElementById(`noteBlock_${nodeId}`);
        if (targetBlock) {
            targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetBlock.classList.add('highlight');
            targetBlock.querySelector('textarea').focus();
        }
    }, 300); // Chờ panel trượt ra xong mới cuộn
}

window.autoSaveNote = function(nodeId, text) {
    userNotesData[nodeId] = text;
    localStorage.setItem('temporia_user_notes', JSON.stringify(userNotesData));
    
    // Nếu user xóa hết text, có thể chọn xóa luôn khỏi dữ liệu để dọn dẹp sổ
    if (text.trim() === '') {
        delete userNotesData[nodeId];
        localStorage.setItem('temporia_user_notes', JSON.stringify(userNotesData));
        // Không render lại ngay để tránh giật khung hình lúc đang gõ
    }
}

// ---------------------------------------------------------
// 3. ENGINE TOÁN HỌC & VẼ DÂY
// ---------------------------------------------------------
function initMindmapViewport() {
    const viewport = document.getElementById('mindmapViewport');
    if (!viewport) return;

    viewport.addEventListener('mousedown', (e) => {
        // NGĂN CHẶN XUNG ĐỘT SỰ KIỆN CLICK VÀ KÉO
        if (e.target.closest('.mm-node') || e.target.closest('.mm-era-label') || e.target.closest('button') || e.target.closest('.expand-toggle-btn')) return; 
        e.preventDefault();
        mmPanning = true;
        mmStartX = e.clientX - mmPointX;
        mmStartY = e.clientY - mmPointY;
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!mmPanning) return;
        mmPointX = e.clientX - mmStartX;
        mmPointY = e.clientY - mmStartY;
        applyMindmapTransform(false); 
    });

    viewport.addEventListener('mouseup', () => mmPanning = false);
    viewport.addEventListener('mouseleave', () => mmPanning = false);

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = Math.sign(e.deltaY);
        const zoomIntensity = 0.08; 
        const zoomFactor = delta > 0 ? (1 - zoomIntensity) : (1 + zoomIntensity);

        let newScale = mmScale * zoomFactor;
        newScale = Math.min(Math.max(0.15, newScale), 3.5); 

        const canvasX = (mouseX - mmPointX) / mmScale;
        const canvasY = (mouseY - mmPointY) / mmScale;

        mmPointX = mouseX - canvasX * newScale;
        mmPointY = mouseY - canvasY * newScale;
        mmScale = newScale;

        applyMindmapTransform(false);
    }, { passive: false });
}

function applyMindmapTransform(animate = false) {
    const canvas = document.getElementById('mindmapCanvas');
    if (!canvas) return;
    if (animate) {
        canvas.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        setTimeout(() => { canvas.style.transition = 'none'; }, 500); 
    } else {
        canvas.style.transition = 'none';
    }
    canvas.style.transform = `translate(${mmPointX}px, ${mmPointY}px) scale(${mmScale})`;
    drawMindmapConnections(); 
}

window.zoomMindmap = function(factor) {
    const viewport = document.getElementById('mindmapViewport');
    const vRect = viewport.getBoundingClientRect();
    const vCenterX = vRect.width / 2;
    const vCenterY = vRect.height / 2;
    const canvasX = (vCenterX - mmPointX) / mmScale;
    const canvasY = (vCenterY - mmPointY) / mmScale;
    let newScale = mmScale + factor;
    newScale = Math.min(Math.max(0.15, newScale), 3.5);
    mmPointX = vCenterX - canvasX * newScale;
    mmPointY = vCenterY - canvasY * newScale;
    mmScale = newScale;
    applyMindmapTransform(true);
}

window.resetZoomMindmap = function() {
    const firstRoot = mindmapData.find(n => n.parentId === null);
    if (firstRoot) focusNode(firstRoot.id);
}

window.focusNode = function(nodeId) {
    const node = document.getElementById(nodeId);
    const viewport = document.getElementById('mindmapViewport');
    if (!viewport) return;
    
    // Mở bảng con nếu nó đang bị giấu
    const targetData = mindmapData.find(n => n.id === nodeId);
    if (targetData && targetData.parentId) {
        let currentParent = targetData.parentId;
        let needsRender = false;
        while(currentParent) {
            if(!expandedNodes.has(currentParent)) {
                expandedNodes.add(currentParent);
                needsRender = true;
            }
            const parentData = mindmapData.find(n => n.id === currentParent);
            currentParent = parentData ? parentData.parentId : null;
        }
        if(needsRender) {
            renderMindmapDOM(); 
            setTimeout(() => focusNode(nodeId), 100); // Chờ DOM vẽ xong mới bay tới
            return;
        }
    }

    if(!node) return;

    const vRect = viewport.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const nCenterX = nRect.left + nRect.width / 2;
    const nCenterY = nRect.top + nRect.height / 2;
    const vCenterX = vRect.width / 2;
    const vCenterY = vRect.height / 2;
    
    const canvasX = (nCenterX - vRect.left - mmPointX) / mmScale;
    const canvasY = (nCenterY - vRect.top - mmPointY) / mmScale;

    const targetScale = 1.15; 
    mmPointX = vCenterX - canvasX * targetScale;
    mmPointY = vCenterY - canvasY * targetScale;
    mmScale = targetScale;
    applyMindmapTransform(true);
};

window.drawMindmapConnections = function() {
    const svg = document.getElementById('mindmapEdges');
    const canvas = document.getElementById('mindmapCanvas');
    if (!svg || !canvas) return;

    svg.innerHTML = ''; 
    const canvasRect = canvas.getBoundingClientRect();

    mindmapData.forEach(node => {
        if (!node.parentId) return; 

        const parentEl = document.getElementById(node.parentId);
        const childEl = document.getElementById(node.id);

        if (parentEl && childEl && childEl.closest('.collapsed-group') === null) {
            const pRect = parentEl.getBoundingClientRect();
            const cRect = childEl.getBoundingClientRect();

            const isLeft = childEl.closest('.mm-branch').classList.contains('left-side');
            
            let startX, endX;
            if (isLeft) {
                startX = (pRect.left - canvasRect.left) / mmScale;
                endX = (cRect.right - canvasRect.left) / mmScale;
            } else {
                startX = (pRect.right - canvasRect.left) / mmScale;
                endX = (cRect.left - canvasRect.left) / mmScale;
            }

            const startY = (pRect.top + pRect.height / 2 - canvasRect.top) / mmScale;
            const endY = (cRect.top + cRect.height / 2 - canvasRect.top) / mmScale;

            const curvature = 0.5;
            const cp1X = startX + (endX - startX) * curvature;
            const cp2X = endX - (endX - startX) * curvature;

            const pathData = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            
            if(node.type === 'content') path.setAttribute('stroke', '#93c5fd'); 
            else path.setAttribute('stroke', '#fcd34d'); 

            svg.appendChild(path);
        }
    });
}

// HÀM VẼ DÂY MƯỢT MÀ THEO HIỆU ỨNG
// Chạy vòng lặp vẽ lại đường SVG liên tục trong 400ms để dây bám chặt vào khung đang nảy
function animateLinesDuringTransition() {
    const startTime = Date.now();
    function loop() {
        drawMindmapConnections();
        if (Date.now() - startTime < 400) {
            requestAnimationFrame(loop);
        }
    }
    loop();
}
// CẬP NHẬT LẠI HÀM ĐÓNG/MỞ NÚT ĐƠN
window.toggleNodeExpand = function(nodeId) {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return;

    // Tìm đúng khung chứa bảng hiện tại để thao tác
    const wrapper = nodeEl.closest('.mm-wrapper') || nodeEl.closest('.mm-branch');
    if (!wrapper) return;

    const groupEl = wrapper.querySelector(':scope > .mm-children-group');

    if (expandedNodes.has(nodeId)) {
        // HÀNH ĐỘNG ĐÓNG: Chỉ gắn class ẩn đi, KHÔNG render lại toàn trang
        expandedNodes.delete(nodeId);
        if (groupEl) groupEl.classList.add('collapsed-group');
        wrapper.classList.remove('is-expanded'); // Xoay mũi tên lại
    } else {
        // HÀNH ĐỘNG MỞ: Tháo class ẩn ra
        expandedNodes.add(nodeId);
        if (groupEl) groupEl.classList.remove('collapsed-group');
        wrapper.classList.add('is-expanded'); // Xoay mũi tên xuống
    }

    isAllExpanded = false;
    updateGlobalBtnUI();
    animateLinesDuringTransition(); // Kích hoạt dây chạy theo
}

// CẬP NHẬT LẠI HÀM ĐÓNG/MỞ TOÀN BỘ (GLOBAL BUTTON)
window.toggleAllNodes = function() {
    isAllExpanded = !isAllExpanded;
    const btnToggleAll = document.getElementById('btnToggleAll');
    
    if (isAllExpanded) {
        // Mở tất cả
        mindmapData.forEach(node => {
            if (mindmapData.some(n => n.parentId === node.id)) expandedNodes.add(node.id);
        });
        btnToggleAll.innerHTML = '<i class="fa-solid fa-expand"></i> Mở toàn bộ';
        btnToggleAll.classList.remove('active');

        // Bật hiển thị cho toàn bộ phần tử trên DOM
        document.querySelectorAll('.collapsed-group').forEach(el => el.classList.remove('collapsed-group'));
        document.querySelectorAll('.expand-toggle-btn').forEach(btn => {
            const parent = btn.closest('.mm-wrapper') || btn.closest('.mm-branch');
            if(parent) parent.classList.add('is-expanded');
        });
    } else {
        // Tối giản tất cả
        expandedNodes.clear(); 
        btnToggleAll.innerHTML = '<i class="fa-solid fa-compress"></i> Tối giản (Mặc định)';
        btnToggleAll.classList.add('active');
        
        // Ẩn tất cả các nhánh con
        document.querySelectorAll('.mm-children-group').forEach(el => el.classList.add('collapsed-group'));
        document.querySelectorAll('.is-expanded').forEach(el => el.classList.remove('is-expanded'));
    }

    animateLinesDuringTransition();
    // ĐÃ XÓA LỆNH: setTimeout(resetZoomMindmap) - Giúp màn hình đứng im tại chỗ khi bấm
}