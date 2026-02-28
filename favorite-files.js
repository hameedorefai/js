// تكوين الـ API
const API_BASE_URL = 'https://zplatform2.azurewebsites.net/api';

// تحقق من صحة التوكن
function isTokenValid() {
    const token = localStorage.getItem('userToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    if (!token || !tokenExpires) {
        return false;
    }
    
    try {
        const now = new Date();
        const expiresDate = new Date(tokenExpires);
        return now < expiresDate;
    } catch (error) {
        console.error('خطأ في التحقق من صحة التوكن:', error);
        logError(error.message || 'Error validating token', 'isTokenValid - favorite-files.js');
        return false;
    }
}

// مسح الجلسة المنتهية الصلاحية
function clearExpiredSession() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
}

// إعادة توجيه لتسجيل الدخول
function redirectToLogin() {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login.html?redirect=${currentUrl}`;
}

// تصنيفات الملفات
const FILE_CATEGORIES = {
    summaryMid: {
        title: 'ملخصات امتحانات نصفية',
        icon: 'fas fa-file-contract',
        color: '#007bff',
        filter: (file) => file.isSummaryMid
    },
    summaryFinal: {
        title: 'ملخصات امتحانات نهائية',
        icon: 'fas fa-graduation-cap',
        color: '#28a745',
        filter: (file) => file.isSummaryFinal
    },
    pastExamMid: {
        title: 'امتحانات نصفية سابقة',
        icon: 'fas fa-clock',
        color: '#ffc107',
        filter: (file) => file.isPastExamMid
    },
    pastExamFinal: {
        title: 'امتحانات نهائية سابقة',
        icon: 'fas fa-history',
        color: '#fd7e14',
        filter: (file) => file.isPastExamFinal
    },
    books: {
        title: 'الكتب والمراجع',
        icon: 'fas fa-book-open',
        color: '#6f42c1',
        filter: (file) => file.isBook
    },
    practical: {
        title: 'ملفات عملية',
        icon: 'fas fa-laptop-code',
        color: '#20c997',
        filter: (file) => file.isPractical
    },
    other: {
        title: 'ملفات أخرى',
        icon: 'fas fa-folder',
        color: '#6c757d',
        filter: (file) => file.isOther || (!file.isSummaryMid && !file.isSummaryFinal && 
                          !file.isPastExamMid && !file.isPastExamFinal && 
                          !file.isBook && !file.isPractical)
    }
};

// دالة تحميل الملفات المفضلة
async function loadFavoriteFiles() {
    const loadingContainer = document.getElementById('loadingContainer');
    const errorAlert = document.getElementById('errorAlert');
    const mainContent = document.getElementById('mainContent');
    const errorMessage = document.getElementById('errorMessage');

    try {
        // الحصول على التوكن من localStorage والتحقق من صحته
        const token = localStorage.getItem('userToken');
        
        if (!token || !isTokenValid()) {
            if (token) {
                // مسح التوكن المنتهي الصلاحية
                clearExpiredSession();
            }
            throw new Error('401');
        }

        // إظهار حالة التحميل
        loadingContainer.classList.remove('d-none');
        errorAlert.classList.add('d-none');
        mainContent.classList.add('d-none');

        const response = await fetch(`${API_BASE_URL}/SavedFiles/user`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const files = await response.json();
        
        // إخفاء حالة التحميل
        loadingContainer.classList.add('d-none');
        
        if (!files || files.length === 0) {
            // عرض حالة فارغة
            document.getElementById('emptyState').classList.remove('d-none');
            mainContent.classList.remove('d-none');
            return;
        }

        // تنظيم الملفات وعرضها
        organizeAndDisplayFiles(files);
        mainContent.classList.remove('d-none');

    } catch (error) {
        console.error('Error loading favorite files:', error);
        logError(error.message || 'Error loading favorite files', 'loadFavoriteFiles - favorite-files.js');
        
        loadingContainer.classList.add('d-none');
        
        if (error.message.includes('404')) {
            // في حالة 404 عرض الصفحة الرئيسية مع حالة فارغة
            document.getElementById('emptyState').classList.remove('d-none');
            mainContent.classList.remove('d-none');
            return;
        } else if (error.message.includes('401')) {
            // خطأ التوكن - قد تكون الجلسة منتهية الصلاحية
            clearExpiredSession();
            errorMessage.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-warning fs-1 mb-3"></i>
                    <h4>انتهت صلاحية جلستك</h4>
                    <p>يرجى تسجيل الدخول مرة أخرى لعرض الملفات المفضلة</p>
                    <a href="/login.html?redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i>
                        تسجيل الدخول
                    </a>
                </div>`;
        } else if (error.message.includes('403')) {
            errorMessage.textContent = 'غير مصرح لك بالوصول إلى هذه البيانات';
        } else {
            errorMessage.textContent = 'حدث خطأ في تحميل الملفات المفضلة. يرجى إعادة تحميل الصفحة.';
        }
        
        errorAlert.classList.remove('d-none');
    }
}

