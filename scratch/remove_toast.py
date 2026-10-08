import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# 1. Remove state
state_code = r'\s*const \[showToast, setShowToast\] = React\.useState\(false\);\s*React\.useEffect\(\(\) => \{.*?\}, \[compileStatus\]\);'
content = re.sub(state_code, '', content, flags=re.DOTALL)

# 2. Remove pill code
pill_code = r'\s*\{/\* Toast Pills \*/\}.*?</div>\s*\)\}'
content = re.sub(pill_code, '', content, flags=re.DOTALL)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
