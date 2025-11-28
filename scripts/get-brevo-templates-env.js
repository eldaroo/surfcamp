/**
 * Script para obtener templates de Brevo usando .env.local
 *
 * Instrucciones:
 * 1. Asegúrate de tener BREVO_API_KEY en tu archivo .env.local
 * 2. Ejecuta: node scripts/get-brevo-templates-env.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local');
  console.log('\nCrea un archivo .env.local en la raíz del proyecto con:');
  console.log('BREVO_API_KEY=tu_api_key_aqui');
  process.exit(1);
}

// Parse .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const apiKey = (envVars.BREVO_API_KEY || '').trim();

if (!apiKey) {
  console.error('❌ Error: BREVO_API_KEY no está definida en .env.local');
  console.log('\nAgrega esta línea a tu archivo .env.local:');
  console.log('BREVO_API_KEY=tu_api_key_aqui');
  process.exit(1);
}

console.log('✅ API Key encontrada en .env.local');

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

      if (response.code === 'unauthorized') {
        console.error('❌ Error de autorización');
        console.log('\n' + response.message);
        console.log('\nPosibles soluciones:');
        console.log('1. Ve a: https://app.brevo.com/security/authorised_ips');
        console.log('2. Deshabilita las restricciones de IP, o');
        console.log('3. Agrega tu IP actual a la lista de IPs autorizadas');
        process.exit(1);
      }

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
        console.log('BREVO_TEMPLATE_EN=<ID_del_template_en_ingles>');
        console.log('BREVO_TEMPLATE_ES=<ID_del_template_en_espanol>');
        console.log('');
      } else {
        console.log('⚠️  No se encontraron templates');
        if (response.message) {
          console.log('Mensaje:', response.message);
        }
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
