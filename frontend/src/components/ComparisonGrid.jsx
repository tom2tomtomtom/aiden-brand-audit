import { useState, useEffect } from 'react';
import { TrendingUp, Palette, Image, MessageSquare, Download, Eye } from 'lucide-react';

const ComparisonGrid = ({ jobId }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (jobId) {
      fetchComparisonData();
    }
  }, [jobId]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/comparison`);

      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setComparisonData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 border border-slate-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="ml-4 text-slate-300">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!comparisonData || !comparisonData.brands || comparisonData.brands.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">No comparison data available</p>
      </div>
    );
  }

  const { brands, insights } = comparisonData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900/30 to-blue-900/30 border border-primary-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Brand Comparison Analysis
            </h2>
            <p className="text-slate-300">
              Comparing {brands.length} brands across visual identity, messaging, and market positioning
            </p>
          </div>
          <a
            href={`http://localhost:5000/api/reports/${jobId}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'visual', label: 'Visual Identity', icon: Palette },
          { id: 'content', label: 'Ad Content', icon: MessageSquare },
          { id: 'insights', label: 'AI Insights', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand, index) => (
            <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{brand.name}</h3>
                  <p className="text-sm text-slate-400">Brand {index + 1}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Ads Collected</span>
                  <span className="text-white font-semibold">{brand.ad_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Screenshots</span>
                  <span className="text-white font-semibold">{brand.screenshot_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Color Palette</span>
                  <span className="text-white font-semibold">{brand.colors?.length || 0} colors</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual Identity Tab */}
      {activeTab === 'visual' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Logo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Color Palette</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Dominant Color</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {brands.map((brand, index) => (
                  <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{brand.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          className="h-12 object-contain bg-white rounded p-2"
                        />
                      ) : (
                        <span className="text-slate-500 text-sm">No logo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {brand.visual_identity?.color_palette?.map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded border border-slate-600"
                            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                            title={`RGB(${color.r}, ${color.g}, ${color.b})`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {brand.visual_identity?.dominant_color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border border-slate-600"
                            style={{
                              backgroundColor: `rgb(${brand.visual_identity.dominant_color.r}, ${brand.visual_identity.dominant_color.g}, ${brand.visual_identity.dominant_color.b})`
                            }}
                          />
                          <span className="text-slate-400 text-sm">
                            RGB({brand.visual_identity.dominant_color.r}, {brand.visual_identity.dominant_color.g}, {brand.visual_identity.dominant_color.b})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Total Ads</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Screenshots Captured</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Data Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {brands.map((brand, index) => (
                  <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{brand.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{brand.ad_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{brand.screenshot_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-primary-900/30 text-primary-300 rounded text-xs">
                          {brand.ad_count} ads
                        </span>
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                          {brand.screenshot_count} images
                        </span>
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                          {brand.colors?.length || 0} colors
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {insights && Object.keys(insights).length > 0 ? (
            Object.entries(insights).map(([key, value]) => (
              <div key={key} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-3 capitalize">
                  {key.replace(/_/g, ' ')}
                </h3>
                <div className="text-slate-300 prose prose-invert max-w-none">
                  {typeof value === 'object' ? (
                    <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p>{value}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                AI insights are being processed and will appear in the PDF report.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Download the full report to see comprehensive strategic analysis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonGrid;
