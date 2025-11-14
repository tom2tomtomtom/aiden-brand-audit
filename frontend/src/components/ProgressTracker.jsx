import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Download, AlertCircle } from 'lucide-react';

const ProgressTracker = ({ socket, jobId, onComplete }) => {
  const [status, setStatus] = useState('queued');
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, brand: '' });
  const [reportPath, setReportPath] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !jobId) return;

    // Subscribe to job updates
    socket.emit('subscribe_job', { job_id: jobId });

    // Listen for progress updates
    socket.on('analysis_progress', (data) => {
      if (data.job_id === jobId) {
        setLogs((prev) => [...prev, data.log]);
      }
    });

    // Listen for status updates
    socket.on('job_status', (data) => {
      if (data.job_id === jobId) {
        setStatus(data.status);

        if (data.status === 'completed' && data.report_path) {
          setReportPath(data.report_path);
          if (onComplete) onComplete(data.report_path);
        }

        if (data.status === 'failed' && data.error) {
          setError(data.error);
        }
      }
    });

    // Listen for progress percentage
    socket.on('job_progress', (data) => {
      if (data.job_id === jobId) {
        setProgress({
          current: data.current,
          total: data.total,
          brand: data.brand
        });
      }
    });

    return () => {
      socket.off('analysis_progress');
      socket.off('job_status');
      socket.off('job_progress');
    };
  }, [socket, jobId, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />;
      default:
        return <Circle className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Analysis Complete';
      case 'failed':
        return 'Analysis Failed';
      case 'running':
        return 'Analysis Running';
      default:
        return 'Queued';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-primary-400';
      default:
        return 'text-slate-400';
    }
  };

  const handleDownload = () => {
    if (reportPath && jobId) {
      window.open(`http://localhost:5000/api/reports/${jobId}/download`, '_blank');
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className={`text-xl font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </h3>
            {progress.total > 0 && (
              <p className="text-sm text-slate-400">
                Processing {progress.brand} ({progress.current}/{progress.total})
              </p>
            )}
          </div>
        </div>

        {status === 'completed' && reportPath && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/30"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {status === 'running' && progress.total > 0 && (
        <div className="mb-6">
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Logs */}
      <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Activity Log</h4>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">Waiting for updates...</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`text-sm font-mono ${
                  log.level === 'error'
                    ? 'text-red-400'
                    : log.level === 'success'
                    ? 'text-green-400'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600 mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
