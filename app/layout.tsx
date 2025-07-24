import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-sand-50">
          {children}
        </div>
        
        {/* Script para comunicación de altura dinámica con Tilda */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let lastHeight = 0;
                let isSending = false;
                
                function sendHeight() {
                  if (isSending) return;
                  isSending = true;
                  
                  // Calcular altura real del contenido
                  const height = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight
                  );
                  
                  // Solo enviar si la altura cambió significativamente
                  if (Math.abs(height - lastHeight) > 50) {
                    lastHeight = height;
                    window.parent.postMessage({ widgetHeight: height }, "*");
                    console.log('📏 Enviando altura al padre:', height + 'px');
                  }
                  
                  // Reset flag después de un delay
                  setTimeout(() => {
                    isSending = false;
                  }, 200);
                }
                
                // Enviar altura cuando la página carga
                window.addEventListener("load", function() {
                  setTimeout(sendHeight, 1000);
                });
                
                // Enviar altura cuando cambia el tamaño de la ventana
                window.addEventListener("resize", function() {
                  setTimeout(sendHeight, 300);
                });
                
                // Enviar altura inicial después de un delay largo
                setTimeout(sendHeight, 2000);
                
                // Enviar altura cada 5 segundos como backup
                setInterval(sendHeight, 5000);
              })();
            `
          }}
        />
      </body>
    </html>
  );
} 