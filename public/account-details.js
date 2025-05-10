// Get account ID from URL
const urlParams = new URLSearchParams(window.location.search);
const accountName = urlParams.get('account');

// DOM Elements
const accountNameElement = document.getElementById('account-name');
const accountBalanceElement = document.getElementById('account-balance');
const availableBalanceElement = document.getElementById('available-balance');
const subaccountsSection = document.getElementById('subaccounts-section');
const subaccountsGrid = document.getElementById('subaccounts-grid');
const addSubaccountBtn = document.getElementById('add-subaccount-btn');
const subaccountForm = document.getElementById('subaccount-form');
const subaccountFormContainer = document.getElementById('subaccount-form-container');
const editBalanceBtn = document.getElementById('edit-balance-btn');
const editBalanceForm = document.getElementById('edit-balance-form');
const editBalanceFormContainer = document.getElementById('edit-balance-form-container');
const editSubaccountForm = document.getElementById('edit-subaccount-form');
const editSubaccountFormContainer = document.getElementById('edit-subaccount-form-container');
const subaccountBalanceInput = document.getElementById('subaccount-balance');
const balanceLimitMessage = document.getElementById('balance-limit-message');
const editBalanceLimitMessage = document.getElementById('edit-balance-limit-message');
const parentAccountInfo = document.getElementById('parent-account-info');
const parentAccountBalance = document.getElementById('parent-account-balance');

// Chart instance
let categoryDistributionChart;

// Load account details
function loadAccountDetails() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const account = accounts.find(acc => acc.name === accountName);
    
    if (!account) {
        window.location.href = 'index.html';
        return;
    }

    // Update account details
    accountNameElement.textContent = account.name;
    accountBalanceElement.textContent = formatCurrency(account.balance);

    // Show/hide sub-accounts section based on account type
    if (account.type === 'savings') {
        if (account.parentAccount) {
            // This is a sub-account
            const parentAccount = accounts.find(acc => acc.name === account.parentAccount);
            if (parentAccount) {
                parentAccountInfo.style.display = 'block';
                parentAccountBalance.textContent = formatCurrency(parentAccount.balance);
            }
        } else {
            // This is a main savings account
            subaccountsSection.style.display = 'block';
            updateAvailableBalance();
            loadSubaccounts(account.name);
        }
    } else {
        subaccountsSection.style.display = 'none';
    }

    // Update charts
    updateCategoryDistributionChart(account);
}

// Update available balance for sub-accounts
function updateAvailableBalance() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const parentAccount = accounts.find(acc => acc.name === accountName);
    const subaccounts = accounts.filter(acc => acc.parentAccount === accountName);
    
    const totalSubaccountBalances = subaccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const availableBalance = parentAccount.balance - totalSubaccountBalances;
    
    availableBalanceElement.textContent = formatCurrency(availableBalance);
}

// Load sub-accounts
function loadSubaccounts(parentAccountName) {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const subaccounts = accounts.filter(acc => acc.parentAccount === parentAccountName);
    
    subaccountsGrid.innerHTML = '';
    
    if (subaccounts.length === 0) {
        subaccountsGrid.innerHTML = '<p>No sub-accounts</p>';
        return;
    }

    subaccounts.forEach(subaccount => {
        const subaccountCard = document.createElement('div');
        subaccountCard.className = 'account-card subaccount';
        subaccountCard.innerHTML = `
            <h3>${subaccount.name}</h3>
            <p class="account-balance">${formatCurrency(subaccount.balance)}</p>
            <p class="account-type">Sub-account of ${parentAccountName}</p>
            <div class="subaccount-actions">
                <button class="btn btn-secondary" onclick="showEditSubaccountForm('${subaccount.name}')">Edit Balance</button>
                <button class="btn btn-danger" onclick="deleteSubaccount('${subaccount.name}')">Delete</button>
            </div>
        `;
        subaccountsGrid.appendChild(subaccountCard);
    });
}

// Show edit balance form
function showEditBalanceForm() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const account = accounts.find(acc => acc.name === accountName);
    document.getElementById('new-balance').value = account.balance;
    editBalanceFormContainer.style.display = 'block';
}

// Hide edit balance form
function hideEditBalanceForm() {
    editBalanceFormContainer.style.display = 'none';
    editBalanceForm.reset();
}

// Show edit sub-account form
function showEditSubaccountForm(subaccountName) {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const subaccount = accounts.find(acc => acc.name === subaccountName);
    
    document.getElementById('edit-subaccount-name').value = subaccountName;
    document.getElementById('edit-subaccount-balance').value = subaccount.balance;
    
    updateEditBalanceLimitMessage(subaccountName);
    editSubaccountFormContainer.style.display = 'block';
}

// Hide edit sub-account form
function hideEditSubaccountForm() {
    editSubaccountFormContainer.style.display = 'none';
    editSubaccountForm.reset();
}

// Delete sub-account
function deleteSubaccount(subaccountName) {
    if (!confirm(`Are you sure you want to delete the sub-account "${subaccountName}"?`)) {
        return;
    }
    
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const updatedAccounts = accounts.filter(acc => acc.name !== subaccountName);
    
    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
    loadSubaccounts(accountName);
    updateAvailableBalance();
}

// Update sub-account balance limit message
function updateBalanceLimitMessage() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const parentAccount = accounts.find(acc => acc.name === accountName);
    const currentBalance = parseFloat(subaccountBalanceInput.value) || 0;
    
    // Calculate total existing sub-account balances
    const totalSubaccountBalances = accounts
        .filter(acc => acc.parentAccount === accountName)
        .reduce((sum, acc) => sum + acc.balance, 0);
    
    const maxAllowed = parentAccount.balance * 0.9;
    const remaining = maxAllowed - totalSubaccountBalances;
    
    balanceLimitMessage.textContent = `Maximum allowed: ${formatCurrency(remaining)} (90% of parent account)`;
    
    if (currentBalance > remaining) {
        balanceLimitMessage.style.color = 'var(--accent-color)';
    } else {
        balanceLimitMessage.style.color = 'var(--text-color)';
    }
}

