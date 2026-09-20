import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

interface ProblemSeedData {
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  tags: string[];
  company: string[];
  testCases: Array<{ input: string; output: string; isHidden: boolean }>;
  templates: Array<{ language: "CPP" | "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT" | "JAVA"; code: string }>;
}

const PROBLEMS: ProblemSeedData[] = [
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "EASY",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: `1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.`,
    inputFormat: "A single line containing the string s.",
    outputFormat: 'Print "true" if valid, otherwise "false".',
    tags: ["stack", "string"],
    company: ["Meta", "Google", "Amazon", "Bloomberg"],
    testCases: [
      { input: "()\n", output: "true\n", isHidden: false },
      { input: "()[]{}\n", output: "true\n", isHidden: false },
      { input: "(]\n", output: "false\n", isHidden: false },
      { input: "([)]\n", output: "false\n", isHidden: true },
      { input: "{[]}\n", output: "true\n", isHidden: true },
    ],
    templates: [
      {
        language: "CPP",
        code: `#include <iostream>
#include <stack>
#include <string>

using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}`,
      },
      {
        language: "PYTHON",
        code: `import sys

def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

def main():
    s = sys.stdin.read().strip()
    if s:
        print("true" if isValid(s) else "false")

if __name__ == '__main__':
    main()`,
      },
      {
        language: "JAVASCRIPT",
        code: `const fs = require('fs');

function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (let c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else {
            if (stack.pop() !== map[c]) return false;
        }
    }
    return stack.length === 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    console.log(isValid(input) ? "true" : "false");
}`,
      },
      {
        language: "TYPESCRIPT",
        code: `import * as fs from 'fs';

function isValid(s: string): boolean {
    const stack: string[] = [];
    const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
    for (let c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else {
            if (stack.pop() !== map[c]) return false;
        }
    }
    return stack.length === 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    console.log(isValid(input) ? "true" : "false");
}`,
      },
      {
        language: "JAVA",
        code: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) return false;
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            System.out.println(isValid(s) ? "true" : "false");
        }
    }
}`,
      },
    ],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "EASY",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    constraints: `1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4`,
    inputFormat: "First line contains n (number of days). Second line contains n space-separated integers representing prices.",
    outputFormat: "A single integer representing the maximum profit.",
    tags: ["array", "dynamic-programming"],
    company: ["Amazon", "Google", "Meta", "Microsoft"],
    testCases: [
      { input: "6\n7 1 5 3 6 4\n", output: "5\n", isHidden: false },
      { input: "5\n7 6 4 3 1\n", output: "0\n", isHidden: false },
      { input: "2\n2 4\n", output: "2\n", isHidden: true },
      { input: "4\n1 2 3 4\n", output: "3\n", isHidden: true },
    ],
    templates: [
      {
        language: "CPP",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int maxProfit(vector<int>& prices) {
    int minPrice = 1e9, maxProfit = 0;
    for (int p : prices) {
        minPrice = min(minPrice, p);
        maxProfit = max(maxProfit, p - minPrice);
    }
    return maxProfit;
}

int main() {
    int n;
    if (cin >> n) {
        vector<int> prices(n);
        for (int i = 0; i < n; i++) cin >> prices[i];
        cout << maxProfit(prices) << endl;
    }
    return 0;
}`,
      },
      {
        language: "PYTHON",
        code: `import sys

def maxProfit(prices):
    min_price = float('inf')
    max_profit = 0
    for p in prices:
        if p < min_price:
            min_price = p
        elif p - min_price > max_profit:
            max_profit = p - min_price
    return max_profit

def main():
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        prices = [int(x) for x in data[1:1+n]]
        print(maxProfit(prices))

if __name__ == '__main__':
    main()`,
      },
      {
        language: "JAVASCRIPT",
        code: `const fs = require('fs');

function maxProfit(prices) {
    let minPrice = Infinity, maxProfit = 0;
    for (let p of prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const prices = input.slice(1, 1 + n).map(Number);
    console.log(maxProfit(prices));
}`,
      },
      {
        language: "TYPESCRIPT",
        code: `import * as fs from 'fs';

function maxProfit(prices: number[]): number {
    let minPrice = Infinity, maxProfit = 0;
    for (let p of prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const prices = input.slice(1, 1 + n).map(Number);
    console.log(maxProfit(prices));
}`,
      },
      {
        language: "JAVA",
        code: `import java.util.*;

public class Main {
    public static int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, maxProfit = 0;
        for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
        }
        return maxProfit;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] prices = new int[n];
            for (int i = 0; i < n; i++) prices[i] = sc.nextInt();
            System.out.println(maxProfit(prices));
        }
    }
}`,
      },
    ],
  },
  {
    title: "Maximum Subarray (Kadane's Algorithm)",
    slug: "maximum-subarray",
    difficulty: "MEDIUM",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    constraints: `1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4`,
    inputFormat: "First line contains n (array length). Second line contains n space-separated integers.",
    outputFormat: "A single integer representing the maximum subarray sum.",
    tags: ["array", "dynamic-programming", "divide-and-conquer"],
    company: ["Google", "Amazon", "Apple", "Microsoft"],
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", output: "6\n", isHidden: false },
      { input: "1\n1\n", output: "1\n", isHidden: false },
      { input: "5\n5 4 -1 7 8\n", output: "23\n", isHidden: false },
      { input: "3\n-3 -2 -1\n", output: "-1\n", isHidden: true },
    ],
    templates: [
      {
        language: "CPP",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int maxSubArray(vector<int>& nums) {
    int maxSoFar = nums[0], currMax = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        currMax = max(nums[i], currMax + nums[i]);
        maxSoFar = max(maxSoFar, currMax);
    }
    return maxSoFar;
}

int main() {
    int n;
    if (cin >> n) {
        vector<int> nums(n);
        for (int i = 0; i < n; i++) cin >> nums[i];
        cout << maxSubArray(nums) << endl;
    }
    return 0;
}`,
      },
      {
        language: "PYTHON",
        code: `import sys

def maxSubArray(nums):
    max_so_far = nums[0]
    curr_max = nums[0]
    for x in nums[1:]:
        curr_max = max(x, curr_max + x)
        max_so_far = max(max_so_far, curr_max)
    return max_so_far

def main():
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        nums = [int(x) for x in data[1:1+n]]
        print(maxSubArray(nums))

if __name__ == '__main__':
    main()`,
      },
      {
        language: "JAVASCRIPT",
        code: `const fs = require('fs');

function maxSubArray(nums) {
    let maxSoFar = nums[0], currMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currMax);
    }
    return maxSoFar;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    console.log(maxSubArray(nums));
}`,
      },
      {
        language: "TYPESCRIPT",
        code: `import * as fs from 'fs';

