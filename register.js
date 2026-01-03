// ملف إدارة التسجيل - موقع زمايل

class RegisterManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.majors = [];
        this.apiBaseUrl = 'https://zplatform.azurewebsites.net/api';
        this.formData = {
            studentID: '',
            fullName: '',
            gender: '',
            majorId: '',
            password: ''
        };
        
        this.init();
    }

    // تهيئة المدير
    init() {
        this.loadRegistrationData();
        this.setupEventListeners();
        this.checkExistingSession();
        this.updateStepIndicator();
    }

    // تحميل البيانات المطلوبة للتسجيل
    async loadRegistrationData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/LoginPageDetailsRequired/QOU`);
            
            if (!response.ok) {
                if (response.status >= 400 && response.status <= 409) {
                    // محاولة قراءة رسالة الخطأ من الاستجابة
                    try {
                        const errorData = await response.json();
                        let errorMessage = '';
                        
                        // محاولة استخراج رسالة الخطأ
                        if (errorData.errors) {
                            const errorKeys = Object.keys(errorData.errors);
                            if (errorKeys.length > 0) {
                                const firstError = errorData.errors[errorKeys[0]];
                                if (Array.isArray(firstError) && firstError.length > 0) {
                                    errorMessage = firstError[0];
                                } else if (typeof firstError === 'string') {
                                    errorMessage = firstError;
                                }
                            }
                        } else if (errorData.message) {
                            errorMessage = errorData.message;
                        } else if (errorData.title) {
                            errorMessage = errorData.title;
                        }
                        
                        this.showAlert(errorMessage || 'فشل في تحميل البيانات المطلوبة', 'danger');
                    } catch (parseError) {
                        logError(parseError.message || 'JSON parse error in loadMajors', 'loadMajors - parseError');
                        this.showAlert('فشل في تحميل البيانات المطلوبة', 'danger');
                    }
                } else {
                    this.showAlert('فشل في الاتصال بالخادم لتحميل البيانات', 'danger');
                }
                return;
            }
            
            const data = await response.json();
            this.majors = data.majors;
            this.populateMajors();
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            logError(error.message || 'Major data loading error', 'loadMajors - register.js');
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showAlert('لا يمكن الاتصال بالخادم لتحميل البيانات. يرجى التحقق من اتصال الإنترنت.', 'danger');
            } else {
                this.showAlert('حدث خطأ غير متوقع في تحميل البيانات', 'danger');
            }
        }
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
        const registerForm = document.getElementById('registerForm');
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // أزرار التنقل بين الخطوات
        document.getElementById('step1Next').addEventListener('click', () => this.validateAndProceed(1));
        document.getElementById('step2Prev').addEventListener('click', () => this.goToPrevStep(2));
        document.getElementById('step2Next').addEventListener('click', () => this.validateAndProceed(2));
        document.getElementById('step3Prev').addEventListener('click', () => this.goToPrevStep(3));
        
        // إضافة مستمع لـ checkbox حفظ البيانات
        const rememberCheckbox = document.getElementById('rememberMeRegister');
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

    // التحقق والانتقال للخطوة التالية
    validateAndProceed(stepNumber) {
        if (stepNumber === 1) {
            // تحقق من الخطوة الأولى
            const studentID = document.getElementById('registerStudentID').value;
            const fullName = document.getElementById('registerFullName').value;
            const gender = document.getElementById('registerGender').value;
            
            if (!studentID || !fullName || !gender) {
                this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'danger');
                return;
            }

            // حفظ البيانات
            this.formData.studentID = studentID;
            this.formData.fullName = fullName;
            this.formData.gender = gender;
            
            this.goToNextStep(stepNumber);
        } 
        else if (stepNumber === 2) {
            // تحقق من الخطوة الثانية
            const majorId = document.getElementById('registerMajor').value;
            
            if (!majorId) {
                this.showAlert('يرجى اختيار التخصص', 'danger');
                return;
            }

            // حفظ البيانات
            this.formData.majorId = majorId;
            
            this.goToNextStep(stepNumber);
        }
    }

    // الانتقال للخطوة التالية
    goToNextStep(currentStep) {
        // إخفاء الخطوة الحالية
        document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
        
        // إظهار الخطوة التالية
        const nextStep = currentStep + 1;
        document.querySelector(`.step-content[data-step="${nextStep}"]`).classList.add('active');
        
        // تحديث الخطوة الحالية
        this.currentStep = nextStep;
        
        // تحديث مؤشر الخطوات
        this.updateStepIndicator();
        
        // إخفاء التنبيهات
        this.hideAlert();
    }

    // الرجوع للخطوة السابقة
    goToPrevStep(currentStep) {
        // إخفاء الخطوة الحالية
        document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
        
        // إظهار الخطوة السابقة
        const prevStep = currentStep - 1;
        document.querySelector(`.step-content[data-step="${prevStep}"]`).classList.add('active');
        
        // تحديث الخطوة الحالية
        this.currentStep = prevStep;
        
        // تحديث مؤشر الخطوات
        this.updateStepIndicator();
        
        // إخفاء التنبيهات
        this.hideAlert();
    }

    // تحديث مؤشر الخطوات
    updateStepIndicator() {
        // تحديث الخطوات
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active');
                step.classList.remove('completed');
            }
        });
        
        // تحديث شريط التقدم
        const progressPercentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        document.getElementById('stepProgress').style.width = `${progressPercentage}%`;
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
            }
        }
    }

    // معالجة التسجيل
    async handleRegister(event) {
        event.preventDefault();
        
        // التحقق من كلمة المرور وتأكيدها
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const btn = document.getElementById('registerBtn');
        
        if (!password) {
            this.showAlert('يرجى إدخال كلمة المرور', 'danger');
            return;
        }
        
        if (password.length < 8) {
            this.showAlert('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'danger');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showAlert('كلمة المرور وتأكيدها غير متطابقين', 'danger');
            return;
        }
        
        // حفظ كلمة المرور
        this.formData.password = password;
        
        this.setLoadingState(btn, true);
        this.hideAlert();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/User/register-qou-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': '*/*'
                },
                body: JSON.stringify({
                    studentID: this.formData.studentID,
                    fullName: this.formData.fullName,
                    majorID: parseInt(this.formData.majorId),
                    user: {
                        password: this.formData.password,
                        gender: this.formData.gender
                    }
                })
            });

            let data;
            let isJson = false;
            try {
                data = await response.clone().json();
                isJson = true;
            } catch (e) {
                // إذا لم يكن JSON، جلب النص مباشرة
                logError(e.message || 'JSON parse error in register submission', 'register - response parsing');
                data = await response.text();
            }

            if (response.ok || response.status === 201) {
                // حفظ بيانات تسجيل الدخول إذا كان المربع محدد
                if (isJson) this.saveCredentialsForLogin(this.formData.studentID, this.formData.password);

                // التحقق من وجود token في الاستجابة
                if (isJson && data.token) {
                    // حفظ التوكن وتسجيل الدخول تلقائياً
                    localStorage.setItem('userToken', data.token);

                    // تعيين انتهاء صلاحية التوكن (24 ساعة افتراضياً)
                    const expiresDate = new Date();
                    expiresDate.setHours(expiresDate.getHours() + 24);
                    localStorage.setItem('tokenExpires', expiresDate.toISOString());

                    // عرض خيار إضافة الصورة الشخصية
                    setTimeout(() => {
                        this.showProfilePictureOption();
                    }, 2000);
                } else {
                    this.showAlert('تم إنشاء الحساب بنجاح! سيتم تحويلك إلى صفحة تسجيل الدخول.', 'success');

                    // التوجيه إلى صفحة تسجيل الدخول مع المعاملات
                    setTimeout(() => {
                        window.location.href = 'login.html?registered=true&id=' + encodeURIComponent(this.formData.studentID);
                    }, 3000);
                }

            } else if (response.status >= 400 && response.status <= 409) {
                // للأخطاء من 400 إلى 409، عرض رسالة الخطأ مباشرة من الاستجابة
                let errorMessage = '';

                if (isJson) {
                    // محاولة استخراج رسالة الخطأ من الاستجابة
                    if (data.errors) {
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
                }

                // إذا لم نجد رسالة مخصصة أو لم يكن JSON، اعرض نص الريسبونس كما هو
                if (!errorMessage) {
                    errorMessage = isJson ? JSON.stringify(data) : data;
                }

                this.showAlert(errorMessage, 'danger');
            } else {
                // للأخطاء الأخرى، عرض رسالة عامة
                let msg = isJson ? (data.message || JSON.stringify(data)) : data;
                this.showAlert(msg || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.', 'danger');
            }

        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            logError(error.message || 'Register submission error', 'handleSubmit - register');
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
        const alertDiv = document.getElementById('registerAlert');
        if (!alertDiv) return;
        
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
    }

    // إخفاء التنبيه
    hideAlert() {
        const alertDiv = document.getElementById('registerAlert');
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
    
    // حفظ بيانات تسجيل الدخول عند التسجيل
    saveCredentialsForLogin(studentID, password) {
        const rememberMe = document.getElementById('rememberMeRegister');
        
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('savedStudentID', studentID);
            localStorage.setItem('savedPassword', password);
            localStorage.setItem('rememberCredentials', 'true');
        }
    }

    // عرض خيار إضافة الصورة الشخصية
    showProfilePictureOption() {
        // إخفاء نموذج التسجيل
        const registerForm = document.getElementById('registerForm');
        const registerCard = document.querySelector('.register-card');
        
        if (registerForm) registerForm.style.display = 'none';
        
        // إنشاء واجهة إضافة الصورة الشخصية
        const profilePictureSection = document.createElement('div');
        profilePictureSection.id = 'profilePictureSection';
        profilePictureSection.innerHTML = `
            <div class="text-center mb-4">
                <div class="profile-picture-preview">
                    <img id="previewImage" src="/assets/img/site/empty-profile-picture.png" alt="صورة المستخدم" class="profile-preview-img">
                    <div class="profile-overlay">
                        <i class="fas fa-camera"></i>
                    </div>
                </div>
                <h4 class="mt-3 mb-2">إضافة صورة الملف الشخصي</h4>
                <p class="text-primary mb-2" style="font-weight: 500;">�️ أضف صورة لملفك الشخصي لتجعله أكثر حيوية!</p>
                <p class="text-muted mb-4" style="font-size: 14px;">يمكنك اختيار أي صورة تعبر عنك - صورتك الشخصية، صورة رمزية، أو أي شيء تحبه �</p>
            </div>
            
            <div class="profile-picture-buttons">
                <button type="button" class="btn btn-primary" id="selectImageBtn">
                    <i class="fas fa-image"></i> اختيار صورة
                </button>
                <button type="button" class="btn btn-outline-secondary" id="skipImageBtn">
                    تخطي الآن
                </button>
            </div>
            
            <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
        `;
        
        // إضافة CSS للمعاينة
        const style = document.createElement('style');
        style.textContent = `
            .profile-picture-preview {
                position: relative;
                width: 150px;
                height: 150px;
                margin: 0 auto;
                border-radius: 50%;
                overflow: hidden;
                border: 4px solid #e9ecef;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .profile-picture-preview:hover {
                border-color: #007bff;
                transform: scale(1.05);
            }
            
            .profile-preview-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .profile-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .profile-picture-preview:hover .profile-overlay {
                opacity: 1;
            }
            
            .profile-overlay i {
                color: white;
                font-size: 2rem;
            }
            
            .profile-picture-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .profile-picture-buttons .btn {
                padding: 10px 30px;
                border-radius: 25px;
                font-weight: 500;
            }
        `;
        
        document.head.appendChild(style);
        registerCard.appendChild(profilePictureSection);
        
        // إضافة event listeners
        this.setupProfilePictureEvents();
    }

    // إعداد أحداث إضافة الصورة الشخصية
    setupProfilePictureEvents() {
        const selectImageBtn = document.getElementById('selectImageBtn');
        const skipImageBtn = document.getElementById('skipImageBtn');
        const profileImageInput = document.getElementById('profileImageInput');
        const previewImage = document.getElementById('previewImage');
        const profilePreview = document.querySelector('.profile-picture-preview');
        
        // زر اختيار الصورة
        selectImageBtn.addEventListener('click', () => {
            profileImageInput.click();
        });
        
        // النقر على معاينة الصورة
        profilePreview.addEventListener('click', () => {
            profileImageInput.click();
        });
        
        // زر التخطي
        skipImageBtn.addEventListener('click', () => {
            // تتبع تخطي رفع الصورة
            if (typeof gtag !== 'undefined') {
                gtag('event', 'profile_picture_skipped', {
                    event_category: 'user_profile',
                    event_label: 'registration_flow'
                });
            }
            
            this.showAlert('تم تخطي إضافة الصورة الشخصية. سيتم توجيهك للموقع...', 'info');
            
            setTimeout(() => {
                this.completeRegistration();
            }, 1500);
        });
        
        // تغيير الصورة
        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageSelection(file);
            }
        });
    }

    // التعامل مع اختيار الصورة
    async handleImageSelection(file) {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            this.showAlert('يرجى اختيار ملف صورة صالح', 'danger');
            return;
        }
        
        // التحقق من حجم الملف (5MB كحد أقصى)
        if (file.size > 5 * 1024 * 1024) {
            this.showAlert('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت', 'danger');
            return;
        }
        
        // عرض معاينة للصورة
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // رفع الصورة
        await this.uploadProfilePicture(file);
    }

    // رفع الصورة الشخصية
    async uploadProfilePicture(file) {
        const selectImageBtn = document.getElementById('selectImageBtn');
        const skipImageBtn = document.getElementById('skipImageBtn');
        
        try {
            // تعطيل الأزرار وعرض حالة التحميل
            selectImageBtn.disabled = true;
            skipImageBtn.disabled = true;
            selectImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
            
            this.showAlert('جاري رفع الصورة...', 'info');
            
            const token = localStorage.getItem('userToken');
            if (!token) {
                throw new Error('لم يتم العثور على رمز المصادقة');
            }
            
            // الخطوة 1: الحصول على SAS URL للرفع
            const sasResponse = await fetch(`https://zplatform.azurewebsites.net/api/UserProfile/generateProfilePictureUploadSas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            });
            
            if (!sasResponse.ok) {
                throw new Error(`فشل في الحصول على رابط الرفع: ${sasResponse.status}`);
            }
            
            const sasUrl = await sasResponse.text();
            
            // استخراج الـ GUID من الرابط
            const urlParts = sasUrl.split('/');
            const blobNameWithParams = urlParts[urlParts.length - 1];
            const guid = blobNameWithParams.split('?')[0];
            
            this.showAlert('جاري رفع الصورة إلى الخادم...', 'info');
            
            // الخطوة 2: رفع الملف إلى Azure Blob Storage
            const uploadResponse = await fetch(sasUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type
                }
            });
            
            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`فشل في رفع الصورة: ${uploadResponse.status} - ${errorText}`);
            }
            
            this.showAlert('جاري تحديث الملف الشخصي...', 'info');
            
            // الخطوة 3: تحديث رابط الصورة في قاعدة البيانات
            const updateResponse = await fetch(`https://zplatform.azurewebsites.net/api/UserProfile/ProfilePicture/${guid}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            });
            
            if (!updateResponse.ok) {
                throw new Error(`فشل في تحديث الملف الشخصي: ${updateResponse.status}`);
            }
            
            // نجح الرفع
            this.showAlert('✅ تم رفع الصورة الشخصية بنجاح!', 'success');
            
            // تتبع رفع الصورة
            if (typeof gtag !== 'undefined') {
                gtag('event', 'profile_picture_uploaded', {
                    event_category: 'user_profile',
                    event_label: 'registration_flow'
                });
            }
            
            // إنهاء عملية التسجيل
            setTimeout(() => {
                this.completeRegistration();
            }, 2000);
            
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            logError(error.message || 'Image upload error', 'uploadProfileImage');
            
            // إعادة تفعيل الأزرار
            selectImageBtn.disabled = false;
            skipImageBtn.disabled = false;
            selectImageBtn.innerHTML = '<i class="fas fa-image"></i> اختيار صورة';
            
            this.showAlert(`حدث خطأ أثناء رفع الصورة: ${error.message}`, 'danger');
        }
    }

    // إنهاء عملية التسجيل والتوجيه
    completeRegistration() {
        // تشغيل تتبع Google Analytics للتسجيل المكتمل
        if (typeof gtag !== 'undefined') {
            gtag('event', 'registration_completed', {
                event_category: 'engagement',
                event_label: 'user_registration_with_profile'
            });
        }
        
        this.showAlert('🎉 مرحباً بك في زمايل! تم إنشاء حسابك بنجاح. سيتم توجيهك للصفحة الرئيسية...', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }
}

// تهيئة مدير التسجيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.registerManager = new RegisterManager();
});

// دوال مساعدة للاستخدام المباشر
function togglePassword(inputId) {
    if (window.registerManager) {
        window.registerManager.togglePassword(inputId);
    }
}
