const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const incomesRouter  = require('./routes/incomes');
const expensesRouter = require('./routes/expenses');

const app = express();

app.use(cors());
app.use(express.json());

// Health check (sin auth, para que Render sepa que el server está vivo)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Todas las rutas de la API requieren autenticación
app.use('/incomes',  authMiddleware, incomesRouter);
app.use('/expenses', authMiddleware, expensesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));