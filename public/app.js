// API endpoints
const API_URL = 'http://localhost:3000/api';

// Chart instances
let accountChart, incomeChart, expenseChart, incomeTrendChart, expenseTrendChart, trendChart;

// Budget Chart instance
let budgetChart;

// DOM Elements
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('main section');
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const typeFilter = document.getElementById('type-filter');
const categoryFilter = document.getElementById('category-filter');
const dateFilter = document.getElementById('date-filter');
const accountForm = document.getElementById('account-form');
const accountFormContainer = document.getElementById('account-form-container');
const subaccountForm = document.getElementById('subaccount-form');
const subaccountFormContainer = document.getElementById('subaccount-form-container');
const addSubaccountBtn = document.getElementById('add-subaccount-btn');

// Budget DOM Elements
const budgetForm = document.getElementById('budget-form');
const budgetFormContainer = document.getElementById('budget-form-container');
const addBudgetBtn = document.getElementById('add-budget-btn');
const budgetsList = document.getElementById('budgets-list');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.getAttribute('data-page');
        
        // Update active states
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetPage) {
                section.classList.add('active');
            }
        });

        // Refresh data if dashboard
        if (targetPage === 'dashboard') {
            loadDashboardData();
            // Ensure spending trends is selected
            const analysisType = document.getElementById('analysis-type');
            if (analysisType) {
                analysisType.value = 'trends';
                updateDashboardView();
            }
        }
    });
});

// Show/Hide Budget Form
addBudgetBtn.addEventListener('click', () => {
    budgetFormContainer.style.display = 'block';
});

function hideBudgetForm() {
    budgetFormContainer.style.display = 'none';
    budgetForm.reset();
}

// Show/Hide Account Form
addSubaccountBtn.addEventListener('click', () => {
    showSubaccountForm();
});

function hideSubaccountForm() {
    const subaccountFormContainer = document.getElementById('subaccount-form-container');
    subaccountFormContainer.style.display = 'none';
    document.getElementById('subaccount-form').reset();
}

// Show/Hide Subaccount Form
function showSubaccountForm() {
    const subaccountFormContainer = document.getElementById('subaccount-form-container');
    const parentAccount = document.getElementById('parent-account');
    const selectedAccount = document.getElementById('selected-account-name').textContent;
    
    // Set the parent account to the currently selected account
    parentAccount.value = selectedAccount;
    subaccountFormContainer.style.display = 'block';
}

