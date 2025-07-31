class ReflectionApp {
    constructor() {
        this.currentLanguage = 'en';
        this.init();
    }

    init() {
        this.detectBrowserLanguage();
        this.setupEventListeners();
        this.updateContent();
        this.loadSavedData();
    }

    detectBrowserLanguage() {
        const browserLang = navigator.language.slice(0, 2);
        const supportedLanguages = Object.keys(translations);
        
        if (supportedLanguages.includes(browserLang)) {
            this.currentLanguage = browserLang;
        }

        const savedLanguage = localStorage.getItem('reflectionLanguage');
        if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });

        const ratingSlider = document.getElementById('overall-rating');
        const ratingValue = document.getElementById('rating-value');
        
        ratingSlider.addEventListener('input', (e) => {
            ratingValue.textContent = e.target.value;
        });

        document.getElementById('reflection-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        document.querySelectorAll('textarea, input[type="range"]').forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchLanguage('en');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchLanguage('fr');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchLanguage('es');
                        break;
                }
            }
        });
    }

    switchLanguage(lang) {
        if (!translations[lang]) return;

        this.currentLanguage = lang;
        localStorage.setItem('reflectionLanguage', lang);

        document.body.classList.add('fade-transition');
        
        setTimeout(() => {
            this.updateContent();
            this.updateActiveLanguageButton();
            document.body.classList.remove('fade-transition');
            document.body.classList.add('active');
        }, 150);

        this.announceLanguageChange(lang);
    }

    updateContent() {
        const t = translations[this.currentLanguage];
        
        const elements = {
            'page-title': t.pageTitle,
            'welcome-title': t.welcomeTitle,
            'welcome-message': t.welcomeMessage,
            'question1-label': t.question1Label,
            'question2-label': t.question2Label,
            'question3-label': t.question3Label,
            'rating-label': t.ratingLabel,
            'rating-text': t.ratingText,
            'submit-btn': t.submitBtn,
            'info-title': t.infoTitle,
            'info-text': t.infoText,
            'footer-text': t.footerText,
            'language-info': t.languageInfo,
            'current-language': t.currentLanguage
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });

        const placeholders = {
            'question1': t.question1Placeholder,
            'question2': t.question2Placeholder,
            'question3': t.question3Placeholder
        };

        Object.entries(placeholders).forEach(([id, placeholder]) => {
            const element = document.getElementById(id);
            if (element) {
                element.placeholder = placeholder;
            }
        });

        document.documentElement.lang = this.currentLanguage;
    }

    updateActiveLanguageButton() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === this.currentLanguage) {
                btn.classList.add('active');
            }
        });
    }

    handleFormSubmission() {
        const formData = this.getFormData();
        if (!this.validateForm(formData)) return;
        this.submitReflection(formData);
    }

    getFormData() {
        return {
            question1: document.getElementById('question1').value.trim(),
            question2: document.getElementById('question2').value.trim(),
            question3: document.getElementById('question3').value.trim(),
            rating: document.getElementById('overall-rating').value,
            language: this.currentLanguage,
            timestamp: new Date().toISOString()
        };
    }

    validateForm(data) {
        const requiredFields = ['question1', 'question2', 'question3'];
        const emptyFields = requiredFields.filter(field => !data[field]);

        if (emptyFields.length > 0) {
            alert(`Please fill in all required fields.`);
            const firstEmptyField = document.getElementById(emptyFields[0]);
            if (firstEmptyField) firstEmptyField.focus();
            return false;
        }

        return true;
    }

    submitReflection(data) {
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        setTimeout(() => {
            localStorage.setItem('reflectionSubmission', JSON.stringify(data));
            this.showSuccessMessage();
            document.getElementById('reflection-form').reset();
            document.getElementById('rating-value').textContent = '3';
            localStorage.removeItem('reflectionFormData');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 2000);
    }

    showSuccessMessage() {
        const t = translations[this.currentLanguage];
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = t.successMessage;
        const form = document.querySelector('.reflection-form');
        form.parentNode.insertBefore(successDiv, form);

        setTimeout(() => {
            successDiv.remove();
        }, 5000);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    saveFormData() {
        const formData = this.getFormData();
        localStorage.setItem('reflectionFormData', JSON.stringify(formData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('reflectionFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.question1) document.getElementById('question1').value = data.question1;
                if (data.question2) document.getElementById('question2').value = data.question2;
                if (data.question3) document.getElementById('question3').value = data.question3;
                if (data.rating) {
                    document.getElementById('overall-rating').value = data.rating;
                    document.getElementById('rating-value').textContent = data.rating;
                }
            } catch (error) {
                console.error('Error loading saved form data:', error);
            }
        }
    }

    announceLanguageChange(lang) {
        const langNames = {
            en: 'English',
            fr: 'Français',
        };

        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `Language changed to ${langNames[lang]}`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    getAnalytics() {
        return {
            language: this.currentLanguage,
            formInteractions: this.formInteractions || 0,
            timeSpent: Date.now() - (this.startTime || Date.now()),
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reflectionApp = new ReflectionApp();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (window.reflectionApp) {
            window.reflectionApp.saveFormData();
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (window.reflectionApp) {
        window.reflectionApp.saveFormData();
    }
});
