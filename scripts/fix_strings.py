import os

# Manual mapping for strings that are difficult to catch with auto-detection
MAPPINGS = {
    "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú",
    "Ã±": "ñ", "Â¿": "¿", "Â¡": "¡",
    "Ã ": "Á", "Ã‰": "É", "Ã ": "Í", "Ã“": "Ó", "Ãš": "Ú",
    "Ã‘": "Ñ",
    "â€¢": "•",
    "âš¡": "⚡",
    "âœ✅": "✅", # Partial mismatch sometimes
}

def fix_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for search, replace in MAPPINGS.items():
            new_content = new_content.replace(search, replace)
            
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed string: {path}")
            return True
    except:
        pass
    return False

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
