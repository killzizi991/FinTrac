// assets/js/ui/header-controls.js
class HeaderControls {
    constructor() {
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.categoriesManagerBtn = document.getElementById('categories-manager-btn');
        this.exportImportBtn = document.getElementById('export-import-btn');
        this.reportsBtn = document.getElementById('reports-btn');
        this.addOperationBtn = document.getElementById('add-operation-btn');
        this.clearDataBtn = document.getElementById('clear-data-btn');
        this.installBtn = document.getElementById('install-btn');
        this.currentMonthYearEl = document.getElementById('current-month-year');
        
        this.init();
    }
    
    init() {
        // Навигация по месяцам
        if (this.prevMonthBtn) {
            this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        
        if (this.nextMonthBtn) {
            this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        }
        
        // Управление категориями
        if (this.categoriesManagerBtn) {
            this.categoriesManagerBtn.addEventListener('click', () => {
                modalManager.showCategoryManager();
            });
        }
        
        // Экспорт/импорт
        if (this.exportImportBtn) {
            this.exportImportBtn.addEventListener('click', () => {
                modalManager.open(MODAL_TYPES.EXPORT_IMPORT);
                // Инициализируем данные экспорта
                initExportImport();
            });
        }
        
        // Отчеты
        if (this.reportsBtn) {
            this.reportsBtn.addEventListener('click', () => {
                modalManager.open(MODAL_TYPES.REPORT);
                // Обновляем данные отчета
                updateReports();
            });
        }
        
        // Добавление операции
        if (this.addOperationBtn) {
            this.addOperationBtn.addEventListener('click', () => {
                modalManager.showAddOperationForm();
            });
        }
        
        // Очистка данных
        if (this.clearDataBtn) {
            this.clearDataBtn.addEventListener('click', () => {
                modalManager.showConfirm(
                    'Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.',
                    'Очистка всех данных'
                ).then(confirmed => {
                    if (confirmed) {
                        if (clearAllData()) {
                            generateCalendar();
                            updateMonthSummary();
                        }
                    }
                });
            });
        }
        
        // Кнопка установки PWA
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => this.installPWA());
        }
        
        // Обновляем отображение текущего месяца
        this.updateMonthDisplay();
        
        // Слушаем события изменения месяца
        document.addEventListener('month-changed', () => {
            this.updateMonthDisplay();
        });
        
        // Глобальные горячие клавиши
        this.initKeyboardShortcuts();
    }
    
    navigateMonth(direction) {
        let newMonth = CURRENT_MONTH + direction;
        let newYear = CURRENT_YEAR;
        
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        
        CURRENT_MONTH = newMonth;
        CURRENT_YEAR = newYear;
        CURRENT_DATE = new Date(CURRENT_YEAR, CURRENT_MONTH, 1);
        
        // Генерируем новый календарь
        generateCalendar();
        
        // Обновляем сводку
        updateMonthSummary();
        
        // Отправляем событие
        document.dispatchEvent(new CustomEvent('month-changed', {
            detail: { year: CURRENT_YEAR, month: CURRENT_MONTH }
        }));
        
        // Показываем уведомление
        const monthName = getMonthName(CURRENT_MONTH);
        showNotification(`Перешли на ${monthName} ${CURRENT_YEAR}`, NOTIFICATION_TYPES.INFO);
    }
    
    updateMonthDisplay() {
        if (this.currentMonthYearEl) {
            const monthName = getMonthName(CURRENT_MONTH);
            this.currentMonthYearEl.textContent = `${monthName} ${CURRENT_YEAR}`;
        }
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Игнорируем, если фокус в поле ввода
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT' ||
                e.target.isContentEditable) {
                return;
            }
            
            // Стрелки для навигации по месяцам
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigateMonth(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateMonth(1);
            }
            
            // Быстрые клавиши
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                    case 'N':
                        e.preventDefault();
                        this.addOperationBtn?.click();
                        break;
                    case 'e':
                    case 'E':
                        e.preventDefault();
                        this.exportImportBtn?.click();
                        break;
                    case 'r':
                    case 'R':
                        e.preventDefault();
                        this.reportsBtn?.click();
                        break;
                    case 'c':
                    case 'C':
                        e.preventDefault();
                        this.categoriesManagerBtn?.click();
                        break;
                }
            }
            
            // Escape для закрытия модальных окон
            if (e.key === 'Escape') {
                const activeModal = modalManager.getActiveModal();
                if (activeModal) {
                    modalManager.close(activeModal.type);
                }
            }
        });
    }
    
    installPWA() {
        if (!window.deferredPrompt) {
            showNotification('Приложение уже установлено', NOTIFICATION_TYPES.INFO);
            return;
        }
        
        window.deferredPrompt.prompt();
        
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('Приложение успешно установлено!', NOTIFICATION_TYPES.SUCCESS);
                this.hideInstallButton();
            } else {
                showNotification('Установка отменена', NOTIFICATION_TYPES.WARNING);
            }
            window.deferredPrompt = null;
        });
    }
    
    showInstallButton() {
        if (this.installBtn) {
            this.installBtn.style.display = 'inline-block';
        }
    }
    
    hideInstallButton() {
        if (this.installBtn) {
            this.installBtn.style.display = 'none';
        }
    }
    
    updateStorageStatus(online = true) {
        const statusEl = document.getElementById('storage-status');
        const offlineEl = document.getElementById('offline-status');
        
        if (statusEl) {
            statusEl.textContent = online ? '🟢 Данные сохранены' : '🟡 Сохранение...';
            statusEl.title = online ? 'Все данные сохранены в localStorage' : 'Идет сохранение данных...';
        }
        
        if (offlineEl) {
            offlineEl.textContent = online ? '🟢 Онлайн' : '🔴 Офлайн';
            offlineEl.title = online ? 'Вы в сети' : 'Вы в офлайн режиме';
        }
    }
}

// Создаем глобальный экземпляр
const headerControls = new HeaderControls();
