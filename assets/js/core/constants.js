// assets/js/core/constants.js
const STORAGE_KEY = 'financial_calendar_data';
const CACHE_NAME = 'financial_calendar_v1';
const APP_VERSION = '1.0.0';

const DEFAULT_CATEGORIES = {
    income: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарок', 'Возврат долга'],
    expense: ['Еда', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Одежда', 'Образование']
};

const DATE_FORMAT = 'dd.mm.yy';
const CURRENCY = '₽';
const NUMBER_FORMAT = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
};

const COLORS = {
    primary: '#4a6cf7',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    dark: '#343a40',
    light: '#f8f9fa'
};

const MODAL_TYPES = {
    DAY_OPERATIONS: 'day-operations',
    ADD_OPERATION: 'add-operation',
    CATEGORY_MANAGER: 'category-manager',
    REPORT: 'report',
    EXPORT_IMPORT: 'export-import',
    CONFIRM: 'confirm'
};

const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

const OPERATION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};
