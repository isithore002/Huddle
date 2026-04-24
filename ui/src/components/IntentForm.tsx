'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function IntentForm({ onSubmit }: { onSubmit: (hash: string) => void }) {
  const [product, setProduct] = useState('65" LG OLED TV');
  const [budget, setBudget] = useState('1800');
  const [days, setDays] = useState([5]);

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product,
          maxPrice: parseInt(budget),
          daysToWait: days[0]
        })
      });
      
      if (!res.ok) {
        console.error('Backend returned an error. Ensure buyer-agent is running.');
        toast.error('Connection Failed', { description: 'Please make sure node src/buyer-agent/index.js is running in another terminal.' });
        return;
      }
      
      const data = await res.json();
      if (data.hash) onSubmit(data.hash);
    } catch (e) {
      console.error(e);
      toast.error('Network Error', { description: 'Could not connect to the API. Is your backend running?' });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-white/10 bg-black/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-light tracking-tight">
          <ShoppingCart className="w-6 h-6 text-purple-400" />
          What do you want to buy?
        </CardTitle>
        <CardDescription className="text-zinc-400">Specify your request and let Huddle agent form a coalition.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Product</label>
          <Input 
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="bg-black/50 border-white/10 focus-visible:ring-purple-500 text-lg py-6"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Budget Limit ($)</label>
            <Input 
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-black/50 border-white/10"
            />
          </div>
          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-300">Wait up to: {days} days</label>
            <Slider 
              value={days}
              onValueChange={(val) => setDays(val as number[])}
              max={14}
              min={1}
              step={1}
              className="py-2"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-lg bg-white text-black hover:bg-zinc-200"
        >
          Find Coalition
        </Button>
      </CardFooter>
    </Card>
  );
}
