// Logging helper function
async function logError(errorMessage, errorLocation) {
    try {
        await fetch('https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net//api/Report/add', {
            method: 'POST',
            headers: {
                'Accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: 18,
                reportType: 'خطأ تقني',
                reportText: `Error at ${errorLocation}:\n${errorMessage}\n\nPage: ${window.location.href}\nTime: ${new Date().toISOString()}`,
                examID: 0,
                questionID: 0,
                optionID: 0
            })
        });
    } catch (logErr) {
        console.error('Failed to log error:', logErr);
    }
}

function goUrl(site, url = encodeURIComponent(window.location.href)) {

    if (site == 'facebook') {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
    } else if (site == 'twitter') {
        window.open('https://twitter.com/intent/tweet?url=' + url, '_blank');
    } else if (site == 'linkedin') {
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank');
    } else if (site == 'whatsapp') {
        window.open('https://api.whatsapp.com/send?text=' + url, '_blank');
    } else if (site == 'telegram') {
        window.open('https://t.me/share/url?url=' + url, '_blank');
    }
}
async function copyLink(link = window.location.href) {
    let copied = false;
    // Try modern API first
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(link);
            copied = true;
        } else {
            // Fallback for insecure context or unsupported browsers
            const textArea = document.createElement('textarea');
            textArea.value = link;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            copied = document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (e) {
        copied = false;
        logError(e.message || 'Copy link error', 'copyLink function');
    }

    // Try to give visual feedback on a specific icon if present, but don't fail if missing
    try {
        const btn = document.getElementById('icon-copy');
        if (btn) {
            btn.setAttribute('class', copied ? 'fa-duotone fa-solid fa-check' : 'fa-regular fa-copy');
            if (copied) {
                setTimeout(() => btn.setAttribute('class', 'fa-regular fa-copy'), 2000);
            }
        }
    } catch (_) {
        // ignore icon update errors
    }

    showToast(copied ? 'تم نسخ الرابط بنجاح' : 'تعذر نسخ الرابط', copied ? 'success' : 'error');
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









function calculateFinalMark() {
    const statsDiv = document.getElementById('statsDisplay');
    const statsLoader = document.getElementById('statsLoader');
    
    // Clear stats and show loader
    statsDiv.innerHTML = '';
    if (statsLoader) {
        statsLoader.classList.remove('d-none');
    }

    // داخل دالة calculateFinalMark
    fetch('https://zplatform2.azurewebsites.net/api/Log/GetFinalMarkStatsAsyncLast24Hours')
        .then(response => response.json())
        .then(data => {
            const currentMark = parseFloat(document.getElementById('finalMarkResult').textContent.replace(/[^\d.]+/g, ''));
            
            // Hide loader and show stats
            if (statsLoader) {
                statsLoader.classList.add('d-none');
            }
            
            // Create stats container with site's design language
            statsDiv.innerHTML = `
                <div class="stats-container border rounded p-3 mb-3" style="background-color: var(--bs-body-bg);">
                    <div class="row g-2">
                        <div class="col-12 col-md-6">
                            <div class="d-flex align-items-center">
                                <i class="far fa-calculator me-2"></i>
                                <span>تم حساب أكثر من ${data.totalCount} علامة آخر ٢٤ ساعة</span>
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="d-flex align-items-center">
                                <i class="far fa-chart-line me-2"></i>
                                <span>متوسط علامات الامتحان النهائي: ${data.averageFinalMark.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    ${currentMark ? `
                        <div class="comparison mt-3 pt-2 border-top text-center">
                            ${currentMark > data.averageFinalMark ? 
                                `<span class="text-success"><i class="fas fa-arrow-up me-1"></i> أنت أعلى من متوسط العلامات بـ ${(currentMark - data.averageFinalMark).toFixed(1)} علامة</span>` 
                                : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        })
        .catch(error => {
            if (statsLoader) {
                statsLoader.classList.add('d-none');
            }
            console.error('فشل في جلب الإحصائيات:', error);
            logError(error.message || 'Statistics fetch error', 'calculateFinalMark - fetchStats');
        });

    
    var finalMarkResult = document.getElementById('finalMarkResult');
    var smileyFace = document.getElementById('smileyFace');
    var errorResult = document.getElementById('errorResult');


    function createFirework() {
        const colors = ['#FF5733', '#FFBD33', '#75FF33', '#33FFBD', '#33D7FF', '#3375FF', '#8C33FF', '#FF33F6'];
        const firework = document.createElement('div');
        firework.classList.add('firework');
        firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(firework);

        firework.style.top = (50 + Math.random() * 30 - 15) + '%';
        firework.style.left = (50 + Math.random() * 30 - 15) + '%';

        setTimeout(() => {
            firework.remove();
        }, 1000);
    }

    function triggerFireworks() {
        for (let i = 0; i < 30; i++) {
            setTimeout(createFirework, i * 100);
        }
    }
    function restAll() {
        finalMarkResult.textContent = '';
        smileyFace.textContent = '';
        errorResult.textContent = '';
    }
    restAll();

    function showError() {
        restAll();
        errorResult.textContent = 'يرجى التحقق من الإدخالات';
    }


    var midMark = parseFloat(document.getElementById("midMark").value);
    var subjectMark = parseFloat(document.getElementById("subjectMark").value);
    var taskMark = -1;

    if (document.getElementById("taskMark").value !== "") {
        taskMark = parseFloat(document.getElementById("taskMark").value);
    }

    if (isNaN(midMark) || isNaN(subjectMark) || (taskMark !== -1 && isNaN(taskMark)) ||
        midMark > 100 || subjectMark > 100 || taskMark > 100) {
        showError();
        return;
    }





    var MARK1_RATIO = taskMark === -1 ? 0.5 : 0.45;
    var MARK2_RATIO = taskMark === -1 ? 0.5 : 0.45;

    var Mark1 = midMark * MARK1_RATIO;
    var taskMarkRatio = taskMark !== -1 ? taskMark * 0.10 : 0;
    var Mark2 = taskMark !== -1
        ? (subjectMark - (Mark1 + taskMarkRatio)) / MARK2_RATIO
        : (subjectMark - Mark1) / MARK2_RATIO;
    var maxAttempts = 10;
    var attempts = 0;




    while (Mark2 > 100 && attempts < maxAttempts && midMark > 1.0) {
        midMark -= 0.1;
        Mark1 = midMark * MARK1_RATIO;
        Mark2 = taskMark !== -1
            ? (subjectMark - (Mark1 + taskMarkRatio)) / MARK2_RATIO
            : (subjectMark - Mark1) / MARK2_RATIO;
        attempts++;
    }
    attempts = 0;
    while (Mark2 > 100 && attempts < maxAttempts && subjectMark > 1.0) {
        subjectMark -= 0.1;

        Mark2 = taskMark !== -1
            ? (subjectMark - (Mark1 + taskMarkRatio)) / MARK2_RATIO
            : (subjectMark - Mark1) / MARK2_RATIO;

        attempts++;
    }

    Mark2 = Mark2.toFixed(2);
    if (Mark2 < 0 || Mark2 > 100) {
        showError();
        return;
    }




    if (Mark2 >= 60) {
        finalMarkResult.setAttribute('class', 'text-success')
    } else if (Mark2 >= 50) {
        finalMarkResult.setAttribute('class', 'text-orange')
    } else {
        finalMarkResult.setAttribute('class', 'text-danger')

    }



    finalMarkResult.textContent = "علامة الامتحان النهائي : " + Mark2;
    if (Mark2 == 100) {
        smileyFace.textContent = "😊 الـف مـبـــروك";

        triggerFireworks(); triggerFireworks();
    } else if (Mark2 >= 80 && subjectMark >= 50) {
        smileyFace.textContent = "😊 الـف مـبـــروك";
        triggerFireworks();
    } else if (Mark2 >= 80) {
        smileyFace.textContent = "😊";
    } else {
        smileyFace.textContent = "";
    }
 
}





function updateSubjects() {
    const hours = parseInt(document.getElementById('hours').value);
    const subjects = document.getElementById('subjects');
    if (!isNaN(hours)) {
        let calculatedSubjects = Math.floor(hours / 3);
        if (hours == 5) {
            calculatedSubjects = 2;
        }
        subjects.value = calculatedSubjects;
        subjects.min = Math.max(1, Math.ceil(hours / 4));
        subjects.max = Math.min(21, hours);
    }
}

function calculateFees() {
    const bookFee = 16.5;
    const ExtraFee = 200;
    const hourFee = 104.5;
    const additionalFee = 200;
    const hours = parseFloat(document.getElementById('hours').value);
    const subjects = parseFloat(document.getElementById('subjects').value);

    const bookCost = subjects * bookFee;
    const ExtraCost = ExtraFee;
    const hourCost = hours * hourFee;
    const totalCost = bookCost + hourCost + additionalFee;
    const remainingCost = totalCost - 200;

    document.getElementById('bookCost').innerText = bookCost.toFixed(2);
    document.getElementById('hourCost').innerText = hourCost.toFixed(2);
    document.getElementById('ExtraCost').innerText = ExtraCost.toFixed(2);
    document.getElementById('totalCost').innerText = totalCost.toFixed(2);
    document.getElementById('remainingCost').innerHTML = remainingCost.toFixed(2);

    const RegistrationFees = 200;
    const firstPayment = (hourCost / 2) + bookCost;
    const secondPayment = hourCost / 2;

    document.getElementById('RegistrationFees').innerText = RegistrationFees.toFixed(2);
    document.getElementById('firstPayment').innerText = firstPayment.toFixed(2);
    document.getElementById('secondPayment').innerText = secondPayment.toFixed(2);





    const collapseTableFees = new bootstrap.Collapse('#tableFees', {
        toggle: false
    });
    if (collapseTableFees) {
        collapseTableFees.show();
    }

}








const modalImg = document.querySelectorAll('.modal-img');
modalImg.forEach(btnImg => {
    btnImg.addEventListener('click', event => {
        const oldEl = event.target.textContent;
        const sloading = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;
        event.target.innerHTML = `${oldEl} ${sloading}`;
        event.target.disabled = true;
        const modelEl = document.getElementById('img-modal');
        const imgElement = modelEl.querySelector('img');
        imgElement.src = event.target.dataset.img;
        imgElement.onload = () => {
            const modal = new bootstrap.Modal(modelEl);
            if (modal && event.target.dataset.img) {
                modal.show();
                event.target.innerHTML = `${oldEl}`;
                event.target.disabled = false;
            }
        };
        imgElement.onerror = () => {
            event.target.innerHTML = `${oldEl}`;
            event.target.disabled = false;
            alert('حدث خطأ أثناء تحميل الصورة.');
        };
    });
});




let rippleEnabled = true;
function addRippleEffectToButtons() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.removeEventListener('mousedown', createRipple);
        button.addEventListener('mousedown', createRipple);
    });
}
function createRipple(event) {
    if (!rippleEnabled) return;
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    ripple.classList.add('waves-ripple');
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}

