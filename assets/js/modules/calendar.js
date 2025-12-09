// assets/js/modules/calendar.js
function generateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Получаем данные текущего месяца
    const { year, month, daysInMonth, firstDay } = getCurrentMonthData();
    const operations = getMonthOperations();
    
    // Определяем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, ...)
    // В нашем календаре неделя начинается с понедельника
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Воскресенье становится 7-м днем
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 1; i < firstDayOfWeek; i++) {
        const emptyDay = createEmptyDayElement();
        calendarGrid.appendChild(emptyDay);
    }
    
    // Создаем ячейки для каждого дня месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(year, month, day, operations);
        calendarGrid.appendChild(dayElement);
    }
    
    // Обновляем отображение текущего месяца в заголовке
    updateCalendarHeader();
    
    // Обновляем сводку за месяц
    updateMonthSummary();
}

function createEmptyDayElement() {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day calendar-day--empty';
    return dayElement;
}

function createDayElement(year, month, day, operations) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const date = new Date(year, month, day);
    const dateString = formatDate(date);
    const dayOperations = operations.filter(op => op.date === dateString);
    
    // Проверяем, сегодня ли это день
    if (isToday(date)) {
        dayElement.classList.add('calendar-day--today');
    }
    
    // Проверяем, это ли текущий день (для стилизации)
    if (day === new Date().getDate() && 
        month === new Date().getMonth() && 
        year === new Date().getFullYear()) {
        dayElement.classList.add('calendar-day--current');
    }
    
    // Добавляем номер дня
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Добавляем информацию о доходах и расходах за день
    if (dayOperations.length > 0) {
        const dayTotals = calculateDayTotals(dayOperations);
        const dayContent = createDayContent(dayTotals);
        dayElement.appendChild(dayContent);
        
        // Добавляем индикатор операций
        const operationsIndicator = createOperationsIndicator(dayOperations);
        dayElement.appendChild(operationsIndicator);
        
        // Добавляем класс, указывающий на наличие операций
        dayElement.classList.add('day-has-operations');
    }
    
    // Обработчик клика по дню
    dayElement.addEventListener('click', () => handleDayClick(day, dateString));
    
    return dayElement;
}

function calculateDayTotals(operations) {
    let income = 0;
    let expense = 0;
    
    operations.forEach(op => {
        if (op.type === OPERATION_TYPES.INCOME) {
            income += op.amount;
        } else {
            expense += op.amount;
        }
    });
    
    return {
        income,
        expense,
        balance: income - expense
    };
}

function createDayContent(totals) {
    const content = document.createElement('div');
    content.className = 'day-content';
    
    if (totals.income > 0) {
        const incomeEl = document.createElement('div');
        incomeEl.className = 'day-income';
        incomeEl.textContent = `+${formatCurrency(totals.income)}`;
        content.appendChild(incomeEl);
    }
    
    if (totals.expense > 0) {
        const expenseEl = document.createElement('div');
        expenseEl.className = 'day-expense';
        expenseEl.textContent = `-${formatCurrency(totals.expense)}`;
        content.appendChild(expenseEl);
    }
    
    if (totals.balance !== 0) {
        const balanceEl = document.createElement('div');
        balanceEl.className = 'day-total';
        balanceEl.textContent = totals.balance > 0 ? 
            `+${formatCurrency(totals.balance)}` : 
            formatCurrency(totals.balance);
        balanceEl.style.color = totals.balance > 0 ? 
            COLORS.success : 
            totals.balance < 0 ? COLORS.danger : COLORS.secondary;
        content.appendChild(balanceEl);
    }
    
    return content;
}

function createOperationsIndicator(operations) {
    const indicator = document.createElement('div');
    indicator.className = 'operations-indicator';
    
    const incomeCount = operations.filter(op => op.type === OPERATION_TYPES.INCOME).length;
    const expenseCount = operations.filter(op => op.type === OPERATION_TYPES.EXPENSE).length;
    
    if (incomeCount > 0) {
        const incomeDot = document.createElement('span');
        incomeDot.className = 'income-dot';
        incomeDot.textContent = '•';
        indicator.appendChild(incomeDot);
    }
    
    if (expenseCount > 0) {
        const expenseDot = document.createElement('span');
        expenseDot.className = 'expense-dot';
        expenseDot.textContent = '•';
        indicator.appendChild(expenseDot);
    }
    
    return indicator;
}

function handleDayClick(day, dateString) {
    setSelectedDay(day);
    modalManager.showDayOperations(day);
}

function updateCalendarHeader() {
    const headerElement = document.getElementById('current-month-year');
    if (headerElement) {
        const monthName = getMonthName(CURRENT_MONTH);
        headerElement.textContent = `${monthName} ${CURRENT_YEAR}`;
    }
}

