import { NextResponse } from "next/server";
import dataset from "@/data/company_questions_dataset.json";

export async function GET() {
  const companies = Object.keys(dataset).sort();
  return NextResponse.json({ count: companies.length, companies });
}
