// assets/js/modules/categories.js
class CategoriesManager {
    constructor() {
        this.categories = null;
        this.init();
    }
    
    init() {
        this.loadCategories();
        this.setupEventListeners();
    }
    
    loadCategories() {
        this.categories = dataManager.getCategories();
    }
    
    setupEventListeners() {
        // Слушаем события изменения категорий
        document.addEventListener('category-added', (e) => {
            this.handleCategoryAdded(e.detail);
        });
        
        document.addEventListener('category-removed', (e) => {
            this.handleCategoryRemoved(e.detail);
        });
        
        document.addEventListener('category-renamed', (e) => {
            this.handleCategoryRenamed(e.detail);
        });
        
        document.addEventListener('data-imported', () => {
            this.loadCategories();
        });
    }
    
    handleCategoryAdded(detail) {
        const { type, category } = detail;
        
        if (!this.categories[type]) {
            this.categories[type] = [];
        }
        
        if (!this.categories[type].includes(category)) {
            this.categories[type].push(category);
        }
        
        // Обновляем UI если нужно
        this.refreshCategoryDisplays();
        
        showNotification(
            `Категория "${category}" добавлена`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    handleCategoryRemoved(detail) {
        const { type, category } = detail;
        
        const index = this.categories[type]?.indexOf(category);
        if (index !== -1) {
            this.categories[type].splice(index, 1);
        }
        
        // Обновляем UI если нужно
        this.refreshCategoryDisplays();
        
        showNotification(
            `Категория "${category}" удалена`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    handleCategoryRenamed(detail) {
        const { type, oldName, newName } = detail;
        
        const index = this.categories[type]?.indexOf(oldName);
        if (index !== -1) {
            this.categories[type][index] = newName;
        }
        
        // Обновляем UI если нужно
        this.refreshCategoryDisplays();
        
        showNotification(
            `Категория "${oldName}" переименована в "${newName}"`,
            NOTIFICATION_TYPES.SUCCESS
        );
    }
    
    refreshCategoryDisplays() {
        // Эта функция будет вызываться, когда нужно обновить отображение категорий в UI
        // Например, при открытии модального окна выбора категории
    }
    
    // Получение всех категорий
    getAllCategories() {
        return deepClone(this.categories);
    }
    
    // Получение категорий по типу
    getCategoriesByType(type) {
        return deepClone(this.categories[type] || []);
    }
    
    // Проверка существования категории
    categoryExists(type, category) {
        return this.categories[type]?.includes(category) || false;
    }
    
    // Добавление категории
    addCategory(type, category) {
        if (!category || !category.trim()) {
            showNotification('Название категории не может быть пустым', NOTIFICATION_TYPES.ERROR);
            return false;
        }
        
        return dataManager.addCategory(type, category.trim());
    }
    
    // Удаление категории
    removeCategory(type, category) {
        return dataManager.removeCategory(type, category);
    }
    
    // Переименование категории
    renameCategory(type, oldName, newName) {
        if (!newName || !newName.trim()) {
            showNotification('Новое название категории не может быть пустым', NOTIFICATION_TYPES.ERROR);
            return false;
        }
        
        return dataManager.renameCategory(type, oldName, newName.trim());
    }
    
    // Получение статистики по категориям
    getCategoryStats(timeRange = 'month') {
        const operations = dataManager.getAllOperations();
        const stats = {
            income: {},
            expense: {}
        };
        
        // Определяем временной диапазон
        let startDate;
        const now = new Date();
        
        switch (timeRange) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case 'all':
            default:
                startDate = new Date(0); // Начало времен
        }
        
        // Фильтруем операции по времени
        const filteredOps = operations.filter(op => {
            const opDate = parseDate(op.date);
            return opDate >= startDate;
        });
        
        // Считаем статистику
        filteredOps.forEach(op => {
            const type = op.type;
            const category = op.category;
            
            if (!stats[type][category]) {
                stats[type][category] = {
                    category,
                    type,
                    total: 0,
                    count: 0,
                    percentage: 0
                };
            }
            
            stats[type][category].total += op.amount;
            stats[type][category].count++;
        });
        
        // Рассчитываем проценты для каждого типа
        ['income', 'expense'].forEach(type => {
            const typeTotal = Object.values(stats[type]).reduce((sum, cat) => sum + cat.total, 0);
            
            Object.keys(stats[type]).forEach(category => {
                stats[type][category].percentage = typeTotal > 0 ? 
                    (stats[type][category].total / typeTotal) * 100 : 0;
            });
        });
        
        return stats;
    }
    
    // Получение наиболее используемых категорий
    getMostUsedCategories(type = null, limit = 5) {
        const stats = this.getCategoryStats('month');
        let categories = [];
        
        if (type) {
            categories = Object.values(stats[type]);
        } else {
            categories = [
                ...Object.values(stats.income),
                ...Object.values(stats.expense)
            ];
        }
        
        return categories
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    
    // Получение категорий с наибольшими суммами
    getTopCategoriesByAmount(type = null, limit = 5) {
        const stats = this.getCategoryStats('month');
        let categories = [];
        
        if (type) {
            categories = Object.values(stats[type]);
        } else {
            categories = [
                ...Object.values(stats.income),
                ...Object.values(stats.expense)
            ];
        }
        
        return categories
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // Объединение категорий
    mergeCategories(type, sourceCategory, targetCategory) {
        // Проверяем существование категорий
        if (!this.categoryExists(type, sourceCategory)) {
            showNotification(`Категория "${sourceCategory}" не существует`, NOTIFICATION_TYPES.ERROR);
            return false;
        }
        
        if (!this.categoryExists(type, targetCategory)) {
            showNotification(`Категория "${targetCategory}" не существует`, NOTIFICATION_TYPES.ERROR);
            return false;
        }
        
        if (sourceCategory === targetCategory) {
            showNotification('Нельзя объединить категорию с самой собой', NOTIFICATION_TYPES.WARNING);
            return false;
        }
        
        // Обновляем операции
        const operations = dataManager.getAllOperations();
        let updatedCount = 0;
        
        operations.forEach(op => {
            if (op.type === type && op.category === sourceCategory) {
                op.category = targetCategory;
                updatedCount++;
            }
        });
        
        // Сохраняем изменения
        if (updatedCount > 0) {
            dataManager.importData({
                settings: dataManager.getSettings(),
                operations
            }, true);
        }
        
        // Удаляем исходную категорию
        this.removeCategory(type, sourceCategory);
        
        showNotification(
            `Объединено ${updatedCount} операций из "${sourceCategory}" в "${targetCategory}"`,
            NOTIFICATION_TYPES.SUCCESS
        );
        
        return true;
    }
    
    // Импорт категорий из другого источника
    importCategories(importedCategories, merge = true) {
        const currentCategories = this.getAllCategories();
        
        Object.keys(importedCategories).forEach(type => {
            if (!currentCategories[type]) {
                currentCategories[type] = [];
            }
            
            importedCategories[type].forEach(category => {
                if (!currentCategories[type].includes(category)) {
                    currentCategories[type].push(category);
                }
            });
        });
        
        return dataManager.updateSettings({
            categories: currentCategories
        });
    }
    
    // Экспорт категорий
    exportCategories() {
        return this.getAllCategories();
    }
    
    // Сброс категорий к значениям по умолчанию
    resetToDefaults() {
        const defaultCategories = deepClone(DEFAULT_CATEGORIES);
        return dataManager.updateSettings({
            categories: defaultCategories
        });
    }
    
    // Генерация цветов для категорий (для графиков)
    generateCategoryColors() {
        const colors = {};
        const colorPalette = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7',
            '#3A86FF', '#FB5607', '#8338EC', '#FF006E', '#FFBE0B'
        ];
        
        let colorIndex = 0;
        
        ['income', 'expense'].forEach(type => {
            colors[type] = {};
            
            this.getCategoriesByType(type).forEach(category => {
                colors[type][category] = colorPalette[colorIndex % colorPalette.length];
                colorIndex++;
            });
        });
        
        return colors;
    }
}

// Создаем глобальный экземпляр
const categoriesManager = new CategoriesManager();
