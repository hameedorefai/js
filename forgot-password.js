// ملف JavaScript لصفحة استعادة كلمة المرور - موقع زمايل

// متغيرات مؤقتة لتخزين البيانات
let temporaryData = {
    studentId: null,
    otpCode: null
};

// API Base URL
const API_BASE_URL = 'https://zplatform2.azurewebsites.net/api';

// عناصر DOM
const stepProgress = document.getElementById('stepProgress');
const steps = document.querySelectorAll('.step');
const stepContents = document.querySelectorAll('.step-content');
const alertBox = document.getElementById('forgotPasswordAlert');

// أزرار الخطوات
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const goToLoginBtn = document.getElementById('goToLoginBtn');

// حقول الإدخال
const studentIdInput = document.getElementById('studentId');
const otpCodeInput = document.getElementById('otpCode');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

// الخطوة الحالية
let currentStep = 1;

// دالة لعرض التنبيهات
function showAlert(message, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    
    // إخفاء التنبيه بعد 5 ثواني
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// دالة لتحديث شريط التقدم والخطوات
function updateStepIndicator(step) {
    // تحديث شريط التقدم
    const progressPercentage = ((step - 1) / 3) * 100;
    stepProgress.style.width = `${progressPercentage}%`;
    
    // تحديث حالة الخطوات
    steps.forEach((stepElement, index) => {
        const stepNumber = index + 1;
        
        if (stepNumber < step) {
            stepElement.classList.remove('active');
            stepElement.classList.add('completed');
        } else if (stepNumber === step) {
            stepElement.classList.remove('completed');
            stepElement.classList.add('active');
        } else {
            stepElement.classList.remove('active', 'completed');
        }
    });
    
    // تحديث محتوى الخطوات
    stepContents.forEach((content, index) => {
        if (index + 1 === step) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    currentStep = step;
}

// دالة لتفعيل/تعطيل الزر مع عرض التحميل
function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const loadingSpinner = button.querySelector('.loading');
    
    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}

// الخطوة 1: إرسال رمز التحقق
sendOtpBtn.addEventListener('click', async function() {
    const studentId = studentIdInput.value.trim();
    
    // التحقق من صحة الإدخال
    if (!studentId) {
        showAlert('الرجاء إدخال الرقم الجامعي', 'warning');
        return;
    }
    
    // التحقق من صحة الرقم الجامعي (13 رقم)
    if (studentId.length !== 13 || !/^\d+$/.test(studentId)) {
        showAlert('الرقم الجامعي يجب أن يكون مكون من 13 رقم', 'warning');
        return;
    }
    
    setButtonLoading(sendOtpBtn, true);
    alertBox.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/User/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                studentId: studentId
            })
        });
        
        if (response.ok || response.status === 200) {
            // حفظ الرقم الجامعي مؤقتاً
            temporaryData.studentId = studentId;
            
            // الانتقال للخطوة التالية
            updateStepIndicator(2);
            showAlert('تم إرسال رمز التحقق إلى بريدك الجامعي بنجاح', 'success');
        } else {
            // محاولة قراءة رسالة الخطأ من الـ Response
            let errorMessage = 'فشل في إرسال رمز التحقق. الرجاء التحقق من الرقم الجامعي والمحاولة مرة أخرى';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData?.message || errorData?.title || errorData?.error || errorData?.Message || errorData?.Title || errorData?.Error || errorMessage;
                
                // إذا كانت الرسالة كائن، حاول استخراج النص منها
                if (typeof errorMessage === 'object') {
                    errorMessage = JSON.stringify(errorMessage);
                }
            } catch (e) {
                logError(e.message || 'JSON parse error in sendOTP', 'sendOTP - forgot-password.js e');
                // إذا فشل تحويل JSON، جرب قراءة النص
                try {
                    errorMessage = await response.text() || errorMessage;
                } catch (textError) {
                    logError(textError.message || 'Text parse error in sendOTP', 'sendOTP - forgot-password.js textError');
                    console.error('Error reading response:', textError);
                }
            }
            
            showAlert(errorMessage, 'danger');
        }
    } catch (error) {
        logError(error.message || 'Send OTP error', 'sendOTP - forgot-password.js');
        console.error('Error:', error);
        showAlert('حدث خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى لاحقاً', 'danger');
    } finally {
        setButtonLoading(sendOtpBtn, false);
    }
});

