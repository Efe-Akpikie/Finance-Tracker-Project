// Function to generate a random date within a range
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate a random amount within a range
function randomAmount(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Function to generate random transactions
function generateTransactions() {
    const transactions = [];
    const categories = ['food', 'rent', 'utilities', 'transportation', 'entertainment', 'other'];
    const types = ['income', 'expense'];
    const accounts = ['Card', 'Cash', 'Savings'];
    const now = new Date();
    // Set startDate to midnight 365 days ago
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setDate(startDate.getDate() - 365);
    // Set endDate to the end of today (23:59:59)
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const totalTransactions = 1000;
    for (let i = 0; i < totalTransactions; i++) {
        // Evenly space the dates
        const date = new Date(startDate.getTime() + ((endDate.getTime() - startDate.getTime()) * i / (totalTransactions - 1)));
        // Randomly pick type, category, and account
        const type = Math.random() < 0.8 ? 'expense' : 'income'; // 80% expenses, 20% income
        const category = categories[Math.floor(Math.random() * categories.length)];
        const account = accounts[Math.floor(Math.random() * accounts.length)];
        // Random amount
        let amount = 0;
        if (category === 'rent') {
            amount = Math.random() * 1200 + 800; // $800 - $2000
        } else if (category === 'food') {
            amount = Math.random() * 80 + 20; // $20 - $100
        } else if (category === 'utilities') {
            amount = Math.random() * 100 + 50; // $50 - $150
        } else if (category === 'transportation') {
            amount = Math.random() * 100 + 20; // $20 - $120
        } else if (category === 'entertainment') {
            amount = Math.random() * 100 + 10; // $10 - $110
        } else {
            amount = Math.random() * 200 + 10; // $10 - $210
        }
        amount = Math.round(amount * 100) / 100;
        // Create transaction object
        const transaction = {
            id: Date.now() + i,
            amount: amount,
            type: type,
            date: date.toISOString().split('T')[0],
            category: category,
            account: account,
            note: `${type === 'income' ? 'Received' : 'Spent'} on ${category}`
        };
        transactions.push(transaction);
    }
    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    return transactions;
}

// Function to initialize test data
function initializeTestData() {
    // Generate transactions
    const transactions = generateTransactions();
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Initialize accounts with some balance
    const accounts = [
        {
            name: 'Card',
            type: 'card',
            balance: 5000,
            parentAccount: null
        },
        {
            name: 'Cash',
            type: 'cash',
            balance: 1000,
            parentAccount: null
        },
        {
            name: 'Savings',
            type: 'savings',
            balance: 10000,
            parentAccount: null
        }
    ];
    
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    console.log('Test data initialized with 1000 transactions');
    console.log('Transactions:', transactions);
    console.log('Accounts:', accounts);
    
    // Reload the page to show the new data
    window.location.reload();
}

// Add button to initialize test data
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.transactions-header');
    if (header) {
        const initButton = document.createElement('button');
        initButton.textContent = 'Initialize Test Data';
        initButton.className = 'init-test-data-btn';
        initButton.onclick = initializeTestData;
        header.appendChild(initButton);
    }
}); 