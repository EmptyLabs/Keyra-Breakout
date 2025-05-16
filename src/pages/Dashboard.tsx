import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const Dashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;