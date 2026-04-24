export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get('hash'); // Extract hash identifier to query

  const stream = new ReadableStream({
    async start(controller) {
      // Poll buyer-agent for coalition updates
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:3001/coalition-status?hash=${hash || ''}`);
          if (!res.ok) throw new Error('API error');
          
          const data = await res.json();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
          if (data.status === 'DEAL_FOUND' || data.status === 'EXPIRED' || data.status === 'DEAL_ACCEPTED') {
            clearInterval(interval);
            controller.close();
          }
        } catch (err) {
          // If the backend drops out, gracefully swallow the fetch error and keep polling
        }
      }, 1000);

      // Clean up if the client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
