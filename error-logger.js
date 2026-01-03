// Shared error logging utility
// This file should be included in all HTML pages before other JS files

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
                reportText: `Error at ${errorLocation}:\n${errorMessage}\n\nPage: ${window.location.href}\nTime: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}`,
                examID: 0,
                questionID: 0,
                optionID: 0
            })
        });
    } catch (logErr) {
        // Don't log errors in logging to prevent infinite loops
        console.error('Failed to log error:', logErr);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logError };
}
