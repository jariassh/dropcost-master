import os

# Specific hex replacements for double-encoded characters found in the project
# Source: E2 80 A2 (•) -> C3 A2 E2 82 AC C2 A2 (â€¢)
# Source: E2 9A A1 (⚡) -> C3 A2 C2 9A C2 A1 (âš¡)

HEX_REPLACEMENTS = {
    bytes.fromhex('C3 A2 E2 82 AC C2 A2'): bytes.fromhex('E2 80 A2'), # â€¢ -> •
    bytes.fromhex('C3 A2 C2 9A C2 A1'): bytes.fromhex('E2 9A A1'), # âš¡ -> ⚡
    bytes.fromhex('C3 82 C2 BF'): bytes.fromhex('C2 BF'), # Â¿ -> ¿
    bytes.fromhex('C3 82 C2 A1'): bytes.fromhex('C2 A1'), # Â¡ -> ¡
}

def fix_file(path):
    with open(path, 'rb') as f:
        content = f.read()
    
    new_content = content
    for search, replace in HEX_REPLACEMENTS.items():
        new_content = new_content.replace(search, replace)
        
    if new_content != content:
        with open(path, 'wb') as f:
            f.write(new_content)
        print(f"Fixed (hex): {path}")

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
