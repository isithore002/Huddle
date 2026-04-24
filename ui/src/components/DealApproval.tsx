'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, Store, Truck, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DealApproval({ deal, onAccept, onPass }: any) {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = () => {
    setAccepted(true);
    toast.success('Deal Accepted!', {
      description: 'Triggering KeeperHub atomic commit...',
    });
    onAccept();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)] border-purple-500/30 bg-black/60 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl font-light text-white">
          <PartyPopper className="w-8 h-8 text-emerald-400" />
          Deal Found!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div>
          <h3 className="text-xl text-zinc-200">{deal?.productId || 'LG OLED 65"'}</h3>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-4xl text-white font-light tracking-tight">${deal?.finalPrice || '1,520'}</span>
            <span className="text-lg text-zinc-500 line-through">${deal?.retailPrice || '1,800'}</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-none ml-2 text-sm px-3">
              Save ${ (deal?.retailPrice || 1800) - (deal?.finalPrice || 1520) }
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300">
            <UsersIcon className="w-3 h-3 mr-1" />
            14 buyers committed
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300">
            <Store className="w-3 h-3 mr-1" />
            Best Buy
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300">
            <Truck className="w-3 h-3 mr-1" />
            3-5 day ship
          </Badge>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
          <span className="text-red-400 text-sm font-mono">Offer expires in {formatTime(timeLeft)}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-3 relative z-10">
        <Button 
          variant="outline" 
          className="flex-1 bg-transparent border-white/10 text-zinc-400 hover:text-white"
          onClick={onPass}
          disabled={accepted}
        >
          <X className="w-4 h-4 mr-2" />
          Pass
        </Button>
        <Button 
          className="flex-[2] bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
          onClick={handleAccept}
          disabled={accepted}
        >
          {accepted ? 'Accepting...' : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Accept Deal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
