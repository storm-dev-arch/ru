const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!ROBLOX_API_KEY || !ADMIN_LOGIN || !ADMIN_PASS) {
    console.error("Ошибка: Секретные переменные (API_KEY, LOGIN, PASS) не заданы на Render!");
    process.exit(1); 
}
