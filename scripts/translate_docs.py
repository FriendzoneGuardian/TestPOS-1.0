import os
import re

docs_dir = r"c:\Users\franc\Documents\TestPOS-1.0\docs"
client_dir = os.path.join(docs_dir, "official_client")

replacements = {
    r"The Rizz Limit": "The Harvest Limit (Credit Cap)",
    r"The Inside Job": "The Stable Account (Employee Linking)",
    r"The Salary Squeeze": "The Monthly Crop (Payroll Baseline)",
    r"COGSchamp": "Crop-to-Table Costing (COGS)",
    r"Aura Gain": "Golden Yield (Gross Profit)",
    r"Ancient Aura": "Fermented Crop (Debt Aging)",
    r"The Digital Brick": "The Barn Door (System Lockdown)",
    r"The Cold Shoulder": "The Scarecrow Protocol (Inactivity Guard)",
    r"The Endless Foreplay": "The Long Season (Session Persistence)",
    r"Security Boot Flush": "The Spring Till (Token Purge)",
    r"Midnight Purge": "The Rooster's Call (Midnight Reset)",
    r"The Velvet Rope": "The White Picket Fence (Premium UI)",
    r"MoneyShot": "FarmYield POS",
    r"TestPOS-1\.0": "FarmYield-1.0",
    r"Auditor's Revenge": "The Inspector's Audit",
    r"Spicy": "Professional"
}

files_to_process = [
    "RetailPOS_Handoff_WebTeam.md",
    "RetailPOS_CodingAgent_Checklist.md",
    "WIKI_REFERENCE.md",
    "JulesTask.md"
]

for filename in files_to_process:
    source_path = os.path.join(docs_dir, filename)
    if not os.path.exists(source_path):
        continue
        
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for k, v in replacements.items():
        content = re.sub(k, v, content, flags=re.IGNORECASE)
        
    dest_path = os.path.join(client_dir, f"{filename.replace('.md', '_FarmEdition.md')}")
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Documentation translation complete.")
