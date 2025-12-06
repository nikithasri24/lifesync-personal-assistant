#!/usr/bin/env python3
"""
Automatically fix all ESLint unused-vars violations.
"""

import re
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple

def parse_violations(violations_file: str) -> Dict[str, List[Dict]]:
    """Parse violations and group by file."""
    violations_by_file = defaultdict(list)
    current_file = None

    with open(violations_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line.endswith('.tsx') or line.endswith('.ts'):
                current_file = line
            elif current_file and 'error' in line and '@typescript-eslint/no-unused-vars' in line:
                match = re.match(r'(\d+):(\d+)\s+error\s+\'([^\']+)\'\s+(.+?)@typescript-eslint', line)
                if match:
                    violations_by_file[current_file].append({
                        'line': int(match.group(1)),
                        'col': int(match.group(2)),
                        'var': match.group(3),
                        'msg': match.group(4).strip()
                    })

    return violations_by_file

def fix_import_line(line: str, var_name: str) -> str:
    """Remove a specific import from an import line."""
    # Pattern: import { A, B, C } from 'module'
    if '{' in line and '}' in line:
        match = re.search(r'\{([^}]+)\}', line)
        if match:
            imports = match.group(1)
            import_list = [i.strip() for i in imports.split(',')]
            # Remove exact matches and aliases
            import_list = [i for i in import_list if not (i == var_name or i.startswith(f'{var_name} as ') or i.endswith(f' as {var_name}'))]

            if not import_list:
                return None  # Remove entire line

            new_imports = ', '.join(import_list)
            return re.sub(r'\{[^}]+\}', f'{{ {new_imports} }}', line)

    # Pattern: import varName from 'module' or import * as varName
    if re.search(rf'\bimport\s+{re.escape(var_name)}\s+from\b', line) or \
       re.search(rf'\bimport\s+\*\s+as\s+{re.escape(var_name)}\s+from\b', line):
        return None  # Remove entire line

    return line

def prefix_with_underscore(line: str, var_name: str) -> str:
    """Prefix a variable name with underscore."""
    # For parameters and variables, be careful with word boundaries
    patterns = [
        (rf'\b{re.escape(var_name)}:', f'_{var_name}:'),  # name: type
        (rf'\b{re.escape(var_name)},', f'_{var_name},'),  # name,
        (rf'\({re.escape(var_name)}\)', f'(_{var_name})'),  # (name)
        (rf'\b{re.escape(var_name)}\)', f'_{var_name})'),  # name)
        (rf',\s*{re.escape(var_name)}\s*\)', f', _{var_name})'),  # , name)
        (rf'\b{re.escape(var_name)}=', f'_{var_name}='),  # name =
        (rf'\bconst\s+{re.escape(var_name)}\b', f'const _{var_name}'),  # const name
        (rf'\blet\s+{re.escape(var_name)}\b', f'let _{var_name}'),  # let name
        (rf'catch\s*\(\s*{re.escape(var_name)}\s*\)', f'catch (_{var_name})'),  # catch (error)
    ]

    for pattern, replacement in patterns:
        new_line = re.sub(pattern, replacement, line)
        if new_line != line:
            return new_line

    return line

def fix_file(file_path: str, violations: List[Dict]) -> int:
    """Fix all violations in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"  ✗ Error reading {file_path}: {e}")
        return 0

    # Sort violations by line number (descending) to avoid line shifts
    violations.sort(key=lambda x: x['line'], reverse=True)

    fixes_applied = 0
    lines_to_remove = set()

    for v in violations:
        line_idx = v['line'] - 1
        if line_idx >= len(lines) or line_idx < 0:
            continue

        line = lines[line_idx]
        var_name = v['var']
        msg = v['msg']

        # Determine violation type and apply appropriate fix
        if 'caught errors must match' in msg:
            # Error in catch block - prefix with underscore
            new_line = prefix_with_underscore(line, var_name)
            if new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

        elif 'unused args must match' in msg:
            # Function parameter - prefix with underscore
            new_line = prefix_with_underscore(line, var_name)
            if new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

        elif line.strip().startswith('import '):
            # Import statement - remove the unused import
            new_line = fix_import_line(line, var_name)
            if new_line is None:
                lines_to_remove.add(line_idx)
                fixes_applied += 1
            elif new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

        elif 'is assigned a value but never used' in msg:
            # Variable assignment - prefix with underscore
            new_line = prefix_with_underscore(line, var_name)
            if new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

        elif 'is defined but never used' in msg:
            # Other unused variable - try to prefix with underscore
            new_line = prefix_with_underscore(line, var_name)
            if new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

    # Remove marked lines
    if lines_to_remove:
        lines = [line for idx, line in enumerate(lines) if idx not in lines_to_remove]

    # Write back if fixes were applied
    if fixes_applied > 0:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return fixes_applied
        except Exception as e:
            print(f"  ✗ Error writing {file_path}: {e}")
            return 0

    return 0

def main():
    violations_file = '/Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant/scripts/output/violations-with-files.txt'

    print("Parsing violations...")
    violations_by_file = parse_violations(violations_file)

    print(f"Found {len(violations_by_file)} files with violations\n")

    total_fixes = 0
    files_modified = 0

    for i, (file_path, violations) in enumerate(violations_by_file.items(), 1):
        file_name = Path(file_path).name
        print(f"[{i}/{len(violations_by_file)}] Processing {file_name} ({len(violations)} violations)...")

        fixes = fix_file(file_path, violations)
        if fixes > 0:
            print(f"  ✓ Fixed {fixes} violations")
            total_fixes += fixes
            files_modified += 1
        else:
            print(f"  - No fixes applied")

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files modified: {files_modified}/{len(violations_by_file)}")
    print(f"  Total fixes applied: {total_fixes}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
