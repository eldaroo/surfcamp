const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configurar proxy para la aplicación Next.js
app.use('/', createProxyMiddleware({
  target: 'https://surfcamp-five.vercel.app',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // Eliminar headers restrictivos de iframe
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Agregar headers permisivos
    proxyRes.headers['x-frame-options'] = 'SAMEORIGIN';
    proxyRes.headers['content-security-policy'] = 'frame-ancestors *';
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 