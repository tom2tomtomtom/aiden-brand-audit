#!/usr/bin/env python3
"""
Script to replace the complex multi-section LLM analysis with optimized single-pass version
"""

def replace_llm_analysis():
    # Read the original file
    with open('/Users/thomasdowuona-hyde/brand-audit-app/backend/simple_analysis.py', 'r') as f:
        lines = f.readlines()
    
    # Find the start and end lines (1577-1783, but Python uses 0-based indexing)
    start_line = 1576  # Line 1577 in 0-based indexing
    end_line = 1782    # Line 1783 in 0-based indexing
    
    # Read the optimized replacement
    with open('/Users/thomasdowuona-hyde/brand-audit-app/backend/optimized_llm_analysis.py', 'r') as f:
        content = f.read()
        # Extract just the replacement code from the triple quotes
        replacement_code = content.split('return \'\'\'')[1].split('\'\'\'')[0]
    
    # Replace the lines
    new_lines = lines[:start_line] + [replacement_code + '\n'] + lines[end_line + 1:]
    
    # Write back to the file
    with open('/Users/thomasdowuona-hyde/brand-audit-app/backend/simple_analysis.py', 'w') as f:
        f.writelines(new_lines)
    
    print(f"✅ Successfully replaced lines {start_line + 1}-{end_line + 1} with optimized LLM analysis")
    print(f"📊 Removed {end_line - start_line + 1} lines of complex multi-section analysis")
    print(f"📊 Added 1 line with optimized single-pass analysis")

if __name__ == "__main__":
    replace_llm_analysis()