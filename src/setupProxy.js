const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v2',
    createProxyMiddleware({
      target: 'https://api.frontcore.com',
      changeOrigin: true,
      headers: {
        'X-API-Key': 'a3b1ce6c50a7bec9c926958afac72628'
      }
    })
  );
}; 