// الخطوة 2: التحقق من رمز OTP
verifyOtpBtn.addEventListener('click', async function() {
    const otpCode = otpCodeInput.value.trim();
    
    // التحقق من صحة الإدخال
    if (!otpCode) {
        showAlert('الرجاء إدخال رمز التحقق', 'warning');
        return;
    }
    
    // التحقق من صحة الرمز (6 أرقام)
    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
        showAlert('رمز التحقق يجب أن يكون مكون من 6 أرقام', 'warning');
        return;
    }
    
    setButtonLoading(verifyOtpBtn, true);
    alertBox.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/User/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                studentId: temporaryData.studentId,
                otpCode: otpCode
            })
        });
        
        if (response.ok || response.status === 200) {
            // حفظ رمز التحقق مؤقتاً
            temporaryData.otpCode = otpCode;
            
            // الانتقال للخطوة التالية
            updateStepIndicator(3);
            showAlert('تم التحقق من الرمز بنجاح', 'success');
        } else {
            // محاولة قراءة رسالة الخطأ من الـ Response
            let errorMessage = 'رمز التحقق غير صحيح. الرجاء المحاولة مرة أخرى';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData?.message || errorData?.title || errorData?.error || errorData?.Message || errorData?.Title || errorData?.Error || errorMessage;
                
                // إذا كانت الرسالة كائن، حاول استخراج النص منها
                if (typeof errorMessage === 'object') {
                    errorMessage = JSON.stringify(errorMessage);
                }
            } catch (e) {
                logError(e.message || 'JSON parse error in verifyOTP', 'verifyOTP - forgot-password.js e');
                // إذا فشل تحويل JSON، جرب قراءة النص
                try {
                    errorMessage = await response.text() || errorMessage;
                } catch (textError) {
                    logError(textError.message || 'Text parse error in verifyOTP', 'verifyOTP - forgot-password.js textError');
                    console.error('Error reading response:', textError);
                }
            }
            
            showAlert(errorMessage, 'danger');
        }
    } catch (error) {
        logError(error.message || 'Verify OTP error', 'verifyOTP - forgot-password.js');
        console.error('Error:', error);
        showAlert('حدث خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى لاحقاً', 'danger');
    } finally {
        setButtonLoading(verifyOtpBtn, false);
    }
});

// إعادة إرسال رمز التحقق
resendOtpBtn.addEventListener('click', async function() {
    if (!temporaryData.studentId) {
        showAlert('حدث خطأ. الرجاء البدء من جديد', 'danger');
        return;
    }
    
    resendOtpBtn.disabled = true;
    alertBox.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/User/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                studentId: temporaryData.studentId
            })
        });
        
        if (response.ok || response.status === 200) {
            showAlert('تم إعادة إرسال رمز التحقق بنجاح', 'success');
            
            // تعطيل الزر لمدة 60 ثانية
            let countdown = 60;
            resendOtpBtn.textContent = `إعادة الإرسال بعد ${countdown} ثانية`;
            
            const countdownInterval = setInterval(() => {
                countdown--;
                resendOtpBtn.textContent = `إعادة الإرسال بعد ${countdown} ثانية`;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    resendOtpBtn.textContent = 'لم تستلم الرمز؟ إعادة الإرسال';
                    resendOtpBtn.disabled = false;
                }
            }, 1000);
        } else {
            // محاولة قراءة رسالة الخطأ من الـ Response
            let errorMessage = 'فشل في إعادة إرسال رمز التحقق';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData?.message || errorData?.title || errorData?.error || errorData?.Message || errorData?.Title || errorData?.Error || errorMessage;
                
                // إذا كانت الرسالة كائن، حاول استخراج النص منها
                if (typeof errorMessage === 'object') {
                    errorMessage = JSON.stringify(errorMessage);
                }
            } catch (e) {
                // إذا فشل تحويل JSON، جرب قراءة النص
                try {
                    errorMessage = await response.text() || errorMessage;
                } catch (textError) {
                    console.error('Error reading response:', textError);
                }
            }
            
            showAlert(errorMessage, 'danger');
            resendOtpBtn.disabled = false;
        }
    } catch (error) {
        logError(error.message || 'Resend OTP error', 'resendOTP - forgot-password.js');
        console.error('Error:', error);
        showAlert('حدث خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى لاحقاً', 'danger');
        resendOtpBtn.disabled = false;
    }
});