// Update Dashboard View
function updateDashboardView() {
    console.log('Updating dashboard view...');
    const analysisType = document.getElementById('analysis-type');
    console.log('Analysis type element:', analysisType);
    
    if (!analysisType) {
        console.error('Analysis type select element not found!');
        return;
    }
    
    const selectedValue = analysisType.value;
    console.log('Selected analysis type:', selectedValue);
    
    // Hide all sections first
    const sections = [
        'expense-overview',
        'income-trend-chart',
        'expense-trend-chart',
        'spending-trends'
    ];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'none';
        } else {
            console.warn(`Section element not found: ${sectionId}`);
        }
    });

    // Show selected section
    let targetSection = null;
    switch (selectedValue) {
        case 'expense':
            targetSection = 'expense-overview';
            break;
        case 'income-trend':
            targetSection = 'income-trend-chart';
            break;
        case 'expense-trend':
            targetSection = 'expense-trend-chart';
            break;
        case 'trends':
            targetSection = 'spending-trends';
            break;
    }
    
    if (targetSection) {
        const element = document.getElementById(targetSection);
        if (element) {
            console.log(`Showing section: ${targetSection}`);
            element.style.display = 'block';
            
            // Force chart resize after showing the section
            setTimeout(() => {
                if (trendChart) trendChart.resize();
                if (expenseChart) expenseChart.resize();
                if (incomeTrendChart) incomeTrendChart.resize();
                if (expenseTrendChart) expenseTrendChart.resize();
            }, 100);
        } else {
            console.error(`Target section not found: ${targetSection}`);
        }
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    console.log('Loading dashboard data...');
    try {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        console.log('Transactions:', transactions);
        console.log('Accounts:', accounts);

        // Update all charts
        updateSummaryCards(transactions);
        updateAccountChart(accounts);
        updateIncomeChart(transactions);
        updateExpenseChart(transactions);
        updateIncomeTrendChart(transactions);
        updateExpenseTrendChart(transactions);
        updateTrendChart(transactions);
        
        // Set default view to spending trends
        const analysisType = document.getElementById('analysis-type');
        if (analysisType) {
            console.log('Setting default view to spending trends');
            analysisType.value = 'trends';
            updateDashboardView();
        } else {
            console.error('Analysis type select element not found!');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update Summary Cards
function updateSummaryCards(transactions) {
    const currentYear = new Date().getFullYear();
    const yearlyTotals = transactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        const year = transaction.date ? Number(transaction.date.split('-')[0]) : null;
        if (year === currentYear) {
            if (transaction.type === 'income') {
                acc.income += amount;
            } else if (transaction.type === 'expense') {
                acc.expenses += amount;
            }
        }
        return acc;
    }, { income: 0, expenses: 0 });

    // Get the sum of balances in the 3 main accounts
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const mainAccounts = accounts.filter(acc => !acc.parentAccount && ['card','cash','savings'].includes(acc.type));
    const totalBalance = mainAccounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

    document.getElementById('total-income-label').textContent = 'Yearly Income';
    document.getElementById('total-expenses-label').textContent = 'Yearly Expense';
    document.getElementById('total-income').textContent = formatCurrency(yearlyTotals.income);
    document.getElementById('total-expenses').textContent = formatCurrency(yearlyTotals.expenses);
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
}

// Update Account Chart
function updateAccountChart(accounts) {
    const canvas = document.getElementById('accountChart');
    if (!canvas) {
        console.log('Account chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for account chart');
        return;
    }
    
    if (accountChart) {
        accountChart.destroy();
    }

    accountChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: accounts.map(acc => acc.name),
            datasets: [{
                label: 'Account Balance',
                data: accounts.map(acc => acc.balance),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Handle Account Type Change
function handleAccountTypeChange() {
    const type = document.getElementById('account-type').value;
    const initialBalanceGroup = document.getElementById('initial-balance').parentElement;
    
    if (type === 'card' || type === 'savings') {
        initialBalanceGroup.style.display = 'block';
    } else {
        initialBalanceGroup.style.display = 'none';
    }
}

// Update Account Options
function updateAccountOptions() {
    const accountSelect = document.getElementById('account');
    const toAccountSelect = document.getElementById('to-account');
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Clear existing options
    accountSelect.innerHTML = '';
    toAccountSelect.innerHTML = '';
    
    // Only add main accounts (those without parentAccount)
    const mainAccounts = accounts.filter(account => !account.parentAccount);
    mainAccounts.forEach(account => {
        const option = new Option(account.name, account.name);
        accountSelect.add(option);
        
        const toOption = new Option(account.name, account.name);
        toAccountSelect.add(toOption);
    });
}

// Handle Transaction Type Change
function handleTransactionTypeChange() {
    const type = document.getElementById('type').value;
    const toAccountGroup = document.getElementById('to-account-group');
    const categoryGroup = document.getElementById('category-group');
    const accountSelect = document.getElementById('account');
    const toAccountSelect = document.getElementById('to-account');
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Reset account options
    updateAccountOptions();
    
    if (type === 'transfer') {
        toAccountGroup.style.display = 'block';
        categoryGroup.style.display = 'none';
        document.getElementById('category').required = false;
        
        // Enable all accounts for transfers
        Array.from(accountSelect.options).forEach(option => {
            option.disabled = false;
        });
        Array.from(toAccountSelect.options).forEach(option => {
            option.disabled = false;
        });
    } else if (type === 'expense') {
        toAccountGroup.style.display = 'none';
        categoryGroup.style.display = 'block';
        document.getElementById('category').required = true;
        // Only show card and cash accounts for expenses
        Array.from(accountSelect.options).forEach(option => {
            const account = accounts.find(acc => acc.name === option.value);
            option.disabled = account && account.type !== 'card' && account.type !== 'cash';
        });
    } else if (type === 'income') {
        toAccountGroup.style.display = 'none';
        categoryGroup.style.display = 'none';
        document.getElementById('category').required = false;
        document.getElementById('category').value = ''; // Clear any selected category
        // Enable all accounts for income
        Array.from(accountSelect.options).forEach(option => {
            option.disabled = false;
        });
    }
}

// Handle Account Change
function handleAccountChange() {
    const type = document.getElementById('type').value;
    const selectedAccount = document.getElementById('account').value;
    const toAccountSelect = document.getElementById('to-account');
    
    if (type === 'transfer') {
        // Disable the selected account in the "to account" dropdown
        Array.from(toAccountSelect.options).forEach(option => {
            option.disabled = option.value === selectedAccount;
        });
    }
}

// Initialize main accounts if they don't exist
async function initializeMainAccounts() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Check if main accounts exist
    const mainAccounts = ['Card', 'Cash', 'Savings'];
    const existingMainAccounts = accounts.filter(acc => mainAccounts.includes(acc.name));
    
    if (existingMainAccounts.length < mainAccounts.length) {
        // Create missing main accounts
        mainAccounts.forEach(accountName => {
            if (!accounts.some(acc => acc.name === accountName)) {
                accounts.push({
                    name: accountName,
                    type: accountName.toLowerCase(),
                    balance: 0,
                    parentAccount: null
                });
            }
        });
        
        // Save updated accounts
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }
}

// Display Accounts
function displayAccounts() {
    const accountBars = document.getElementById('account-bars');
    if (!accountBars) return;

    accountBars.innerHTML = '';
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const mainAccounts = accounts.filter(acc => !acc.parentAccount);

    if (mainAccounts.length === 0) {
        accountBars.innerHTML = '<p>No accounts found</p>';
        return;
    }

    mainAccounts.forEach(account => {
        const accountBar = document.createElement('div');
        accountBar.className = 'account-bar';
        accountBar.innerHTML = `
            <div class="account-bar-info">
                <span class="account-bar-name">${account.name}</span>
                <span class="account-bar-type">${account.type}</span>
            </div>
            <span class="account-bar-balance">${formatCurrency(account.balance)}</span>
        `;
        accountBar.onclick = () => showAccountDetails(account);
        accountBars.appendChild(accountBar);
    });

    // Update account distribution chart
    updateAccountDistributionChart(mainAccounts);
}

function updateAccountDistributionChart(accounts) {
    const ctx = document.getElementById('accountDistributionChart').getContext('2d');
    
    // Check if chart exists before destroying
    if (window.accountDistributionChart && typeof window.accountDistributionChart.destroy === 'function') {
        window.accountDistributionChart.destroy();
    }

    window.accountDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: accounts.map(acc => acc.name),
            datasets: [{
                label: 'Account Balance',
                data: accounts.map(acc => acc.balance),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Account Balances'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function showAccountDetails(account) {
    // Redirect to account details page
    window.location.href = `account-details.html?account=${encodeURIComponent(account.name)}`;
}

function updateCategoryDistributionChart(account) {
    const ctx = document.getElementById('categoryDistributionChart').getContext('2d');
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Filter transactions for this account
    const accountTransactions = transactions.filter(t => 
        t.account === account.name || t.toAccount === account.name
    );

    // Group transactions by category
    const categoryData = accountTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
            const category = transaction.category;
            acc[category] = (acc[category] || 0) + transaction.amount;
        }
        return acc;
    }, {});

    if (window.categoryDistributionChart) {
        window.categoryDistributionChart.destroy();
    }

    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);

    if (categories.length === 0) {
        window.categoryDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Transactions'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#eee']
                }]
            },
            options: { responsive: true }
        });
        return;
    }

    window.categoryDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(52, 73, 94, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Expense Categories'
                },
                tooltip: {
                    callbacks: {
                        label: context => formatCurrency(context.raw)
                    }
                }
            }
        }
    });
}

