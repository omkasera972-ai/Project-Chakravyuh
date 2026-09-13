import os
import shutil

brain_dir = r"C:\Users\ashwi\.gemini\antigravity-ide\brain\38f39622-2c89-499f-a504-1ac223cc8dca"
target_dir = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\public\images"

os.makedirs(target_dir, exist_ok=True)

files_map = {
    "attendance_hero_1789116074949.jpg": "attendance_hero.jpg",
    "criminal_hero_1789116194592.jpg": "criminal_hero.jpg",
    "anpr_hero_1789117102377.jpg": "anpr_hero.jpg",
    "missing_hero_1789117498855.jpg": "missing_hero.jpg",
    "defence_hero_1789117553801.jpg": "defence_hero.jpg"
}

for src_name, dst_name in files_map.items():
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(target_dir, dst_name)
    if os.path.exists(src_path):
        shutil.copy(src_path, dst_path)
        print(f"Copied {src_name} -> {dst_name}")

print("\nFinal verified contents of public/images:")
for f in sorted(os.listdir(target_dir)):
    print(" -", f)
