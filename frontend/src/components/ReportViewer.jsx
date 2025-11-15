import React, { useState, useEffect } from 'react';
import { FileText, Edit, Download, Eye, Save, X } from 'lucide-react';
import axios from 'axios';

const ReportViewer = ({ jobId, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [jobId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reports/${jobId}/data`);
      setReportData(response.data);
      setEditedData(JSON.parse(JSON.stringify(response.data))); // Deep copy
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report data');
      setLoading(false);
    }
  };

  const handleEdit = (section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [field]: value
        }
      }
    }));
  };

  const handleListEdit = (section, field, index, value) => {
    const newList = [...editedData.sections[section][field]];
    newList[index] = value;
    setEditedData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [field]: newList
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(`http://localhost:5000/api/reports/${jobId}/data`, editedData);
      setReportData(editedData);
      setEditMode(false);
      setSaving(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      const response = await axios.post(
        `http://localhost:5000/api/reports/${jobId}/preview`,
        editedData,
        { responseType: 'blob' }
      );

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setPreviewing(false);
    } catch (err) {
      setError('Failed to generate preview');
      setPreviewing(false);
    }
  };

  const handleDownload = () => {
    window.open(`http://localhost:5000/api/reports/${jobId}/download`, '_blank');
  };

  const handleCancel = () => {
    setEditedData(JSON.parse(JSON.stringify(reportData)));
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <span className="ml-4 text-gray-300">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentData = editMode ? editedData : reportData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-primary-500 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-white">Brand DNA Report</h2>
              <p className="text-gray-400 text-sm mt-1">
                {currentData?.brands?.join(' vs ')} • {new Date(currentData?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 p-4 bg-gray-750 border-b border-gray-700">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Report
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                {previewing ? 'Generating...' : 'Preview PDF'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Report Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Executive Summary */}
          <Section title="1. Executive Summary" editMode={editMode}>
            <Field
              label="Overview"
              value={currentData?.sections?.executive_summary?.overview}
              editMode={editMode}
              multiline
              onChange={(value) => handleEdit('executive_summary', 'overview', value)}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Key Findings</label>
              {currentData?.sections?.executive_summary?.key_findings?.map((finding, idx) => (
                <Field
                  key={idx}
                  label={`Finding ${idx + 1}`}
                  value={finding}
                  editMode={editMode}
                  onChange={(value) => handleListEdit('executive_summary', 'key_findings', idx, value)}
                />
              ))}
            </div>

            <Field
              label="Strategic Implications"
              value={currentData?.sections?.executive_summary?.strategic_implications}
              editMode={editMode}
              multiline
              onChange={(value) => handleEdit('executive_summary', 'strategic_implications', value)}
            />
          </Section>

          {/* Visual DNA */}
          <Section title="2. Visual DNA Comparison" editMode={editMode}>
            {currentData?.sections?.visual_dna?.brands?.map((brand, idx) => (
              <div key={idx} className="mb-4 p-4 bg-gray-750 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">{brand.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Logos Collected:</span>
                    <span className="text-white ml-2">{brand.logo_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Screenshots:</span>
                    <span className="text-white ml-2">{brand.screenshot_count}</span>
                  </div>
                </div>
                {brand.colors?.primary_colors && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Primary Colors:</span>
                    <div className="flex gap-2 mt-2">
                      {brand.colors.primary_colors.map((color, cidx) => (
                        <div
                          key={cidx}
                          className="w-12 h-12 rounded border border-gray-600"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* Creative DNA */}
          <Section title="3. Creative DNA Analysis" editMode={editMode}>
            {currentData?.sections?.creative_dna?.brands?.map((brand, idx) => (
              <div key={idx} className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">{brand.name}</h4>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Messaging Themes</label>
                  {brand.messaging_themes?.map((theme, tidx) => (
                    <div key={tidx} className="text-gray-300 mb-1">• {theme}</div>
                  ))}
                </div>

                <Field
                  label="Tone and Voice"
                  value={brand.tone_and_voice}
                  editMode={editMode}
                  multiline
                  onChange={(value) => {
                    const newBrands = [...editedData.sections.creative_dna.brands];
                    newBrands[idx].tone_and_voice = value;
                    setEditedData(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        creative_dna: { ...prev.sections.creative_dna, brands: newBrands }
                      }
                    }));
                  }}
                />

                <Field
                  label="Visual Patterns"
                  value={brand.visual_patterns}
                  editMode={editMode}
                  multiline
                  onChange={(value) => {
                    const newBrands = [...editedData.sections.creative_dna.brands];
                    newBrands[idx].visual_patterns = value;
                    setEditedData(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        creative_dna: { ...prev.sections.creative_dna, brands: newBrands }
                      }
                    }));
                  }}
                />
              </div>
            ))}
          </Section>

          {/* Strategic Synthesis */}
          <Section title="4. Strategic Synthesis" editMode={editMode}>
            <Field
              label="Market Opportunities"
              value={currentData?.sections?.strategic_synthesis?.market_opportunities}
              editMode={editMode}
              multiline
              onChange={(value) => handleEdit('strategic_synthesis', 'market_opportunities', value)}
            />

            <Field
              label="White Space Analysis"
              value={currentData?.sections?.strategic_synthesis?.white_space_analysis}
              editMode={editMode}
              multiline
              onChange={(value) => handleEdit('strategic_synthesis', 'white_space_analysis', value)}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Recommendations</label>
              {currentData?.sections?.strategic_synthesis?.recommendations?.map((rec, idx) => (
                <Field
                  key={idx}
                  label={`Recommendation ${idx + 1}`}
                  value={rec}
                  editMode={editMode}
                  onChange={(value) => handleListEdit('strategic_synthesis', 'recommendations', idx, value)}
                />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Section = ({ title, children, editMode }) => (
  <div className="mb-8">
    <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b-2 border-primary-500">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({ label, value, editMode, multiline, onChange }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    {editMode ? (
      multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-primary-500"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-primary-500"
        />
      )
    ) : (
      <div className="text-gray-300 whitespace-pre-wrap">{value || 'No data available'}</div>
    )}
  </div>
);

export default ReportViewer;
