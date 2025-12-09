// assets/js/modules/export-import.js
class ExportImportManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Обработчики настроены в modal-manager.js
        // Здесь добавим дополнительную инициализацию
        document.addEventListener('DOMContentLoaded', () => {
            const exportDownloadBtn = document.getElementById('export-download-btn');
            const exportCopyBtn = document.getElementById('export-copy-btn');
            const importFileInput = document.getElementById('import-file');
            const importPasteBtn = document.getElementById('import-paste-btn');
            const importExecuteBtn = document.getElementById('import-execute-btn');
            const importJsonText = document.getElementById('import-json-text');
            const exportJsonText = document.getElementById('export-json-text');
            
            if (exportDownloadBtn) {
                exportDownloadBtn.addEventListener('click', () => this.exportData());
            }
            
            if (exportCopyBtn) {
                exportCopyBtn.addEventListener('click', () => this.copyDataToClipboard());
            }
            
            if (importFileInput) {
                importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
            }
            
            if (importPasteBtn) {
                importPasteBtn.addEventListener('click', () => this.pasteDataFromClipboard());
            }
            
            if (importExecuteBtn) {
                importExecuteBtn.addEventListener('click', () => this.executeImport());
            }
            
            if (importJsonText) {
                importJsonText.addEventListener('input', () => {
                    const isValid = this.validateImportData(importJsonText.value);
                    importExecuteBtn.disabled = !isValid;
                });
            }
            
            if (exportJsonText) {
                // При открытии модального окна обновляем данные экспорта
                const exportModal = document.getElementById('export-import-modal');
                if (exportModal) {
                    exportModal.addEventListener('modal-open', () => {
                        this.updateExportPreview();
                    });
                }
            }
        });
    }
    
    exportData() {
        try {
            const data = dataManager.exportData();
            const jsonString = JSON.stringify(data, null, 2);
            const filename = `financial-calendar-backup-${formatDate(new Date()).replace(/\./g, '-')}.json`;
            
            downloadFile(filename, jsonString);
            
            console.log('Данные успешно экспортированы');
        } catch (error) {
            console.error('Ошибка экспорта:', error);
        }
    }
    
    copyDataToClipboard() {
        try {
            const data = dataManager.exportData();
            const jsonString = JSON.stringify(data, null, 2);
            
            copyToClipboard(jsonString).then(() => {
                console.log('Данные скопированы в буфер обмена');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
            });
        } catch (error) {
            console.error('Ошибка подготовки данных:', error);
        }
    }
    
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            console.log('Пожалуйста, выберите JSON файл');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                if (this.validateImportData(content)) {
                    document.getElementById('import-json-text').value = content;
                    document.getElementById('import-execute-btn').disabled = false;
                } else {
                    console.log('Неверный формат JSON файла');
                }
            } catch (error) {
                console.error('Ошибка чтения файла:', error);
            }
        };
        
        reader.onerror = () => {
            console.log('Ошибка при чтении файла');
        };
        
        reader.readAsText(file);
        
        // Сбрасываем значение input, чтобы можно было загрузить тот же файл снова
        event.target.value = '';
    }
    
    async pasteDataFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const importTextArea = document.getElementById('import-json-text');
            
            if (importTextArea) {
                importTextArea.value = text;
                
                if (this.validateImportData(text)) {
                    document.getElementById('import-execute-btn').disabled = false;
                    console.log('Данные вставлены из буфера обмена');
                } else {
                    console.log('Неверный формат JSON в буфере обмена');
                }
            }
        } catch (error) {
            console.error('Ошибка чтения из буфера обмена:', error);
        }
    }
    
    validateImportData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Проверяем необходимые поля
            if (!data.settings || !data.operations) {
                return false;
            }
            
            // Проверяем структуру settings
            if (typeof data.settings !== 'object') {
                return false;
            }
            
            // Проверяем структуру operations
            if (!Array.isArray(data.operations)) {
                return false;
            }
            
            // Проверяем несколько операций на валидность
            for (const op of data.operations.slice(0, 5)) {
                const validation = validateOperation(op);
                if (!validation.valid) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async executeImport() {
        const importTextArea = document.getElementById('import-json-text');
        const jsonString = importTextArea.value.trim();
        
        if (!this.validateImportData(jsonString)) {
            console.log('Неверный формат JSON данных');
            return;
        }
        
        const confirmed = await modalManager.showConfirm(
            'Внимание! Импорт данных полностью заменит текущие данные. Это действие нельзя отменить. Продолжить?',
            'Подтверждение импорта'
        );
        
        if (!confirmed) return;
        
        try {
            const data = JSON.parse(jsonString);
            const success = dataManager.importData(data, true);
            
            if (success) {
                console.log('Данные успешно импортированы');
                importTextArea.value = '';
                
                // Закрываем модальное окно
                modalManager.close(MODAL_TYPES.EXPORT_IMPORT);
                
                // Обновляем приложение
                generateCalendar();
                updateMonthSummary();
            } else {
                console.log('Ошибка при импорте данных');
            }
        } catch (error) {
            console.error('Ошибка импорта:', error);
        }
    }
    
    updateExportPreview() {
        const exportTextArea = document.getElementById('export-json-text');
        if (exportTextArea) {
            try {
                const data = dataManager.exportData();
                exportTextArea.value = JSON.stringify(data, null, 2);
            } catch (error) {
                console.error('Ошибка обновления предпросмотра:', error);
                exportTextArea.value = 'Ошибка загрузки данных';
            }
        }
    }
    
    exportToCSV() {
        const operations = dataManager.getAllOperations();
        
        if (operations.length === 0) {
            console.log('Нет данных для экспорта');
            return;
        }
        
        const csvContent = operationsManager.exportToCSV(operations);
        const filename = `financial-calendar-${formatDate(new Date()).replace(/\./g, '-')}.csv`;
        
        downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
        
        console.log('Данные экспортированы в CSV');
    }
    
    exportReportToPDF() {
        // Эта функция требует дополнительных библиотек для генерации PDF
        // В MVP можно сделать простой экспорт в HTML для печати
        this.exportReportToPrintableHTML();
    }
    
    exportReportToPrintableHTML() {
        const report = reportsManager.generateMonthlyReport(CURRENT_YEAR, CURRENT_MONTH);
        const htmlContent = reportsManager.generateReportHTML(report);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Отчет за ${getMonthName(CURRENT_MONTH)} ${CURRENT_YEAR}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-html { max-width: 800px; margin: 0 auto; }
                    h2 { color: #333; border-bottom: 2px solid #4a6cf7; padding-bottom: 10px; }
                    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                    .summary-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .summary-label { display: block; color: #666; font-size: 14px; }
                    .summary-value { font-size: 24px; font-weight: bold; display: block; margin-top: 5px; }
                    .income { color: #28a745; }
                    .expense { color: #dc3545; }
                    .comparison { font-size: 12px; margin-top: 5px; display: block; }
                    .positive { color: #28a745; }
                    .negative { color: #dc3545; }
                    .categories-list { margin: 20px 0; }
                    .category-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
                    .top-3 { background-color: #fff8e1; }
                    .category-name { font-weight: bold; }
                    .category-amount { font-weight: bold; }
                    .categories-detail { margin: 20px 0; }
                    .category-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
                    .report-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; text-align: center; }
                    @media print {
                        body { margin: 0; }
                        .summary-grid { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    createBackupSchedule(interval = 'daily') {
        // Эта функция может использоваться для автоматического создания резервных копий
        // В MVP просто сохраняем текущую дату последнего бекапа
        const now = new Date();
        localStorage.setItem('last_backup', now.toISOString());
        
        console.log('Расписание резервного копирования обновлено');
    }
    
    getBackupInfo() {
        const lastBackup = localStorage.getItem('last_backup');
        const dataSize = JSON.stringify(dataManager.exportData()).length;
        
        return {
            lastBackup: lastBackup ? new Date(lastBackup) : null,
            dataSize,
            operationsCount: dataManager.getAllOperations().length,
            categoriesCount: {
                income: dataManager.getCategories().income?.length || 0,
                expense: dataManager.getCategories().expense?.length || 0
            }
        };
    }
}

// Создаем глобальный экземпляр
const exportImportManager = new ExportImportManager();

// Функция для инициализации экспорта/импорта
function initExportImport() {
    exportImportManager.updateExportPreview();
}
