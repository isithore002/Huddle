import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { productId, maxPrice, daysToWait } = await req.json();

  // Forward to your local buyer-agent on port 3001
  const res = await fetch('http://127.0.0.1:3001/submit-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, maxPrice, daysToWait })
  });

  const data = await res.json();
  return NextResponse.json(data);
}
