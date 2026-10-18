import requests
import json
import time
import re

# 1. First, fetch TakeUForward official A2Z syllabus to extract Striver's official LeetCode URLs
print("Fetching TakeUForward official syllabus to extract LeetCode URLs...")
tuf_url = "https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns?page=sheet"
tuf_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

title_to_lc = {}
slug_to_lc = {}

try:
    tuf_res = requests.get(tuf_url, headers=tuf_headers, timeout=20)
    tuf_text = tuf_res.text
    lc_links = set(re.findall(r'https://leetcode\.com/problems/[a-zA-Z0-9_\-]+/?', tuf_text))
    print(f"Found {len(lc_links)} unique LeetCode links embedded in TakeUForward syllabus.")

    for lc in lc_links:
        clean_lc = lc.rstrip('/')
        idx = tuf_text.find(lc)
        while idx != -1:
            snippet = tuf_text[max(0, idx - 450):idx]
            titles = re.findall(r',\\\"([A-Za-z0-9\s\(\)\-\+/\'\?]+)\\\",\\\"[^\\\"]*min\\\"', snippet)
            slugs = re.findall(r'\\\"itemSlug\\\":\\\"([^\\\"]+)\\\"', snippet)
            for t in titles:
                title_to_lc[t.strip().lower()] = clean_lc
            for s in slugs:
                slug_to_lc[s.strip().lower()] = clean_lc
            idx = tuf_text.find(lc, idx + len(lc))

    print(f"Built lookup dictionary: {len(title_to_lc)} titles and {len(slug_to_lc)} slugs mapped to LeetCode.")
except Exception as e:
    print(f"Notice: Could not fetch TUF syllabus ({e}), continuing with Codolio dataset.")

# 2. Fetch Codolio full structured dataset (455 problems across 18 Steps)
slug = "strivers-a2z-dsa-sheet"
base_url = f"https://node.codolio.com/api/question-tracker/v2/sheet/get-sheet-data-by-slug/{slug}"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://codolio.com",
    "Referer": "https://codolio.com/"
}

try:
    print(f"\nFetching '{slug}' from Codolio API...")
    a2z_sheet_data = {}
    cursor = None
    page = 1
    total_fetched = 0
    lc_count = 0

    while True:
        url = f"{base_url}?limit=100"
        if cursor:
            url += f"&after={cursor}"

        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        res_json = response.json()
        data = res_json.get("data", {})
        mappings = data.get("mappings", [])

        if not mappings:
            break

        for item in mappings:
            topic = item.get("topic") or "General"
            subtopic = item.get("subTopic")
            question = item.get("questionId") or {}
            
            problem_name = question.get("name") or item.get("title") or "Untitled Problem"
            problem_url = question.get("problemUrl") or ""
            video_url = item.get("resource") or ""
            difficulty = question.get("difficulty") or "Medium"
            platform = question.get("platform") or "unknown"

            # Determine the best LeetCode URL:
            leetcode_url = None
            if "leetcode.com" in problem_url:
                leetcode_url = problem_url.split("?")[0].rstrip("/")
            else:
                # Try matching by name or slug from TUF mapping
                name_clean = problem_name.strip().lower()
                url_slug = problem_url.split("/")[-1].lower() if problem_url else ""
                matched = title_to_lc.get(name_clean) or slug_to_lc.get(name_clean) or slug_to_lc.get(url_slug)
                if matched:
                    leetcode_url = matched

            if leetcode_url:
                lc_count += 1

            if topic not in a2z_sheet_data:
                a2z_sheet_data[topic] = []

            # Save problem entry with both leetcode_url and original practice url
            entry = {
                "problem_name": problem_name,
                "leetcode_url": leetcode_url,
                "url": leetcode_url if leetcode_url else problem_url,
                "practice_url": problem_url,
                "difficulty": difficulty,
                "platform": "leetcode" if leetcode_url else platform,
                "subtopic": subtopic,
                "video_url": video_url
            }
            a2z_sheet_data[topic].append(entry)
            total_fetched += 1

        pagination = data.get("pagination", {})
        if pagination.get("hasNextPage") and pagination.get("nextCursor"):
            cursor = pagination["nextCursor"]
            page += 1
            print(f"  Page {page - 1}: {len(mappings)} problems fetched (Total: {total_fetched})...")
            time.sleep(0.2)
        else:
            break

    # Save cleanly to JSON file
    output_filename = "strivers_a2z_with_links.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(a2z_sheet_data, f, indent=4)

    total_topics = len(a2z_sheet_data)
    print(f"\nSuccess! Extracted {total_fetched} problems across {total_topics} topics into '{output_filename}'.")
    print(f"LeetCode URLs attached: {lc_count} / {total_fetched} problems!")

except Exception as e:
    print(f"Error fetching sheet data: {e}")
