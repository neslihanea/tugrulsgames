import sys, re

def check_brackets(filepath):
    pairs = {'{': '}', '[': ']', '(': ')'}
    stack = []
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Strip comments and strings to avoid false positives
    content = re.sub(r'//.*', '', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'".*?(?<!\\)"', '""', content)
    content = re.sub(r"'.*?(?<!\\)'", "''", content)
    content = re.sub(r'`.*?`', '``', content, flags=re.DOTALL)
    
    lines = content.split('\n')
    for line_num, line in enumerate(lines, 1):
        for char in line:
            if char in pairs.keys():
                stack.append((char, line_num))
            elif char in pairs.values():
                if not stack:
                    print(f"Error: Unmatched closing bracket '{char}' on line {line_num}")
                    return
                top, top_line = stack.pop()
                if pairs[top] != char:
                    print(f"Error: Mismatched bracket '{char}' on line {line_num} (expected {pairs[top]} to match '{top}' from line {top_line})")
                    return
    if stack:
        top, top_line = stack.pop()
        print(f"Error: Unclosed bracket '{top}' opened on line {top_line}")
        return
    print("Syntax brackets look OK.")

if __name__ == '__main__':
    check_brackets(sys.argv[1])