// Load and Display Transactions
async function loadTransactions() {
    try {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        displayTransactions(transactions);
        updateCategoryFilter(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function updateCategoryFilter(transactions) {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    // Preserve the currently selected value
    const prevValue = categoryFilter.value;

    // Get unique categories from transactions
    const transactionCategories = new Set(transactions.map(t => t.category));
    
    // Add default categories
    const defaultCategories = [
        'food',
        'rent',
        'utilities',
        'transportation',
        'entertainment',
        'other'
    ];
    
    // Combine all categories
    const allCategories = [...new Set([...transactionCategories, ...defaultCategories])];
    
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add category options
    allCategories.forEach(category => {
        const option = new Option(category.charAt(0).toUpperCase() + category.slice(1), category);
        categoryFilter.add(option);
    });

    // Restore the previously selected value if it exists
    if (prevValue && Array.from(categoryFilter.options).some(opt => opt.value === prevValue)) {
        categoryFilter.value = prevValue;
    }
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) return;
    
    // Get filter values
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (!typeFilter || !categoryFilter || !dateFilter) return;
    
    // Filter transactions
    let filteredTransactions = transactions;
    
    // Apply type filter
    if (typeFilter.value !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter.value);
    }
    
    // Apply category filter
    if (categoryFilter.value !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter.value);
    }
    
    // Apply date filter
    if (dateFilter.value) {
        const selectedDate = dateFilter.value;
        filteredTransactions = filteredTransactions.filter(t => {
            // Use local date parsing to avoid timezone issues
            const [year, month, day] = selectedDate.split('-');
            const [transYear, transMonth, transDay] = t.date.split('-');
            return transYear === year && transMonth === month && transDay === day;
        });
    }
    
    // Sort transactions by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear and update the list
    transactionsList.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = '<div class="no-transactions">No transactions found</div>';
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        
        let amountDisplay = formatCurrency(transaction.amount);
        if (transaction.type === 'transfer') {
            amountDisplay = `Transfer to ${transaction.toAccount}: ${amountDisplay}`;
        }
        
        // Get category icon
        const categoryIcon = getCategoryIcon(transaction.category);
        
        // Format the date for display
        // const displayDate = new Date(transaction.date);
        // const formattedDate = displayDate.toLocaleDateString('en-US', {
        //     year: 'numeric',
        //     month: 'long',
        //     day: 'numeric'
        // });
        // Use local date parsing to avoid timezone issues
        const [year, month, day] = transaction.date.split('-');
        const formattedDate = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        transactionEl.innerHTML = `
            <div>
                <strong>${categoryIcon} ${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}</strong>
                <span>${transaction.note || ''}</span>
            </div>
            <div>
                <span class="transaction-type ${transaction.type}">${amountDisplay}</span>
                <span>${formattedDate}</span>
                <div class="transaction-actions">
                    <button onclick="editTransaction(${transaction.id})" class="edit-btn">✏️</button>
                    <button onclick="deleteTransaction(${transaction.id})" class="delete-btn">🗑️</button>
                </div>
            </div>
        `;
        transactionsList.appendChild(transactionEl);
    });
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍔',
        rent: '🏠',
        utilities: '💡',
        transportation: '🚗',
        entertainment: '🎬',
        other: '📦',
        transfer: '↔️'
    };
    return icons[category] || '📝';
}

