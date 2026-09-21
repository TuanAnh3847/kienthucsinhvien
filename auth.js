// Storage may be blocked in private/embedded browsers. Firebase remains authoritative.
const authStorage = (() => {
    const memory = new Map();
    let unavailable = false;
    return {
        getItem(key) {
            if (!unavailable) { try { const value = localStorage.getItem(key); if (value !== null) memory.set(key, value); else memory.delete(key); return value; } catch { unavailable = true; } }
            return memory.get(key) ?? null;
        },
        setItem(key, value) { memory.set(key, String(value)); if (!unavailable) { try { localStorage.setItem(key, value); } catch { unavailable = true; } } },
        removeItem(key) { memory.delete(key); if (!unavailable) { try { localStorage.removeItem(key); } catch { unavailable = true; } } }
    };
})();

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

    // Cập nhật profile và thời gian hoạt động khi khôi phục hoặc thay đổi session.
    db.ref("users/" + user.uid).update(data).catch(console.error);
}

function recordLoginHistory(user) {
    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    return db.ref("users/" + user.uid + "/login_history").push(now);
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
        profile?.classList.add("flex");

        // Đã sửa lại lỗi ngữ pháp ở 4 dòng dưới đây:
        const avatarEl = document.getElementById("user-avatar");
        const nameEl = document.getElementById("user-name");
        
        if (avatarEl) avatarEl.setAttribute("src", user.photoURL || "/android-chrome-192x192.png");
        if (nameEl) nameEl.innerText = user.displayName || "Sinh Viên";
    } else {
        loginBtn?.classList.remove("hidden");
        profile?.classList.add("hidden");
        profile?.classList.remove("flex");
    }
}

function isHomePage() {
    return ['/', '/index', '/index.html', ''].includes(window.location.pathname.toLowerCase().replace(/\/$/, '') || '/');
}

let welcomeTrigger = null;
function showWelcomeModal() {
    const modal = document.getElementById("welcome-modal");
    if (!modal) return false;

    if (modal.classList.contains('hidden')) welcomeTrigger = document.activeElement;
    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0");
        document.getElementById("welcome-modal-content")?.classList.remove("scale-95");
        if (!modal.classList.contains('hidden')) modal.querySelector('button')?.focus();
    }, 10);
    return true;
}

function hideWelcomeModal() {
    // Nếu ở trang môn học MÀ chưa đăng nhập -> Chặn không cho tắt, đá về trang chủ
    if (!isHomePage() && !auth.currentUser) {
        window.location.href = "/";
        return;
    }

    document.getElementById("welcome-modal")?.classList.add("hidden");
    if (welcomeTrigger?.isConnected && welcomeTrigger !== document.body) welcomeTrigger.focus();
    else document.getElementById(auth.currentUser ? 'nav-user-profile' : 'nav-login-btn')?.focus();
}

document.addEventListener('keydown', event => {
    const modal = document.getElementById('welcome-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        hideWelcomeModal();
    } else if (event.key === 'Tab') {
        const controls = [...modal.querySelectorAll('button, a[href], input, select, [tabindex="0"]')]
            .filter(el => !el.disabled && el.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) return;
        if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
            event.preventDefault(); first.focus();
        }
    }
});


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
            .then(async (credential) => {
                if (!credential?.user) return credential;
                authStorage.setItem('last_active_time', Date.now());

                try {
                    await recordLoginHistory(credential.user);
                } catch (error) {
                    console.error("Không thể ghi lịch sử đăng nhập:", error);
                }

                return credential;
            })
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
        await releasePresence();
        await auth.signOut();
        authStorage.removeItem("onthi_role");
        authStorage.removeItem('last_active_time');
        window.location.href = "/";
        return true;
    } catch (error) {
        if (auth.currentUser) startPresence(auth.currentUser);
        console.error("Sign-out failed:", error);
        alert("Không thể đăng xuất: " + (error?.message || "Không xác định"));
        return false;
    }
};

window.continueAsGuest = () => {
    if (isHomePage()) {
        // Ở trang chủ thì cho làm khách thoải mái
        authStorage.setItem("onthi_role", "guest");
        hideWelcomeModal();
    } else {
        // Lỡ có ở môn học mà cố bấm vô nút Khách -> Đá về sảnh
        window.location.href = "/";
    }
};



// ==========================================
// 🚀 MAIN FLOW: QUẢN LÝ ĐĂNG NHẬP & RADAR (BẢN CHUẨN 100%)
// ==========================================
let presence = null;

async function stopPresence(markOffline = false) {
    const previous = presence;
    presence = null;
    if (!previous) return;
    previous.connectedRef.off('value', previous.listener);
    try {
        // Keep the disconnect fallback if the explicit offline write fails.
        if (markOffline) await previous.userRef.update({ status: 'offline' });
        await previous.userRef.onDisconnect().cancel();
    } catch (error) {
        console.warn('Không thể cập nhật trạng thái offline:', error);
    }
}

function releasePresence() {
    // Realtime Database queues writes while offline; logout must still finish.
    return Promise.race([stopPresence(true), new Promise(resolve => setTimeout(resolve, 1500))]);
}

