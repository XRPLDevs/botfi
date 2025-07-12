import { NextResponse } from 'next/server';
// import { XummSdk } from 'xumm-sdk'

// const Sdk = new XummSdk('883b3e9d-7a8e-4005-b9a0-70f0c56024b7', 'ec1c5962-8356-4860-83d5-6a3a1e95f384')

export async function POST(_request: Request) {
  try {
    //
    return NextResponse.json({ message: 'Connection successful' }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
