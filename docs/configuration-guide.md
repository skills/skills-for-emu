- [How to configure an Organization for GitHub Skills usage](#how-to-configure-an-organization-for-github-skills-usage)
  - [Step 1: Choose an Organization](#step-1-choose-an-organization)
  - [Step 2: Configure the Organization](#step-2-configure-the-organization)
    - [GitHub Actions policy](#github-actions-policy)
    - [GitHub Codespaces Access](#github-codespaces-access)
    - [Repository creation privileges](#repository-creation-privileges)
  - [Step 3: Test your configuration](#step-3-test-your-configuration)

# How to configure an Organization for GitHub Skills usage

Follow these simple steps to enable GitHub Skills usage in your Enterprise Managed User (EMU) environment.

## Step 1: Choose an Organization

Before you begin, you must decide whether to use a dedicated learning organization or an existing one.

| Strategy | Recommendation | Recommended |
| :--- | :--- | :--- |
| **Dedicated Learning Organization** | Having a dedicated organization exclusively for learning purposes is recommended to isolate learning activities from production work with potentially different security policies and restrictions. | ✅ |
| **Existing Organization** | If creating a new organization is not feasible, you may use an existing one and update it's settings. | ❌ |

## Step 2: Configure the Organization

Once you have chosen an organization you need to configure several settings to allow GitHub Skills exercises to run correctly within that organization.

> [!IMPORTANT]
> Your ability to enable these features may be restricted if your organization is part of an Enterprise that already has policies in place.

### GitHub Actions policy

Most importantly we need to enable GitHub Actions in the organization in order for the GitHub Skills automation to run correctly.

1. Go to your `Organization Settings`
2. Under `Actions` select `General`
3. Under `Policies` select `All repositories` and choose one of the following options:


| Option | Notes |
| :--- | :--- |
| `Allow all actions and reusable workflows`. | This is the simplest approach and ensures maintenance free, continuous compatibility as GitHub Skills exercises get added or updated. |
| `Allow enterprise, and select non-enterprise, actions and reusable workflows`. | If you choose this option you will need to update your allow list as new exercises are released to ensure compatibility.<br><br>The allow lists of required actions and workflows are maintained [here](../actions-allowlist/). You can choose between a [simple list](../actions-allowlist/simple.txt) (using wildcards) or a [strict list](../actions-allowlist/strict.txt) (pinned versions).<br><br>To automate keeping your organization's Actions permissions in sync with your chosen list, see [Automated updates with Terraform or OpenTofu](automated-updates-with-tf.md). |


### GitHub Codespaces Access

Enable Codespace access for organization members.

1. Go to your `Organization Settings`.
2. Under `Codespaces` select `General`
3. Under `Codespaces Access`, enable Codespaces for your members. You can enable it for all members or specific teams as needed.


### Repository creation privileges

Your users will need the ability to create repositories within the organization to start GitHub Skills exercises.

1. Go to your `Organization Settings`.
2. Go to `Member Privileges` section
3. Under `Repository Creation` ensure that members are allowed to create repositories in the organization. 
   > Any visible option that allows members to create repositories is sufficient.


## Step 3: Test your configuration

Congratulations! You have successfully configured your organization for GitHub Skills usage :tada:

Now, test your setup by starting an exercise from the [GitHub Skills catalogue](https://learn.github.com/skills)

>[!TIP]
> If you encounter any issues, refer to the [FAQ](../faq.md) for troubleshooting tips and common questions. 
>
> If that doesn't help, please [open an issue](https://github.com/skills/skills-for-emu/issues/new)