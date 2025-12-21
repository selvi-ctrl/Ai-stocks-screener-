// Script to create admin user
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'stocks',
        user: 'Shivansh',
        password: 'pass'
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const email = 'admin@stocks.com';
        const password = 'admin123';
        const name = 'Admin User';
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4 RETURNING id, email, role',
            [email, hashedPassword, name, 'admin']
        );

        console.log('\n✅ Admin user created successfully!');
        console.log('==========================================');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role:', result.rows[0].role);
        console.log('==========================================\n');

    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        await client.end();
    }
}

createAdmin();
