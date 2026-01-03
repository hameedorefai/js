async function getParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


function getFileExtension(url) {
    const path = url.split('?')[0];
    const extension = path.split('.').pop();
    return extension;
}

async function getFileData() {
    const courseId = await getParam('id') || null;
    if (courseId) {
        try {
            const response = await fetch('https://zplatform.azurewebsites.net/api/files/' + courseId);

            if (!response.ok) {
                // محاولة قراءة نص الرسالة من الخادم
                const errorMessage = await response.text();
                setAlert('alert', errorMessage || 'لم يتم العثور على هذا الملف');
                return;
            }

            const file = await response.json();
            setDataFile(file);
            return;
        } catch (error) {
            logError(error.message || 'File data fetch error', 'getFileData');
            setAlert('error', `حدث خطأ في عرض البيانات: ${error.message}`);
            throw new Error(error);
        }
    } else {
        window.location.href = "/courses/course-search.html";
    }
}

function setAlert(type, text) {
    const alerts = document.querySelector('.alerts');
    let alertsEl = '';

    if (type === 'error') {
        alertsEl = `<div class="alert alert-danger d-flex align-items-center" role="alert">
                    <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                    <div>
                        ${text}
                    </div>
                  </div>`;
    } else if (type === 'alert') {
        alertsEl = `<div class="alert alert-warning d-flex align-items-center" role="alert">
                    <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Warning:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                    <div>
                    ${text}
                    </div>
             </div>`;
    } else {
        alertsEl = `<div class="alert alert-primary d-flex align-items-center" role="alert">
                    <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                    <div>
                       ${text}
                    </div>
             </div>`
    }
    alerts.innerHTML = alertsEl;
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
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
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




function newTr(text, val) {
    return `<tr><td>${text}</td><td>${val}</td>`;
}
function newTrHeader(text) {
    return `<tr><th colspan="2" scope="row" class="bg-success bg-gradient text-center text-light">${text}</th></tr>`;
}


function bytesToMegabytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}


  function setDataFile(data) {
    const elements = [];
    let fileName = data.fileName || 'ملف بلا اسم';
    if(fileName){
        fileName = fileName.replace(/_|-/g,' ')
    }


    //elements.push(newTr('اسم الملف', fileName));
    //data.creatorName && elements.push(newTr('رُفع بواسطة', data.creatorName ? data.creatorName : 'مجهول'));
    // data.isSummaryMid !== null && elements.push(newTr('ملخص امتحان نصفي', data.isSummaryMid ? 'نعم' : 'لا'));
    // data.isSummaryFinal !== null && elements.push(newTr('ملخص امتحان نهائي', data.isSummaryFinal ? 'نعم' : 'لا'));
    // data.isPastExamMid !== null && elements.push(newTr('ورد في امتحان نصفي سابق', data.isPastExamMid ? 'نعم' : 'لا'));
    // data.isPastExamFinal !== null && elements.push(newTr('ورد في امتحان نهائي سابق', data.isPastExamFinal ? 'نعم' : 'لا'));
    // data.isBook && elements.push(newTr('كتاب', data.isBook ? 'نعم' : 'لا'));
    // data.isPractical && elements.push(newTr('عملي', data.isPractical ? 'نعم' : 'لا'));
const fileZize = data.fileSize?`<div class="fs-8">${bytesToMegabytes(data.fileSize)}MB</div>`:'';
 
    elements.push(`<div class="text-center my-3">`);
    elements.push(`<a role="button" class="btn btn-outline-success mx-2 border-0 py-3 shadow-sm" style="width:150px" href="${data.fileLink}">
<div  class="d-flex flex-column justify-content-center text-center text-warb">
                        <div class="iconFile" style="font-size:60px"><i class="fad fa-download"></i></div>
                        <div class="textFile fw-bold">تنزيل</div>
                         ${fileZize}
</div>

</a>`);
const fileExtension = getFileExtension(data.fileLink);
if(fileExtension?.toLowerCase() == 'pdf'){
elements.push(`<button type="button" class="btn btn-outline-success mx-2 border-0 py-3 shadow-sm" style="width:150px" onclick="openPDFModal('${data.fileLink}')">
<div  class="d-flex flex-column justify-content-center text-center text-warb">
                        <div class="iconFile" style="font-size:60px"><i class="far fa-file-pdf"></i></div>
                        <div class="textFile fw-bold">مشاهدة</div>
</div>

</button>`);
}

elements.push(`</div>`);

const elementsText = []
elementsText.push(`<div>عدد المشاهدات <strong>${(data.downloadCount+1)}</strong></div>`);
data.creatorName && elementsText.push(`<div>رُفع بواسطة <strong>${data.creatorName}</strong></div>`);
elements.push(``);





    // Defensive DOM updates: ensure elements exist before writing to avoid
    // "Cannot set properties of null" when this script runs before the DOM is ready
    try {
        document.title = fileName + ' - موقع زمايل';
    } catch (e) {
        logError(e.message || 'Document title update error', 'setDataFile - document.title');
        console.warn('Could not set document.title', e);
    }

    const titleEl = document.querySelector('.file-table .title-page');
    const fileLinkEl = document.querySelector('#course-files .file-link');
    const fileDescEl = document.querySelector('#course-files .file-desc');
    const alertsEl = document.querySelector('.alerts');
    const cardEl = document.querySelector('.file-table .card');

    if (titleEl) titleEl.innerHTML = fileName;
    else console.warn('Missing element: .file-table .title-page');

    if (fileLinkEl) fileLinkEl.innerHTML = elements.join('');
    else console.warn('Missing element: #course-files .file-link');

    if (fileDescEl) fileDescEl.innerHTML = elementsText.join('');
    else console.warn('Missing element: #course-files .file-desc');

    if (alertsEl) alertsEl.classList.add('d-none');
    else console.warn('Missing element: .alerts');

    if (cardEl) cardEl.classList.remove('d-none');
    else console.warn('Missing element: .file-table .card');

    // Update vote UI if possible
    try {
        setDataVote(data.upVotes, data.downVotes, data.fileId);
    } catch (e) {
        logError(e.message || 'Vote UI update error', 'setDataFile - setDataVote');
        console.warn('Could not update vote UI', e);
    }
}






