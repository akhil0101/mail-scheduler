import { useEffect, useState } from 'react';
import { Clock, Send, RefreshCw } from 'lucide-react';
import { scheduleApi, templatesApi } from '../lib/api';

interface ScheduleConfig {
  id: string;
  cronTime: string;
  timezone: string;
  isActive: boolean;
}

interface Template {
  id: string;
  name: string;
  isActive: boolean;
}

interface EmailLog {
  id: string;
  subscriberId: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  error?: string;
  sentAt: string;
}

const commonSchedules = [
  { label: 'Every day at 9 AM', cron: '0 9 * * *' },
  { label: 'Every day at 6 PM', cron: '0 18 * * *' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
  { label: 'Every hour', cron: '0 * * * *' },
];

export default function Schedule() {
  const [config, setConfig] = useState<ScheduleConfig | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({
    cronTime: '0 9 * * *',
    timezone: 'UTC',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configRes, templatesRes, logsRes] = await Promise.all([
        scheduleApi.get(),
        templatesApi.getAll(),
        scheduleApi.getLogs(50),
      ]);
      
      if (configRes.data) {
        setConfig(configRes.data);
        setFormData({
          cronTime: configRes.data.cronTime,
          timezone: configRes.data.timezone,
          isActive: configRes.data.isActive,
        });
      }
      setTemplates(templatesRes.data);
      setLogs(logsRes.data);
      
      const activeTemplate = templatesRes.data.find((t: Template) => t.isActive);
      if (activeTemplate) {
        setSelectedTemplate(activeTemplate.id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleApi.update(formData);
      fetchData();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const handleManualSend = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    if (!confirm('This will send emails to all active subscribers. Continue?')) {
      return;
    }

    setIsSending(true);
    try {
      const res = await scheduleApi.send(selectedTemplate);
      alert(`Emails sent: ${res.data.sent} successful, ${res.data.failed} failed`);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Schedule</h1>
        <p className="text-gray-600 mt-1">Configure when emails are sent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Config */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Schedule Configuration</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cron Expression
              </label>
              <input
                type="text"
                value={formData.cronTime}
                onChange={(e) => setFormData({ ...formData, cronTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Format: minute hour day month weekday
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {commonSchedules.map((schedule) => (
                  <button
                    key={schedule.cron}
                    type="button"
                    onClick={() => setFormData({ ...formData, cronTime: schedule.cron })}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                      formData.cronTime === schedule.cron
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {schedule.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Enable scheduled emails
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Schedule
            </button>
          </form>
        </div>

        {/* Manual Send */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Send className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Manual Send</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleManualSend}
              disabled={isSending || !selectedTemplate}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Now
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              This will send the selected template to all active subscribers
            </p>
          </div>
        </div>
      </div>

      {/* Email Logs */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Email Logs</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Sent At</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No email logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-gray-900">{log.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'SENT'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600 text-sm">{log.error || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