document.addEventListener('DOMContentLoaded', addRippleEffectToButtons);
function reloadRippleEffect() {
    rippleEnabled = false;
    addRippleEffectToButtons();
    rippleEnabled = true;
}




var reportButton = document.getElementById('submitReportButton');
if (reportButton) {
    reportButton.addEventListener('click', function (event) {
        event.preventDefault();
        var msg = document.getElementById('messages');
        var btnReport = document.getElementById('spinner-report');
        msg.style.color = '#000';

        document.getElementById('submitReportButton').disabled = true;
        btnReport.classList.remove('d-none');

        const reportType = document.getElementById('reportType');
        const userName = document.getElementById('name');
        const reportMessage = document.getElementById('reportMessage');
        if (!reportMessage.value.trim()) {
            msg.innerHTML = 'الرجاء كتابة نص الرسالة';
            msg.style.color = '#dc3545';
            document.getElementById('submitReportButton').disabled = false;
            btnReport.classList.add('d-none');
            return;
        }
        const finalReportMessage = `${reportMessage.value}\n\n المُرسِل: ${userName.value || 'مجهول'} \n\n صفحة الإرسال: ${window.location.href}`;

        fetch('https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net//api/Report/add', {
            method: 'POST',
            headers: {
                'Accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: 18,
                reportType: reportType.value,
                reportText: finalReportMessage,
                examID: 0,
                questionID: 0,
                optionID: 0
            })
        })
            .then(response => {
                if (response.status === 201 || response.status === 200) {
                    reportType.value = 'اقتراح';
                    reportMessage.value = '';
                    return response.text();
                } else if (response.status === 400) {
                    return response.json().then(error => {
                        throw new Error(`${error.title}: ${error.detail}`);
                    });
                } else {
                    document.getElementById('submitReportButton').disabled = false;
                    btnReport.classList.add('d-none');
                    throw new Error('خطأ في الخادم');
                }
            })
            .then(data => {
                msg.innerHTML = 'تم إرسال الإبلاغ بنجاح!';
                msg.style.color = 'green';
                setTimeout(() => {
                    document.getElementById('submitReportButton').disabled = false;
                    btnReport.classList.add('d-none');
                }, 2000)
            })
            .catch(error => {
                document.getElementById('submitReportButton').disabled = false;
                btnReport.classList.add('d-none');
                msg.innerHTML = 'فشل إرسال الإبلاغ\n' + error;
                msg.style.color = '#dc3545';
                logError(error.message || 'Report submission error', 'submitReportButton event');
            });
    });

}





