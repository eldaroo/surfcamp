#!/bin/bash
# WeTravel Webhook Production Setup Script

set -e  # Exit on any error

echo "🚀 Setting up WeTravel Webhook Production Environment"

# 1. Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install express pg crypto

# 2. Create database schema
echo "🗄️ Setting up database schema..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ WARNING: DATABASE_URL not set. Please configure before running database setup."
    echo "Example: export DATABASE_URL='postgresql://user:pass@localhost:5432/surfcamp'"
else
    echo "Creating database tables..."
    psql $DATABASE_URL -f database/wetravel_schema.sql
    echo "✅ Database schema created successfully"
fi

# 3. Check environment variables
echo "🔧 Checking environment configuration..."
if [ -z "$WETRAVEL_WEBHOOK_SECRET" ] && [ -z "$WETRAVEL_WEBHOOK_TOKEN" ]; then
    echo "⚠️ WARNING: Neither WETRAVEL_WEBHOOK_SECRET nor WETRAVEL_WEBHOOK_TOKEN is set"
    echo "Please configure at least one for security:"
    echo "  export WETRAVEL_WEBHOOK_SECRET='your_hmac_secret_from_wetravel'"
    echo "  OR"
    echo "  export WETRAVEL_WEBHOOK_TOKEN='your_secure_random_token'"
else
    echo "✅ Webhook security configured"
fi

# 4. Test database connection
echo "🔍 Testing database connection..."
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        exit 1
    fi
fi

# 5. Create systemd service (optional)
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/wetravel-webhook.service > /dev/null <<EOF
[Unit]
Description=WeTravel Webhook Handler
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server/wetravel-webhook.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
$([ ! -z "$DATABASE_URL" ] && echo "Environment=DATABASE_URL=$DATABASE_URL")
$([ ! -z "$WETRAVEL_WEBHOOK_SECRET" ] && echo "Environment=WETRAVEL_WEBHOOK_SECRET=$WETRAVEL_WEBHOOK_SECRET")
$([ ! -z "$WETRAVEL_WEBHOOK_TOKEN" ] && echo "Environment=WETRAVEL_WEBHOOK_TOKEN=$WETRAVEL_WEBHOOK_TOKEN")

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable and start service
echo "🔄 Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable wetravel-webhook
sudo systemctl start wetravel-webhook

# 7. Test the endpoint
echo "🧪 Testing webhook endpoint..."
sleep 2
curl -f http://localhost:3000/api/wetravel-webhook/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Webhook endpoint is responding"
else
    echo "❌ Webhook endpoint test failed"
    echo "Check service status: sudo systemctl status wetravel-webhook"
    echo "Check logs: sudo journalctl -u wetravel-webhook -f"
fi

echo ""
echo "🎉 Production setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your reverse proxy (nginx/Apache) to forward requests"
echo "2. Register webhook in WeTravel admin:"
echo "   URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook"
echo "   Events: payment.created, payment.updated"
echo "3. Test with WeTravel's webhook test feature"
echo "4. Monitor logs: sudo journalctl -u wetravel-webhook -f"
echo ""
echo "Webhook URL: https://surfcampwidget.duckdns.org/api/wetravel-webhook"
echo "Health check: https://surfcampwidget.duckdns.org/api/wetravel-webhook/health"