// دالة تنظيم وعرض الملفات
function organizeAndDisplayFiles(files) {
    const categoriesContainer = document.getElementById('categoriesContainer');
    categoriesContainer.innerHTML = '';

    // حساب الإحصائيات
    updateStatistics(files);

    // تجميع الملفات حسب التصنيف
    const categorizedFiles = {};
    
    Object.keys(FILE_CATEGORIES).forEach(categoryKey => {
        const category = FILE_CATEGORIES[categoryKey];
        categorizedFiles[categoryKey] = files.filter(category.filter);
    });

    // عرض كل تصنيف
    Object.keys(categorizedFiles).forEach(categoryKey => {
        const categoryFiles = categorizedFiles[categoryKey];
        
        if (categoryFiles.length > 0) {
            const categoryElement = createCategoryElement(categoryKey, categoryFiles);
            categoriesContainer.appendChild(categoryElement);
        }
    });

    // إذا لم تكن هناك ملفات في أي تصنيف
    if (categoriesContainer.innerHTML === '') {
        document.getElementById('emptyState').classList.remove('d-none');
    }
}

// دالة حساب وتحديث الإحصائيات
function updateStatistics(files) {
    const totalFiles = files.length;
    const uniqueCourses = [...new Set(files.map(file => file.courseName))].length;
    const examFiles = files.filter(file => file.isPastExamMid || file.isPastExamFinal).length;
    const summaryFiles = files.filter(file => file.isSummaryMid || file.isSummaryFinal).length;

    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalCourses').textContent = uniqueCourses;
    document.getElementById('examFiles').textContent = examFiles;
    document.getElementById('summaryFiles').textContent = summaryFiles;
}

// دالة إنشاء عنصر التصنيف
function createCategoryElement(categoryKey, files) {
    const category = FILE_CATEGORIES[categoryKey];
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'favorite-category';

    categoryDiv.innerHTML = `
        <div class="category-header d-flex justify-content-between align-items-center" 
             style="background: linear-gradient(135deg, ${category.color} 0%, ${adjustColor(category.color, 20)} 100%);">
            <div class="d-flex align-items-center">
                <i class="${category.icon} me-2 fs-4"></i>
                <h4 class="mb-0">${category.title}</h4>
            </div>
            <span class="category-count">${files.length} ملف</span>
        </div>
        <div class="category-files">
            ${files.map(file => createFileElement(file)).join('')}
        </div>
    `;

    return categoryDiv;
}

