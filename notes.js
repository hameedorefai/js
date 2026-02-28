// تكوين الـ API
const API_BASE_URL = 'https://zplatform2.azurewebsites.net/api';

// دالة تحميل ملاحظات الطالب
async function loadStudentNotes() {
    const loadingContainer = document.getElementById('loadingContainer');
    const errorAlert = document.getElementById('errorAlert');
    const mainContent = document.getElementById('mainContent');
    const errorMessage = document.getElementById('errorMessage');

    try {
        // الحصول على التوكن من localStorage
        const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('401');
        }

        // إظهار حالة التحميل
        loadingContainer.classList.remove('d-none');
        errorAlert.classList.add('d-none');
        mainContent.classList.add('d-none');

        const response = await fetch(`${API_BASE_URL}/StudentNotes`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notes = await response.json();
        
        // إخفاء حالة التحميل
        loadingContainer.classList.add('d-none');
        
        if (!notes || notes.length === 0) {
            // عرض حالة فارغة
            document.getElementById('emptyState').classList.remove('d-none');
            mainContent.classList.remove('d-none');
            
            // إخفاء كارد "آخر ملاحظة" عندما لا توجد ملاحظات
            const latestNoteCard = document.querySelector('.col-12.mb-3');
            if (latestNoteCard) {
                latestNoteCard.classList.add('d-none');
            }
            
            // عرض إحصائيات فارغة
            updateStatistics([]);
            
            return;
        }

        // تنظيم الملاحظات وعرضها
        organizeAndDisplayNotes(notes);
        updateStatistics(notes);
        mainContent.classList.remove('d-none');

    } catch (error) {
        logError(error.message || 'Student notes loading error', 'loadStudentNotes');
        console.error('Error loading student notes:', error);
        
        loadingContainer.classList.add('d-none');
        
        if (error.message.includes('404')) {
            // في حالة 404 عرض الصفحة الرئيسية دون رسالة خطأ
            document.getElementById('emptyState').classList.add('d-none');
            mainContent.classList.remove('d-none');
            
            // إخفاء كارد "آخر ملاحظة" في حالة 404
            const latestNoteCard = document.querySelector('.col-12.mb-3');
            if (latestNoteCard) {
                latestNoteCard.classList.add('d-none');
            }
            
            // تفريغ محتوى الملاحظات
            document.getElementById('notesContainer').innerHTML = '';
            
            // عرض إحصائيات فارغة
            updateStatistics([]);
            
            return;
        } else if (error.message.includes('401')) {
            errorMessage.textContent = 'انتهت صلاحية جلسة المستخدم، يرجى تسجيل الدخول مرة أخرى';
        } else if (error.message.includes('403')) {
            errorMessage.textContent = 'غير مصرح لك بالوصول إلى هذه البيانات';
        } else {
            errorMessage.textContent = 'حدث خطأ في تحميل الملاحظات. يرجى المحاولة مرة أخرى.';
        }
        
        errorAlert.classList.remove('d-none');
    }
}

// دالة تنظيم وعرض الملاحظات
function organizeAndDisplayNotes(notes) {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '';

    // تصنيف الملاحظات
    const courseNotes = notes.filter(note => note.course && !note.file);
    const fileNotes = notes.filter(note => note.file);
    const freeNotes = notes.filter(note => !note.course && !note.file);

    // عرض ملاحظات المواد
    if (courseNotes.length > 0) {
        const coursesSection = createCoursesSection(courseNotes);
        notesContainer.appendChild(coursesSection);
    }

    // عرض ملاحظات الملفات
    if (fileNotes.length > 0) {
        const filesSection = createFilesSection(fileNotes);
        notesContainer.appendChild(filesSection);
    }

    // عرض الملاحظات الحرة
    if (freeNotes.length > 0) {
        const freeSection = createFreeNotesSection(freeNotes);
        notesContainer.appendChild(freeSection);
    }
}

