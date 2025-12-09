// assets/js/core/state.js
let APP_DATA = {
    settings: {
        currency: CURRENCY,
        dateFormat: DATE_FORMAT,
        darkMode: false,
        categories: deepClone(DEFAULT_CATEGORIES)
    },
    operations: []
};

let CURRENT_DATE = new Date();
let SELECTED_DAY = null;
let ACTIVE_MODAL = null;
let CURRENT_YEAR = CURRENT_DATE.getFullYear();
let CURRENT_MONTH = CURRENT_DATE.getMonth();

function initAppData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Миграция данных, если нужно
            if (!parsedData.settings) {
                parsedData.settings = {
                    currency: CURRENCY,
                    dateFormat: DATE_FORMAT,
                    darkMode: false,
                    categories: deepClone(DEFAULT_CATEGORIES)
                };
            }
            
            if (!parsedData.settings.categories) {
                parsedData.settings.categories = deepClone(DEFAULT_CATEGORIES);
            }
            
            if (!parsedData.operations) {
                parsedData.operations = [];
            }
            
            APP_DATA = parsedData;
            
            // Обновляем текущую дату
            CURRENT_DATE = new Date();
            CURRENT_YEAR = CURRENT_DATE.getFullYear();
            CURRENT_MONTH = CURRENT_DATE.getMonth();
            
            return true;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            createDefaultData();
            return false;
        }
    } else {
        createDefaultData();
        return true;
    }
}

function createDefaultData() {
    APP_DATA = {
        settings: {
            currency: CURRENCY,
            dateFormat: DATE_FORMAT,
            darkMode: false,
            categories: deepClone(DEFAULT_CATEGORIES)
        },
        operations: []
    };
    saveAppData();
}

function saveAppData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_DATA));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        showNotification('Ошибка сохранения данных', NOTIFICATION_TYPES.ERROR);
        return false;
    }
}

function getAppData() {
    return deepClone(APP_DATA);
}

function updateAppData(newData) {
    APP_DATA = deepClone(newData);
    return saveAppData();
}

function getSettings() {
    return deepClone(APP_DATA.settings);
}

function updateSettings(newSettings) {
    APP_DATA.settings = { ...APP_DATA.settings, ...newSettings };
    return saveAppData();
}

function getCategories() {
    return deepClone(APP_DATA.settings.categories);
}

function updateCategories(newCategories) {
    APP_DATA.settings.categories = deepClone(newCategories);
    return saveAppData();
}

function getOperations() {
    return deepClone(APP_DATA.operations);
}

function getOperationsByDate(dateString) {
    return APP_DATA.operations.filter(op => op.date === dateString);
}

function getOperationsByMonth(year, month) {
    return APP_DATA.operations.filter(op => {
        const opDate = parseDate(op.date);
        return opDate && opDate.getFullYear() === year && opDate.getMonth() === month;
    });
}

