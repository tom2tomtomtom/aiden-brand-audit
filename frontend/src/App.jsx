import { useState } from 'react';
import { Dna, Github, ExternalLink } from 'lucide-react';
import BrandForm from './components/BrandForm';
import ProgressTracker from './components/ProgressTracker';
import ComparisonGrid from './components/ComparisonGrid';
import { useSocket } from './hooks/useSocket';
import { startAnalysis } from './utils/api';

function App() {
  const { socket, connected } = useSocket();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [completedReports, setCompletedReports] = useState([]);

  const handleStartAnalysis = async (brands) => {
    try {
      setIsAnalyzing(true);

      const result = await startAnalysis(brands);
      setCurrentJobId(result.job_id);

      console.log('Analysis started:', result);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis. Please check your configuration and try again.');
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = (reportPath) => {
    setCompletedReports((prev) => [
      ...prev,
      {
        jobId: currentJobId,
        reportPath,
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsAnalyzing(false);
    // Keep currentJobId so ComparisonGrid can fetch data
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl shadow-lg shadow-primary-500/30">
                <Dna className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Brand DNA Analyzer</h1>
                <p className="text-slate-400 text-sm">
                  Executive-grade visual brand intelligence system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-slate-300">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* GitHub Link */}
              <a
                href="https://github.com/yourusername/brand-dna-analyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-primary-900/30 to-blue-900/30 border border-primary-500/30 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <ExternalLink className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Multi-Brand Comparison Intelligence
              </h2>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• <strong>Add multiple brands</strong> to get side-by-side competitive analysis</li>
                <li>• Automatically collects brand logos and visual identifiers</li>
                <li>• Scrapes Facebook Ad Library for up to 50 ads per brand</li>
                <li>• Captures high-quality screenshots of ad creatives</li>
                <li>• Extracts 6-color brand palettes from visual assets</li>
                <li>• <strong>View comparison grid</strong> in your browser or download PDF report</li>
                <li>• AI-powered strategic insights across all brands</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Brand Form */}
        <div className="mb-8">
          <BrandForm onSubmit={handleStartAnalysis} isAnalyzing={isAnalyzing} />
        </div>

        {/* Progress Tracker */}
        {currentJobId && isAnalyzing && (
          <div className="mb-8">
            <ProgressTracker
              socket={socket}
              jobId={currentJobId}
              onComplete={handleAnalysisComplete}
            />
          </div>
        )}

        {/* Comparison Grid - Show after analysis completes */}
        {currentJobId && !isAnalyzing && completedReports.length > 0 && (
          <div className="mb-8">
            <ComparisonGrid jobId={currentJobId} />
          </div>
        )}

        {/* Completed Reports History */}
        {completedReports.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Analysis History</h3>
            <div className="space-y-3">
              {completedReports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-900 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">Report {report.jobId}</p>
                    <p className="text-slate-400 text-sm">
                      {new Date(report.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentJobId(report.jobId);
                        setIsAnalyzing(false);
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      View Comparison
                    </button>
                    <a
                      href={`http://localhost:5000/api/reports/${report.jobId}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>Built with Apify, Playwright, Claude AI, and ReportLab</p>
            <p>Production-ready visual brand intelligence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