// دالة إنشاء قسم ملاحظات المواد
function createCoursesSection(notes) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'notes-section mb-5';

    // تجميع الملاحظات حسب المادة
    const notesByCourse = {};
    notes.forEach(note => {
        const courseName = note.course.courseName;
        if (!notesByCourse[courseName]) {
            notesByCourse[courseName] = [];
        }
        notesByCourse[courseName].push(note);
    });

    // إنشاء عنوان القسم
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header mb-4';
    sectionHeader.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <div class="section-icon bg-primary text-white me-3">
                <i class="fas fa-book"></i>
            </div>
            <div>
                <h2 class="mb-1">ملاحظات المواد</h2>
                <p class="text-muted mb-0">الملاحظات المرتبطة بالمواد الدراسية</p>
            </div>
            <span class="badge bg-primary ms-auto fs-6">${notes.length} ملاحظة</span>
        </div>
        <hr class="text-primary">
    `;

    sectionDiv.appendChild(sectionHeader);

    // ترتيب المواد أبجدياً
    const sortedCourses = Object.keys(notesByCourse).sort();

    // عرض كل مادة مع ملاحظاتها
    sortedCourses.forEach(courseName => {
        const courseNotes = notesByCourse[courseName];
        
        // ترتيب الملاحظات حسب التاريخ (الأحدث أولاً)
        courseNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const courseSubSection = createCourseSubSection(courseName, courseNotes);
        sectionDiv.appendChild(courseSubSection);
    });

    return sectionDiv;
}

// دالة إنشاء قسم ملاحظات الملفات
function createFilesSection(notes) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'notes-section mb-5';

    // ترتيب الملاحظات حسب التاريخ (الأحدث أولاً)
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // إنشاء عنوان القسم
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header mb-4';
    sectionHeader.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <div class="section-icon bg-success text-white me-3">
                <i class="fas fa-file-alt"></i>
            </div>
            <div>
                <h2 class="mb-1">ملاحظات الملفات</h2>
                <p class="text-muted mb-0">الملاحظات المرتبطة بملفات محددة</p>
            </div>
            <span class="badge bg-success ms-auto fs-6">${notes.length} ملاحظة</span>
        </div>
        <hr class="text-success">
    `;

    const notesGrid = document.createElement('div');
    notesGrid.className = 'row';

    notes.forEach(note => {
        const noteElement = createFileNoteElement(note);
        notesGrid.appendChild(noteElement);
    });

    sectionDiv.appendChild(sectionHeader);
    sectionDiv.appendChild(notesGrid);

    return sectionDiv;
}

