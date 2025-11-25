import { useState } from 'react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface UseContactForm {
  formData: ContactForm;
  loading: boolean;
  error: string | null;
  success: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  resetForm: () => void;
}

const initialFormState: ContactForm = {
  name: '',
  email: '',
  subject: '',
  message: ''
};

export const useContactForm = (): UseContactForm => {
  const [formData, setFormData] = useState<ContactForm>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setError(null);
    setSuccess(false);
  };

  return {
    formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    resetForm
  };
};