async function getParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}





//Cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}


//themes
function applyTheme() {
    var theme = getCookie('theme');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (theme) {
        const setDMStyle = document.querySelectorAll('.dropdown-menu');
        setDMStyle.forEach(d => {
            if (theme == 'dark') {
                d.classList.remove('dropdown-menu-light');
                d.classList.add('dropdown-menu-dark');
            } else {
                d.classList.add('dropdown-menu-light');
                d.classList.remove('dropdown-menu-dark');
            }
        });
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('theme-switch').checked = theme == 'dark' ? true : false;
        metaThemeColor && metaThemeColor.setAttribute('content', theme == 'dark' ? '#121212' : '#212529');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        metaThemeColor && metaThemeColor.setAttribute('content', '#212529');
    }
}





function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    setCookie('theme', newTheme, 30);
    applyTheme();
}

document.addEventListener('DOMContentLoaded', applyTheme);
document.getElementById('theme-switch').addEventListener('change', toggleTheme);



function setCourseVal(courseName) {
    document.querySelector('#zamayl-subject-name').value = courseName;
}


function resultSearchCoursePDF(data, text) {
    var summarySearch = document.querySelector('.summarySearchCourse');
    if (data && text) {
        const courses = [];
        let count = 0;
        data.map(c => {
            if (c && c.courseName && c.courseNo) {
                const cId = c.courseNo.toString();
                if (testText(text, c.courseName) || cId == text) {
                    count++;
                    if (count < 11) {
                        courses.push(`<li><a class='dropdown-item' href="javascript:;" onclick="setCourseVal('${c.courseName}')">${c.courseName}</a></li>`);
                    }
                }
            }
        });
        if (courses.length > 0) {


            summarySearch.innerHTML = courses.join('');

        } else {
            courses.push(`<li><span class='dropdown-item'>لا يوجد نتائج</span></li>`);
            summarySearch.innerHTML = courses.join('');
        }

    }
}




/*search course */
function testText(searchText, dataText) {
    const normalize = text => text.replace(/أ|ا|آ|إ/gi, "ا").replace(/ى/gi, "ي").replace(/و/gi, "ؤ").replace(/ /gi, ' ').toLowerCase();
    return normalize(dataText).includes(normalize(searchText));
}



function resultSearchCourse(data, text) {
    var summarySearch = document.querySelector('.summarySearchCourse');
    if (data && text) {
        const courses = [];
        let count = 0;
        data.map(c => {
            if (c && c.courseName && c.courseNo) {
                const cId = c.courseNo.toString();
                if (testText(text, c.courseName) || cId == text) {
                    count++;
                    if (count < 11) {
                        courses.push(`<li><a class='dropdown-item' href="/courses/?id=${cId}"><i class="fa-solid fa-book me-2 py-2"></i>${c.courseName}</a></li>`);
                    }
                }
            }
        });
        if (courses.length > 0) {
            if (count > 10) {
                courses.push(`<li><button type="submit" class='dropdown-item'><i class="fa-solid fa-books me-2 py-2"></i>إظهار الكل (${count})</button></li>`);
                summarySearch.innerHTML = courses.join('');
            } else {
                summarySearch.innerHTML = courses.join('');
            }
        } else {
            courses.push(`<li><span class='dropdown-item'>لا يوجد نتائج</span></li>`);
            summarySearch.innerHTML = courses.join('');
        }

    } else {
        alert(false)
    }
}
let dataCourses = null;
async function fetchDataCourse(text, type) {
    var summarySearch = document.querySelector('.summarySearchCourse');
    var summarySearchBox = document.querySelector('.result-search-course');
    var summaryFavoriteBox = document.querySelector('.result-favorite-course');

    if (dataCourses) {
        if (type == 'submit') {
            searchCourses(dataCourses, text);
        } else if (type == 'keyup') {
            resultSearchCourse(dataCourses, text);
        } else if (type == 'favorite') {
            resultFavoriteCourse(dataCourses);
        } else if (type == 'PDF') {
            resultSearchCoursePDF(dataCourses, text);
        }
    } else {
        try {
            const response = await fetch('https://zplatform2.azurewebsites.net/api/Course/List');
            if (!response.ok) {
                if (type == 'submit') {
                    summarySearchBox.innerHTML = `<div class="col-12 text-center fw-bold p-5 text-danger">حدث خطأ ما ، يرجى إعادة تحميل الصفحة</div>`;
                } else if (type == 'keyup') {
                    summarySearch.innerHTML = `<li><span class="px-2"><i class='fa-regular fa-face-frown-open'></i> حدث خطأ</span></li>`;
                } else if (type == 'favorite') {
                    summaryFavoriteBox.innerHTML = `<div class="col-12 text-center fw-bold p-5 text-danger">حدث خطأ ما ، يرجى إعادة تحميل الصفحة</div>`;
                } else if (type == 'PDF') {
                    summarySearch.innerHTML = `<li><span class="px-2"><i class='fa-regular fa-face-frown-open'></i> حدث خطأ</span></li>`;
                }
                throw new Error('حدث خطأ أثناء جلب البيانات');
            }
            dataCourses = await response.json();
            if (type == 'submit') {
                searchCourses(dataCourses, text);
            } else if (type == 'keyup') {
                resultSearchCourse(dataCourses, text);
            } else if (type == 'favorite') {
                resultFavoriteCourse(dataCourses);
            } else if (type == 'PDF') {
                resultSearchCoursePDF(dataCourses, text);
            }
        } catch (error) {
            console.error(error);
            logError(error.message || 'Course fetch error', 'fetchDataCourse - type: ' + type);
            if (type == 'submit') {
                summarySearchBox.innerHTML = `<div class="col-12 text-center fw-bold p-5 text-danger">حدث خطأ ما ، يرجى إعادة تحميل الصفحة</div>`;
            } else if (type == 'keyup') {
                summarySearch.innerHTML = `<li><span><i class='fa-regular fa-face-frown-open'></i> حدث خطأ</span></li>`;
            } else if (type == 'favorite') {
                summaryFavoriteBox.innerHTML = `<div class="col-12 text-center fw-bold p-5 text-danger">حدث خطأ ما ، يرجى إعادة تحميل الصفحة</div>`;
            } else if (type == 'PDF') {
                summarySearch.innerHTML = `<li><span><i class='fa-regular fa-face-frown-open'></i> حدث خطأ</span></li>`;
            }
        }
    }
}










