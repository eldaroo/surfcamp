/**
 * Script para obtener todos los templates de Brevo y sus IDs
 *
 * Uso:
 * 1. Obtén tu API Key de Brevo: https://app.brevo.com/settings/keys/api
 * 2. Ejecuta: BREVO_API_KEY=tu_api_key node scripts/get-brevo-templates.js
 */

const https = require('https');

const apiKey = (process.env.BREVO_API_KEY || '').trim();

if (!apiKey) {
  console.error('❌ Error: BREVO_API_KEY no está definida');
  console.log('\nUso:');
  console.log('  BREVO_API_KEY=tu_api_key node scripts/get-brevo-templates.js');
  process.exit(1);
}

// Validate API key format
if (apiKey.includes('\n') || apiKey.includes('\r')) {
  console.error('❌ Error: La API key contiene saltos de línea');
  console.log('API Key recibida:', JSON.stringify(apiKey));
  process.exit(1);
}

const options = {
  hostname: 'api.brevo.com',
  path: '/v3/smtp/templates',
  method: 'GET',
  headers: {
    'accept': 'application/json',
    'api-key': apiKey
  }
};

console.log('📧 Obteniendo templates de Brevo...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.templates && response.templates.length > 0) {
        console.log(`✅ Se encontraron ${response.templates.length} templates:\n`);

        response.templates.forEach((template) => {
          console.log('─────────────────────────────────────');
          console.log(`📄 Nombre: ${template.name}`);
          console.log(`🆔 ID: ${template.id}`);
          console.log(`📧 Subject: ${template.subject || 'N/A'}`);
          console.log(`🏷️  Tag: ${template.tag || 'N/A'}`);
          console.log(`✅ Activo: ${template.isActive ? 'Sí' : 'No'}`);
          console.log('');
        });

        console.log('─────────────────────────────────────\n');
        console.log('💡 Copia los IDs de tus templates de confirmación:');
        console.log('   - Template en Inglés: BREVO_TEMPLATE_EN=<ID>');
        console.log('   - Template en Español: BREVO_TEMPLATE_ES=<ID>');
      } else {
        console.log('⚠️  No se encontraron templates');
      }
    } catch (error) {
      console.error('❌ Error al parsear respuesta:', error.message);
      console.log('Respuesta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error.message);
});

req.end();
