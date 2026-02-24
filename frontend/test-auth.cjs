const axios = require('axios');

async function main() {
  try {
    const res = await axios.post('http://localhost:3005/auth/login', {
      email: 'admin@panganmasadepan.com',
      password: 'password123'
    });

    // Extracted token depends on API structure.
    // Usually it's in a cookie or returned in JSON body
    let token = '';

    // Check Set-Cookie headers
    if (res.headers['set-cookie']) {
      const cookies = res.headers['set-cookie'];
      const authCookie = cookies.find(c => c.startsWith('auth_token='));
      if (authCookie) {
        token = authCookie.split('=')[1].split(';')[0];
      }
    }

    if (!token && res.data && res.data.token) token = res.data.token;
    if (!token && res.data && res.data.data && res.data.data.token) token = res.data.data.token;

    console.log("Token:", token ? token.substring(0, 10) + '...' : "Not found");

    const r2 = await axios.get('http://localhost:3005/stock-movements?reference_type=RAW_MATERIAL_RECEIPT&movement_type=IN&limit=200', {
      headers: { Cookie: `auth_token=${token}` }
    });
    console.log("Stock Movements HTTP status:", r2.status);
    console.log("Is array?", Array.isArray(r2.data?.data), "typeof inner data:", typeof r2.data?.data);

    // What if it is exactly { data: [...], total: ... } inside r2.data
    const movements = r2.data?.data;
    if (Array.isArray(movements)) {
      console.log(`Array length: ${movements.length}`);
      if (movements.length > 0) {
        console.log(`First element stock object exist?`, !!movements[0].Stock);
        console.log(`Factory ID check (expecting 1 or similar):`, movements[0].Stock?.id_factory);
        console.log(`Notes check:`, movements[0].notes);
      }
    } else {
      console.log(`Inner data object keys:`, movements ? Object.keys(movements) : null);
    }

  } catch (err) {
    console.error("Error:", err.message, err.response?.data);
  }
}
main();