var courseVal = document.querySelector("#courseVal");
if (courseVal) {
    courseVal.addEventListener("keyup", function () {
        var summarySearch = document.querySelector('.summarySearchCourse');
        const d = document.querySelector("#dropdownSummarySearch");
        if (d) {
            const dropdown = new bootstrap.Dropdown(d);

            if (dropdown) {
                dropdown.show();
                summarySearch.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
                if (this.value === "" || this.value.trim() === "") {
                    dropdown.hide();
                } else {
                    fetchDataCourse(this.value, 'keyup');
                }
            } else {
                alert('حدث خطأ في البحث، يرجى اعادة تحميل الصفحة')
            }
        }
    });
}


var coursePDFVal = document.querySelector("#zamayl-subject-name");
if (coursePDFVal) {
    coursePDFVal.addEventListener("keyup", function () {
        var summarySearch = document.querySelector('.summarySearchCourse');
        const d = document.querySelector("#dropdownSummarySearch");
        if (d) {
            const dropdown = new bootstrap.Dropdown(d);

            if (dropdown) {
                dropdown.show();
                summarySearch.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
                if (this.value === "" || this.value.trim() === "") {
                    dropdown.hide();
                } else {
                    fetchDataCourse(this.value, 'PDF');
                }
            } else {
                alert('حدث خطأ في البحث، يرجى اعادة تحميل الصفحة')
            }
        }
    });
}



function resultFavoriteCourse(data) {
    var summaryFavoriteBox = document.querySelector('.result-favorite-course');
    if (data) {
        const courses = [];
        let myCourses = JSON.parse(localStorage.getItem('myCourses')) || [];
        data.map(c => {
            if (c && c.courseName && c.courseNo) {
                const cId = c.courseNo.toString();
                const indexFavorite = myCourses.indexOf(cId);
                if (indexFavorite !== -1) {
                    courses.push(`
                          <div class="col-3 col-md-3 mt-3 box-book">
                            <a href="/courses/?id=${cId}" class="d-flex flex-column gap-2 text-wrap link-success btn waves-dark fw-bold text-decoration-none border rounded-2 py-3">
                                <i class="fa-solid fa-book" style="font-size: 80px;"></i> ${c.courseName} </a>
                            </div>
                        `);
                }
            }
        });
        if (courses.length > 0) {
            summaryFavoriteBox.innerHTML = courses.join('');
            reloadRippleEffect();
        } else {
            courses.push(`<div class="col-12 text-center fw-bold p-5">لم تقم بإضافة موادك بعد <div class='col-12 text-center'> <a href="/courses/course-search.html" class="btn btn-outline-success mt-4">إضافة<i class="fa-solid fa-plus ms-1"></i></button></div></div>`);
            summaryFavoriteBox.innerHTML = courses.join('');
        }

    }
}






function isFavorite(courseID) {
    var elFavorite = document.querySelector('.el-btn-favorite');
    if (courseID) {
        let myCourses = JSON.parse(localStorage.getItem('myCourses')) || [];
        const indexFavorite = myCourses.indexOf(courseID.toString());
        if (indexFavorite === -1) {
            elFavorite.innerHTML = `<button type="button" class="btn btn-success btn-course-favorite" data-course="${courseID}">الإضافة إلى موادي<i class="ms-1 fa-solid fa-plus"></i>`
        } else {
            elFavorite.innerHTML = `<button type="button" class="btn btn-danger btn-course-favorite" data-course="${courseID}">الإزالة من موادي <i class="ms-1 fa-solid fa-trash"></i></button>`
        }
        reloadRippleEffect();
    }
}











function searchCourses(data, text) {
    var summarySearchBox = document.querySelector('.result-search-course');
    if (data && text) {
        const courses = [];
        let count = 0;
        let myCourses = JSON.parse(localStorage.getItem('myCourses')) || [];
        data.map(c => {
            if (c && c.courseName && c.courseNo) {
                const cId = c.courseNo.toString();
                if (testText(text, c.courseName) || cId == text) {
                    count++;
                    const indexFavorite = myCourses.indexOf(cId);
                    const favorite = (indexFavorite === -1) ? 'fa-regular' : 'fa-solid';
                    courses.push(`
                          <div class="col-3 col-md-3 mt-3 box-book">
                            <a href="/courses/?id=${cId}" class="d-flex flex-column gap-2 text-wrap link-success btn waves-dark fw-bold text-decoration-none border rounded-2 py-3">
                                <i class="fa-solid fa-book" style="font-size: 80px;"></i> ${c.courseName} </a>
                            <button title="الإضافة إلى موادي" class="btn btn-favorite rounded-circle waves-dark" data-course="${cId}"><i class="${favorite} fa-star"></i></button>
                            </div>
                        `);
                }
            }
        });
        if (courses.length > 0) {
            let textRes = 'مادة'
            if (count == 1) {
                textRes = 'مادة واحدة'
            } else if (count == 2) {
                textRes = 'مادتين'
            } else if (count >= 3 && count < 11) {
                textRes = count + ' مواد'
            } else {
                textRes = count + ' مادة'
            }
            summarySearchBox.innerHTML = `<div class="col-12 text-center fw-bold mt-4 py-2 border-bottom">نتيجة البحث: <b>${textRes}</b></div><div class="col-12 text-center mb-3 mt-2">إضغط على <i class="fa-regular fa-star favorite-example"></i> لإضافة المادة للمفضلة</div>` + courses.join('');
            reloadRippleEffect();
        } else {
            courses.push(`<div class="col-12 text-center fw-bold p-5">لم يتم العثور على نتائج</div>`);
            summarySearchBox.innerHTML = courses.join('');
        }

    }
}
/*end search course */



