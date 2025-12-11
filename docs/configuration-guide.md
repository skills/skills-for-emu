## Configuration Guide

Follow these steps to enable GitHub Skills in your Enterprise Managed User (EMU) environment.

### Step 1: Choose an Organization Strategy

Before you begin, decide whether to use a dedicated learning organization or an existing one.

- **Dedicated Learning Organization (Recommended)**: We strongly recommend creating a new organization exclusively for learning purposes. This isolates learning activities from production work and simplifies security management.
- **Existing Organization**: If creating a new organization is not feasible, you may use an existing one. However, be aware that the following configuration changes will apply to all members and repositories within that organization.

### Step 2: Configure the Organization

Once you have chosen an organization, apply the following settings.

#### 1. Codespaces

Enable Codespace access for organization members:

1. Navigate to `Organization Settings`.
2. Select `Codespaces`.
3. Under `General`, enable Codespaces for your members.

#### 2. Actions Policy

Configure Actions permissions at `Organization Settings` > `Actions` > `General`.

**Option 1 (Simple):**
Select `Allow all actions and reusable workflows`. This is the simplest approach and ensures compatibility as new exercises are developed.

**Option 2 (Select Actions):**
If your security policy requires a more restricted approach, select `Allow enterprise, and select non-enterprise, actions and reusable workflows`. You must then add all actions from the official allow list to your organization's settings.

The list of required actions is maintained in [actions-allowlist.txt](actions-allowlist.txt).
