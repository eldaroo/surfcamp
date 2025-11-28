/**
 * Script simplificado para obtener templates de Brevo
 *
 * Instrucciones:
 * 1. Pega tu API Key en la línea de abajo (reemplaza 'TU_API_KEY_AQUI')
 * 2. Ejecuta: node scripts/get-brevo-templates-simple.js
 */

const https = require('https');

// 👇 PEGA TU API KEY AQUÍ (entre las comillas)
const apiKey = 'TU_API_KEY_AQUI';

if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
  console.error('❌ Error: Por favor edita este archivo y pega tu API Key de Brevo');
  console.log('\nAbre: scripts/get-brevo-templates-simple.js');
  console.log('Busca la línea: const apiKey = ...');
  console.log('Reemplaza TU_API_KEY_AQUI con tu API Key real');
  process.exit(1);
}

const options = {
  hostname: 'api.brevo.com',
  path: '/v3/smtp/templates',
  method: 'GET',
  headers: {
    'accept': 'application/json',
    'api-key': apiKey.trim()
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
        console.log('💡 Agrega estos IDs a tu .env.local:');
        console.log('');
        console.log('BREVO_API_KEY=' + apiKey);
        console.log('BREVO_TEMPLATE_EN=<ID_del_template_en_ingles>');
        console.log('BREVO_TEMPLATE_ES=<ID_del_template_en_espanol>');
        console.log('');
      } else {
        console.log('⚠️  No se encontraron templates');
        console.log('Respuesta completa:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error al parsear respuesta:', error.message);
      console.log('Respuesta recibida:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error.message);
});

req.end();
