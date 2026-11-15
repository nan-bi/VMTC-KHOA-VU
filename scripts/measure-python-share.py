"""Measure real UTF-8 Python/JavaScript source share against a Git baseline.

This is not GitHub Linguist and does not change attributes, source files or
language detection. Build output, dependencies and local data are excluded by
Git's existing ignore rules. Deleted tracked paths are omitted from the current
version; the baseline uses committed blob sizes after LF normalization.
"""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = {'.py': 'Python', '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript'}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def summary(files):
    totals = {'Python': 0, 'JavaScript': 0}
    counts = {'Python': 0, 'JavaScript': 0}
    for name, content in files:
        language = LANGUAGES.get(Path(name).suffix)
        if language:
            totals[language] += len(content.replace(b'\r\n', b'\n'))
            counts[language] += 1
    size = sum(totals.values())
    return dict(bytes=totals, files=counts, pythonPercent=round(100 * totals['Python'] / size, 4) if size else 0)


def current_files():
    names = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').decode('utf-8').split('\0')
    return [(name, (ROOT / name).read_bytes()) for name in sorted(set(names)) if name and Path(name).suffix in LANGUAGES and (ROOT / name).is_file()]


def baseline_files(ref):
    names = git('ls-tree', '-r', '--name-only', '-z', ref).decode('utf-8').split('\0')
    return [(name, git('show', f'{ref}:{name}')) for name in names if name and Path(name).suffix in LANGUAGES]


def measure(ref):
    before, after = baseline_files(ref), current_files()
    def active(item):
        return not item[0].startswith('prototype-local-v8/')
    def app(item):
        return active(item) and not item[0].startswith(('tests/', 'scripts/'))
    return dict(baselineCommit=git('rev-parse', ref).decode().strip(),
                definition='UTF-8 source bytes normalized LF; .py vs .js/.jsx/.mjs. No vendor/build/venv. Not GitHub Linguist.',
                wholeRepository=dict(before=summary(before), after=summary(after)),
                excludingArchive=dict(before=summary(filter(active, before)), after=summary(filter(active, after))),
                applicationExcludingTestsAndScripts=dict(before=summary(filter(app, before)), after=summary(filter(app, after))))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', default='b4b1ec6fc085e3b2f01db99f11c887e639a100cf')
    parser.add_argument('--output', default='docs/audit/python-phase2-language-share.json')
    args = parser.parse_args()
    output = (ROOT / args.output).resolve()
    if not output.is_relative_to(ROOT):
        raise SystemExit('Output must remain inside the project.')
    report = measure(args.baseline)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
