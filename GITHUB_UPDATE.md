# Update GitHub

After making website changes, open the project terminal and run:

```bash
bash scripts/update-github.sh "Describe your changes"
```

For example:

```bash
bash scripts/update-github.sh "Add new product categories"
```

The script saves the changes and pushes them to the private repository. It stops if it finds an untracked file that looks like a password, token, private key, or environment file.
