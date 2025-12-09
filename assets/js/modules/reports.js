// assets/js/modules/reports.js
class ReportsManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Инициализация обработчиков для модального окна отчетов
        this.setupReportModal();
    }
    
    setupReportModal() {
        // Обработчики уже настроены в modal-manager.js
        // Здесь можно добавить дополнительную инициализацию
    }
    
    generateMonthlyReport(year, month) {
        const stats = dataManager.getMonthStatistics(year, month);
        const prevStats = this.getPreviousMonthStatistics(year, month);
        
        return {
            period: {
                year,
                month,
                monthName: getMonthName(month)
            },
            totals: {
                income: stats.totalIncome,
                expense: stats.totalExpense,
                balance: stats.balance
            },
            categoryTotals: stats.categoryTotals,
            operationsCount: stats.operationsCount,
            comparison: this.calculateComparison(stats, prevStats),
            topExpenseCategories: this.getTopCategories(stats.categoryTotals.expense, 3)
        };
    }
    
    getPreviousMonthStatistics(year, month) {
        let prevYear = year;
        let prevMonth = month - 1;
        
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        
        return dataManager.getMonthStatistics(prevYear, prevMonth);
    }
    
    calculateComparison(current, previous) {
        return {
            income: {
                change: current.totalIncome - previous.totalIncome,
                percentage: calculatePercentageChange(previous.totalIncome, current.totalIncome)
            },
            expense: {
                change: current.totalExpense - previous.totalExpense,
                percentage: calculatePercentageChange(previous.totalExpense, current.totalExpense)
            },
            balance: {
                change: current.balance - previous.balance,
                percentage: calculatePercentageChange(previous.balance, current.balance)
            }
        };
    }
    
    getTopCategories(categoryTotals, limit = 3) {
        if (!categoryTotals) return [];
        
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }
    
    generateCategoryReport(type, year, month) {
        const stats = dataManager.getMonthStatistics(year, month);
        const categoryTotals = stats.categoryTotals[type] || {};
        
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: stats[type === 'income' ? 'totalIncome' : 'totalExpense'] > 0 
                    ? (amount / stats[type === 'income' ? 'totalIncome' : 'totalExpense']) * 100 
                    : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }
    
    generateYearlyReport(year) {
        const stats = dataManager.getYearStatistics(year);
        const prevYearStats = dataManager.getYearStatistics(year - 1);
        
        const monthlyBreakdown = stats.monthTotals.map((month, index) => ({
            month: index,
            monthName: getMonthNameShort(index),
            income: month.income,
            expense: month.expense,
            balance: month.balance
        }));
        
        return {
            year,
            totals: {
                income: stats.totalIncome,
                expense: stats.totalExpense,
                balance: stats.balance
            },
            monthlyBreakdown,
            comparison: {
                income: calculatePercentageChange(prevYearStats.totalIncome, stats.totalIncome),
                expense: calculatePercentageChange(prevYearStats.totalExpense, stats.totalExpense),
                balance: calculatePercentageChange(prevYearStats.balance, stats.balance)
            },
            averageMonthly: {
                income: stats.totalIncome / 12,
                expense: stats.totalExpense / 12,
                balance: stats.balance / 12
            }
        };
    }
    
    generateTrendReport(startDate, endDate, interval = 'month') {
        const operations = dataManager.getAllOperations();
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        
        if (!start || !end || start > end) {
            throw new Error('Неверный диапазон дат');
        }
        
        const periods = this.splitDateRange(start, end, interval);
        const report = periods.map(period => {
            const periodOps = operations.filter(op => {
                const opDate = parseDate(op.date);
                return opDate >= period.start && opDate <= period.end;
            });
            
            const totals = periodOps.reduce((acc, op) => {
                if (op.type === OPERATION_TYPES.INCOME) {
                    acc.income += op.amount;
                } else {
                    acc.expense += op.amount;
                }
                return acc;
            }, { income: 0, expense: 0 });
            
            totals.balance = totals.income - totals.expense;
            
            return {
                period: period.label,
                start: formatDate(period.start),
                end: formatDate(period.end),
                ...totals,
                operationsCount: periodOps.length
            };
        });
        
        return report;
    }
    
    splitDateRange(start, end, interval) {
        const periods = [];
        let current = new Date(start);
        
        while (current <= end) {
            const periodStart = new Date(current);
            let periodEnd;
            
            switch (interval) {
                case 'day':
                    periodEnd = new Date(current);
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    periodEnd = new Date(current);
                    periodEnd.setDate(periodEnd.getDate() + 6);
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'year':
                    periodEnd = new Date(current.getFullYear(), 11, 31);
                    current.setFullYear(current.getFullYear() + 1);
                    break;
                default:
                    throw new Error('Неверный интервал');
            }
            
            if (periodEnd > end) periodEnd = new Date(end);
            
            periods.push({
                start: new Date(periodStart),
                end: periodEnd,
                label: this.getPeriodLabel(periodStart, periodEnd, interval)
            });
        }
        
        return periods;
    }
    
    getPeriodLabel(start, end, interval) {
        switch (interval) {
            case 'day':
                return formatDate(start);
            case 'week':
                return `Неделя ${formatDate(start)} - ${formatDate(end)}`;
            case 'month':
                return `${getMonthName(start.getMonth())} ${start.getFullYear()}`;
            case 'year':
                return start.getFullYear().toString();
            default:
                return formatDate(start);
        }
    }
    
    generateTopExpensesReport(limit = 10) {
        const operations = dataManager.getAllOperations()
            .filter(op => op.type === OPERATION_TYPES.EXPENSE)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
        
        return operations.map(op => ({
            date: op.date,
            category: op.category,
            amount: op.amount,
            description: op.description
        }));
    }
    
    generateIncomeSourcesReport() {
        const operations = dataManager.getAllOperations()
            .filter(op => op.type === OPERATION_TYPES.INCOME);
        
        const sources = operations.reduce((acc, op) => {
            if (!acc[op.category]) {
                acc[op.category] = {
                    category: op.category,
                    total: 0,
                    count: 0,
                    average: 0
                };
            }
            
            acc[op.category].total += op.amount;
            acc[op.category].count++;
            
            return acc;
        }, {});
        
        Object.values(sources).forEach(source => {
            source.average = source.total / source.count;
        });
        
        return Object.values(sources).sort((a, b) => b.total - a.total);
    }
    
    generateSavingsReport() {
        const operations = dataManager.getAllOperations();
        let totalIncome = 0;
        let totalExpense = 0;
        
        operations.forEach(op => {
            if (op.type === OPERATION_TYPES.INCOME) {
                totalIncome += op.amount;
            } else {
                totalExpense += op.amount;
            }
        });
        
        const savings = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
        
        return {
            totalIncome,
            totalExpense,
            savings,
            savingsRate,
            recommendation: this.getSavingsRecommendation(savingsRate)
        };
    }
    
    getSavingsRecommendation(savingsRate) {
        if (savingsRate >= 20) {
            return 'Отличная норма сбережений! Продолжайте в том же духе.';
        } else if (savingsRate >= 10) {
            return 'Хорошая норма сбережений. Можно попробовать увеличить до 20%.';
        } else if (savingsRate > 0) {
            return 'Норма сбережений низкая. Рекомендуется увеличить до 10-20%.';
        } else {
            return 'Тратите больше, чем зарабатываете. Рекомендуется пересмотреть расходы.';
        }
    }
    
    generateReportHTML(reportData) {
        const { period, totals, categoryTotals, comparison, topExpenseCategories } = reportData;
        
        return `
            <div class="report-html">
                <h2>Отчет за ${period.monthName} ${period.year}</h2>
                
                <div class="report-summary">
                    <h3>Сводка</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Доходы:</span>
                            <span class="summary-value income">${formatCurrency(totals.income)}</span>
                            ${comparison.income.change !== 0 ? `
                                <span class="comparison ${comparison.income.change > 0 ? 'positive' : 'negative'}">
                                    ${comparison.income.change > 0 ? '↑' : '↓'} 
                                    ${formatCurrency(Math.abs(comparison.income.change))} 
                                    (${comparison.income.percentage.toFixed(1)}%)
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="summary-item">
                            <span class="summary-label">Расходы:</span>
                            <span class="summary-value expense">${formatCurrency(totals.expense)}</span>
                            ${comparison.expense.change !== 0 ? `
                                <span class="comparison ${comparison.expense.change > 0 ? 'negative' : 'positive'}">
                                    ${comparison.expense.change > 0 ? '↑' : '↓'} 
                                    ${formatCurrency(Math.abs(comparison.expense.change))} 
                                    (${comparison.expense.percentage.toFixed(1)}%)
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="summary-item">
                            <span class="summary-label">Баланс:</span>
                            <span class="summary-value ${totals.balance >= 0 ? 'income' : 'expense'}">
                                ${formatCurrency(totals.balance)}
                            </span>
                            ${comparison.balance.change !== 0 ? `
                                <span class="comparison ${comparison.balance.change > 0 ? 'positive' : 'negative'}">
                                    ${comparison.balance.change > 0 ? '↑' : '↓'} 
                                    ${formatCurrency(Math.abs(comparison.balance.change))} 
                                    (${comparison.balance.percentage.toFixed(1)}%)
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="report-categories">
                    <h3>Категории расходов (топ-3)</h3>
                    <div class="categories-list">
                        ${topExpenseCategories.map((cat, index) => `
                            <div class="category-item ${index < 3 ? 'top-3' : ''}">
                                <span class="category-name">${cat.category}</span>
                                <span class="category-amount">${formatCurrency(cat.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="report-details">
                    <h3>Детализация по категориям</h3>
                    
                    <div class="categories-detail">
                        <h4>Доходы</h4>
                        ${Object.entries(categoryTotals.income || {}).map(([category, amount]) => `
                            <div class="category-row">
                                <span>${category}</span>
                                <span class="income">${formatCurrency(amount)}</span>
                            </div>
                        `).join('') || '<p>Нет данных</p>'}
                        
                        <h4>Расходы</h4>
                        ${Object.entries(categoryTotals.expense || {}).map(([category, amount]) => `
                            <div class="category-row">
                                <span>${category}</span>
                                <span class="expense">${formatCurrency(amount)}</span>
                            </div>
                        `).join('') || '<p>Нет данных</p>'}
                    </div>
                </div>
                
                <div class="report-footer">
                    <p>Сгенерировано ${formatDate(new Date())}</p>
                </div>
            </div>
        `;
    }
}

// Создаем глобальный экземпляр
const reportsManager = new ReportsManager();

// Функция для обновления отчета в модальном окне
function updateReports() {
    const report = reportsManager.generateMonthlyReport(CURRENT_YEAR, CURRENT_MONTH);
    
    // Обновляем сводку
    document.getElementById('report-total-income').textContent = formatCurrency(report.totals.income);
    document.getElementById('report-total-expense').textContent = formatCurrency(report.totals.expense);
    document.getElementById('report-balance').textContent = formatCurrency(report.totals.balance);
    
    // Обновляем сравнение
    const comparisonEl = document.getElementById('comparison-details');
    if (comparisonEl) {
        comparisonEl.innerHTML = `
            <div class="comparison-item">
                <span>Доходы:</span>
                <span class="${report.comparison.income.change >= 0 ? 'positive' : 'negative'}">
                    ${report.comparison.income.change >= 0 ? '↑' : '↓'} 
                    ${formatCurrency(Math.abs(report.comparison.income.change))} 
                    (${report.comparison.income.percentage.toFixed(1)}%)
                </span>
            </div>
            <div class="comparison-item">
                <span>Расходы:</span>
                <span class="${report.comparison.expense.change <= 0 ? 'positive' : 'negative'}">
                    ${report.comparison.expense.change >= 0 ? '↑' : '↓'} 
                    ${formatCurrency(Math.abs(report.comparison.expense.change))} 
                    (${report.comparison.expense.percentage.toFixed(1)}%)
                </span>
            </div>
            <div class="comparison-item">
                <span>Баланс:</span>
                <span class="${report.comparison.balance.change >= 0 ? 'positive' : 'negative'}">
                    ${report.comparison.balance.change >= 0 ? '↑' : '↓'} 
                    ${formatCurrency(Math.abs(report.comparison.balance.change))} 
                    (${report.comparison.balance.percentage.toFixed(1)}%)
                </span>
            </div>
        `;
    }
    
    // Обновляем категории доходов
    const incomeCategoriesEl = document.getElementById('income-categories-report');
    if (incomeCategoriesEl) {
        const incomeReport = reportsManager.generateCategoryReport('income', CURRENT_YEAR, CURRENT_MONTH);
        incomeCategoriesEl.innerHTML = incomeReport.map(item => `
            <div class="category-report-item">
                <span>${item.category}</span>
                <span class="income">${formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)</span>
            </div>
        `).join('') || '<p>Нет данных о доходах</p>';
    }
    
    // Обновляем категории расходов
    const expenseCategoriesEl = document.getElementById('expense-categories-report');
    if (expenseCategoriesEl) {
        const expenseReport = reportsManager.generateCategoryReport('expense', CURRENT_YEAR, CURRENT_MONTH);
        const topCategories = reportsManager.getTopCategories(report.categoryTotals.expense, 3);
        
        expenseCategoriesEl.innerHTML = expenseReport.map(item => {
            const isTop3 = topCategories.some(top => top.category === item.category);
            return `
                <div class="category-report-item ${isTop3 ? 'top-3' : ''}">
                    <span>${item.category}</span>
                    <span class="expense">${formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)</span>
                </div>
            `;
        }).join('') || '<p>Нет данных о расходах</p>';
    }
}
