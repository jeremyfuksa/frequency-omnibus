import React, { useState, useEffect } from 'react';
import { FrequencyData, Category } from '../types/database';
import { DatabaseService } from '../lib/database/DatabaseService';
import { FrequencyDataForm } from '../components/FrequencyDataForm';

export const Dashboard: React.FC = () => {
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date()
  });

  useEffect(() => {
    const loadData = async () => {
      const db = DatabaseService.getInstance();
      const data = await db.getFrequencyData(
        selectedCategory || undefined,
        dateRange.start,
        dateRange.end
      );
      setFrequencyData(data);
    };
    loadData();
  }, [selectedCategory, dateRange]);

  useEffect(() => {
    const loadCategories = async () => {
      const db = DatabaseService.getInstance();
      const cats = await db.getCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const handleSubmit = async (data: FrequencyData) => {
    const db = DatabaseService.getInstance();
    await db.addFrequencyData(data);
    const updatedData = await db.getFrequencyData(
      selectedCategory || undefined,
      dateRange.start,
      dateRange.end
    );
    setFrequencyData(updatedData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Frequency Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Data</h2>
          <FrequencyDataForm onSubmit={handleSubmit} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="space-y-4 bg-white p-4 rounded-lg shadow">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="date-start" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="date-start"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  start: new Date(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="date-end" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="date-end"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  end: new Date(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Frequency Data</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {frequencyData.map(data => (
                <tr key={data.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(data.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.id === data.category)?.name || data.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.metadata?.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 
