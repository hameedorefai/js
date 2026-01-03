let examData;
let GCompletionTime;
const startTime = new Date().toISOString(); 

function getExamId(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function fetchExamData() {
    const examId = getExamId('id') || null;
    try {
        if (!examId) {
            alert('يرجى إتباع رابط صحيح')
        }

        const response = await fetch('https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net//api/Exam/id/' + examId);
        if (!response.ok) {
            throw new Error('حدث خطأ في جلب البيانات');
        }

        examData = await response.json();
        //console.log("Exam Data:", examData); // For debugging
        displayExamData(examData);
    } catch (error) {
        console.error('Error fetching exam data:', error);
        logError(error.message || 'Error fetching exam data', 'fetchExamData - examPage.js');
        document.getElementById('exam-content').innerHTML = `<div class="text-center py-4 text-danger">${error.message}</div>`;
    }
}

function submitExam() {

    var btn = document.querySelector('.btn-submit');
    var spinnert = btn.querySelector('.spinner-border');
    const lang = btn.getAttribute('data-lang') || 'ar';

    btn.disabled = true;
    spinnert.classList.remove('d-none');


    const questions = document.querySelectorAll('.question');
    const elements = [...questions].map((q, i) => {
        var getInput = q.querySelectorAll('input')[0];
        var n = getInput.name;
        if (!q.querySelector('input[name=' + n + ']:checked')) {
            return 'يجب الإجابة على السؤال ' + (i + 1) + '<br>';
        }
        return null;
    });
    if (elements.join('') != null && elements.join('') != "") {
        document.querySelector('.alerts').innerHTML = elements.join('');
        btn.disabled = false;
        spinnert.classList.add('d-none');
    }
    else {
        document.querySelector('.alerts').innerHTML = "";

        const selectedAnswers = examData.questionsList.map(question => {
            const selectedOption = document.querySelector(`input[name="question_${question.questionID}"]:checked`);
            return {
                questionID: question.questionID,
                studentAnswerID: selectedOption ? parseInt(selectedOption.value) : 0
            };
        });

        const now = new Date();
        const completionTime = now.toISOString(); // استخدام الوقت الحالي كـ completionTime
        GCompletionTime = completionTime;
        const submissionData = {
            examID: examData.examID,
            courseID: examData.courseID,
            examType: examData.examType,
            createdByUserID: examData.createdByUserID,
            questionsList: selectedAnswers,
            startTime: startTime,
            completionTime: completionTime
        };



        const radioButtons = document.querySelectorAll('.exam-container input[type="radio"]');
        radioButtons.forEach(radio => {
         //   radio.setAttribute('disabled', true); 
         radio.setAttribute('readonly', true); 
         radio.setAttribute('onclick', 'return false;');
        });


        fetch('https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net/api/Exam/SubmitAndGetResult', {
            // fetch('https://localhost:7023/api/Exam/SubmitAndGetResult', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        })
            .then(response => response.json())
            .then(result => {
                displayResult(result);
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
                btn.disabled = true;
                spinnert.classList.add('d-none');
            })
            .catch(error => {
                console.error('Error:', error);
                logError(error.message || 'Error submitting exam', 'submitExam - examPage.js');
                alert('حدث خطأ أثناء إرسال الإجابات.');
                btn.disabled = false;
                spinnert.classList.add('d-none');
            });


    }

}

function displayExamData(exam) {
    const examContent = document.getElementById('exam-content');
    const btnSubmit = document.querySelector('.btn-submit');
    const reloadPage = document.querySelector('.reloadPage');
    const form = document.querySelector('.form-get-exam');
    const btnNext = document.querySelector('.form-get-exam .btn-next');
    const btnPrev = document.querySelector('.form-get-exam .btn-previous');
    examContent.innerHTML = ''; // Clear previous content

    if (!exam || !exam.questionsList || exam.questionsList.length === 0) {
        examContent.innerHTML = '<div class="text-center py-4 text-danger">لم يتم العثور على هذا الامتحان</div>';
        return;
    }
    
    // عرض نوع الامتحان
    let courseName = 'امتحان';
    let pageTitle = courseName + ' ' + exam.courseName;
 
    if (exam.examLang == 'en') {
        btnSubmit.querySelector('.text-btn').textContent = 'Send';
        reloadPage.querySelector('.text-btn').textContent = 'Retry';
        btnNext.innerHTML = 'Next Exam <i class="fas fa-angle-left fa-flip-horizontal"></i>';
        btnPrev.innerHTML = '<i class="fas fa-angle-left"></i> Prev Exam';
        document.querySelector('.alerts').setAttribute('data-lang','en');
        form.classList.add('ltr');
    }
    btnSubmit.setAttribute('data-lang',exam.examLang||'ar');
if(exam.prevExamID){
    btnPrev.classList.remove('d-none');
    btnPrev.setAttribute('href','/exams/exam.html?id='+exam.prevExamID.toString());
}
if(exam.nextExamID){
    btnNext.classList.remove('d-none');
    btnNext.setAttribute('href','/exams/exam.html?id='+exam.nextExamID.toString());
}


    if(exam.courseName){
        courseName = exam.courseName;
        document.title = pageTitle;
        document.getElementById('examInfo').innerHTML = `<span class="id-exam-page">${exam.examID}</span><h1 class="fs-5 fw-bold">${pageTitle}</h1><div class='description'> ${exam.examType}</div><hr class="text-center mb-5 text-success"/>`;
    }
 
    


    // عرض قائمة الأسئلة
    exam.questionsList.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'mb-3';

        // عرض نص السؤال
        const questionText = document.createElement('h5');
        // questionText.textContent = `سؤال ${index + 1}: ${question.questionText}`;
        questionText.textContent = `${index + 1}: ${question.questionText}`;

        questionDiv.appendChild(questionText);






        // عرض خيارات الإجابة
        const optionsList = document.createElement('div');
        optionsList.className = 'question';
        const optionLength = question.optionsDTO.length;
        question.optionsDTO.forEach((option, i) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'form-check';

            // إضافة اختيار الإجابة باستخدام radio button
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.className = 'form-check-input';
            optionInput.name = `question_${question.questionID}`;
            optionInput.value = option.optionID;
            optionInput.id = `option_${option.optionID}`;
            optionInput.required = true;


            const optionLabel = document.createElement('label');
            optionLabel.className = 'form-check-label';
            optionLabel.setAttribute('for', `option_${option.optionID}`);
            optionLabel.textContent = option.optionText;

            const optionFeedback = document.createElement('div');
            optionFeedback.className = 'invalid-feedback';
            optionFeedback.textContent = exam.examLang == 'en' ? 'Please answer this question' : 'يرجى الإجابة عن هذا السؤال';

            optionItem.appendChild(optionInput);
            optionItem.appendChild(optionLabel);
            if ((optionLength - 1) === i) {
                optionItem.appendChild(optionFeedback);
            }
            optionsList.appendChild(optionItem);
        });

        questionDiv.appendChild(optionsList);
        examContent.appendChild(questionDiv);
        btnSubmit.classList.remove('d-none');
        const separator = document.createElement('hr');
        examContent.appendChild(separator);


    });

}



