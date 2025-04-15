import knex from 'knex';
import dotenv from 'dotenv';
import knexfile from '../../knexfile.js';

dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

export default db;