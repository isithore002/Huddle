'use client';

import { useState } from 'react';
import IntentForm from '@/components/IntentForm';
import CoalitionStatus from '@/components/CoalitionStatus';
import DealApproval from '@/components/DealApproval';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [step, setStep] = useState<'INPUT' | 'FORMING' | 'DEAL'>('INPUT');
  const [hash, setHash] = useState<string>('');
  const [deal, setDeal] = useState<any>(null);

  const handleIntentSubmit = (newHash: string) => {
    setHash(newHash);
    setStep('FORMING');
  };

  const handleDealFound = (dealData: any) => {
    setDeal(dealData);
    setStep('DEAL');
  };

  const handleAccept = () => {
    // Call the local backend to proceed with KeeperHub execution
    // Next steps...
  };

  const handlePass = () => {
    setStep('INPUT');
    setHash('');
    setDeal(null);
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
      <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute -bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />

      <div className="z-10 w-full">
        {step === 'INPUT' && <IntentForm onSubmit={handleIntentSubmit} />}
        {step === 'FORMING' && <CoalitionStatus hash={hash} onDealFound={handleDealFound} />}
        {step === 'DEAL' && <DealApproval deal={deal} onAccept={handleAccept} onPass={handlePass} />}
      </div>

      <Toaster theme="dark" />
    </main>
  );
}
