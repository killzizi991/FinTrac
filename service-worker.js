// service-worker.js
const CACHE_NAME = 'financial-calendar-v1.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './404.html',
    './manifest.json',
    
    // CSS файлы
    './assets/css/main.css',
    './assets/css/calendar.css',
    './assets/css/modals.css',
    './assets/css/themes.css',
    './assets/css/ui-components.css',
    
    // JS файлы
    './assets/js/core/constants.js',
    './assets/js/core/utils.js',
    './assets/js/core/state.js',
    './assets/js/ui/modal-manager.js',
    './assets/js/ui/theme-switcher.js',
    './assets/js/ui/notifications.js',
    './assets/js/ui/header-controls.js',
    './assets/js/modules/data-manager.js',
    './assets/js/modules/calendar.js',
    './assets/js/modules/operations.js',
    './assets/js/modules/categories.js',
    './assets/js/modules/reports.js',
    './assets/js/modules/export-import.js',
    './assets/js/pwa/sw-register.js',
    './assets/js/pwa/offline-handler.js',
    './assets/js/core/app.js',
    
    // Иконки
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-96x96.png',
    './assets/icons/icon-128x128.png',
    './assets/icons/icon-144x144.png',
    './assets/icons/icon-152x152.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-384x384.png',
    './assets/icons/icon-512x512.png',
    './assets/icons/apple-touch-icon.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Кэширование файлов');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker: Все файлы закэшированы');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Ошибка при кэшировании:', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Активирован');
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    // Игнорируем запросы к API и внешние ресурсы
    if (event.request.url.includes('/api/') || 
        event.request.url.startsWith('http') && !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем закэшированную версию, если есть
                if (response) {
                    return response;
                }
                
                // Иначе загружаем из сети
                return fetch(event.request)
                    .then((response) => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонируем ответ для кэширования
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Если нет сети и нет в кэше, показываем offline страницу
                        if (event.request.mode === 'navigate') {
                            return caches.match('./404.html');
                        }
                        
                        // Для других запросов возвращаем ошибку
                        return new Response('Офлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Фоновая синхронизация', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Получение сообщений от клиента
self.addEventListener('message', (event) => {
    console.log('Service Worker: Получено сообщение', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'NETWORK_STATUS':
            console.log('Сетевой статус:', event.data.status);
            break;
            
        case 'SYNC_COMPLETE':
            console.log('Синхронизация завершена:', event.data.timestamp);
            break;
            
        case 'CACHE_UPDATED':
            updateCache(event.data.detail);
            break;
    }
});

// Функция синхронизации данных
async function syncData() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_STARTED',
                timestamp: Date.now()
            });
        });
        
        // Здесь могла бы быть реальная синхронизация с сервером
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: Date.now()
            });
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
        return false;
    }
}

// Функция обновления кэша
async function updateCache(files) {
    try {
        const cache = await caches.open(CACHE_NAME);
        
        for (const file of files) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    await cache.put(file, response);
                }
            } catch (error) {
                console.error(`Не удалось обновить файл ${file}:`, error);
            }
        }
        
        // Уведомляем клиентов об обновлении кэша
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'CACHE_UPDATED',
                detail: files
            });
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка обновления кэша:', error);
        return false;
    }
}

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push уведомление', event);
    
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'Новое уведомление',
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './'
        },
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Финансовый календарь', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Клик по уведомлению', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Если есть открытое окно, фокусируем его
            for (const client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Иначе открываем новое окно
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || './');
            }
        })
    );
});
