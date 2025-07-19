import React, { useState } from 'react';
import { useBookingStore } from '@/lib/store';

const ContactForm: React.FC = () => {
  const { setBookingData, setCurrentStep, bookingData } = useBookingStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dni: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.dni) {
      setError('Completa todos los campos');
      return;
    }
    setBookingData({ contactInfo: form });
    setCurrentStep('confirmation');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Tus datos de contacto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Nombre</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Apellido</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Teléfono</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">DNI</label>
          <input name="dni" value={form.dni} onChange={handleChange} className="input-field w-full" />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" className="btn-primary w-full">Continuar</button>
      </form>
    </div>
  );
};

export default ContactForm; 