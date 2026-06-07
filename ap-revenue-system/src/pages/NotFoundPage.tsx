import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gov-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* AP Emblem placeholder */}
        <div className="w-24 h-24 rounded-full bg-ap-blue/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-ap-blue">404</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5"
          >
            <Home size={16} /> Dashboard
          </button>
        </div>
        <div className="mt-8 text-xs text-gray-400">
          AP Revenue Department — ICAMS v1.0
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
