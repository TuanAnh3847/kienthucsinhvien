// ==================== CONFIG FIREBASE ====================
// THAY ĐỔI: Chỉ thay YOUR_PROJECT_ID, giữ nguyên authDomain theo yêu cầu
const firebaseConfig = {
    apiKey: "AIzaSyAumlNTtA9jjwTTvQzRGEKkPnVbYcsd-TA",    // ← Thay bằng apiKey của bạn
    authDomain: "kienthucsinhvien.id.vn",  // ← BẮT BUỘC giữ định dạng này
    databaseURL: "https://tuananh-6b0a0-default-rtdb.firebaseio.com", // ← Thay nếu cần
    projectId: "tuananh-6b0a0",
    storageBucket: "tuananh-6b0a0.firebasestorage.app",
    messagingSenderId: "935684041177",
    appId: "1:935684041177:web:f2cfe5dbc27275d8c611c8"
};

// Khởi tạo Firebase (compat version)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Admin email được phép truy cập
const ADMIN_EMAIL = "tuannguyen3847@gmail.com";

// ==================== KIỂM TRA ĐĂNG NHẬP ====================
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Chưa đăng nhập → chuyển về trang chủ
            window.location.href = "../index.html"; // hoặc đường dẫn trang chủ của bạn
            return;
        }

        if (user.email !== ADMIN_EMAIL) {
            alert("Bạn không có quyền truy cập trang Admin!");
            auth.signOut().then(() => {
                window.location.href = "../index.html";
            });
            return;
        }

        // Đã là Admin → load dữ liệu
        console.log("✅ Admin đã xác thực:", user.email);
        loadUsers();
        initOnlineConfig();
    });
}

// Hàm hỗ trợ chuyển đổi chuỗi ngày giờ VN sang số để so sánh
function parseVietDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    try {
        // Dọn sạch dấu phẩy và chuyển mọi khoảng trắng lạ (như \u202f) về khoảng trắng chuẩn
        let cleanStr = dateStr.replace(/,/g, '').replace(/\s+/g, ' ').trim();
        let parts = cleanStr.split(' ');
        if(parts.length !== 2) return 0;
        
        let datePart = '', timePart = '';
        // Tự động kiểm tra xem phần nào chứa dấu '/' thì đó là Ngày
        if (parts[0].includes('/')) {
            datePart = parts[0];
            timePart = parts[1];
        } else {
            datePart = parts[1];
            timePart = parts[0];
        }
        
        let [d, m, y] = datePart.split('/');
        let [h, min, s] = timePart.split(':');
        
        return new Date(y, m - 1, d, h, min, s).getTime();
    } catch (e) {
        console.error("Lỗi parse ngày:", e);
        return 0;
    }
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function displayText(value, fallback) {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    return String(value);
}

function appendTableMessage(tableBody, message, className, color) {
    clearElement(tableBody);

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = className;
    cell.textContent = message;

    if (color) {
        cell.style.color = color;
    }

    row.appendChild(cell);
    tableBody.appendChild(row);
}

function createTextCell(value, fallback, className) {
    const cell = document.createElement("td");
    cell.textContent = displayText(value, fallback);

    if (className) {
        cell.className = className;
    }

    return cell;
}

function createStatusCell(status) {
    const cell = document.createElement("td");
    const badge = document.createElement("span");
    const isOnline = status === "online";

    badge.style.background = isOnline ? "#ecfdf5" : "#f1f5f9";
    badge.style.color = isOnline ? "#10b981" : "#64748b";
    badge.style.padding = "4px 10px";
    badge.style.borderRadius = "20px";
    badge.style.fontWeight = "600";
    badge.style.fontSize = "0.85rem";
    badge.textContent = isOnline ? "🟢 Đang hoạt động" : "⚪ Offline";

    cell.appendChild(badge);
    return cell;
}

