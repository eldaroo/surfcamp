'use client';

import { motion } from 'framer-motion';
import { Waves, Sun, Mountain } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-surf-gradient rounded-full flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-sand-400 rounded-full flex items-center justify-center">
                <Sun className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">SurfCamp Santa Teresa</h1>
              <p className="text-sm text-gray-600">Powered by zeneidas</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              Inicio
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              Actividades
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              Alojamiento
            </a>
            <a href="#" className="text-gray-700 hover:text-ocean-600 transition-colors">
              Contacto
            </a>
          </nav>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Mountain className="w-4 h-4" />
              <span>Santa Teresa, Costa Rica</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <span>+541153695627</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
} 