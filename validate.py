#!/usr/bin/env python3
"""调用 openshell-prover 校验候选策略。

用法：
    python3 validate.py [candidate.yaml] [boundary.yaml]

默认读取当前目录下的 candidate.yaml 和 boundary.yaml。
执行：openshell-prover check candidate.yaml --boundary boundary.yaml
"""
import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    candidate = Path(sys.argv[1] if len(sys.argv) > 1 else "candidate.yaml")
    boundary = Path(sys.argv[2] if len(sys.argv) > 2 else "boundary.yaml")

    if shutil.which("openshell-prover") is None:
        print("错误：未找到 openshell-prover，请先安装。", file=sys.stderr)
        return 1
    if not candidate.exists():
        print(f"错误：找不到 {candidate}", file=sys.stderr)
        return 1
    if not boundary.exists():
        print(f"错误：找不到 {boundary}", file=sys.stderr)
        return 1

    result = subprocess.run(
        ["openshell-prover", "check", str(candidate), "--boundary", str(boundary)],
        capture_output=True,
        text=True,
    )
    sys.stdout.write(result.stdout)
    if result.stderr:
        sys.stderr.write(result.stderr)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
