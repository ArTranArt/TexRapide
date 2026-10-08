import re

with open('src/hooks/useAppState.ts', 'r') as f:
    content = f.read()

states = re.findall(r'const \[(\w+), set[A-Z]\w+\] = useState(<[^>]+>)?\((.*?)\);', content)

for state in states:
    print(state)