let pdfloaded = false;

function loadPDF(pdfPath) {
    if(!pdfloaded){
        var theme = getCookie('theme') || 'light';
    
    document.getElementById('errorMessage').classList.add('d-none');
    const loadingMessage = document.getElementById('loadingMessage');
    const pdfViewer = document.getElementById('pdfViewer')
    loadingMessage.classList.remove('d-none');
    const viewerElement = document.getElementById('pdfViewer');

    try {
    WebViewer({
        path: '/assets/PDFJSExpress/lib',
        licenseKey: 'cJUUD5HN87VzAzQseQDs',
        initialDoc: pdfPath,
    }, viewerElement)
    .then(instance => {
        instance.UI.setTheme(theme);
            loadingMessage.classList.add('d-none');
            pdfViewer.classList.remove('d-none');
            pdfloaded = true;
   
    });
 } catch (ex) {
    logError(ex.message || 'PDF loading error', 'loadPDF - WebViewer');
    loadingMessage.classList.add('d-none');
    console.error('Error loading PDF:', ex);
    document.getElementById('errorMessage').classList.remove('d-none');
}
    
         





/*
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    loadingTask.promise.then(pdf => {
        loadingMessage.classList.add('d-none');

        const numPages = pdf.numPages;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            pdf.getPage(pageNum).then(page => {
                const viewport = page.getViewport({ scale: 1 });
                const scale = (window.innerWidth - 32) / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                const pixelRatio = (window.devicePixelRatio || 1) * 2;
                canvas.width = scaledViewport.width * pixelRatio;
                canvas.height = scaledViewport.height * pixelRatio;

                canvas.style.width = `${scaledViewport.width}px`;
                canvas.style.height = `${scaledViewport.height}px`;

                context.scale(pixelRatio, pixelRatio);

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };

                page.render(renderContext);
                document.getElementById('pdfViewer').appendChild(canvas);
                pdfloaded = true;
            });
        }
    }).catch(error => {
        logError(error.message || 'PDF rendering error', 'loadPDF - pdfjsLib');
        loadingMessage.classList.add('d-none');
        console.error('Error loading PDF:', error);
        document.getElementById('errorMessage').classList.remove('d-none');
    });
*/


}
}







function setDataVote(upVotes, downVotes, fileId) {
    document.querySelector('#upVoteBtn').dataset.file = fileId;
    document.querySelector('#downVoteBtn').dataset.file = fileId;
    const storedVotes = JSON.parse(localStorage.getItem('votes') || '{}');
    const voteType = storedVotes[fileId];

    document.querySelector('#upVoteCount .counts').textContent = upVotes;
    document.querySelector('#downVoteCount .counts').textContent = downVotes;

    const upVoteBtnIcon = document.querySelector('#upVoteBtn i');
    const downVoteBtnIcon = document.querySelector('#downVoteBtn i');

    upVoteBtnIcon.classList.replace('fas', 'fal');
    downVoteBtnIcon.classList.replace('fas', 'fal');

    if (voteType === 'upVote') {
        upVoteBtnIcon.classList.replace('fal', 'fas');
        upVoteBtnIcon.dataset.iconOld = 'fas';
    } else if (voteType === 'downVote') {
        downVoteBtnIcon.classList.replace('fal', 'fas');
        downVoteBtnIcon.dataset.iconOld = 'fas';
    }
}