document.addEventListener('click', (event) => {
    const button = event.target.closest('.btn-favorite');
    const buttonRemove = event.target.closest('.btn-favorite-delete');
    const elCourseFavorite = document.querySelector('.el-btn-favorite');
    const buttonCourseFavorite = event.target.closest('.btn-course-favorite');

    if (button || buttonRemove || buttonCourseFavorite) {
        const courseId = button ? button.dataset.course : buttonCourseFavorite.dataset.course;
        if (courseId === '') return;
        let myCourses = JSON.parse(localStorage.getItem('myCourses')) || [];
        const index = myCourses.indexOf(courseId);
        if (index === -1) {
            if ((button && !buttonRemove) || buttonCourseFavorite) {
                myCourses.push(courseId);
                showToast('تم حفظ المادة', 'success');
                if (buttonCourseFavorite) {
                    elCourseFavorite.innerHTML = `<button type="button" class="btn btn-danger btn-course-favorite" data-course="${courseId}">الإزالة من موادي <i class="ms-1 fa-solid fa-trash"></i></button>`
                } else if (button) {
                    button.querySelector('.fa-star').classList.remove('fa-regular');
                    button.querySelector('.fa-star').classList.add('fa-solid');
                }
            }
            gtag('event', 'FavoriteButton', {
                'event_category': 'Button',
                'event_label': `اضاف الطالب المادة ${courseId} الى المفضلة`
            });
        } else {
            myCourses.splice(index, 1);
            if (buttonRemove) {
                const RemoveBox = event.target.closest('.box-book');
                const resultFavorite = document.querySelector('.result-favorite-course');
                RemoveBox.remove();
                if (myCourses.length < 1) {
                    resultFavorite.innerHTML = `<div class="col-12 text-center fw-bold p-5">قائمة المفضلة فارغة <div class='col-12 text-center'> <a href="/courses/course-search.html" class="btn btn-outline-success mt-4">إضافة<i class="fa-solid fa-plus ms-1"></i></button></div></div>`;
                }
                showToast('تم إزالة المادة', 'default');
            } else if (buttonCourseFavorite) {
                elCourseFavorite.innerHTML = `<button type="button" class="btn btn-success btn-course-favorite" data-course="${courseId}">الإضافة إلى موادي <i class="ms-1 fa-solid fa-plus"></i></button>`
                showToast('تم إزالة المادة', 'default');
            } else if (button && !buttonRemove) {
                button.querySelector('.fa-star').classList.add('fa-regular');
                button.querySelector('.fa-star').classList.remove('fa-solid');
                showToast('تم إزالة المادة', 'default');
            }

        }
        localStorage.setItem('myCourses', JSON.stringify(myCourses));
    }
});









let dataExamList = null;
async function fetchDataExams(courseList) {
    var summaryBox = document.querySelector('.result-search-course');
    try {
        const response = await fetch('https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net//api/Exam/CoursesExamsList');
        if (!response.ok) {
            summaryBox.innerHTML = `<li><span><i class='fa-regular fa-face-frown-open'></i> حدث خطأ</span></li>`;
            throw new Error('حدث خطأ أثناء جلب البيانات', response);
        }
        dataExamList = await response.json();
        if (courseList == 'course') {
            examsCourse(dataExamList);
        } else if (courseList == 'list') {
            examList(dataExamList, null);
        }
    } catch (error) {
        console.error(error);
        logError(error.message || 'Exams fetch error', 'fetchDataExams');
        summaryBox.innerHTML = `<div class="col-12 text-center fw-bold p-5 text-danger">حدث خطأ ما ، تعذر عرض الملفات!</div>`;
    }
}

function examList(data, text) {
    var summaryBox = document.querySelector('.result-search-course');
    if (data) {

        const courses = [];
        data.map(c => {
            if (c && c.courseName && c.courseID) {
                if (text && testText(text, c.courseName) || c.courseID.toString() == text) {
                    courses.push(`
                          <div class="col-3 col-md-3 mt-3 box-book">
                            <a href="/exams/course.html?id=${c.courseID}" class="d-flex flex-column gap-2 text-wrap link-success btn waves-dark fw-bold text-decoration-none border rounded-2 py-3">
                                <i class="fa-solid fa-book" style="font-size: 80px;"></i> ${c.courseName} </a>
                            </div>
                        `);
                } else if (!text) {
                    courses.push(`
                        <div class="col-3 col-md-3 mt-3 box-book">
                          <a href="/exams/course.html?id=${c.courseID}" class="d-flex flex-column gap-2 text-wrap link-success btn waves-dark fw-bold text-decoration-none border rounded-2 py-3">
                              <i class="fa-solid fa-book" style="font-size: 80px;"></i> ${c.courseName} </a>
                          </div>
                      `);
                }
            }
        });
        if (courses.length > 0) {
            summaryBox.innerHTML = courses.join('');
            reloadRippleEffect();
        } else {
            courses.push(`<div class="col-12 text-center fw-bold p-5">لم يتم العثور على نتائج</div>`);
            summaryBox.innerHTML = courses.join('');
        }

    }
}


async function examsCourse(data) {
    var summaryBox = document.querySelector('.result-search-course');
    const courseId = await getParam('id') || null;
    if (data && courseId) {
        const exams = [];
        data.map(c => {
            if (c && c.courseID) {
                if (c.courseID.toString() === courseId) {
                    document.querySelector('.page-title').innerHTML = 'امتحانات ' + c.courseName || 'غير معروف';
                    document.title = 'امتحانات ' + c.courseName;
                    if (c.exams && Array.isArray(c.exams)) {
                        c.exams.map(e => {
                            exams.push(`
                                <div class="col-3 col-md-3 mt-3 box-book">
                                  <a href="/exams/exam.html?id=${e.examID}" class="d-flex flex-column gap-2 text-wrap link-success btn waves-dark fw-bold text-decoration-none border rounded-2 py-3">
                                      <i class="fa-duotone fa-solid fa-memo-pad" style="font-size: 80px;"></i> ${e.examType} (${e.examID}) </a>
                                  </div>
                              `);
                        });
                    } else {
                        exams.push(`<div class="col-12 text-center fw-bold p-5">لم يتم إضافة امتحانات لهذه المادة</div>`);
                    }
                }
            }
        });
        if (exams.length > 0) {
            summaryBox.innerHTML = exams.join('');
            reloadRippleEffect();
        } else {
            exams.push(`<div class="col-12 text-center fw-bold p-5">لم يتم العثور على نتائج</div>`);
            summaryBox.innerHTML = exams.join('');
        }
    }

}




