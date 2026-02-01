import { useState } from 'react';
import { ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { gmailApi } from '../lib/api';

export default function Settings() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleGetAuthUrl = async () => {
    try {
      const res = await gmailApi.getAuthUrl();
      window.open(res.data.authUrl, '_blank');
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const res = await gmailApi.test();
      setConnectionStatus('success');
      setConnectionMessage(res.data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setConnectionStatus('error');
      setConnectionMessage(error.response?.data?.error || 'Connection failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your Gmail OAuth2 integration</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Gmail OAuth Setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gmail OAuth2 Setup</h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Gmail API</li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>Add <code className="bg-blue-100 px-1 rounded">http://localhost:3001/api/gmail/callback</code> as an authorized redirect URI</li>
                <li>Copy Client ID and Client Secret to your <code className="bg-blue-100 px-1 rounded">.env</code> file</li>
                <li>Click "Authorize Gmail" below to get your refresh token</li>
              </ol>
            </div>

            <button
              onClick={handleGetAuthUrl}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Authorize Gmail
            </button>

            <p className="text-sm text-gray-500">
              After authorization, you'll receive a refresh token. Add it to your <code className="bg-gray-100 px-1 rounded">.env</code> file as <code className="bg-gray-100 px-1 rounded">GMAIL_REFRESH_TOKEN</code>.
            </p>
          </div>
        </div>

        {/* Test Connection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Connection</h2>

          <div className="space-y-4">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Test Gmail Connection
                </>
              )}
            </button>

            {connectionStatus && (
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  connectionStatus === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {connectionStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={
                    connectionStatus === 'success' ? 'text-green-800' : 'text-red-800'
                  }
                >
                  {connectionMessage}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Environment Variables</h2>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
{`# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mailscheduler"

# JWT Secret
JWT_SECRET="your-secret-key"

# Gmail OAuth2
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3001/api/gmail/callback"
GMAIL_REFRESH_TOKEN="your-refresh-token"
EMAIL_FROM="your-email@gmail.com"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
