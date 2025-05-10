# Finance Tracker

A web-based finance tracking application that stores data locally on your device. Built with JavaScript, HTML, CSS, and SQLite.

## Features

- Add, edit, and delete financial transactions
- Track income, expenses, and transfers
- Categorize transactions
- Multiple account support (Card, Cash, Savings)
- Data visualization with charts
- Responsive design for desktop and mobile
- Local data storage using SQLite

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Dashboard**
   - View summary of your finances
   - See account distribution
   - Analyze spending patterns
   - Track income and expenses over time

2. **Transactions**
   - View all transactions
   - Filter by type, category, or date
   - Edit or delete existing transactions

3. **Add Transaction**
   - Enter transaction details
   - Select transaction type
   - Choose category and account
   - Add optional notes

## Data Storage

All data is stored locally in a SQLite database (`finance.db`). This ensures your financial data remains private and secure on your device.

## Development

To run the application in development mode with auto-reload:
```bash
npm run dev
```

## Technologies Used

- Frontend:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Chart.js for data visualization

- Backend:
  - Node.js
  - Express.js
  - SQLite3

## TODO
- Fix budgeting system

## Upcoming Features/Plans
- Goal-Based Financial Planning Assistant (Deadline: May 17th 2025)
   - Users set savings goals with target amount and deadline (e.g., “Save $1,000 in 3 months”)
   - Assistant calculates required weekly savings based on current habits
   - Displays real-time progress tracker toward the goal
   - Suggests spending limits to stay on track
   - Sends alerts if the user is falling behind
   - Transforms passive tracking into active financial planning
- I will turn this project into a financial simulator rather than tracker. You'll be able to simulate account transactions and trade stocks. Hopefully similar to game of life or cashflow but solely for finance (Deadline: 3-4 years from now)
   - New and advanced Account system(August 2025):
      - Credit: Interest
      - Debit:
      - Savings: Interest 
   - Banking system (TBD)
      - Loans
      - Credit/Financial Health score
   - Simulated Trading (TBD)
   - High Frequency Trading simulator (TBD)

## License

MIT License 