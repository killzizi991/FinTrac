// assets/js/core/app.js
class FinancialCalendarApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        try {
            // Инициализация в правильном порядке
            await this.initializeApp();
            
            // Запускаем приложение
            this.startApp();
            
            this.isInitialized = true;
            console.log('Приложение инициализировано успешно');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showError('Не удалось инициализировать приложение. Пожалуйста, обновите страницу.');
        }
    }
    
    async initializeApp() {
        // 1. Инициализация данных
        this.initAppData();
        
        // 2. Инициализация Service Worker (PWA)
        await this.initServiceWorker();
        
        // 3. Инициализация UI компонентов
        this.initUIComponents();
        
        // 4. Инициализация модулей
        this.initModules();
        
        // 5. Настройка обработчиков событий
        this.setupGlobalEventHandlers();
    }
    
    initAppData() {
        // Инициализация данных приложения
        if (!initAppData()) {
            console.log('Ошибка загрузки данных. Используются значения по умолчанию.');
        }
    }
    
    async initServiceWorker() {
        // Регистрация Service Worker происходит в sw-register.js
        // Здесь просто ждем, пока Service Worker будет готов
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('Service Worker готов:', registration);
            } catch (error) {
                console.warn('Service Worker не зарегистрирован:', error);
            }
        }
    }
    
    initUIComponents() {
        // Инициализация темы
        const savedTheme = localStorage.getItem('preferred-theme') || (isDarkMode() ? 'dark' : 'light');
        document.body.className = `${savedTheme}-theme`;
        
        // Инициализация модальных окон
        // (уже сделана в modal-manager.js)
        
        // Инициализация уведомлений
        // (уже сделана в notifications.js)
        
        // Инициализация элементов управления
        // (уже сделана в header-controls.js)
    }
    
    initModules() {
        // Инициализация календаря
        this.initCalendar();
        
        // Инициализация менеджера операций
        // (уже сделана в operations.js)
        
        // Инициализация менеджера категорий
        // (уже сделана в categories.js)
        
        // Инициализация менеджера отчетов
        // (уже сделана в reports.js)
        
        // Инициализация менеджера экспорта/импорта
        // (уже сделана в export-import.js)
        
        // Инициализация офлайн-обработчика
        // (уже сделана в offline-handler.js)
    }
    
    initCalendar() {
        // Генерация начального календаря
        generateCalendar();
        
        // Обновление сводки
        updateMonthSummary();
    }
    
    setupGlobalEventHandlers() {
        // Глобальные горячие клавиши
        this.setupGlobalShortcuts();
        
        // Обработчики для обновления данных
        this.setupDataUpdateHandlers();
        
        // Обработчики для изменения темы
        this.setupThemeHandlers();
        
        // Обработчик для восстановления при фокусе
        this.setupVisibilityHandler();
    }
    
    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Быстрые клавиши, если не в поле ввода
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT') {
                return;
            }
            
            // Переход на сегодняшний день
            if (e.key === 't' || e.key === 'T') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    navigateToToday();
                }
            }
            
            // Добавление операции
            if (e.key === 'n' || e.key === 'N') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    modalManager.showAddOperationForm();
                }
            }
            
            // Поиск
            if (e.key === 'f' || e.key === 'F') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.showSearch();
                }
            }
        });
    }
    
    setupDataUpdateHandlers() {
        // Обновление календаря при изменении данных
        document.addEventListener('operation-added', () => {
            generateCalendar();
            updateMonthSummary();
        });
        
        document.addEventListener('operation-updated', () => {
            generateCalendar();
            updateMonthSummary();
        });
        
        document.addEventListener('operation-deleted', () => {
            generateCalendar();
            updateMonthSummary();
        });
        
        document.addEventListener('data-imported', () => {
            generateCalendar();
            updateMonthSummary();
        });
        
        document.addEventListener('settings-changed', () => {
            // Обновляем тему, если изменилась
            const darkMode = isDarkMode();
            document.body.className = darkMode ? 'dark-theme' : 'light-theme';
        });
    }
    
    setupThemeHandlers() {
        // Автоматическое переключение темы по времени суток
        if (localStorage.getItem('auto-theme') === 'true') {
            this.setupAutoTheme();
        }
        
        // Слушатель для изменения темы
        document.addEventListener('theme-changed', (e) => {
            console.log('Тема изменена на:', e.detail.theme);
        });
    }
    
    setupAutoTheme() {
        const now = new Date();
        const hour = now.getHours();
        
        // С 18:00 до 6:00 - темная тема
        if (hour >= 18 || hour < 6) {
            if (!isDarkMode()) {
                toggleDarkMode();
                document.body.className = 'dark-theme';
            }
        } else {
            if (isDarkMode()) {
                toggleDarkMode();
                document.body.className = 'light-theme';
            }
        }
    }
    
    setupVisibilityHandler() {
        let lastFocusTime = Date.now();
        
        window.addEventListener('focus', () => {
            const now = Date.now();
            // Если приложение было неактивно более 5 минут, обновляем
            if (now - lastFocusTime > 5 * 60 * 1000) {
                this.refreshAppData();
            }
            lastFocusTime = now;
        });
    }
    
    startApp() {
        // Проверяем обновления
        this.checkForAppUpdates();
        
        // Запускаем периодические задачи
        this.startPeriodicTasks();
        
        // Отправляем событие о готовности приложения
        document.dispatchEvent(new CustomEvent('app-ready'));
    }
    
    checkForAppUpdates() {
        // Проверяем версию приложения
        const savedVersion = localStorage.getItem('app_version');
        const currentVersion = APP_VERSION;
        
        if (savedVersion !== currentVersion) {
            // Обновление версии
            localStorage.setItem('app_version', currentVersion);
        }
    }
    
    startPeriodicTasks() {
        // Автосохранение каждые 30 секунд
        setInterval(() => this.autoSave(), 30000);
        
        // Создание резервных копий каждый день
        setInterval(() => this.dailyBackup(), 24 * 60 * 60 * 1000);
        
        // Очистка старых резервных копий раз в неделю
        setInterval(() => offlineHandler.cleanupOldBackups(), 7 * 24 * 60 * 60 * 1000);
        
        // Проверка соединения каждую минуту
        setInterval(() => offlineHandler.checkConnection(), 60000);
    }
    
    autoSave() {
        // В MVP все сохраняется мгновенно, поэтому просто обновляем статус
        const storageStatus = document.getElementById('storage-status');
        if (storageStatus) {
            storageStatus.textContent = '🟢 Данные сохранены';
        }
    }
    
    dailyBackup() {
        const backup = offlineHandler.backupData();
        if (backup) {
            console.log('Ежедневная резервная копия создана:', backup.timestamp);
        }
    }
    
    refreshAppData() {
        // Обновляем календарь и сводку
        generateCalendar();
        updateMonthSummary();
        
        // Проверяем обновления данных
        offlineHandler.checkForUpdates();
    }
    
    showSearch() {
        // Простой поиск по операциям
        const query = prompt('Введите текст для поиска операций:');
        if (!query) return;
        
        const operations = operationsManager.getFilteredOperations({
            search: query
        });
        
        if (operations.length === 0) {
            console.log('Операции не найдены');
            return;
        }
        
        // Показываем результаты в модальном окне
        this.showSearchResults(operations, query);
    }
    
    showSearchResults(operations, query) {
        // Создаем временное модальное окно для результатов поиска
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Результаты поиска: "${query}"</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-results">
                        ${operations.map(op => `
                            <div class="search-result-item operation-item operation-item--${op.type}">
                                <div class="operation-info">
                                    <div class="operation-date">${op.date}</div>
                                    <div class="operation-category">${op.category}</div>
                                    ${op.description ? `<div class="operation-description">${op.description}</div>` : ''}
                                </div>
                                <div class="operation-amount operation-${op.type}">${formatCurrency(op.amount)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="search-summary">
                        Найдено операций: ${operations.length}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчик закрытия
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Закрытие по клику вне окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }
    
    showError(message) {
        // Показываем ошибку в специальном модальном окне
        const errorModal = document.createElement('div');
        errorModal.className = 'modal active';
        errorModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="color: ${COLORS.danger};">Ошибка</h2>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button id="reload-app" class="primary-button">Перезагрузить приложение</button>
                        <button id="clear-data" class="secondary-button">Очистить данные</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorModal);
        
        // Обработчики кнопок
        document.getElementById('reload-app').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('clear-data').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    // Методы для доступа к компонентам приложения
    getCalendar() {
        return window.calendarModule;
    }
    
    getOperations() {
        return operationsManager;
    }
    
    getCategories() {
        return categoriesManager;
    }
    
    getReports() {
        return reportsManager;
    }
    
    getExportImport() {
        return exportImportManager;
    }
    
    getOfflineHandler() {
        return offlineHandler;
    }
    
    getServiceWorker() {
        return serviceWorkerRegister;
    }
    
    // Восстановление приложения
    async restoreApp() {
        try {
            // Создаем резервную копию перед восстановлением
            offlineHandler.backupData();
            
            // Очищаем данные
            localStorage.removeItem(STORAGE_KEY);
            
            // Перезагружаем приложение
            location.reload();
            
            return true;
        } catch (error) {
            console.error('Ошибка восстановления приложения:', error);
            return false;
        }
    }
    
    // Получение статистики приложения
    getAppStats() {
        const data = getAppData();
        const operations = getOperations();
        
        return {
            version: APP_VERSION,
            operationsCount: operations.length,
            categoriesCount: {
                income: getCategories().income.length,
                expense: getCategories().expense.length
            },
            dataSize: JSON.stringify(data).length,
            lastSync: localStorage.getItem('last_sync'),
            lastBackup: localStorage.getItem('last_backup'),
            storageUsed: this.calculateStorageUsage(),
            pwaSupported: offlineHandler.checkPwaSupport()
        };
    }
    
    calculateStorageUsage() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            total += key.length + value.length;
        }
        return total;
    }
}

// Создаем и экспортируем экземпляр приложения
const app = new FinancialCalendarApp();

// Делаем глобально доступным для отладки
window.app = app;