// Add event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => loadTransactions());
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadTransactions());
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', () => loadTransactions());
    }
    
    // Initial load of transactions
    loadTransactions();
});

// Update Add Transaction Form
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const type = document.getElementById('type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const fromAccount = document.getElementById('account').value;
        const toAccount = type === 'transfer' ? document.getElementById('to-account').value : null;
        const date = document.getElementById('date').value;
        const category = type === 'transfer' ? 'transfer' : document.getElementById('category').value;
        const note = document.getElementById('note').value || '';
        
        // Validate required fields
        if (!amount || !fromAccount || !date || !category) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Get accounts from localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        // Find the accounts
        const fromAccountObj = accounts.find(acc => acc.name === fromAccount);
        const toAccountObj = toAccount ? accounts.find(acc => acc.name === toAccount) : null;
        
        if (!fromAccountObj) {
            alert('Source account not found');
            return;
        }
        
        // Validate transaction type and account type
        if (type === 'expense' && fromAccountObj.type === 'savings') {
            alert('Cannot make expenses from savings account');
            return;
        }
        
        // Validate balances
        if (type === 'expense' || type === 'transfer') {
            if (amount > fromAccountObj.balance) {
                alert('Insufficient funds in the source account');
                return;
            }
        }
        
        // Create transaction data
        const transactionData = {
            id: Date.now(),
            amount: amount,
            type: type,
            date: date,
            category: category,
            account: fromAccount,
            note: note
        };

        if (type === 'transfer') {
            if (!toAccountObj) {
                alert('Destination account not found');
                return;
            }
            
            // For transfers, always use main savings account
            if (toAccountObj.type === 'savings') {
                transactionData.toAccount = 'Savings';
            } else {
                transactionData.toAccount = toAccount;
            }
            
            if (fromAccountObj.type === 'savings') {
                transactionData.account = 'Savings';
            }
            
            // Update balances
            fromAccountObj.balance -= amount;
            const targetAccount = accounts.find(acc => acc.name === transactionData.toAccount);
            if (targetAccount) {
                targetAccount.balance += amount;
            }
        } else if (type === 'income') {
            fromAccountObj.balance += amount;
        } else if (type === 'expense') {
            fromAccountObj.balance -= amount;
        }
        
        // Save updated accounts
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // Save transaction
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions.push(transactionData);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Reset form and refresh display
        transactionForm.reset();
        updateAccountOptions(); // Refresh account options
        
        // Update displays
        const mainAccounts = accounts.filter(acc => !acc.parentAccount);
        displayAccounts();
        updateAccountDistributionChart(mainAccounts);
        loadTransactions(); // Update transaction history
        
        // Show success message
        alert('Transaction added successfully');
        
    } catch (error) {
        console.error('Error details:', error);
        alert('Error adding transaction: ' + error.message);
    }
});

