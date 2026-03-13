import os
import re

# Mapping of common double-encoded UTF-8 sequences to their correct characters
CORRECTIONS = {
    "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú",
    "Ã": "Á", "Ã‰": "É", "Ã": "Í", "Ã“": "Ó", "Ãš": "Ú",
    "Ã±": "ñ", "Ã‘": "Ñ",
    "Â¿": "¿", "Â¡": "¡",
    "â€¢": "•",
    "âš¡": "⚡",
    "âœ…": "✅",
    "â—": "●",
    "â€“": "–",
    "â€”": "—",
    "â„¢": "™",
    "â€˜": "‘",
    "â€™": "’",
    "â€œ": "“",
    "â€": "”",
    "â€": "”", # Specific case for closing quote sometimes mangled
    "Ã¼": "ü", "Ãœ": "Ü",
    "Â": "", # Often trailing Â from double encoding of spaces or other chars
    "â€¡": "‡",
    "â€ ": "†",
    "â€¦": "…",
    "â„": "ℹ️"
}

# Add emojis that might be double encoded
EMOJI_CORRECTIONS = {
    "Ã°Å¸â€œË†": "📈",
    "Ã°Å¸Å¡â‚¬": "🚀",
    "Ã°Å¸â€˜â€˜": "👑",
    "Ã°Å¸Å’Å¸": "🌟",
    "â­ ": "⭐",
    "Ã°Å¸â€™Â¡": "💡",
    "Ã°Å¸â€Â¥": "🔥",
    "Ã°Å¸â€™Â°": "💰",
    "Ã°Å¸â€œâ€¹": "📋",
    "Ã°Å¸Â¤Â©": "🤩",
    "Ã°Å¸Â¤Â©": "🤩",
    "Ã°Å¸Å’Â±": "🌱",
    "Ã°Å¸Â§Â©": "🧩",
    "Ã°Å¸Å½Â¯": "🎯"
}

CORRECTIONS.update(EMOJI_CORRECTIONS)

def clean_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply corrections
        # Sort by length descending to avoid partial replacements
        for search, replace in sorted(CORRECTIONS.items(), key=lambda x: len(x[0]), reverse=True):
            content = content.replace(search, replace)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
    except Exception as e:
        # print(f"Error processing {filepath}: {e}")
        pass
    return False

def main():
    exclude_dirs = {'.git', 'node_modules', 'dist', '.next', 'build'}
    extensions = {'.tsx', '.ts', '.js', '.jsx', '.css', '.html', '.mjml', '.md', '.json'}
    
    count = 0
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                if clean_file(os.path.join(root, file)):
                    count += 1
    
    print(f"Total files fixed: {count}")

if __name__ == "__main__":
    main()