// دالة إنشاء عنصر الملف
function createFileElement(file) {
    const fileName = file.fileName ? file.fileName.replace(/_|-/g, ' ') : 'ملف بلا اسم';
    const fileSize = file.fileSize ? bytesToMegabytes(file.fileSize) : null;
    const fileSizeText = fileSize ? `<small class="text-muted">${fileSize} ميجابايت</small>` : '';
    
    return `
        <div class="file-item p-3" data-file-id="${file.fileId}">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file-alt text-primary me-3 fs-4"></i>
                        <div>
                            <h6 class="mb-1 fw-bold">${fileName}</h6>
                            <div class="text-muted small">
                                <span class="me-3"><i class="fas fa-book me-1"></i>${file.courseName}</span>
                                ${fileSizeText}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex justify-content-end align-items-center gap-2">
                        <a href="../file/?id=${file.fileId}" class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-eye me-1"></i>
                            عرض
                        </a>
                        <button type="button" class="btn btn-outline-danger btn-sm remove-btn" 
                                onclick="removeFromFavorites(${file.fileId}, this)">
                            <i class="fas fa-trash me-1"></i>
                            إزالة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// دالة إزالة ملف من المفضلة
async function removeFromFavorites(fileId, buttonElement) {
    // الحصول على التوكن من localStorage والتحقق من صحته
    const token = localStorage.getItem('userToken');
    
    if (!token || !isTokenValid()) {
        if (token) {
            clearExpiredSession();
            showToast('انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى', 'error');
        } else {
            showToast('يجب تسجيل الدخول أولاً', 'error');
        }
        setTimeout(() => redirectToLogin(), 1500);
        return;
    }

    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري الإزالة...';

    try {
        const response = await fetch(`${API_BASE_URL}/SavedFiles/file/${fileId}`, {
            method: 'DELETE',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // إزالة العنصر من الواجهة
            const fileElement = buttonElement.closest('.file-item');
            fileElement.style.transition = 'all 0.3s ease';
            fileElement.style.opacity = '0';
            fileElement.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                fileElement.remove();
                checkEmptyCategories();
            }, 300);

        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                clearExpiredSession();
                showToast('انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى', 'error');
                setTimeout(() => redirectToLogin(), 1500);
            } else if (response.status === 404) {
                // حتى في حالة 404، نقوم بإزالة الملف من الواجهة
                const fileElement = buttonElement.closest('.file-item');
                fileElement.style.transition = 'all 0.3s ease';
                fileElement.style.opacity = '0';
                fileElement.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    fileElement.remove();
                    checkEmptyCategories();
                }, 300);
            } else {
                showToast(errorText || 'فشل في حذف الملف من المفضلة', 'error');
            }
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        logError(error.message || 'Error removing file from favorites', 'removeFromFavorites - favorite-files.js');
        showToast('حدث خطأ في الاتصال بالخادم', 'error');
        
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;
    }
}

// دالة التحقق من التصنيفات الفارغة وإزالتها
function checkEmptyCategories() {
    const categories = document.querySelectorAll('.favorite-category');
    let hasFiles = false;
    
    categories.forEach(category => {
        const files = category.querySelectorAll('.file-item');
        if (files.length === 0) {
            category.remove();
        } else {
            hasFiles = true;
            // تحديث عدد الملفات
            const countElement = category.querySelector('.category-count');
            countElement.textContent = `${files.length} ملف`;
        }
    });

    // إذا لم تعد هناك ملفات، أظهر حالة فارغة
    if (!hasFiles) {
        document.getElementById('emptyState').classList.remove('d-none');
    }
}

// دالة تحويل البايتات إلى ميجابايت
function bytesToMegabytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

// دالة تعديل لون
function adjustColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// دالة عرض الرسائل
function showToast(message, type = 'primary') {
    const toastContainer = document.querySelector('#toastSite');
    const toast = toastContainer.querySelector('.toast');
    const toastBody = toast.querySelector('.toast-body');
    
    // تحديد نوع التنبيه
    toast.className = 'toast align-items-center border-0 m-auto';
    if (type === 'success') {
        toast.classList.add('text-bg-success');
    } else if (type === 'error') {
        toast.classList.add('text-bg-danger');
    } else {
        toast.classList.add('text-bg-primary');
    }
    
    toastBody.innerHTML = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

