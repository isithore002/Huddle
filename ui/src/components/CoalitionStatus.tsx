'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Users } from 'lucide-react';
import { useCoalitionStatus } from '@/hooks/useCoalitionStatus';

export default function CoalitionStatus({ hash, onDealFound }: { hash: string, onDealFound: (data: any) => void }) {
  const statusInfo = useCoalitionStatus(hash);
  const percentage = Math.min(100, Math.round((statusInfo.count / statusInfo.target) * 100));

  // Bubble up when deal is found
  if (statusInfo.status === 'DEAL_FOUND' && statusInfo.deal) {
    onDealFound(statusInfo.deal);
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-white/10 bg-black/40 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-light tracking-tight">
          <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
          Coalition Forming...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-end pb-2">
          <div className="text-lg font-medium text-white tracking-wide truncate pr-4">
            LG OLED 65"
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Users className="w-4 h-4" />
            <span className="font-mono">{statusInfo.count} / {statusInfo.target} buyers</span>
          </div>
        </div>

        <div className="space-y-3">
          <Progress value={percentage} className="h-4 bg-white/10" />
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">
              {percentage >= 100 ? 'Threshold met, negotiating...' : `Waiting for ${statusInfo.target - statusInfo.count} more...`}
            </span>
            <span className="font-mono text-purple-400">{percentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Est. Discount</p>
            <p className="text-xl font-light text-green-400">~15%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Est. Price</p>
            <p className="text-xl font-light text-white">~$1,530</p>
          </div>
        </div>

        <Badge variant="outline" className="w-full justify-center py-2 bg-white/5 border-white/10 text-zinc-300 gap-2">
          <Clock className="w-3 h-3" />
          Deadline: 4d 12h remaining
        </Badge>
      </CardContent>
    </Card>
  );
}
