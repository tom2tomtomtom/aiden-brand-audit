import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';

const BrandForm = ({ onSubmit, isAnalyzing }) => {
  const [brands, setBrands] = useState([
    { name: '', website: '', facebook_page: '' }
  ]);

  const addBrand = () => {
    setBrands([...brands, { name: '', website: '', facebook_page: '' }]);
  };

  const removeBrand = (index) => {
    if (brands.length > 1) {
      setBrands(brands.filter((_, i) => i !== index));
    }
  };

  const updateBrand = (index, field, value) => {
    const updated = [...brands];
    updated[index][field] = value;
    setBrands(updated);
  };

  const loadExample = () => {
    setBrands([
      {
        name: 'Nike',
        website: 'https://nike.com',
        facebook_page: 'nike'
      },
      {
        name: 'Adidas',
        website: 'https://adidas.com',
        facebook_page: 'adidas'
      },
      {
        name: 'Under Armour',
        website: 'https://underarmour.com',
        facebook_page: 'UnderArmour'
      }
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    const validBrands = brands.filter(b => b.name && b.website);
    if (validBrands.length === 0) {
      alert('Please add at least one brand with name and website');
      return;
    }

    onSubmit(validBrands);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Brand Configuration</h2>
        <button
          type="button"
          onClick={loadExample}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Load Example
        </button>
      </div>

      <div className="space-y-4">
        {brands.map((brand, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Brand {index + 1}</h3>
              {brands.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBrand(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => updateBrand(index, 'name', e.target.value)}
                  placeholder="e.g., Nike"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website *
                </label>
                <input
                  type="url"
                  value={brand.website}
                  onChange={(e) => updateBrand(index, 'website', e.target.value)}
                  placeholder="https://nike.com"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Facebook Page
                </label>
                <input
                  type="text"
                  value={brand.facebook_page}
                  onChange={(e) => updateBrand(index, 'facebook_page', e.target.value)}
                  placeholder="nike (optional)"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={addBrand}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Another Brand
        </button>

        <button
          type="submit"
          disabled={isAnalyzing}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
            isAnalyzing
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 shadow-lg shadow-primary-500/50'
          }`}
        >
          {isAnalyzing ? 'Analysis Running...' : 'Start Brand DNA Analysis'}
        </button>
      </div>
    </form>
  );
};

export default BrandForm;
