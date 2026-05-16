import React from 'react';
import ManagementSidebar from '../components/ManagementSidebar';
import Navbar from '../components/Navbar';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <ManagementSidebar />
        <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
