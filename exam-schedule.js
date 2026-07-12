/**
 * exam-schedule.js
 * هذا الملف مسؤول عن استدعاء API جدول الامتحانات وعرض البيانات
 */

// عنوان API
const API_URL = 'https://zamayl7.azurewebsites.net/api/ExamSchedule/student';

// المصفوفة التي ستحتوي على بيانات جدول الامتحانات
let examScheduleData = [];

/**
 * استدعاء API للحصول على بيانات جدول الامتحانات
 */
async function fetchExamSchedule() {
    try {
        // عرض حالة التحميل
    setStatus();
    document.getElementById('loading').style.display = 'flex';
    document.querySelector('.exam-schedule-content').classList.add('d-none');
        
        // الحصول على التوكن من المخزن
        const token = localStorage.getItem('userToken');
        
        if (!token) {
            showError('لم يتم العثور على بيانات تسجيل الدخول. يرجى تسجيل الدخول أولاً.');
            redirectToLogin();
            return;
        }
        
        // استدعاء API
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        // التحقق من استجابة الخادم
        if (!response.ok) {
            if (response.status === 401) {
                showError('انتهت صلاحية الجلسة. يرجى إعادة تسجيل الدخول.');
                redirectToLogin();
                return;
            }
            if (response.status === 404) {
                showError('لا يوجد لك مواد مسجلة، قم بتسجيل موادك أولاً.');
                // يمكن إضافة تحويل إلى صفحة تسجيل المواد إذا كانت موجودة
                document.getElementById('loading').style.display = 'none';
                document.querySelector('.exam-schedule-content').classList.remove('d-none');
                
                // عرض رسالة أنه لا توجد مواد مسجلة في الجدول
                document.getElementById('examScheduleContent').innerHTML = createEmptyState('لا يوجد لك مواد مسجلة');
                return;
            }
            throw new Error(`خطأ في استجابة الخادم: ${response.status}`);
        }
        
        // تحويل البيانات إلى JSON
        const data = await response.json();
        
        // تخزين البيانات وعرضها
        examScheduleData = data;
        displayExamSchedule();
        
    } catch (error) {
        console.error('حدث خطأ أثناء جلب بيانات جدول الامتحانات:', error);
        logError(error.message || 'Error fetching exam schedule', 'fetchExamSchedule - exam-schedule.js');
        showError('حدث خطأ أثناء جلب بيانات جدول الامتحانات. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
        // إخفاء حالة التحميل
        document.getElementById('loading').style.display = 'none';
    }
}

/**
 * عرض بيانات جدول الامتحانات
 */
function displayExamSchedule() {
    // إخفاء رسالة التحميل وإظهار المحتوى
    document.querySelector('.exam-schedule-content').classList.remove('d-none');

    // تحديد مكان عرض البيانات
    const midExamsContent = document.getElementById('midExamsContent');
    const finalExamsContent = document.getElementById('finalExamsContent');
    const midExamsSection = document.getElementById('midExamsSection');
    const finalExamsSection = document.getElementById('finalExamsSection');

    // إفراغ المحتويات السابقة
    midExamsContent.innerHTML = '';
    finalExamsContent.innerHTML = '';

    if (examScheduleData.length === 0) {
        // إخفاء الأقسام وعرض رسالة فارغة
        midExamsSection.style.display = 'none';
        finalExamsSection.style.display = 'none';
        const examScheduleContainer = document.querySelector('.exam-schedule-content');
        examScheduleContainer.insertAdjacentHTML('beforeend', createEmptyState('لا توجد امتحانات مجدولة حالياً'));
        return;
    }

    // إظهار الأقسام
    midExamsSection.style.display = 'block';
    finalExamsSection.style.display = 'block';

    // فصل الامتحانات النصفية والنهائية
    const midExams = [];
    const finalExams = [];

    examScheduleData.forEach(exam => {
        if (exam.midExamDate) {
            const d = new Date(exam.midExamDate);
            midExams.push({
                courseName: exam.courseName || '-',
                day: exam.midExamDay || '-',
                date: getDate(d),
                time: getTime(d),
                remaining: decorateRemaining(exam.remainingMidExamDays)
            });
        }
        if (exam.finalExamDate) {
            const d = new Date(exam.finalExamDate);
            finalExams.push({
                courseName: exam.courseName || '-',
                day: exam.finalExamDay || '-',
                date: getDate(d),
                time: getTime(d),
                remaining: decorateRemaining(exam.remainingFinalExamDays)
            });
        }
    });

    // عرض الامتحانات النصفية
    if (midExams.length > 0) {
        midExamsContent.innerHTML = midExams.map(exam =>
            `<tr>
                <td><strong>${exam.courseName}</strong></td>
                <td>${exam.day}</td>
                <td>${exam.date}</td>
                <td>${exam.time}</td>
                <td>${exam.remaining}</td>
            </tr>`
        ).join('');
    } else {
        midExamsSection.style.display = 'none';
    }

    // عرض الامتحانات النهائية
    if (finalExams.length > 0) {
        finalExamsContent.innerHTML = finalExams.map(exam =>
            `<tr>
                <td><strong>${exam.courseName}</strong></td>
                <td>${exam.day}</td>
                <td>${exam.date}</td>
                <td>${exam.time}</td>
                <td>${exam.remaining}</td>
            </tr>`
        ).join('');
    } else {
        finalExamsSection.style.display = 'none';
    }
}

/**
 * إنشاء عنوان في الجدول (لم تعد مستخدمة)
 * @param {string} text - النص المراد عرضه في العنوان
 * @returns {string} - كود HTML للعنوان
 */
function newTrHeader(text) {
    return '';
}

/**
 * إنشاء صف في الجدول (لم تعد مستخدمة)
 * @param {string} text - عنوان الصف
 * @param {string} val - قيمة الصف
 * @param {string} background - لون خلفية الصف (اختياري)
 * @returns {string} - اسم الصنف CSS
 */
function newTr(text, val, background = null) {
    return '';
}

// توليد صف مبسط للجدول الرئيسي (لم تعد مستخدمة)
function simpleRow(courseName, type, day, date, time, remainingHtml) {
    return '';
}

/**
 * إنشاء جدول امتحانات نصفية لمادة معينة (لم تعد مستخدمة)
 * @param {Array} exams - قائمة الامتحانات النصفية
 * @returns {string} - كود HTML لجدول الامتحانات
 */
function generateMidExamsTableForCourse() { return ''; }

/**
 * إنشاء جدول امتحانات نهائية لمادة معينة (لم تعد مستخدمة)
 * @param {Array} exams - قائمة الامتحانات النهائية
 * @returns {string} - كود HTML لجدول الامتحانات
 */
function generateFinalExamsTableForCourse() { return ''; }

/**
 * الحصول على تاريخ بصيغة YYYY-MM-DD
 * @param {Date} date - كائن التاريخ
 * @returns {string} - التاريخ المنسق
 */
function getDate(date) {
    if (!date) return "-";
    const year = date.getFullYear();
    if (year < 2000) {
        return "-";
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * الحصول على الوقت بصيغة HH:MM ص/م
 * @param {Date} date - كائن التاريخ
 * @returns {string} - الوقت المنسق
 */
function getTime(date) {
    if (!date) return "-";
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    return `${formattedHours}:${minutes} ${period}`;
}

/**
 * إنشاء حالة عرض فارغة
 * @param {string} message - الرسالة التي يتم عرضها
 * @returns {string} - كود HTML لحالة فارغة
 */
function createEmptyState(message) {
    return `
        <div class="empty-state">
            <i class="far fa-calendar-times"></i>
            <h5>${message}</h5>
        </div>
    `;
}

/**
 * تنسيق التاريخ والوقت
 * @param {Date} date - كائن التاريخ
 * @returns {string} - التاريخ والوقت بتنسيق مناسب
 */
function formatDateTime(date) {
    if (!date) return "غير محدد";
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('ar-SA', options);
}

/**
 * تحديد صنف CSS للوقت المتبقي
 * @param {string} remainingTime - النص الذي يصف الوقت المتبقي
 * @returns {string} - اسم الصنف CSS
 */
function getTimeRemainingClass(remainingTime) {
    if (!remainingTime) return '';
    
    if (remainingTime.includes('انتهى')) {
        return 'text-danger';
    } else if (remainingTime.includes('يوم') && parseInt(remainingTime) <= 3) {
        return 'text-warning';
    } else {
        return 'text-success';
    }
}

function decorateRemaining(remainingTime) {
    if (!remainingTime) return '-';
    const cls = getTimeRemainingClass(remainingTime);
    return `<span class="${cls}">${remainingTime}</span>`;
}

/**
 * عرض رسالة خطأ
 * @param {string} message - نص رسالة الخطأ
 */
function showError(message) {
    setStatus(message, 'danger');
}

// عرض رسالة حالة داخل الصفحة
function setStatus(message = '', type = 'info') {
    const el = document.getElementById('statusAlert');
    if (!el) return;
    if (!message) {
        el.className = 'alert d-none';
        el.textContent = '';
        return;
    }
    const map = { info: 'alert-info', success: 'alert-success', warning: 'alert-warning', danger: 'alert-danger' };
    el.className = `alert ${map[type] ?? 'alert-info'}`;
    el.innerHTML = message;
}

/**
 * إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
 */
function redirectToLogin() {
    window.location.href = 'login.html?redirect=exam_schedule.html';
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // استدعاء البيانات عند تحميل الصفحة
    fetchExamSchedule();

    // إضافة مستمع حدث لزر التحديث
    document.getElementById('refreshBtn').addEventListener('click', fetchExamSchedule);

    // إضافة مستمعي الأحداث للبحث والتصفية
    document.getElementById('searchInput').addEventListener('input', filterExams);
    document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
    document.getElementById('filterMid').addEventListener('click', () => setFilter('mid'));
    document.getElementById('filterFinal').addEventListener('click', () => setFilter('final'));
});

