// assets/js/modules/data-manager.js
class DataManager {
    constructor() {
        this.operations = [];
        this.settings = null;
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.isInitialized = true;
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.operations = parsed.operations || [];
                this.settings = parsed.settings || this.getDefaultSettings();
                
                // Миграция старых данных
                this.migrateData(parsed);
                
                return true;
            } else {
                this.setDefaultData();
                return true;
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.setDefaultData();
            return false;
        }
    }
    
    saveToStorage() {
        try {
            const data = {
                settings: this.settings,
                operations: this.operations
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            return false;
        }
    }
    
    getDefaultSettings() {
        return {
            currency: CURRENCY,
            dateFormat: DATE_FORMAT,
            darkMode: false,
            categories: deepClone(DEFAULT_CATEGORIES)
        };
    }
    
    setDefaultData() {
        this.settings = this.getDefaultSettings();
        this.operations = [];
        this.saveToStorage();
    }
    
    migrateData(oldData) {
        let needsSave = false;
        
        // Миграция категорий
        if (!this.settings.categories) {
            this.settings.categories = deepClone(DEFAULT_CATEGORIES);
            needsSave = true;
        }
        
        // Миграция формата даты
        if (!this.settings.dateFormat) {
            this.settings.dateFormat = DATE_FORMAT;
            needsSave = true;
        }
        
        // Миграция валюты
        if (!this.settings.currency) {
            this.settings.currency = CURRENCY;
            needsSave = true;
        }
        
        // Миграция операций (если старый формат)
        this.operations.forEach(op => {
            if (!op.id) {
                op.id = generateId();
                needsSave = true;
            }
            
            if (!op.description) {
                op.description = '';
                needsSave = true;
            }
        });
        
        if (needsSave) {
            this.saveToStorage();
        }
    }
    
    // Операции
    getAllOperations() {
        return deepClone(this.operations);
    }
    
    getOperationsByDate(date) {
        return this.operations.filter(op => op.date === date);
    }
    
    getOperationsByMonth(year, month) {
        return this.operations.filter(op => {
            const opDate = parseDate(op.date);
            return opDate && opDate.getFullYear() === year && opDate.getMonth() === month;
        });
    }
    
    getOperationById(id) {
        return this.operations.find(op => op.id === id);
    }
    
    addOperation(operation) {
        const validation = validateOperation(operation);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        this.operations.push(operation);
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('operation-added', { detail: operation }));
        }
        
        return saved;
    }
    
    updateOperation(id, updates) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index === -1) return false;
        
        const updated = { ...this.operations[index], ...updates };
        const validation = validateOperation(updated);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        this.operations[index] = updated;
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('operation-updated', { 
                detail: { id, operation: updated } 
            }));
        }
        
        return saved;
    }
    
    deleteOperation(id) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index === -1) return false;
        
        const deleted = this.operations.splice(index, 1)[0];
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('operation-deleted', { 
                detail: { id, operation: deleted } 
            }));
        }
        
        return saved;
    }
    
    clearOperations() {
        this.operations = [];
        return this.saveToStorage();
    }
    
    // Настройки
    getSettings() {
        return deepClone(this.settings);
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('settings-changed', { 
                detail: newSettings 
            }));
        }
        
        return saved;
    }
    
    // Категории
    getCategories() {
        return deepClone(this.settings.categories);
    }
    
    addCategory(type, category) {
        if (!this.settings.categories[type]) {
            this.settings.categories[type] = [];
        }
        
        if (this.settings.categories[type].includes(category)) {
            return false;
        }
        
        this.settings.categories[type].push(category);
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('category-added', { 
                detail: { type, category } 
            }));
        }
        
        return saved;
    }
    
    removeCategory(type, category) {
        const index = this.settings.categories[type].indexOf(category);
        if (index === -1) return false;
        
        // Удаляем операции с этой категорией
        this.operations = this.operations.filter(op => 
            !(op.type === type && op.category === category)
        );
        
        this.settings.categories[type].splice(index, 1);
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('category-removed', { 
                detail: { type, category } 
            }));
        }
        
        return saved;
    }
    
    renameCategory(type, oldName, newName) {
        const oldIndex = this.settings.categories[type].indexOf(oldName);
        if (oldIndex === -1) return false;
        
        if (this.settings.categories[type].includes(newName)) {
            return false;
        }
        
        // Обновляем операции
        this.operations.forEach(op => {
            if (op.type === type && op.category === oldName) {
                op.category = newName;
            }
        });
        
        this.settings.categories[type][oldIndex] = newName;
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('category-renamed', { 
                detail: { type, oldName, newName } 
            }));
        }
        
        return saved;
    }
    
    // Экспорт/импорт
    exportData() {
        return {
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            settings: this.settings,
            operations: this.operations
        };
    }
    
    importData(data, replace = true) {
        if (!data.settings || !data.operations) {
            throw new Error('Неверный формат данных');
        }
        
        if (replace) {
            this.settings = data.settings;
            this.operations = data.operations;
        } else {
            // Объединяем данные
            this.settings = { ...this.settings, ...data.settings };
            
            // Объединяем категории
            if (data.settings.categories) {
                Object.keys(data.settings.categories).forEach(type => {
                    if (!this.settings.categories[type]) {
                        this.settings.categories[type] = [];
                    }
                    data.settings.categories[type].forEach(cat => {
                        if (!this.settings.categories[type].includes(cat)) {
                            this.settings.categories[type].push(cat);
                        }
                    });
                });
            }
            
            // Добавляем операции, избегая дубликатов
            const existingIds = new Set(this.operations.map(op => op.id));
            data.operations.forEach(op => {
                if (!existingIds.has(op.id)) {
                    this.operations.push(op);
                }
            });
        }
        
        const saved = this.saveToStorage();
        
        if (saved) {
            document.dispatchEvent(new CustomEvent('data-imported'));
        }
        
        return saved;
    }
    
    // Статистика
    getMonthStatistics(year, month) {
        const operations = this.getOperationsByMonth(year, month);
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals = {
            income: {},
            expense: {}
        };
        
        operations.forEach(op => {
            if (op.type === OPERATION_TYPES.INCOME) {
                totalIncome += op.amount;
                
                if (!categoryTotals.income[op.category]) {
                    categoryTotals.income[op.category] = 0;
                }
                categoryTotals.income[op.category] += op.amount;
            } else {
                totalExpense += op.amount;
                
                if (!categoryTotals.expense[op.category]) {
                    categoryTotals.expense[op.category] = 0;
                }
                categoryTotals.expense[op.category] += op.amount;
            }
        });
        
        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            categoryTotals,
            operationsCount: operations.length
        };
    }
    
    getYearStatistics(year) {
        let totalIncome = 0;
        let totalExpense = 0;
        const monthTotals = Array(12).fill().map(() => ({
            income: 0,
            expense: 0,
            balance: 0
        }));
        
        this.operations.forEach(op => {
            const opDate = parseDate(op.date);
            if (!opDate || opDate.getFullYear() !== year) return;
            
            const month = opDate.getMonth();
            
            if (op.type === OPERATION_TYPES.INCOME) {
                totalIncome += op.amount;
                monthTotals[month].income += op.amount;
                monthTotals[month].balance += op.amount;
            } else {
                totalExpense += op.amount;
                monthTotals[month].expense += op.amount;
                monthTotals[month].balance -= op.amount;
            }
        });
        
        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            monthTotals
        };
    }
    
    // Поиск
    searchOperations(query, filters = {}) {
        query = query.toLowerCase().trim();
        
        return this.operations.filter(op => {
            // Поиск по тексту
            const textMatch = !query || 
                op.category.toLowerCase().includes(query) ||
                (op.description && op.description.toLowerCase().includes(query));
            
            // Фильтры по типу
            const typeMatch = !filters.type || op.type === filters.type;
            
            // Фильтры по категории
            const categoryMatch = !filters.category || op.category === filters.category;
            
            // Фильтры по дате
            let dateMatch = true;
            if (filters.startDate) {
                const opDate = parseDate(op.date);
                const startDate = parseDate(filters.startDate);
                if (opDate && startDate && opDate < startDate) {
                    dateMatch = false;
                }
            }
            
            if (filters.endDate) {
                const opDate = parseDate(op.date);
                const endDate = parseDate(filters.endDate);
                if (opDate && endDate && opDate > endDate) {
                    dateMatch = false;
                }
            }
            
            // Фильтры по сумме
            let amountMatch = true;
            if (filters.minAmount !== undefined && op.amount < filters.minAmount) {
                amountMatch = false;
            }
            if (filters.maxAmount !== undefined && op.amount > filters.maxAmount) {
                amountMatch = false;
            }
            
            return textMatch && typeMatch && categoryMatch && dateMatch && amountMatch;
        });
    }
    
    // Резервное копирование
    createBackup() {
        return {
            data: this.exportData(),
            timestamp: Date.now(),
            size: JSON.stringify(this.exportData()).length
        };
    }
    
    // Восстановление из резервной копии
    restoreFromBackup(backup) {
        return this.importData(backup.data, true);
    }
}

// Создаем глобальный экземпляр
const dataManager = new DataManager();
