#!/usr/bin/env python3
"""Sketchfab search helper — CC/free, downloadable, sorted by relevance/likeCount."""
import json, sys, urllib.request, urllib.parse

KEY = "fa8b21c0cfeb4754a8c77a96214e3d01"
LICENSES = {  # safe for modification/combination
    "cc0": "cc0",
    "by": "by",
}
LIC_BY_UID = {v: k for k, v in LICENSES.items()}

def search(q, count=8, sort="-likeCount", max_face=200000, extra=None):
    params = {
        "type": "models", "q": q, "downloadable": "true",
        "licenses": list(LICENSES.values()),
        "count": count, "sort_by": sort,
    }
    if max_face:
        params["max_face_count"] = max_face
    if extra:
        params.update(extra)
    url = "https://api.sketchfab.com/v3/search?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"Authorization": f"Token {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    for m in data.get("results", []):
        lic = (m.get("license") or {}).get("slug", "?")
        print(f"  {m['name'][:52]:<52} | {m.get('faceCount',0):>7} tris | {lic:<4} | {m['user']['displayName'][:24]:<24} | {m['viewerUrl']}")
    if not data.get("results"):
        print("  (no results)")

if __name__ == "__main__":
    q = sys.argv[1]
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    sort = sys.argv[3] if len(sys.argv) > 3 else "-likeCount"
    print(f"## {q}  (sort={sort})")
    search(q, count, sort)
