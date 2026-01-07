from PIL import Image, ImageDraw, ImageFont

# Image size
width, height = 1200, 500
img = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(img)

# Fonts
try:
    font = ImageFont.truetype("arial.ttf", 16)
    title_font = ImageFont.truetype("arial.ttf", 20)
except:
    font = ImageFont.load_default()
    title_font = font

# Title
draw.text((450, 20), "Project Gantt Chart", fill="black", font=title_font)

# Timeline (week 6 to week 13)
weeks = ["W6","W7","W8","W9","W10","W11","W12","W13"]
x_start = 220
for i, w in enumerate(weeks):
    draw.text((x_start + i*80, 70), w, fill="black", font=font)

# Tasks (name, start week, duration in weeks)
tasks = [
    ("Project Kickoff", 6, 1),
    ("Dataset Finalization", 7, 2),
    ("Initial Model Training", 9, 2),
    ("Model Integration", 11, 1.5),
    ("System Testing", 12.5, 1.5),
    ("Final Report Preparation", 13, 1),
]

# Draw bars
y = 120
bar_height = 25
for task, start, duration in tasks:
    draw.text((20, y), task, fill="black", font=font)
    # Adjust X position relative to W6 as start
    x = x_start + (start - 6) * 80
    w = int(duration * 80)
    draw.rectangle([x, y, x + w, y + bar_height], fill="#4F81BD")
    y += 45

# Save PNG
img.save("project_gantt_chart.png")

print("Gantt chart saved as project_gantt_chart.png")
