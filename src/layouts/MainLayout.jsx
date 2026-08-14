import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';

const MainLayout = () => {
  const location = useLocation();
  const hideFooter = location.pathname === '/assessment/question';

  return (
    <div className="min-h-screen bg-brand-light flex flex-col font-sans overflow-x-hidden">
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
