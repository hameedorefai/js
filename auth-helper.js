// ملف مساعد لإدارة المصادقة في الصفحات الأخرى - موقع زمايل

class AuthHelper {
    constructor() {
        this.checkAuthStatus();
        this.setupAuthUI();
    }

    // التحقق من حالة المصادقة
    checkAuthStatus() {
        const token = localStorage.getItem('userToken');
        const tokenExpires = localStorage.getItem('tokenExpires');
        
        if (token && tokenExpires) {
            const now = new Date();
            const expiresDate = new Date(tokenExpires);
            
            if (now < expiresDate) {
                // Token صالح
                this.isAuthenticated = true;
                this.userName = localStorage.getItem('userName');
                this.username = localStorage.getItem('username');
            } else {
                // Token منتهي الصلاحية
                this.clearSession();
                this.isAuthenticated = false;
            }
        } else {
            this.isAuthenticated = false;
        }
    }

    // إعداد واجهة المستخدم للمصادقة
    setupAuthUI() {
        // البحث عن عناصر واجهة المستخدم للمصادقة
        const authButtons = document.querySelectorAll('[data-auth-action]');
        const userInfoElements = document.querySelectorAll('[data-user-info]');
        const protectedElements = document.querySelectorAll('[data-protected]');

        authButtons.forEach(button => {
            const action = button.getAttribute('data-auth-action');
            
            if (action === 'login') {
                button.addEventListener('click', () => this.redirectToLogin());
            } else if (action === 'logout') {
                button.addEventListener('click', () => this.logout());
            } else if (action === 'profile') {
                button.addEventListener('click', () => this.showProfile());
            }
        });

        // تحديث معلومات المستخدم
        userInfoElements.forEach(element => {
            const infoType = element.getAttribute('data-user-info');
            if (this.isAuthenticated) {
                if (infoType === 'name') {
                    element.textContent = this.userName;
                } else if (infoType === 'username') {
                    element.textContent = this.username;
                }
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });

        // إظهار/إخفاء العناصر المحمية
        protectedElements.forEach(element => {
            if (this.isAuthenticated) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });

        // تحديث أزرار المصادقة
        this.updateAuthButtons();
    }

    // تحديث أزرار المصادقة
    updateAuthButtons() {
        const loginButtons = document.querySelectorAll('[data-auth-action="login"]');
        const logoutButtons = document.querySelectorAll('[data-auth-action="logout"]');
        const profileButtons = document.querySelectorAll('[data-auth-action="profile"]');

        if (this.isAuthenticated) {
            // إخفاء أزرار تسجيل الدخول
            loginButtons.forEach(btn => btn.style.display = 'none');
            
            // إظهار أزرار تسجيل الخروج والملف الشخصي
            logoutButtons.forEach(btn => btn.style.display = 'inline-block');
            profileButtons.forEach(btn => btn.style.display = 'inline-block');
        } else {
            // إظهار أزرار تسجيل الدخول
            loginButtons.forEach(btn => btn.style.display = 'inline-block');
            
            // إخفاء أزرار تسجيل الخروج والملف الشخصي
            logoutButtons.forEach(btn => btn.style.display = 'none');
            profileButtons.forEach(btn => btn.style.display = 'none');
        }
    }

    // التوجيه لصفحة تسجيل الدخول
    redirectToLogin() {
        window.location.href = '/login.html';
    }

    // تسجيل الخروج
    logout() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            this.clearSession();
            window.location.reload();
        }
    }

    // عرض الملف الشخصي
    showProfile() {
        if (this.isAuthenticated) {
            alert(`مرحباً ${this.userName}!\nاسم المستخدم: ${this.username}`);
        }
    }

    // مسح الجلسة
    clearSession() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('username');
        localStorage.removeItem('tokenExpires');
        // لا نمسح بيانات تسجيل الدخول المحفوظة عند تسجيل الخروج
        // فقط عند إلغاء تحديد checkbox "حفظ بيانات تسجيل الدخول"
        this.isAuthenticated = false;
    }

    // التحقق من صحة التوكن
    isTokenValid() {
        return this.isAuthenticated;
    }

    // الحصول على التوكن
    getToken() {
        return localStorage.getItem('userToken');
    }

    // الحصول على اسم المستخدم
    getUserName() {
        return this.userName;
    }

    // الحصول على اسم المستخدم الفني
    getUsername() {
        return this.username;
    }

    // إضافة header للمصادقة للطلبات
    getAuthHeaders() {
        const token = this.getToken();
        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }
        return {
            'Content-Type': 'application/json'
        };
    }

    // طلب محمي (يتطلب مصادقة)
    async authenticatedRequest(url, options = {}) {
        if (!this.isAuthenticated) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        const headers = this.getAuthHeaders();
        const requestOptions = {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (response.status === 401) {
                // التوكن غير صالح
                this.clearSession();
                this.redirectToLogin();
                throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
            }
            
            return response;
        } catch (error) {
            console.error('خطأ في الطلب المحمي:', error);
            logError(error.message || 'Error in authenticated request', 'authenticatedRequest - auth-helper.js');
            throw error;
        }
    }

    // حماية الصفحة (التوجيه لصفحة تسجيل الدخول إذا لم يكن مسجل)
    protectPage() {
        if (!this.isAuthenticated) {
            this.redirectToLogin();
        }
    }

    // إضافة عناصر واجهة المستخدم للمصادقة
    addAuthUI() {
        // إضافة أزرار المصادقة للقائمة
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const authContainer = document.createElement('li');
            authContainer.className = 'nav-item dropdown';
            authContainer.innerHTML = this.getAuthDropdownHTML();
            navbar.appendChild(authContainer);
        }
    }

    // الحصول على HTML للقائمة المنسدلة للمصادقة
    getAuthDropdownHTML() {
        if (this.isAuthenticated) {
            return `
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i> ${this.userName}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" data-auth-action="profile">
                        <i class="fas fa-user-circle"></i> الملف الشخصي
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" data-auth-action="logout">
                        <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                    </a></li>
                </ul>
            `;
        } else {
            return `
                <a class="nav-link" href="#" data-auth-action="login">
                    <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                </a>
            `;
        }
    }

    // تحديث حالة المصادقة
    refreshAuthStatus() {
        this.checkAuthStatus();
        this.setupAuthUI();
    }
}

// تهيئة المساعد عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.authHelper = new AuthHelper();
});

// تصدير الكلاس للاستخدام العام
window.AuthHelper = AuthHelper;

// دوال مساعدة للاستخدام المباشر
window.checkAuth = function() {
    return window.authHelper && window.authHelper.isAuthenticated;
};

window.getAuthToken = function() {
    return window.authHelper ? window.authHelper.getToken() : null;
};

window.logout = function() {
    if (window.authHelper) {
        window.authHelper.logout();
    }
};

window.protectPage = function() {
    if (window.authHelper) {
        window.authHelper.protectPage();
    }
};
