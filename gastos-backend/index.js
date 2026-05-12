// gastos-backend/index.js
const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const incomesRouter  = require('./routes/incomes');
const expensesRouter = require('./routes/expenses');
const savingsRouter  = require('./routes/savings');

const app = express();
app.use(cors());
app.use(express.json());

// Health check sin auth
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Todas las rutas requieren JWT
app.use('/incomes',  authMiddleware, incomesRouter);
app.use('/expenses', authMiddleware, expensesRouter);
app.use('/savings',  authMiddleware, savingsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Backend corriendo en puerto ' + PORT));
