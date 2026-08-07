import { NextRequest, NextResponse } from "next/server";
import datasetRaw from "@/data/company_questions_dataset.json";

interface QuestionItem {
  id: number;
  title: string;
  url: string;
  difficulty: string;
  acceptance: string;
  frequency: string;
}

const dataset = datasetRaw as Record<string, Record<string, QuestionItem[]>>;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ company: string }> }
) {
  const { company } = await params;
  const companySlug = company.toLowerCase().trim();
  const searchParams = request.nextUrl.searchParams;

  const period = searchParams.get("period") || "all";
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const companyData = dataset[companySlug];
  if (!companyData) {
    return NextResponse.json(
      { detail: `Company '${company}' not found.` },
      { status: 404 }
    );
  }

  let questions = companyData[period] || companyData["all"] || [];

  if (difficulty && difficulty !== "All") {
    const diffLower = difficulty.toLowerCase().trim();
    questions = questions.filter((q) => q.difficulty.toLowerCase() === diffLower);
  }

  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    questions = questions.filter((q) => q.title.toLowerCase().includes(term));
  }

  const total = questions.length;
  const paginated = questions.slice(offset, offset + limit);

  return NextResponse.json({
    company: companySlug,
    period,
    total,
    offset,
    limit,
    questions: paginated,
  });
}
