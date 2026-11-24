# Arizona: ZIP to GitHub to a live website

You can do the publishing steps in your browser. Once connected, the website stays online without a running computer or terminal.

## 1. Extract the ZIP

Extract `Arizona-final.zip`. The project root is the folder containing `package.json`, `README.md`, `src`, `public` and `scripts`. Keep the scan images in `public/images`; they are included in this download, with their credits in `IMAGE_CREDITS.md`.

## 2. Create the GitHub repository

Sign in to GitHub, choose **New repository**, and name it `arizona` (or any name). Choose public or private, then create the repository. Avoid initializing a separate README if you are uploading this complete project.

Choose **uploading an existing file**, or **Add file → Upload files**. Upload the _contents_ of the extracted project folder, preserving `src/`, `public/` and `scripts/`. `package.json` must appear at the repository root, not inside another `Arizona` folder. Include `.gitignore` and `.env.example` if your file browser hides them. Commit the upload.

The ZIP excludes dependencies, compiled output, credentials and the original deployment identity. Never upload `.env.local`, `node_modules`, `.next`, `dist` or `out`.

## 3. Host it with Vercel

Sign in to Vercel with GitHub, choose **Add New → Project**, and import the repository you just created. If asked, grant access only to the repository you want to deploy.

Use these project settings:

| Setting                    | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| Framework preset           | Next.js                                                 |
| Root directory             | The folder containing `package.json` (normally `./`)    |
| Build command              | `npm run build`                                         |
| Output directory           | Leave the Next.js default; do not enter `out` or `dist` |
| Environment variable name  | `ARIZONA_HOST`                                          |
| Environment variable value | `vercel`                                                |

Apply that environment variable to Production and Preview. No API key is required for the current integrations. Click **Deploy**. Open the returned `.vercel.app` address; that is the public website. You can add your own domain later.

GitHub Pages alone cannot run this app's server-side source proxy. GitHub stores the code; Vercel runs the website and API routes.

## 4. Make changes later

For small changes, edit a file directly on GitHub and commit it. Vercel rebuilds and updates the connected production branch automatically. With the usual setup this is `main`; check your Vercel project if you select another production branch.

For larger changes, use GitHub Desktop and your editor, or a GitHub Codespace. A typical local developer session is:

```sh
npm ci
npm run dev
```

That terminal is for development only. Visitors continue using the hosted URL after your computer is switched off.

## Useful files

| Change                                                           | File                                 |
| ---------------------------------------------------------------- | ------------------------------------ |
| App name, default condition and default pink color               | `src/config/arizona.ts`              |
| Full-site color palette and contrast calculation                 | `src/lib/palette.ts`                 |
| Color picker, pink shortcut, coverage and appearance preferences | `src/components/Appearance.tsx`      |
| Layout and responsive styles                                     | `src/app/globals.css`                |
| Real scan sources, filenames, captions and licenses              | `src/config/imaging.ts`              |
| Comparison gallery and enlarged image dialog                     | `src/components/ScanComparisons.tsx` |
| Actual scan files                                                | `public/images/`                     |
| Individual public-source adapters                                | `src/lib/sources/`                   |

To reset a visitor's theme, use **Make it yours → Reset to bright pink**. Website settings are stored in the visitor's browser under `arizona-appearance-v2`. Changing the site's config does not overwrite an existing visitor's saved choice.

## If deployment fails

- Confirm that `package.json` is at the configured root.
- Confirm `ARIZONA_HOST=vercel`, with no extra spaces, then redeploy.
- Keep the default Next.js output directory.
- Check the Vercel build log and function logs for the specific error.
- A single public-source failure can be temporary or due to its rate limit; it should not prevent other sections from loading.

Official references: [Create a GitHub repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [upload files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Vercel Git deployments](https://vercel.com/docs/deployments/git), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
