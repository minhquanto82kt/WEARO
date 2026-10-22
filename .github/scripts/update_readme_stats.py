#!/usr/bin/env python3
"""Generate repository and project statistics in the root README."""
import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

REPO = os.environ["GITHUB_REPOSITORY"]
BRANCH = os.environ["GITHUB_REF_NAME"]
TOKEN = os.environ.get("GITHUB_TOKEN", "")
API = "https://api.github.com"
START = "<!-- AUTO-REPO-STATS:START -->"
END = "<!-- AUTO-REPO-STATS:END -->"


def get_json(path):
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "wearo-readme-stats"}
    if TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    request = urllib.request.Request(API + path, headers=headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def date_text(value):
    if not value:
        return "Chưa có dữ liệu"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except (ValueError, TypeError):
        return "Chưa có dữ liệu"


def main():
    ref = urllib.parse.quote(BRANCH, safe="")
    repo = get_json(f"/repos/{REPO}")
    languages = get_json(f"/repos/{REPO}/languages")
    package_response = get_json(f"/repos/{REPO}/contents/fashion-dream-try-on-main/package.json?ref={ref}")
    package = json.loads(base64.b64decode(package_response["content"]).decode("utf-8"))

    latest_ci = None
    try:
        response = get_json(f"/repos/{REPO}/actions/workflows/ci.yml/runs?branch={ref}&per_page=10")
        latest_ci = next((run for run in response.get("workflow_runs", []) if run.get("name") == "CI"), None)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        pass

    ci_label = "Chưa có lần chạy CI"
    ci_url = f"https://github.com/{REPO}/actions/workflows/ci.yml"
    if latest_ci:
        ci_label = (latest_ci.get("conclusion") or latest_ci.get("status") or "unknown").replace("_", " ").title()
        ci_url = latest_ci.get("html_url") or ci_url

    scripts = package.get("scripts", {})
    scripts_text = ", ".join("`" + name + "`" for name in sorted(scripts)) or "Chưa khai báo"
    language_text = ", ".join(sorted(languages)) if languages else "Chưa có dữ liệu"
    rows = [
        "| Nguồn | Chỉ số | Giá trị hiện tại |",
        "|---|---|---|",
        f"| Repository | Stars | {repo.get('stargazers_count', 0)} |",
        f"| Repository | Forks | {repo.get('forks_count', 0)} |",
        f"| Repository | Issues/PR đang mở | {repo.get('open_issues_count', 0)} |",
        f"| Repository | Dung lượng GitHub ước tính | {round(repo.get('size', 0) / 1024, 1)} MB |",
        f"| Repository | Nhánh mặc định | `{repo.get('default_branch', 'unknown')}` |",
        f"| Repository | Nhánh đang thống kê | `{BRANCH}` |",
        f"| Repository | Cập nhật gần nhất | {date_text(repo.get('pushed_at'))} |",
        f"| GitHub Actions | CI gần nhất trên nhánh này | [{ci_label}]({ci_url}) · {date_text(latest_ci.get('updated_at') if latest_ci else None)} |",
        f"| Dữ liệu dự án | Package | `{package.get('name', 'Không khai báo')}` |",
        f"| Dữ liệu dự án | Runtime | Node.js `{package.get('engines', {}).get('node', 'Không khai báo')}` · `{package.get('packageManager', 'Không khai báo')}` |",
        f"| Dữ liệu dự án | Ngôn ngữ GitHub nhận diện | {language_text} |",
        f"| Dữ liệu dự án | Dependencies / devDependencies | {len(package.get('dependencies', {}))} / {len(package.get('devDependencies', {}))} |",
        f"| Dữ liệu dự án | Scripts trong package.json | {scripts_text} |",
    ]
    generated = "\n".join([START, "<!-- Tự động cập nhật bởi .github/workflows/readme-stats.yml. -->", *rows,
        f"\n_Cập nhật tự động: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} · nhánh `{BRANCH}`._", END])

    with open("README.md", encoding="utf-8") as file:
        readme = file.read()
    if START not in readme or END not in readme:
        raise ValueError("README is missing the automatic statistics markers.")
    before, remainder = readme.split(START, 1)
    _, after = remainder.split(END, 1)
    updated = before.rstrip() + "\n\n" + generated + after
    if updated != readme:
        with open("README.md", "w", encoding="utf-8") as file:
            file.write(updated)
        print("README statistics updated.")
    else:
        print("README statistics are already current.")


if __name__ == "__main__":
    main()
