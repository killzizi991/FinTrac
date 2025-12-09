// assets/js/modules/operations.js
class OperationsManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Инициализация обработчиков событий
        this.setupEventListeners();
        
        // Загружаем начальные данные
        this.refreshOperations();
    }
    
    setupEventListeners() {
        // Слушаем события добавления, обновления и удаления операций
        document.addEventListener('operation-added', (e) => {
            this.handleOperationAdded(e.detail);
        });
        
        document.addEventListener('operation-updated', (e) => {
            this.handleOperationUpdated(e.detail);
        });
        
        document.addEventListener('operation-deleted', (e) => {
            this.handleOperationDeleted(e.detail);
        });
        
        document.addEventListener('data-imported', () => {
            this.refreshOperations();
        });
    }
    
    handleOperationAdded(operation) {
        // Обновляем календарь
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Обновляем сводку
        if (typeof updateMonthSummary === 'function') {
            updateMonthSummary();
        }
        
        // Обновляем конкретный день
        const day = parseDate(operation.date).getDate();
        if (typeof updateDayVisualization === 'function') {
            updateDayVisualization(day);
        }
        
        // Показываем уведомление
        showNotification(
            `Операция "${operation.category}" добавлена`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    handleOperationUpdated(detail) {
        const { id, operation } = detail;
        
        // Обновляем календарь
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Обновляем сводку
        if (typeof updateMonthSummary === 'function') {
            updateMonthSummary();
        }
        
        // Обновляем конкретный день
        const day = parseDate(operation.date).getDate();
        if (typeof updateDayVisualization === 'function') {
            updateDayVisualization(day);
        }
        
        // Показываем уведомление
        showNotification(
            `Операция "${operation.category}" обновлена`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    handleOperationDeleted(detail) {
        const { id, operation } = detail;
        
        // Обновляем календарь
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Обновляем сводку
        if (typeof updateMonthSummary === 'function') {
            updateMonthSummary();
        }
        
        // Обновляем конкретный день
        const day = parseDate(operation.date).getDate();
        if (typeof updateDayVisualization === 'function') {
            updateDayVisualization(day);
        }
        
        // Показываем уведомление
        showNotification(
            `Операция "${operation.category}" удалена`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    refreshOperations() {
        // Обновляем календарь
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Обновляем сводку
        if (typeof updateMonthSummary === 'function') {
            updateMonthSummary();
        }
    }
    
    // Получение операций с фильтрацией
    getFilteredOperations(filters = {}) {
        let operations = dataManager.getAllOperations();
        
        // Фильтрация по типу
        if (filters.type) {
            operations = operations.filter(op => op.type === filters.type);
        }
        
        // Фильтрация по категории
        if (filters.category) {
            operations = operations.filter(op => op.category === filters.category);
        }
        
        // Фильтрация по дате
        if (filters.startDate) {
            const start = parseDate(filters.startDate);
            operations = operations.filter(op => {
                const opDate = parseDate(op.date);
                return opDate >= start;
            });
        }
        
        if (filters.endDate) {
            const end = parseDate(filters.endDate);
            operations = operations.filter(op => {
                const opDate = parseDate(op.date);
                return opDate <= end;
            });
        }
        
        // Фильтрация по сумме
        if (filters.minAmount !== undefined) {
            operations = operations.filter(op => op.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount !== undefined) {
            operations = operations.filter(op => op.amount <= filters.maxAmount);
        }
        
        // Поиск по тексту
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            operations = operations.filter(op => 
                op.category.toLowerCase().includes(searchTerm) ||
                op.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Сортировка
        if (filters.sortBy) {
            operations.sort((a, b) => {
                let aVal = a[filters.sortBy];
                let bVal = b[filters.sortBy];
                
                if (filters.sortBy === 'date') {
                    aVal = parseDate(aVal).getTime();
                    bVal = parseDate(bVal).getTime();
                }
                
                if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return operations;
    }
    
    // Группировка операций по категориям
    getOperationsByCategory(type = null) {
        const operations = type ? 
            dataManager.getAllOperations().filter(op => op.type === type) :
            dataManager.getAllOperations();
        
        return operations.reduce((groups, operation) => {
            const category = operation.category;
            if (!groups[category]) {
                groups[category] = {
                    category,
                    type: operation.type,
                    total: 0,
                    count: 0,
                    operations: []
                };
            }
            
            groups[category].total += operation.amount;
            groups[category].count++;
            groups[category].operations.push(operation);
            
            return groups;
        }, {});
    }
    
    // Статистика по временным периодам
    getTimePeriodStats(period = 'month') {
        const operations = dataManager.getAllOperations();
        const stats = {};
        
        operations.forEach(operation => {
            const date = parseDate(operation.date);
            let key;
            
            switch (period) {
                case 'day':
                    key = operation.date;
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay() + 1); // Начало недели (понедельник)
                    key = formatDate(weekStart) + ' - ' + formatDate(new Date(weekStart.setDate(weekStart.getDate() + 6)));
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = operation.date;
            }
            
            if (!stats[key]) {
                stats[key] = {
                    period: key,
                    income: 0,
                    expense: 0,
                    balance: 0,
                    operations: []
                };
            }
            
            stats[key].operations.push(operation);
            
            if (operation.type === OPERATION_TYPES.INCOME) {
                stats[key].income += operation.amount;
                stats[key].balance += operation.amount;
            } else {
                stats[key].expense += operation.amount;
                stats[key].balance -= operation.amount;
            }
        });
        
        return Object.values(stats).sort((a, b) => {
            // Сортируем по дате в обратном порядке (последние периоды первыми)
            if (period === 'month') {
                return b.period.localeCompare(a.period);
            } else if (period === 'year') {
                return parseInt(b.period) - parseInt(a.period);
            } else {
                return parseDate(b.period.split(' - ')[0]) - parseDate(a.period.split(' - ')[0]);
            }
        });
    }
    
    // Создание операции
    createOperation(data) {
        const operation = {
            id: generateId(),
            date: formatDate(new Date(data.date)),
            type: data.type,
            category: data.category,
            amount: parseFloat(data.amount),
            description: data.description || ''
        };
        
        return dataManager.addOperation(operation);
    }
    
    // Обновление операции
    updateOperation(id, data) {
        return dataManager.updateOperation(id, data);
    }
    
    // Удаление операции
    deleteOperation(id) {
        return dataManager.deleteOperation(id);
    }
    
    // Удаление всех операций
    deleteAllOperations() {
        return dataManager.clearOperations();
    }
    
    // Поиск дубликатов операций
    findDuplicateOperations() {
        const operations = dataManager.getAllOperations();
        const duplicates = [];
        const seen = new Map();
        
        operations.forEach(operation => {
            const key = `${operation.date}-${operation.type}-${operation.category}-${operation.amount}`;
            
            if (seen.has(key)) {
                duplicates.push({
                    original: seen.get(key),
                    duplicate: operation
                });
            } else {
                seen.set(key, operation);
            }
        });
        
        return duplicates;
    }
    
    // Расчет общего баланса
    calculateTotalBalance() {
        const operations = dataManager.getAllOperations();
        let balance = 0;
        
        operations.forEach(operation => {
            if (operation.type === OPERATION_TYPES.INCOME) {
                balance += operation.amount;
            } else {
                balance -= operation.amount;
            }
        });
        
        return balance;
    }
    
    // Экспорт операций в CSV
    exportToCSV(operations = null) {
        const ops = operations || dataManager.getAllOperations();
        
        const headers = ['Дата', 'Тип', 'Категория', 'Сумма', 'Описание'];
        const rows = ops.map(op => [
            op.date,
            op.type === OPERATION_TYPES.INCOME ? 'Доход' : 'Расход',
            op.category,
            op.amount.toString(),
            op.description || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// Создаем глобальный экземпляр
const operationsManager = new OperationsManager();
