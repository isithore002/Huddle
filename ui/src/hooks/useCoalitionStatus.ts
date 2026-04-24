import { useEffect, useState } from 'react';

export function useCoalitionStatus(intentHash: string) {
  const [status, setStatus] = useState({ 
    count: 0, 
    target: 10, 
    status: 'FORMING', 
    deal: null 
  });

  useEffect(() => {
    if (!intentHash) return;

    const es = new EventSource(`/api/coalition/stream?hash=${intentHash}`);
    
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setStatus((prev) => ({ ...prev, ...data }));
        
        // Close on terminal states
        if (data.status === 'DEAL_FOUND' || data.status === 'EXPIRED' || data.status === 'DEAL_ACCEPTED') {
          es.close();
        }
      } catch (err) {
        console.error('SSE Parse Error', err);
      }
    };
    
    return () => es.close();
  }, [intentHash]);

  return status;
}
