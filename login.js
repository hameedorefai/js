// ملف إدارة تسجيل الدخول - موقع زمايل

class LoginManager {
    constructor() {
        this.apiBaseUrl = 'https://zplatform2.azurewebsites.net/api';
        this.init();
    }

    // تهيئة المدير
    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.loadSavedCredentials();
        this.displayRegistrationMessage();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // إضافة مستمع لـ checkbox حفظ البيانات
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) {
            rememberCheckbox.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    // إذا تم إلغاء التحديد، امسح البيانات المحفوظة
                    localStorage.removeItem('savedStudentID');
                    localStorage.removeItem('savedPassword');
                    localStorage.removeItem('rememberCredentials');
                }
            });
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
                // Token صالح، التحقق من redirect URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');
                
                if (redirectUrl) {
                    window.location.href = decodeURIComponent(redirectUrl);
                } else {
                    window.location.href = '/';
                }
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
            this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'danger');
            return;
        }
        
        this.setLoadingState(btn, true);
        this.hideAlert();
        
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
            
            if (response.ok) {
                const data = await response.json();
                this.saveSession(data);
                this.saveCredentials(studentID, password); // حفظ بيانات تسجيل الدخول
                this.showAlert('تم تسجيل الدخول بنجاح! جاري التوجيه...', 'success');
                
                setTimeout(() => {
                    // التحقق من وجود redirect URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get('redirect');
                    
                    if (redirectUrl) {
                        window.location.href = decodeURIComponent(redirectUrl);
                    } else {
                        window.location.href = '/';
                    }
                }, 2000);
                
            } else if (response.status >= 400 && response.status <= 409) {
                // للأخطاء من 400 إلى 409، عرض رسالة الخطأ مباشرة من الاستجابة
                const data = await response.json();
                let errorMessage = '';
                
                // محاولة استخراج رسالة الخطأ من الاستجابة
                if (data.errors) {
                    // إذا كان هناك errors object، استخرج الرسائل
                    const errorKeys = Object.keys(data.errors);
                    if (errorKeys.length > 0) {
                        const firstErrorKey = errorKeys[0];
                        const firstError = data.errors[firstErrorKey];
                        if (Array.isArray(firstError) && firstError.length > 0) {
                            errorMessage = firstError[0];
                        } else if (typeof firstError === 'string') {
                            errorMessage = firstError;
                        }
                    }
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.title) {
                    errorMessage = data.title;
                }
                
                // إذا لم نجد رسالة مخصصة، استخدم الرسالة الافتراضية حسب status code
                if (!errorMessage) {
                    if (response.status === 400) {
                        errorMessage = 'البيانات المدخلة غير صحيحة';
                    } else if (response.status === 401) {
                        errorMessage = 'كلمة المرور غير صحيحة';
                    } else if (response.status === 404) {
                        errorMessage = 'الرقم الجامعي أو كلمة المرور غير صحيحة';
                    } else if (response.status === 409) {
                        errorMessage = 'الحساب موجود مسبقاً';
                    } else {
                        errorMessage = 'حدث خطأ في العملية';
                    }
                }
                
                this.showAlert(errorMessage, 'danger');
            } else if (response.status === 429) {
                // خطأ 429 يعني محاولات كثيرة
                this.showAlert('تم تجاوز عدد المحاولات المسموح. يرجى المحاولة بعد قليل.', 'warning');
            } else if (response.status === 500) {
                // خطأ 500 يعني مشكلة في الخادم
                this.showAlert('يواجه الخادم مشكلة مؤقتة. يرجى المحاولة بعد قليل.', 'warning');
            } else {
                // محاولة قراءة الرسالة من الاستجابة
                try {
                    const data = await response.json();
                    this.showAlert(data.message || 'فشل في تسجيل الدخول', 'danger');
                } catch (parseError) {
                    logError(parseError.message || 'JSON parse error in login', 'handleSubmit - login.js parseError');
                    // إذا فشل في قراءة JSON، عرض رسالة عامة
                    this.showAlert('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'danger');
                }
            }
            
        } catch (error) {
            logError(error.message || 'Login error', 'handleSubmit - login.js');
            console.error('خطأ في تسجيل الدخول:', error);
            // التحقق من نوع الخطأ لعرض رسالة مناسبة
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showAlert('لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.', 'danger');
            } else {
                this.showAlert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', 'danger');
            }
        } finally {
            this.setLoadingState(btn, false);
        }
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
    
    // حفظ بيانات تسجيل الدخول
    saveCredentials(studentID, password) {
        const rememberMe = document.getElementById('rememberMe');
        
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('savedStudentID', studentID);
            localStorage.setItem('savedPassword', password);
            localStorage.setItem('rememberCredentials', 'true');
        } else {
            localStorage.removeItem('savedStudentID');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('rememberCredentials');
        }
    }
    
    // تحميل بيانات تسجيل الدخول المحفوظة
    loadSavedCredentials() {
        const rememberCredentials = localStorage.getItem('rememberCredentials');
        
        if (rememberCredentials === 'true') {
            const savedStudentID = localStorage.getItem('savedStudentID');
            const savedPassword = localStorage.getItem('savedPassword');
            
            const studentIDInput = document.getElementById('loginStudentID');
            const passwordInput = document.getElementById('loginPassword');
            const rememberCheckbox = document.getElementById('rememberMe');
            
            if (studentIDInput && savedStudentID) {
                studentIDInput.value = savedStudentID;
            }
            
            if (passwordInput && savedPassword) {
                passwordInput.value = savedPassword;
            }
            
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }
    
    // عرض رسالة التسجيل الناجح
    displayRegistrationMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const registered = urlParams.get('registered');
        const studentID = urlParams.get('id');
        
        if (registered === 'true' && studentID) {
            this.showAlert(`تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول باستخدام الرقم الجامعي: ${studentID}`, 'success');
            
            // إزالة المعاملات من URL
            const newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: newURL}, '', newURL);
        }
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
    showAlert(message, type) {
        const alertDiv = document.getElementById('loginAlert');
        if (!alertDiv) return;
        
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
    }

    // إخفاء التنبيه
    hideAlert() {
        const alertDiv = document.getElementById('loginAlert');
        if (alertDiv) {
            alertDiv.style.display = 'none';
        }
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
}

// تهيئة مدير تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.loginManager = new LoginManager();
    
    // التحقق من الإحالة من صفحة التسجيل
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const studentID = urlParams.get('id');
        if (studentID) {
            document.getElementById('loginStudentID').value = studentID;
        }
        document.getElementById('loginAlert').className = 'alert alert-success';
        document.getElementById('loginAlert').textContent = 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.';
        document.getElementById('loginAlert').style.display = 'block';
    }
});

// دوال مساعدة للاستخدام المباشر
function togglePassword(inputId) {
    if (window.loginManager) {
        window.loginManager.togglePassword(inputId);
    }
}

