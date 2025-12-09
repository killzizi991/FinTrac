// assets/js/pwa/offline-handler.js
class OfflineHandler {
    constructor() {
        this.online = navigator.onLine;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateOnlineStatus();
        this.setupStorageListener();
    }
    
    setupEventListeners() {
        // Слушаем события онлайн/офлайн
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Слушаем события видимости страницы
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Слушаем события перед закрытием страницы
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        
        // Периодическая проверка соединения
        setInterval(() => this.checkConnection(), 30000); // Каждые 30 секунд
    }
    
    setupStorageListener() {
        // Слушаем изменения в localStorage для отслеживания синхронизации
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
        
        // Слушаем наши собственные события изменения данных
        document.addEventListener('operation-added', () => this.syncData());
        document.addEventListener('operation-updated', () => this.syncData());
        document.addEventListener('operation-deleted', () => this.syncData());
        document.addEventListener('settings-changed', () => this.syncData());
    }
    
    handleOnline() {
        this.online = true;
        this.updateOnlineStatus();
        
        showNotification('Соединение восстановлено', NOTIFICATION_TYPES.SUCCESS);
        
        // Пытаемся синхронизировать данные при восстановлении соединения
        this.syncData();
        
        // Отправляем сообщение в Service Worker о восстановлении соединения
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'NETWORK_STATUS',
                status: 'online'
            });
        }
    }
    
    handleOffline() {
        this.online = false;
        this.updateOnlineStatus();
        
        showNotification('Вы в офлайн режиме. Данные будут сохранены локально.', NOTIFICATION_TYPES.WARNING);
        
        // Отправляем сообщение в Service Worker об отключении сети
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'NETWORK_STATUS',
                status: 'offline'
            });
        }
    }
    
    handleVisibilityChange() {
        if (!document.hidden && this.online) {
            // Страница стала видимой и мы онлайн - проверяем обновления
            this.checkForUpdates();
        }
    }
    
    handleBeforeUnload(event) {
        // Проверяем, есть ли несохраненные изменения
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
        }
    }
    
    handleStorageChange(event) {
        // Если изменения в данных приложения, синхронизируем
        if (event.key === STORAGE_KEY) {
            this.syncData();
        }
    }
    
    updateOnlineStatus() {
        const statusElement = document.getElementById('offline-status');
        const storageStatusElement = document.getElementById('storage-status');
        
        if (statusElement) {
            if (this.online) {
                statusElement.textContent = '🟢 Онлайн';
                statusElement.title = 'Вы в сети';
                statusElement.style.color = '';
            } else {
                statusElement.textContent = '🔴 Офлайн';
                statusElement.title = 'Вы в офлайн режиме';
                statusElement.style.color = COLORS.danger;
            }
        }
        
        if (storageStatusElement) {
            if (this.online) {
                storageStatusElement.textContent = '🟢 Данные синхронизированы';
                storageStatusElement.title = 'Данные синхронизированы с облаком';
            } else {
                storageStatusElement.textContent = '🟡 Данные локальные';
                storageStatusElement.title = 'Данные сохранены локально, синхронизация при восстановлении связи';
            }
        }
        
        // Обновляем состояние в заголовке
        document.title = this.online ? 
            'Финансовый календарь' : 
            '⚫ Финансовый календарь (офлайн)';
    }
    
    checkConnection() {
        const wasOnline = this.online;
        this.online = navigator.onLine;
        
        if (wasOnline !== this.online) {
            this.updateOnlineStatus();
            
            if (this.online) {
                showNotification('Соединение восстановлено', NOTIFICATION_TYPES.SUCCESS);
                this.syncData();
            } else {
                showNotification('Соединение потеряно', NOTIFICATION_TYPES.WARNING);
            }
        }
    }
    
    async checkForUpdates() {
        if (!this.online) return;
        
        try {
            // Проверяем обновления Service Worker
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
            }
            
            // Проверяем обновления данных (если бы было облако)
            this.checkDataUpdates();
        } catch (error) {
            console.error('Ошибка при проверке обновлений:', error);
        }
    }
    
    checkDataUpdates() {
        // В MVP просто проверяем, есть ли данные для синхронизации
        // В пол
