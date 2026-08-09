import asyncio
import httpx
import os

URLS = {
    "1_splash.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZkMTFjMWZkMTM0NzQzZWViZjBmZDExN2EzNDBmNjdiEgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "2_onboarding.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBkZjI3NDcwMDUzZTQ1NTM4MGMwODNhMWExYTVkNzRhEgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "3_warroom.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NGFhZDYzMjAxZmMwNzkyZjVjNjNmMTNmY2U0EgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "4_signals.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NGFhZDY4ODJhNzYwNTQ5ZmY3OGY3MTM4MTI4EgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "5_debate.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzg1MDVmOTljNDc4YTQzYmRhZjg1MTk1YzUyMzExYjZhEgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "6_regret.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2EyNmI3OTQ4Y2JhZDRlNWE4NWU1YjZlMWI1NTM4MzEyEgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "7_portfolio.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzMxMWEyOTQ4ODUwMjRiYmE4NDI1NzgyMjZhYzM2YmE3EgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "8_chat.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzllNTZiMzEzYjFkYjQ1YTdiOTk5ODdmM2E2OWIwODgwEgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086",
    "9_picks.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk5OGE5N2RlYmE4OTQ2ZWM4NTUxZWU0Nzg4MWE1NGU4EgsSBxCv_ua66gsYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDc2NTc1MzMwMTcyNTM3Mjc1MA&filename=&opi=89354086"
}

out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "downloads")
os.makedirs(out_dir, exist_ok=True)

async def download_file(client, name, url):
    path = os.path.join(out_dir, name)
    print(f"Downloading {name}...")
    try:
        response = await client.get(url, timeout=30.0)
        if response.status_code == 200:
            with open(path, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"Saved {name}.")
        else:
            print(f"Failed {name} (status {response.status_code})")
    except Exception as e:
        print(f"Error downloading {name}: {e}")

async def main():
    async with httpx.AsyncClient() as client:
        tasks = [download_file(client, name, url) for name, url in URLS.items()]
        await asyncio.gather(*tasks)
    print("Done downloading all templates!")

if __name__ == "__main__":
    asyncio.run(main())
