import React from 'react';
import { Users, CreditCard, Trophy, DollarSign, Plus, Eye } from 'lucide-react';

const DashboardView = ({ stats }) => {

  const statItems = [
    { title: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'bg-blue-500' },
    { title: 'Pending Payments', value: stats.pendingPayments.toString(), icon: CreditCard, color: 'bg-yellow-500' },
    { title: 'Winners Announced', value: stats.winnersAnnounced.toString(), icon: Trophy, color: 'bg-green-500' },
    { title: 'Pending Withdrawals', value: stats.pendingWithdrawals.toString(), icon: DollarSign, color: 'bg-red-500' }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statItems.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      
    </div>
  );
};

export default DashboardView;