var courseValExams = document.querySelector("#courseValExams");
if (courseValExams) {
    courseValExams.addEventListener("keyup", function () {
        if (dataExamList) {
            if (this.value === "" || this.value.trim() === "") {
                examList(dataExamList, null);
            } else {
                examList(dataExamList, this.value)
            }
        }
    });
}








let toast;
function showToast(text, type) {
    const toastElement = document.querySelector('#toastSite .toast');
    const toastType = toastElement.dataset.type;
    const toastText = document.querySelector('#toastSite .toast-body');
    if (toastElement) {
        if (toast) {
            toast.dispose();
        }
        toastElement.classList.remove(toastType);
        if (type == 'success') {
            toastElement.dataset.type = 'text-bg-success';
            toastElement.classList.add('text-bg-success');
        } else if (type == 'error') {
            toastElement.dataset.type = 'text-bg-danger';
            toastElement.classList.add('text-bg-danger');
        } else if (type == 'alert') {
            toastElement.dataset.type = 'text-bg-warning';
            toastElement.classList.add('text-bg-warning');
        } else if (type == 'default') {
            toastElement.dataset.type = 'text-bg-dark';
            toastElement.classList.add('text-bg-dark');
        } else {
            toastElement.dataset.type = 'text-bg-primary';
            toastElement.classList.add('text-bg-primary');
        }
        toastText.innerHTML = text;
        toast = new bootstrap.Toast(toastElement);
        setTimeout(() => toast.show(), 100)
    }
}












(() => {
    'use strict'
    const formMark = document.querySelector('.needs-validation.form-get-mark');
    const formFees = document.querySelector('.needs-validation.form-get-fees');
    const formExam = document.querySelector('.needs-validation.form-get-exam');
    const formCourseSearch = document.querySelector('.needs-validation.form-search-course');

    if (formMark) {
        formMark.addEventListener('submit', event => {
            event.preventDefault();
            if (!formMark.checkValidity()) {
                event.stopPropagation();
            } else {
                calculateFinalMark();
            }
            formMark.classList.add('was-validated');
        }, false);
    }
    if (formCourseSearch) {
        formCourseSearch.addEventListener('submit', event => {
            event.preventDefault();
            if (!formCourseSearch.checkValidity()) {
                event.stopPropagation();
            } else {
                const d = document.querySelector("#dropdownSummarySearch");
                if (d) {
                    const dropdown = bootstrap.Dropdown.getInstance(d);
                    if (dropdown) {
                        setTimeout(() => {
                            dropdown.hide();
                        }, 200)
                    }
                }
                var text = document.querySelector("#courseVal").value.trim();
                fetchDataCourse(text, 'submit');
            }
            formCourseSearch.classList.add('was-validated');
        }, false);
    }
    if (formFees) {
        formFees.addEventListener('submit', event => {
            event.preventDefault();
            if (!formFees.checkValidity()) {
                event.stopPropagation();
                const collapseTableFees = new bootstrap.Collapse('#tableFees', {
                    toggle: false
                });
                if (collapseTableFees) {
                    collapseTableFees.hide();
                }

            } else {
                calculateFees();
            }
            formFees.classList.add('was-validated');
        }, false);
    }

    if (formExam) {
        document.querySelector('.alerts').innerHTML = "";

        formExam.addEventListener('submit', event => {
            event.preventDefault();
            if (!formExam.checkValidity()) {
                const lang = document.querySelector('.alerts').dataset.lang;
                if (lang == 'en') {
                    document.querySelector('.alerts').innerHTML = `There are questions you haven't answered!`;
                } else {
                    document.querySelector('.alerts').innerHTML = "يوجد أسئلة لم تجب عنها!";
                }


                event.stopPropagation();
            } else {
                submitExam();
            }
            formExam.classList.add('was-validated');
        }, false);
    }
})();







