import os
import re

pattern = re.compile(r'\$\{\{\s*\"%\.2f\"\|format\((.*?)\)\s*\}\}')

for root, _, files in os.walk('app/templates'):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                contents = file.read()
            
            new_contents = pattern.sub(r'{{ \1|currency }}', contents)
            
            # Additional replacement for `$"%.2f"` format if it exists in templates directly? Wait, we already catch it.
            # What about `${{ ... }}` that just has `amount` formatted directly ?
            # And `\${{ ... }}`? No, jinja format is Usually exactly like `$\{\{ "%.2f"|format(price) \}\}`.
            
            # There might also be `$"%.2f"` being formatted outside of the template, let's catch basic ones.
            # But the strict ones:
            if contents != new_contents:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_contents)
                print(f"Updated {path}")
