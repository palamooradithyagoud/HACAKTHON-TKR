import { PracticeQuestion, CompanyQuestionsResult, QuestionPeriod } from "@/lib/api";

// Fallback question sets for popular companies when backend/database service is unreachable
export const FALLBACK_DATA: Record<string, PracticeQuestion[]> = {
  google: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "100.0%" },
    { id: 2, title: "Add Two Numbers", url: "https://leetcode.com/problems/add-two-numbers", difficulty: "Medium", acceptance: "47.9%", frequency: "75.0%" },
    { id: 3, title: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters", difficulty: "Medium", acceptance: "38.5%", frequency: "75.0%" },
    { id: 4, title: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays", difficulty: "Hard", acceptance: "45.9%", frequency: "75.0%" },
    { id: 42, title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water", difficulty: "Hard", acceptance: "66.8%", frequency: "50.0%" },
    { id: 212, title: "Word Search II", url: "https://leetcode.com/problems/word-search-ii", difficulty: "Hard", acceptance: "38.1%", frequency: "37.5%" },
    { id: 207, title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule", difficulty: "Medium", acceptance: "49.1%", frequency: "60.0%" },
    { id: 23, title: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists", difficulty: "Hard", acceptance: "55.4%", frequency: "70.0%" },
    { id: 146, title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache", difficulty: "Medium", acceptance: "44.2%", frequency: "85.0%" },
    { id: 124, title: "Binary Tree Maximum Path Sum", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum", difficulty: "Hard", acceptance: "40.8%", frequency: "45.0%" },
    { id: 15, title: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", acceptance: "38.6%", frequency: "65.0%" },
    { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", acceptance: "61.2%", frequency: "80.0%" },
    { id: 56, title: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals", difficulty: "Medium", acceptance: "48.2%", frequency: "70.0%" },
    { id: 139, title: "Word Break", url: "https://leetcode.com/problems/word-break", difficulty: "Medium", acceptance: "47.5%", frequency: "55.0%" },
    { id: 239, title: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum", difficulty: "Hard", acceptance: "47.8%", frequency: "62.0%" }
  ],
  amazon: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "95.0%" },
    { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", acceptance: "61.2%", frequency: "100.0%" },
    { id: 146, title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache", difficulty: "Medium", acceptance: "44.2%", frequency: "90.0%" },
    { id: 937, title: "Reorder Data in Log Files", url: "https://leetcode.com/problems/reorder-data-in-log-files", difficulty: "Medium", acceptance: "56.4%", frequency: "80.0%" },
    { id: 33, title: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array", difficulty: "Medium", acceptance: "41.5%", frequency: "75.0%" },
    { id: 139, title: "Word Break", url: "https://leetcode.com/problems/word-break", difficulty: "Medium", acceptance: "47.5%", frequency: "70.0%" },
    { id: 56, title: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals", difficulty: "Medium", acceptance: "48.2%", frequency: "85.0%" },
    { id: 347, title: "Top K Frequent Elements", url: "https://leetcode.com/problems/top-k-frequent-elements", difficulty: "Medium", acceptance: "63.9%", frequency: "72.0%" },
    { id: 121, title: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", difficulty: "Easy", acceptance: "54.8%", frequency: "88.0%" },
    { id: 238, title: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self", difficulty: "Medium", acceptance: "66.5%", frequency: "82.0%" }
  ],
  meta: [
    { id: 953, title: "Verifying an Alien Dictionary", url: "https://leetcode.com/problems/verifying-an-alien-dictionary", difficulty: "Easy", acceptance: "54.8%", frequency: "90.0%" },
    { id: 1249, title: "Minimum Remove to Make Valid Parentheses", url: "https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses", difficulty: "Medium", acceptance: "68.9%", frequency: "95.0%" },
    { id: 560, title: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k", difficulty: "Medium", acceptance: "43.8%", frequency: "88.0%" },
    { id: 236, title: "Lowest Common Ancestor of a Binary Tree", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree", difficulty: "Medium", acceptance: "63.1%", frequency: "85.0%" },
    { id: 1570, title: "Dot Product of Two Sparse Vectors", url: "https://leetcode.com/problems/dot-product-of-two-sparse-vectors", difficulty: "Medium", acceptance: "89.8%", frequency: "92.0%" },
    { id: 15, title: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", acceptance: "38.6%", frequency: "80.0%" },
    { id: 680, title: "Valid Palindrome II", url: "https://leetcode.com/problems/valid-palindrome-ii", difficulty: "Easy", acceptance: "40.9%", frequency: "78.0%" },
    { id: 523, title: "Continuous Subarray Sum", url: "https://leetcode.com/problems/continuous-subarray-sum", difficulty: "Medium", acceptance: "30.1%", frequency: "72.0%" },
    { id: 528, title: "Random Pick with Weight", url: "https://leetcode.com/problems/random-pick-with-weight", difficulty: "Medium", acceptance: "46.5%", frequency: "76.0%" },
    { id: 973, title: "K Closest Points to Origin", url: "https://leetcode.com/problems/k-closest-points-to-origin", difficulty: "Medium", acceptance: "66.2%", frequency: "70.0%" }
  ],
  microsoft: [
    { id: 151, title: "Reverse Words in a String", url: "https://leetcode.com/problems/reverse-words-in-a-string", difficulty: "Medium", acceptance: "46.2%", frequency: "85.0%" },
    { id: 253, title: "Meeting Rooms II", url: "https://leetcode.com/problems/meeting-rooms-ii", difficulty: "Medium", acceptance: "51.2%", frequency: "90.0%" },
    { id: 54, title: "Spiral Matrix", url: "https://leetcode.com/problems/spiral-matrix", difficulty: "Medium", acceptance: "51.8%", frequency: "75.0%" },
    { id: 138, title: "Copy List with Random Pointer", url: "https://leetcode.com/problems/copy-list-with-random-pointer", difficulty: "Medium", acceptance: "57.8%", frequency: "80.0%" },
    { id: 49, title: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams", difficulty: "Medium", acceptance: "68.2%", frequency: "78.0%" },
    { id: 1822, title: "Sign of the Product of an Array", url: "https://leetcode.com/problems/sign-of-the-product-of-an-array", difficulty: "Easy", acceptance: "65.4%", frequency: "70.0%" },
    { id: 438, title: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string", difficulty: "Medium", acceptance: "51.4%", frequency: "68.0%" },
    { id: 74, title: "Search a 2D Matrix", url: "https://leetcode.com/problems/search-a-2d-matrix", difficulty: "Medium", acceptance: "50.9%", frequency: "72.0%" },
    { id: 348, title: "Design Tic-Tac-Toe", url: "https://leetcode.com/problems/design-tic-tac-toe", difficulty: "Medium", acceptance: "58.1%", frequency: "65.0%" },
    { id: 98, title: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree", difficulty: "Medium", acceptance: "33.2%", frequency: "74.0%" }
  ],
  apple: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "90.0%" },
    { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", acceptance: "41.2%", frequency: "88.0%" },
    { id: 15, title: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", acceptance: "38.6%", frequency: "75.0%" },
    { id: 5, title: "Longest Palindromic Substring", url: "https://leetcode.com/problems/longest-palindromic-substring", difficulty: "Medium", acceptance: "34.5%", frequency: "78.0%" },
    { id: 4, title: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays", difficulty: "Hard", acceptance: "45.9%", frequency: "70.0%" },
    { id: 53, title: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray", difficulty: "Medium", acceptance: "51.2%", frequency: "82.0%" },
    { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", acceptance: "61.2%", frequency: "85.0%" },
    { id: 8, title: "String to Integer (atoi)", url: "https://leetcode.com/problems/string-to-integer-atoi", difficulty: "Medium", acceptance: "20.6%", frequency: "65.0%" },
    { id: 11, title: "Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water", difficulty: "Medium", acceptance: "59.5%", frequency: "76.0%" },
    { id: 21, title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists", difficulty: "Easy", acceptance: "65.1%", frequency: "80.0%" }
  ],
  netflix: [
    { id: 146, title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache", difficulty: "Medium", acceptance: "44.2%", frequency: "95.0%" },
    { id: 49, title: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams", difficulty: "Medium", acceptance: "68.2%", frequency: "85.0%" },
    { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", acceptance: "41.2%", frequency: "90.0%" },
    { id: 227, title: "Basic Calculator II", url: "https://leetcode.com/problems/basic-calculator-ii", difficulty: "Medium", acceptance: "46.6%", frequency: "80.0%" },
    { id: 560, title: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k", difficulty: "Medium", acceptance: "43.8%", frequency: "75.0%" },
    { id: 23, title: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists", difficulty: "Hard", acceptance: "55.4%", frequency: "78.0%" },
    { id: 4, title: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays", difficulty: "Hard", acceptance: "45.9%", frequency: "70.0%" },
    { id: 139, title: "Word Break", url: "https://leetcode.com/problems/word-break", difficulty: "Medium", acceptance: "47.5%", frequency: "72.0%" }
  ],
  uber: [
    { id: 815, title: "Bus Routes", url: "https://leetcode.com/problems/bus-routes", difficulty: "Hard", acceptance: "47.2%", frequency: "95.0%" },
    { id: 68, title: "Text Justification", url: "https://leetcode.com/problems/text-justification", difficulty: "Hard", acceptance: "45.1%", frequency: "90.0%" },
    { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", acceptance: "61.2%", frequency: "88.0%" },
    { id: 139, title: "Word Break II", url: "https://leetcode.com/problems/word-break-ii", difficulty: "Hard", acceptance: "52.4%", frequency: "80.0%" },
    { id: 150, title: "Evaluate Reverse Polish Notation", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation", difficulty: "Medium", acceptance: "52.8%", frequency: "75.0%" },
    { id: 332, title: "Reconstruct Itinerary", url: "https://leetcode.com/problems/reconstruct-itinerary", difficulty: "Hard", acceptance: "42.8%", frequency: "85.0%" }
  ],
  adobe: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "95.0%" },
    { id: 2, title: "Add Two Numbers", url: "https://leetcode.com/problems/add-two-numbers", difficulty: "Medium", acceptance: "47.9%", frequency: "85.0%" },
    { id: 7, title: "Reverse Integer", url: "https://leetcode.com/problems/reverse-integer", difficulty: "Medium", acceptance: "29.2%", frequency: "80.0%" },
    { id: 14, title: "Longest Common Prefix", url: "https://leetcode.com/problems/longest-common-prefix", difficulty: "Easy", acceptance: "47.1%", frequency: "90.0%" },
    { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", acceptance: "41.2%", frequency: "88.0%" },
    { id: 21, title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists", difficulty: "Easy", acceptance: "65.1%", frequency: "82.0%" }
  ],
  "goldman-sachs": [
    { id: 1086, title: "High Five", url: "https://leetcode.com/problems/high-five", difficulty: "Easy", acceptance: "76.4%", frequency: "90.0%" },
    { id: 166, title: "Fraction to Recurring Decimal", url: "https://leetcode.com/problems/fraction-to-recurring-decimal", difficulty: "Medium", acceptance: "25.8%", frequency: "95.0%" },
    { id: 42, title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water", difficulty: "Hard", acceptance: "66.8%", frequency: "85.0%" },
    { id: 209, title: "Minimum Size Subarray Sum", url: "https://leetcode.com/problems/minimum-size-subarray-sum", difficulty: "Medium", acceptance: "48.2%", frequency: "80.0%" },
    { id: 443, title: "String Compression", url: "https://leetcode.com/problems/string-compression", difficulty: "Medium", acceptance: "55.9%", frequency: "82.0%" }
  ],
  tcs: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "95.0%" },
    { id: 9, title: "Palindrome Number", url: "https://leetcode.com/problems/palindrome-number", difficulty: "Easy", acceptance: "60.2%", frequency: "90.0%" },
    { id: 344, title: "Reverse String", url: "https://leetcode.com/problems/reverse-string", difficulty: "Easy", acceptance: "79.1%", frequency: "85.0%" },
    { id: 509, title: "Fibonacci Number", url: "https://leetcode.com/problems/fibonacci-number", difficulty: "Easy", acceptance: "72.4%", frequency: "88.0%" },
    { id: 242, title: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram", difficulty: "Easy", acceptance: "67.8%", frequency: "80.0%" },
    { id: 268, title: "Missing Number", url: "https://leetcode.com/problems/missing-number", difficulty: "Easy", acceptance: "71.6%", frequency: "82.0%" }
  ],
  accenture: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "95.0%" },
    { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", acceptance: "41.2%", frequency: "90.0%" },
    { id: 21, title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists", difficulty: "Easy", acceptance: "65.1%", frequency: "85.0%" },
    { id: 121, title: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", difficulty: "Easy", acceptance: "54.8%", frequency: "88.0%" },
    { id: 125, title: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome", difficulty: "Easy", acceptance: "48.2%", frequency: "80.0%" }
  ],
  deloitte: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "90.0%" },
    { id: 151, title: "Reverse Words in a String", url: "https://leetcode.com/problems/reverse-words-in-a-string", difficulty: "Medium", acceptance: "46.2%", frequency: "85.0%" },
    { id: 242, title: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram", difficulty: "Easy", acceptance: "67.8%", frequency: "82.0%" },
    { id: 268, title: "Missing Number", url: "https://leetcode.com/problems/missing-number", difficulty: "Easy", acceptance: "71.6%", frequency: "80.0%" }
  ],
  wipro: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "90.0%" },
    { id: 9, title: "Palindrome Number", url: "https://leetcode.com/problems/palindrome-number", difficulty: "Easy", acceptance: "60.2%", frequency: "88.0%" },
    { id: 412, title: "Fizz Buzz", url: "https://leetcode.com/problems/fizz-buzz", difficulty: "Easy", acceptance: "73.2%", frequency: "85.0%" },
    { id: 136, title: "Single Number", url: "https://leetcode.com/problems/single-number", difficulty: "Easy", acceptance: "74.8%", frequency: "82.0%" }
  ],
  infosys: [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "92.0%" },
    { id: 242, title: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram", difficulty: "Easy", acceptance: "67.8%", frequency: "86.0%" },
    { id: 206, title: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list", difficulty: "Easy", acceptance: "80.2%", frequency: "88.0%" },
    { id: 70, title: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs", difficulty: "Easy", acceptance: "53.1%", frequency: "84.0%" }
  ],
  flipkart: [
    { id: 239, title: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum", difficulty: "Hard", acceptance: "47.8%", frequency: "95.0%" },
    { id: 146, title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache", difficulty: "Medium", acceptance: "44.2%", frequency: "90.0%" },
    { id: 42, title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water", difficulty: "Hard", acceptance: "66.8%", frequency: "88.0%" },
    { id: 207, title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule", difficulty: "Medium", acceptance: "49.1%", frequency: "82.0%" }
  ]
};

// Generic fallback question generator for any company slug
export function getGenericCompanyQuestions(companySlug: string): PracticeQuestion[] {
  return [
    { id: 1, title: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", acceptance: "57.1%", frequency: "90.0%" },
    { id: 21, title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists", difficulty: "Easy", acceptance: "65.1%", frequency: "80.0%" },
    { id: 121, title: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", difficulty: "Easy", acceptance: "54.8%", frequency: "85.0%" },
    { id: 200, title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands", difficulty: "Medium", acceptance: "61.2%", frequency: "75.0%" },
    { id: 15, title: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", acceptance: "38.6%", frequency: "70.0%" },
    { id: 146, title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache", difficulty: "Medium", acceptance: "44.2%", frequency: "65.0%" },
    { id: 53, title: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray", difficulty: "Medium", acceptance: "51.2%", frequency: "80.0%" },
    { id: 20, title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", acceptance: "41.2%", frequency: "88.0%" },
    { id: 70, title: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs", difficulty: "Easy", acceptance: "53.1%", frequency: "72.0%" },
    { id: 206, title: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list", difficulty: "Easy", acceptance: "80.2%", frequency: "78.0%" }
  ];
}

export function getFallbackQuestionsForCompany(
  company: string,
  period: QuestionPeriod = "all",
  difficulty?: string,
  search?: string,
  limit = 100,
  offset = 0
): CompanyQuestionsResult {
  const slug = company.toLowerCase().trim();
  let questions = FALLBACK_DATA[slug] || getGenericCompanyQuestions(slug);

  if (difficulty && difficulty !== "All") {
    const diffLower = difficulty.toLowerCase();
    questions = questions.filter((q) => q.difficulty.toLowerCase() === diffLower);
  }

  if (search && search.trim()) {
    const sLower = search.toLowerCase().trim();
    questions = questions.filter((q) => q.title.toLowerCase().includes(sLower));
  }

  const total = questions.length;
  const paginated = questions.slice(offset, offset + limit);

  return {
    company: slug,
    period,
    total,
    offset,
    limit,
    questions: paginated
  };
}
