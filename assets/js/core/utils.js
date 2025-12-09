// assets/js/core/utils.js
function formatDate(date, format = DATE_FORMAT) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    return format
        .replace('dd', day)
        .replace('mm', month)
        .replace('yy', year);
}

function parseDate(dateString) {
    const parts = dateString.split('.');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = 2000 + parseInt(parts[2], 10);
    
    return new Date(year, month, day);
}

function formatCurrency(amount) {
    return amount.toLocaleString('ru-RU', {
        ...NUMBER_FORMAT,
        style: 'currency',
        currency: 'RUB',
        currencyDisplay: 'symbol'
    }).replace('RUB', CURRENCY);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function validateOperation(operation) {
    if (!operation.id || !operation.date || !operation.type || !operation.category || !operation.amount) {
        return { valid: false, error: 'Отсутствуют обязательные поля' };
    }
    
    if (![OPERATION_TYPES.INCOME, OPERATION_TYPES.EXPENSE].includes(operation.type)) {
        return { valid: false, error: 'Неверный тип операции' };
    }
    
    if (typeof operation.amount !== 'number' || operation.amount <= 0) {
        return { valid: false, error: 'Сумма должна быть положительным числом' };
    }
    
    const date = parseDate(operation.date);
    if (!date || isNaN(date.getTime())) {
        return { valid: false, error: 'Неверный формат даты' };
    }
    
    return { valid: true };
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

function getMonthNameShort(monthIndex) {
    const months = [
        'янв', 'фев', 'мар', 'апр', 'май', 'июн',
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    return months[monthIndex];
}

function calculateMonthDifference(date1, date2) {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function getCurrentMonthRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { firstDay, lastDay };
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

function sortBy(array, key, order = 'asc') {
    return array.sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

function filterOperationsByDate(operations, year, month) {
    return operations.filter(op => {
        const opDate = parseDate(op.date);
        return opDate && opDate.getFullYear() === year && opDate.getMonth() === month;
    });
}

function calculateDayOperationsTotal(operations, day, type = null) {
    let total = 0;
    operations.forEach(op => {
        const opDate = parseDate(op.date);
        if (opDate && opDate.getDate() === day) {
            if (!type || op.type === type) {
                total += op.amount;
            }
        }
    });
    return total;
}

function getWeekDayName(dayIndex) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseNumber(str) {
    return parseFloat(str.replace(/\s/g, '').replace(',', '.'));
}

function getColorForAmount(amount, type) {
    if (type === OPERATION_TYPES.INCOME) {
        if (amount > 50000) return '#28a745';
        if (amount > 10000) return '#20c997';
        return '#6c757d';
    } else {
        if (amount > 50000) return '#dc3545';
        if (amount > 10000) return '#fd7e14';
        return '#6c757d';
    }
}

function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

function getOrdinalSuffix(day) {
    if (day >= 11 && day <= 14) return 'ое';
    const lastDigit = day % 10;
    if (lastDigit === 1) return 'ое';
    if (lastDigit >= 2 && lastDigit <= 4) return 'ое';
    return 'ое';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidJson(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (e) {
        return false;
    }
}

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

function downloadFile(filename, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getCurrentYearMonth() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
}
