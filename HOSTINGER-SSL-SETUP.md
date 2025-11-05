# Configurar HTTPS en Hostinger para Webhooks

## Problema
Tu servidor responde en HTTP (puerto 80) pero no en HTTPS (puerto 443).
WeTravel requiere HTTPS para los webhooks.

## Solución: Instalar certificado SSL con Let's Encrypt

### Paso 1: Conectar por SSH a tu servidor Hostinger

```bash
ssh tu-usuario@31.97.100.1
```

### Paso 2: Instalar Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Paso 3: Obtener certificado SSL

```bash
sudo certbot --nginx -d surfcampwidget.duckdns.org
```

Certbot te preguntará:
1. Tu email (para renovaciones)
2. Aceptar términos (y)
3. Si querés redirigir HTTP a HTTPS (2 = sí, RECOMENDADO)

### Paso 4: Verificar que funcione

```bash
# Verificar que nginx se reinició correctamente
sudo systemctl status nginx

# Probar el certificado
curl -I https://surfcampwidget.duckdns.org
```

### Paso 5: Configurar renovación automática

Certbot instala un cronjob automático, pero verificalo:

```bash
sudo systemctl status certbot.timer
```

## Verificación Final

Una vez configurado SSL, probá el webhook desde tu máquina local:

```bash
curl -I https://surfcampwidget.duckdns.org/api/wetravel-webhook
```

Deberías ver:
```
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
```

## Si no tenés acceso SSH

Si Hostinger no te da acceso SSH, podés:

1. **Ir al panel de Hostinger** → SSL → Activar SSL gratuito
2. O usar **Cloudflare** (gratis) que provee SSL automático

### Opción Cloudflare (sin SSH):

1. Crear cuenta en cloudflare.com
2. Agregar tu dominio surfcampwidget.duckdns.org
3. Cambiar nameservers en DuckDNS a los de Cloudflare
4. Activar SSL en modo "Full (strict)"

## Configurar Webhook en WeTravel

Una vez que HTTPS funcione, actualizá la URL del webhook en WeTravel:

```
https://surfcampwidget.duckdns.org/api/wetravel-webhook
```

## Troubleshooting

### Si certbot falla con "too many requests"
DuckDNS a veces tiene límites de Let's Encrypt. Esperá 1 hora y volvé a intentar.

### Si nginx no reinicia
```bash
# Ver errores
sudo nginx -t

# Si hay errores de configuración
sudo nano /etc/nginx/sites-available/default
```

### Verificar que el puerto 443 esté abierto
```bash
sudo ufw status
sudo ufw allow 443/tcp
```
