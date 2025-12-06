import http from 'http';

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
}, res => {
  console.log('status', res.statusCode);
  res.on('data', chunk => process.stdout.write(chunk));
  res.on('end', () => console.log('\nres end'));
});

req.on('error', err => {
  console.error('err', err.message);
});

req.on('timeout', () => {
  console.error('err timeout');
  req.destroy();
});

req.end();