// دالة إنشاء قسم الملاحظات الحرة
function createFreeNotesSection(notes) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'notes-section mb-5';

    // ترتيب الملاحظات حسب التاريخ (الأحدث أولاً)
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // إنشاء عنوان القسم
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header mb-4';
    sectionHeader.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <div class="section-icon bg-info text-white me-3">
                <i class="fas fa-sticky-note"></i>
            </div>
            <div>
                <h2 class="mb-1">ملاحظات حرة</h2>
                <p class="text-muted mb-0">ملاحظاتك الدراسية غير المرتبطة بمواد أو ملفات</p>
            </div>
            <span class="badge bg-info ms-auto fs-6">${notes.length} ملاحظة</span>
        </div>
        <hr class="text-info">
    `;

    const notesGrid = document.createElement('div');
    notesGrid.className = 'row';

    notes.forEach(note => {
        const noteElement = createFreeNoteElement(note);
        notesGrid.appendChild(noteElement);
    });

    sectionDiv.appendChild(sectionHeader);
    sectionDiv.appendChild(notesGrid);

    return sectionDiv;
}

// دالة إنشاء قسم فرعي للمادة
function createCourseSubSection(courseName, notes) {
    const subSectionDiv = document.createElement('div');
    subSectionDiv.className = 'course-subsection mb-4';

    const courseHeader = document.createElement('div');
    courseHeader.className = 'mb-3';
    courseHeader.innerHTML = `
        <h4 class="text-secondary d-flex align-items-center">
            <i class="fas fa-graduation-cap me-2"></i>
            ${courseName}
            <span class="badge bg-light text-dark ms-2 fs-6">${notes.length} ملاحظة</span>
        </h4>
    `;

    const notesGrid = document.createElement('div');
    notesGrid.className = 'row';

    notes.forEach(note => {
        const noteElement = createCourseNoteElement(note);
        notesGrid.appendChild(noteElement);
    });

    subSectionDiv.appendChild(courseHeader);
    subSectionDiv.appendChild(notesGrid);

    return subSectionDiv;
}

// دالة إنشاء عنصر ملاحظة المادة
function createCourseNoteElement(note) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-4 col-xl-3 mb-3';

    const shortContent = note.content.length > 60 ? 
        note.content.substring(0, 60) + '...' : 
        note.content;

    colDiv.innerHTML = `
        <div class="note-card h-100">
            <div class="note-header">
                <div class="note-options">
                    <button class="note-options-btn" onclick="toggleNoteDropdown(this, ${note.noteId}, event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="note-dropdown">
                        <button class="note-dropdown-item delete" onclick="confirmDeleteNote(${note.noteId})">
                            <i class="fas fa-trash me-2"></i>
                            حذف الملاحظة
                        </button>
                    </div>
                </div>
                <h6 class="mb-0">${note.title}</h6>
            </div>
            <div class="note-content">
                <p class="mb-2">${shortContent}</p>
                <small class="text-muted course-link" style="cursor: pointer; color: #007b06 !important; text-decoration: underline;">${note.course.courseName}</small>
            </div>
        </div>
    `;

    // إضافة حدث الضغط لعرض الملاحظة كاملة
    const noteCard = colDiv.querySelector('.note-card');
    noteCard.style.cursor = 'pointer';
    noteCard.addEventListener('click', (e) => {
        // منع الانتقال للمادة إذا تم الضغط على اسم المادة أو النقاط الثلاث
        if (e.target.classList.contains('course-link') || 
            e.target.closest('.note-options') ||
            e.target.closest('.note-dropdown')) {
            e.stopPropagation();
            if (e.target.classList.contains('course-link')) {
                goToCourse(note.course.courseId);
            }
            return;
        }
        showFullNote(note);
    });

    // إضافة حدث منفصل للضغط على رابط المادة
    const courseLink = colDiv.querySelector('.course-link');
    courseLink.addEventListener('click', (e) => {
        e.stopPropagation();
        goToCourse(note.course.courseId);
    });

    return colDiv;
}

// دالة إنشاء عنصر ملاحظة الملف
function createFileNoteElement(note) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-4 col-xl-3 mb-3';

    const shortContent = note.content.length > 60 ? 
        note.content.substring(0, 60) + '...' : 
        note.content;

    const fileName = note.file.fileName ? note.file.fileName.replace(/_|-/g, ' ') : 'ملف بلا اسم';
    
    // إنشاء روابط قابلة للنقر
    const fileLink = `<span class="file-link" style="cursor: pointer; color: #28a745 !important; text-decoration: underline;">${fileName}</span>`;
    const courseLink = note.course ? ` - <span class="course-link" style="cursor: pointer; color: #007b06 !important; text-decoration: underline;">${note.course.courseName}</span>` : '';

    colDiv.innerHTML = `
        <div class="note-card h-100">
            <div class="note-header">
                <div class="note-options">
                    <button class="note-options-btn" onclick="toggleNoteDropdown(this, ${note.noteId}, event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="note-dropdown">
                        <button class="note-dropdown-item delete" onclick="confirmDeleteNote(${note.noteId})">
                            <i class="fas fa-trash me-2"></i>
                            حذف الملاحظة
                        </button>
                    </div>
                </div>
                <h6 class="mb-0">${note.title}</h6>
            </div>
            <div class="note-content">
                <p class="mb-2">${shortContent}</p>
                <small class="text-muted">${fileLink}${courseLink}</small>
            </div>
        </div>
    `;

    // إضافة حدث الضغط لعرض الملاحظة كاملة
    const noteCard = colDiv.querySelector('.note-card');
    noteCard.style.cursor = 'pointer';
    noteCard.addEventListener('click', (e) => {
        // منع عرض الملاحظة إذا تم الضغط على الروابط أو النقاط الثلاث
        if (e.target.classList.contains('file-link') || 
            e.target.classList.contains('course-link') ||
            e.target.closest('.note-options') ||
            e.target.closest('.note-dropdown')) {
            e.stopPropagation();
            return;
        }
        showFullNote(note);
    });

    // إضافة حدث للضغط على رابط الملف
    const fileLink_elem = colDiv.querySelector('.file-link');
    if (fileLink_elem) {
        fileLink_elem.addEventListener('click', (e) => {
            e.stopPropagation();
            goToFile(note.file.fileId);
        });
    }

    // إضافة حدث للضغط على رابط المادة
    const courseLink_elem = colDiv.querySelector('.course-link');
    if (courseLink_elem) {
        courseLink_elem.addEventListener('click', (e) => {
            e.stopPropagation();
            goToCourse(note.course.courseId);
        });
    }

    return colDiv;
}

// دالة إنشاء عنصر الملاحظة الحرة
function createFreeNoteElement(note) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-4 col-xl-3 mb-3';

    const shortContent = note.content.length > 60 ? 
        note.content.substring(0, 60) + '...' : 
        note.content;

    colDiv.innerHTML = `
        <div class="note-card h-100">
            <div class="note-header">
                <div class="note-options">
                    <button class="note-options-btn" onclick="toggleNoteDropdown(this, ${note.noteId}, event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="note-dropdown">
                        <button class="note-dropdown-item delete" onclick="confirmDeleteNote(${note.noteId})">
                            <i class="fas fa-trash me-2"></i>
                            حذف الملاحظة
                        </button>
                    </div>
                </div>
                <h6 class="mb-0">${note.title}</h6>
            </div>
            <div class="note-content">
                <p class="mb-2">${shortContent}</p>
                <small class="text-muted">ملاحظة شخصية</small>
            </div>
        </div>
    `;

    // إضافة حدث الضغط لعرض الملاحظة كاملة
    const noteCard = colDiv.querySelector('.note-card');
    noteCard.style.cursor = 'pointer';
    noteCard.addEventListener('click', (e) => {
        // منع عرض الملاحظة إذا تم الضغط على النقاط الثلاث
        if (e.target.closest('.note-options') || e.target.closest('.note-dropdown')) {
            e.stopPropagation();
            return;
        }
        showFullNote(note);
    });

    return colDiv;
}

// دالة عرض الملاحظة كاملة
function showFullNote(note) {
    const formattedDate = formatDateTime(note.createdAt);
    
    // تحديد نوع الملاحظة وأيقونتها ولونها
    let noteType = '';
    let noteIcon = '';
    let noteColor = '';
    let noteInfo = '';

    if (note.file) {
        // ملاحظة ملف
        noteType = 'ملاحظة ملف';
        noteIcon = 'fas fa-file-alt';
        noteColor = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        const fileName = note.file.fileName ? note.file.fileName.replace(/_|-/g, ' ') : 'ملف بلا اسم';
        noteInfo = `
            <span class="course-badge mb-2" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); cursor: pointer;" onclick="goToFile(${note.file.fileId})">
                <i class="fas fa-file me-1"></i>
                ${fileName}
            </span>
            ${note.course ? `<br>
            <span class="course-badge mb-2" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); cursor: pointer;" onclick="goToCourse('${note.course.courseId}')">
                <i class="fas fa-book me-1"></i>
                ${note.course.courseName}
            </span>` : ''}
        `;
    } else if (note.course && !note.file) {
        // ملاحظة مادة
        noteType = 'ملاحظة مادة';
        noteIcon = 'fas fa-book';
        noteColor = 'linear-gradient(135deg, #007b06 0%, #28a745 100%)';
        noteInfo = `
            <span class="course-badge mb-2" style="background: linear-gradient(135deg, #007b06 0%, #28a745 100%); cursor: pointer;" onclick="goToCourse('${note.course.courseId}')">
                <i class="fas fa-graduation-cap me-1"></i>
                ${note.course.courseName}
            </span>
        `;
    } else {
        // ملاحظة حرة
        noteType = 'ملاحظة شخصية';
        noteIcon = 'fas fa-sticky-note';
        noteColor = 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)';
        noteInfo = `
            <span class="course-badge mb-2" style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);">
                <i class="fas fa-heart me-1"></i>
                ملاحظة شخصية
            </span>
        `;
    }
    
    const modalHtml = `
        <div class="modal fade" id="noteModal" tabindex="-1" aria-labelledby="noteModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: ${noteColor}; color: white;">
                        <h1 class="modal-title fs-5" id="noteModalLabel">
                            <i class="${noteIcon} me-2"></i>
                            ${note.title}
                        </h1>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            ${noteInfo}
                            <span class="note-date ms-3">
                                <i class="fas fa-calendar me-1"></i>
                                ${formattedDate}
                            </span>
                        </div>
                        <div class="note-full-content" style="line-height: 1.8; white-space: pre-wrap; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; max-width: 100%;">
                            ${note.content}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // إزالة المودال السابق إذا كان موجوداً
    const existingModal = document.getElementById('noteModal');
    if (existingModal) {
        existingModal.remove();
    }

    // إضافة المودال الجديد
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // عرض المودال
    const modal = new bootstrap.Modal(document.getElementById('noteModal'));
    modal.show();

    // إزالة المودال عند إغلاقه
    document.getElementById('noteModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// دالة حساب وتحديث الإحصائيات
function updateStatistics(notes) {
    // تقسيم الملاحظات حسب النوع
    const courseNotes = notes.filter(note => note.course && !note.file);
    const fileNotes = notes.filter(note => note.file);
    const freeNotes = notes.filter(note => !note.course && !note.file);
    
    // البحث عن كارد "آخر ملاحظة"
    const latestNoteCard = document.querySelector('.col-12.mb-3');
    
    // التحقق من وجود ملاحظات
    if (notes.length > 0) {
        // العثور على تاريخ آخر ملاحظة
        const sortedNotes = notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestDate = formatDate(sortedNotes[0].createdAt);
        
        // تحديث الإحصائيات في الواجهة
        document.getElementById('latestNoteDate').textContent = latestDate;
        
        // إظهار كارد "آخر ملاحظة"
        if (latestNoteCard) {
            latestNoteCard.classList.remove('d-none');
        }
    } else {
        // إخفاء كارد "آخر ملاحظة" عندما لا توجد ملاحظات
        if (latestNoteCard) {
            latestNoteCard.classList.add('d-none');
        }
    }
    
    // إضافة إحصائيات تفصيلية
    const statsDetails = document.querySelector('.stats-details');
    if (statsDetails) {
        statsDetails.innerHTML = `
            <div class="row text-center mt-3">
                <div class="col-4">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #007b06 0%, #28a745 100%);">
                            <i class="fas fa-book"></i>
                        </div>
                        <h5 class="mt-2 mb-1">${courseNotes.length}</h5>
                        <small class="text-muted">ملاحظات المواد</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h5 class="mt-2 mb-1">${fileNotes.length}</h5>
                        <small class="text-muted">ملاحظات الملفات</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);">
                            <i class="fas fa-sticky-note"></i>
                        </div>
                        <h5 class="mt-2 mb-1">${freeNotes.length}</h5>
                        <small class="text-muted">ملاحظات حرة</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// دالة تنسيق التاريخ والوقت
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    
    if (year < 2000) {
        return 'تاريخ غير صحيح';
    }

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    try {
        return date.toLocaleString('ar-EG', options);
    } catch (error) {
        logError(error.message || 'Arabic date formatting error', 'formatDateTime');
        // fallback للمتصفحات التي لا تدعم ar-EG
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? 'مساءً' : 'صباحاً';
        const formattedHours = String(hours % 12 || 12).padStart(2, '0');
        
        return `${dayName} ${day} ${month} ${year} ${formattedHours}:${minutes} ${period}`;
    }
}

// دالة تنسيق التاريخ فقط
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    
    if (year < 2000) {
        return '-';
    }

    try {
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    } catch (error) {
        logError(error.message || 'Short date formatting error', 'formatDate');
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        
        return `${dayName} ${day} ${month} ${year}`;
    }
}

// دالة إضافة ملاحظة جديدة
async function addNewNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveNoteBtn');
    const spinner = document.getElementById('saveNoteSpinner');
    const icon = document.getElementById('saveNoteIcon');
    
    // إظهار حالة التحميل
    saveBtn.disabled = true;
    spinner.classList.remove('d-none');
    icon.classList.add('d-none');
    saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        جاري الحفظ...
    `;

    try {
        const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('لم يتم العثور على رمز التوثيق');
        }

        const response = await fetch(`${API_BASE_URL}/StudentNotes`, {
            method: 'POST',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // إغلاق النافذة المنبثقة
        const modal = bootstrap.Modal.getInstance(document.getElementById('addNoteModal'));
        modal.hide();
        
        // مسح النموذج
        document.getElementById('addNoteForm').reset();
        
        // إعادة تحميل الملاحظات
        loadStudentNotes();
        
        showToast('تم حفظ الملاحظة بنجاح!', 'success');

    } catch (error) {
        logError(error.message || 'Note addition error', 'addNewNote');
        console.error('Error adding note:', error);
        
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

// دالة تأكيد حذف الملاحظة
function confirmDeleteNote(noteId) {
    // إغلاق مودال عرض الملاحظة
    const noteModal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
    if (noteModal) {
        noteModal.hide();
    }

    // إنشاء مودال التأكيد
    const confirmModalHtml = `
        <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h1 class="modal-title fs-5" id="confirmDeleteModalLabel">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            تأكيد الحذف
                        </h1>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center">
                            <i class="fas fa-trash-alt text-danger mb-3" style="font-size: 3rem;"></i>
                            <h5 class="mb-3">هل أنت متأكد من حذف هذه الملاحظة؟</h5>
                            <p class="text-muted">لا يمكن التراجع عن هذا الإجراء!</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn" onclick="deleteNote(${noteId})">
                            <i class="fas fa-trash me-2"></i>
                            تأكيد الحذف
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // إضافة المودال
    document.body.insertAdjacentHTML('beforeend', confirmModalHtml);
    
    // عرض المودال
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    confirmModal.show();

    // إزالة المودال عند إغلاقه
    document.getElementById('confirmDeleteModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// دالة حذف الملاحظة
async function deleteNote(noteId) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        // إظهار حالة التحميل
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>جاري الحذف...';

        const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('لم يتم العثور على رمز التوثيق');
        }

        const response = await fetch(`${API_BASE_URL}/StudentNotes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('انتهت صلاحية جلسة المستخدم، يرجى تسجيل الدخول مرة أخرى');
            } else if (response.status === 404) {
                // إذا كان الخطأ 404، نعتبر أن العملية تمت بنجاح
                // لأن الملاحظة غير موجودة أصلاً
                return true;
            } else {
                throw new Error(`حدث خطأ في حذف الملاحظة: ${response.status}`);
            }
        }

        // إغلاق مودال التأكيد
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        confirmModal.hide();
        
        // إعادة تحميل الملاحظات
        loadStudentNotes();
        
        showToast('تم حذف الملاحظة بنجاح!', 'success');

    } catch (error) {
        logError(error.message || 'Note deletion error', 'deleteNote');
        console.error('Error deleting note:', error);
        showToast(error.message || 'حدث خطأ في حذف الملاحظة', 'error');
    } finally {
        // إعادة تعيين حالة الزر
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

// دالة الانتقال لصفحة المادة
function goToCourse(courseId) {
    if (courseId) {
        window.open(`/courses/?id=${courseId}`, '_blank');
    }
}

// دالة الانتقال لصفحة الملف
function goToFile(fileId) {
    if (fileId) {
        window.open(`/file/?id=${fileId}`, '_blank');
    }
}

// دالة التحكم في القائمة المنسدلة للملاحظة
function toggleNoteDropdown(button, noteId, event) {
    // إغلاق جميع القوائم المنسدلة الأخرى
    document.querySelectorAll('.note-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    
    // فتح/إغلاق القائمة الحالية
    const dropdown = button.nextElementSibling;
    dropdown.classList.toggle('show');
    
    // منع انتشار الحدث
    if (event) {
        event.stopPropagation();
    }
}

// إغلاق القوائم المنسدلة عند النقر خارجها
document.addEventListener('click', function(event) {
    if (!event.target.closest('.note-options')) {
        document.querySelectorAll('.note-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