function startPresence(user) {
    if (presence?.uid === user.uid) return;
    const current = {
        uid: user.uid,
        userRef: db.ref('users/' + user.uid),
        connectedRef: db.ref('.info/connected')
    };
    presence = current;
    current.listener = async snap => {
        if (snap.val() !== true || presence !== current || auth.currentUser?.uid !== user.uid) return;
        try {
            await current.userRef.onDisconnect().update({ status: 'offline' });
            if (presence === current && auth.currentUser?.uid === user.uid) {
                await current.userRef.update({ status: 'online' });
            }
        } catch (error) {
            console.warn('Không thể cập nhật trạng thái online:', error);
        }
    };
    current.connectedRef.on('value', current.listener, error => console.warn('Kết nối trạng thái:', error));
}

function initializeAuthUI() {
    document.getElementById('nav-user-profile')?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            window.logoutReal();
        }
    });
    auth.onAuthStateChanged(user => {
        if (presence && presence.uid !== user?.uid) void stopPresence();
        updateNavbar(user);
        if (user) {
            const lastActive = Number(authStorage.getItem('last_active_time'));
            if (lastActive > 0 && Date.now() - lastActive > IDLE_TIMEOUT_MS) {
                void checkIdleTime();
                return;
            }
            if (!Number.isFinite(lastActive) || lastActive <= 0) resetIdleTimer();
            authStorage.setItem('onthi_role', 'member');
            const modal = document.getElementById('welcome-modal');
            if (modal && !modal.classList.contains('hidden')) hideWelcomeModal();
            saveUserInfo(user);
            startPresence(user);
        } else {
            if (authStorage.getItem('onthi_role') === 'member') authStorage.removeItem('onthi_role');
            authStorage.removeItem('last_active_time');
            if (!isHomePage() && document.getElementById('welcome-modal')) showWelcomeModal();
        }
    }, error => {
        console.warn('Không thể khôi phục phiên đăng nhập:', error);
        updateNavbar(null);
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAuthUI, { once: true });
else queueMicrotask(initializeAuthUI);

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
        if (snapshot.exists()) {
            const value = snapshot.val() || {};
            const min = Number(value.min), max = Number(value.max);
            config = {
                isAutoMode: value.isAutoMode !== false,
                min: Number.isFinite(min) && min >= 0 ? Math.floor(min) : 40,
                max: Number.isFinite(max) && max >= 0 ? Math.floor(max) : 50
            };
            config.max = Math.max(config.min, config.max);
        }
        updateDisplay(); // Cập nhật số lên màn hình ngay lập tức khi Admin gạt công tắc
    }, error => console.warn('Không thể tải cấu hình bộ đếm:', error));

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

    updateDisplay();
    // Tự động múa số sau mỗi 5 - 10 giây (random) để tạo cảm giác chân thật
    if (onlineInterval) clearInterval(onlineInterval);
    onlineInterval = setInterval(updateDisplay, Math.floor(Math.random() * 5000) + 5000);
}

// Kích hoạt khi web tải xong
window.addEventListener('load', startMockOnlineCounter);
if (document.readyState === 'complete') queueMicrotask(startMockOnlineCounter);

// ===============================
// ⏱️ HỆ THỐNG AUTO LOGOUT KHI TREO MÁY CỦA ADMIN
// ===============================

// Sếp muốn đổi thành 12 hay 48 tiếng thì cứ sửa số 24 ở dòng dưới nha:
const IDLE_TIMEOUT_HOURS = 24; 
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_HOURS * 60 * 60 * 1000;

// Hàm này chạy mỗi khi người dùng có thao tác (chứng tỏ họ còn sống)
function resetIdleTimer() {
    // Chỉ ghi nhận nếu đang có người đăng nhập
    if (auth.currentUser && !idleLogoutInFlight) {
        authStorage.setItem('last_active_time', Date.now());
    }
}

// Thằng bảo vệ đi tuần tra xem có ai treo máy lố giờ không
let idleLogoutInFlight = false;
async function checkIdleTime() {
    const lastActive = authStorage.getItem('last_active_time');
    if (lastActive && auth.currentUser && !idleLogoutInFlight) {
        const timeIdle = Date.now() - parseInt(lastActive);
        
        if (timeIdle > IDLE_TIMEOUT_MS) {
            // Treo máy quá 24h -> Kích hoạt lệnh Đăng xuất
            idleLogoutInFlight = true;
            try {
                await releasePresence();
                await auth.signOut();
                authStorage.removeItem('last_active_time');
                authStorage.removeItem('onthi_role');
                alert(`Phiên đăng nhập đã hết hạn sau ${IDLE_TIMEOUT_HOURS} giờ không hoạt động để bảo mật. Sinh viên vui lòng đăng nhập lại nhé!`);
                window.location.reload();
            } catch (error) {
                console.warn('Không thể đăng xuất phiên hết hạn:', error);
                if (auth.currentUser) startPresence(auth.currentUser);
            } finally {
                idleLogoutInFlight = false;
            }
        }
    }
}

// Lắp camera theo dõi các hành động: Di chuột, gõ phím, cuộn trang, click chuột, và chạm màn hình (mobile)
['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetIdleTimer, { passive: true });
});

// Cứ mỗi 1 phút (60000 mili-giây), bảo vệ đi tuần tra 1 lần
setInterval(checkIdleTime, 60000);

