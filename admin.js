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

// ==================== LOAD DANH SÁCH USER ====================
function loadUsers() {
    const userBody = document.getElementById("userBody");
    userBody.innerHTML = `<tr><td colspan="6" class="loading">Đang tải dữ liệu từ Realtime Database...</td></tr>`;

    const usersRef = database.ref("users");

    usersRef.on("value", (snapshot) => {
        userBody.innerHTML = ""; // Xóa loading

        if (!snapshot.exists()) {
            userBody.innerHTML = `<tr><td colspan="6" class="no-data">Chưa có người dùng nào.</td></tr>`;
            return;
        }

        // BƯỚC 1: Rút toàn bộ dữ liệu vào một mảng
        let userArray = [];
        snapshot.forEach((childSnapshot) => {
            userArray.push({
                uid: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // BƯỚC 2: Sắp xếp mảng theo thời gian đăng nhập mới nhất lên đầu
        userArray.sort((a, b) => {
            let timeA = 0;
            let timeB = 0;
            
            // Xử lý thời gian user A
            if (a.last_login_time) {
                if (typeof a.last_login_time === 'string') timeA = parseVietDate(a.last_login_time);
                else timeA = new Date(a.last_login_time).getTime();
            }
            
            // Xử lý thời gian user B
            if (b.last_login_time) {
                if (typeof b.last_login_time === 'string') timeB = parseVietDate(b.last_login_time);
                else timeB = new Date(b.last_login_time).getTime();
            }
            
            // Sắp xếp giảm dần (mới nhất nổi lên trên)
            return timeB - timeA;
        });

        // BƯỚC 3: Render mảng đã sắp xếp ra bảng (giữ nguyên logic render của sếp)
        userArray.forEach((data) => {
            const uid = data.uid;

            // Tạo dòng bảng
            const row = document.createElement("tr");

           // Xử lý thời gian an toàn (Chấp cả Data mới dạng chữ và Data cũ dạng số)
            let lastLogin = "Chưa có";
            if (data.last_login_time) {
                if (typeof data.last_login_time === 'string') {
                    lastLogin = data.last_login_time; // auth.js lưu chữ đẹp rồi thì xài luôn
                } else {
                    lastLogin = new Date(data.last_login_time).toLocaleString("vi-VN"); // Backup cho data cũ
                }
            }

            // Xử lý huy hiệu Online / Offline
            let statusBadge = data.status === 'online' 
                ? '<span style="background: #ecfdf5; color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">🟢 Đang hoạt động</span>' 
                : '<span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">⚪ Offline</span>';

            row.innerHTML = `
                <td><strong>${data.email || "N/A"}</strong></td>
                <td>${data.name || "Chưa cập nhật"}</td>
                <td>${statusBadge}</td>
                <td class="timestamp">${lastLogin}</td>
                <td>${data.device_type || "Unknown"}</td>
                <td>
                    <button class="delete-btn" onclick="deleteUser('${uid}', '${data.email || ''}')">Xóa</button>
                    <button class="view-btn" onclick="viewLoginHistory('${uid}', '${data.email || ''}')">Xem Lịch Sử</button>
                </td>
            `;

            userBody.appendChild(row);
        });
    }, (error) => {
        console.error("Lỗi khi đọc dữ liệu users:", error);
        userBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Lỗi kết nối database. Vui lòng kiểm tra quyền Firebase Rules.</td></tr>`;
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
    });
}

// Gửi lệnh lên Firebase mỗi khi Admin gạt công tắc hoặc sửa số
window.updateOnlineConfig = function() {
    const isAutoMode = document.getElementById("autoModeToggle").checked;
    const min = parseInt(document.getElementById("manualMin").value) || 0;
    const max = parseInt(document.getElementById("manualMax").value) || 0;

    database.ref("settings/online_counter").set({ isAutoMode, min, max })
        .then(() => {
            const status = document.getElementById("saveStatus");
            status.style.opacity = "1";
            setTimeout(() => status.style.opacity = "0", 2000);
        });
}

// ==================== XEM LỊCH SỬ ĐĂNG NHẬP ====================
window.viewLoginHistory = function(uid, email) {
    document.getElementById('modalTitle').innerText = `Lịch sử: ${email}`;
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<li>Đang tải dữ liệu...</li>';
    document.getElementById('historyModal').style.display = 'flex';

    // Rút hồ sơ lịch sử từ Firebase
    database.ref(`users/${uid}/login_history`).once('value', (snapshot) => {
        historyList.innerHTML = ''; 
        
        if (!snapshot.exists()) {
            historyList.innerHTML = '<li style="color:#64748b;">Chưa có lịch sử đăng nhập nào được ghi nhận.</li>';
            return;
        }

        const historyData = snapshot.val();
        // Lấy các mốc thời gian, đảo ngược mảng để hiện cái mới nhất lên đầu
        const times = Object.values(historyData).reverse(); 
        
        times.forEach(time => {
            const li = document.createElement('li');
            li.innerText = time;
            historyList.appendChild(li);
        });
    });
};

window.closeHistoryModal = function() {
    document.getElementById('historyModal').style.display = 'none';
};