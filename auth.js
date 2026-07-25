// ===============================
// 🔐 CORE AUTH (Firebase)
// ===============================
const firebaseConfig = {
    apiKey: "AIzaSyAumlNTtA9jjwTTvQzRGEKkPnVbYcsd-TA",
    authDomain: "kienthucsinhvien.id.vn",
    databaseURL: "https://tuananh-6b0a0-default-rtdb.firebaseio.com",
    projectId: "tuananh-6b0a0",
    storageBucket: "tuananh-6b0a0.firebasestorage.app",
    messagingSenderId: "935684041177",
    appId: "1:935684041177:web:f2cfe5dbc27275d8c611c8"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();


// ===============================
// 📊 TRACKING (Thiết bị + User)
// ===============================
function detectDevice(userAgent) {
    let device = "Khác/Desktop";
    
    // 1. Check hệ điều hành & Thiết bị Apple/Android/Win
    if (/iPhone/i.test(userAgent)) device = "📱 iPhone";
    else if (/iPad/i.test(userAgent)) device = "📿 iPad";
    else if (/Macintosh/i.test(userAgent)) device = "💻 Máy Mac";
    else if (/Android/i.test(userAgent)) {
        const match = userAgent.match(/Android\s+[0-9\.]+(?:;\s+([^;]+)\s+Build)?/i);
        const model = (match && match[1]) ? ` [Mã máy: ${match[1].trim()}]` : "";
        device = "🤖 Android" + model;
    }
    else if (/Windows/i.test(userAgent)) device = "🖥️ Windows PC";
    else if (/Linux/i.test(userAgent)) device = "🐧 Linux";

    // 2. Check trình duyệt
    let browser = "Trình duyệt lạ";
    if (/Edg/i.test(userAgent)) browser = "Edge";
    else if (/Chrome|CriOS/i.test(userAgent)) browser = "Chrome";
    else if (/Firefox|FxiOS/i.test(userAgent)) browser = "Firefox";
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";

    return `${device} (Dùng ${browser})`;
}

function saveUserInfo(user) {
    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    
    const data = {
        name: user.displayName,
        email: user.email,
        device_type: detectDevice(navigator.userAgent), // Đã gọi hàm dò thiết bị xịn
        last_login_time: now 
    };

    // 1. Cập nhật thông tin cơ bản & Thời gian đăng nhập cuối
    db.ref("users/" + user.uid).update(data).catch(console.error);

    // 2. Ghi chú vào sổ Lịch sử đăng nhập
    db.ref("users/" + user.uid + "/login_history").push(now).catch(console.error);
}


// ===============================
// 🎨 UI HANDLERS
// ===============================
function showLoading() {
    let loader = document.getElementById("global-loader");
    if (loader) return;

    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.className = "fixed inset-0 flex items-center justify-center bg-white z-[999]";

    loader.innerHTML = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3"></div>
            <p class="text-sm text-stone-500 font-bold">Edu Connect đang tải...</p>
        </div>
    `;

    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById("global-loader");
    if (loader) loader.remove();
}

function updateNavbar(user) {
    const loginBtn = document.getElementById("nav-login-btn");
    const profile = document.getElementById("nav-user-profile");

    if (user) {
        loginBtn?.classList.add("hidden");
        profile?.classList.remove("hidden");

        // Đã sửa lại lỗi ngữ pháp ở 4 dòng dưới đây:
        const avatarEl = document.getElementById("user-avatar");
        const nameEl = document.getElementById("user-name");
        
        if (avatarEl) avatarEl.setAttribute("src", user.photoURL);
        if (nameEl) nameEl.innerText = user.displayName;
    } else {
        loginBtn?.classList.remove("hidden");
        profile?.classList.add("hidden");
    }
}

function showWelcomeModal() {
    const modal = document.getElementById("welcome-modal");
    if (!modal) return false;

    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0");
        document.getElementById("welcome-modal-content")?.classList.remove("scale-95");
    }, 10);
    return true;
}

function hideWelcomeModal() {
    const currentPath = window.location.pathname.toLowerCase();
    const isHomePage = currentPath.endsWith('index.html') || currentPath === '/';

    // Nếu ở trang môn học MÀ chưa đăng nhập -> Chặn không cho tắt, đá về trang chủ
    if (!isHomePage && !firebase.auth().currentUser) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("welcome-modal")?.classList.add("hidden");
}


// ===============================
// 🔑 AUTH ACTIONS
// ===============================
let loginInFlight = null;

function handleGoogleSignInError(error) {
    if (error?.code === "auth/popup-closed-by-user"
        || error?.code === "auth/cancelled-popup-request") {
        console.info("Google Sign-In đã được người dùng đóng.");
        return null;
    }

    console.error("Google Sign-In failed:", error);
    alert("Lỗi đăng nhập: " + (error?.message || "Không xác định"));
    return null;
}

window.loginGoogleReal = () => {
    if (loginInFlight) return loginInFlight;

    try {
        loginInFlight = Promise.resolve(auth.signInWithPopup(provider))
            .catch(handleGoogleSignInError)
            .finally(() => {
                loginInFlight = null;
            });
    } catch (error) {
        handleGoogleSignInError(error);
        return Promise.resolve(null);
    }

    return loginInFlight;
};

window.requestLogin = () => {
    if (document.getElementById("welcome-modal")) {
        showWelcomeModal();
        return null;
    }

    return window.loginGoogleReal();
};

window.logoutReal = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) return false;

    try {
        await auth.signOut();
        localStorage.removeItem("onthi_role");
        window.location.href = "index.html";
        return true;
    } catch (error) {
        console.error("Sign-out failed:", error);
        alert("Không thể đăng xuất: " + (error?.message || "Không xác định"));
        return false;
    }
};

window.continueAsGuest = () => {
    const currentPath = window.location.pathname.toLowerCase();
    const isHomePage = currentPath.endsWith('index.html') || currentPath === '/';

    if (isHomePage) {
        // Ở trang chủ thì cho làm khách thoải mái
        localStorage.setItem("onthi_role", "guest");
        hideWelcomeModal();
    } else {
        // Lỡ có ở môn học mà cố bấm vô nút Khách -> Đá về sảnh
        window.location.href = "index.html";
    }
};



// ==========================================
// 🚀 MAIN FLOW: QUẢN LÝ ĐĂNG NHẬP & RADAR (BẢN CHUẨN 100%)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged((user) => {
        const loginBtn = document.getElementById('nav-login-btn');
        const userProfile = document.getElementById('nav-user-profile');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        const welcomeModal = document.getElementById('welcome-modal');

        if (user) {
            // ✅ TRẠNG THÁI: ĐÃ ĐĂNG NHẬP
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userProfile) {
                userProfile.classList.remove('hidden');
                userProfile.classList.add('flex');
            }
            if (userName) userName.innerText = user.displayName || 'Sinh Viên';
            if (userAvatar) userAvatar.src = user.photoURL || '';
            if (welcomeModal) welcomeModal.classList.add('hidden');

            // Cấp quyền cho LocalStorage để đồng bộ hệ thống cũ
            localStorage.setItem("onthi_role", "member");

            // Chạy Radar theo dõi thiết bị
            if (typeof saveUserInfo === 'function') {
                saveUserInfo(user);
            }

            // 🔴 HỆ THỐNG RADAR ONLINE/OFFLINE (GIỮ NGUYÊN CỦA SẾP)
            const userRef = db.ref("users/" + user.uid);
            db.ref(".info/connected").on("value", (snap) => {
                if (snap.val() === true) {
                    userRef.onDisconnect().update({ status: "offline" }).then(() => {
                        userRef.update({ status: "online" });
                    });
                }
            });

        } else {
            // 🛑 TRẠNG THÁI: CHƯA ĐĂNG NHẬP
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userProfile) {
                userProfile.classList.add('hidden');
                userProfile.classList.remove('flex');
            }

            // Kiểm tra xem có đang ở trang môn học không để "khóa cửa"
            const currentPath = window.location.pathname.toLowerCase();
            const isHomePage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';
            
            if (!isHomePage && !currentPath.includes('admin.html') && welcomeModal) {
                showWelcomeModal();
            }
        }
    });
});

// ==========================================
// 🎛️ BỘ ĐẾM ONLINE (ĐƯỢC ĐIỀU KHIỂN TỪ ADMIN)
// ==========================================
let onlineInterval = null;

function startMockOnlineCounter() {
    const onlineEl = document.getElementById('online-count');
    // Nếu trang nào không có thẻ id="online-count" thì nó tự động bỏ qua, không báo lỗi
    if (!onlineEl) return; 

    // Khai báo mặc định đề phòng Firebase load chậm
    let config = { isAutoMode: true, min: 40, max: 50 };

    // Lắng nghe lệnh từ Admin thông qua biến 'db' đã có sẵn ở đầu file
    db.ref("settings/online_counter").on("value", (snapshot) => {
        if (snapshot.exists()) config = snapshot.val();
        updateDisplay(); // Cập nhật số lên màn hình ngay lập tức khi Admin gạt công tắc
    });

    function updateDisplay() {
        let count = 0;
        if (!config.isAutoMode) {
            count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        } else {
            const hr = new Date().getHours();
            let min, max;
            if (hr >= 19 && hr <= 23) { min = 1200; max = 2000; }
            else if (hr >= 0 && hr <= 6) { min = 50; max = 150; }
            else { min = 300; max = 800; }
            
            count = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        // 👉 CẬP NHẬT CHO CẢ PC VÀ MOBILE Ở ĐÂY NÈ:
        if (onlineEl) onlineEl.innerText = count;
        
        const mobileOnlineEl = document.getElementById('mobile-online-count');
        if (mobileOnlineEl) mobileOnlineEl.innerText = count;
    }

    // Tự động múa số sau mỗi 5 - 10 giây (random) để tạo cảm giác chân thật
    if (onlineInterval) clearInterval(onlineInterval);
    onlineInterval = setInterval(updateDisplay, Math.floor(Math.random() * 5000) + 5000);
}

// Kích hoạt khi web tải xong
window.addEventListener('load', startMockOnlineCounter);

// ===============================
// ⏱️ HỆ THỐNG AUTO LOGOUT KHI TREO MÁY CỦA ADMIN
// ===============================

// Sếp muốn đổi thành 12 hay 48 tiếng thì cứ sửa số 24 ở dòng dưới nha:
const IDLE_TIMEOUT_HOURS = 24; 
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_HOURS * 60 * 60 * 1000;

// Hàm này chạy mỗi khi người dùng có thao tác (chứng tỏ họ còn sống)
function resetIdleTimer() {
    // Chỉ ghi nhận nếu đang có người đăng nhập
    if (firebase.auth().currentUser) {
        localStorage.setItem('last_active_time', Date.now());
    }
}

// Thằng bảo vệ đi tuần tra xem có ai treo máy lố giờ không
function checkIdleTime() {
    const lastActive = localStorage.getItem('last_active_time');
    if (lastActive && firebase.auth().currentUser) {
        const timeIdle = Date.now() - parseInt(lastActive);
        
        if (timeIdle > IDLE_TIMEOUT_MS) {
            // Treo máy quá 24h -> Kích hoạt lệnh Đăng xuất
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('last_active_time');
                localStorage.removeItem('onthi_role');
                alert(`Phiên đăng nhập đã hết hạn sau ${IDLE_TIMEOUT_HOURS} giờ không hoạt động để bảo mật. Sinh viên vui lòng đăng nhập lại nhé!`);
                window.location.reload();
            });
        }
    }
}

// Lắp camera theo dõi các hành động: Di chuột, gõ phím, cuộn trang, click chuột, và chạm màn hình (mobile)
['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetIdleTimer);
});

// Cứ mỗi 1 phút (60000 mili-giây), bảo vệ đi tuần tra 1 lần
setInterval(checkIdleTime, 60000);

