import requests
import json
import re
import os

print("--- Step 1: Loading 455 Extracted A2Z Questions ---")
with open("strivers_a2z_with_links.json", "r", encoding="utf-8") as f:
    a2z_raw = json.load(f)

a2z_list = []
for step_name, probs in a2z_raw.items():
    for p in probs:
        a2z_list.append(p)

print(f"Loaded {len(a2z_list)} A2Z problems from strivers_a2z_with_links.json")

# Build comprehensive lookup indexes
title_index = {}
slug_index = {}

for p in a2z_list:
    name = p["problem_name"]
    norm_name = re.sub(r"[^a-z0-9]", "", name.lower())
    title_index[norm_name] = p

    lc = p.get("leetcode_url") or ""
    if "leetcode.com/problems/" in lc:
        m = re.search(r"leetcode\.com/problems/([a-zA-Z0-9_\-]+)", lc)
        if m:
            slug_index[m.group(1).lower()] = p

    u = p.get("practice_url") or p.get("url") or ""
    if "/dsa/" in u:
        s = u.split("/dsa/")[-1].strip("/").lower()
        slug_index[s] = p

print(f"Lookup indexes built: {len(title_index)} titles, {len(slug_index)} slugs")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://codolio.com",
    "Referer": "https://codolio.com/"
}

def fetch_sheet_mappings(slug):
    mappings = []
    cursor = None
    while True:
        url = f"https://node.codolio.com/api/question-tracker/v2/sheet/get-sheet-data-by-slug/{slug}?limit=100"
        if cursor:
            url += f"&after={cursor}"
        res = requests.get(url, headers=headers)
        data = res.json().get("data", {})
        batch = data.get("mappings", [])
        mappings.extend(batch)
        pagination = data.get("pagination", {})
        if pagination.get("hasNextPage") and pagination.get("nextCursor"):
            cursor = pagination.get("nextCursor")
        else:
            break
    return mappings

def clean_difficulty(diff_str):
    if not diff_str:
        return "Core"
    d = diff_str.lower()
    if "easy" in d or "basic" in d or "school" in d:
        return "Basic"
    if "hard" in d:
        return "Hard"
    return "Core"

def process_sheet(sheet_slug, prefix):
    print(f"\n--- Extracting {sheet_slug} ---")
    raw_mappings = fetch_sheet_mappings(sheet_slug)
    print(f"Total mappings fetched: {len(raw_mappings)}")

    processed_problems = []
    matched_count = 0

    for idx, m in enumerate(raw_mappings, 1):
        q = m.get("questionId") or {}
        raw_title = m.get("title") or q.get("name") or f"Problem {idx}"
        raw_slug = q.get("slug") or re.sub(r"[^a-z0-9\-]", "-", raw_title.lower()).strip("-")
        norm_title = re.sub(r"[^a-z0-9]", "", raw_title.lower())
        purl = q.get("problemUrl") or ""

        lc_match_slug = ""
        if "leetcode.com/problems/" in purl:
            m_lc = re.search(r"leetcode\.com/problems/([a-zA-Z0-9_\-]+)", purl)
            if m_lc:
                lc_match_slug = m_lc.group(1).lower()

        # Try matching against A2Z
        matched_a2z = (
            slug_index.get(raw_slug.lower())
            or (slug_index.get(lc_match_slug) if lc_match_slug else None)
            or title_index.get(norm_title)
        )

        if matched_a2z:
            matched_count += 1
            # Reuse from A2Z
            diff = matched_a2z.get("difficulty") or clean_difficulty(q.get("difficulty"))
            diff = "Basic" if diff.lower() in ["easy", "basic"] else ("Hard" if diff.lower() == "hard" else "Core")
            link = matched_a2z.get("leetcode_url") or matched_a2z.get("practice_url") or matched_a2z.get("url") or purl
            video = matched_a2z.get("video_url") or (m.get("resource") if ("youtu" in str(m.get("resource"))) else "")
            subtopic = matched_a2z.get("subtopic") or m.get("subTopic") or ""
            # clean subtopic Lec prefix if present
            if subtopic and " : " in subtopic:
                subtopic = subtopic.split(" : ", 1)[-1].strip()
        else:
            diff = clean_difficulty(q.get("difficulty"))
            link = purl or (f"https://leetcode.com/problems/{raw_slug}" if q.get("platform") == "leetcode" else "")
            video = m.get("resource") if ("youtu" in str(m.get("resource"))) else ""
            subtopic = m.get("subTopic") or ""

        topic = m.get("topic") or (q.get("topics")[0] if q.get("topics") else "General")

        prob = {
            "id": f"{prefix}-{idx}",
            "index": idx,
            "title": raw_title,
            "slug": raw_slug,
            "difficulty": diff,
            "topic": topic,
            "subtopic": subtopic,
            "moreTopics": 1,
            "companies": [],
            "link": link or f"https://leetcode.com/problems/{raw_slug}",
            "videoUrl": video or ""
        }
        processed_problems.append(prob)

    print(f"Matched {matched_count}/{len(processed_problems)} with already extracted A2Z problems!")
    return processed_problems

def write_ts_file(filepath, var_name, problems):
    content = f"""// AUTO-GENERATED & MATCHED WITH STRIVER A2Z EXTRACTED DATASET
import {{ CuratedProblem }} from "./flagshipSheetsData";

export const {var_name}: CuratedProblem[] = {json.dumps(problems, indent=2)};
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved {len(problems)} problems to {filepath}")

# 1. Striver SDE Sheet
sde_problems = process_sheet("striver-sde-sheet", "sde")
write_ts_file("apps/server/src/data/striverSdeData.ts", "STRIVER_SDE_PROBLEMS", sde_problems)

# 2. NeetCode 150
nc_problems = process_sheet("neetcode-150", "nc")
write_ts_file("apps/server/src/data/neetcode150Data.ts", "NEETCODE_150_PROBLEMS", nc_problems)

# 3. Blind 75
b75_problems = process_sheet("blind-75", "b75")
write_ts_file("apps/server/src/data/blind75Data.ts", "BLIND_75_PROBLEMS", b75_problems)

print("\n--- All sheets successfully extracted, matched, and written! ---")
