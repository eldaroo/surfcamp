import { Inter, Roboto } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${roboto.variable} font-roboto`}>
        <div className="min-h-screen bg-gradient-to-br from-warm-50 via-accent-50 to-warm-100 relative overflow-hidden">
          {/* Efectos de fondo orgánicos */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-warm-200 rounded-full blur-xl"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-accent-200 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-warm-400 rounded-full blur-xl"></div>
            <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-accent-200 rounded-full blur-xl"></div>
          </div>
          
          <div className="relative z-10">
            <Providers>
              {children}
            </Providers>
          </div>
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