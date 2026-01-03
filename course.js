async function getParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function getCourse() {
    const courseId = await getParam('id') || null;
    if (courseId) {
        try {
            const response = await fetch('https://zplatform.azurewebsites.net/api/Course/CourseNo/' + courseId);
            if (!response.ok) {
                setAlert('alert', 'لم يتم العثور على هذه المادة');
                return;
            }
            const course = await response.json();
            setDataCourse(course);
            return;
        } catch (error) {
            console.error('Error fetching course:', error);
            logError(error.message || 'Error fetching course data', 'getCourse - course.js');
            setAlert('error', 'حدث خطأ في عرض البيانات');
            throw new Error(error);
        }
    } else {
        window.location.href = "/courses/course-search.html";
    }
}

function getDateTime(dateString) {
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours();
    if (year < 2000) {
        return null;
    }
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    //const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    const formattedTime = `${formattedHours}:${minutes} ${period}`;
    return formattedTime;
}

function getDate(dateString) {
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    if (year < 2000) {
        return null;
    }
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

function newTr(text, val, background = null) {
    if (background) {
        return `<tr><td style='background-color:${background}'>${text}</td><td style='background-color:${background}'>${val}</td></tr>`;
    }
    return `<tr><td>${text}</td><td>${val}</td></tr>`;
}
function newTrHeader(text) {
    return `<tr><th colspan="2" scope="row" class="bg-success bg-gradient text-center text-light">${text}</th></tr>`;
}

function setDataCourse(data) {
    // حفظ بيانات المادة في المتغير العام
    currentCourseData = data;
    
    const elements = [''];

    data.creditHours && elements.push(newTr('رقم المادة', data.courseNo));
    elements.push(newTr(
        'لها تعيين (نشاط)',
        data.hasTask
            ? `نعم<br><a href="/tools/task_to_pdf.html" target="_blank" style="text-decoration: none; color: #007bff; font-weight: bold;" onclick="logTaskToPDFClick()">اضغط هنا لتحويل صور نشاطك إلى PDF مع كافة المعلومات المطلوبة</a>`
            : 'لا.<br> ملاحظة: التعيين هو الذي يرصد له 10 علامات فقط وليس له علاقة بالأنشطة أو المشاريع العملية'
    ));

    //data.mechanismDTO?.semester && elements.push(newTr('الفصل الدراسي', data.mechanismDTO?.semester));
    //  elements.push(`<tr><td>نظام التعليم</td><td>الكتروني</td>`);

    if (data.mechanismDTO?.teachingStyle == 'وجاهي' || data.mechanismDTO?.teachingStyle == 'مدمج') {
        //data.mechanismDTO?.teachingStyle && elements.push(`<tr><td>نظام التعليم</td><td>الضفة (${data.mechanismDTO?.teachingStyle}), غزة (الكتروني) </td>`);
      //  data.mechanismDTO?.teachingStyle && elements.push(`<tr><td>نظام التعليم</td><td>${data.mechanismDTO?.teachingStyle}</td>`);
    } else {
     //   data.mechanismDTO?.teachingStyle && elements.push(newTr('نظام التعليم', data.mechanismDTO?.teachingStyle));
    } /**/
    data.creditHours && elements.push(newTr('عدد الساعات المعتمدة', data.creditHours));
    data.theoryHours && elements.push(newTr('عدد الساعات النظرية', data.theoryHours));
    data.practicalHours && elements.push(newTr('عدد الساعات العملية', data.practicalHours));
    data.numberOfUnits && elements.push(newTr('عدد الوحدات', data.numberOfUnits));
    data.deletedUnits && elements.push(newTr('عدد الوحدات المحذوفة', data.deletedUnits));
    data.bookType && elements.push(newTr('نوع الكتاب', data.bookType));
    data.bookEdition && elements.push(newTr('طبعة الكتاب', data.bookEdition));
    data.branches && elements.push(newTr('فروع التعليم', data.branches));
    data.notes && elements.push(newTr('ملاحظات', data.notes));
    elements.push(newTrHeader('الامتحان النصفي'));
    
    
    if (data.examSchedule && data.examSchedule.midExamSchedules && data.examSchedule.midExamSchedules.length > 0) {
  //      elements.push(`<tr><th colspan="2" scope="row" class="bg-light bg-gradient text-center text-dark py-2">موعد الامتحان النصفي</th></tr>`);
        elements.push(`<tr>
                <td colspan="7" class="p-0">
                <table class="table table-striped table-hover mb-0 fs-9 schedule-courses mb-2">
               <thead class="table-dark">
                                        <tr>
                                            <th>اليوم</th>
                                            <th>التاريخ</th>
                                            <th>الساعة</th>
                                            <th>الآلية</th>
                                            <th>المصحّح</th>
                                          <th>متبقي</th>
                                        </tr>
                                    </thead><tbody>`);


        data.examSchedule.midExamSchedules.map((c, i) => {
            elements.push(`<tr>
                                            <td>${c.examDay}</td>
                                            <td>${getDate(c.examDate)}</td>
                                            <td>${getDateTime(c.examDate)}</td>
                                            <td>${c.examMethod}</td>
                                            <td>${data.mechanismDTO.midtermExamCorrectBy}</td>
                                            <td>${c.remainingTime}</td>
                                        </tr>`);
        });
        if (data.examSchedule.midExamSchedules.length > 1) {
            elements.push(`<tr><td colspan="7" class="text-center">قد يتوفر أكثر من موعد في بعض المواد, لذا يرجى التأكد من موعد امتحانك عبر البوابة الأكاديمية حين نشره.</td></tr>`);
        }

        elements.push(`</tbody></table></td></tr>`);
        
    }
    
    
    //data.mechanismDTO?.semester && elements.push(newTr('الفصل الدراسي', data.mechanismDTO?.semester));

    /*
    if (data.examSchedule?.midExamDay) {
        data.examSchedule?.midExamDate && getDate(data.examSchedule?.midExamDate) && elements.push(newTr('تاريخ الامتحان', getDate(data.examSchedule?.midExamDate)));
        data.examSchedule?.midExamDay && elements.push(newTr('يوم الامتحان', data.examSchedule?.midExamDay));
        data.examSchedule?.midExamDate && getDate(data.examSchedule?.midExamDate) && elements.push(newTr('وقت الامتحان', getDateTime(data.examSchedule?.midExamDate)));
        data.examSchedule?.examDuration && elements.push(newTr('مدة الامتحان', data.examSchedule?.examDuration));
        data.examSchedule?.examDayOrder && elements.push(newTr('ترتيب يوم الامتحان', data.examSchedule?.examDayOrder));
        data.examSchedule?.sessionNumber && elements.push(newTr('رقم الجلسة', data.examSchedule?.sessionNumber));
       // data.mechanismDTO?.midtermExamCorrectBy && elements.push(newTr('تصحيح الامتحان بواسطة', data.mechanismDTO?.midtermExamCorrectBy));
         //elements.push(newTr('تصحيح الامتحان بواسطة', 'الكتروني'));
    }
*/

    if (data.mechanismDTO?.midtermExamCorrectBy == 'الكتروني' && data.mechanismDTO?.midtermExamCorrectBy != 'لا يوجد آلية مرفقة') {
  //      data.mechanismDTO?.midtermExamCorrectBy && elements.push(newTr('تصحيح الامتحان بواسطة', data.mechanismDTO?.midtermExamCorrectBy));
    } else if (data.mechanismDTO?.midtermExamCorrectBy && data.mechanismDTO?.midtermExamCorrectBy != 'لا يوجد آلية مرفقة') {
        //elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>الضفة (${data.mechanismDTO?.midtermExamCorrectBy}), غزة (الكتروني) </td>`);
  //      elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>${data.mechanismDTO?.finalExamCorrectBy}</td>`);

    } else {
  //      elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>${data.mechanismDTO?.midtermExamCorrectBy}</td>`);
    }/**/
    data.midRequiredUnits && elements.push(newTr('الوحدات المطلوبة', data.midRequiredUnits));
    data.midDeletedUnits && elements.push(newTr('الوحدات المحذوفة', data.midDeletedUnits));
    data.hasFiles && data.midDeletedUnits && elements.push(newTr('الملفات الدراسية', `<a href="/files/?id=${data.courseId}&name=${encodeURIComponent(data.courseName)}" style="font-weight: bold; color: #007bff; text-decoration: none;">اضغط هنا</a>`));











    elements.push(newTrHeader('الامتحان النهائي'));

    if (data.examSchedule && data.examSchedule.finalExamSchedules && data.examSchedule.finalExamSchedules.length > 0) {
        //  elements.push(`<tr><th colspan="2" scope="row" class="bg-info bg-gradient text-center text-dark py-0">موعد الامتحان النهائي</th></tr>`);
          elements.push(`<tr>
              <td colspan="7" class="p-0">
              <table class="table table-striped table-hover mb-2 fs-9 schedule-courses">
             <thead class="table-dark">
                                      <tr>
                                          <th>اليوم</th>
                                          <th>التاريخ</th>
                                          <th>الساعة</th>
                                          <th>الآلية</th>
                                          <th>المصحّح</th>
                                          <th>متبقي</th>
                                      </tr>
                                  </thead><tbody>`);
          if (data.examSchedule.finalExamSchedules.length > 1) {
              elements.push(`<tr><td colspan="7" class="text-center">قد يتوفر أكثر من موعد في بعض المواد, لذا يرجى التأكد من موعد امتحانك عبر البوابة الأكاديمية حين نشره.</td></tr>`);
          }
          data.examSchedule.finalExamSchedules.map((c, i) => {
              elements.push(`<tr>
                                          <td>${c.examDay}</td>
                                          <td>${getDate(c.examDate)}</td>
                                          <td>${getDateTime(c.examDate)}</td>
                                            <td>${c.examMethod}</td>
                                            <td>${data.mechanismDTO.finalExamCorrectBy}</td>
                                          <td>${c.remainingTime}</td>
                                      </tr>`);
  
          });
          elements.push(`</tbody></table></td></tr>`);
      }
    //data.mechanismDTO?.semester && elements.push(newTr('الفصل الدراسي', data.mechanismDTO?.semester));

    /*
    if (data.examSchedule?.finalExamDay) {
    data.examSchedule?.finalExamDate && getDate(data.examSchedule?.finalExamDate) && elements.push(newTr('تاريخ الامتحان', getDate(data.examSchedule?.finalExamDate)));
    data.examSchedule?.finalExamDay && elements.push(newTr('يوم الامتحان', data.examSchedule?.finalExamDay));
    data.examSchedule?.finalExamDate && getDate(data.examSchedule?.finalExamDate) && elements.push(newTr('وقت الامتحان', getDateTime(data.examSchedule?.finalExamDate)));
    data.examSchedule?.examDuration && elements.push(newTr('مدة الامتحان', data.examSchedule?.examDuration));
    data.examSchedule?.examDayOrder && elements.push(newTr('ترتيب يوم الامتحان', data.examSchedule?.examDayOrder));
    data.examSchedule?.sessionNumber && elements.push(newTr('رقم الجلسة', data.examSchedule?.sessionNumber));
    //data.mechanismDTO?.finalExamCorrectBy && elements.push(newTr('تصحيح الامتحان بواسطة', data.mechanismDTO?.finalExamCorrectBy));
     elements.push(newTr('تصحيح الامتحان بواسطة', 'لم يتم التحديد بعد'));
    }
    */
    if (data.mechanismDTO?.finalExamCorrectBy == 'الكتروني' && data.mechanismDTO?.finalExamCorrectBy != 'لا يوجد آلية مرفقة') {
     //   data.mechanismDTO?.finalExamCorrectBy && elements.push(newTr('تصحيح الامتحان بواسطة', data.mechanismDTO?.finalExamCorrectBy));
    } else if (data.mechanismDTO?.finalExamCorrectBy && data.mechanismDTO?.finalExamCorrectBy != 'لا يوجد آلية مرفقة') {
        //elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>الضفة (${data.mechanismDTO?.finalExamCorrectBy}), غزة (الكتروني) </td>`);
       // elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>${data.mechanismDTO?.finalExamCorrectBy}</td>`);

    } else {
     //   elements.push(`<tr><td>تصحيح الامتحان بواسطة</td><td>${data.mechanismDTO?.finalExamCorrectBy}</td>`);
    }
    data.finalRequiredUnits && elements.push(newTr('الوحدات المطلوبة', data.finalRequiredUnits));
    data.finalDeletedUnits && elements.push(newTr('الوحدات المحذوفة', data.finalDeletedUnits));
    data.hasFiles && data.midDeletedUnits && elements.push(newTr('الملفات الدراسية', `<a href="/files/?id=${data.courseId}&name=${encodeURIComponent(data.courseName)}" style="font-weight: bold; color: #007bff; text-decoration: none;">اضغط هنا</a>`));










    data.courseName && (document.querySelector('.title-page').textContent = data.courseName);
    data.courseDescription && (document.querySelector('.description-page').textContent = data.courseDescription);
    
    // إضافة أزرار الملفات والملاحظات
    let buttonsHTML = '<div class="d-flex flex-wrap justify-content-center gap-2">';
    
    if (data.hasFiles) {
        buttonsHTML += `
            <a role="button" class="btn" style="background: linear-gradient(135deg, #007b06 0%, #28a745 100%); color: white; border: none;" href="/files/?id=${data.courseId}&name=${encodeURIComponent(data.courseName)}">
                <i class="fas fa-folder-open me-2"></i>
                عرض ملفات المادة
            </a>`;
    }
    
    buttonsHTML += `
        <button type="button" class="btn" style="background: linear-gradient(135deg, #28a745 0%, #007b06 100%); color: white; border: none;" data-bs-toggle="modal" data-bs-target="#addCourseNoteModal">
            <i class="fas fa-sticky-note me-2"></i>
            إضافة ملاحظة
        </button>`;
        
    buttonsHTML += '</div>';
    
    document.querySelector('.btn-files').innerHTML = buttonsHTML;

    document.querySelector('.course-table .table tbody').innerHTML = elements.join('');
    document.querySelector('.alerts').classList.add('d-none');
    document.querySelector('.course-table .card').classList.remove('d-none');
    // Render server-backed "Add to My Courses" button (replaces localStorage version)
    if (data.courseId) {
        renderAddToMyCoursesButton(data.courseId);
    }
}

// متغيرات عامة لحفظ بيانات المادة
let currentCourseData = null;

// دالة إضافة ملاحظة للمادة
async function addCourseNote() {
    const title = document.getElementById('courseNoteTitle').value.trim();
    const content = document.getElementById('courseNoteContent').value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    if (!currentCourseData) {
        showToast('لم يتم العثور على بيانات المادة', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveCourseNoteBtn');
    const spinner = document.getElementById('saveCourseNoteSpinner');
    const icon = document.getElementById('saveCourseNoteIcon');
    
    // إظهار حالة التحميل
    saveBtn.disabled = true;
    spinner.classList.remove('d-none');
    icon.classList.add('d-none');
    saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        جاري الحفظ...
    `;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('لم يتم العثور على رمز التوثيق');
        }

        const response = await fetch('https://zplatform.azurewebsites.net/api/StudentNotes', {
            method: 'POST',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                courseId: currentCourseData.courseId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // إغلاق النافذة المنبثقة
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseNoteModal'));
        modal.hide();
        
        // مسح النموذج
        document.getElementById('addCourseNoteForm').reset();
        
        showToast('تم حفظ الملاحظة بنجاح!', 'success');

    } catch (error) {
        console.error('Error adding course note:', error);
        logError(error.message || 'Error adding course note', 'addCourseNote - course.js');
        
        if (error.message.includes('401')) {
            showToast('انتهت صلاحية جلسة المستخدم، يرجى تسجيل الدخول مرة أخرى', 'error');
        } else if (error.message.includes('403')) {
            showToast('غير مصرح لك بإضافة ملاحظات', 'error');
        } else {
            showToast('حدث خطأ في حفظ الملاحظة. يرجى المحاولة مرة أخرى.', 'error');
        }
    } finally {
        // إعادة تعيين حالة الزر
        saveBtn.disabled = false;
        spinner.classList.add('d-none');
        icon.classList.remove('d-none');
        saveBtn.innerHTML = `
            <i class="fas fa-save me-2"></i>
            حفظ الملاحظة
        `;
    }
}

// دالة تحديث اسم المادة في النافذة المنبثقة
function updateCourseNameInModal() {
    if (currentCourseData && currentCourseData.courseName) {
        const courseNameSpan = document.getElementById('currentCourseName');
        if (courseNameSpan) {
            courseNameSpan.textContent = currentCourseData.courseName;
        }
    }
}

// إضافة event listeners عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة event listener لزر حفظ الملاحظة
    const saveCourseNoteBtn = document.getElementById('saveCourseNoteBtn');
    if (saveCourseNoteBtn) {
        saveCourseNoteBtn.addEventListener('click', addCourseNote);
    }
    
    // إضافة event listener للنموذج لحفظ الملاحظة عند الضغط على Enter
    const addCourseNoteForm = document.getElementById('addCourseNoteForm');
    if (addCourseNoteForm) {
        addCourseNoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCourseNote();
        });
    }
    
    // إضافة event listener لتحديث اسم المادة عند فتح النافذة المنبثقة
    const addCourseNoteModal = document.getElementById('addCourseNoteModal');
    if (addCourseNoteModal) {
        addCourseNoteModal.addEventListener('show.bs.modal', updateCourseNameInModal);
    }
});


getCourse();

// ---- Server-backed Add to My Courses (replaces localStorage toggle on this page) ----
function renderAddToMyCoursesButton(courseGuid) {
    try {
        const el = document.querySelector('.el-btn-favorite');
        if (!el) return;
        el.innerHTML = `
            <button type="button" class="btn btn-success btn-course-add-remote" data-course-guid="${courseGuid}">
                الإضافة إلى موادي <i class="ms-1 fa-solid fa-plus"></i>
            </button>
        `;
        const btn = el.querySelector('.btn-course-add-remote');
        if (btn) {
            btn.addEventListener('click', onAddCourseClick, { once: false });
        }
    } catch (e) {
        console.error('Failed to render AddToMyCourses button', e);
        logError(e.message || 'Failed to render AddToMyCourses button', 'renderAddToMyCoursesButton - course.js');
    }
}

async function onAddCourseClick(e) {
    const btn = e.currentTarget;
    const courseGuid = btn?.dataset?.courseGuid;
    if (!courseGuid) {
        showToast('تعذر تحديد المادة', 'error');
        return;
    }

    // Retrieve token from localStorage (userToken or authToken)
    const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
    if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        // Optional: redirect to login page
        setTimeout(() => { window.location.href = '/login.html'; }, 1200);
        return;
    }

    // Disable button while processing
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> جاري الحفظ...`;

    try {
        const url = `https://zplatform.azurewebsites.net/api/StudentCourse/add-course?courseID=${encodeURIComponent(courseGuid)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`
            },
            body: ''
        });

        if (res.status === 401) {
            showToast('يرجى تسجيل الدخول أولاً', 'error');
            setTimeout(() => { window.location.href = '/login.html'; }, 1200);
            return;
        }

        if (!res.ok) {
            const errText = await safeReadText(res);
            throw new Error(errText || `فشل الطلب (${res.status})`);
        }

        showToast('تمت إضافة المادة إلى موادي', 'success');
        // Optionally, convert button to a neutral/disabled state
        btn.classList.remove('btn-success');
        btn.classList.add('btn-secondary');
        btn.innerHTML = `تمت الإضافة <i class="ms-1 fa-solid fa-check"></i>`;
        btn.disabled = true;
    } catch (error) {
        console.error('Error adding course to my courses:', error);
        logError(error.message || 'Error adding course to my courses', 'onAddCourseClick - course.js');
        showToast(error.message || 'حدث خطأ أثناء حفظ المادة', 'error');
        // Restore original button state on failure
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function safeReadText(res) {
    try { return await res.text(); } catch { return ''; }
}
