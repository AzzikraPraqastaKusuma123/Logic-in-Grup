const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'logicin_db'
};

async function hashInitialPassword() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database for setup...');

    try {
        const [users] = await connection.query("SELECT id, password FROM users WHERE username = 'admin'");
        if (users.length === 0) {
            console.log('Admin user not found. Please run schema.sql first.');
            return;
        }

        const user = users[0];
        // Cek jika password masih 'admin123' (atau bukan hash)
        if (!user.password.startsWith('$2b$')) {
            console.log("Found plain text password. Hashing now...");
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await connection.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);
            console.log("Admin password has been securely hashed. You can now log in with username 'admin' and password 'admin123'.");
        } else {
            console.log('Admin password already hashed. No action needed.');
        }
    } catch (error) {
        console.error('Error during setup:', error);
    } finally {
        await connection.end();
        console.log('Setup script finished.');
    }
}

hashInitialPassword();