async function logPageVisit() {
    const newData = {
        additionalData: 'Current Page: ' + window.location.href,
        message: 'User Has Clicked On The Join Facebook Group Button'
    }
    try {
        fetch('https://zplatform2.azurewebsites.net/api/Log/loginfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        })
            .then(result => {

                //   const data = result.json() 
                // console.log('Log success:', data.msg);


            })




    } catch (error) {
        console.error('Error logging page visit:', error);
        logError(error.message || 'Page visit logging error', 'logPageVisit');
    }
}
async function logPageVisitByFixedButton() {
    const newData = {
        additionalData: 'Current Page: ' + window.location.href,
        message: 'User Has Clicked On The Join Facebook Group Button By Fixed Button'
    }
    try {
        fetch('https://zplatform2.azurewebsites.net/api/Log/loginfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        })
            .then(result => {

                //   const data = result.json() 
                // console.log('Log success:', data.msg);


            })




    } catch (error) {
        console.error('Error logging page visit:', error);
        logError(error.message || 'Page visit by fixed button logging error', 'logPageVisitByFixedButton');
    }
}









// التعامل مع الحدث للنقر على الرابط
var joinFacebook = document.getElementById('join-facebook-group-button');
if (joinFacebook) {
    joinFacebook.addEventListener('click', (event) => {
        event.preventDefault(); // منع الانتقال مباشرةً
        logPageVisit();
        window.open('https://www.facebook.com/groups/zamayl', '_blank'); // فتح الرابط في نافذة جديدة
    });
}

// التعامل مع الحدث للنقر على الرابط
var joinFacebook = document.getElementById('fixed-join-facebook-group-button');
if (joinFacebook) {
    joinFacebook.addEventListener('click', (event) => {
        event.preventDefault(); // منع الانتقال مباشرةً
        logPageVisitByFixedButton();
        window.open('https://www.facebook.com/groups/zamayl', '_blank'); // فتح الرابط في نافذة جديدة
    });
}


(() => {
    'use strict'
    const formMark = document.querySelector('.needs-validation.form-get-mark');
    const formFees = document.querySelector('.needs-validation.form-get-fees');
    const formExam = document.querySelector('.needs-validation.form-get-exam');
    const formCourseSearch = document.querySelector('.needs-validation.form-search-course');

    if (formMark) {
        formMark.addEventListener('submit', event => {
            event.preventDefault();
            if (!formMark.checkValidity()) {
                event.stopPropagation();
            } else {
                calculateFinalMark();
            }
            formMark.classList.add('was-validated');
        }, false);
    }
    if (formCourseSearch) {
        formCourseSearch.addEventListener('submit', event => {
            event.preventDefault();
            if (!formCourseSearch.checkValidity()) {
                event.stopPropagation();
            } else {
                const d = document.querySelector("#dropdownSummarySearch");
                if (d) {
                    const dropdown = bootstrap.Dropdown.getInstance(d);
                    if (dropdown) {
                        setTimeout(() => {
                            dropdown.hide();
                        }, 200)
                    }
                }
                var text = document.querySelector("#courseVal").value.trim();
                fetchDataCourse(text, 'submit');
            }
            formCourseSearch.classList.add('was-validated');
        }, false);
    }
    if (formFees) {
        formFees.addEventListener('submit', event => {
            event.preventDefault();
            if (!formFees.checkValidity()) {
                event.stopPropagation();
                const collapseTableFees = new bootstrap.Collapse('#tableFees', {
                    toggle: false
                });
                if (collapseTableFees) {
                    collapseTableFees.hide();
                }

            } else {
                calculateFees();
            }
            formFees.classList.add('was-validated');
        }, false);
    }

    if (formExam) {
        document.querySelector('.alerts').innerHTML = "";

        formExam.addEventListener('submit', event => {
            event.preventDefault();
            if (!formExam.checkValidity()) {
                const lang = document.querySelector('.alerts').dataset.lang;
                if (lang == 'en') {
                    document.querySelector('.alerts').innerHTML = `There are questions you haven't answered!`;
                } else {
                    document.querySelector('.alerts').innerHTML = "يوجد أسئلة لم تجب عنها!";
                }


                event.stopPropagation();
            } else {
                submitExam();
            }
            formExam.classList.add('was-validated');
        }, false);
    }
})();



async function handleImageToPdfSubmission(event) {
    event.preventDefault();  // تأكد من أن الـ event معرف

    const submitButton = document.getElementById('zamayl-submit-btn');
    const spinner = document.getElementById('spinner');
    submitButton.disabled = true;
    spinner.style.display = 'inline-block'; // إظهار الـ Spinner

    // الكود القديم - تم تعليقه
    // const branchSelect = document.getElementById('zamayl-branch-id').value;
    // const termSelect = document.getElementById('zamayl-term-id').value;
    // const sId = document.getElementById('student-id').value;
    // const studentId = `${branchSelect}${termSelect}${sId}`;

    // الكود الجديد - قراءة الرقم الجامعي الكامل مباشرة
    const studentName = document.querySelector('#zamayl-student-name').value;
    const studentId = document.querySelector('#zamayl-student-id').value;
    let subjectCode = "0000";
    
    const instructorName = document.querySelector('#zamayl-instructor-name').value;
    const sectionNumber = document.querySelector('#zamayl-section-number').value;
    const subjectName = document.querySelector('#zamayl-subject-name').value;
    const images = document.querySelector('#zamayl-upload-files').files;

    // تحقق من المدخلات
    if (!studentName) {
        document.getElementById('response').textContent = 'يرجى إدخال اسم الطالب.';
        submitButton.disabled = false;
        spinner.style.display = 'none';
        return;
    }
    
    // تحقق من الرقم الجامعي
    if (!studentId) {
        document.getElementById('response').textContent = 'يرجى إدخال الرقم الجامعي.';
        submitButton.disabled = false;
        spinner.style.display = 'none';
        return;
    }
    
    // تحقق من المدخلات
    if (!subjectName) {
        document.getElementById('response').textContent = 'يرجى إدخال اسم المادة.';
        submitButton.disabled = false;
        spinner.style.display = 'none';
        return;
    }


    if (images.length === 0) {
        document.getElementById('response').textContent = 'يرجى رفع صورة واحدة على الأقل.';
        submitButton.disabled = false;
        spinner.style.display = 'none';
        return;
    }
    document.getElementById('response').textContent = '';


try {
    const response = await fetch("https://zplatform2.azurewebsites.net/api/Course/List");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const course = data.find(item => item.courseName === subjectName);
    subjectCode = course ? course.courseNo : "0";
} catch (error) {
    console.error("Error fetching course data:", error);
    logError(error.message || 'Course code fetch error', 'handleImageToPdfSubmission - fetchCourseCode');
    subjectCode = "0"; 
}

    const formData = new FormData();

    // دالة لضغط الصورة
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            new Compressor(file, {
                quality: 0.7, 
                maxWidth: 1024, 
                maxHeight: 1024, 
                success(result) {
                    resolve(result);
                },
                error(err) {
                    reject(err);
                }
            });
        });
    }

    // ضغط الصور وإضافتها إلى FormData
   // for (let i = images.length - 1; i >= 0; i--) {
    for (let i = 0; i < images.length ; i++) {
    try {
            const compressedImage = await compressImage(images[i]);
            formData.append('images', compressedImage);
        } catch (error) {
            document.getElementById('response').textContent = `خطأ في ضغط الصورة: ${error.message}`;
            logError(error.message || 'Image compression error', 'handleImageToPdfSubmission - compressImage');
            submitButton.disabled = false;
            spinner.style.display = 'none';
            return;
        }
    }

    // إرسال الطلب إلى API
    try {
        const response = await fetch(
            `https://task-to-pdf.azurewebsites.net/api/CreateImageAndConvertToPdf?code=jBWEEc0RKWUxrEmWeCWG31URkHhGoNhcVxodidQ5AyN0AzFuDdwBkQ==&studentName=${studentName}&studentId=${studentId}&subjectName=${subjectName}&subjectCode=${subjectCode}&instructorName=${instructorName}&sectionNumber=${sectionNumber}`,
         {  
                method: 'POST',
                body: formData
            }
        );

        if (response.ok) {
            const jsonResponse = await response.json();  
            const fileUrl = jsonResponse.fileUrl;
            await LogSubmitPDFConvertor();

            if(jsonResponse.fileUrl)
            setDataPDFFile(jsonResponse);


        } else {
            const errorText = await response.text();
            document.getElementById('response').textContent = `خطأ ${errorText} يرجى المحاولة مرة أخرى`;
            await LogError('Error fetching in handleImageToPdfSubmission method: '+errorText);

        }
    } catch (error) {
        document.getElementById('response').textContent = `خطأ في الاتصال بالخدمة: ${error.message}`;
        await LogError(`خطأ في الاتصال بالخدمة in handleImageToPdfSubmission method: ${error.message}`);
        logError(error.message || 'PDF conversion API error', 'handleImageToPdfSubmission - mainAPI');

    } finally {
        // إعادة تمكين الزر وإخفاء الـ Spinner
        submitButton.disabled = false;
        spinner.style.display = 'none';
    }
    return null;
}