function displayResult(result) {
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const btnSubmit = document.querySelector('.btn-submit');
    const reloadPage = document.querySelector('.reloadPage');
    const lang = btnSubmit.getAttribute('data-lang') || 'ar';

    const scorePercentage = result.data.result.scorePersantage;
    const correctAnswers = result.data.studentAnswersDTO.filter(answer => answer.isCorrect).length;
    const incorrectAnswers = result.data.studentAnswersDTO.filter(answer => !answer.isCorrect).length;

    const startTimee = new Date(startTime);
    const completionTime = new Date(GCompletionTime);
    const differenceInMilliseconds = completionTime.getTime() - startTimee.getTime();

    // تحويل الفرق من ميلي ثانية إلى ثواني
    const differenceInSeconds = Math.round(differenceInMilliseconds / 1000);

    // حساب الساعات والدقائق والثواني
    const hours = Math.floor(differenceInSeconds / 3600); // 3600 ثانية في الساعة
    const minutes = Math.floor((differenceInSeconds % 3600) / 60); // 60 ثانية في الدقيقة
    const seconds = differenceInSeconds % 60;

    // تنسيق الوقت إلى "ساعات:دقائق:ثواني" مع إضافة الأصفار البادئة إذا لزم الأمر
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // تحويل النسبة المئوية من سلسلة نصية إلى عدد

    // تحديد لون النتيجة بناءً على النسبة المحولة
    let scoreColor = scorePercentage < 50 ? 'red' : 'green';



    let resuteText = 'النتيجة',
    t1 = 'النسبة المئوية',
    t2 = 'عدد الإجابات الصحيحة',
    t3 = 'عدد الإجابات الخاطئة',
    t4= 'الوقت المنقضي';

    if(lang == 'en'){
        resuteText = 'Result',
        t1 = 'Percentage',
        t2 = 'Number of correct answers',
        t3 = 'Number of incorrect answers',
        t4= 'Elapsed time';
    }



    resultContent.innerHTML = 
    `<table class="table exam-result">
  <thead>
    <tr>
      <th scope="col" colspan="2" class="text-center fs-4" id="resultTitle">${resuteText}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">${t1}</th>
      <td style="color: ${scoreColor}; font-size: 1.5em;">%${scorePercentage}</td>
    </tr>
    <tr>
      <th scope="row">${t2}</th>
      <td style="color: green;">${correctAnswers}</td>
    </tr>
    <tr>
      <th scope="row">${t3}</th>
      <td style="color: red;">${incorrectAnswers}</td>
    </tr>
    <tr>
      <th scope="row">${t4}</th>
      <td style="color: red;">${formattedTime}</td>
    </tr>
  </tbody>
</table>`



    const resultTitle = document.getElementById('resultTitle');

    // تطبيق تأثير الوميض
    resultTitle.classList.add('flash');

    // إزالة تأثير الوميض بعد 4 ثوانٍ
    setTimeout(() => {
        resultTitle.classList.remove('flash');
    }, 4000);


    let wrongAnswerText = 'إجابة خاطئة';
    let correctAnswerText = 'إجابة صحيحة';
    if(lang == 'en'){
        wrongAnswerText = 'Wrong answer';
         correctAnswerText = 'Correct answer';
    }

    result.data.studentAnswersDTO.forEach((answer, index) => {
        const questionDiv = document.querySelector(`input[name="question_${answer.questionID}"]`).closest('.question');
        const optionsList = questionDiv.querySelectorAll('.form-check');
        let correctAnswer = false;
        optionsList.forEach(optionItem => {
            const inputElement = optionItem.querySelector('input');
           
            if (parseInt(inputElement.value) === answer.selectedOptionID) {
                inputElement.classList.add(answer.isCorrect?'is-valid':'is-invalid');
                correctAnswer = answer.isCorrect;
            }else if(parseInt(inputElement.value) === answer.correctAnswerID){
                inputElement.classList.add('is-valid');
            }
        });
        
        
        const feedback = questionDiv.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.classList.remove('invalid-feedback');
            feedback.classList.add('fw-bold');
            if (correctAnswer) {
                feedback.classList.add('text-success','mt-2');
                feedback.textContent = correctAnswerText;
                questionDiv.classList.add('bg-success', 'bg-opacity-10', 'p-2','rounded');
            } else {
                feedback.classList.add('text-danger','mt-2');
                feedback.textContent = wrongAnswerText;
                questionDiv.classList.add('bg-danger', 'bg-opacity-10', 'p-2','rounded');
            }
        }
        
    });





    // عرض تفاصيل إجابات الطالب
    // result.data.studentAnswersDTO.forEach((answer, index) => {
    //     const questionDiv = document.querySelector(`input[name="question_${answer.questionID}"]`).closest('.question');
    //     const optionsList = questionDiv.querySelectorAll('.option');

    //     optionsList.forEach(optionItem => {
    //         const inputElement = optionItem.querySelector('input');
    //         const labelElement = optionItem.querySelector('label');
            

          
    //         if (parseInt(inputElement.value) === answer.selectedOptionID) {
    //             labelElement.style.color = answer.isCorrect ? 'green' : 'red';
    //         }

    //         if (parseInt(inputElement.value) === answer.correctAnswerID) {
    //             labelElement.style.color = 'green';
    //         }
    //     });

    //     const answerDiv = document.createElement('div');
    //     resultContent.appendChild(answerDiv);
    // });

    resultContainer.style.display = 'block';
    reloadPage.classList.remove('d-none');
    btnSubmit.classList.add('d-none');


}



window.onload = fetchExamData;
