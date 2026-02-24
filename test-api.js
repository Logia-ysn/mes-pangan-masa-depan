const http = require('http');
const qs = require('querystring');
const req = http.request({
  hostname: 'localhost',
  port: 3005,
  path: '/stock-movements?reference_type=RAW_MATERIAL_RECEIPT&movement_type=IN&limit=2',
  method: 'GET',
  headers: {
    // We need a token or we can just mock req inside a test script.
  }
});
