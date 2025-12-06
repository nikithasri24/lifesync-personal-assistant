#!/usr/bin/env python3
"""
Script to fix all ESLint unused-vars violations.
Handles:
1. Unused imports - removes them
2. Unused error variables in catch blocks - prefixes with underscore
3. Unused function parameters - prefixes with underscore
"""

import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple

def parse_violations(violations_file: str) -> Dict[str, List[Tuple[int, int, str, str]]]:
    """Parse violations file and group by file path."""
    violations_by_file = {}
    current_file = None

    with open(violations_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line.endswith('.tsx') or line.endswith('.ts'):
                current_file = line
                violations_by_file[current_file] = []
            elif current_file and 'error' in line and '@typescript-eslint/no-unused-vars' in line:
                # Parse: "5:48   error    'Trash2' is defined but never used..."
                match = re.match(r'(\d+):(\d+)\s+error\s+\'([^\']+)\'\s+(.+?)@typescript-eslint', line)
                if match:
                    line_num = int(match.group(1))
                    col_num = int(match.group(2))
                    var_name = match.group(3)
                    error_msg = match.group(4).strip()
                    violations_by_file[current_file].append((line_num, col_num, var_name, error_msg))

    return violations_by_file

def is_import_statement(line: str) -> bool:
    """Check if line is an import statement."""
    return line.strip().startswith('import ')

def is_catch_error(line: str, var_name: str) -> bool:
    """Check if variable is in a catch block."""
    return 'catch' in line and f'({var_name})' in line or f'catch ({var_name})' in line

def remove_import_item(line: str, var_name: str) -> str:
    """Remove a specific import from an import statement."""
    # Handle different import patterns
    # import { A, B, C } from 'module'
    # import A from 'module'
    # import * as A from 'module'

    # Check if it's a default import
    if re.match(rf'import\s+{re.escape(var_name)}\s+from', line):
        return None  # Remove entire line

    # Check if it's a namespace import (import * as name)
    if re.match(rf'import\s+\*\s+as\s+{re.escape(var_name)}\s+from', line):
        return None  # Remove entire line

    # Handle named imports
    if '{' in line and '}' in line:
        # Extract the imports between braces
        match = re.search(r'\{([^}]+)\}', line)
        if match:
            imports = match.group(1)
            import_list = [i.strip() for i in imports.split(',')]
            # Remove the target import
            import_list = [i for i in import_list if var_name not in i.split(' as ')[0]]

            if not import_list:
                return None  # Remove entire line if no imports left

            # Reconstruct the import statement
            new_imports = ', '.join(import_list)
            new_line = re.sub(r'\{[^}]+\}', f'{{ {new_imports} }}', line)
            return new_line

    return None

def fix_file(file_path: str, violations: List[Tuple[int, int, str, str]]) -> int:
    """Fix all violations in a file. Returns number of fixes applied."""
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

    # Sort violations by line number in reverse to avoid line number changes
    violations.sort(key=lambda x: x[0], reverse=True)

    fixes_applied = 0
    lines_to_remove = set()

    for line_num, col_num, var_name, error_msg in violations:
        if line_num > len(lines):
            continue

        line_idx = line_num - 1
        line = lines[line_idx]

        # Determine fix type
        if 'caught errors' in error_msg:
            # Catch block error - prefix with underscore
            if is_catch_error(line, var_name):
                lines[line_idx] = line.replace(f'({var_name})', f'(_<br/>{var_name})')
                lines[line_idx] = lines[line_idx].replace(f'catch (_<br/>{var_name})', f'catch (_{var_name})')
                fixes_applied += 1

        elif 'unused args must match' in error_msg:
            # Function parameter - prefix with underscore
            # Handle various parameter patterns
            patterns = [
                (rf'\b{re.escape(var_name)}\s*:', f'_{var_name}:'),  # name: type
                (rf'\b{re.escape(var_name)}\s*,', f'_{var_name},'),  # name,
                (rf'\b{re.escape(var_name)}\s*\)', f'_{var_name})'),  # name)
                (rf'\b{re.escape(var_name)}\s*=', f'_{var_name}='),  # name =
            ]
            for pattern, replacement in patterns:
                if re.search(pattern, line):
                    lines[line_idx] = re.sub(pattern, replacement, lines[line_idx])
                    fixes_applied += 1
                    break

        elif is_import_statement(line):
            # Import statement - remove the import
            new_line = remove_import_item(line, var_name)
            if new_line is None:
                lines_to_remove.add(line_idx)
                fixes_applied += 1
            elif new_line != line:
                lines[line_idx] = new_line
                fixes_applied += 1

        elif 'is defined but never used' in error_msg and not 'args' in error_msg:
            # Variable assignment - might be unused local var, try to comment or prefix
            # For now, prefix with underscore if it's a simple pattern
            patterns = [
                (rf'\bconst\s+{re.escape(var_name)}\b', f'const _{var_name}'),
                (rf'\blet\s+{re.escape(var_name)}\b', f'let _{var_name}'),
                (rf'\bvar\s+{re.escape(var_name)}\b', f'var _{var_name}'),
            ]
            for pattern, replacement in patterns:
                if re.search(pattern, line):
                    lines[line_idx] = re.sub(pattern, replacement, lines[line_idx])
                    fixes_applied += 1
                    break

    # Remove marked lines
    if lines_to_remove:
        lines = [line for idx, line in enumerate(lines) if idx not in lines_to_remove]

    # Write back
    if fixes_applied > 0:
        try:
            with open(file_path, 'w') as f:
                f.writelines(lines)
            print(f"✓ Fixed {fixes_applied} violations in {Path(file_path).name}")
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return 0

    return fixes_applied

def main():
    violations_file = '/Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant/scripts/output/violations-with-files.txt'

    print("Parsing violations...")
    violations_by_file = parse_violations(violations_file)

    print(f"\nFound violations in {len(violations_by_file)} files")

    total_fixes = 0
    files_modified = 0

    for file_path, violations in violations_by_file.items():
        if violations:
            fixes = fix_file(file_path, violations)
            if fixes > 0:
                total_fixes += fixes
                files_modified += 1

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files modified: {files_modified}")
    print(f"  Total fixes applied: {total_fixes}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
