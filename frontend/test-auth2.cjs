const axios = require('axios');

async function main() {
    try {
        const res = await axios.post('http://localhost:3005/auth/login', {
            email: 'admin@panganmasadepan.com',
            password: 'password123'
        });

        let token = '';
        if (res.headers['set-cookie']) {
            const cookies = res.headers['set-cookie'];
            const authCookie = cookies.find(c => c.startsWith('auth_token='));
            if (authCookie) token = authCookie.split('=')[1].split(';')[0];
        }

        const r2 = await axios.get('http://localhost:3005/stock-movements?reference_type=RAW_MATERIAL_RECEIPT&movement_type=IN&limit=200', {
            headers: { Cookie: `auth_token=${token}` }
        });
        console.log("r2.data is Array?", Array.isArray(r2.data));
        console.log("r2.data keys:", Object.keys(r2.data));
        if (r2.data.data) {
            console.log("r2.data.data is Array?", Array.isArray(r2.data.data));
            console.log("r2.data.data keys:", Object.keys(r2.data.data));
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