function addOperation(operation) {
    const validation = validateOperation(operation);
    if (!validation.valid) {
        showNotification(validation.error, NOTIFICATION_TYPES.ERROR);
        return false;
    }
    
    APP_DATA.operations.push(operation);
    const saved = saveAppData();
    if (saved) {
        showNotification('Операция добавлена', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function updateOperation(id, updates) {
    const index = APP_DATA.operations.findIndex(op => op.id === id);
    if (index === -1) return false;
    
    const updatedOperation = { ...APP_DATA.operations[index], ...updates };
    const validation = validateOperation(updatedOperation);
    if (!validation.valid) {
        showNotification(validation.error, NOTIFICATION_TYPES.ERROR);
        return false;
    }
    
    APP_DATA.operations[index] = updatedOperation;
    return saveAppData();
}

function deleteOperation(id) {
    const index = APP_DATA.operations.findIndex(op => op.id === id);
    if (index === -1) return false;
    
    APP_DATA.operations.splice(index, 1);
    const saved = saveAppData();
    if (saved) {
        showNotification('Операция удалена', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function clearAllData() {
    APP_DATA.operations = [];
    const saved = saveAppData();
    if (saved) {
        showNotification('Все данные очищены', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function importData(newData) {
    if (!newData.settings || !newData.operations) {
        showNotification('Неверный формат данных', NOTIFICATION_TYPES.ERROR);
        return false;
    }
    
    APP_DATA = deepClone(newData);
    const saved = saveAppData();
    if (saved) {
        showNotification('Данные успешно импортированы', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function getCurrentDate() {
    return new Date(CURRENT_DATE);
}

function setCurrentDate(date) {
    CURRENT_DATE = new Date(date);
    CURRENT_YEAR = CURRENT_DATE.getFullYear();
    CURRENT_MONTH = CURRENT_DATE.getMonth();
}

function getSelectedDay() {
    return SELECTED_DAY;
}

function setSelectedDay(day) {
    SELECTED_DAY = day;
}

function getActiveModal() {
    return ACTIVE_MODAL;
}

function setActiveModal(modal) {
    ACTIVE_MODAL = modal;
}

function getCurrentMonthData() {
    return {
        year: CURRENT_YEAR,
        month: CURRENT_MONTH,
        monthName: getMonthName(CURRENT_MONTH),
        daysInMonth: getDaysInMonth(CURRENT_YEAR, CURRENT_MONTH),
        firstDay: new Date(CURRENT_YEAR, CURRENT_MONTH, 1),
        lastDay: new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0)
    };
}

function getMonthOperations() {
    return getOperationsByMonth(CURRENT_YEAR, CURRENT_MONTH);
}

function getDayOperations(day) {
    const dateString = formatDate(new Date(CURRENT_YEAR, CURRENT_MONTH, day));
    return getOperationsByDate(dateString);
}

function calculateMonthTotals() {
    const operations = getMonthOperations();
    let totalIncome = 0;
    let totalExpense = 0;
    
    operations.forEach(op => {
        if (op.type === OPERATION_TYPES.INCOME) {
            totalIncome += op.amount;
        } else {
            totalExpense += op.amount;
        }
    });
    
    return {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense
    };
}

function getPreviousMonthTotals() {
    let prevYear = CURRENT_YEAR;
    let prevMonth = CURRENT_MONTH - 1;
    
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
    }
    
    const operations = APP_DATA.operations.filter(op => {
        const opDate = parseDate(op.date);
        return opDate && opDate.getFullYear() === prevYear && opDate.getMonth() === prevMonth;
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    operations.forEach(op => {
        if (op.type === OPERATION_TYPES.INCOME) {
            totalIncome += op.amount;
        } else {
            totalExpense += op.amount;
        }
    });
    
    return {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense
    };
}

function getCategoryTotals() {
    const operations = getMonthOperations();
    const categoryTotals = {
        income: {},
        expense: {}
    };
    
    operations.forEach(op => {
        const category = op.category;
        const amount = op.amount;
        
        if (!categoryTotals[op.type][category]) {
            categoryTotals[op.type][category] = 0;
        }
        categoryTotals[op.type][category] += amount;
    });
    
    return categoryTotals;
}

function getTopExpenseCategories(limit = 3) {
    const categoryTotals = getCategoryTotals();
    const expenseCategories = Object.entries(categoryTotals.expense);
    
    return expenseCategories
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category, amount]) => ({ category, amount }));
}

function isDarkMode() {
    return APP_DATA.settings.darkMode;
}

function toggleDarkMode() {
    APP_DATA.settings.darkMode = !APP_DATA.settings.darkMode;
    saveAppData();
    return APP_DATA.settings.darkMode;
}

function getCurrencySymbol() {
    return APP_DATA.settings.currency;
}

function getDateFormat() {
    return APP_DATA.settings.dateFormat;
}

function addCategory(type, category) {
    if (!APP_DATA.settings.categories[type]) {
        APP_DATA.settings.categories[type] = [];
    }
    
    if (APP_DATA.settings.categories[type].includes(category)) {
        showNotification('Категория уже существует', NOTIFICATION_TYPES.WARNING);
        return false;
    }
    
    APP_DATA.settings.categories[type].push(category);
    const saved = saveAppData();
    if (saved) {
        showNotification('Категория добавлена', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function removeCategory(type, category) {
    const index = APP_DATA.settings.categories[type].indexOf(category);
    if (index === -1) return false;
    
    // Удаляем категорию из операций
    APP_DATA.operations = APP_DATA.operations.filter(op => 
        !(op.type === type && op.category === category)
    );
    
    APP_DATA.settings.categories[type].splice(index, 1);
    const saved = saveAppData();
    if (saved) {
        showNotification('Категория удалена', NOTIFICATION_TYPES.SUCCESS);
    }
    return saved;
}

function renameCategory(type, oldName, newName) {
    const oldIndex = APP_DATA.settings.categories[type].indexOf(oldName);
    if (oldIndex === -1) return false;
    
    if (APP_DATA.settings.categories[type].includes(newName)) {
        showNotification('Категория с таким названием уже существует', NOTIFICATION_TYPES.WARNING);
        return false;
    }
    
    // Обновляем категорию в операциях
    APP_DATA.operations.forEach(op => {
        if (op.type === type && op.category === oldName) {
            op.category = newName;
        }
    });
    
    APP_DATA.settings.categories[type][oldIndex] = newName;
    return saveAppData();
}
