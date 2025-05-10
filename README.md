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

## License

MIT License 