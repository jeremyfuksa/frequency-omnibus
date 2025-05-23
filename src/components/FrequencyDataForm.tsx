import React, { useState, useEffect } from 'react';
import { FrequencyData, Category } from '../types/database';
import { DatabaseService } from '../lib/database/DatabaseService';

interface FrequencyDataFormProps {
  onSubmit: (data: FrequencyData) => void;
}

export const FrequencyDataForm: React.FC<FrequencyDataFormProps> = ({ onSubmit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Partial<FrequencyData>>({
    value: 0,
    category: '',
    metadata: {}
  });

  useEffect(() => {
    const loadCategories = async () => {
      const db = DatabaseService.getInstance();
      const cats = await db.getCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || formData.value === undefined) {
      alert('Please fill in all required fields');
      return;
    }

    const data: FrequencyData = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      value: formData.value,
      category: formData.category,
      metadata: formData.metadata || {}
    };

    onSubmit(data);
    setFormData({
      value: 0,
      category: '',
      metadata: {}
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? Number(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="value" className="block text-sm font-medium text-gray-700">
          Value
        </label>
        <input
          type="number"
          id="value"
          name="value"
          value={formData.value}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="metadata" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <input
          type="text"
          id="metadata"
          name="metadata"
          value={formData.metadata?.notes || ''}
          onChange={e => setFormData(prev => ({
            ...prev,
            metadata: { ...prev.metadata, notes: e.target.value }
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
}; 
