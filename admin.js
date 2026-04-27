// ==================== CONFIG FIREBASE ====================
// THAY ĐỔI: Chỉ thay YOUR_PROJECT_ID, giữ nguyên authDomain theo yêu cầu
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",                    // ← Thay bằng apiKey của bạn
    authDomain: "tuananh-6b0a0.firebaseapp.com",  // ← BẮT BUỘC giữ định dạng này
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com", // ← Thay nếu cần
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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
    });
}

// ==================== LOAD DANH SÁCH USER ====================
function loadUsers() {
    const userBody = document.getElementById("userBody");
    userBody.innerHTML = `<tr><td colspan="5" class="loading">Đang tải dữ liệu từ Realtime Database...</td></tr>`;

    const usersRef = database.ref("users");

    usersRef.on("value", (snapshot) => {
        userBody.innerHTML = ""; // Xóa loading

        if (!snapshot.exists()) {
            userBody.innerHTML = `<tr><td colspan="5" class="no-data">Chưa có người dùng nào.</td></tr>`;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const uid = childSnapshot.key;
            const data = childSnapshot.val();

            // Tạo dòng bảng
            const row = document.createElement("tr");

            const lastLogin = data.last_login_time 
                ? new Date(data.last_login_time).toLocaleString("vi-VN") 
                : "Chưa có";

            row.innerHTML = `
                <td><strong>${data.email || "N/A"}</strong></td>
                <td>${data.name || "Chưa cập nhật"}</td>
                <td class="timestamp">${lastLogin}</td>
                <td>${data.device_type || "Unknown"}</td>
                <td>
                    <button class="delete-btn" onclick="deleteUser('${uid}', '${data.email || ''}')">
                        Xóa User
                    </button>
                </td>
            `;

            userBody.appendChild(row);
        });
    }, (error) => {
        console.error("Lỗi khi đọc dữ liệu users:", error);
        userBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Lỗi kết nối database. Vui lòng kiểm tra quyền Firebase Rules.</td></tr>`;
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
