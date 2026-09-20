import { judgeSubmission } from "../apps/server/src/services/judge";

async function main() {
  const result = await judgeSubmission({
    userId: "lnVevCKnghVQTnqsnTegVdAuBHKDWdi0",
    problemId: 1, // pick a problem you know has test cases seeded
    sourceCode: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target; cin >> target;
    unordered_map<int,int> seen;
    for (int i = 0; i < n; i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            cout << seen[complement] << " " << i;
            return 0;
        }
        seen[nums[i]] = i;
    }
}`,
    language: "CPP",
  });

  console.log(JSON.stringify(result, null, 2));
  console.log("JUDGE0_API_URL is:", JSON.stringify(process.env.JUDGE0_API_URL));
}

main().catch(console.error);