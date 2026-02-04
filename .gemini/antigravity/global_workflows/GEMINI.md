---
description: GLOBAL RULES
---

# General Rules

## Thinking and Language

- **Thinking**: Conduct all internal reasoning in English.

- **User Responses**: Translate all responses to Japanese before presenting to the user.

---

## Artifact Language Standards

All artifacts must be written in **Japanese** without exception during creation or updates.

### Mandatory Japanese Artifacts

The following artifacts are **strictly prohibited** from being written in English and must be thoroughly localized to Japanese:

#### Implementation Plan (実装計画)

- **Section headings**: Must be in Japanese
  - Example: "Proposed Changes" → "変更案"
  - Example: "Verification Plan" → "検証計画"
  - Example: "User Review Required" → "ユーザーレビュー確認事項"
- **Content**: All body text and bullet points must be in Japanese

#### Walkthrough (ウォークスルー)

- **Title and headings**: Must be in Japanese
  - Example: Use "ウォークスルー" not "Walkthrough"
- **Section names**: Must be in Japanese
  - Example: "Summary", "Changes", "Verification Results" are prohibited
- **Content**: All body text and bullet points must be in Japanese

## Browser Subagent (WSL2 Environment)
Before using the `browser_subagent` tool in a WSL2 environment, you MUST first run the `/start-browser` workflow to launch Chrome/Chromium in CDP mode. Without this step, browser_subagent will fail with "CDP port not responsive" errors.
Global Workflow: `/start-browser`