function renderUserRow(data) {
    const uid = displayText(data.uid, "N/A");
    const email = displayText(data.email, "N/A");
    const row = document.createElement("tr");

    const emailCell = document.createElement("td");
    const emailText = document.createElement("strong");
    const uidText = document.createElement("div");
    const uidValue = document.createElement("span");
    emailText.textContent = email;
    uidText.className = "timestamp";
    uidText.textContent = "UID: ";
    uidValue.textContent = uid;
    uidText.appendChild(uidValue);
    emailCell.appendChild(emailText);
    emailCell.appendChild(uidText);
    row.appendChild(emailCell);

    row.appendChild(createTextCell(data.name, "Chưa cập nhật"));
    row.appendChild(createStatusCell(data.status));

    let lastLogin = "Chưa có";
    if (data.last_login_time) {
        if (typeof data.last_login_time === "string") {
            lastLogin = data.last_login_time;
        } else {
            lastLogin = new Date(data.last_login_time).toLocaleString("vi-VN");
        }
    }
    row.appendChild(createTextCell(lastLogin, "Chưa có", "timestamp"));
    row.appendChild(createTextCell(data.device_type, "Unknown"));

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Xóa";
    deleteButton.addEventListener("click", () => deleteUser(uid, email));

    const historyButton = document.createElement("button");
    historyButton.type = "button";
    historyButton.className = "view-btn";
    historyButton.textContent = "Xem Lịch Sử";
    historyButton.addEventListener("click", () => window.viewLoginHistory(uid, email));

    actionCell.appendChild(deleteButton);
    actionCell.appendChild(historyButton);
    row.appendChild(actionCell);

    return row;
}

// ==================== LOAD DANH SÁCH USER ====================
function loadUsers() {
    const userBody = document.getElementById("userBody");
    appendTableMessage(userBody, "Đang tải dữ liệu từ Realtime Database...", "loading");

    const usersRef = database.ref("users");

    usersRef.on("value", (snapshot) => {
        clearElement(userBody);

        if (!snapshot.exists()) {
            appendTableMessage(userBody, "Chưa có người dùng nào.", "no-data");
            return;
        }

        // BƯỚC 1: Rút toàn bộ dữ liệu vào một mảng
        const userArray = [];
        snapshot.forEach((childSnapshot) => {
            userArray.push({
                ...(childSnapshot.val() || {}),
                // Luôn dùng key thật của RTDB, không tin trường uid trong dữ liệu user.
                uid: childSnapshot.key
            });
        });

        // BƯỚC 2: Sắp xếp mảng theo thời gian đăng nhập mới nhất lên đầu
        userArray.sort((a, b) => {
            let timeA = 0;
            let timeB = 0;

            // Xử lý thời gian user A
            if (a.last_login_time) {
                if (typeof a.last_login_time === "string") timeA = parseVietDate(a.last_login_time);
                else timeA = new Date(a.last_login_time).getTime();
            }

            // Xử lý thời gian user B
            if (b.last_login_time) {
                if (typeof b.last_login_time === "string") timeB = parseVietDate(b.last_login_time);
                else timeB = new Date(b.last_login_time).getTime();
            }

            // Sắp xếp giảm dần (mới nhất nổi lên trên)
            return timeB - timeA;
        });

        // BƯỚC 3: Render mảng đã sắp xếp bằng DOM API an toàn.
        userArray.forEach((data) => {
            userBody.appendChild(renderUserRow(data));
        });
    }, (error) => {
        console.error("Lỗi khi đọc dữ liệu users:", error);
        appendTableMessage(
            userBody,
            "Lỗi kết nối database. Vui lòng kiểm tra quyền Firebase Rules.",
            "no-data",
            "red"
        );
    });
}

