'use client';
import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { useSearchParams } from 'next/navigation';
import { VendorTable } from '@/components/VendorTable';
// Provide modal for product-centric open
import { useState } from 'react';
import { VendorChatModal } from '@/components/VendorChatModal';

function VendorsPageInner() {
  const sp = useSearchParams();
  const embed = sp?.get('embed') === '1' || sp?.get('embed') === 'true';
  const [modalVendor, setModalVendor] = useState<any | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  return (
    <Layout showHeader={!embed} showSidebar={!embed}>
      <div className={`mx-auto ${embed ? '' : 'max-w-7xl'}`}>
        {!embed && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Vendor Directory
            </h1>
            <p className="text-muted-foreground">
              Complete inventory and pricing information for all available vendors
            </p>
          </div>
        )}
        <VendorTable />
        {/* Hidden modal hookup for product grid (new view will trigger these setters) */}
        <VendorChatModal isOpen={!!modalVendor} onClose={() => setModalVendor(null)} vendor={modalVendor} initialMessage={initialMessage} />
      </div>
    </Layout>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={<div />}> 
      <VendorsPageInner />
    </Suspense>
  );
}