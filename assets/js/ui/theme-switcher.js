// assets/js/ui/theme-switcher.js
class ThemeSwitcher {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-switcher');
        this.currentTheme = isDarkMode() ? 'dark' : 'light';
        this.init();
    }
    
    init() {
        // Устанавливаем текущую тему
        this.setTheme(this.currentTheme);
        
        // Назначаем обработчик клика
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Слушаем изменения в настройках
        document.addEventListener('settings-changed', (e) => {
            if (e.detail && e.detail.darkMode !== undefined) {
                this.setTheme(e.detail.darkMode ? 'dark' : 'light');
            }
        });
        
        // Обновляем иконку кнопки
        this.updateButtonIcon();
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Сохраняем в настройках
        toggleDarkMode();
        
        // Отправляем событие
        document.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme: newTheme } 
        }));
        
        // Показываем уведомление
        showNotification(
            `Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.body.className = `${theme}-theme`;
        
        // Обновляем иконку кнопки
        this.updateButtonIcon();
        
        // Сохраняем в localStorage для немедленного применения при загрузке
        localStorage.setItem('preferred-theme', theme);
    }
    
    updateButtonIcon() {
        if (!this.themeToggleBtn) return;
        
        if (this.currentTheme === 'dark') {
            this.themeToggleBtn.textContent = '☀️';
            this.themeToggleBtn.setAttribute('aria-label', 'Включить светлую тему');
            this.themeToggleBtn.title = 'Включить светлую тему';
        } else {
            this.themeToggleBtn.textContent = '🌙';
            this.themeToggleBtn.setAttribute('aria-label', 'Включить темную тему');
            this.themeToggleBtn.title = 'Включить темную тему';
        }
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Создаем глобальный экземпляр
const themeSwitcher = new ThemeSwitcher();
