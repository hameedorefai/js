/**
 * Survey/Feedback Module
 * Handles user feedback collection and submission to log endpoint
 */

class SurveyManager {
    constructor() {
        this.selectedRating = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Rating buttons
        const ratingBtns = document.querySelectorAll('.rating-btn');
        ratingBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRatingSelect(e));
        });

        // Form submission
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            surveyForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Enforce hidden initial states
        const loader = document.getElementById('surveyLoader');
        const successMsg = document.getElementById('surveySuccess');
        const errorMsg = document.getElementById('surveyError');
        if (loader) {
            loader.classList.add('d-none');
            loader.setAttribute('hidden', '');
            loader.style.display = 'none';
        }
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    }

    handleRatingSelect(e) {
        const btn = e.currentTarget;
        const rating = btn.getAttribute('data-rating');

        // Remove active class from all buttons
        document.querySelectorAll('.rating-btn').forEach(b => {
            b.classList.remove('active');
        });

        // Add active class to clicked button
        btn.classList.add('active');

        // Store rating value
        this.selectedRating = rating;
        document.getElementById('ratingValue').value = rating;

        // Reveal optional fields and action buttons after rating is chosen
        const feedbackGroup = document.getElementById('feedbackGroup');
        const contactGroup = document.getElementById('contactGroup');
        const actionRow = document.getElementById('actionRow');
        [feedbackGroup, contactGroup, actionRow].forEach(el => {
            if (el) el.classList.remove('d-none');
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        // Validate rating selection
        if (!this.selectedRating) {
            this.showError('يرجى اختيار تقييم');
            return;
        }

        const feedbackText = document.getElementById('feedbackText').value.trim();
        const contactInfo = document.getElementById('contactInfo').value.trim();
        const submitBtn = document.getElementById('submitSurveyBtn');
        const loader = document.getElementById('surveyLoader');
        const successMsg = document.getElementById('surveySuccess');
        const errorMsg = document.getElementById('surveyError');

        // Hide previous messages
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';

        // Show loader
        if (loader) {
            loader.classList.remove('d-none');
            loader.classList.add('is-visible');
            loader.removeAttribute('hidden');
        }
        submitBtn.disabled = true;

        try {
            // Map rating number to Arabic name
            const ratingMap = {
                '1': 'سيء جداً',
                '2': 'سيء',
                '3': 'محايد',
                '4': 'جيد',
                '5': 'ممتاز'
            };

            const ratingName = ratingMap[this.selectedRating] || this.selectedRating;
            const ratingText = `${this.selectedRating} - ${ratingName}`;

            // Build the report text with optional fields
            let reportText = `تقييم: ${ratingText}`;
            if (feedbackText) {
                reportText += `\n\nملاحظات: ${feedbackText}`;
            }
            if (contactInfo) {
                reportText += `\n\nوسيلة التواصل: ${contactInfo}`;
            }

                reportText += `\n\nصفحة الإرسال: ${window.location.href}`;


            const payload = {
                userID: 18,
                reportType: 'UserFeedback',
                reportText: reportText,
                examID: 0,
                questionID: 0,
                optionID: 0
            };

            // Send to log endpoint
            const response = await this.sendToLogEndpoint(payload);

            if (response.ok || response.status === 201 || response.status === 200) {
                // Show success message
                if (loader) {
                    loader.classList.remove('is-visible');
                    loader.classList.add('d-none');
                    loader.setAttribute('hidden', '');
                }
                if (successMsg) successMsg.style.display = 'block';

                // Reset form
                setTimeout(() => {
                    this.resetForm();
                    successMsg.style.display = 'none';
                }, 3000);
            } else {
                throw new Error('فشل في إرسال الرأي');
            }
        } catch (error) {
            console.error('Survey submission error:', error);
            logError(error.message || 'Survey submission error', 'survey submission');
            if (loader) {
                loader.classList.remove('is-visible');
                loader.classList.add('d-none');
                loader.setAttribute('hidden', '');
            }
            document.getElementById('errorMsg').textContent = error.message || 'حدث خطأ أثناء الإرسال';
            if (errorMsg) errorMsg.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
        }
    }

    async sendToLogEndpoint(data) {
        // Using the log endpoint
        const logEndpoint = 'https://exam-buhxf9b2f0duaycf.uaenorth-01.azurewebsites.net/api/Report/add';

        return await fetch(logEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain'
            },
            body: JSON.stringify(data),
            credentials: 'omit' // Don't send credentials
        });
    }

    showError(message) {
        const errorMsg = document.getElementById('surveyError');
        document.getElementById('errorMsg').textContent = message;
        errorMsg.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    }

    resetForm() {
        // Reset form
        const surveyForm = document.getElementById('surveyForm');
        surveyForm.reset();

        // Reset rating selection
        this.selectedRating = null;
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('ratingValue').value = '';

        // Hide optional fields and action buttons again
        const feedbackGroup = document.getElementById('feedbackGroup');
        const contactGroup = document.getElementById('contactGroup');
        const actionRow = document.getElementById('actionRow');
        [feedbackGroup, contactGroup, actionRow].forEach(el => {
            if (el && !el.classList.contains('d-none')) el.classList.add('d-none');
        });

        // Hide status messages and loader
        const loader = document.getElementById('surveyLoader');
        const successMsg = document.getElementById('surveySuccess');
        const errorMsg = document.getElementById('surveyError');
        if (loader) {
            loader.classList.remove('is-visible');
            loader.classList.add('d-none');
            loader.setAttribute('hidden', '');
        }
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    }
}

// Initialize Survey Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.surveyManager = new SurveyManager();
        console.log('Survey Manager initialized successfully');
    } catch (error) {
        console.error('Error initializing Survey Manager:', error);
        logError(error.message || 'Survey Manager initialization error', 'DOMContentLoaded - SurveyManager');
    }
});