// الخطوة 3: تعيين كلمة المرور الجديدة
resetPasswordBtn.addEventListener('click', async function() {
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;
    
    // التحقق من صحة الإدخال
    if (!newPassword || !confirmNewPassword) {
        showAlert('الرجاء إدخال كلمة المرور وتأكيدها', 'warning');
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (newPassword.length < 8) {
        showAlert('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل', 'warning');
        return;
    }
    
    // التحقق من تطابق كلمات المرور
    if (newPassword !== confirmNewPassword) {
        showAlert('كلمات المرور غير متطابقة', 'warning');
        return;
    }
    
    setButtonLoading(resetPasswordBtn, true);
    alertBox.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/User/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                studentId: temporaryData.studentId,
                verificationCode: temporaryData.otpCode,
                newPassword: newPassword
            })
        });
        
        if (response.ok || response.status === 200) {
            // مسح البيانات المؤقتة
            clearTemporaryData();
            
            // الانتقال لصفحة النجاح
            updateStepIndicator(4);
            alertBox.style.display = 'none';
        } else {
            // محاولة قراءة رسالة الخطأ من الـ Response
            let errorMessage = 'فشل في تغيير كلمة المرور. الرجاء المحاولة مرة أخرى';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData?.message || errorData?.title || errorData?.error || errorData?.Message || errorData?.Title || errorData?.Error || errorMessage;
                
                // إذا كانت الرسالة كائن، حاول استخراج النص منها
                if (typeof errorMessage === 'object') {
                    errorMessage = JSON.stringify(errorMessage);
                }
            } catch (e) {
                logError(e.message || 'JSON parse error in resetPassword', 'resetPassword - forgot-password.js e');
                // إذا فشل تحويل JSON، جرب قراءة النص
                try {
                    errorMessage = await response.text() || errorMessage;
                } catch (textError) {
                    logError(textError.message || 'Text parse error in resetPassword', 'resetPassword - forgot-password.js textError');
                    console.error('Error reading response:', textError);
                }
            }
            
            showAlert(errorMessage, 'danger');
        }
    } catch (error) {
        logError(error.message || 'Reset password error', 'resetPassword - forgot-password.js');
        console.error('Error:', error);
        showAlert('حدث خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى لاحقاً', 'danger');
    } finally {
        setButtonLoading(resetPasswordBtn, false);
    }
});

// الذهاب لصفحة تسجيل الدخول
goToLoginBtn.addEventListener('click', function() {
    window.location.href = 'login.html';
});

// دالة لمسح البيانات المؤقتة
function clearTemporaryData() {
    temporaryData = {
        studentId: null,
        otpCode: null
    };
}

// مسح البيانات المؤقتة عند مغادرة الصفحة
window.addEventListener('beforeunload', function() {
    clearTemporaryData();
});

// مسح البيانات المؤقتة عند تحميل الصفحة
window.addEventListener('load', function() {
    clearTemporaryData();
});

// التحقق من الإدخال في حقل OTP (أرقام فقط)
otpCodeInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// التحقق من الإدخال في حقل الرقم الجامعي (أرقام فقط)
studentIdInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

