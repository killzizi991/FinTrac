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
        // В полной версии здесь могла бы быть проверка обновлений с сервера
        this.syncData();
    }
    
    async syncData() {
        if (!this.online) {
            // Сохраняем флаг, что есть данные для синхронизации
            localStorage.setItem('pending_sync', 'true');
            return;
        }
        
        try {
            // В MVP синхронизация только с localStorage
            // В полной версии здесь была бы отправка данных на сервер
            
            // Очищаем флаг ожидающей синхронизации
            localStorage.removeItem('pending_sync');
            
            // Обновляем статус
            this.updateOnlineStatus();
            
            // Отправляем сообщение в Service Worker о успешной синхронизации
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SYNC_COMPLETE',
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            
            // Сохраняем данные для повторной попытки
            localStorage.setItem('pending_sync', 'true');
            
            showNotification('Ошибка синхронизации данных', NOTIFICATION_TYPES.ERROR);
        }
    }
    
    hasUnsavedChanges() {
        // В MVP все сохраняется мгновенно, поэтому всегда false
        // В более сложной версии здесь могла бы быть проверка изменений в формах
        return false;
    }
    
    saveDataLocally(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            
            // Если закончилось место, пытаемся очистить старые данные
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded();
                return this.saveDataLocally(data); // Повторяем попытку
            }
            
            return false;
        }
    }
    
    handleStorageQuotaExceeded() {
        showNotification('Закончилось место в хранилище. Очищаем старые данные...', NOTIFICATION_TYPES.WARNING);
        
        // Удаляем старые операции (старше 6 месяцев)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const data = getAppData();
        const oldOperations = data.operations.filter(op => {
            const opDate = parseDate(op.date);
            return opDate < sixMonthsAgo;
        });
        
        if (oldOperations.length > 0) {
            data.operations = data.operations.filter(op => {
                const opDate = parseDate(op.date);
                return opDate >= sixMonthsAgo;
            });
            
            updateAppData(data);
            
            showNotification(
                `Удалено ${oldOperations.length} старых операций для освобождения места`,
                NOTIFICATION_TYPES.INFO
            );
        } else {
            // Если старых данных нет, очищаем все
            showNotification('Не удалось освободить место. Попробуйте экспортировать и очистить данные.', NOTIFICATION_TYPES.ERROR);
        }
    }
    
    backupData() {
        try {
            const data = dataManager.exportData();
            const backup = {
                data,
                timestamp: Date.now(),
                version: APP_VERSION
            };
            
            // Сохраняем резервную копию в localStorage
            const backups = JSON.parse(localStorage.getItem('backups') || '[]');
            backups.push(backup);
            
            // Храним только последние 5 резервных копий
            if (backups.length > 5) {
                backups.shift();
            }
            
            localStorage.setItem('backups', JSON.stringify(backups));
            
            return backup;
        } catch (error) {
            console.error('Ошибка создания резервной копии:', error);
            return null;
        }
    }
    
    restoreFromBackup(backupId = null) {
        try {
            const backups = JSON.parse(localStorage.getItem('backups') || '[]');
            let backup;
            
            if (backupId) {
                backup = backups.find(b => b.timestamp === backupId);
            } else {
                // Берем последнюю резервную копию
                backup = backups[backups.length - 1];
            }
            
            if (!backup) {
                showNotification('Резервная копия не найдена', NOTIFICATION_TYPES.ERROR);
                return false;
            }
            
            // Восстанавливаем данные
            dataManager.importData(backup.data, true);
            
            showNotification(
                `Данные восстановлены из резервной копии от ${new Date(backup.timestamp).toLocaleString()}`,
                NOTIFICATION_TYPES.SUCCESS
            );
            
            return true;
        } catch (error) {
            console.error('Ошибка восстановления из резервной копии:', error);
            showNotification('Ошибка при восстановлении данных', NOTIFICATION_TYPES.ERROR);
            return false;
        }
    }
    
    getBackupList() {
        try {
            const backups = JSON.parse(localStorage.getItem('backups') || '[]');
            return backups.map(backup => ({
                id: backup.timestamp,
                date: new Date(backup.timestamp),
                version: backup.version,
                size: JSON.stringify(backup.data).length
            }));
        } catch (error) {
            console.error('Ошибка получения списка резервных копий:', error);
            return [];
        }
    }
    
    cleanupOldBackups(maxAgeDays = 30) {
        try {
            const cutoffDate = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
            const backups = JSON.parse(localStorage.getItem('backups') || '[]');
            
            const oldBackups = backups.filter(backup => backup.timestamp < cutoffDate);
            const newBackups = backups.filter(backup => backup.timestamp >= cutoffDate);
            
            if (oldBackups.length > 0) {
                localStorage.setItem('backups', JSON.stringify(newBackups));
                return oldBackups.length;
            }
            
            return 0;
        } catch (error) {
            console.error('Ошибка очистки старых резервных копий:', error);
            return 0;
        }
    }
    
    // Работа с Service Worker
    async sendMessageToSW(message) {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
            return false;
        }
        
        try {
            navigator.serviceWorker.controller.postMessage(message);
            return true;
        } catch (error) {
            console.error('Ошибка отправки сообщения в Service Worker:', error);
            return false;
        }
    }
    
    // Проверка поддержки PWA функций
    checkPwaSupport() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            syncManager: 'SyncManager' in window,
            periodicSync: 'periodicSync' in window,
            storageManager: 'storage' in navigator,
            indexedDB: 'indexedDB' in window,
            backgroundSync: 'BackgroundSyncManager' in window
        };
    }
    
    // Очистка кэша
    async clearCache() {
        try {
            if (navigator.serviceWorker) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                    
                    // Перезагружаем Service Worker
                    await registration.unregister();
                    
                    showNotification('Кэш очищен', NOTIFICATION_TYPES.SUCCESS);
                    setTimeout(() => location.reload(), 1000);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Ошибка очистки кэша:', error);
            showNotification('Ошибка очистки кэша', NOTIFICATION_TYPES.ERROR);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
const offlineHandler = new OfflineHandler();
