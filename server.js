const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('finance.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Transactions table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            account TEXT NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Accounts table
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL DEFAULT 0
        )`);

        // Budgets table
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            period TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default accounts if they don't exist
        const defaultAccounts = [
            { name: 'Card', type: 'card' },
            { name: 'Cash', type: 'cash' },
            { name: 'Savings', type: 'savings' }
        ];

        defaultAccounts.forEach(account => {
            db.run('INSERT OR IGNORE INTO accounts (name, type) VALUES (?, ?)',
                [account.name, account.type]);
        });
    });
}

// API Routes

// Get all transactions
app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
    const { amount, type, date, category, account, note, toAccount } = req.body;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert transaction
        db.run(
            'INSERT INTO transactions (amount, type, date, category, account, note) VALUES (?, ?, ?, ?, ?, ?)',
            [amount, type, date, category, account, note],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Update account balances based on transaction type
                if (type === 'transfer') {
                    // For transfers, decrease source account and increase destination account
                    db.run(
                        'UPDATE accounts SET balance = balance - ? WHERE name = ?',
                        [amount, account],
                        function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            
                            db.run(
                                'UPDATE accounts SET balance = balance + ? WHERE name = ?',
                                [amount, toAccount],
                                function(err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        res.status(500).json({ error: err.message });
                                        return;
                                    }
                                    
                                    db.run('COMMIT');
                                    res.json({ id: this.lastID });
                                }
                            );
                        }
                    );
                } else {
                    // For income/expense, update single account
                    const balanceChange = type === 'income' ? amount : -amount;
                    db.run(
                        'UPDATE accounts SET balance = balance + ? WHERE name = ?',
                        [balanceChange, account],
                        function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            
                            db.run('COMMIT');
                            res.json({ id: this.lastID });
                        }
                    );
                }
            }
        );
    });
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
    const { amount, type, date, category, account, note } = req.body;
    db.run(
        'UPDATE transactions SET amount = ?, type = ?, date = ?, category = ?, account = ?, note = ? WHERE id = ?',
        [amount, type, date, category, account, note, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    db.run('DELETE FROM transactions WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

// Get account balances with transaction history
app.get('/api/accounts', (req, res) => {
    db.all(`
        SELECT 
            a.*,
            COALESCE(SUM(CASE 
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account = a.name THEN -t.amount
                WHEN t.type = 'transfer' AND t.toAccount = a.name THEN t.amount
                ELSE 0
            END), 0) as current_balance
        FROM accounts a
        LEFT JOIN transactions t ON t.account = a.name OR t.toAccount = a.name
        GROUP BY a.name
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Budget routes
app.post('/api/budgets', (req, res) => {
    const { category, amount, period, start_date, end_date } = req.body;
    
    db.run(
        'INSERT INTO budgets (category, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [category, amount, period, start_date, end_date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.get('/api/budgets', (req, res) => {
    db.all('SELECT * FROM budgets ORDER BY start_date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/budgets/progress', (req, res) => {
    const { start_date, end_date } = req.query;
    
    db.all(`
        SELECT 
            b.category,
            b.amount as budget_amount,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent_amount
        FROM budgets b
        LEFT JOIN transactions t ON t.category = b.category 
            AND t.date BETWEEN b.start_date AND b.end_date
        WHERE b.start_date <= ? AND b.end_date >= ?
        GROUP BY b.category, b.amount
    `, [end_date, start_date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 