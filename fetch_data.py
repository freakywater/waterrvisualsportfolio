import urllib.request
import re
import os

channels = {
    '@Fe4R_RBX': 'fe4r_avatar',
    '@BlueNinjaReal': 'blueninja_avatar',
    '@FiregamerSeries': 'firegamer_avatar',
}

os.makedirs('ASSETS/reviews', exist_ok=True)

for channel, filename in channels.items():
    url = f'https://www.youtube.com/{channel}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')

        # Sub count
        sub_match = re.search(r'"subscriberCountText":\{"simpleText":"(.*?)"', html)
        if sub_match:
            print(f'{channel} Subs: {sub_match.group(1)}')
        else:
            sub_match2 = re.search(r'"label":"([\d\.,]+ [KMB]? ?subscribers?)"', html)
            if sub_match2:
                print(f'{channel} Subs: {sub_match2.group(1)}')
            else:
                # Try another pattern
                sub_match3 = re.search(r'([\d\.,]+[KMB]?) subscribers', html)
                print(f'{channel} Subs (fallback): {sub_match3.group(1) if sub_match3 else "Not found"}')

        # Avatar - try og:image first
        avatar_url = None
        avatar_match = re.search(r'<meta property="og:image" content="(https://yt3[^"]+)"', html)
        if avatar_match:
            avatar_url = avatar_match.group(1)
        
        if avatar_url:
            print(f'{channel} Avatar URL: {avatar_url}')
            # Download it
            req2 = urllib.request.Request(avatar_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req2).read()
            out_path = f'ASSETS/reviews/{filename}.jpg'
            with open(out_path, 'wb') as f:
                f.write(img_data)
            print(f'{channel} Saved to: {out_path}')
        else:
            print(f'{channel} Avatar: NOT FOUND')
    except Exception as e:
        print(f'{channel} Error: {e}')
