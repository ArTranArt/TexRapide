import re

with open("src/hooks/useAppState.ts", "r") as f:
    content = f.read()

auto_download_code = """
  // Auto-download Tectonic if missing
  useEffect(() => {
    invoke<HealthStatus[]>("check_latex_health").then((status) => {
      const tectonic = status.find(s => s.binary === "tectonic");
      if (tectonic && !tectonic.installed) {
        console.log("Tectonic not found, initiating background download...");
        invoke("download_tectonic").then(() => {
          console.log("Tectonic successfully downloaded.");
        }).catch(console.error);
      }
    }).catch(console.error);
  }, []);
"""

# Insert it before `return {`
content = content.replace("  return {", auto_download_code + "\n  return {")

with open("src/hooks/useAppState.ts", "w") as f:
    f.write(content)