function updateMonthSummary() {
    const totals = calculateMonthTotals();
    
    // Обновляем отображение в боковой панели
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const totalBalanceEl = document.getElementById('total-balance');
    const comparisonEl = document.getElementById('comparison-text');
    
    if (totalIncomeEl) {
        totalIncomeEl.textContent = formatCurrency(totals.income);
    }
    
    if (totalExpenseEl) {
        totalExpenseEl.textContent = formatCurrency(totals.expense);
    }
    
    if (totalBalanceEl) {
        totalBalanceEl.textContent = formatCurrency(totals.balance);
        totalBalanceEl.style.color = totals.balance > 0 ? 
            COLORS.success : 
            totals.balance < 0 ? COLORS.danger : COLORS.primary;
    }
    
    // Обновляем сравнение с предыдущим месяцем
    if (comparisonEl) {
        const prevTotals = getPreviousMonthTotals();
        const incomeChange = totals.income - prevTotals.income;
        const expenseChange = totals.expense - prevTotals.expense;
        const balanceChange = totals.balance - prevTotals.balance;
        
        let comparisonText = 'Сравнение с предыдущим месяцем: ';
        
        if (incomeChange !== 0) {
            comparisonText += `Доходы: ${incomeChange > 0 ? '+' : ''}${formatCurrency(incomeChange)} `;
        }
        
        if (expenseChange !== 0) {
            comparisonText += `Расходы: ${expenseChange > 0 ? '+' : ''}${formatCurrency(expenseChange)}`;
        }
        
        comparisonEl.textContent = comparisonText;
    }
}

function navigateToToday() {
    const today = new Date();
    CURRENT_YEAR = today.getFullYear();
    CURRENT_MONTH = today.getMonth();
    CURRENT_DATE = today;
    
    generateCalendar();
    document.dispatchEvent(new CustomEvent('month-changed', {
        detail: { year: CURRENT_YEAR, month: CURRENT_MONTH }
    }));
}

function navigateToMonth(year, month) {
    CURRENT_YEAR = year;
    CURRENT_MONTH = month;
    CURRENT_DATE = new Date(year, month, 1);
    
    generateCalendar();
    document.dispatchEvent(new CustomEvent('month-changed', {
        detail: { year, month }
    }));
}

function getDayOperationsSummary(day) {
    const dateString = formatDate(new Date(CURRENT_YEAR, CURRENT_MONTH, day));
    const operations = getOperationsByDate(dateString);
    return calculateDayTotals(operations);
}

function highlightDay(day, color) {
    const dayElements = document.querySelectorAll('.calendar-day:not(.calendar-day--empty)');
    dayElements.forEach(element => {
        const dayNumber = element.querySelector('.day-number');
        if (dayNumber && parseInt(dayNumber.textContent) === day) {
            element.style.backgroundColor = color;
            element.dataset.highlighted = 'true';
        }
    });
}

function clearDayHighlights() {
    const highlightedDays = document.querySelectorAll('.calendar-day[data-highlighted="true"]');
    highlightedDays.forEach(day => {
        day.style.backgroundColor = '';
        delete day.dataset.highlighted;
    });
}

function getCalendarDayElement(day) {
    const dayElements = document.querySelectorAll('.calendar-day:not(.calendar-day--empty)');
    for (const element of dayElements) {
        const dayNumber = element.querySelector('.day-number');
        if (dayNumber && parseInt(dayNumber.textContent) === day) {
            return element;
        }
    }
    return null;
}

function updateDayVisualization(day) {
    const dayElement = getCalendarDayElement(day);
    if (!dayElement) return;
    
    const summary = getDayOperationsSummary(day);
    
    // Обновляем содержимое дня
    const oldContent = dayElement.querySelector('.day-content');
    if (oldContent) {
        dayElement.removeChild(oldContent);
    }
    
    if (summary.income > 0 || summary.expense > 0) {
        const newContent = createDayContent(summary);
        dayElement.appendChild(newContent);
        dayElement.classList.add('day-has-operations');
    } else {
        dayElement.classList.remove('day-has-operations');
    }
    
    // Обновляем индикатор операций
    const oldIndicator = dayElement.querySelector('.operations-indicator');
    if (oldIndicator) {
        dayElement.removeChild(oldIndicator);
    }
    
    const dateString = formatDate(new Date(CURRENT_YEAR, CURRENT_MONTH, day));
    const operations = getOperationsByDate(dateString);
    if (operations.length > 0) {
        const newIndicator = createOperationsIndicator(operations);
        dayElement.appendChild(newIndicator);
    }
}

function initCalendarNavigation() {
    // Инициализация уже выполнена в header-controls.js
    // Эта функция оставлена для обратной совместимости
}

// Экспортируем публичные функции
window.calendarModule = {
    generateCalendar,
    navigateToToday,
    navigateToMonth,
    updateMonthSummary,
    getDayOperationsSummary,
    highlightDay,
    clearDayHighlights,
    updateDayVisualization,
    getCalendarDayElement
};
