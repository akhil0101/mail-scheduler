import { useEffect, useState } from 'react';
import { Users, Mail, CheckCircle, XCircle } from 'lucide-react';
import { subscribersApi, scheduleApi } from '../lib/api';

interface Stats {
  subscribers: { total: number; active: number; inactive: number };
  emails: { total: number; sent: number; failed: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    subscribers: { total: 0, active: 0, inactive: 0 },
    emails: { total: 0, sent: 0, failed: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [subscriberRes, emailRes] = await Promise.all([
          subscribersApi.getStats(),
          scheduleApi.getStats(),
        ]);
        setStats({
          subscribers: subscriberRes.data,
          emails: emailRes.data,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Subscribers',
      value: stats.subscribers.total,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Subscribers',
      value: stats.subscribers.active,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Emails Sent',
      value: stats.emails.sent,
      icon: Mail,
      color: 'bg-purple-500',
    },
    {
      title: 'Failed Emails',
      value: stats.emails.failed,
      icon: XCircle,
      color: 'bg-red-500',
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your email scheduler</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/subscribers"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Manage Subscribers</span>
            </a>
            <a
              href="/templates"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Edit Email Templates</span>
            </a>
            <a
              href="/schedule"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Configure Schedule</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span>Configure Gmail OAuth2 in Settings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span>Add subscribers to your list</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <span>Create an email template</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <span>Set your daily schedule</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
