"""
Maintenance script to clean up the `src/utils/db.ts` file.

This script removes an unused `source` variable and related assignments
from the TypeScript database utility file. It is intended as a one-off
local cleanup/tooling script and should be run manually when needed:

    python scripts/fix_db.py

It does not run automatically when imported.
"""

import re


def main() -> None:
    with open('src/utils/db.ts', 'r') as f:
        content = f.read()

    # Remove the unused `source` variable
    content = re.sub(r"let source = '';\s*", "", content)
    content = re.sub(r"source = 'muevecancun_balance';\s*", "", content)
    content = re.sub(r"source = 'user_balance';\s*", "", content)

    with open('src/utils/db.ts', 'w') as f:
        f.write(content)


if __name__ == "__main__":
    main()