// Update Income Chart
function updateIncomeChart(transactions) {
    const canvas = document.getElementById('incomeChart');
    if (!canvas) {
        console.log('Income chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for income chart');
        return;
    }
    
    if (incomeChart) {
        incomeChart.destroy();
    }

    const incomeData = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            const category = transaction.category;
            acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
        }
        return acc;
    }, {});

    const categories = Object.keys(incomeData);
    const amounts = Object.values(incomeData);

    if (categories.length === 0) {
        incomeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Income'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#eee']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: {
                            boxWidth: 10,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => formatCurrency(context.raw)
                        }
                    }
                }
            }
        });
        return;
    }

    incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 73, 94, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 10,
                        padding: 8,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: context => formatCurrency(context.raw)
                    }
                }
            }
        }
    });
}

// Update Expense Chart
function updateExpenseChart(transactions) {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) {
        console.log('Expense chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for expense chart');
        return;
    }
    
    if (expenseChart) {
        expenseChart.destroy();
    }

    const expenseData = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
            const category = transaction.category;
            acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
        }
        return acc;
    }, {});

    const categories = Object.keys(expenseData);
    const amounts = Object.values(expenseData);

    if (categories.length === 0) {
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Expenses'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#eee']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: {
                            boxWidth: 10,
                            padding: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => formatCurrency(context.raw)
                        }
                    }
                }
            }
        });
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(52, 73, 94, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 10,
                        padding: 8,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: context => formatCurrency(context.raw)
                    }
                }
            }
        }
    });
}

