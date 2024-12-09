/** server.js */
import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

/** Middleware to parse JSON body */
app.use(express.json());

/** Load all routes */
app.use('/', routes);

/** Start the server */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;