import { useState, useEffect } from 'react';
import { useCapacitor } from '../hooks/useCapacitor';
import { showToast } from '../utils/capacitorUtils';

const CapacitorDemo = () => {
  const { isNative, platform, isAndroid, isIOS, isWeb } = useCapacitor();
  const [message, setMessage] = useState('');

  const handleShowToast = async () => {
    if (message.trim()) {
      await showToast(message);
      setMessage('');
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Capacitor Platform Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">Platform Detection</h3>
          <p className="text-blue-600 dark:text-blue-300">
            Running on: <span className="font-mono">{platform}</span>
          </p>
        </div>
        
        <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200">Environment Status</h3>
          <ul className="text-green-600 dark:text-green-300">
            <li>Native: {isNative ? 'Yes' : 'No'}</li>
            <li>Android: {isAndroid ? 'Yes' : 'No'}</li>
            <li>iOS: {isIOS ? 'Yes' : 'No'}</li>
            <li>Web: {isWeb ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Native Toast Demo</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message for toast"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleShowToast}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Show Toast
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Capacitor Integration Notes</h3>
        <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 mt-2">
          <li>This app is ready for Android conversion using Capacitor</li>
          <li>All necessary dependencies are installed</li>
          <li>Service worker is configured to work in both web and native environments</li>
          <li>Native features will be automatically enabled when running on Android</li>
        </ul>
      </div>
    </div>
  );
};

export default CapacitorDemo;