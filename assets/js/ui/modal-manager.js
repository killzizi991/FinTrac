// assets/js/ui/modal-manager.js
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }
    
    init() {
        // Собираем все модальные окна
        document.querySelectorAll('[data-modal-type]').forEach(modal => {
            const type = modal.getAttribute('data-modal-type');
            this.modals.set(type, modal);
            
            // Закрытие по кнопке
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close(type));
            }
            
            // Закрытие по клику вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(type);
                }
            });
            
            // Закрытие по Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.close(type);
                }
            });
        });
        
        // Глобальные обработчики для закрытия модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    const type = modal.getAttribute('data-modal-type');
                    this.close(type);
                }
            }
        });
        
        // Инициализация обработчиков для настроек
        this.initSettingsModal();
        
        // Инициализация обработчиков для итогов за месяц
        this.initMonthSummaryModal();
    }
    
    initSettingsModal() {
        const settingsModal = this.modals.get(MODAL_TYPES.SETTINGS);
        if (!settingsModal) return;
        
        // Обработчик для переключения темы
        const themeBtn = settingsModal.querySelector('#modal-theme-switcher');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                themeSwitcher.toggleTheme();
            });
        }
        
        // Обработчик для экспорт/импорт
        const exportImportBtn = settingsModal.querySelector('#modal-export-import-btn');
        if (exportImportBtn) {
            exportImportBtn.addEventListener('click', () => {
                this.close(MODAL_TYPES.SETTINGS);
                this.open(MODAL_TYPES.EXPORT_IMPORT);
                initExportImport();
            });
        }
        
        // Обработчик для очистки данных
        const clearDataBtn = settingsModal.querySelector('#modal-clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.close(MODAL_TYPES.SETTINGS);
                this.showConfirm(
                    'Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.',
                    'Очистка всех данных'
                ).then(confirmed => {
                    if (confirmed) {
                        if (clearAllData()) {
                            generateCalendar();
                            showNotification('Все данные очищены', NOTIFICATION_TYPES.SUCCESS);
                        }
                    }
                });
            });
        }
    }
    
    initMonthSummaryModal() {
        const monthSummaryModal = this.modals.get(MODAL_TYPES.MONTH_SUMMARY);
        if (!monthSummaryModal) return;
        
        // При открытии обновляем данные
        monthSummaryModal.addEventListener('modal-open', () => {
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
        });
    }
    
    open(type, data = null) {
        const modal = this.modals.get(type);
        if (!modal) {
            console.error(`Модальное окно типа "${type}" не найдено`);
            return;
        }
        
        // Закрываем текущее активное модальное окно
        this.closeAll();
        
        // Устанавливаем данные если есть
        if (data) {
            this.setModalData(modal, data);
        }
        
        // Показываем модальное окно
        modal.classList.add('active');
        setActiveModal(modal);
        
        // Фокус на первый интерактивный элемент
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea, button');
            if (firstInput && !firstInput.classList.contains('modal-close')) {
                firstInput.focus();
            }
        }, 100);
        
        // Вызываем событие открытия
        modal.dispatchEvent(new CustomEvent('modal-open', { detail: data }));
    }
    
    close(type) {
        const modal = this.modals.get(type);
        if (!modal || !modal.classList.contains('active')) {
            return;
        }
        
        // Вызываем событие закрытия
        modal.dispatchEvent(new CustomEvent('modal-close'));
        
        // Скрываем модальное окно
        modal.classList.remove('active');
        setActiveModal(null);
        
        // Очищаем данные
        this.clearModalData(modal);
    }
    
    closeAll() {
        this.modals.forEach((modal, type) => {
            if (modal.classList.contains('active')) {
                this.close(type);
            }
        });
    }
    
    setModalData(modal, data) {
        // Сохраняем данные в data-атрибуты
        Object.keys(data).forEach(key => {
            modal.dataset[key] = JSON.stringify(data[key]);
        });
        
        // Заполняем поля формы если есть
        const form = modal.querySelector('form');
        if (form) {
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = data[key];
                    } else if (input.type === 'radio') {
                        const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                        if (radio) radio.checked = true;
                    } else {
                        input.value = data[key];
                    }
                }
            });
        }
    }
    
    clearModalData(modal) {
        // Очищаем data-атрибуты
        Object.keys(modal.dataset).forEach(key => {
            if (key !== 'modalType') {
                delete modal.dataset[key];
            }
        });
        
        // Очищаем поля формы если есть
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Очищаем динамический контент
        const dynamicContainers = modal.querySelectorAll('[data-dynamic]');
        dynamicContainers.forEach(container => {
            container.innerHTML = '';
        });
    }
    
    getModal(type) {
        return this.modals.get(type);
    }
    
    isOpen(type) {
        const modal = this.modals.get(type);
        return modal ? modal.classList.contains('active') : false;
    }
    
    getActiveModal() {
        for (const [type, modal] of this.modals) {
            if (modal.classList.contains('active')) {
                return { type, modal };
            }
        }
        return null;
    }
    
    showConfirm(message, title = 'Подтверждение') {
        return new Promise((resolve) => {
            const modal = this.modals.get(MODAL_TYPES.CONFIRM);
            if (!modal) {
                resolve(false);
                return;
            }
            
            // Устанавливаем сообщение и заголовок
            modal.querySelector('#confirm-title').textContent = title;
            modal.querySelector('#confirm-message').textContent = message;
            
            // Обработчики кнопок
            const handleConfirm = () => {
                cleanup();
                this.close(MODAL_TYPES.CONFIRM);
                resolve(true);
            };
            
            const handleCancel = () => {
                cleanup();
                this.close(MODAL_TYPES.CONFIRM);
                resolve(false);
            };
            
            const cleanup = () => {
                modal.querySelector('#confirm-ok').removeEventListener('click', handleConfirm);
                modal.querySelector('#confirm-cancel').removeEventListener('click', handleCancel);
            };
            
            modal.querySelector('#confirm-ok').addEventListener('click', handleConfirm, { once: true });
            modal.querySelector('#confirm-cancel').addEventListener('click', handleCancel, { once: true });
            
            // Открываем модальное окно
            this.open(MODAL_TYPES.CONFIRM);
        });
    }
    
    showDayOperations(day) {
        const date = new Date(CURRENT_YEAR, CURRENT_MONTH, day);
        const dateString = formatDate(date);
        
        // Устанавливаем заголовок
        const modal = this.modals.get(MODAL_TYPES.DAY_OPERATIONS);
        modal.querySelector('#modal-day-title').textContent = `Операции за ${dateString}`;
        
        // Сохраняем выбранный день
        setSelectedDay(day);
        
        // Загружаем операции дня
        const operations = getDayOperations(day);
        
        // Генерируем категории
        this.generateCategoryButtons(day, dateString);
        
        // Генерируем список операций
        this.generateOperationsList(operations, day);
        
        // Открываем модальное окно
        this.open(MODAL_TYPES.DAY_OPERATIONS);
    }
    
    generateCategoryButtons(day, dateString) {
        const categories = getCategories();
        
        // Категории доходов
        const incomeContainer = document.getElementById('income-categories');
        incomeContainer.innerHTML = '';
        categories.income.forEach(category => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-button income-category';
            button.textContent = category;
            button.addEventListener('click', () => {
                this.showAddOperationForm(OPERATION_TYPES.INCOME, category, dateString);
            });
            incomeContainer.appendChild(button);
        });
        
        // Категории расходов
        const expenseContainer = document.getElementById('expense-categories');
        expenseContainer.innerHTML = '';
        categories.expense.forEach(category => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-button expense-category';
            button.textContent = category;
            button.addEventListener('click', () => {
                this.showAddOperationForm(OPERATION_TYPES.EXPENSE, category, dateString);
            });
            expenseContainer.appendChild(button);
        });
    }
    
    generateOperationsList(operations, day) {
        const incomeList = document.getElementById('income-operations-list');
        const expenseList = document.getElementById('expense-operations-list');
        
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';
        
        const incomeOperations = operations.filter(op => op.type === OPERATION_TYPES.INCOME);
        const expenseOperations = operations.filter(op => op.type === OPERATION_TYPES.EXPENSE);
        
        // Операции доходов
        if (incomeOperations.length === 0) {
            incomeList.innerHTML = '<div class="empty-state">Нет операций доходов</div>';
        } else {
            incomeOperations.forEach(operation => {
                incomeList.appendChild(this.createOperationElement(operation));
            });
        }
        
        // Операции расходов
        if (expenseOperations.length === 0) {
            expenseList.innerHTML = '<div class="empty-state">Нет операций расходов</div>';
        } else {
            expenseOperations.forEach(operation => {
                expenseList.appendChild(this.createOperationElement(operation));
            });
        }
    }
    
    createOperationElement(operation) {
        const div = document.createElement('div');
        div.className = `operation-item operation-item--${operation.type}`;
        div.dataset.operationId = operation.id;
        
        div.innerHTML = `
            <div class="operation-info">
                <div class="operation-category">${escapeHtml(operation.category)}</div>
                ${operation.description ? `<div class="operation-description">${escapeHtml(operation.description)}</div>` : ''}
            </div>
            <div class="operation-amount operation-${operation.type}">${formatCurrency(operation.amount)}</div>
            <div class="operation-actions">
                <button class="operation-delete" title="Удалить">×</button>
            </div>
        `;
        
        // Обработчик удаления
        const deleteBtn = div.querySelector('.operation-delete');
        deleteBtn.addEventListener('click', () => {
            this.showConfirm('Удалить эту операцию?', 'Удаление операции').then(confirmed => {
                if (confirmed) {
                    if (deleteOperation(operation.id)) {
                        // Обновляем список операций
                        const day = getSelectedDay();
                        const operations = getDayOperations(day);
                        this.generateOperationsList(operations, day);
                        // Обновляем календарь
                        generateCalendar();
                        // Обновляем отчеты
                        updateReports();
                    }
                }
            });
        });
        
        return div;
    }
    
    showAddOperationForm(type = null, category = null, date = null) {
        const modal = this.modals.get(MODAL_TYPES.ADD_OPERATION);
        
        // Устанавливаем заголовок
        const title = modal.querySelector('#add-operation-title');
        title.textContent = type ? `Добавить ${type === OPERATION_TYPES.INCOME ? 'доход' : 'расход'}` : 'Добавить операцию';
        
        // Заполняем форму если есть данные
        const form = modal.querySelector('#add-operation-form');
        if (type) {
            form.querySelector('#operation-type').value = type;
        }
        
        if (category) {
            // Нужно обновить список категорий в зависимости от типа
            this.updateCategorySelect(type);
            setTimeout(() => {
                form.querySelector('#operation-category').value = category;
            }, 0);
        }
        
        if (date) {
            // Конвертируем дату из формата dd.mm.yy в формат для input[type=date]
            const parsedDate = parseDate(date);
            if (parsedDate) {
                const yyyy = parsedDate.getFullYear();
                const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const dd = String(parsedDate.getDate()).padStart(2, '0');
                form.querySelector('#operation-date').value = `${yyyy}-${mm}-${dd}`;
            }
        }
        
        // Обработчик изменения типа операции
        const typeSelect = form.querySelector('#operation-type');
        typeSelect.addEventListener('change', (e) => {
            this.updateCategorySelect(e.target.value);
        });
        
        // Обработчик отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddOperationFormSubmit(form);
        });
        
        // Открываем модальное окно
        this.open(MODAL_TYPES.ADD_OPERATION);
        
        // Фокус на сумму
        setTimeout(() => {
            form.querySelector('#operation-amount').focus();
        }, 100);
    }
    
    updateCategorySelect(type) {
        const select = document.querySelector('#operation-category');
        if (!select) return;
        
        select.innerHTML = '';
        const categories = getCategories()[type] || [];
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }
    
    handleAddOperationFormSubmit(form) {
        const formData = new FormData(form);
        const operation = {
            id: generateId(),
            date: formatDate(new Date(formData.get('date'))),
            type: formData.get('type'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description') || ''
        };
        
        if (addOperation(operation)) {
            // Закрываем модальное окно
            this.close(MODAL_TYPES.ADD_OPERATION);
            
            // Обновляем календарь
            generateCalendar();
            
            // Если открыто модальное окно дня, обновляем его
            if (this.isOpen(MODAL_TYPES.DAY_OPERATIONS)) {
                const day = getSelectedDay();
                const operations = getDayOperations(day);
                this.generateOperationsList(operations, day);
            }
            
            // Обновляем отчеты
            updateReports();
        }
    }
    
    showCategoryManager() {
        const modal = this.modals.get(MODAL_TYPES.CATEGORY_MANAGER);
        this.generateCategoryManagerLists();
        this.setupCategoryManagerHandlers();
        this.open(MODAL_TYPES.CATEGORY_MANAGER);
    }
    
    generateCategoryManagerLists() {
        const categories = getCategories();
        
        // Категории доходов
        const incomeContainer = document.getElementById('managed-income-categories');
        incomeContainer.innerHTML = '';
        categories.income.forEach(category => {
            incomeContainer.appendChild(this.createManagedCategoryElement(OPERATION_TYPES.INCOME, category));
        });
        
        // Категории расходов
        const expenseContainer = document.getElementById('managed-expense-categories');
        expenseContainer.innerHTML = '';
        categories.expense.forEach(category => {
            expenseContainer.appendChild(this.createManagedCategoryElement(OPERATION_TYPES.EXPENSE, category));
        });
    }
    
    createManagedCategoryElement(type, category) {
        const div = document.createElement('div');
        div.className = 'managed-category';
        div.dataset.type = type;
        div.dataset.category = category;
        
        div.innerHTML = `
            <span class="category-name">${escapeHtml(category)}</span>
            <div class="managed-category-actions">
                <button class="icon-button rename-category" title="Переименовать">✏️</button>
                <button class="icon-button delete-category" title="Удалить">🗑️</button>
            </div>
        `;
        
        return div;
    }
    
    setupCategoryManagerHandlers() {
        // Добавление категорий доходов
        const addIncomeBtn = document.getElementById('add-income-category');
        const newIncomeInput = document.getElementById('new-income-category');
        
        addIncomeBtn.addEventListener('click', () => {
            const category = newIncomeInput.value.trim();
            if (category) {
                if (addCategory(OPERATION_TYPES.INCOME, category)) {
                    newIncomeInput.value = '';
                    this.generateCategoryManagerLists();
                    this.setupCategoryManagerHandlers();
                }
            }
        });
        
        newIncomeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addIncomeBtn.click();
            }
        });
        
        // Добавление категорий расходов
        const addExpenseBtn = document.getElementById('add-expense-category');
        const newExpenseInput = document.getElementById('new-expense-category');
        
        addExpenseBtn.addEventListener('click', () => {
            const category = newExpenseInput.value.trim();
            if (category) {
                if (addCategory(OPERATION_TYPES.EXPENSE, category)) {
                    newExpenseInput.value = '';
                    this.generateCategoryManagerLists();
                    this.setupCategoryManagerHandlers();
                }
            }
        });
        
        newExpenseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addExpenseBtn.click();
            }
        });
        
        // Обработчики для существующих категорий
        document.querySelectorAll('.managed-category').forEach(item => {
            const type = item.dataset.type;
            const category = item.dataset.category;
            
            // Удаление категории
            const deleteBtn = item.querySelector('.delete-category');
            deleteBtn.addEventListener('click', () => {
                this.showConfirm(`Удалить категорию "${category}"? Все операции в этой категории будут удалены.`, 'Удаление категории')
                    .then(confirmed => {
                        if (confirmed) {
                            if (removeCategory(type, category)) {
                                this.generateCategoryManagerLists();
                                this.setupCategoryManagerHandlers();
                                // Обновляем календарь и отчеты
                                generateCalendar();
                                updateReports();
                            }
                        }
                    });
            });
            
            // Переименование категории
            const renameBtn = item.querySelector('.rename-category');
            renameBtn.addEventListener('click', () => {
                const newName = prompt('Введите новое название категории:', category);
                if (newName && newName.trim() && newName !== category) {
                    if (renameCategory(type, category, newName.trim())) {
                        this.generateCategoryManagerLists();
                        this.setupCategoryManagerHandlers();
                        // Обновляем календарь и отчеты
                        generateCalendar();
                        updateReports();
                    }
                }
            });
        });
    }
}

// Создаем глобальный экземпляр
const modalManager = new ModalManager();
