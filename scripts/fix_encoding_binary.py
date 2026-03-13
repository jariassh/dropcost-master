import os

# Define byte mappings for double-encoded UTF-8 characters
BYTE_MAPPINGS = {
    # Latin characters
    b'\xc3\x83\xc2\xa1': b'\xc3\xa1',  # Ã¡ -> á
    b'\xc3\x83\xc2\xa9': b'\xc3\xa9',  # Ã© -> é
    b'\xc3\x83\xc2\xad': b'\xc3\xad',  # Ã­ -> í
    b'\xc3\x83\xc2\xb3': b'\xc3\xb3',  # Ã³ -> ó
    b'\xc3\x83\xc2\xba': b'\xc3\xba',  # Ãº -> ú
    b'\xc3\x83\xc2\x91': b'\xc3\x91',  # Ã‘ -> Ñ
    b'\xc3\x83\xc2\xb1': b'\xc3\xb1',  # Ã± -> ñ
    b'\xc3\x82\xc2\xbf': b'\xc2\xbf',  # Â¿ -> ¿
    b'\xc3\x82\xc2\xa1': b'\xc2\xa1',  # Â¡ -> ¡
    
    # Capital Latin
    b'\xc3\x83\xc2\x89': b'\xc3\x89',  # Ã‰ -> É
    b'\xc3\x83\xc2\x81': b'\xc3\x81',  # Ã  -> Á
    b'\xc3\x83\xc2\x8d': b'\xc3\x8d',  # Ã  -> Í
    b'\xc3\x83\xc2\x93': b'\xc3\x93',  # Ã“ -> Ó
    b'\xc3\x83\xc2\x9a': b'\xc3\x9a',  # Ãš -> Ú
    
    # Symbols
    b'\xe2\x80\xa2': b'\xe2\x80\xa2', # Bullet (•) - already correct but sometimes double encoded
    b'\xc3\xa2\xe2\x82\xac\xc2\xa2': b'\xe2\x80\xa2', # â€¢ -> •
    b'\xc3\xa2\xc2\x9a\xc2\xa1': b'\xe2\x9a\xa1', # âš¡ -> ⚡
    b'\xc3\xa2\xc2\x9c\xc2\x85': b'\xe2\x9c\x85', # âœ… -> ✅
}

def fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        
        new_content = content
        for search, replace in BYTE_MAPPINGS.items():
            new_content = new_content.replace(search, replace)
            
        if new_content != content:
            with open(filepath, 'wb') as f:
                f.write(new_content)
            print(f"Fixed (binary): {filepath}")
            return True
    except Exception as e:
        pass
    return False

def main():
    exclude_dirs = {'.git', 'node_modules', 'dist'}
    extensions = {'.tsx', '.ts', '.js', '.jsx', '.css', '.html', '.mjml'}
    
    count = 0
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                if fix_file(os.path.join(root, file)):
                    count += 1
    
    print(f"Total binary fixes: {count}")

if __name__ == "__main__":
    main()
