// assets/js/ui/notifications.js
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notificationId = 0;
        this.queue = [];
        this.init();
    }
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }
    
    show(message, type = NOTIFICATION_TYPES.INFO, duration = 5000) {
        const id = ++this.notificationId;
        const notification = this.createNotification(id, message, type);
        
        // Добавляем в контейнер
        this.container.appendChild(notification);
        
        // Добавляем в очередь для автоудаления
        const removeTimeout = setTimeout(() => {
            this.remove(id);
        }, duration);
        
        // Сохраняем информацию об уведомлении
        this.queue.push({
            id,
            element: notification,
            timeout: removeTimeout
        });
        
        // Возвращаем id для возможного ручного удаления
        return id;
    }
    
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.notificationId = id;
        
        const icon = this.getIconForType(type);
        const title = this.getTitleForType(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${escapeHtml(message)}</div>
            </div>
            <button class="notification-close" aria-label="Закрыть">&times;</button>
        `;
        
        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(id));
        
        return notification;
    }
    
    getIconForType(type) {
        const icons = {
            [NOTIFICATION_TYPES.SUCCESS]: '✅',
            [NOTIFICATION_TYPES.ERROR]: '❌',
            [NOTIFICATION_TYPES.WARNING]: '⚠️',
            [NOTIFICATION_TYPES.INFO]: 'ℹ️'
        };
        return icons[type] || icons[NOTIFICATION_TYPES.INFO];
    }
    
    getTitleForType(type) {
        const titles = {
            [NOTIFICATION_TYPES.SUCCESS]: 'Успешно',
            [NOTIFICATION_TYPES.ERROR]: 'Ошибка',
            [NOTIFICATION_TYPES.WARNING]: 'Внимание',
            [NOTIFICATION_TYPES.INFO]: 'Информация'
        };
        return titles[type] || titles[NOTIFICATION_TYPES.INFO];
    }
    
    remove(id) {
        const index = this.queue.findIndex(item => item.id === id);
        if (index === -1) return;
        
        const { element, timeout } = this.queue[index];
        
        // Очищаем таймер
        clearTimeout(timeout);
        
        // Анимация исчезновения
        element.classList.add('hiding');
        
        // Удаляем из DOM после анимации
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
        
        // Удаляем из очереди
        this.queue.splice(index, 1);
    }
    
    removeAll() {
        this.queue.forEach(item => {
            clearTimeout(item.timeout);
            if (item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        });
        this.queue = [];
    }
    
    showSuccess(message, duration = 3000) {
        return this.show(message, NOTIFICATION_TYPES.SUCCESS, duration);
    }
    
    showError(message, duration = 5000) {
        return this.show(message, NOTIFICATION_TYPES.ERROR, duration);
    }
    
    showWarning(message, duration = 4000) {
        return this.show(message, NOTIFICATION_TYPES.WARNING, duration);
    }
    
    showInfo(message, duration = 3000) {
        return this.show(message, NOTIFICATION_TYPES.INFO, duration);
    }
    
    showLoading(message = 'Загрузка...') {
        const id = ++this.notificationId;
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.dataset.notificationId = id;
        
        notification.innerHTML = `
            <div class="notification-icon">
                <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
            </div>
            <div class="notification-content">
                <div class="notification-title">Загрузка</div>
                <div class="notification-message">${escapeHtml(message)}</div>
            </div>
        `;
        
        this.container.appendChild(notification);
        
        this.queue.push({
            id,
            element: notification,
            timeout: null
        });
        
        return id;
    }
    
    updateLoading(id, message) {
        const item = this.queue.find(item => item.id === id);
        if (!item) return;
        
        const messageEl = item.element.querySelector('.notification-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
    
    hideLoading(id) {
        this.remove(id);
    }
}

// Создаем глобальный экземпляр
const notificationManager = new NotificationManager();

// Функции для обратной совместимости
function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 5000) {
    return notificationManager.show(message, type, duration);
}

function showSuccessNotification(message, duration = 3000) {
    return notificationManager.showSuccess(message, duration);
}

function showErrorNotification(message, duration = 5000) {
    return notificationManager.showError(message, duration);
}

function showWarningNotification(message, duration = 4000) {
    return notificationManager.showWarning(message, duration);
}

function showInfoNotification(message, duration = 3000) {
    return notificationManager.showInfo(message, duration);
}
