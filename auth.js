// ملف إدارة المصادقة - موقع زمايل

class AuthManager {
    constructor() {
        this.branches = [];
        this.majors = [];
        this.apiBaseUrl = 'https://zamayl7.azurewebsites.net/api';
        this.init();
    }

    // تهيئة المدير
    init() {
        this.loadRegistrationData();
        this.setupEventListeners();
        this.checkExistingSession();
    }

    // تحميل البيانات المطلوبة للتسجيل
    async loadRegistrationData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/LoginPageDetailsRequired/QOU`);
            const data = await response.json();
            
            this.branches = data.branches;
            this.majors = data.majors;
            
            this.populateBranches();
            this.populateMajors();
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            logError(error.message || 'Error loading registration data', 'loadRegistrationData - auth.js');
            this.showAlert('register', 'حدث خطأ في تحميل البيانات المطلوبة', 'danger');
        }
    }

    // ملء قائمة الفروع
    populateBranches() {
        const branchSelect = document.getElementById('registerBranch');
        if (!branchSelect) return;

        branchSelect.innerHTML = '<option value="">اختر الفرع</option>';
        this.branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.branchId;
            option.textContent = branch.arabicBranchName;
            branchSelect.appendChild(option);
        });
    }

    // ملء قائمة التخصصات
    populateMajors() {
        const majorSelect = document.getElementById('registerMajor');
        if (!majorSelect) return;

        majorSelect.innerHTML = '<option value="">اختر التخصص</option>';
        this.majors.forEach(major => {
            const option = document.createElement('option');
            option.value = major.majorId;
            option.textContent = major.arabicMajorName;
            majorSelect.appendChild(option);
        });
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    // التحقق من الجلسة الموجودة
    checkExistingSession() {
        const token = localStorage.getItem('userToken');
        const tokenExpires = localStorage.getItem('tokenExpires');
        
        if (token && tokenExpires) {
            const now = new Date();
            const expiresDate = new Date(tokenExpires);
            
            if (now < expiresDate) {
                // Token صالح، التوجيه للصفحة الرئيسية
                window.location.href = '/';
            } else {
                // Token منتهي الصلاحية، حذفه
                this.clearSession();
            }
        }
    }

    // معالجة تسجيل الدخول
    async handleLogin(event) {
        event.preventDefault();
        
        const studentID = document.getElementById('loginStudentID').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        
        if (!studentID || !password) {
            this.showAlert('login', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
            return;
        }
        
        this.setLoadingState(btn, true);
        this.hideAlerts();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/User/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': '*/*'
                },
                body: JSON.stringify({
                    studentID: studentID,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.saveSession(data);
                this.showAlert('login', 'تم تسجيل الدخول بنجاح! جاري التوجيه...', 'success');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                
            } else {
                this.showAlert('login', data.message || 'فشل في تسجيل الدخول', 'danger');
            }
            
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            logError(error.message || 'Error during login', 'handleLogin - auth.js');
            this.showAlert('login', 'حدث خطأ في الاتصال بالخادم', 'danger');
        } finally {
            this.setLoadingState(btn, false);
        }
    }

    // معالجة التسجيل
    async handleRegister(event) {
        event.preventDefault();
        
        const formData = this.getRegisterFormData();
        const btn = document.getElementById('registerBtn');
        
        if (!this.validateRegisterForm(formData)) {
            return;
        }
        
        this.setLoadingState(btn, true);
        this.hideAlerts();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/User/register-qou-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': '*/*'
                },
                body: JSON.stringify({
                    studentID: formData.studentID,
                    fullName: formData.fullName,
                    majorID: parseInt(formData.majorId),
                    user: {
                        password: formData.password,
                        gender: formData.gender
                    }
                })
            });
            
            const data = await response.json();
            
            if (response.ok || response.status === 201) {
                this.showAlert('register', 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
                
                // مسح النموذج
                document.getElementById('registerForm').reset();
                
                // التبديل لصفحة تسجيل الدخول
                setTimeout(() => {
                    this.switchTab('login');
                    document.getElementById('loginStudentID').value = formData.studentID;
                }, 2000);
                
            } else {
                this.showAlert('register', data.message || 'فشل في إنشاء الحساب', 'danger');
            }
            
        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            logError(error.message || 'Error during registration', 'handleRegister - auth.js');
            this.showAlert('register', 'حدث خطأ في الاتصال بالخادم', 'danger');
        } finally {
            this.setLoadingState(btn, false);
        }
    }

    // الحصول على بيانات نموذج التسجيل
    getRegisterFormData() {
        return {
            studentID: document.getElementById('registerStudentID').value,
            fullName: document.getElementById('registerFullName').value,
            branchId: document.getElementById('registerBranch').value,
            majorId: document.getElementById('registerMajor').value,
            password: document.getElementById('registerPassword').value,
            gender: document.getElementById('registerGender').value
        };
    }

    // التحقق من صحة نموذج التسجيل
    validateRegisterForm(data) {
        if (!data.studentID || !data.fullName || !data.branchId || !data.majorId || !data.password || !data.gender) {
            this.showAlert('register', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
            return false;
        }
        
        if (data.password.length < 8) {
            this.showAlert('register', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'danger');
            return false;
        }
        
        return true;
    }

    // حفظ الجلسة
    saveSession(data) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('username', data.username);
        localStorage.setItem('tokenExpires', data.expiresOn);
    }

    // مسح الجلسة
    clearSession() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('username');
        localStorage.removeItem('tokenExpires');
    }

    // تبديل حالة التحميل
    setLoadingState(btn, isLoading) {
        if (!btn) return;
        
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');
        
        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            loading.style.display = 'inline-block';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    // إظهار تنبيه
    showAlert(formId, message, type) {
        const alertDiv = document.getElementById(formId + 'Alert');
        if (!alertDiv) return;
        
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
    }

    // إخفاء التنبيهات
    hideAlerts() {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.display = 'none';
        });
    }

    // تبديل بين التبويبات
    switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(tab + 'Form').classList.add('active');
        
        this.hideAlerts();
    }

    // تبديل عرض كلمة المرور
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const btn = input.nextElementSibling;
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // التحقق من صحة التوكن
    isTokenValid() {
        const token = localStorage.getItem('userToken');
        const tokenExpires = localStorage.getItem('tokenExpires');
        
        if (!token || !tokenExpires) {
            return false;
        }
        
        const now = new Date();
        const expiresDate = new Date(tokenExpires);
        
        return now < expiresDate;
    }

    // الحصول على التوكن
    getToken() {
        return localStorage.getItem('userToken');
    }

    // الحصول على اسم المستخدم
    getUserName() {
        return localStorage.getItem('userName');
    }

    // تسجيل الخروج
    logout() {
        this.clearSession();
        window.location.href = '/login.html';
    }
}

// تصدير الكلاس للاستخدام العام
window.AuthManager = AuthManager;

// تهيئة مدير المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// دوال مساعدة للاستخدام المباشر
window.switchTab = function(tab) {
    if (window.authManager) {
        window.authManager.switchTab(tab);
    }
};

window.togglePassword = function(inputId) {
    if (window.authManager) {
        window.authManager.togglePassword(inputId);
    }
};