// Update Income Trend Chart
function updateIncomeTrendChart(transactions) {
    const canvas = document.getElementById('incomeTrendChart');
    if (!canvas) {
        console.log('Income trend chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for income trend chart');
        return;
    }
    
    if (incomeTrendChart) {
        incomeTrendChart.destroy();
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            const date = new Date(transaction.date);
            if (date >= twelveMonthsAgo) {
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[monthYear] = (acc[monthYear] || 0) + parseFloat(transaction.amount);
            }
        }
        return acc;
    }, {});

    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(month => monthlyData[month]);

    // Format labels for display
    const formattedLabels = labels.map(label => {
        const [year, month] = label.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    incomeTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Income',
                data: data,
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Income: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value),
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Update Expense Trend Chart
function updateExpenseTrendChart(transactions) {
    const canvas = document.getElementById('expenseTrendChart');
    if (!canvas) {
        console.log('Expense trend chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for expense trend chart');
        return;
    }
    
    if (expenseTrendChart) {
        expenseTrendChart.destroy();
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
            const date = new Date(transaction.date);
            if (date >= twelveMonthsAgo) {
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[monthYear] = (acc[monthYear] || 0) + parseFloat(transaction.amount);
            }
        }
        return acc;
    }, {});

    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(month => monthlyData[month]);

    // Format labels for display
    const formattedLabels = labels.map(label => {
        const [year, month] = label.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    expenseTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Expenses',
                data: data,
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Expenses: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value),
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Add event listeners for Spending Trends date filters
function setupTrendDateFilters() {
    const startInput = document.getElementById('trend-start-date');
    const endInput = document.getElementById('trend-end-date');
    if (!startInput || !endInput) return;

    // Set default values: start = 1 year ago, end = today
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    defaultStart.setDate(defaultStart.getDate() - 365);
    startInput.value = defaultStart.toISOString().split('T')[0];
    endInput.value = now.toISOString().split('T')[0];

    startInput.addEventListener('change', () => loadDashboardData());
    endInput.addEventListener('change', () => loadDashboardData());
}

// Update Trend Chart (Spending Trends)
function updateTrendChart(transactions) {
    const startInput = document.getElementById('trend-start-date');
    const endInput = document.getElementById('trend-end-date');
    let startDate, endDate;
    if (startInput && endInput && startInput.value && endInput.value) {
        startDate = new Date(startInput.value);
        endDate = new Date(endInput.value);
        endDate.setHours(23, 59, 59, 999); // include the whole end day
    } else {
        // Default: last 12 months
        endDate = new Date();
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
    }

    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.log('Trend chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for trend chart');
        return;
    }
    
    if (trendChart) {
        trendChart.destroy();
    }

    // Group transactions by month within the selected range
    const monthlyData = transactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        if (date >= startDate && date <= endDate) {
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthYear]) {
                acc[monthYear] = { income: 0, expenses: 0 };
            }
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                acc[monthYear].income += amount;
            } else if (transaction.type === 'expense') {
                acc[monthYear].expenses += amount;
            }
        }
        return acc;
    }, {});

    // Sort months and prepare data
    const labels = Object.keys(monthlyData).sort();
    const incomeData = labels.map(month => monthlyData[month].income);
    const expenseData = labels.map(month => monthlyData[month].expenses);

    // Format labels for display
    const formattedLabels = labels.map(label => {
        const [year, month] = label.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    },
                    onClick: function(e, legendItem, legend) {
                        // Default toggle behavior
                        const ci = legend.chart;
                        const index = legendItem.datasetIndex;
                        const meta = ci.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                        ci.update();
                        // Use requestAnimationFrame to update the title after the chart state is updated
                        requestAnimationFrame(() => updateTrendChartTitle(ci));
                    }
                },
                title: {
                    display: true,
                    text: 'Income and Expense Over Time',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value),
                        font: {
                            size: 11
                        }
                    }
                }
            }
        },
        plugins: [{
            afterEvent: function(chart) {
                updateTrendChartTitle(chart);
            }
        }]
    });
}