function setDataPDFFile(data) {
    const elements = [];
    elements.push(`<div class="d-flex fs-5 fw-bold">تم تحويل الصور بنجاح!</div>`);
    elements.push(`<div class="text-center my-3">`);
    
    // زر التنزيل
    elements.push(`<a role="button" class="btn btn-outline-primary mx-2 border-0 py-3 shadow-sm" style="width:150px" href="${data.fileUrl}" download>
        <div class="d-flex flex-column justify-content-center text-center text-warb">
            <div class="iconFile" style="font-size:60px"><i class="fad fa-download"></i></div>
            <div class="textFile fw-bold">تنزيل</div>
        </div>
    </a>`);
    
    // النص والصورة أسفل زر التنزيل
    elements.push(`
        <div class="mt-3 text-center">
            <div class="d-flex justify-content-center align-items-center mb-2">
                <img src="https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg" alt="Moodle Logo" style="height:24px;">
            </div>
            <div>الخطوة التالية بعد التنزيل:</div>
            <a href="https://activity.qou.edu/login/index.php" target="_blank" class="text-decoration-none">
                اضغط هنا للوصول لمنصة الأنشطة وتسليم النشاط
            </a>
            <br>
            <br>
            <br>
<button type="button" class="btn btn-link" data-bs-toggle="modal" data-bs-target="#reportModal">
    الإبلاغ عن مشكلة
</button>


        </div>
    `);

    elements.push(`</div>`);
    elements.push(``);
    document.querySelector('#file-buttons-pdf').innerHTML = elements.join('');
}



// دالة updateStudentId - تم تعليقها لأنها لم تعد ضرورية بعد التغيير لإدخال الرقم الجامعي الكامل
/*
 function updateStudentId() {
    const branchSelect = document.getElementById('zamayl-branch-id');
    const termSelect = document.getElementById('zamayl-term-id');
    document.getElementById('branch-id').textContent =branchSelect.value;
    document.getElementById('term-id').textContent =termSelect.value;
}
*/





// Function to fetch instructor names based on input
function fetchInstructors(query) {
    const dropdown = document.getElementById('instructors-dropdown');
    dropdown.innerHTML = ''; // Clear previous results

    if (!query) {
        dropdown.style.display = 'none'; // Hide dropdown if input is empty
        return;
    }

    // Show spinner while fetching data
    dropdown.style.display = 'block';
    dropdown.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

    // Fetch the instructor names from the provided file
    fetch('https://zamaylsa.blob.core.windows.net/task/FacultyMembers_14.txt')
        .then(response => response.text())
        .then(data => {
            const instructors = data.split('\n').map(item => item.trim());
            const filteredInstructors = instructors.filter(name => name.toLowerCase().includes(query.toLowerCase()));

            // Remove spinner after loading data
            dropdown.innerHTML = '';

            if (filteredInstructors.length > 0) {
                filteredInstructors.forEach(instructor => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('dropdown-item');
                    listItem.textContent = instructor;
                    listItem.onclick = function () {
                        document.getElementById('zamayl-instructor-name').value = instructor;
                        dropdown.style.display = 'none'; // Hide dropdown after selection
                    };
                    dropdown.appendChild(listItem);
                });
            } else {
                dropdown.style.display = 'none'; // Hide dropdown if no matches
            }
        })
        .catch(error => {
            console.error('Error fetching instructors:', error);
            LogError('Error fetching instructors:'+error);
            logError(error.message || 'Instructors fetch error', 'fetchInstructors');
            dropdown.style.display = 'none'; // Hide dropdown in case of error
        });
}

// Hide the dropdown if the user clicks outside
document.addEventListener('click', function (e) {
    try {
        const dropdown = document.getElementById('instructors-dropdown');
        const input = document.getElementById('zamayl-instructor-name');
        // If dropdown is not on this page, do nothing safely
        if (!dropdown) return;
        const target = e && e.target ? e.target : null;
        if (!target) return;
        // Hide only when clicking outside the dropdown and not on the input
        if (dropdown && !dropdown.contains(target) && target !== input) {
            dropdown.style.display = 'none';
        }
    } catch (err) {
        console.warn('Safe-guard: instructors dropdown handler error', err);
        logError(err.message || 'Dropdown handler error', 'document click event - instructors');
    }
});







async function LogSubmitPDFConvertor() {
    const newData = {
        additionalData: 'Current Page: ' + window.location.href,
        message: 'User Has Clicked On PDF Convertor Button'
    }
    try {
        fetch('https://zplatform2.azurewebsites.net/api/Log/loginfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        })
            .then(result => {

                //   const data = result.json() 
                // console.log('Log success:', data.msg);
            })
    } catch (error) {
        console.error('Error logging page visit:', error);
        logError(error.message || 'PDF convertor logging error', 'LogSubmitPDFConvertor');
    }
}



async function LogError(errorText) {
    const newData = {
        additionalData: 'Current Page: ' + window.location.href,
        message:  errorText  // إضافة النص الذي يوضح سبب الفشل
    };

    try {
        // انتظار استجابة fetch باستخدام await
        const response = await fetch('https://zplatform2.azurewebsites.net/api/Log/logerror', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });

        // التحقق من نجاح الاستجابة
        if (response.ok) {
            const result = await response.json();  // الحصول على البيانات من الاستجابة إذا كانت JSON
            console.log('Log success:', result);  // تسجيل نتيجة الاستجابة في الـ console
        } else {
            console.error('Error logging failed submission. Response status:', response.status);
        }
    } catch (error) {
        console.error('Error logging page visit:', error);
        logError(error.message || 'Error logging error', 'LogError function');
    }
}










function ReportButton(data) {

        elements.push(`
<button type="button" class="btn btn-link" data-bs-toggle="modal" data-bs-target="#reportModal">
    الإبلاغ عن مشكلة
</button>
    `);

        }
