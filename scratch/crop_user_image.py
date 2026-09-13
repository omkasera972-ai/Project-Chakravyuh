import os
import cv2

uploaded_dir = r"C:\Users\ashwi\.gemini\antigravity-ide\brain\38f39622-2c89-499f-a504-1ac223cc8dca\.user_uploaded"
target_dir = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\public\images"

user_img_path = os.path.join(uploaded_dir, "media_1789119749617.png")

if os.path.exists(user_img_path):
    img = cv2.imread(user_img_path)
    height, width, _ = img.shape
    print(f"Original User Image Size: {width}x{height}")
    
    # Left half crop (0 to width//2)
    left_half = img[:, :width//2]
    
    out_path = os.path.join(target_dir, "attendance_hero.jpg")
    cv2.imwrite(out_path, left_half)
    print(f"Successfully saved cropped attendance hero image to: {out_path}")
else:
    print(f"Error: User image not found at {user_img_path}")