function updateTrendChartTitle(chart) {
    if (!chart || !chart.options.plugins || !chart.options.plugins.title) return;
    // Use Chart.js API for robust visibility detection
    const incomeVisible = chart.isDatasetVisible(0);
    const expenseVisible = chart.isDatasetVisible(1);
    let newTitle = '';
    if (incomeVisible && expenseVisible) {
        newTitle = 'Income and Expense Over Time';
    } else if (incomeVisible) {
        newTitle = 'Income Over Time';
    } else if (expenseVisible) {
        newTitle = 'Expense Over Time';
    } else {
        newTitle = 'No Data';
    }
    // Detailed logging
    console.log('[updateTrendChartTitle] incomeVisible:', incomeVisible, 'expenseVisible:', expenseVisible, 'title:', newTitle);
    if (chart.options.plugins.title.text !== newTitle) {
        chart.options.plugins.title.text = newTitle;
        chart.update('none'); // Force redraw with new title, no animation
    }
}

// Load Budgets
async function loadBudgets() {
    try {
        const budgets = JSON.parse(localStorage.getItem('budgets')) || [];
        
        // Only update budget chart if we're on the budgets page
        if (document.getElementById('budgets').classList.contains('active')) {
            displayBudgets(budgets);
            updateBudgetChart(budgets);
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

// Display Budgets
function displayBudgets(budgets) {
    budgetsList.innerHTML = '';
    
    budgets.forEach(budget => {
        const budgetEl = document.createElement('div');
        budgetEl.className = 'budget-card';
        
        const progress = (budget.spent_amount / budget.amount) * 100;
        const isOverBudget = progress > 100;
        
        budgetEl.innerHTML = `
            <h3>${budget.category}</h3>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="budget-details">
                    <span>Spent: ${formatCurrency(budget.spent_amount)}</span>
                    <span>Budget: ${formatCurrency(budget.amount)}</span>
                </div>
                ${isOverBudget ? `<div class="budget-alert">Over budget by ${formatCurrency(budget.spent_amount - budget.amount)}</div>` : ''}
            </div>
        `;
        
        budgetsList.appendChild(budgetEl);
    });
}

// Update Budget Chart
function updateBudgetChart(budgets) {
    const canvas = document.getElementById('budgetChart');
    if (!canvas) {
        console.log('Budget chart canvas not found, skipping update');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context for budget chart');
        return;
    }
    
    if (budgetChart) {
        budgetChart.destroy();
    }

    const categories = budgets.map(b => b.category);
    const amounts = budgets.map(b => b.amount);
    const spent = budgets.map(b => b.spent_amount);

    budgetChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Budget',
                    data: amounts,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)'
                },
                {
                    label: 'Spent',
                    data: spent,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Add Budget
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        category: document.getElementById('budget-category').value,
        amount: document.getElementById('budget-amount').value,
        period: document.getElementById('budget-period').value,
        start_date: document.getElementById('budget-start-date').value,
        end_date: document.getElementById('budget-end-date').value
    };

    try {
        const response = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            hideBudgetForm();
            loadBudgets();
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error adding budget:', error);
    }
});

// Add Subaccount
subaccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const subaccountName = document.getElementById('subaccount-name').value;
    const parentAccount = document.getElementById('parent-account').value;
    
    // Get existing accounts
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Check if sub-account name already exists
    if (accounts.some(acc => acc.name === subaccountName)) {
        alert('An account with this name already exists');
        return;
    }
    
    // Create new sub-account
    const newSubaccount = {
        name: subaccountName,
        type: 'savings',
        parentAccount: parentAccount,
        balance: 0
    };
    
    // Add the new sub-account
    accounts.push(newSubaccount);
    
    // Save updated accounts
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // Hide the form
    hideSubaccountForm();
    
    // Refresh the display
    displayAccounts();
    
    // Show the updated account details
    const parentAccountObj = accounts.find(acc => acc.name === parentAccount);
    if (parentAccountObj) {
        showAccountDetails(parentAccountObj);
    }
});

// Edit Account
async function editAccount(id) {
    // Implementation for editing account
    console.log('Edit account:', id);
}

