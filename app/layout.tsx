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
              function sendHeight() {
                const height = document.body.scrollHeight;
                window.parent.postMessage({ widgetHeight: height }, "*");
                console.log('📏 Enviando altura al padre:', height + 'px');
              }

              // Enviar altura cuando la página carga
              window.addEventListener("load", sendHeight);
              
              // Enviar altura cuando cambia el tamaño de la ventana
              window.addEventListener("resize", sendHeight);
              
              // Enviar altura cuando cambia el contenido (para cambios dinámicos)
              const observer = new MutationObserver(sendHeight);
              observer.observe(document.body, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
              });
              
              // Enviar altura inicial
              setTimeout(sendHeight, 100);
            `
          }}
        />
      </body>
    </html>
  );
} 