function maxSubArray(nums: number[]): number {
    let maxSoFar = nums[0], currMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currMax);
    }
    return maxSoFar;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    console.log(maxSubArray(nums));
}`,
      },
      {
        language: "JAVA",
        code: `import java.util.*;

public class Main {
    public static int maxSubArray(int[] nums) {
        int maxSoFar = nums[0], currMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
            System.out.println(maxSubArray(nums));
        }
    }
}`,
      },
    ],
  },
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "HARD",
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: `n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5`,
    inputFormat: "First line contains n. Second line contains n space-separated integers representing heights.",
    outputFormat: "A single integer representing the total units of trapped rain water.",
    tags: ["array", "two-pointers", "dynamic-programming", "stack"],
    company: ["Google", "Amazon", "Goldman Sachs", "Bloomberg"],
    testCases: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1\n", output: "6\n", isHidden: false },
      { input: "6\n4 2 0 3 2 5\n", output: "9\n", isHidden: false },
      { input: "3\n3 0 3\n", output: "3\n", isHidden: true },
      { input: "5\n1 2 3 4 5\n", output: "0\n", isHidden: true },
    ],
    templates: [
      {
        language: "CPP",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int trap(vector<int>& height) {
    int left = 0, right = height.size() - 1;
    int leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) leftMax = height[left];
            else water += leftMax - height[left];
            left++;
        } else {
            if (height[right] >= rightMax) rightMax = height[right];
            else water += rightMax - height[right];
            right--;
        }
    }
    return water;
}

int main() {
    int n;
    if (cin >> n) {
        vector<int> h(n);
        for (int i = 0; i < n; i++) cin >> h[i];
        cout << trap(h) << endl;
    }
    return 0;
}`,
      },
      {
        language: "PYTHON",
        code: `import sys

def trap(height):
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    return water

def main():
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        h = [int(x) for x in data[1:1+n]]
        print(trap(h))

if __name__ == '__main__':
    main()`,
      },
      {
        language: "JAVASCRIPT",
        code: `const fs = require('fs');

function trap(height) {
    let left = 0, right = height.length - 1;
    let leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) leftMax = height[left];
            else water += leftMax - height[left];
            left++;
        } else {
            if (height[right] >= rightMax) rightMax = height[right];
            else water += rightMax - height[right];
            right--;
        }
    }
    return water;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const h = input.slice(1, 1 + n).map(Number);
    console.log(trap(h));
}`,
      },
      {
        language: "TYPESCRIPT",
        code: `import * as fs from 'fs';

function trap(height: number[]): number {
    let left = 0, right = height.length - 1;
    let leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) leftMax = height[left];
            else water += leftMax - height[left];
            left++;
        } else {
            if (height[right] >= rightMax) rightMax = height[right];
            else water += rightMax - height[right];
            right--;
        }
    }
    return water;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const h = input.slice(1, 1 + n).map(Number);
    console.log(trap(h));
}`,
      },
      {
        language: "JAVA",
        code: `import java.util.*;

public class Main {
    public static int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else water += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else water += rightMax - height[right];
                right--;
            }
        }
        return water;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] h = new int[n];
            for (int i = 0; i < n; i++) h[i] = sc.nextInt();
            System.out.println(trap(h));
        }
    }
}`,
      },
    ],
  },
  {
    title: "3Sum",
    slug: "3sum",
    difficulty: "MEDIUM",
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.
Output each triplet on a new line with elements sorted ascending, separated by spaces. If no triplets exist, output 0.`,
    constraints: `3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5`,
    inputFormat: "First line contains n. Second line contains n space-separated integers.",
    outputFormat: "The triplets, one per line. If none, output 0.",
    tags: ["array", "two-pointers", "sorting"],
    company: ["Google", "Amazon", "Meta", "Apple"],
    testCases: [
      { input: "6\n-1 0 1 2 -1 -4\n", output: "-1 -1 2\n-1 0 1\n", isHidden: false },
      { input: "3\n0 1 1\n", output: "0\n", isHidden: false },
      { input: "3\n0 0 0\n", output: "0 0 0\n", isHidden: true },
    ],
    templates: [
      {
        language: "CPP",
        code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void threeSum(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> res;
    int n = nums.size();
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int left = i + 1, right = n - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                res.push_back({nums[i], nums[left], nums[right]});
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++; right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    if (res.empty()) {
        cout << 0 << endl;
    } else {
        for (auto& t : res) {
            cout << t[0] << " " << t[1] << " " << t[2] << endl;
        }
    }
}

int main() {
    int n;
    if (cin >> n) {
        vector<int> nums(n);
        for (int i = 0; i < n; i++) cin >> nums[i];
        threeSum(nums);
    }
    return 0;
}`,
      },
      {
        language: "PYTHON",
        code: `import sys

def threeSum(nums):
    nums.sort()
    res = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, n - 1
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s == 0:
                res.append((nums[i], nums[left], nums[right]))
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif s < 0:
                left += 1
            else:
                right -= 1
    if not res:
        print(0)
    else:
        for t in res:
            print(f"{t[0]} {t[1]} {t[2]}")

def main():
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        nums = [int(x) for x in data[1:1+n]]
        threeSum(nums)

if __name__ == '__main__':
    main()`,
      },
      {
        language: "JAVASCRIPT",
        code: `const fs = require('fs');

function threeSum(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    const n = nums.length;
    for (let i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let left = i + 1, right = n - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                res.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                left++; right--;
            } else if (sum < 0) left++;
            else right--;
        }
    }
    if (res.length === 0) console.log("0");
    else res.forEach(t => console.log(t.join(" ")));
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    threeSum(nums);
}`,
      },
      {
        language: "TYPESCRIPT",
        code: `import * as fs from 'fs';

function threeSum(nums: number[]): void {
    nums.sort((a, b) => a - b);
    const res: number[][] = [];
    const n = nums.length;
    for (let i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let left = i + 1, right = n - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                res.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                left++; right--;
            } else if (sum < 0) left++;
            else right--;
        }
    }
    if (res.length === 0) console.log("0");
    else res.forEach(t => console.log(t.join(" ")));
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    threeSum(nums);
}`,
      },
      {
        language: "JAVA",
        code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
            Arrays.sort(nums);
            List<String> res = new ArrayList<>();
            for (int i = 0; i < n - 2; i++) {
                if (i > 0 && nums[i] == nums[i - 1]) continue;
                int left = i + 1, right = n - 1;
                while (left < right) {
                    int sum = nums[i] + nums[left] + nums[right];
                    if (sum == 0) {
                        res.add(nums[i] + " " + nums[left] + " " + nums[right]);
                        while (left < right && nums[left] == nums[left + 1]) left++;
                        while (left < right && nums[right] == nums[right - 1]) right--;
                        left++; right--;
                    } else if (sum < 0) left++;
                    else right--;
                }
            }
            if (res.isEmpty()) System.out.println("0");
            else for (String s : res) System.out.println(s);
        }
    }
}`,
      },
    ],
  },
];

async function seed() {
  console.log("Seeding flagship native problems...");

  for (const p of PROBLEMS) {
    const upserted = await db.problem.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        difficulty: p.difficulty,
        status: "published",
        description: p.description,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        tags: p.tags,
        company: p.company,
      },
      create: {
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        status: "published",
        description: p.description,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        tags: p.tags,
        company: p.company,
      },
    });

    // Seed test cases
    await db.testCase.deleteMany({ where: { problemId: upserted.id } });
    for (let i = 0; i < p.testCases.length; i++) {
      const tc = p.testCases[i];
      await db.testCase.create({
        data: {
          problemId: upserted.id,
          input: tc.input,
          expectedOutput: tc.output,
          isHidden: tc.isHidden,
          orderIndex: i + 1,
        },
      });
    }

    // Seed templates
    await db.codeTemplate.deleteMany({ where: { problemId: upserted.id } });
    for (const t of p.templates) {
      await db.codeTemplate.create({
        data: {
          problemId: upserted.id,
          language: t.language,
          code: t.code,
        },
      });
    }

    console.log(`✓ Seeded problem: ${p.title} (${p.slug})`);
  }

  // Also update Two Sum company tags
  await db.problem.updateMany({
    where: { slug: "two-sum" },
    data: { company: ["Google", "Amazon", "Meta", "Apple"] },
  });

  console.log("All flagship native problems seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
