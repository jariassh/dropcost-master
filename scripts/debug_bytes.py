import sys

with open(r'c:\Users\user\Desktop\Dropshipping\Dev\DropCost Master\src\pages\admin\AdminEmailTemplatesPage.tsx', 'rb') as f:
    content = f.read()

# Search for the context 
# Line 4131: selectedUserPlan.features.map((f: string) => `â€¢ ${f}`)
search_bytes = b'selectedUserPlan.features.map((f: string) => `'
index = content.find(search_bytes)
if index != -1:
    context = content[index:index+100]
    print(f"Context at 4131: {context}")
    print(f"Hex: {context.hex(' ')}")

search_bytes_2 = b'newItem.trigger_event && (() => {'
index_2 = content.find(search_bytes_2)
if index_2 != -1:
    context_2 = content[index_2:index_2+200]
    print(f"Context at 6777 area: {context_2}")
    print(f"Hex: {context_2.hex(' ')}")
