const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bookcircle?schema=public";
const isPgliteConnection = connectionString.includes('127.0.0.1:5432/postgres');
const isServerlessRuntime = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const pool = new Pool({
    connectionString,
    max: (isPgliteConnection || isServerlessRuntime) ? 1 : 10,
    idleTimeoutMillis: isServerlessRuntime ? 5000 : 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: isServerlessRuntime
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
