function setDataFile(data) {
    // تأكد من أن البيانات تحتوي على الروابط والمعلومات المطلوبة
    if (!data || !data.fileLink) {
        console.error('البيانات غير صحيحة أو الرابط مفقود');
        return;
    }

    const elements = [];
    const fileName = data.fileName || 'ملف بلا اسم';  // إذا لم يكن هناك اسم للملف استخدم "ملف بلا اسم"
    const fileSize = data.fileSize ? `<div class="fs-8">${bytesToMegabytes(data.fileSize)}MB</div>` : '';

    // إضافة زر التنزيل
    elements.push(`
        <div class="text-center my-3">
            <a role="button" class="btn btn-outline-success mx-2 border-0 py-3 shadow-sm" style="width:150px" href="${data.fileLink}" download>
                <div class="d-flex flex-column justify-content-center text-center">
                    <div class="iconFile" style="font-size:60px"><i class="fas fa-download"></i></div>
                    <div class="textFile fw-bold">تنزيل</div>
                    ${fileSize}
                </div>
            </a>
    `);

    // إضافة زر للمشاهدة (إذا كان الملف PDF)
    const fileExtension = getFileExtension(data.fileLink);
    if (fileExtension === 'pdf') {
        elements.push(`
            <button type="button" class="btn btn-outline-success mx-2 border-0 py-3 shadow-sm" style="width:150px" onclick="openPDFModal('${data.fileLink}')">
                <div class="d-flex flex-column justify-content-center text-center">
                    <div class="iconFile" style="font-size:60px"><i class="fas fa-file-pdf"></i></div>
                    <div class="textFile fw-bold">مشاهدة</div>
                </div>
            </button>
        `);
    }

    elements.push('</div>');

    // إضافة الأزرار إلى الصفحة
    document.querySelector('#file-buttons').innerHTML = elements.join('');
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function bytesToMegabytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

function openPDFModal(fileLink) {
    // هنا يجب أن تضيف الكود لفتح الـ PDF في نافذة منبثقة أو صفحة جديدة
    window.open(fileLink, '_blank');
}




function openPDFModal(pdfPath) {
    const pdfViewer = document.getElementById('pdfViewer');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    // إخفاء رسائل الخطأ والتحميل
    loadingMessage.classList.remove('d-none');
    pdfViewer.classList.add('d-none');

    try {
        WebViewer({
            path: '/assets/PDFJSExpress/lib',
            licenseKey: 'cJUUD5HN87VzAzQseQDs',
            initialDoc: pdfPath,
        }, pdfViewer).then(instance => {
            loadingMessage.classList.add('d-none');
            pdfViewer.classList.remove('d-none');
        });
    } catch (ex) {
        console.error('Error opening PDF viewer:', ex);
        logError(ex.message || 'Error opening PDF viewer', 'openPDFModal - convertToPDF.js');
        loadingMessage.classList.add('d-none');
        errorMessage.classList.remove('d-none');
    }
}
