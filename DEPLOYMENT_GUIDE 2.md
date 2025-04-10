# Deployment Guide: Python Scripts with Docker and GitHub Actions

This guide outlines the steps to deploy the Python scripts (`data.py`, `genAI.py`) using Docker and a GitHub Actions CI/CD pipeline to a Virtual Machine (VM).

## Prerequisites

1.  **VM Setup:**
    *   Ensure you have SSH access to your target VM.
    *   **Install Docker:** Follow the official Docker installation guide for your VM's operating system.
    *   **Install Ollama:** Install Ollama on the VM and ensure it's running. The scripts assume it's accessible at `http://localhost:11434` from within the VM.
    *   **SSH Key:** Generate an SSH key pair. Add the public key to the `~/.ssh/authorized_keys` file for the user you will use to connect from GitHub Actions.

2.  **GitHub Repository:**
    *   You need a GitHub repository containing the project code.
    *   You need permissions to configure repository settings (Secrets, Actions).

## Setup Steps

1.  **Configure GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
    *   Open the `.github/workflows/deploy.yml` file.
    *   **Replace Placeholders:**
        *   Find `VM_HOST` and replace it with the public IP address or DNS hostname of your VM.
        *   Find `VM_USERNAME` and replace it with the username you will use to SSH into the VM.

2.  **Configure GitHub Actions Secrets:**
    *   Navigate to your repository on GitHub.
    *   Go to `Settings` > `Secrets and variables` > `Actions`.
    *   Click `New repository secret` for each of the following:
        *   `GHCR_PAT`: Create a GitHub Personal Access Token (PAT) to authenticate with GitHub Container Registry (GHCR).
            1.  Navigate to your GitHub **Settings** (click your profile picture in the top-right corner).
            2.  In the left sidebar, scroll down and click **Developer settings**.
            3.  In the left sidebar, click **Personal access tokens**, then select **Tokens (classic)**.
            4.  Click **Generate new token** and select **Generate new token (classic)**.
            5.  Give your token a descriptive **Note** (e.g., "GHCR Access for BlueSky Repo").
            6.  Set an **Expiration** period (using an expiration date is recommended for security).
            7.  Under **Select scopes**, check the boxes for:
                *   `write:packages` (Allows uploading container images)
                *   `read:packages` (Allows downloading container images)
            8.  Click **Generate token** at the bottom.
            9.  **Important:** Copy the generated token immediately. You will **not** be able to see it again after leaving the page.
            10. Go back to your repository's `Settings` > `Secrets and variables` > `Actions` page and paste the copied token as the value for the `GHCR_PAT` secret.
        *   `VM_SSH_PRIVATE_KEY`: Copy the **entire contents** of your private SSH key file (the one corresponding to the public key added to the VM's `authorized_keys`) and paste it as the value for this secret. Make sure you copy the full key, including the `-----BEGIN ... KEY-----` and `-----END ... KEY-----` lines.
        *   `SUPABASE_URL`: Enter the URL for your Supabase project.
        *   `SUPABASE_KEY`: Enter your Supabase Service Role Key (recommended for server-side operations) or Anon Key.

3.  **Commit and Push Changes:**
    *   Ensure the following files are present and committed:
        *   `SeniorDesign-team8/requirements.txt`
        *   `SeniorDesign-team8/Dockerfile`
        *   `.github/workflows/deploy.yml` (with placeholders replaced)
    *   Commit these files to your local repository.
    *   Push the changes to the `main` branch on GitHub:
        ```bash
        git add .
        git commit -m "Add Dockerfile, requirements, and GitHub Actions workflow for deployment"
        git push origin main
        ```

## Running and Monitoring

1.  **Automatic Triggers:**
    *   The workflow will automatically run when you push changes to the `main` branch.
    *   It will also run automatically once per day based on the `cron` schedule (`0 0 * * *` UTC by default).

2.  **Manual Trigger:**
    *   You can manually trigger the workflow by navigating to the `Actions` tab in your GitHub repository, selecting the `Deploy Python Scripts to VM` workflow, and clicking `Run workflow`.

3.  **Monitoring:**
    *   Go to the `Actions` tab in your GitHub repository to see the status of workflow runs.
    *   Click on a specific run to view the logs for each step (Build, Push, Deploy).
    *   If the deployment step succeeds, the container should be running on your VM. You can verify by SSHing into the VM and running `docker ps`. Since the container uses `--rm`, it will disappear from `docker ps` once the scripts finish executing.
    *   Check the container logs on the VM if needed (though the `--rm` flag means logs might be lost after it exits). For persistent logs, you might remove `--rm` and manage container cleanup separately, or configure Docker logging drivers.

## Troubleshooting

*   **Workflow Errors:** Check the GitHub Actions logs for detailed error messages.
*   **Build Failures:** Often due to syntax errors in the `Dockerfile` or missing dependencies in `requirements.txt`.
*   **Login Failures (GHCR/SSH):** Double-check your PAT permissions (`GHCR_PAT`) and ensure the SSH private key (`VM_SSH_PRIVATE_KEY`) is correct and its corresponding public key is authorized on the VM.
*   **Deployment Failures:** Check the SSH step logs. Ensure Docker is running on the VM and the user (`VM_USERNAME`) has permissions to run Docker commands. Verify network connectivity to the VM.
*   **Container Errors:** If the container starts but the scripts fail, SSH into the VM and try running the container manually with `docker run --network host -it --rm --name bluesky-test -e SUPABASE_URL='...' -e SUPABASE_KEY='...' -e OLLAMA_URL='http://localhost:11434' ghcr.io/shraddha510/SeniorDesign-team8/bluesky-scripts:latest` (fill in secrets) to see the script output directly. 