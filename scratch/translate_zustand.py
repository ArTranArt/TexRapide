import re

with open('src/hooks/useAppState.ts', 'r') as f:
    content = f.read()

# Extract interface/type definitions
interfaces = re.findall(r'(interface\s+\w+\s*{[^}]*})', content)

# Extract state variables
states = re.findall(r'const \[(\w+), (set[A-Z]\w+)\] = useState(<[^>]+>)?\((.*?)\);', content, re.DOTALL)

state_interfaces = []
state_initializers = []

for name, setter, type_arg, init_val in states:
    # clean up init_val if it has newlines
    init_val = init_val.strip()
    
    # deduce type
    type_str = "any"
    if type_arg:
        type_str = type_arg[1:-1] # remove < >
    else:
        if init_val in ("true", "false", "() => false", "() => true"):
            type_str = "boolean"
        elif init_val.startswith('""') or init_val.startswith("''"):
            type_str = "string"
        elif init_val.isdigit():
            type_str = "number"
        elif init_val == "[]":
            type_str = "any[]"
            
    state_interfaces.append(f"  {name}: {type_str};")
    state_interfaces.append(f"  {setter}: (val: {type_str} | ((prev: {type_str}) => {type_str})) => void;")
    
    if "() =>" in init_val and "localStorage" in init_val:
        # evaluate the arrow function
        # this is tricky, we'll just put it as a direct call or wrap in IIFE
        state_initializers.append(f"  {name}: ( {init_val} )(),")
    else:
        state_initializers.append(f"  {name}: {init_val},")
        
    state_initializers.append(f"  {setter}: (val) => set((state) => ({{ {name}: typeof val === 'function' ? (val as any)(state.{name}) : val }})),")

store_code = f"""import {{ create }} from 'zustand';

{''.join(interfaces)}

export interface AppState {{
{chr(10).join(state_interfaces)}
}}

export const useAppStore = create<AppState>((set, get) => ({{
{chr(10).join(state_initializers)}
}}));
"""

with open('scratch/appStore.ts', 'w') as f:
    f.write(store_code)

print("Generated scratch/appStore.ts")