function btnDownVoteHover(button) {
    const icon = button.querySelector('i');
    let iconOld = icon.classList.contains('fas') ? 'fas' : 'fal';
    icon.setAttribute('data-icon-old', iconOld);
    icon.classList.remove('fal', 'fas');
    icon.classList.add('fad');
}

function btnDownVoteOut(button) {
    const icon = button.querySelector('i');
    const iconOld = icon.getAttribute('data-icon-old') || 'fal';
    icon.classList.remove('fas', 'fal', 'fad');
    icon.classList.add(iconOld);
}

async function toggleVote(button, voteType) {

    const dataFile = button.getAttribute('data-file');
    const storedVotes = JSON.parse(localStorage.getItem('votes') || '{}');
    const existingVote = storedVotes[dataFile];
    const dataPost = {};

    if (existingVote === voteType) {
        delete storedVotes[dataFile];
        dataPost["deleted"] = voteType;
    } else {
        if(existingVote === 'upVote' || existingVote === 'downVote'){
            dataPost["deleted"] = existingVote;
        }
        storedVotes[dataFile] = voteType;
    }

    dataPost['fileId'] = dataFile;
    dataPost['vote'] = storedVotes[dataFile];


    localStorage.setItem('votes', JSON.stringify(storedVotes));

    const sendVotes = await sendVote(dataPost);
    if (sendVotes) {
       
    } else {
        setAlert('error', 'فشل التصويت');
    }
}


async function sendVote(dataPost) {
    document.querySelector('#upVoteBtn').disabled = true;
    document.querySelector('#downVoteBtn').disabled = true;


    try {
        let response;
        if (dataPost.deleted) {
            const deleteUrl = dataPost.deleted === 'upVote'
                ? `https://zplatform.azurewebsites.net/api/FileUpVote/${dataPost.fileId}/upvote`
                : `https://zplatform.azurewebsites.net/api/FileDownVote/${dataPost.fileId}/downvote`;

            response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        if (dataPost.vote) {
            const postUrl = dataPost.vote === 'upVote'
                ? `https://zplatform.azurewebsites.net/api/FileUpVote/${dataPost.fileId}/upvote`
                : `https://zplatform.azurewebsites.net/api/FileDownVote/${dataPost.fileId}/downvote`;

            response = await fetch(postUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);

                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        if (!response) return false;

let downvotes = 0;
let upvotes = 0;
        
        try {
            const response = await fetch(`https://zplatform.azurewebsites.net/api/FileDownVote/${dataPost.fileId}/downvotes/count`);
            if (!response.ok) {
                return true;
            }
            const responses = await response.json();;
            downvotes = responses;
        } catch (error) {
            logError(error.message || 'Downvote count fetch error', 'sendVote - downvotes');
            throw new Error(error);
        }
        try {
            const response = await fetch(`https://zplatform.azurewebsites.net/api/FileUpVote/${dataPost.fileId}/upvotes/count`);
            if (!response.ok) {
                return true;
            }
            const responses = await response.json();;
            upvotes = responses;



        } catch (error) {
            logError(error.message || 'Upvote count fetch error', 'sendVote - upvotes');
            console.error(`Error in UpVote or DownVote buttons ${error}`);

            document.querySelector('#upVoteBtn').disabled = false;
            document.querySelector('#downVoteBtn').disabled = false;
            throw new Error(error);
        }

        document.querySelector('#upVoteBtn').disabled = false;
        document.querySelector('#downVoteBtn').disabled = false;
        setDataVote(upvotes, downvotes, dataPost.fileId)

        return true;
    } catch (error) {
        logError(error.message || 'Vote submission error', 'sendVote');
        document.querySelector('#upVoteBtn').disabled = false;
        document.querySelector('#downVoteBtn').disabled = false;
        console.error("Request failed:", error);
        return false;
    }
}



function openPDFModal(pdfPath) {
    loadPDF(pdfPath)
    const PDFModal = new bootstrap.Modal(document.getElementById('pdfModal'));
    PDFModal.show();
}







