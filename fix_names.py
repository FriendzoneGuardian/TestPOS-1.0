
import glob
for f in glob.glob('templates/**/*.html', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'DjangoShot' in content:
        content = content.replace('DjangoShot', 'TheMoneyShot')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

