import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-8xl md:text-9xl font-extrabold text-gray-200 dark:text-gray-800 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Search className="h-20 w-20 md:h-24 md:w-24 text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or the URL is incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        <p className="mt-10 text-sm text-gray-500 dark:text-gray-400">Error code: 404</p>
      </div>
    </div>
  );
};

export default NotFound;
