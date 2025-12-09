// assets/js/ui/header-controls.js
class HeaderControls {
    constructor() {
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.monthSummaryBtn = document.getElementById('month-summary-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.addOperationBtn = document.getElementById('add-operation-btn');
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
        
        // Итоги за месяц
        if (this.monthSummaryBtn) {
            this.monthSummaryBtn.addEventListener('click', () => {
                this.showMonthSummary();
            });
        }
        
        // Настройки
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                modalManager.open(MODAL_TYPES.SETTINGS);
            });
        }
        
        // Добавление операции
        if (this.addOperationBtn) {
            this.addOperationBtn.addEventListener('click', () => {
                modalManager.showAddOperationForm();
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
        
        // Отправляем событие
        document.dispatchEvent(new CustomEvent('month-changed', {
            detail: { year: CURRENT_YEAR, month: CURRENT_MONTH }
        }));
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
                    case 's':
                    case 'S':
                        e.preventDefault();
                        this.settingsBtn?.click();
                        break;
                    case 'm':
                    case 'M':
                        e.preventDefault();
                        this.monthSummaryBtn?.click();
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
    
    showMonthSummary() {
        modalManager.open(MODAL_TYPES.MONTH_SUMMARY);
        
        // Обновляем данные в модальном окне
        const totals = calculateMonthTotals();
        const prevTotals = getPreviousMonthTotals();
        
        document.getElementById('modal-total-income').textContent = formatCurrency(totals.income);
        document.getElementById('modal-total-expense').textContent = formatCurrency(totals.expense);
        document.getElementById('modal-total-balance').textContent = formatCurrency(totals.balance);
        
        const comparisonEl = document.getElementById('modal-comparison-text');
        if (comparisonEl) {
            const incomeChange = totals.income - prevTotals.income;
            const expenseChange = totals.expense - prevTotals.expense;
            
            let comparisonText = 'Сравнение с предыдущим месяцем: ';
            
            if (incomeChange !== 0) {
                comparisonText += `Доходы: ${incomeChange > 0 ? '+' : ''}${formatCurrency(incomeChange)} `;
            }
            
            if (expenseChange !== 0) {
                comparisonText += `Расходы: ${expenseChange > 0 ? '+' : ''}${formatCurrency(expenseChange)}`;
            }
            
            comparisonEl.textContent = comparisonText;
        }
    }
    
    installPWA() {
        if (!window.deferredPrompt) {
            console.log('Приложение уже установлено');
            return;
        }
        
        window.deferredPrompt.prompt();
        
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Приложение успешно установлено!');
                this.hideInstallButton();
            } else {
                console.log('Установка отменена');
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
