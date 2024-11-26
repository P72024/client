import path from 'path';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'http';

const app = express();
const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';

// Redirect to https
app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && env !== 'development') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
