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
                let sendTimeout = null;
                
                function sendHeight() {
                  // Calcular altura real del contenido
                  const bodyHeight = document.body.scrollHeight;
                  const htmlHeight = document.documentElement.scrollHeight;
                  const height = Math.max(bodyHeight, htmlHeight);
                  
                  // Solo enviar si la altura cambió significativamente
                  if (Math.abs(height - lastHeight) > 10) {
                    lastHeight = height;
                    window.parent.postMessage({ widgetHeight: height }, "*");
                    console.log('📏 Enviando altura al padre:', height + 'px');
                  }
                }
                
                // Función debounced para evitar spam
                function debouncedSendHeight() {
                  if (sendTimeout) clearTimeout(sendTimeout);
                  sendTimeout = setTimeout(sendHeight, 100);
                }
                
                // Enviar altura cuando la página carga
                window.addEventListener("load", debouncedSendHeight);
                
                // Enviar altura cuando cambia el tamaño de la ventana
                window.addEventListener("resize", debouncedSendHeight);
                
                // Observer para cambios de contenido (más específico)
                const observer = new MutationObserver(function(mutations) {
                  let shouldUpdate = false;
                  
                  mutations.forEach(function(mutation) {
                    // Solo actualizar si son cambios relevantes
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                      shouldUpdate = true;
                    } else if (mutation.type === 'attributes' && 
                             (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                      // Verificar si el cambio afecta la altura
                      const target = mutation.target;
                      if (target && (target.style.height || target.style.display || target.className)) {
                        shouldUpdate = true;
                      }
                    }
                  });
                  
                  if (shouldUpdate) {
                    debouncedSendHeight();
                  }
                });
                
                // Observar solo el contenido principal, no todo el body
                const mainContent = document.querySelector('main') || document.body;
                observer.observe(mainContent, { 
                  childList: true, 
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['style', 'class']
                });
                
                // Enviar altura inicial después de un delay
                setTimeout(debouncedSendHeight, 500);
              })();
            `
          }}
        />
      </body>
    </html>
  );
} 