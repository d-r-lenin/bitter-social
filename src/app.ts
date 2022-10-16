import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import ejs from 'ejs';
import connect from './config/db';

import { router as homeRouter } from './routers/home';
import { router as usersRouter } from './routers/users';


import { auth } from './controllers/middlewares';



const DBName: string = process.env.DB_NAME || "test";

connect(DBName).then(() => {
    console.log("Connected to MongoDB");
});


const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());

app.use('/users', usersRouter);
app.use('/', auth, homeRouter);

app.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
});