// ==================== XÓA USER ====================
function deleteUser(uid, email) {
    if (!confirm(`Bạn có chắc chắn muốn xóa user ${email} (UID: ${uid})?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    const userRef = database.ref(`users/${uid}`);

    userRef.remove()
        .then(() => {
            alert(`Đã xóa user ${email} thành công!`);
            // Dữ liệu sẽ tự động cập nhật nhờ listener "value"
        })
        .catch((error) => {
            console.error("Lỗi khi xóa user:", error);
            alert("Xóa thất bại: " + error.message);
        });
}

// ==================== ĐĂNG XUẤT ====================
function logout() {
    if (confirm("Bạn muốn đăng xuất khỏi Admin Panel?")) {
        auth.signOut().then(() => {
            window.location.href = "../index.html"; // Điều hướng về trang chủ
        }).catch((error) => {
            console.error("Lỗi đăng xuất:", error);
        });
    }
}

// ==================== KHỞI ĐỘNG ====================
window.onload = function() {
    checkAuth();
    const closeHistoryButton = document.getElementById("closeHistoryModalBtn");
    closeHistoryButton.addEventListener("click", closeHistoryModal);
    document.addEventListener('keydown', event => {
        if (document.getElementById('historyModal').style.display !== 'flex') return;
        if (event.key === 'Escape') { event.preventDefault(); closeHistoryModal(); }
        if (event.key === 'Tab') { event.preventDefault(); closeHistoryButton.focus(); }
    });
};

// ==================== QUẢN LÝ BỘ ĐẾM ONLINE ====================
function initOnlineConfig() {
    const configRef = database.ref("settings/online_counter");
    
    // Lắng nghe dữ liệu để hiển thị lên nút bấm
    configRef.on("value", (snapshot) => {
        const data = snapshot.val() || { isAutoMode: true, min: 40, max: 50 };
        document.getElementById("autoModeToggle").checked = data.isAutoMode;
        document.getElementById("manualMin").value = data.min;
        document.getElementById("manualMax").value = data.max;
        
        // Làm mờ khu vực nhập tay nếu đang bật auto
        document.getElementById("manualSettings").style.opacity = data.isAutoMode ? "0.4" : "1";
        document.getElementById("manualSettings").style.pointerEvents = data.isAutoMode ? "none" : "auto";
        document.getElementById('manualMin').disabled = Boolean(data.isAutoMode);
        document.getElementById('manualMax').disabled = Boolean(data.isAutoMode);
    }, error => showConfigStatus('Không thể tải cấu hình.', true));
}

let configStatusTimer;
function showConfigStatus(message, failed = false) {
    const status = document.getElementById('saveStatus');
    status.textContent = message;
    status.style.color = failed ? '#dc2626' : '#10b981';
    status.style.opacity = '1';
    clearTimeout(configStatusTimer);
    if (!failed) configStatusTimer = setTimeout(() => status.style.opacity = '0', 2000);
}

// Gửi lệnh lên Firebase mỗi khi Admin gạt công tắc hoặc sửa số
window.updateOnlineConfig = function() {
    const isAutoMode = document.getElementById("autoModeToggle").checked;
    const min = parseInt(document.getElementById("manualMin").value) || 0;
    const max = parseInt(document.getElementById("manualMax").value) || 0;

    if (min < 0 || max < min) {
        showConfigStatus('Cần 0 ≤ Min ≤ Max.', true);
        return;
    }

    database.ref("settings/online_counter").set({ isAutoMode, min, max })
        .then(() => {
            showConfigStatus('Đã lưu!');
        }).catch(() => showConfigStatus('Không thể lưu. Vui lòng thử lại.', true));
}

// ==================== XEM LỊCH SỬ ĐĂNG NHẬP ====================
let historyTrigger = null;
let historyRequest = 0;
window.viewLoginHistory = function(uid, email) {
    const request = ++historyRequest;
    historyTrigger = document.activeElement;
    const modalTitle = document.getElementById("modalTitle");
    const historyList = document.getElementById("historyList");
    const loadingItem = document.createElement("li");
    const emailText = document.createElement("span");
    modalTitle.textContent = "Lịch sử: ";
    emailText.textContent = displayText(email, "N/A");
    modalTitle.appendChild(emailText);
    clearElement(historyList);
    loadingItem.textContent = "Đang tải dữ liệu...";
    historyList.appendChild(loadingItem);
    document.getElementById("historyModal").style.display = "flex";
    document.getElementById('closeHistoryModalBtn').focus();

    // Rút hồ sơ lịch sử từ Firebase
    database.ref(`users/${uid}/login_history`).once("value").then((snapshot) => {
        if (request !== historyRequest) return;
        clearElement(historyList);

        if (!snapshot.exists()) {
            const emptyItem = document.createElement("li");
            emptyItem.style.color = "#64748b";
            emptyItem.textContent = "Chưa có lịch sử đăng nhập nào được ghi nhận.";
            historyList.appendChild(emptyItem);
            return;
        }

        const historyData = snapshot.val();
        // Lấy các mốc thời gian, đảo ngược mảng để hiện cái mới nhất lên đầu
        const times = Object.values(historyData).reverse();

        times.forEach((time) => {
            const li = document.createElement("li");
            li.textContent = displayText(time, "");
            historyList.appendChild(li);
        });
    }).catch(() => {
        if (request !== historyRequest) return;
        clearElement(historyList);
        const item = document.createElement('li');
        item.textContent = 'Không thể tải lịch sử. Vui lòng thử lại.';
        historyList.appendChild(item);
    });
};

function closeHistoryModal() {
    historyRequest++;
    document.getElementById("historyModal").style.display = "none";
    if (historyTrigger?.isConnected) historyTrigger.focus();
}
