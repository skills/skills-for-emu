- [Why is special configuration needed for EMU users to use GitHub Skills?](#why-is-special-configuration-needed-for-emu-users-to-use-github-skills)
- [Can we use our existing EMU organization for Skills exercises?](#can-we-use-our-existing-emu-organization-for-skills-exercises)
- [Are enterprises using Data Residency (`ghe.com`) supported?](#are-enterprises-using-data-residency-ghecom-supported)
- [What is the purpose of the actions allow list?](#what-is-the-purpose-of-the-actions-allow-list)
- [Why is GitHub Codespaces required ?](#why-is-github-codespaces-required-)
- [Why are GitHub Actions required?](#why-are-github-actions-required)
- [How much will this cost?](#how-much-will-this-cost)
- [Do I need this for regular non-EMU organizations?](#do-i-need-this-for-regular-non-emu-organizations)
- [The copy exercise button suggests a repository name that is already taken. What should I do?](#the-copy-exercise-button-suggests-a-repository-name-that-is-already-taken-what-should-i-do)
- [Can exercises be created in the EMU user handle instead of an organization?](#can-exercises-be-created-in-the-emu-user-handle-instead-of-an-organization)

### Why is special configuration needed for EMU users to use GitHub Skills?

GitHub Skills exercises were designed to be taken in an individual's GitHub account where each user has full control over their settings.

Enterprise Managed User (EMU) accounts often do not have permissions to create repositories under their GitHub handles.

This guide helps you configure your organization with settings that will allow your employees to take the exercises within your organization.

### Can we use our existing EMU organization for Skills exercises?

While it is technically possible, we strongly recommend creating a dedicated "learning organization" for all GitHub Skills activities and other training purposes.

This approach isolates learning environments from production work which may differ in security policies and restrictions.

### Are enterprises using Data Residency (`ghe.com`) supported?

Enterprises using Data Residency on `ghe.com` are not supported due to critical limitations, including:

- GitHub Codespaces are unavailable.
- GitHub Actions differences on `ghe.com` prevent necessary workflows from running.

### What is the purpose of the actions allow list?

If you choose not to allow all actions in your learning organization, you must explicitly approve every action required to run the exercises.

The allow list specifies the minimum set of actions required for the exercises to function correctly. This list is updated periodically as new exercises are created or existing ones get updated.

### Why is GitHub Codespaces required ?

Many GitHub Skills exercises rely on GitHub Codespaces to provide a consistent, pre-configured development environment for learners.

### Why are GitHub Actions required?

GitHub Skills exercises use GitHub Actions for the automated learning experience. The user is guided through the exercise with automated feedback, validation and step by step instructions delivered via GitHub Actions workflows we created.

### How much will this cost?

There is no additional cost to use GitHub Skills other than the standard costs associated with GitHub Codespaces and GitHub Actions usage.

### Do I need this for regular non-EMU organizations?

No. If your users have standard GitHub accounts that they own, they can take GitHub Skills exercises without any special configuration, within their own accounts.

### The copy exercise button suggests a repository name that is already taken. What should I do?

Each exercise has a button to "Copy Exercise" which pre-fills the repository name based on the exercise title.

When creating an exercise within an organization, it is a good idea to add a unique identifier to the repository name, such as your name or initials.

For example, if the suggested repository name is `skills-getting-started-with-github-copilot`, you could change it to `skills-getting-started-with-github-copilot-johndoe` to ensure it is unique across the organization.

### Can exercises be created in the EMU user handle instead of an organization?

Since GitHub Codespaces are not available for EMU user accounts, exercises that depend on Codespaces should be created within an organization that has Codespaces enabled.
