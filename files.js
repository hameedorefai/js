async function getParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function setDataFiles() {
    try {
        const courseId = await getParam('id');
        const courseName = await getParam('name');
        
        const titleElement = document.querySelector('.title-page');
        if (!titleElement) {
            throw new Error('Title element not found');
        }
        
        if (courseId) {
            if (courseName) {
                titleElement.textContent = decodeURIComponent(courseName);
            }
            initializeAccordions(courseId);
        } else {
            throw new Error('Course ID not found in URL parameters');
        }
    } catch (error) {
        console.error('Error in setDataFiles:', error);
        logError(error.message || 'Error setting data files', 'setDataFiles - files.js');
        throw error; // Re-throw to be caught by the outer try-catch
    }
}

function initializeAccordions(courseId) {
    const categories = [
        { title: "ملخصات نصفي", type: 0 },
        { title: "ملخصات نهائي", type: 1 },
        { title: "امتحانات نصفي سابقة", type: 2 },
        { title: "امتحانات نهائي سابقة", type: 3 },
        { title: "كتـب", type: 4 },
        { title: "عملي", type: 5 },
        { title: "أنشطة", type: 6 },
        { title: "ملفات أخرى", type: 7 },
        { title: "ملفات غير مصنفة", type: 8 }
    ];

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        .accordion-collapse {
            transition: all 0.3s ease-in-out;
        }
        .accordion-collapse.collapsing {
            transition: all 0.3s ease-in-out;
        }
        .accordion-button:not(.collapsed) {
            transition: all 0.3s ease-in-out;
        }
        .accordion-button.collapsed {
            transition: all 0.3s ease-in-out;
        }
        .loading-spinner {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
        .loading-spinner:not(.d-none) {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    const accordionHTML = categories.map((category, index) => `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse"
                        data-bs-target="#flush-collapse${index}"
                        aria-expanded="false" 
                        aria-controls="flush-collapse${index}"
                        data-type="${category.type}"
                        data-course-id="${courseId}">
                    ${category.title}
                </button>
            </h2>
            <div id="flush-collapse${index}" class="accordion-collapse collapse" data-bs-parent="#accordion-files">
                <div class="accordion-body px-0">
                    <div class="loading-spinner text-center d-none">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                    </div>
                    <div class="files-content"></div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelector('#accordion-files').innerHTML = accordionHTML;
    document.querySelector('.alerts').classList.add('d-none');
    document.querySelector('.course-table .card').classList.remove('d-none');
    document.querySelector('#course-files').classList.remove('d-none');

    // Add click event listeners to accordion buttons
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', async function() {
            const type = this.dataset.type;
            const courseId = this.dataset.courseId;
            const collapseId = this.getAttribute('data-bs-target');
            const collapseElement = document.querySelector(collapseId);
            const filesContent = collapseElement.querySelector('.files-content');
            const loadingSpinner = collapseElement.querySelector('.loading-spinner');

            // Only load if content is empty
            if (filesContent.innerHTML === '') {
                loadingSpinner.classList.remove('d-none');
                filesContent.style.opacity = '0';
                filesContent.style.transition = 'opacity 0.3s ease-in-out';
                
                try {
                    const files = await getFilesByType(courseId, type);
                    const filesHTML = createFilesTable(files, type);
                    filesContent.innerHTML = filesHTML;
                    
                    // Add a small delay before showing content to ensure smooth transition
                    setTimeout(() => {
                        filesContent.style.opacity = '1';
                        loadingSpinner.classList.add('d-none');
                    }, 100);
                    
                } catch (error) {
                    console.error('Error loading files by type:', error);
                    logError(error.message || 'Error loading files by type', 'accordion button click handler - files.js');
                    filesContent.innerHTML = `
                        <div class="text-center p-4">
                            <i class="fas fa-exclamation-circle text-danger mb-2" style="font-size: 2rem;"></i>
                            <p class="text-danger mb-0">حدث خطأ في تحميل الملفات</p>
                        </div>`;
                    filesContent.style.opacity = '1';
                    loadingSpinner.classList.add('d-none');
                }
            }
        });
    });
}

async function getFilesByType(courseId, type) {
    try {
        const response = await fetch(`https://zamayl7.azurewebsites.net/api/files/course/${courseId}/type/${type}`);
        if (response.status === 404) {
            const responseText = await response.text();
            if (responseText === "No files found for this course.") {
                return null; // Return null only if both status is 404 and message matches
            }
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching files:', error);
        logError(error.message || 'Error fetching files by type', 'getFilesByType - files.js');
        throw error;
    }
}

async function logUploadButtonClick(fileType) {
    const categories = {
        0: "ملخصات نصفي",
        1: "ملخصات نهائي",
        2: "امتحانات نصفي سابقة",
        3: "امتحانات نهائي سابقة",
        4: "كتـب",
        5: "عملي",
        6: "أنشطة",
        7: "ملفات أخرى",
        8: "ملفات غير مصنفة"
    };

    const newData = {
        additionalData: 'Current Page: ' + window.location.href,
        message: `User Has Clicked On Upload File Button in category: ${categories[fileType]}`
    }
    try {
        await fetch('https://zamayl7.azurewebsites.net/api/Log/loginfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });
    } catch (error) {
        console.error('Error logging upload button click:', error);
        logError(error.message || 'Error logging upload button click', 'logUploadButtonClick - files.js');
    }
}

function createFilesTable(files, type) {
    if (!files || files.length === 0) return `
        <div class="text-center p-4">
            <i class="fas fa-folder-open text-muted mb-2" style="font-size: 2rem;"></i>
            <p class="text-muted mb-0">لم يتم رفع ملفات هنا بعد</p>
            <button class="btn btn-success mt-3 upload-btn" data-bs-toggle="modal" data-bs-target="#uploadModal" onclick="logUploadButtonClick(${type})">
                <i class="fas fa-upload me-2"></i>رفع ملف
            </button>
        </div>`;

    const tableHTML = `
        <table class="table files-table fs-7 align-middle">
            <thead>
                <tr>
                    <th scope="col">اسم الملف</th>
                    <th scope="col">التقييم</th>
                    <th scope="col">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => createFileRow(file)).join('')}
            </tbody>
        </table>
    `;

    return tableHTML;
}

function createFileRow(file) {
    let fileName = file.fileName;
    if (fileName.length > 50) {
        fileName = fileName.slice(0, 47) + '...';
    }
    if (fileName) {
        fileName = fileName.replace(/_|-/g, ' ');
    }

    return `
        <tr>
            <td>
                <div class="text-wrap table-file-name">
                    ${fileName}
                </div>
            </td>
            <td>
                <div class="d-flex gap-2" style="min-width:75px">
                    <div class="text-success">${file.upVotes} <i class="fad fa-thumbs-up fa-flip-horizontal"></i></div>
                    <div class="text-danger"><i class="fad fa-thumbs-down"></i> ${file.downVotes}</div>
                </div>
            </td>
            <td>
                <a role="button" class="btn btn-success" href="/file/?id=${file.fileId}">عرض</a>
            </td>
        </tr>
    `;
}

// Add modal HTML to the page
function addUploadModal() {
    const modalHTML = `
        <div class="modal fade" id="uploadModal" tabindex="-1" aria-labelledby="uploadModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="uploadModalLabel">رفع ملف</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <i class="fas fa-rocket text-success mb-3" style="font-size: 3rem;"></i>
                        <h4 class="mb-3">ستتوفر هذه الميزة قريباً</h4>
                        <p class="text-muted">نعمل على تطوير هذه الميزة لتقديم أفضل خدمة لكم</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the body if it doesn't exist
    if (!document.getElementById('uploadModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    try {
        setDataFiles();
        addUploadModal(); // Add the upload modal to the page
    } catch (error) {
        console.error('Error initializing files page:', error);
        logError(error.message || 'Error initializing files page', 'DOMContentLoaded - files.js');
        const alertsDiv = document.querySelector('.alerts');
        if (alertsDiv) {
            alertsDiv.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    حدث خطأ في تحميل الصفحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.
                </div>`;
            alertsDiv.classList.remove('d-none');
        }
    }
});
