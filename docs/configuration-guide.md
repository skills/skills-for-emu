## How to configure your Organization

Follow these simple steps to enable GitHub Skills usage in your Enterprise Managed User (EMU) environment.

- [How to configure your Organization](#how-to-configure-your-organization)
  - [Step 1: Choose an Organization](#step-1-choose-an-organization)
  - [Step 2: Configure the Organization](#step-2-configure-the-organization)
    - [1. Codespaces](#1-codespaces)
    - [2. Actions Policy](#2-actions-policy)
  - [Step 3: Test your configuration](#step-3-test-your-configuration)

### Step 1: Choose an Organization

Before you begin, decide whether to use a dedicated learning organization or an existing one.

| Strategy | Recommendation | Recommended |
| :--- | :--- | :--- |
| **Dedicated Learning Organization** | Having a dedicated organization exclusively for learning purposes is recommended to isolate learning activities from production work with potentially different security policies and restrictions. | ✅ |
| **Existing Organization** | If creating a new organization is not feasible, you may use an existing one and update it's settings. | ❌ |

### Step 2: Configure the Organization

Once you have chosen an organization, apply the following settings.

#### 1. Codespaces

Enable Codespace access for organization members:

1. Navigate to `Organization Settings`.
2. Select `Codespaces`.
3. Under `General`, enable Codespaces for your members.

#### 2. Actions Policy

Configure GitHub Actions permissions at `Organization Settings` > `Actions` > `General`.

| Option | Configuration | Notes |
| :--- | :--- | :--- |
| **Option 1 (Simple)** | Select `Allow all actions and reusable workflows`. | This is the simplest approach and ensures compatibility as new exercises are developed. |
| **Option 2 (Select Actions)** | Select `Allow enterprise, and select non-enterprise, actions and reusable workflows`. | If your security policy requires a more restricted approach, you must add all actions from the official allow list to your organization's settings. You will need to update your allow list as new exercises are released to ensure compatibility. |

If you choose option 2 - the allow list of required actions and workflows is maintained [here](../actions-allowlist/simple.txt). To automate keeping your organization's Actions permissions in sync with this list, see [Automated updates with Terraform or OpenTofu](automated-updates-with-tf.md).

### Step 3: Test your configuration

Test your setup by starting an exercise from [learn.github.com/skills](https://learn.github.com/skills). Remember to create the repository in your learning organization.