// Update edit sub-account balance limit message
function updateEditBalanceLimitMessage(subaccountName) {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const parentAccount = accounts.find(acc => acc.name === accountName);
    const currentBalance = parseFloat(document.getElementById('edit-subaccount-balance').value) || 0;
    
    // Calculate total existing sub-account balances excluding the current sub-account
    const totalSubaccountBalances = accounts
        .filter(acc => acc.parentAccount === accountName && acc.name !== subaccountName)
        .reduce((sum, acc) => sum + acc.balance, 0);
    
    const maxAllowed = parentAccount.balance * 0.9;
    const remaining = maxAllowed - totalSubaccountBalances;
    
    editBalanceLimitMessage.textContent = `Maximum allowed: ${formatCurrency(remaining)} (90% of parent account)`;
    
    if (currentBalance > remaining) {
        editBalanceLimitMessage.style.color = 'var(--accent-color)';
    } else {
        editBalanceLimitMessage.style.color = 'var(--text-color)';
    }
}

// Add event listeners
editBalanceBtn.addEventListener('click', showEditBalanceForm);
editBalanceForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newBalance = parseFloat(document.getElementById('new-balance').value);
    if (isNaN(newBalance)) {
        alert('Please enter a valid number');
        return;
    }
    
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const account = accounts.find(acc => acc.name === accountName);
    
    // If this is a savings account, check if new balance would affect sub-accounts
    if (account.type === 'savings') {
        const subaccounts = accounts.filter(acc => acc.parentAccount === accountName);
        const totalSubaccountBalances = subaccounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        if (totalSubaccountBalances > newBalance * 0.9) {
            alert('Cannot reduce balance below the total of sub-account balances');
            return;
        }
    }
    
    account.balance = newBalance;
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    hideEditBalanceForm();
    loadAccountDetails();
});

editSubaccountForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subaccountName = document.getElementById('edit-subaccount-name').value;
    const newBalance = parseFloat(document.getElementById('edit-subaccount-balance').value);
    
    if (isNaN(newBalance)) {
        alert('Please enter a valid number');
        return;
    }
    
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const subaccount = accounts.find(acc => acc.name === subaccountName);
    const parentAccount = accounts.find(acc => acc.name === accountName);
    
    // Calculate total existing sub-account balances excluding the current sub-account
    const totalSubaccountBalances = accounts
        .filter(acc => acc.parentAccount === accountName && acc.name !== subaccountName)
        .reduce((sum, acc) => sum + acc.balance, 0);
    
    // Check if new total would exceed 90% of parent account balance
    if (totalSubaccountBalances + newBalance > parentAccount.balance * 0.9) {
        alert('Total sub-account balances cannot exceed 90% of the parent account balance');
        return;
    }
    
    // Update sub-account balance
    subaccount.balance = newBalance;
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    hideEditSubaccountForm();
    loadSubaccounts(accountName);
    updateAvailableBalance();
});

subaccountBalanceInput.addEventListener('input', updateBalanceLimitMessage);
document.getElementById('edit-subaccount-balance').addEventListener('input', function() {
    updateEditBalanceLimitMessage(document.getElementById('edit-subaccount-name').value);
});

// Add sub-account
subaccountForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subaccountName = document.getElementById('subaccount-name').value;
    const subaccountBalance = parseFloat(document.getElementById('subaccount-balance').value);
    
    if (isNaN(subaccountBalance)) {
        alert('Please enter a valid balance');
        return;
    }
    
    // Get existing accounts
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Check if sub-account name already exists
    if (accounts.some(acc => acc.name === subaccountName)) {
        alert('An account with this name already exists');
        return;
    }
    
    const parentAccount = accounts.find(acc => acc.name === accountName);
    
    // Calculate total existing sub-account balances
    const totalSubaccountBalances = accounts
        .filter(acc => acc.parentAccount === accountName)
        .reduce((sum, acc) => sum + acc.balance, 0);
    
    // Check if new sub-account would exceed 90% of parent account balance
    if (totalSubaccountBalances + subaccountBalance > parentAccount.balance * 0.9) {
        alert('Total sub-account balances cannot exceed 90% of the parent account balance');
        return;
    }
    
    // Create new sub-account
    const newSubaccount = {
        name: subaccountName,
        type: 'savings',
        parentAccount: accountName,
        balance: subaccountBalance
    };
    
    // Add the new sub-account
    accounts.push(newSubaccount);
    
    // Save updated accounts
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // Hide the form
    hideSubaccountForm();
    
    // Refresh the display
    loadSubaccounts(accountName);
    updateAvailableBalance();
});

// Show sub-account form
function showSubaccountForm() {
    document.getElementById('parent-account').value = accountName;
    subaccountFormContainer.style.display = 'block';
    updateBalanceLimitMessage();
}

// Hide sub-account form
function hideSubaccountForm() {
    subaccountFormContainer.style.display = 'none';
    subaccountForm.reset();
}

// Add event listener for add sub-account button
addSubaccountBtn.addEventListener('click', showSubaccountForm);

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Load account details when page loads
document.addEventListener('DOMContentLoaded', loadAccountDetails);

// Update category distribution chart
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
            acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
        }
        return acc;
    }, {});

    if (categoryDistributionChart) {
        categoryDistributionChart.destroy();
    }

    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);

    if (categories.length === 0) {
        categoryDistributionChart = new Chart(ctx, {
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

    categoryDistributionChart = new Chart(ctx, {
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