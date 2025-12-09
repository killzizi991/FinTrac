// assets/js/pwa/sw-register.js
class ServiceWorkerRegister {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator;
        this.registration = null;
        this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.log('Service Worker не поддерживается в этом браузере');
            return;
        }
        
        try {
            this.registration = await navigator.serviceWorker.register('./service-worker.js', {
                scope: './'
            });
            
            console.log('Service Worker зарегистрирован:', this.registration);
            
            this.setupEventListeners();
            this.checkForUpdates();
            
            // Показываем кнопку установки, если приложение можно установить
            this.setupInstallPrompt();
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
        }
    }
    
    setupEventListeners() {
        if (!this.registration) return;
        
        // Слушаем обновления Service Worker
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Новый Service Worker установлен, но пока не активирован
                    this.showUpdateNotification();
                }
            });
        });
        
        // Слушаем сообщения от Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
        });
        
        // Периодическая проверка обновлений
        setInterval(() => this.checkForUpdates(), 60 * 60 * 1000); // Каждый час
    }
    
    async checkForUpdates() {
        if (!this.registration) return;
        
        try {
            await this.registration.update();
            console.log('Проверка обновлений Service Worker выполнена');
        } catch (error) {
            console.error('Ошибка при проверке обновлений:', error);
        }
    }
    
    showUpdateNotification() {
        if (!window.showUpdateNotification) {
            window.showUpdateNotification = true;
            
            console.log('Доступна новая версия приложения. Обновить?');
        }
    }
    
    async updateServiceWorker() {
        if (!this.registration || !this.registration.waiting) {
            console.log('Нет обновлений для установки');
            return;
        }
        
        try {
            // Сообщаем Service Worker о необходимости активации
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Перезагружаем страницу после активации
            window.location.reload();
        } catch (error) {
            console.error('Ошибка при обновлении Service Worker:', error);
        }
    }
    
    handleServiceWorkerMessage(message) {
        switch (message.type) {
            case 'CACHE_UPDATED':
                console.log('Кэш обновлен:', message.detail);
                break;
                
            case 'OFFLINE_DETECTED':
                console.log('Вы в офлайн режиме. Данные будут сохранены локально.');
                break;
                
            case 'SYNC_REGISTERED':
                console.log('Фоновая синхронизация зарегистрирована');
                break;
                
            default:
                console.log('Сообщение от Service Worker:', message);
        }
    }
    
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            // Предотвращаем автоматический показ подсказки
            e.preventDefault();
            
            // Сохраняем событие для использования позже
            deferredPrompt = e;
            
            // Показываем кнопку установки
            headerControls.showInstallButton();
            
            // Обновляем deferredPrompt в глобальной области видимости
            window.deferredPrompt = deferredPrompt;
        });
        
        window.addEventListener('appinstalled', () => {
            // Приложение установлено
            console.log('Приложение установлено');
            headerControls.hideInstallButton();
            window.deferredPrompt = null;
        });
    }
    
    async unregister() {
        if (!this.registration) return;
        
        try {
            const unregistered = await this.registration.unregister();
            if (unregistered) {
                console.log('Service Worker удален');
            }
        } catch (error) {
            console.error('Ошибка при удалении Service Worker:', error);
        }
    }
    
    getRegistration() {
        return this.registration;
    }
    
    isUpdateAvailable() {
        return this.registration && this.registration.waiting;
    }
}

// Создаем глобальный экземпляр
const serviceWorkerRegister = new ServiceWorkerRegister();
