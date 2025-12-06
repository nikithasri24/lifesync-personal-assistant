import http from 'http';

const server = http.createServer((_req, res) => {
  res.end('ok');
});

server.listen(5000, () => {
  console.log('test server listening on 5000');
});
