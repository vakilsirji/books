const weekInMs = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

const tokenCookieOptions = {
    httpOnly: true,
    maxAge: weekInMs,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
};

module.exports = { tokenCookieOptions };
