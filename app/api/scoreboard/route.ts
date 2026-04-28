import { NextResponse } from "next/server";

type CompletionRecord = {
  teamName: string;
  points: number;
  completedAt: string;
  elapsedSeconds: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __escapeRecords: CompletionRecord[] | undefined;
}

const getStore = () => {
  if (!global.__escapeRecords) global.__escapeRecords = [];
  return global.__escapeRecords;
};

export async function GET() {
  const data = [...getStore()].sort((a, b) => b.points - a.points || a.elapsedSeconds - b.elapsedSeconds);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CompletionRecord;
  const store = getStore();
  store.push(body);
  return NextResponse.json({ ok: true });
}
