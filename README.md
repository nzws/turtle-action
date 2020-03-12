# 🐢 turtle-action

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/nzws/turtle-action/Node%20CI?style=for-the-badge)](https://github.com/nzws/turtle-action/actions)
[![GitHub](https://img.shields.io/github/license/nzws/turtle-action?style=for-the-badge)](#license)
[![code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge&logo=prettier)](https://prettier.io/)
[![dependabot enabled](https://img.shields.io/badge/dependabot-enabled-0366D6.svg?style=for-the-badge&logo=dependabot)](https://github.com/nzws/turtle-action/pulls?utf8=%E2%9C%93&q=is%3Apr+label%3Adependencies+)

> 🐢 Turtle CLI with GitHub Actions for building expo-project

- [ ] Android
- [ ] iOS

# Usage

In workflow:

```yaml
- uses: nzws/turtle-action@v1
  with:
    build_os: 'android' # android or ios
    expo_sdk_version: '36.0.0'
    token: ${{ secrets.GITHUB_TOKEN }}
```

# License

- code: MIT
