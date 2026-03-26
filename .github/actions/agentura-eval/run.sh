#!/usr/bin/env bash

set -euo pipefail

config_path="${AGENTURA_ACTION_CONFIG:-agentura.yaml}"
summary_file="${GITHUB_STEP_SUMMARY:?}"
output_file="$(mktemp)"
alias_created=0
original_backup=""

cleanup() {
  rm -f "$output_file"

  if [ "$alias_created" -eq 1 ]; then
    rm -f agentura.yaml
  fi

  if [ -n "$original_backup" ]; then
    mv "$original_backup" agentura.yaml
  fi
}

trap cleanup EXIT

if [ ! -f "$config_path" ]; then
  echo "Config file not found: $config_path" >&2
  exit 1
fi

config_dir="$(dirname "$config_path")"
config_name="$(basename "$config_path")"

cd "$config_dir"

if [ "$config_name" != "agentura.yaml" ]; then
  if [ -e agentura.yaml ]; then
    original_backup="$(mktemp agentura.yaml.backup.XXXXXX)"
    mv agentura.yaml "$original_backup"
  fi

  ln -s "$config_name" agentura.yaml
  alias_created=1
fi

set +e
agentura run --local 2>&1 | tee "$output_file"
status=${PIPESTATUS[0]}
set -e

{
  echo "## Agentura Eval Results"
  echo
  echo "Config: \`${config_path}\`"
  echo
  echo '```text'
  cat "$output_file"
  echo '```'
  echo
  echo "Provide any one of \`ANTHROPIC_API_KEY\`, \`OPENAI_API_KEY\`, \`GEMINI_API_KEY\`, or \`GROQ_API_KEY\` in the caller workflow when using \`llm_judge\` suites."
} >> "$summary_file"

exit "$status"
