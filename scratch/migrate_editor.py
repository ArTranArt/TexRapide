import re
import os

def migrate():
    # 1. Update Project.tsx
    with open("src/components/Project.tsx", "r") as f:
        proj_content = f.read()
    
    proj_content = "import { useEditorStore } from '../store/editorStore';\n" + proj_content
    
    # Remove from useAppContext
    proj_content = re.sub(r'editorContent,\s*', '', proj_content)
    proj_content = re.sub(r'setEditorContent,\s*', '', proj_content)
    
    # Add to Project.tsx
    proj_content = proj_content.replace(
        "const { activeProject,",
        "const { editorContent, setEditorContent } = useEditorStore();\n  const { activeProject,"
    )
    
    with open("src/components/Project.tsx", "w") as f:
        f.write(proj_content)


    # 2. Update useAppState.ts
    with open("src/hooks/useAppState.ts", "r") as f:
        app_content = f.read()

    app_content = "import { useEditorStore } from '../store/editorStore';\n" + app_content

    # Remove the useState
    app_content = re.sub(r'\s*const \[editorContent, setEditorContent\] = useState<string>\(""\);\n', '\n', app_content)

    # In useAppState, we must subscribe to editorContent to trigger autosave.
    # Actually, we can just replace all `editorContent` with `useEditorStore.getState().editorContent`
    # EXCEPT we need a way to trigger the useEffects!
    # A cleaner way is to keep editorContent as a ref inside useAppState? No.

    # Let's just manually fix useAppState later. I'll print success.

migrate()
