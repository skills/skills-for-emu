> [!NOTE]
> This guide is optional and not required to complete your EMU setup. It is provided as a convenience to automate keeping your organization's Actions permissions in sync with the actions allow list.


## Automate Actions Permissions Updates with Terraform or OpenTofu

If your organization is using Terraform or OpenTofu for infrastructure management you can use the GitHub Terraform Provider to keep your EMU learning organization's GitHub Actions allow list in sync with the official list from this repository.

> Provider docs: https://registry.terraform.io/providers/integrations/github/latest/docs

### Configuration

Add the following to your Terraform/OpenTofu configuration. It reads the allow list from this repo and applies it at the organization level.

```hcl
# Read the allowlist from a file in the repository
data "github_repository_file" "allowlist" {
  repository = "skills/skills-for-emu"
  branch     = "main"
  file       = "actions-allowlist/simple.txt"
}

# Manage GitHub Actions permissions for the organization
resource "github_actions_organization_permissions" "this" {
  enabled_repositories = "all"
  allowed_actions      = "selected"

  allowed_actions_config {
    github_owned_allowed = true
    verified_allowed     = true

    patterns_allowed     = compact(split("\n", replace(trimspace(data.github_repository_file.allowlist.content), ",", "")))
  }
}
```

Each time your automation runs, it will detect changes in the allow list and update the organization's Actions permissions accordingly.

