#!/usr/bin/env python3
"""Register the local archive server and its skills without storing credentials."""

import argparse
import os
from pathlib import Path
import shutil
import tempfile
from datetime import datetime, timezone

import yaml


def register(archive_root: Path, config: Path, skills_root: Path, install: bool) -> None:
    backend = archive_root.resolve() / "backend"
    python = backend / ".venv/bin/python"
    original_skill = backend / "skills/personnel-archive"
    review_skill = Path(__file__).resolve().parents[1] / "skills/personnel-archive-review"
    for required in (python, backend / "app/integrations/mcp_server.py", original_skill / "SKILL.md", review_skill / "SKILL.md"):
        if not required.is_file():
            raise SystemExit(f"Required local file is missing: {required}")
    current = yaml.safe_load(config.read_text()) if config.exists() else {}
    if current is None:
        current = {}
    if not isinstance(current, dict) or not isinstance(current.get("extensions", {}), dict):
        raise SystemExit("Expected a Goose YAML configuration with an extensions mapping")
    extensions = current.setdefault("extensions", {})
    entry = {
        "enabled": False,
        "type": "stdio",
        "name": "personnel-archive",
        "description": "档案管理 MCP：人员检索、已发布证据核对与快照复现（只读）",
        "cmd": str(python),
        "args": ["-m", "app.integrations.mcp_server"],
        "cwd": str(backend),
        "envs": {"ARCHIVE_API_URL": "http://127.0.0.1:8000"},
        "env_keys": ["ARCHIVE_API_TOKEN"],
        "timeout": 60,
    }
    key = next((key for key, value in extensions.items() if isinstance(value, dict) and value.get("name") == entry["name"]), "personnel-archive")
    if key in extensions:
        print("Existing archive extension kept; credentials and enabled state were not replaced.")
    else:
        extensions[key] = entry
    destinations = [(original_skill, skills_root / "personnel-archive"), (review_skill, skills_root / "personnel-archive-review")]
    for source, destination in destinations:
        if destination.exists() and any(not (source / path.relative_to(destination)).is_file() or path.read_bytes() != (source / path.relative_to(destination)).read_bytes() for path in destination.rglob("*") if path.is_file()):
            raise SystemExit(f"Skill already exists with local changes; resolve before installing: {destination}")
    print(f"Archive extension: {key}; skills: personnel-archive, personnel-archive-review")
    print("Default state: disabled. Configure ARCHIVE_API_TOKEN through Goose secret settings or the launch environment, verify ARCHIVE_API_URL, then enable the extension.")
    if not install:
        print("Dry run only; pass --install to register.")
        return
    config.parent.mkdir(parents=True, exist_ok=True)
    if config.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup = config.with_name(config.name + ".township-backup-" + stamp)
        shutil.copy2(config, backup)
        os.chmod(backup, 0o600)
    for source, destination in destinations:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, destination, dirs_exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", dir=config.parent, prefix=".township-", delete=False) as output:
        temporary = Path(output.name)
        yaml.safe_dump(current, output, allow_unicode=True, sort_keys=False)
    os.chmod(temporary, 0o600)
    os.replace(temporary, config)
    print("Registration installed. Reopen Goose or refresh extensions/skills; no archive records were queried.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-root", required=True, type=Path)
    parser.add_argument("--config", type=Path, default=Path.home() / ".config/goose/config.yaml")
    parser.add_argument("--skills-root", type=Path, default=Path.home() / ".agents/skills")
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()
    register(args.archive_root, args.config, args.skills_root, args.install)


if __name__ == "__main__":
    main()
