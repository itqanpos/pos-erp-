/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { POS } from '@/pages/POS';
import { Inventory } from '@/pages/Inventory';
import { SalesHistory } from '@/pages/SalesHistory';
import { Settings } from '@/pages/Settings';
import { Placeholder } from '@/pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<SalesHistory />} />
          <Route path="customers" element={<Placeholder />} />
          <Route path="reports" element={<Placeholder />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