// Delete Account
async function deleteAccount(id) {
    if (confirm('Are you sure you want to delete this account?')) {
        try {
            const response = await fetch(`${API_URL}/accounts/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadAccounts();
                loadDashboardData();
            }
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Utility function to get start of current month
function getStartOfMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// Utility function to get end of current month
function getEndOfMonth() {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${lastDay.getDate()}`;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Initializing application...');
    
    // Initialize main accounts
    await initializeMainAccounts();
    
    // Initialize account options
    updateAccountOptions();
    
    // Load initial data
    loadDashboardData();
    loadTransactions();
    loadBudgets();
    displayAccounts();
    
    // Ensure spending trends is selected on initial load
    const analysisType = document.getElementById('analysis-type');
    if (analysisType) {
        console.log('Setting initial view to spending trends');
        analysisType.value = 'trends';
        updateDashboardView();
    }
    
    setupTrendDateFilters();
});

// Add clear transactions button to the transactions header
document.addEventListener('DOMContentLoaded', () => {
    const transactionsHeader = document.querySelector('.transactions-header');
    if (transactionsHeader) {
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear All Transactions';
        clearButton.className = 'clear-transactions-btn';
        clearButton.onclick = clearAllTransactions;
        transactionsHeader.appendChild(clearButton);
    }
});

function clearAllTransactions() {
    if (confirm('Are you sure you want to clear all transactions? This will revert all account balances to their initial values.')) {
        // Get all transactions
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        // Revert all account balances to their initial values
        accounts.forEach(account => {
            if (account.type === 'card') {
                account.balance = 5000;
            } else if (account.type === 'cash') {
                account.balance = 1000;
            } else if (account.type === 'savings') {
                account.balance = 10000;
            }
        });
        
        // Save updated accounts
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // Clear transactions
        localStorage.removeItem('transactions');
        
        // Refresh displays
        loadTransactions();
        displayAccounts();
        updateAccountDistributionChart(accounts.filter(acc => !acc.parentAccount));
        loadDashboardData();
        
        alert('All transactions have been cleared and account balances have been reset to their initial values.');
    }
}

function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction? This will revert the account balance changes.')) {
        // Get transactions and accounts
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        // Find the transaction
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        // Revert account balances
        const account = accounts.find(acc => acc.name === transaction.account);
        if (account) {
            if (transaction.type === 'income') {
                account.balance -= transaction.amount;
            } else if (transaction.type === 'expense') {
                account.balance += transaction.amount;
            } else if (transaction.type === 'transfer') {
                account.balance += transaction.amount;
                const toAccount = accounts.find(acc => acc.name === transaction.toAccount);
                if (toAccount) {
                    toAccount.balance -= transaction.amount;
                }
            }
        }
        
        // Save updated accounts
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // Remove the transaction
        const updatedTransactions = transactions.filter(t => t.id !== transactionId);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        // Refresh displays
        loadTransactions();
        displayAccounts();
        
        alert('Transaction deleted and account balances have been reverted.');
    }
}

function editTransaction(transactionId) {
    // Get the transaction
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // First delete the transaction to revert balances
    deleteTransaction(transactionId);
    
    // Then populate the add transaction form with the transaction data
    document.getElementById('type').value = transaction.type;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('date').value = transaction.date;
    document.getElementById('account').value = transaction.account;
    document.getElementById('category').value = transaction.category;
    document.getElementById('note').value = transaction.note || '';
    
    // Show the add transaction section
    document.querySelector('nav a[data-page="add-transaction"]').click();
    
    // Handle any type-specific UI updates
    handleTransactionTypeChange();
    if (transaction.type === 'transfer') {
        document.getElementById('to-account').value = transaction.toAccount;
    }
}

// Add clear account balances button functionality
document.addEventListener('DOMContentLoaded', () => {
    const clearBalancesBtn = document.getElementById('clear-balances-btn');
    if (clearBalancesBtn) {
        clearBalancesBtn.addEventListener('click', clearAccountBalances);
    }
});

function clearAccountBalances() {
    if (confirm('Are you sure you want to set all account balances to zero?')) {
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        // Set all account balances (main and sub-accounts) to zero
        accounts.forEach(account => {
            account.balance = 0;
        });
        
        // Save updated accounts
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // Refresh displays
        displayAccounts();
        loadDashboardData();
        alert('All account balances have been set to zero.');
        window.location.reload();
    }
} 